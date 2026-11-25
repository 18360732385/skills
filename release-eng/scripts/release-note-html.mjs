#!/usr/bin/env node
/**
 * release-note-html — 发版单 md → 同目录同名 .html 只读渲染（工单样式）
 *
 * Usage:
 *   node release-note-html.mjs --root <REPO> --note <path> [--out <file>] [--dry-run] [--stdout]
 *
 * 约定（modes/conventions.md ⑩）：
 *   - 发版单 md 是 SSOT；.html 为生成物，勿手改；note-merge 定版 / seal --apply 后自动重建
 *   - 勾选 / 折叠为会话级阅读辅助，不入档
 *   - 自包含单文件（内嵌 CSS / 少量原生 JS），无第三方依赖，离线可读可打印
 * Exit 0=ok 1=error
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stripBom, normalizeNoteStatus, nowChinaTime } from "./release-format.mjs";
import { readSkillVersion } from "./lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------------- 基础工具 ---------------- */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readSkillVersionSafe() {
  try {
    return readSkillVersion(path.resolve(__dirname, ".."));
  } catch {
    return "";
  }
}

/* ---------------- md 解析（面向发版单 10 章结构）---------------- */

const CHAPTER_KEY_MATCHERS = [
  ["meta", "元信息"],
  ["git", "Git 定版"],
  ["services", "涉及服务与模块"],
  ["sql", "数据库与 SQL"],
  ["config", "配置项"],
  ["jobs", "定时任务"],
  ["bundle", "包内附属文件"],
  ["third", "第三方与外部依赖"],
  ["steps", "上线步骤与回滚"],
  ["risk", "风险与验收"],
];

function chapterKeyOf(title) {
  const t = String(title || "");
  for (const [key, name] of CHAPTER_KEY_MATCHERS) {
    if (t.includes(name)) return key;
  }
  return "other";
}

const SHORT_CHAPTER_NAMES = {
  meta: "元信息",
  git: "Git 定版",
  services: "服务模块",
  sql: "SQL",
  config: "配置项",
  jobs: "定时任务",
  bundle: "附属文件",
  third: "第三方",
  steps: "步骤回滚",
  risk: "风险验收",
  other: "其它",
};

export function parseNoteMd(md) {
  const lines = String(md ?? "").split(/\r?\n/);
  const model = { title: "", identity: "", headerMeta: {}, metaTable: null, chapters: [] };

  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i < lines.length && /^#\s+/.test(lines[i])) {
    model.title = lines[i].replace(/^#\s+/, "").trim();
    model.identity = model.title.replace(/^发版单[：:]\s*/, "").trim();
    i++;
  }

  while (i < lines.length && !/^##\s/.test(lines[i])) {
    const m = lines[i].match(
      /^>\s*(状态|发版日期|发版分支|基线分支|定版引用|定版时间|负责人|上线日期|上线执行人)[：:]\s*(.*)$/
    );
    if (m) {
      if (m[1] === "发版分支" && /·\s*基线分支[：:]/.test(m[2])) {
        // 骨架把「发版分支 · 基线分支」写在一行
        const parts = m[2].split(/·\s*基线分支[：:]/);
        model.headerMeta["发版分支"] = parts[0].trim();
        model.headerMeta["基线分支"] = parts[1].trim();
      } else {
        model.headerMeta[m[1]] = m[2].trim();
      }
    }
    i++;
  }

  let cur = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    const hm = l.match(/^##\s+(?:([一二三四五六七八九十百]+)、)?\s*(.+)$/);
    if (hm) {
      cur = {
        numeral: hm[1] || "",
        title: hm[2].trim(),
        key: chapterKeyOf(hm[2].trim()),
        lines: [],
      };
      model.chapters.push(cur);
    } else if (cur) {
      cur.lines.push(l);
    }
  }

  for (const ch of model.chapters) {
    ch.blocks = parseBlocks(ch.lines);
    ch.flags = collectFlags(ch.blocks);
    if (ch.key === "meta") {
      const tbl = ch.blocks.find(
        (b) => b.type === "table" && b.header && b.header[0] === "项"
      );
      if (tbl) {
        model.metaTable = tbl;
        ch.blocks = ch.blocks.filter((b) => b !== tbl);
      }
    }
  }
  return model;
}

function collectFlags(blocks) {
  const flags = { auto: false, manual: false };
  for (const b of blocks) {
    if (b.type !== "flag") continue;
    if (/^auto[:：]/i.test(b.flag)) flags.auto = true;
    if (/^manual[:：]/i.test(b.flag)) flags.manual = true;
  }
  return flags;
}

function matchListItem(l) {
  let m = l.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (m) return { text: m[2], task: true, checked: m[1] !== " ", ordered: false };
  m = l.match(/^[-*]\s+(.*)$/);
  if (m) return { text: m[1], task: false, checked: false, ordered: false };
  m = l.match(/^(\d+)[.、]\s+(.*)$/);
  if (m) return { text: m[2], task: false, checked: false, ordered: true, num: m[1] };
  return null;
}

export function parseBlocks(lines) {
  const blocks = [];
  let para = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join("\n") });
      para = [];
    }
  };

  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    if (!l.trim()) {
      flushPara();
      continue;
    }
    const fence = l.match(/^\s*```\s*(\S*)\s*$/);
    if (fence) {
      flushPara();
      const lang = fence[1] || "";
      const buf = [];
      k++;
      while (k < lines.length && !/^\s*```/.test(lines[k])) {
        buf.push(lines[k]);
        k++;
      }
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }
    if (/^<!--/.test(l.trim())) {
      flushPara();
      const m = l.trim().match(/^<!--\s*(.+?)\s*-->$/);
      if (m) blocks.push({ type: "flag", flag: m[1] });
      continue;
    }
    const h4 = l.match(/^####\s+(.+)$/);
    if (h4) {
      flushPara();
      blocks.push({ type: "h4", text: h4[1].trim() });
      continue;
    }
    const h3 = l.match(/^###\s+(.+)$/);
    if (h3) {
      flushPara();
      blocks.push({ type: "h3", text: h3[1].trim() });
      continue;
    }
    if (/^\|/.test(l)) {
      flushPara();
      const buf = [];
      while (k < lines.length && /^\s*\|/.test(lines[k])) {
        buf.push(lines[k]);
        k++;
      }
      k--;
      blocks.push(parseTable(buf));
      continue;
    }
    if (/^>/.test(l)) {
      flushPara();
      const buf = [];
      while (k < lines.length && /^>/.test(lines[k])) {
        buf.push(lines[k].replace(/^>\s?/, ""));
        k++;
      }
      k--;
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(l.trim())) {
      flushPara();
      blocks.push({ type: "hr" });
      continue;
    }
    if (matchListItem(l)) {
      flushPara();
      const items = [];
      while (k < lines.length) {
        const it = matchListItem(lines[k]);
        if (!it) break;
        items.push(it);
        k++;
      }
      k--;
      blocks.push({ type: "list", items });
      continue;
    }
    para.push(l);
  }
  flushPara();
  return blocks;
}

