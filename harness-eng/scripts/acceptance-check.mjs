#!/usr/bin/env node
/**
 * acceptance-check — 深·真·全 语义闸（0.2.18+）
 *
 * Usage:
 *   node scripts/acceptance-check.mjs --root <TARGET> [--domain api|func|db|redis|all]
 *   node scripts/acceptance-check.mjs --files a.md,b.md [--gold]
 *   node scripts/acceptance-check.mjs --work-dir <dir> [--gold]
 *
 * Exit: 0 pass · 2 warnings only · 1 blockers (promote 禁止)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  knownContractDomainIds,
  truthsPath,
  fillWorkPath,
  detectDomainFromPath,
  defaultContractDomains,
  loadDomainRegistry,
} from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: null,
    domain: "all",
    workDir: null,
    files: [],
    gold: false,
    help: false,
    jsonOut: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--domain") out.domain = argv[++i];
    else if (a === "--work-dir") out.workDir = argv[++i];
    else if (a === "--files")
      out.files = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--gold") out.gold = true;
    else if (a === "--json-out") out.jsonOut = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function usage() {
  const ids = defaultContractDomains().join("|");
  console.log(`Usage:
  node scripts/acceptance-check.mjs --root <TARGET> [--domain ${ids}|all] [--gold]
  node scripts/acceptance-check.mjs --work-dir <dir> [--gold]
  node scripts/acceptance-check.mjs --files a.md,b.md [--gold]
  Options: --json-out <path>
Exit: 0 pass · 2 warnings-only · 1 blockers
Domains: templates/_meta/domains.yaml (not hardcoded)`);
}

function walkMd(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      walkMd(p, acc);
    } else if (ent.isFile() && ent.name.endsWith(".md") && ent.name !== "README.md") {
      acc.push(p);
    }
  }
  return acc;
}

function splitApiSections(text) {
  const parts = text.split(/(?=^##\s+\d+\.)/m).filter((p) => /^##\s+\d+\./m.test(p));
  return parts.length ? parts : text.trim() ? [text] : [];
}

function checkApiSection(body, file, gold) {
  const blockers = [];
  const warnings = [];
  const title = (body.match(/^##\s+\d+\.\s*(.+)$/m) || [])[1] || "";
  const pathLine = (body.match(/\*\*接口地址[:：]\*\*\s*`?([^\n`]+)`?/i) || [])[1] || "";
  const desc = (body.match(/\*\*功能描述[:：]\*\*\s*([^\n]+)/i) || [])[1] || "";
  const isExport = /export/i.test(pathLine) || /export/i.test(title);

  if (/域接口/.test(desc) && /处理\s*`?\//.test(desc)) {
    blockers.push({ id: "api-echo-desc", file, title, detail: desc.slice(0, 120) });
  }
  if (!isExport && /导出路径：按查询条件生成 Excel|生成 Excel，经 HttpServletResponse/.test(body)) {
    blockers.push({ id: "api-fake-export", file, title, detail: "non-export fake Excel logic" });
  }
  if (!/\*\*evidence[:：]\*\*/i.test(body)) {
    blockers.push({ id: "api-no-evidence", file, title, detail: "missing evidence" });
  }
  const logicBlock = body.match(/###\s*功能逻辑([\s\S]*?)(?=###\s*|$)/i);
  if (!logicBlock) {
    blockers.push({ id: "api-logic-thin", file, title, detail: "missing 功能逻辑" });
  } else {
    const steps = (logicBlock[1].match(/^\s*(?:[-*]|\d+[.)])\s+\S+/gm) || []).filter(
      (l) => !/成功\/失败以 Service|返回 AjaxResult；成功/.test(l)
    );
    if (steps.length < 2) {
      blockers.push({
        id: "api-logic-thin",
        file,
        title,
        detail: `effective steps=${steps.length}`,
      });
    }
  }
  const resp = body.match(/###\s*响应参数([\s\S]*?)(?=###\s*|##\s+\d+\.|$)/i);
  if (resp) {
    const r = resp[1];
    const shallow =
      /code\/msg\/data/.test(r) &&
      !/data\.\w+/.test(r) &&
      !/stream|void|xlsx|Excel/i.test(r);
    if (shallow) {
      const item = {
        id: "api-shallow-resp",
        file,
        title,
        detail: "response only AjaxResult shell",
      };
      if (gold) blockers.push(item);
      else warnings.push(item);
    }
  }

  // 0.2.26+: 字段表 — 示例值 / 说明 /（若有）枚举·备注
  for (const secName of ["请求参数", "响应参数"]) {
    const issues = checkParamFieldTable(body, secName);
    for (const it of issues) {
      const item = {
        id: it.id,
        file,
        title,
        detail: `${secName}: ${it.issue}`,
      };
      if (gold) blockers.push(item);
      else warnings.push(item);
    }
  }
  return { blockers, warnings };
}