function splitRow(line) {
  let s = String(line).trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells = [];
  let cur = "";
  for (let idx = 0; idx < s.length; idx++) {
    const ch = s[idx];
    if (ch === "\\" && s[idx + 1] === "|") {
      cur += "|";
      idx++;
      continue;
    }
    if (ch === "|") {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function parseTable(buf) {
  const rows = buf.map(splitRow);
  let header = null;
  let start = 0;
  if (
    rows.length >= 2 &&
    rows[1].every((c) => /^:?-{2,}:?$/.test(c) || c === "")
  ) {
    header = rows[0];
    start = 2;
  }
  return { type: "table", header, rows: rows.slice(start) };
}

/* ---------------- 行内渲染 ---------------- */

export function inlineMd(src) {
  let out = esc(src);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(c);
    return `\x00${codes.length - 1}\x00`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) => {
    const isMdLink = /\.md(\s|$)/.test(u);
    return `<a href="${u}"${isMdLink ? ' class="mdref"' : ""}>${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(
    /(^|[\s>（(【[])(https?:\/\/[^\s<>()（）【\]]+)/g,
    (_m, pre, url) => `${pre}<a href="${url}">${url}</a>`
  );
  out = out.replace(
    /&lt;(gitlabUrl|slug|headRef)&gt;/g,
    '<span class="ph">远端链接（定版时生成）</span>'
  );
  out = out.replace(/\x00(\d+)\x00/g, (_m, idx) => `<code>${codes[idx]}</code>`);
  return out;
}

/* ---------------- YAML 高亮 ---------------- */

function yamlLineHtml(raw) {
  if (/^\s*#/.test(raw)) {
    return `<span class="c-com">${esc(raw)}</span>`;
  }
  const m = raw.match(/^(\s*)([^:]+)(:)(.*)$/);
  if (m) {
    const [, ind, key, colon, rest] = m;
    let restHtml;
    const trimmed = rest.trim();
    if (/^#/.test(trimmed)) {
      restHtml = `<span class="c-com">${esc(rest)}</span>`;
    } else {
      const hashIdx = rest.indexOf(" #");
      if (hashIdx >= 0) {
        restHtml =
          esc(rest.slice(0, hashIdx)) +
          `<span class="c-com">${esc(rest.slice(hashIdx))}</span>`;
      } else {
        restHtml = esc(rest);
      }
      if (/TODO_[^\s]*|（待补）|待补/.test(trimmed)) {
        restHtml = `<span class="c-todo">${restHtml}</span>`;
      }
    }
    return `${ind}<span class="c-key">${esc(key)}</span>${colon}${restHtml}`;
  }
  return esc(raw);
}

function yamlCountLeafKeys(text) {
  let n = 0;
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*[^#\s][^:]*:\s*\S/);
    if (m) n++;
  }
  return n;
}

/* ---------------- 概览数据（核对条）---------------- */

function collectFacts(model) {
  const byKey = {};
  for (const ch of model.chapters) if (!byKey[ch.key]) byKey[ch.key] = ch;

  const facts = { commits: 0, omitted: 0, merges: 0, sql: 0, configKeys: 0, jobs: 0, services: 0 };

  const git = byKey.git;
  if (git) {
    for (const b of git.blocks) {
      if (b.type !== "table" || !b.header) continue;
      const head = b.header.join("|");
      if (/hash/.test(head)) {
        for (const r of b.rows) {
          const first = String(r[0] ?? "");
          if (first === "…") {
            const m = r.find((c) => /省略\s*\d+\s*条/.test(String(c)));
            if (m) facts.omitted = Number(m.match(/省略\s*(\d+)\s*条/)[1]) || 0;
          } else if (first && first !== "—") {
            facts.commits++;
          }
        }
      } else if (/推测来源分支/.test(head)) {
        for (const r of b.rows) {
          if (String(r[0] ?? "") && String(r[0]) !== "—") facts.merges++;
        }
      }
    }
  }

  const svc = byKey.services;
  if (svc) {
    for (const b of svc.blocks) {
      if (b.type !== "table" || !b.header) continue;
      if (!/是否涉及/.test(b.header.join("|"))) continue;
      for (const r of b.rows) {
        if (String(r[1] ?? "").trim() === "是") facts.services++;
      }
    }
  }

  const sqlCh = byKey.sql;
  if (sqlCh) {
    const text = sqlCh.blocks
      .filter((b) => b.type === "p")
      .map((b) => b.text)
      .join("\n");
    const m = text.match(/本版 SQL：\*\*(\d+)\*\*/);
    if (m) facts.sql = Number(m[1]) || 0;
  }

  const cfg = byKey.config;
  if (cfg) {
    for (const b of cfg.blocks) {
      if (b.type === "code" && /^ya?ml$/i.test(b.lang)) {
        facts.configKeys += yamlCountLeafKeys(b.text);
      }
    }
  }

  const jobsCh = byKey.jobs;
  if (jobsCh) {
    const text = jobsCh.blocks
      .filter((b) => b.type === "p")
      .map((b) => b.text)
      .join("\n");
    const m = text.match(/本版定时任务：\*\*(\d+)\*\*/);
    if (m) facts.jobs = Number(m[1]) || 0;
  }

  return facts;
}

/* ---------------- 表格 / 块渲染 ---------------- */

function columnClass(headerCell) {
  const h = String(headerCell ?? "");
  if (/hash|cron|taskCode|task_code|配置键|cron 键/i.test(h)) return "mono";
  if (/次数/.test(h)) return "num";
  if (/^date$/.test(h)) return "mono";
  return "";
}

function tableHtml(tbl) {
  const header = tbl.header || [];
  const headJoin = header.join("|");
  const isCommits = /hash/.test(headJoin);
  const isServices = /是否涉及/.test(headJoin);
  const isTodo = /键/.test(headJoin) && /值/.test(headJoin) && /来源/.test(headJoin);
  const isGaps = /taskCode/i.test(headJoin);

  const cls = ["tablewrap"];
  if (isTodo || isGaps) cls.push("tablewrap--warn");
  const colCls = header.map(columnClass);

  const thead = header.length
    ? `<thead><tr>${header
        .map((h) => `<th scope="col">${inlineMd(h)}</th>`)
        .join("")}</tr></thead>`
    : "";

  const bodyRows = tbl.rows
    .map((r) => {
      const isOmit = String(r[0] ?? "") === "…";
      const cells = r
        .map((c, idx) => {
          let inner = inlineMd(c);
          if (isServices && idx === 1) {
            if (String(c).trim() === "是") inner = '<span class="hit">是</span>';
            else if (String(c).trim() === "否") inner = '<span class="miss">否</span>';
          }
          const cc = colCls[idx] ? ` class="${colCls[idx]}"` : "";
          return `<td${cc}>${inner}</td>`;
        })
        .join("");
      return `<tr${isOmit ? ' class="tr-omit"' : ""}>${cells}</tr>`;
    })
    .join("");

  return `<div class="${cls.join(" ")}"><table>${thead}<tbody>${bodyRows}</tbody></table></div>`;
}

function metaFormHtml(tbl) {
  const rows = tbl.rows
    .filter((r) => r[0])
    .map((r) => {
      const label = String(r[0]).trim();
      const value = r.slice(1).join(" | ").trim();
      const isPh = /（.*seal.*）|（待.*）|^\（[^）]*\）$/.test(value);
      return `<div class="form-cell"><span class="form-l">${esc(
        label
      )}</span><span class="form-v${isPh ? " form-v--ph" : ""}">${inlineMd(
        value
      )}</span></div>`;
    })
    .join("");
  return `<dl class="form-grid">${rows}</dl>`;
}

function quoteHtml(text) {
  if (/完整记录请登录/.test(text)) {
    return `<aside class="remote">${inlineMd(text).replace(/\n/g, "<br>")}</aside>`;
  }
  const warn =
    /必办|交叉|警示|警告|上线前|逾期/.test(text) || /^\*\*/.test(text.trim());
  return `<aside class="note${warn ? " note--warn" : ""}">${inlineMd(text).replace(
    /\n/g,
    "<br>"
  )}</aside>`;
}

function codeHtml(block, prevH4, chapterKey) {
  const isYaml = /^ya?ml$/i.test(block.lang || "");
  const lines = block.text.split("\n");
  if (isYaml) {
    const body = lines.map(yamlLineHtml).join("\n");
    const pathLabel = prevH4 && /[\w\/-]+\.(ya?ml|sql|properties|json)/.test(prevH4.text) ? prevH4.text : "";
    const big = lines.length > 20;
    if (pathLabel) {
      return `<details class="yamlbox"${big ? "" : " open"}><summary><code>${esc(
        pathLabel
      )}</code><span class="yaml-n">${lines.length} 行${big ? " · 点击展开" : ""}</span></summary><pre class="code yaml">${body}</pre></details>`;
    }
    return `<pre class="code yaml">${body}</pre>`;
  }
  const cls = ["code"];
  if (chapterKey === "steps") cls.push("code--cmd");
  return `<pre class="${cls.join(" ")}">${esc(block.text)}</pre>`;
}

function listHtml(block, chapterKey) {
  const anyTask = block.items.some((it) => it.task);
  const anyOrdered = block.items.some((it) => it.ordered);
  const useSteps = chapterKey === "steps" && anyOrdered;
  if (useSteps) {
    const items = block.items
      .map(
        (it) =>
          `<li>${tickHtml()}<span class="step-text">${inlineMd(it.text)}</span></li>`
      )
      .join("");
    return `<ol class="steps">${items}</ol>`;
  }
  if (anyTask) {
    const items = block.items
      .map(
        (it) =>
          `<li${it.checked ? ' class="checked"' : ""}>${tickHtml(
            it.checked
          )}<span class="check-text">${inlineMd(it.text)}</span></li>`
      )
      .join("");
    return `<ul class="checks">${items}</ul>`;
  }
  const items = block.items.map((it) => `<li>${inlineMd(it.text)}</li>`).join("");
  return `<ul class="plainlist">${items}</ul>`;
}

function tickHtml(checked = false) {
  return `<span class="tickbox" role="checkbox" aria-checked="${
    checked ? "true" : "false"
  }" tabindex="0" data-tick></span>`;
}

function h3Html(text) {
  const m = text.match(/^(\d+)[、.]\s*(.*)$/);
  if (m) {
    return `<h3 class="sub"><span class="sub-no">${esc(
      m[1]
    )}</span>${inlineMd(m[2])}</h3>`;
  }
  if (/上线内容摘要/.test(text)) {
    return `<h3 class="sub summary-h">${inlineMd(
      text.replace(/（1～5 项）/, "").trim()
    )}</h3>`;
  }
  return `<h3 class="sub">${inlineMd(text)}</h3>`;
}

function chapterBlocksHtml(ch) {
  const out = [];
  for (let bi = 0; bi < ch.blocks.length; bi++) {
    const b = ch.blocks[bi];
    if (b.type === "h4") {
      const next = ch.blocks[bi + 1];
      const paired =
        next &&
        next.type === "code" &&
        /^ya?ml$/i.test(next.lang || "") &&
        /[\w\/-]+\.(ya?ml|sql|properties|json)/.test(b.text);
      if (paired) {
        next.__prevH4 = b;
      } else {
        out.push(`<h4 class="file-h"><code>${esc(b.text)}</code></h4>`);
      }
      continue;
    }
    switch (b.type) {
      case "h3":
        out.push(h3Html(b.text));
        break;
      case "p": {
        const emptyish = /^(本版无|暂无|无$|（本版做什么）)/.test(b.text.trim());
        out.push(`<p class="${emptyish ? "empty" : "body"}">${inlineMd(b.text)}</p>`);
        break;
      }
      case "quote":
        out.push(quoteHtml(b.text));
        break;
      case "table":
        if (ch.key === "meta") out.push(metaFormHtml(b));
        else out.push(tableHtml(b));
        break;
      case "code":
        out.push(codeHtml(b, b.__prevH4 || null, ch.key));
        break;
      case "list": {
        const summaryList = ch.key === "meta";
        if (summaryList) {
          out.push(
            `<ul class="summary-lines">${b.items
              .map((it) => `<li>${inlineMd(it.text)}</li>`)
              .join("")}</ul>`
          );
        } else {
          out.push(listHtml(b, ch.key));
        }
        break;
      }
      case "hr":
        out.push('<hr class="hairline">');
        break;
      default:
        break;
    }
  }
  return out.join("\n");
}

/* ---------------- 页面骨架渲染 ---------------- */

function statusInfo(model) {
  const raw =
    (model.headerMeta && model.headerMeta["状态"]) ||
    metaRowValue(model.metaTable, "状态") ||
    "";
  const normalized = normalizeNoteStatus(raw);
  return { raw, normalized };
}

function metaRowValue(tbl, label) {
  if (!tbl) return null;
  for (const r of tbl.rows) {
    if (String(r[0] ?? "").trim() === label) {
      return r.slice(1).join(" | ").trim();
    }
  }
  return null;
}

function stampHtml(status) {
  if (status === "已上线") {
    return `<span class="stamp s-online" aria-hidden="true">已上线</span>`;
  }
  if (status === "已定版") {
    return `<span class="stamp s-frozen" aria-hidden="true">已定版</span>`;
  }
  if (status === "已取消") {
    return `<span class="stamp s-cancel" aria-hidden="true">已取消</span>`;
  }
  const label = status || "准备中";
  return `<span class="draft-chip" aria-hidden="true">${esc(label)}</span>`;
}

function headMetaRows(model) {
  const prefer = ["发版日期", "发版分支", "基线分支", "定版引用", "定版时间", "负责人"];
  const used = new Set(["状态", "版本身份", "上线日期", "上线执行人"]);
  const out = [];
  const seen = new Set();
  if (model.metaTable) {
    for (const r of model.metaTable.rows) {
      const label = String(r[0] ?? "").trim();
      if (!label || used.has(label) || seen.has(label)) continue;
      seen.add(label);
      out.push({ label, value: r.slice(1).join(" | ").trim() });
    }
  }
  for (const k of prefer) {
    if (seen.has(k)) continue;
    const v = model.headerMeta[k];
    if (v != null && v !== "") {
      seen.add(k);
      out.push({ label: k, value: v });
    }
  }
  return out;
}

function factsHtml(facts) {
  const cells = [
    { v: facts.commits, extra: facts.omitted ? `省略${facts.omitted}` : "", l: "提交" },
    { v: facts.merges, l: "合并来源" },
    { v: facts.sql, l: "SQL" },
    { v: facts.configKeys, l: "配置键" },
    { v: facts.jobs, l: "定时任务" },
    { v: facts.services, l: "涉及服务" },
  ];
  const items = cells
    .map((c) => {
      const val = c.v == null || c.v === "" ? "—" : String(c.v);
      return `<div class="fact"><span class="fact-v">${esc(
        val
      )}</span><span class="fact-l">${esc(c.l)}${
        c.extra ? `<span class="fact-extra">（${esc(c.extra)}）</span>` : ""
      }</span></div>`;
    })
    .join("");
  return `<section class="facts" aria-label="本版核对条">${items}</section>`;
}

function signatureHtml(model) {
  const owner = model.headerMeta["负责人"] || metaRowValue(model.metaTable, "负责人") || "";
  const executor = metaRowValue(model.metaTable, "上线执行人") || "";
  const onlineDate = metaRowValue(model.metaTable, "上线日期") || "";
  const cells = [
    { l: "负责人", v: owner },
    { l: "上线执行人", v: executor },
    { l: "上线日期", v: onlineDate },
  ];
  return `<section class="sign" aria-label="签字栏">${cells
    .map(
      (c) =>
        `<div class="sig"><span class="sig-l">${esc(c.l)}</span><span class="sig-v${
          c.v ? "" : " sig-v--blank"
        }">${inlineMd(c.v)}</span></div>`
    )
    .join("")}</section>`;
}

function chromeHtml(model, status, chapters) {
  const links = chapters
    .map(
      (ch, idx) =>
        `<a href="#ch-${idx + 1}" data-toc-link><span class="toc-no">${esc(
          ch.numeral || String(idx + 1)
        )}</span><span class="toc-label">${esc(
          SHORT_CHAPTER_NAMES[ch.key] || "其它"
        )}</span></a>`
    )
    .join("");
  const statusCls =
    status === "已上线"
      ? "st-online"
      : status === "已定版"
        ? "st-frozen"
        : status === "已取消"
          ? "st-cancel"
          : "st-draft";
  return `<aside class="toc" data-toc aria-label="目录">
<button type="button" class="toc-toggle" data-toc-toggle aria-expanded="true" title="折叠/展开目录">目录</button>
<div class="toc-panel" data-toc-panel>
<div class="toc-head">
<span class="toc-id">${esc(model.identity || "发版单")}</span>
<span class="toc-status ${statusCls}">${esc(status || "准备中")}</span>
</div>
<nav class="toc-nav">${links}</nav>
</div>
</aside>
<button type="button" class="print-fab" data-print title="打印发版单">打印</button>`;
}

/* ---------------- CSS / JS ---------------- */

const CSS = `
:root {
  --desk: #E9EAE4;
  --grid: rgba(47, 82, 122, 0.05);
  --paper: #FDFDFB;
  --ink: #22282D;
  --ink-2: #59616B;
  --ink-3: #878E96;
  --hairline: #E0E4E1;
  --rule: #C6CCC9;
  --blue: #2E5C8F;
  --blue-soft: rgba(46, 92, 143, 0.08);
  --seal: #BE3A2B;
  --seal-soft: rgba(190, 58, 43, 0.07);
  --amber: #8A6D1F;
  --amber-soft: rgba(138, 109, 31, 0.07);
  --ok: #2F7D53;
  --code-bg: #F5F6F3;
  --serif: "Source Han Serif SC", "Noto Serif SC", "思源宋体", "STZhongsong", "SimSun", serif;
  --sans: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif;
  --mono: "Cascadia Code", ui-monospace, "Sarasa Mono SC", Consolas, "Courier New", monospace;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  padding: 26px 24px 60px;
  padding-left: calc(var(--toc-w) + 36px);
  background-color: var(--desk);
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 24px 24px;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.78;
  --toc-w: 196px;
  transition: padding-left 0.18s ease;
}
body.toc-collapsed { --toc-w: 44px; }
a { color: var(--blue); text-decoration: none; border-bottom: 1px dotted var(--blue); }
a:hover { border-bottom-style: solid; }
a.mdref { font-family: var(--mono); font-size: 0.92em; }
code {
  font-family: var(--mono);
  font-size: 0.9em;
  background: var(--code-bg);
  border: 1px solid var(--hairline);
  border-radius: 2px;
  padding: 0 4px;
}
strong { font-weight: 700; }
:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
html { scroll-behavior: smooth; scroll-padding-top: 18px; }