const OK_PLACEHOLDER = /^(未知|—|–|-|N\/A|n\/a|无|暂无|null|NULL|\(空\))$/;
/** 说明列禁止的占位/套话（「—」「未知」在说明中不算已填） */
const BAD_DESC =
  /^(未知|—|–|-|N\/A|n\/a|无|暂无|null|NULL|\(空\)|同请求|同上|见上|对象|列表|TODO(?:\(harness-eng\))?)$/i;
const SKIP_PARAM_NAME = /^(—|–|-|无|无参数|无请求体|（无\s*body）|\(无\s*body\)|n\/a)$/i;

/** Split a markdown table row; tolerate missing trailing `|`. */
function splitMdTableRow(line) {
  const raw = String(line || "").trim();
  if (!raw.startsWith("|")) return [];
  const inner = raw.endsWith("|") ? raw.slice(1, -1) : raw.slice(1);
  return inner.split("|").map((c) => c.trim());
}

/** 见共用 VO / 字段见上方 — 合法指针，无字段表可 skip。 */
function isParamTablePointer(block) {
  return (
    /见\s*[「『"`'][^」』"`']+[」』"`']/i.test(block) ||
    /字段见\s*(上方|上文|下表|同节|共用)/i.test(block) ||
    /见\s*(上方|上文).{0,24}(字段|参数表|表)/i.test(block) ||
    /见\s*[`']?[\w.]+[`']?\s*(VO|DTO|Req|Resp|Request|Response)\b/i.test(block) ||
    /共用\s*(请求|响应)?\s*(体|VO|DTO|字段)/i.test(block)
  );
}

/** Parse first markdown table under ### 请求参数 / ### 响应参数. */
function parseParamTable(body, sectionTitle) {
  const sec = body.match(
    new RegExp(`###\\s*${sectionTitle}([\\s\\S]*?)(?=###\\s*|##\\s+\\d+\\.|$)`, "i")
  );
  if (!sec) return { skip: true };
  const block = sec[1];
  const tableMatch = block.match(
    /\|[^\n]+\|[\r\n]+\|[:\s-|]+\|([\s\S]*?)(?=\n\s*\n|\n###|\n##|$)/
  );
  if (!tableMatch) {
    if (/void|stream|无参数|无请求体|HttpServletResponse/i.test(block)) return { skip: true };
    if (isParamTablePointer(block)) return { skip: true };
    return { issues: [{ id: "api-empty-examples", issue: "missing parameter table" }] };
  }
  const headerLine = block.match(/\|[^\n]+\|/);
  if (!headerLine) {
    return { issues: [{ id: "api-empty-examples", issue: "missing parameter table header" }] };
  }
  const headers = splitMdTableRow(headerLine[0]).filter(Boolean);
  const rows = [];
  let shortRows = 0;
  for (const line of block.split(/\r?\n/)) {
    if (!/^\|/.test(line)) continue;
    if (/^\|\s*:?-{2,}/.test(line)) continue;
    if (line === headerLine[0]) continue;
    const cells = splitMdTableRow(line);
    if (cells.length < 2) continue;
    if (
      cells.some((c) => /参数名|类型|必填|说明|示例|枚举|备注/.test(c)) &&
      cells.length === headers.length
    ) {
      continue;
    }
    if (headers.length && cells.length < headers.length) {
      shortRows++;
      continue;
    }
    rows.push(cells);
  }
  if (shortRows > 0) {
    return {
      issues: [
        {
          id: "api-empty-examples",
          issue: `表行列数不足（${shortRows} 行少于表头 ${headers.length} 列）`,
        },
      ],
    };
  }
  return { headers, rows, block };
}

/**
 * 字段表检查：示例值（必有列）· 说明含义 · 若有枚举/备注列则禁空单元格。
 * 金标下由调用方升 blocker。
 */
function checkParamFieldTable(body, sectionTitle) {
  const parsed = parseParamTable(body, sectionTitle);
  if (parsed.skip) return [];
  if (parsed.issues) return parsed.issues;

  const { headers, rows } = parsed;
  const out = [];
  if (!rows.length) return out;

  const nameIdx = headers.findIndex((h) => /参数名|字段名|名称/.test(h));
  const descIdx = headers.findIndex((h) => /^说明$/.test(h) || h === "说明");
  const exIdx = headers.findIndex((h) => /示例/.test(h));
  const enumIdx = headers.findIndex((h) => /^枚举$/.test(h));
  const remarkIdx = headers.findIndex((h) => /^备注$/.test(h));

  if (exIdx < 0) {
    out.push({ id: "api-empty-examples", issue: "missing 示例值 column" });
  } else {
    let empty = 0;
    for (const cells of rows) {
      const v = (cells[exIdx] ?? "").replace(/`/g, "").trim();
      if (!v) empty++;
    }
    if (empty > 0) {
      out.push({
        id: "api-empty-examples",
        issue: `${empty}/${rows.length} rows have empty 示例值`,
      });
    }
  }

  if (descIdx >= 0) {
    let bad = 0;
    for (const cells of rows) {
      const name = (cells[nameIdx >= 0 ? nameIdx : 0] ?? "").replace(/`/g, "").trim();
      if (SKIP_PARAM_NAME.test(name)) continue;
      const raw = (cells[descIdx] ?? "").replace(/`/g, "").trim();
      if (!raw || BAD_DESC.test(raw) || (name && raw.toLowerCase() === name.toLowerCase())) {
        bad++;
      }
    }
    if (bad > 0) {
      out.push({
        id: "api-empty-desc",
        issue: `${bad} rows have empty/tautology/boilerplate 说明`,
      });
    }
  }

  for (const [idx, label, id] of [
    [enumIdx, "枚举", "api-empty-enum-remark"],
    [remarkIdx, "备注", "api-empty-enum-remark"],
  ]) {
    if (idx < 0) continue;
    let empty = 0;
    for (const cells of rows) {
      const name = (cells[nameIdx >= 0 ? nameIdx : 0] ?? "").replace(/`/g, "").trim();
      if (SKIP_PARAM_NAME.test(name)) continue;
      const v = (cells[idx] ?? "").replace(/`/g, "").trim();
      if (!v) empty++;
      else if (OK_PLACEHOLDER.test(v)) {
        /* ok */
      }
    }
    if (empty > 0) {
      out.push({
        id,
        issue: `${empty}/${rows.length} rows have empty ${label}`,
      });
    }
  }

  return out;
}

function checkApiFile(file, text, gold) {
  const blockers = [];
  const warnings = [];
  let sections = 0;
  let pass = 0;
  for (const sec of splitApiSections(text)) {
    sections++;
    const r = checkApiSection(sec, file, gold);
    blockers.push(...r.blockers);
    warnings.push(...r.warnings);
    if (!r.blockers.length) pass++;
  }
  return { blockers, warnings, sections, pass };
}

function checkFuncFile(file, text, gold) {
  const blockers = [];
  const warnings = [];
  if (!/###\s*服务类/.test(text) && !/服务类/.test(text)) {
    blockers.push({ id: "func-no-services", file, detail: "missing 服务类" });
  }
  if (!/###\s*方法清单|方法清单/.test(text)) {
    blockers.push({ id: "func-no-methods", file, detail: "missing 方法清单" });
  }
  const isAlignSepCell = (c) => /^:?-{2,}:?$/.test(String(c || "").trim());
  const rows = text.match(/\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|/g) || [];
  for (const row of rows.slice(0, 40)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.every(isAlignSepCell)) continue;
    if (cells.length >= 4 && cells[0] === cells[1]) {
      blockers.push({
        id: "func-empty-semantics",
        file,
        detail: `method desc echoes name: ${cells[0]}`,
      });
    }
  }
  // 0.2.27: empty 功能说明 cells (gold=blocker)
  const header = text.match(/\|[^\n]*功能说明[^\n]*\|/);
  if (header) {
    const headers = header[0]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    const descIdx = headers.findIndex((h) => /功能说明|说明|语义/.test(h));
    if (descIdx >= 0) {
      let empty = 0;
      for (const row of rows) {
        const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length >= 2 && cells.every(isAlignSepCell)) continue;
        if (cells.some((c) => /功能说明|方法签名|参数名/.test(c))) continue;
        const desc = (cells[descIdx] ?? "").replace(/`/g, "").trim();
        if (!desc || /^TODO/i.test(desc)) empty++;
      }
      if (empty > 0) {
        const item = {
          id: "func-empty-desc",
          file,
          detail: `${empty} method rows missing 功能说明`,
        };
        if (gold) blockers.push(item);
        else warnings.push(item);
      }
    }
  }
  return { blockers, warnings, sections: 1, pass: blockers.length ? 0 : 1 };
}

function checkDbFile(file, text, gold) {
  const blockers = [];
  const warnings = [];
  if (!/CREATE\s+TABLE/i.test(text)) {
    blockers.push({ id: "db-no-ddl", file, detail: "missing CREATE TABLE" });
  }
  if (!/变更记录/.test(text)) {
    warnings.push({ id: "db-no-changelog", file, detail: "missing 变更记录" });
  }
  // 0.2.27: COMMENT or explicit 未知
  const hasComment = /COMMENT\s+'/i.test(text) || (/##\s*字段/.test(text) && /注释|COMMENT/.test(text));
  const unknownOk = /未知/.test(text) && /(COMMENT|注释|字段说明)/.test(text);
  if (!hasComment && !unknownOk) {
    const item = {
      id: "db-no-comment",
      file,
      detail: "missing field COMMENT and no explicit 未知",
    };
    if (gold) blockers.push(item);
    else warnings.push(item);
  }
  return { blockers, warnings, sections: 1, pass: blockers.length ? 0 : 1 };
}

function checkRedisFile(file, text, gold) {
  const blockers = [];
  const warnings = [];
  if (!/##\s*TTL|TTL/.test(text)) {
    blockers.push({ id: "redis-no-ttl", file, detail: "missing TTL" });
  }
  if (!/读写方|读\s*\/\s*写/.test(text)) {
    blockers.push({ id: "redis-no-rw", file, detail: "missing 读写方" });
  }
  if (!/Key 模式|模式/.test(text)) {
    warnings.push({ id: "redis-no-pattern", file, detail: "missing Key 模式" });
  }
  // 0.2.27: 示例 / live / 显式未知；亦认 Key 模式表「示例」列（与 redis-key-template 对齐）
  const hasEx =
    /示例\s*[：:]|live\s*[：:]|SCAN\s*`/i.test(text) ||
    /\|\s*示例\s*\|\s*[^|\n]+\s*\|/.test(text) ||
    (/未知/.test(text) && /Key\s*模式|模式/.test(text));
  if (!hasEx) {
    const item = {
      id: "redis-no-example",
      file,
      detail: "missing Key 示例/live sample (or explicit 未知)",
    };
    if (gold) blockers.push(item);
    else warnings.push(item);
  }
  return { blockers, warnings, sections: 1, pass: blockers.length ? 0 : 1 };
}

function checkJobsFile(file, text, gold) {
  const blockers = [];
  const warnings = [];
  const norm = file.replace(/\\/g, "/");
  const inSsot = /\/docs\/jobs\/tasks\//.test(norm);
  const hasQualityHeuristic = /quality:\s*heuristic/i.test(text);
  const hasSchedulerHeuristic =
    /scheduler_link:\s*heuristic/i.test(text) || /link:\s*heuristic/i.test(text);

  if (inSsot && (hasQualityHeuristic || hasSchedulerHeuristic)) {
    blockers.push({
      id: "jobs-heuristic-in-ssot",
      file,
      detail: "heuristic quality/scheduler_link must not live in docs/jobs/tasks SSOT",
    });
  }
  if (hasSchedulerHeuristic && !hasQualityHeuristic) {
    blockers.push({
      id: "jobs-heuristic-unmarked",
      file,
      detail: "scheduler_link heuristic requires quality: heuristic (do not promote unmarked)",
    });
  }

  if (!/task_code|##\s*标识/i.test(text)) {
    blockers.push({ id: "jobs-no-id", file, detail: "missing task_code / ## 标识" });
  }
  if (!/##\s*Cron|cronConfigKey|默认表达式/i.test(text)) {
    blockers.push({ id: "jobs-no-cron", file, detail: "missing ## Cron" });
  }
  if (!/Scheduler|调度入口/i.test(text)) {
    const item = { id: "jobs-no-scheduler", file, detail: "missing Scheduler / 调度入口" };
    if (gold) blockers.push(item);
    else warnings.push(item);
  }
  if (!/##\s*代码锚点|Registry|SyncTaskCode/i.test(text)) {
    const item = { id: "jobs-no-anchors", file, detail: "missing ## 代码锚点" };
    if (gold) blockers.push(item);
    else warnings.push(item);
  }
  if (
    /###\s*请求参数/.test(text) &&
    /\|\s*字段\s*\|\s*类型\s*\|/.test(text) &&
    /OpenAPI|接口地址/.test(text)
  ) {
    blockers.push({
      id: "jobs-openapi-dump",
      file,
      detail: "OpenAPI field tables must not live in jobs truths",
    });
  }
  return { blockers, warnings, sections: 1, pass: blockers.length ? 0 : 1 };
}

/** Register acceptance checker per domain id (add domain → add entry here). */
const ACCEPTANCE_BY_DOMAIN = {
  api: checkApiFile,
  func: checkFuncFile,
  db: checkDbFile,
  redis: checkRedisFile,
  jobs: checkJobsFile,
};

export function runAcceptanceForDomain(domain, file, text, gold) {
  const fn = ACCEPTANCE_BY_DOMAIN[domain] || checkApiFile;
  return fn(file, text, gold);
}

function detectDomain(file, forced) {
  if (forced && forced !== "all") return forced;
  return detectDomainFromPath(file) || "api";
}

function collectFiles(args) {
  const files = [];
  if (args.files.length) {
    for (const f of args.files) files.push(path.resolve(f));
    return files;
  }
  if (args.workDir) {
    return walkMd(path.resolve(args.workDir));
  }
  if (!args.root) return files;
  const root = path.resolve(args.root);
  const registry = loadDomainRegistry();
  const domains =
    args.domain === "all" ? knownContractDomainIds(registry) : [args.domain];
  for (const d of domains) {
    files.push(...walkMd(truthsPath(root, d, registry)));
    if (registry[d]?.scan_fill_work) {
      files.push(...walkMd(fillWorkPath(root, d)));
    }
  }
  return files.filter((f) => {
    const base = path.basename(f);
    if (base.startsWith("inventory")) return false;
    if (base.startsWith("_gen_")) return false;
    if (base.startsWith("merged-")) return false;
    return true;
  });
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    return;
  }
  if (!args.root && !args.workDir && !args.files.length) {
    usage();
    process.exitCode = 1;
    return;
  }

  const files = collectFiles(args);
  const report = {
    ok: true,
    version: "0.2.27",
    gold: args.gold,
    files: files.length,
    sections: 0,
    pass_sections: 0,
    blockers: [],
    warnings: [],
    gold_pass_ratio: null,
  };

  for (const f of files) {
    if (!fs.existsSync(f)) {
      report.blockers.push({ id: "file-missing", file: f, detail: "not found" });
      continue;
    }
    const text = fs.readFileSync(f, "utf8");
    const domain = detectDomain(f, args.domain);
    const r = runAcceptanceForDomain(domain, f, text, args.gold);
    report.blockers.push(...r.blockers);
    report.warnings.push(...r.warnings);
    report.sections += r.sections;
    report.pass_sections += r.pass;
  }

  report.gold_pass_ratio =
    report.sections > 0
      ? Math.round((1000 * report.pass_sections) / report.sections) / 1000
      : null;
  const hasBlockers = report.blockers.length > 0;
  const hasWarnings = report.warnings.length > 0;
  report.ok = !hasBlockers;
  report.exit_hint = hasBlockers ? 1 : hasWarnings ? 2 : 0;

  const json = JSON.stringify(report, null, 2);
  console.log(json);
  if (args.jsonOut) {
    const out = path.resolve(args.jsonOut);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, json, "utf8");
    console.error(`Wrote ${out}`);
  }
  if (hasBlockers) {
    console.error(
      `ACCEPTANCE FAIL: blockers=${report.blockers.length} warnings=${report.warnings.length} gold_pass_ratio=${report.gold_pass_ratio}`
    );
    process.exitCode = 1;
  } else if (hasWarnings) {
    console.error(
      `ACCEPTANCE WARN: warnings=${report.warnings.length} gold_pass_ratio=${report.gold_pass_ratio}`
    );
    process.exitCode = 2;
  } else {
    console.error(`ACCEPTANCE OK gold_pass_ratio=${report.gold_pass_ratio}`);
    process.exitCode = 0;
  }
}

main();