/* 左侧目录（默认可折叠，默认展开） */
.toc {
  position: fixed;
  left: 12px;
  top: 12px;
  bottom: 12px;
  width: var(--toc-w);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: width 0.18s ease;
}
.toc-toggle {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  align-self: stretch;
  padding: 8px 10px;
  background: rgba(253, 253, 251, 0.96);
  border: 1px solid var(--hairline);
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}
.toc-toggle::before {
  content: "◀ ";
  font-size: 10px;
  color: var(--ink-3);
}
body.toc-collapsed .toc-toggle::before { content: "▶ "; }
.toc-toggle:hover { border-color: var(--ink); }
.toc-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: rgba(253, 253, 251, 0.96);
  border: 1px solid var(--hairline);
  padding: 12px 10px 14px;
}
body.toc-collapsed .toc-panel { display: none; }
.toc-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px 10px;
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 8px;
}
.toc-id { font-family: var(--mono); font-size: 11.5px; font-weight: 600; word-break: break-all; }
.toc-status {
  align-self: flex-start;
  padding: 1px 8px;
  border: 1px solid currentColor;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 600;
}
.st-online { color: var(--seal); }
.st-frozen { color: var(--blue); }
.st-cancel { color: var(--ink-3); text-decoration: line-through; }
.st-draft { color: var(--amber); border-style: dashed !important; }
.toc-nav { display: flex; flex-direction: column; gap: 2px; }
.toc-nav a {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px;
  color: var(--ink-2);
  border: none;
  border-left: 2px solid transparent;
  border-radius: 0;
  font-size: 12.5px;
  line-height: 1.35;
}
.toc-nav a:hover { color: var(--ink); background: var(--blue-soft); }
.toc-nav a.is-active {
  color: var(--ink);
  border-left-color: var(--blue);
  background: var(--blue-soft);
  font-weight: 600;
}
.toc-no { font-family: var(--serif); color: var(--ink-3); min-width: 1.1em; }
.toc-nav a.is-active .toc-no { color: var(--blue); }
.toc-label { flex: 1; }

/* 右上角打印 */
.print-fab {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 40;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 8px 16px;
  background: rgba(253, 253, 251, 0.96);
  border: 1px solid var(--rule);
  color: var(--ink);
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(34, 40, 45, 0.04);
}
.print-fab:hover { border-color: var(--ink); }

/* 工单纸 */
.sheet {
  max-width: 940px;
  margin: 0 auto;
  background: var(--paper);
  border: 1px solid rgba(34, 40, 45, 0.14);
  box-shadow: 0 1px 0 rgba(34, 40, 45, 0.04), 0 14px 34px rgba(31, 41, 51, 0.1);
  padding: 44px 52px 40px;
}

/* 抬头 */
.doc-head { position: relative; border-bottom: 3px double var(--ink); padding-bottom: 18px; }
.doc-no {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.doc-no b { color: var(--ink); font-weight: 600; }
.doc-title {
  font-family: var(--serif);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 2px 0 0;
  line-height: 1.25;
}
.doc-sub { margin-top: 4px; color: var(--ink-2); font-size: 13px; }
.doc-sub code { background: none; border: none; padding: 0; }
.stamp-zone {
  position: absolute;
  right: 0;
  top: 22px;
  text-align: center;
}
.stamp {
  display: inline-block;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 0.32em;
  padding: 8px 10px 8px 16px;
  color: var(--seal);
  border: 2px solid currentColor;
  outline: 1.5px solid currentColor;
  outline-offset: 3px;
  border-radius: 2px;
  transform: rotate(-8deg);
  opacity: 0.92;
  user-select: none;
}
.s-frozen { color: var(--blue); }
.s-cancel { color: var(--ink-3); position: relative; }
.s-cancel::after {
  content: "";
  position: absolute;
  left: -10px;
  right: -4px;
  top: 50%;
  height: 2px;
  background: currentColor;
  transform: rotate(-6deg);
}
.draft-chip {
  display: inline-block;
  font-size: 14px;
  letter-spacing: 0.24em;
  padding: 5px 12px 5px 16px;
  color: var(--amber);
  border: 1.5px dashed currentColor;
  border-radius: 2px;
  user-select: none;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 16px 0 0;
  border: 1px solid var(--rule);
  border-right: none;
  border-bottom: none;
}
.form-cell {
  padding: 8px 14px;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.form-l { font-size: 11.5px; color: var(--ink-2); letter-spacing: 0.06em; }
.form-v { font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.form-v--ph { color: var(--ink-3); font-weight: 400; }

/* 核对条 */
.facts {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin: 18px 0 6px;
  border: 1px solid var(--rule);
}
.fact {
  padding: 10px 14px 8px;
  border-right: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.fact:last-child { border-right: none; }
.fact-v {
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
.fact-l { font-size: 11.5px; color: var(--ink-2); }
.fact-extra { color: var(--amber); }

/* 章节 */
.chapter { margin-top: 34px; }
.ch-head {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 8px;
}
.ch-no {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 700;
  flex: none;
}
.ch-no::after { content: "、"; font-weight: 700; }
.ch-head h2 {
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0;
}
.ch-flag {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
  border: 1px solid var(--hairline);
  padding: 1px 8px;
  border-radius: 2px;
  letter-spacing: 0.08em;
}
h3.sub {
  font-size: 15px;
  font-weight: 700;
  margin: 22px 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sub-no {
  font-family: var(--serif);
  width: 22px;
  height: 22px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rule);
  border-radius: 50%;
  font-size: 12.5px;
  color: var(--ink-2);
}
.summary-h { font-family: var(--serif); font-size: 17px; letter-spacing: 0.03em; }
.summary-lines {
  list-style: none;
  margin: 10px 0 4px;
  padding: 0;
  counter-reset: sum;
}
.summary-lines li {
  font-family: var(--serif);
  font-size: 16.5px;
  line-height: 1.9;
  padding-left: 44px;
  position: relative;
  counter-increment: sum;
}
.summary-lines li::before {
  content: counter(sum, cjk-ideographic);
  position: absolute;
  left: 14px;
  top: 2px;
  color: var(--blue);
  font-weight: 700;
}
p.body { margin: 10px 0; }
p.empty { margin: 10px 0; color: var(--ink-3); }
.ph {
  color: var(--ink-3);
  border: 1px dashed var(--hairline);
  padding: 0 6px;
  font-size: 0.9em;
}
.hairline { border: none; border-top: 1px solid var(--hairline); }
h4.file-h { margin: 14px 0 6px; font-size: 12.5px; color: var(--ink-2); }
h4.file-h code { background: none; border: none; padding: 0; }

/* 引注 / 提示 */
.note {
  font-size: 12.5px;
  color: var(--ink-2);
  border-left: 2px solid var(--rule);
  padding: 4px 12px;
  margin: 12px 0;
}
.note--warn {
  color: var(--amber);
  border-left-color: var(--amber);
  background: var(--amber-soft);
  padding: 10px 12px;
}
.remote {
  font-size: 12.5px;
  margin: 12px 0;
  padding: 8px 12px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--blue);
  background: var(--blue-soft);
}
.remote a { font-family: var(--mono); font-size: 0.92em; border-bottom-style: solid; }

/* 表格 */
.tablewrap { overflow-x: auto; margin: 12px 0; }
.tablewrap--warn { border: 1px solid rgba(138, 109, 31, 0.35); background: var(--amber-soft); padding: 2px; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
thead th {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  text-align: left;
  padding: 7px 10px 6px;
  border-bottom: 3px double var(--ink);
  white-space: nowrap;
}
tbody td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--hairline);
  vertical-align: top;
}
tbody tr:hover { background: rgba(46, 92, 143, 0.045); }
td.mono, .tablewrap code { font-family: var(--mono); font-size: 12.5px; }
td.num { font-family: var(--mono); text-align: right; }
.tr-omit td { color: var(--ink-3); border-bottom: 1px dashed var(--hairline); }
.hit { color: var(--ok); font-weight: 700; }
.miss { color: var(--ink-3); }

/* 代码 */
.code {
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.7;
  background: var(--code-bg);
  border: 1px solid var(--hairline);
  padding: 12px 14px;
  overflow-x: auto;
  margin: 10px 0;
}
.yamlbox { margin: 12px 0; border: 1px solid var(--hairline); background: var(--code-bg); }
.yamlbox summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--ink-2);
  border-bottom: 1px solid var(--hairline);
}
.yamlbox summary::-webkit-details-marker { display: none; }
.yamlbox summary:hover { color: var(--ink); }
.yamlbox summary code { background: none; border: none; padding: 0; color: var(--ink); }
.yaml-n { margin-left: auto; color: var(--ink-3); font-size: 11.5px; }
.yamlbox .code { border: none; margin: 0; }
.c-key { color: var(--blue); }
.c-com { color: var(--ok); opacity: 0.85; }
.c-todo { color: var(--seal); font-weight: 600; }

/* 勾选 / 步骤 */
.tickbox {
  flex: none;
  width: 17px;
  height: 17px;
  margin-top: 5px;
  border: 1.5px solid var(--ink-2);
  border-radius: 2px;
  display: inline-block;
  cursor: pointer;
  position: relative;
}
.tickbox::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 0px;
  width: 5px;
  height: 10px;
  border: solid var(--paper);
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(42deg) scale(0);
}
.tickbox.on, .tickbox[aria-checked="true"] { background: var(--ok); border-color: var(--ok); }
.tickbox.on::after, .tickbox[aria-checked="true"]::after { transform: rotate(42deg) scale(1); }
ul.checks { list-style: none; margin: 10px 0; padding: 0; }
ul.checks li { display: flex; gap: 10px; margin: 6px 0; }
ul.checks li.checked .check-text { color: var(--ink-2); }
ol.steps { list-style: none; margin: 12px 0; padding: 0; counter-reset: step; }
ol.steps li { display: flex; gap: 10px; margin: 10px 0; }
.step-text { flex: 1; }
.step-text::before {
  counter-increment: step;
  content: counter(step) "、";
  font-family: var(--serif);
  font-weight: 700;
  margin-right: 6px;
}
ul.plainlist { margin: 10px 0; padding-left: 20px; }
ul.plainlist li { margin: 4px 0; }

/* 签字栏 / 落款 */
.sign {
  margin-top: 40px;
  border-top: 3px double var(--ink);
  padding-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.sig { display: flex; flex-direction: column; gap: 26px; }
.sig-l { font-size: 12px; color: var(--ink-2); letter-spacing: 0.08em; }
.sig-v {
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px dashed var(--ink-2);
  padding: 0 8px 6px;
  min-height: 30px;
}
.sig-v--blank { color: var(--ink-3); font-weight: 400; }
.colophon {
  margin-top: 26px;
  border-top: 1px solid var(--hairline);
  padding-top: 12px;
  font-size: 11.5px;
  color: var(--ink-3);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
}
.colophon code { background: none; border: none; padding: 0; }

/* 动效（唯一编排时刻：纸张落定 + 盖章） */
@media (prefers-reduced-motion: no-preference) {
  .sheet { animation: settle 0.18s ease-out both; }
  .stamp { animation: stampIn 0.24s cubic-bezier(0.2, 1.4, 0.4, 1) 0.08s both; }
  @keyframes settle { from { transform: translateY(8px); opacity: 0; } }
  @keyframes stampIn {
    0% { transform: rotate(-8deg) scale(1.5); opacity: 0; }
    70% { opacity: 0.96; }
    100% { transform: rotate(-8deg) scale(1); opacity: 0.92; }
  }
}

/* 响应式 */
@media (max-width: 980px) {
  body { padding: 56px 10px 40px; --toc-w: 0px; }
  body.toc-collapsed { --toc-w: 0px; }
  .toc {
    left: 0; right: 0; top: 0; bottom: auto; width: auto;
    flex-direction: row; align-items: stretch;
    background: rgba(253, 253, 251, 0.96);
    border-bottom: 1px solid var(--hairline);
    padding: 0;
    gap: 0;
  }
  .toc-toggle { border: none; border-right: 1px solid var(--hairline); width: 72px; flex: none; }
  .toc-panel {
    display: block !important;
    border: none;
    padding: 8px 10px;
    overflow-x: auto;
    white-space: nowrap;
  }
  body.toc-collapsed .toc-panel { display: none !important; }
  .toc-head { display: none; }
  .toc-nav { flex-direction: row; gap: 4px; }
  .toc-nav a { border-left: none; border-bottom: 2px solid transparent; padding: 6px 8px; }
  .toc-nav a.is-active { border-bottom-color: var(--blue); background: transparent; }
  .print-fab { top: 8px; right: 8px; padding: 6px 12px; }
  .sheet { padding: 26px 20px; }
  .form-grid { grid-template-columns: repeat(2, 1fr); }
  .facts { grid-template-columns: repeat(3, 1fr); }
  .fact:nth-child(3n) { border-right: none; }
  .fact:nth-child(-n+3) { border-bottom: 1px solid var(--hairline); }
  .stamp-zone { position: static; margin-top: 10px; text-align: left; }
  .doc-title { font-size: 27px; }
  .sign { grid-template-columns: 1fr; gap: 14px; }
}

/* 打印：回到纸面 */
@media print {
  body { background: #fff; padding: 0 !important; }
  .toc, .print-fab { display: none !important; }
  .sheet { max-width: none; border: none; box-shadow: none; padding: 0; }
  .tickbox { border-color: var(--ink); }
  .tickbox[aria-checked="true"] { background: var(--ok); }
  a { color: inherit; border-bottom: none; }
  .chapter { break-inside: auto; }
  .ch-head, h3.sub, .sign, .facts, .note, .remote, .yamlbox, tr { break-inside: avoid; }
  thead th { border-bottom: 2px solid var(--ink); }
  .stamp, .s-frozen, .s-online, .s-cancel, .fact-v, .draft-chip {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { margin: 13mm 12mm; }
}
`;

const JS = `
(function () {
  var d = document;
  var root = d.body;
  function toggleTick(el) {
    var on = el.getAttribute("aria-checked") === "true";
    el.setAttribute("aria-checked", on ? "false" : "true");
  }
  d.addEventListener("click", function (e) {
    var t = e.target.closest("[data-tick]");
    if (t) toggleTick(t);
  });
  d.addEventListener("keydown", function (e) {
    if ((e.key === " " || e.key === "Enter") && e.target.matches && e.target.matches("[data-tick]")) {
      e.preventDefault();
      toggleTick(e.target);
    }
  });
  window.addEventListener("beforeprint", function () {
    d.querySelectorAll("details").forEach(function (x) { x.open = true; });
  });
  var p = d.querySelector("[data-print]");
  if (p) p.addEventListener("click", function () { window.print(); });

  var toggle = d.querySelector("[data-toc-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var collapsed = root.classList.toggle("toc-collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
  }

  var links = Array.prototype.slice.call(d.querySelectorAll("[data-toc-link]"));
  var sections = links.map(function (a) {
    return d.querySelector(a.getAttribute("href"));
  }).filter(Boolean);
  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }
  if (sections.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
      if (visible[0] && visible[0].target && visible[0].target.id) setActive(visible[0].target.id);
    }, { rootMargin: "-12% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] });
    sections.forEach(function (s) { io.observe(s); });
  }
  if (location.hash) setActive(location.hash.slice(1));
})();
`;

/* ---------------- 组装 ---------------- */

export function buildNoteHtml(mdText, opts = {}) {
  const model = parseNoteMd(mdText);
  const status = statusInfo(model).normalized;
  const facts = collectFacts(model);

  const metaRows = headMetaRows(model);
  const formHtml = metaRows.length
    ? `<dl class="form-grid">${metaRows
        .map((r) => {
          const isPh = /（.*seal.*）|（待.*）|^\（[^）]*\）$/.test(r.value);
          return `<div class="form-cell"><span class="form-l">${esc(
            r.label
          )}</span><span class="form-v${
            isPh ? " form-v--ph" : ""
          }">${inlineMd(r.value)}</span></div>`;
        })
        .join("")}</dl>`
    : "";

  const releaseBranch =
    model.headerMeta["发版分支"] || metaRowValue(model.metaTable, "发版分支") || "";
  const baselineBranch = (
    model.headerMeta["基线分支"] ||
    metaRowValue(model.metaTable, "基线分支") ||
    ""
  )
    .replace(/（[^（）]*）\s*$/, "")
    .trim();
  const branchPair = [releaseBranch, baselineBranch ? `基线 ${baselineBranch}` : ""]
    .filter(Boolean)
    .join(" · ");

  const chaptersHtml = model.chapters
    .map((ch, idx) => {
      const flags = ch.flags;
      const flagLabel = flags.auto && flags.manual ? "自动 + 人工" : flags.auto ? "自动段" : flags.manual ? "人工段" : "";
      return `<section class="chapter" id="ch-${idx + 1}"><header class="ch-head"><span class="ch-no">${esc(
        ch.numeral || String(idx + 1)
      )}</span><h2>${esc(ch.title)}</h2>${
        flagLabel ? `<span class="ch-flag">${esc(flagLabel)}</span>` : ""
      }</header>${chapterBlocksHtml(ch)}</section>`;
    })
    .join("\n");

  const title = "发版单";
  const identity = model.identity || "（未具名）";
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="release-eng note-html${opts.skillVersion ? " " + opts.skillVersion : ""}">
<title>${esc(title)} · ${esc(identity)}</title>
<style>${CSS}</style>
</head>
<body>
${chromeHtml(model, status, model.chapters)}
<main class="sheet">
<header class="doc-head">
<div class="doc-no">编号 <b>${esc(identity)}</b> · 发版仪式</div>
<h1 class="doc-title">${esc(title)}</h1>
<p class="doc-sub">${inlineMd(branchPair)}${
    model.headerMeta["定版引用"] ? ` · 定版引用 <code>${esc(model.headerMeta["定版引用"])}</code>` : ""
  }</p>
${formHtml}
<div class="stamp-zone">${stampHtml(status)}</div>
</header>
${factsHtml(facts)}
${chaptersHtml}
${signatureHtml(model)}
<footer class="colophon">
<span>真相文件：<code>${esc(
    opts.noteRel || `${identity}.md`
  )}</code>（发版单 SSOT）· 本页为只读渲染，勿手改</span>
<span>勾选 / 折叠为会话级辅助，不入档</span>
<span>生成：<code>${esc(opts.generatedAt || nowChinaTime())}</code>（Asia/Shanghai）· release-eng ${
    opts.skillVersion ? esc(opts.skillVersion) : ""
  } · note-html</span>
</footer>
</main>
<script>${JS}</script>
</body>
</html>`;
  return html;
}

/* ---------------- 落盘封装 ---------------- */

export function deriveHtmlPath(notePath) {
  return String(notePath).replace(/\.md$/i, "") + ".html";
}

export function writeNoteHtmlForNote({
  notePath,
  root = process.cwd(),
  outPath = null,
  generatedAt = nowChinaTime(),
} = {}) {
  const absNote = path.isAbsolute(notePath) ? notePath : path.join(root, notePath);
  const md = stripBom(fs.readFileSync(absNote, "utf8"));
  const html = buildNoteHtml(md, {
    generatedAt,
    noteRel: path.relative(root, absNote).replace(/\\/g, "/"),
    skillVersion: readSkillVersionSafe(),
  });
  const target = outPath
    ? path.isAbsolute(outPath)
      ? outPath
      : path.join(root, outPath)
    : deriveHtmlPath(absNote);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, "utf8");
  return {
    written: target,
    rel: path.relative(root, target).replace(/\\/g, "/"),
    bytes: Buffer.byteLength(html, "utf8"),
  };
}

/* ---------------- CLI ---------------- */

function parseArgs(argv) {
  const out = { root: process.cwd(), note: null, out: null, dryRun: false, stdout: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--stdout") out.stdout = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-note-html.mjs --root <REPO> --note <path> [--out <file>] [--dry-run] [--stdout]

发版单 md（SSOT）→ 同目录同名 .html 只读渲染（工单样式，可打印/勾选）。
默认输出：与 md 同目录的 <identity>.html；--dry-run 只报告将写路径与字节。
约定：note-merge 定版 / seal --apply 后自动重建；勿手改 html。`);
    process.exit(0);
  }
  if (!args.note) {
    console.error("require --note <发版单 md 路径>");
    process.exit(1);
  }
  const absNote = path.isAbsolute(args.note) ? args.note : path.join(args.root, args.note);
  let md;
  try {
    md = stripBom(fs.readFileSync(absNote, "utf8"));
  } catch (e) {
    console.error(`cannot read note ${absNote}: ${e.message || e}`);
    process.exit(1);
  }
  const relNote = path.relative(args.root, absNote).replace(/\\/g, "/");
  const target = args.out
    ? path.isAbsolute(args.out)
      ? args.out
      : path.join(args.root, args.out)
    : deriveHtmlPath(absNote);
  const relOut = path.relative(args.root, target).replace(/\\/g, "/");

  if (args.stdout) {
    process.stdout.write(
      buildNoteHtml(md, { noteRel: relNote, skillVersion: readSkillVersionSafe() })
    );
    process.exit(0);
  }
  if (args.dryRun) {
    const html = buildNoteHtml(md, {
      noteRel: relNote,
      skillVersion: readSkillVersionSafe(),
    });
    console.log(
      JSON.stringify(
        { ok: true, dryRun: true, note: relNote, out: relOut, bytes: Buffer.byteLength(html, "utf8") },
        null,
        2
      )
    );
    process.exit(0);
  }
  const r = writeNoteHtmlForNote({ notePath: absNote, root: args.root, outPath: args.out || undefined });
  console.log(JSON.stringify({ ok: true, written: r.rel, bytes: r.bytes }, null, 2));
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
