#!/usr/bin/env node
/**
 * release-freeze — collect 定版 tables for release-eng
 *
 * Usage:
 *   node release-freeze.mjs --root <REPO> --base <ref> --head <ref> [--format json|md|draft-md|audit-json|summary] [--out <file>]
 *   node release-freeze.mjs --root <REPO> --first-release --head <ref> [--format json|md|draft-md|audit-json|summary] [--out <file>]
 *   node release-freeze.mjs --root <REPO> --base none --head <ref> [--format json|md|draft-md|audit-json|summary] [--out <file>]
 *   node release-freeze.mjs --root <REPO> --help
 *
 * Prefer refs / freezeArgs from release-push-gate.mjs.
 * 首次发版：分层候选（SQL 全 migration；配置仅 application-prod.yml 键；任务仅 SyncTaskCode；其余 path→layerSuppressed）。
 * 增量：路径 + yml/Java 键级·任务级 diff；双源去重（基线树 ∪ archive artifacts）。
 * --prior auto|none|<path>；--prior-since <identity|YYYY-MM-DD> 截断 archive 并集。
 * 截断5（提交：前 3 后 2、hash 取前 8 位）/ 合并来源去重全量（origin/ 归一、一句话）/ SQL序 / gitlabUrl：见 freeze.md。
 * Exit 0=ok 1=error（含逾期硬闸 overdueHardGate）
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  enrichFreezePayload,
  extractTaskCodesFromJavaDiff as enrichExtractTaskCodes,
  loadSyncTaskCodeMap,
  toDraftPreviewMd,
  toAuditFreezeSummary,
  toFreezeSummary,
} from "./release-freeze-enrich.mjs";
import {
  TZ_CHINA,
  gitEnvChina,
  nowChinaTime,
  buildMergeSources,
  buildReleaseSummaryLines,
  releaseSummaryMarkdown,
  shortCommitHash,
  COMMIT_DISPLAY_MAX,
  COMMIT_DISPLAY_HEAD,
  COMMIT_DISPLAY_TAIL,
  H3_GIT,
} from "./release-format.mjs";

function isNoneBase(v) {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "none" || s === "无" || s === "-" || s === "null";
}

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    base: null,
    head: null,
    firstRelease: false,
    format: "json",
    prior: "auto",
    priorSince: null,
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--base") out.base = argv[++i];
    else if (a === "--head") out.head = argv[++i];
    else if (a === "--first-release") out.firstRelease = true;
    else if (a === "--format") out.format = argv[++i] || "json";
    else if (a === "--prior") out.prior = argv[++i] || "auto";
    else if (a === "--prior-since") out.priorSince = argv[++i] || null;
    else if (a === "--out") out.out = argv[++i] || null;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  if (isNoneBase(out.base)) out.firstRelease = true;
  return out;
}

function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    env: gitEnvChina(),
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

function gitShow(root, ref, filePath) {
  const norm = filePath.replace(/\\/g, "/");
  const r = git(root, ["show", `${ref}:${norm}`]);
  if (!r.ok) return null;
  return r.stdout;
}

function stripOrigin(ref) {
  if (!ref) return ref;
  return String(ref).replace(/^origin\//, "");
}

function originWebUrl(root) {
  const r = git(root, ["remote", "get-url", "origin"]);
  if (!r.ok || !r.stdout) return null;
  let url = r.stdout.trim();
  const ssh = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/i);
  if (ssh) {
    return `http://${ssh[1]}/${ssh[2].replace(/\.git$/i, "")}`;
  }
  url = url.replace(/\.git$/i, "");
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  return null;
}

function buildGitlabUrl(root, { firstRelease, base, head }) {
  const web = originWebUrl(root);
  if (!web) return null;
  const h = stripOrigin(head);
  if (firstRelease) return `${web}/-/commits/${encodeURIComponent(h)}`;
  const b = stripOrigin(base);
  return `${web}/-/compare/${encodeURIComponent(b)}...${encodeURIComponent(h)}`;
}

function guessSourceBranch(subject) {
  if (!subject) return null;
  const m =
    subject.match(/Merge (?:remote-tracking )?branch '([^']+)'/i) ||
    subject.match(/Merge pull request #\d+ from ([^\s]+)/i) ||
    subject.match(/Merge branch '([^']+)'/i);
  return m ? m[1] : null;
}

function pathBucket(p) {
  const n = p.replace(/\\/g, "/");
  if (n.includes("db/migration") || /\/V\d+__/.test(n)) return "db/migration";
  if (n.startsWith("sms-ai-web/") || n.startsWith("sms-ai-web\\")) return "sms-ai-web/";
  if (n.startsWith("sms-ai/") || n.startsWith("sms-ai\\")) return "sms-ai/";
  if (n.startsWith("docs/") || n.startsWith("docs\\")) return "docs/";
  return "其它";
}

function normPath(p) {
  return p.replace(/\\/g, "/");
}

function baseName(p) {
  const n = normPath(p);
  return n.split("/").pop() || n;
}

/** SQL 收紧：仅 migration Vn__*.sql；附带 docs/db/table/*_change.sql */
function isMigrationSql(filePath) {
  const n = normPath(filePath);
  const base = baseName(n);
  return /\/db\/migration\/V\d+__.+\.sql$/i.test(n) || (/^V\d+__.+\.sql$/i.test(base) && n.includes("db/migration"));
}

function isDbChangeSql(filePath) {
  return /docs\/db\/table\/.+_change\.sql$/i.test(normPath(filePath));
}

function isApplicationYml(filePath) {
  return /application.*\.ya?ml$/i.test(baseName(filePath));
}

function isConfigPath(filePath) {
  const base = baseName(filePath);
  return isApplicationYml(filePath) || base === ".env" || /secret/i.test(base);
}

/** Nacos 覆盖配置：prod 业务配置常置于 config/nacos/application-prod-nacos.yml */
function isNacosProdOverlay(filePath) {
  const n = normPath(filePath);
  const base = baseName(n);
  return /config\/nacos\//i.test(n) && /^application-prod-nacos\.ya?ml$/i.test(base);
}

function isJobsPath(filePath) {
  const n = normPath(filePath);
  return (
    n.includes("docs/jobs") ||
    /Scheduler\.java$/i.test(n) ||
    /SyncTaskCode/i.test(n) ||
    /SyncTaskMetadataRegistry/i.test(n)
  );
}

function isThirdPartyPath(filePath) {
  const n = normPath(filePath);
  return (
    /feign/i.test(n) ||
    /wenxue|问学/i.test(n) ||
    /lexiang|乐享/i.test(n) ||
    /dashscope/i.test(n) ||
    /\/mcp/i.test(n) ||
    /mcp\.json/i.test(n)
  );
}

function migrationVersion(filePath) {
  const base = baseName(filePath);
  const m = base.match(/^V(\d+)__/i);
  return m ? Number(m[1]) : null;
}

function isJobsKey(keyPath) {
  const k = String(keyPath || "").toLowerCase();
  return k.includes("cron") || k.includes("scheduling") || /\.zone$/.test(k) && k.includes("schedul");
}

/**
 * 轻量 YAML 扁平化（无外部依赖）。跳过列表项行与纯注释。
 * 值存 `{ value, comment }`；多行 / 锚点不解析——漏检时仍保留 path 级候选。
 */
function flattenYamlKeys(text) {
  const map = new Map();
  if (!text) return map;
  const stack = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (/^\s*-\s/.test(raw)) continue;
    const m = raw.match(/^(\s*)([^:#\s][^:]*?)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const indent = m[1].length;
    const key = m[2].trim().replace(/^['"]|['"]$/g, "");
    let val = m[3];
    let comment = "";
    if (val.startsWith('"') || val.startsWith("'")) {
      val = val.replace(/^['"]|['"]$/g, "");
    } else {
      const hash = val.indexOf(" #");
      if (hash >= 0) {
        comment = val.slice(hash + 2).trim();
        val = val.slice(0, hash).trim();
      }
    }
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    stack.push({ indent, key });
    const full = stack.map((s) => s.key).join(".");
    if (val === "" || val === "|" || val === ">" || val === "|-") {
      // 父级键（映射/块）：无标量值，不计入"说明待补"
      if (!map.has(full)) map.set(full, { value: "", comment, isLeaf: false });
    } else {
      map.set(full, { value: val, comment, isLeaf: true });
    }
  }
  return map;
}

function entryValue(entry) {
  if (entry == null) return undefined;
  if (typeof entry === "object" && "value" in entry) return entry.value;
  return entry;
}

function entryComment(entry) {
  if (entry && typeof entry === "object" && entry.comment) return entry.comment;
  return "";
}

function diffKeyMaps(before, after) {
  const keys = new Set([...before.keys(), ...after.keys()]);
  const out = [];
  for (const key of [...keys].sort()) {
    const hasB = before.has(key);
    const hasA = after.has(key);
    const bv = entryValue(before.get(key));
    const av = entryValue(after.get(key));
    if (!hasB && hasA) {
      out.push({
        key,
        change: "added",
        value: av,
        comment: entryComment(after.get(key)),
        jobs: isJobsKey(key),
      });
    } else if (hasB && !hasA) {
      out.push({
        key,
        change: "removed",
        value: bv,
        comment: entryComment(before.get(key)),
        jobs: isJobsKey(key),
      });
    } else if (bv !== av) {
      out.push({
        key,
        change: "changed",
        value: av,
        from: bv,
        comment: entryComment(after.get(key)) || entryComment(before.get(key)),
        jobs: isJobsKey(key),
      });
    }
  }
  return out;
}

function extractTaskCodesFromJavaDiff(diffText, syncEnumMap) {
  return enrichExtractTaskCodes(diffText, syncEnumMap);
}

function extractCronFromJavaDiff(diffText) {
  if (!diffText) return [];
  const found = [];
  for (const line of diffText.split(/\r?\n/)) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const cron = line.match(/cron\s*=\s*"([^"]+)"/i) || line.match(/cron\s*=\s*'([^']+)'/i);
    if (cron) found.push(cron[1]);
  }
  return found;
}

function sortSqlCandidates(candidates) {
  const sql = candidates.filter((c) => c.kinds.includes("sql"));
  const rest = candidates.filter((c) => !c.kinds.includes("sql"));
  sql.sort((a, b) => {
    const va = migrationVersion(a.path);
    const vb = migrationVersion(b.path);
    if (va == null && vb == null) return a.path.localeCompare(b.path);
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va !== vb) return va - vb;
    return a.path.localeCompare(b.path);
  });
  return [...sql, ...rest];
}

function parseLogLines(stdout) {
  if (!stdout) return [];
  return stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [hash, author, dateRaw, ...rest] = line.split("|");
    return { hash, author, date: formatCommitDateChina(dateRaw), subject: rest.join("|") };
  });
}

/** 将 git %aI / 任意可解析时间转为 Asia/Shanghai 展示 */
function formatCommitDateChina(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw).trim();
  return nowChinaTime(d);
}

function truncateDisplay(rows, max, head, tail) {
  if (!rows || rows.length <= max) {
    return { rows: rows || [], truncated: false, omitted: 0, noteRow: null };
  }
  const omitted = rows.length - head - tail;
  return {
    rows: [...rows.slice(0, head), { __omit__: true, omitted }, ...rows.slice(-tail)],
    truncated: true,
    omitted,
    noteRow: omitted,
  };
}

function truncateCommits(rows) {
  return truncateDisplay(rows, COMMIT_DISPLAY_MAX, COMMIT_DISPLAY_HEAD, COMMIT_DISPLAY_TAIL);
}

function commitMdRow(c) {
  if (c && c.__omit__) {
    return `| … | … | … | （省略 ${c.omitted} 条） |`;
  }
  return `| ${shortCommitHash(c.hash)} | ${c.author} | ${c.date} | ${c.subject.replace(/\|/g, "\\|")} |`;
}

function mergeSourceMdRow(m) {
  const summary = m.branchSummary || m.sampleSubject || "";
  return `| ${String(m.source || "无/未识别").replace(/\|/g, "\\|")} | ${m.count} | ${String(summary).replace(/\|/g, "\\|")} |`;
}

function gitlabHint(gitlabUrl) {
  if (!gitlabUrl) {
    return "> 完整记录请登录 GitLab 查看（未能从 origin 推导链接；请打开仓库 Commits / Compare 页）。";
  }
  return `> 完整记录请登录 GitLab 查看：${gitlabUrl}`;
}

function candidateKeySummary(c) {
  if (!c.keys || !c.keys.length) return "";
  const parts = c.keys.slice(0, 8).map((k) => `${k.change}:${k.key}`);
  const more = c.keys.length > 8 ? ` …+${c.keys.length - 8}` : "";
  return parts.join(", ") + more;
}

function toMd(data) {
  const lines = [];
  lines.push(`# freeze ${data.range}`);
  if (data.firstRelease) {
    lines.push("");
    lines.push("> 首次发版：Git 提交/路径统计取全量；**上线候选不扫整树**（见 inventory / 问卷人工）");
  }
  lines.push("");
  lines.push(`## ${H3_GIT.commits}`);
  lines.push("| hash | author | date | subject |");
  lines.push("|---|---|---|---|");
  const commitsView = truncateCommits(data.commits);
  if (!commitsView.rows.length) lines.push("| — | — | — | （无） |");
  else for (const c of commitsView.rows) lines.push(commitMdRow(c));
  if (commitsView.truncated) {
    lines.push("");
    lines.push(gitlabHint(data.gitlabUrl));
  }
  lines.push("");
  lines.push(`## ${H3_GIT.merges}`);
  lines.push("| 推测来源分支 | 出现次数 | 来源分支功能 |");
  lines.push("|---|---|---|");
  const mergeSources = data.mergeSources || buildMergeSources(data.merges);
  if (!mergeSources.length) lines.push("| — | 0 | 无 |");
  else for (const m of mergeSources) lines.push(mergeSourceMdRow(m));
  lines.push("");
  lines.push("## 上线内容摘要（← 分支级聚合）");
  lines.push(
    releaseSummaryMarkdown(
      data.releaseSummaryLines ||
        buildReleaseSummaryLines(data.commits, { mergeSources: data.mergeSources })
    )
  );
  lines.push(`> 时区：${TZ_CHINA}`);
  lines.push("");
  lines.push("## 候选");
  lines.push("| kinds | path | confidence | keys/detail |");
  lines.push("|---|---|---|---|");
  for (const c of data.candidates) {
    const detail =
      candidateKeySummary(c) ||
      (c.taskCodes && c.taskCodes.length ? `taskCodes=${c.taskCodes.join(",")}` : c.detail || "");
    lines.push(
      `| ${c.kinds.join("+")} | ${c.path} | ${c.confidence} | ${String(detail).replace(/\|/g, "\\|")} |`
    );
  }
  if (!data.candidates.length) lines.push("| — | 无 | — | — |");

  if (data.inventory) {
    lines.push("");
    lines.push("## 首次发版 inventory（非上线清单）");
    lines.push(`- migrationRange: ${data.inventory.migrationRange || "无"}`);
    lines.push(`- migrationCount: ${data.inventory.migrationCount || 0}`);
    lines.push(`- applicationYmls: ${(data.inventory.applicationYmls || []).length}`);
    lines.push(`- jobsDocPaths: ${(data.inventory.jobsDocPaths || []).length}`);
    lines.push(`- 说明: ${data.inventory.message}`);
  }

  if (data.configKeys && data.configKeys.length) {
    lines.push("");
    lines.push("## 配置键（增量）");
    for (const k of data.configKeys.slice(0, 40)) {
      const desc = k.description ? ` — ${k.description}` : " — 待补";
      lines.push(`- ${k.change} \`${k.key}\`${desc} ← ${k.path}`);
    }
    if (data.configKeys.length > 40) lines.push(`- … 另有 ${data.configKeys.length - 40} 条`);
  }
  if (data.jobKeys && data.jobKeys.length) {
    lines.push("");
    lines.push("## 定时任务键（增量）");
    for (const k of data.jobKeys.slice(0, 40)) {
      const job = k.job ? ` → ${k.job.taskCode} (${k.job.truthPath})` : "";
      lines.push(`- ${k.change} \`${k.key}\`${job} ← ${k.path}`);
    }
  }
  if (data.taskCodes && data.taskCodes.length) {
    lines.push("");
    lines.push("## taskCodes（增量）");
    for (const t of data.taskCodes) {
      if (typeof t === "string") lines.push(`- ${t}`);
      else lines.push(`- ${t.taskCode}${t.docsHit ? ` → ${t.truthPath}` : "（未命中 docs/jobs）"}`);
    }
  }
  if (data.jobsHits && data.jobsHits.length) {
    lines.push("");
    lines.push("## jobsHits（docs/jobs）");
    for (const h of data.jobsHits) {
      lines.push(`- ${h.taskCode} · ${h.displayName || ""} · ${h.truthPath || ""}`);
    }
  }
  if (data.draft) {
    lines.push("");
    lines.push("## draft（发版单草稿行 · 未上线）");
    lines.push(`- sql: ${data.draft.sql?.length || 0}`);
    lines.push(`- config: ${data.draft.config?.length || 0}`);
    lines.push(`- jobs: ${data.draft.jobs?.length || 0}`);
  }
  if (data.draftSuppressed) {
    const s = data.draftSuppressed;
    const n = (s.sql?.length || 0) + (s.config?.length || 0) + (s.jobs?.length || 0);
    if (n) {
      lines.push("");
      lines.push("## draftSuppressed（相对 prior 已上线 · 默认不落单）");
      lines.push(`- sql: ${s.sql?.length || 0} · config: ${s.config?.length || 0} · jobs: ${s.jobs?.length || 0}`);
      if (data.priorRelease?.path) lines.push(`- prior: ${data.priorRelease.path}`);
    }
  }

  if (data.gitlabUrl) {
    lines.push("");
    lines.push(`## GitLab`);
    lines.push(data.gitlabUrl);
  }
  return lines.join("\n");
}

function displayPayload(rows, gitlabUrl, truncateFn) {
  const view = truncateFn(rows || []);
  return {
    total: (rows || []).length,
    truncated: view.truncated,
    omitted: view.omitted,
    rows: view.rows,
    gitlabHint: view.truncated ? (gitlabUrl || null) : null,
  };
}

function mergeSourcesDisplayPayload(mergeSources) {
  return {
    total: (mergeSources || []).length,
    truncated: false,
    omitted: 0,
    rows: mergeSources || [],
    gitlabHint: null,
  };
}

function buildFirstReleaseInventory(files) {
  const migrations = files.filter(isMigrationSql).sort((a, b) => {
    const va = migrationVersion(a) ?? 0;
    const vb = migrationVersion(b) ?? 0;
    return va - vb || a.localeCompare(b);
  });
  const versions = migrations.map(migrationVersion).filter((v) => v != null);
  const minV = versions.length ? Math.min(...versions) : null;
  const maxV = versions.length ? Math.max(...versions) : null;
  return {
    policy: "first-release-layered",
    migrationCount: migrations.length,
    migrationRange: minV != null ? `V${minV}-V${maxV}` : null,
    migrationHead: migrations.slice(-5).map(baseName),
    applicationYmls: files.filter(isApplicationYml).map(normPath),
    jobsDocPaths: files.filter((f) => normPath(f).includes("docs/jobs")).map(normPath),
    message:
      "首次发版分层：SQL=全 migration 进 draft；配置=application-prod.yml 全键；任务=SyncTaskCode 枚举；其余 path 进 draftSuppressed（layer）。问卷仍须确认起迁与 prod。",
  };
}

/** 首次发版分层候选（Q11=C） */
function buildFirstReleaseLayeredCandidates(root, head, files) {
  const byPath = new Map();
  const configKeys = [];
  const jobKeys = [];
  const taskCodes = new Set();
  const syncEnumMap = loadSyncTaskCodeMap(root);

  function upsert(cand) {
    const p = cand.path;
    const prev = byPath.get(p);
    if (!prev) {
      byPath.set(p, cand);
      return;
    }
    const kinds = new Set([...(prev.kinds || []), ...(cand.kinds || [])]);
    prev.kinds = [...kinds];
    prev.kind = prev.kinds[0];
    if (cand.layerSuppressed === false) prev.layerSuppressed = false;
    prev.keys = [...(prev.keys || []), ...(cand.keys || [])];
    prev.taskCodes = [...new Set([...(prev.taskCodes || []), ...(cand.taskCodes || [])])];
  }

  for (const f of files) {
    const n = normPath(f);
    if (isMigrationSql(n)) {
      upsert({
        kinds: ["sql"],
        kind: "sql",
        path: n,
        confidence: "path",
        keys: [],
        detail: `V${migrationVersion(n)}`,
        layerSuppressed: false,
      });
    } else if (isDbChangeSql(n)) {
      upsert({
        kinds: ["sql"],
        kind: "sql",
        path: n,
        confidence: "path",
        keys: [],
        detail: "docs/_change.sql",
        layerSuppressed: true,
      });
    } else if (/^application-prod\.ya?ml$/i.test(baseName(n))) {
      const text = gitShow(root, head, n) || "";
      const map = flattenYamlKeys(text);
      const keys = [];
      for (const [key, entry] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const row = {
          key,
          change: "added",
          value: entryValue(entry),
          comment: entryComment(entry),
          isLeaf: entry.isLeaf === true,
          jobs: isJobsKey(key),
          path: n,
          source: "application-prod",
          layerSuppressed: false,
        };
        keys.push(row);
        if (row.jobs) jobKeys.push(row);
        else configKeys.push(row);
      }
      upsert({
        kinds: keys.some((k) => k.jobs) ? ["config", "jobs"] : ["config"],
        kind: "config",
        path: n,
        confidence: keys.length ? "key-diff" : "path",
        keys,
        detail: `first-release prod keys=${keys.length}`,
        layerSuppressed: false,
      });
    } else if (isNacosProdOverlay(n)) {
      // 首次发版：prod 业务配置常由 Nacos overlay 承载（sync cron / milvus / neo4j 等），一并并入 draft.config
      const text = gitShow(root, head, n) || "";
      const map = flattenYamlKeys(text);
      const keys = [];
      for (const [key, entry] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const row = {
          key,
          change: "added",
          value: entryValue(entry),
          comment: entryComment(entry),
          isLeaf: entry.isLeaf === true,
          jobs: isJobsKey(key),
          path: n,
          source: "nacos-overlay",
          layerSuppressed: false,
        };
        keys.push(row);
        if (row.jobs) jobKeys.push(row);
        else configKeys.push(row);
      }
      upsert({
        kinds: keys.some((k) => k.jobs) ? ["config", "jobs"] : ["config"],
        kind: "config",
        path: n,
        confidence: keys.length ? "key-diff" : "path",
        keys,
        detail: `first-release nacos overlay keys=${keys.length}`,
        layerSuppressed: false,
      });
    } else if (isApplicationYml(n) || isConfigPath(n)) {
      upsert({
        kinds: ["config"],
        kind: "config",
        path: n,
        confidence: "path",
        keys: [],
        detail: "first-release non-prod config → layer suppressed",
        layerSuppressed: true,
      });
    } else if (isJobsPath(n)) {
      upsert({
        kinds: ["jobs"],
        kind: "jobs",
        path: n,
        confidence: "path",
        keys: [],
        detail: "first-release jobs path → layer suppressed（枚举另计）",
        layerSuppressed: true,
      });
    }
  }

  for (const [name, code] of syncEnumMap.entries()) {
    if (!/^[A-Z][A-Z0-9_]+$/.test(name)) continue;
    const taskCode = typeof code === "string" && code.includes(":") ? code : null;
    if (!taskCode) continue;
    taskCodes.add(taskCode);
  }

  return {
    candidates: sortSqlCandidates([...byPath.values()]),
    configKeys,
    jobKeys,
    taskCodes: [...taskCodes].sort(),
  };
}

/** 增量：基线树上是否已有该 migration/键/task */
function computeBaselinePresence(root, base, { candidates, configKeys, jobKeys, taskCodes }) {
  const sqlScripts = [];
  const configKeyList = [];
  const jobIds = [];

  for (const c of candidates || []) {
    if (!c.kinds?.includes("sql") || !isMigrationSql(c.path)) continue;
    const text = gitShow(root, base, c.path);
    if (text != null) sqlScripts.push(baseName(c.path));
  }

  const ymlCache = new Map();
  const keysOf = (filePath) => {
    if (ymlCache.has(filePath)) return ymlCache.get(filePath);
    const text = gitShow(root, base, filePath);
    const map = flattenYamlKeys(text || "");
    ymlCache.set(filePath, map);
    return map;
  };

  for (const k of configKeys || []) {
    if (!k.path || !k.key) continue;
    const map = keysOf(k.path);
    if (map.has(k.key)) configKeyList.push(k.key);
  }
  for (const k of jobKeys || []) {
    if (k.path && k.key && keysOf(k.path).has(k.key)) jobIds.push(k.key);
    if (k.job?.taskCode) {
      /* taskCode 基线存在性：看 SyncTaskCode.java 是否仍含该字面量 */
    }
  }

  const syncPathCandidates = (candidates || [])
    .map((c) => c.path)
    .filter((p) => /SyncTaskCode/i.test(p || ""));
  let syncBaseText = "";
  if (syncPathCandidates.length) {
    syncBaseText = gitShow(root, base, syncPathCandidates[0]) || "";
  } else {
    syncBaseText =
      gitShow(root, base, "sms-ai/src/main/java/com/juneyaoair/msp/sms/ai/domain/enums/sync/SyncTaskCode.java") || "";
  }
  for (const t of taskCodes || []) {
    const code = typeof t === "string" ? t : t.taskCode || t;
    if (code && syncBaseText.includes(`"${code}"`)) jobIds.push(code);
  }
  for (const k of jobKeys || []) {
    if (k.job?.taskCode && syncBaseText.includes(`"${k.job.taskCode}"`)) jobIds.push(k.job.taskCode);
  }

  return {
    sqlScripts: [...new Set(sqlScripts)],
    configKeys: [...new Set(configKeyList)],
    jobIds: [...new Set(jobIds)],
  };
}

function enrichApplicationCandidate(root, base, head, filePath) {
  const beforeText = gitShow(root, base, filePath);
  const afterText = gitShow(root, head, filePath);
  const before = flattenYamlKeys(beforeText || "");
  const after = flattenYamlKeys(afterText || "");
  const keyDiff = diffKeyMaps(before, after);
  const kinds = new Set(["config"]);
  if (keyDiff.some((k) => k.jobs)) kinds.add("jobs");
  return {
    kinds: [...kinds],
    kind: "config",
    path: normPath(filePath),
    confidence: keyDiff.length ? "key-diff" : "path",
    keys: keyDiff,
    detail: keyDiff.length ? `${keyDiff.length} keys` : "yml touched; no flattenable key delta",
  };
}

function enrichJavaJobsCandidate(root, base, head, filePath, syncEnumMap) {
  const range = `${base}..${head}`;
  const diff = git(root, ["diff", range, "--", filePath]);
  const taskCodes = extractTaskCodesFromJavaDiff(diff.ok ? diff.stdout : "", syncEnumMap);
  const crons = extractCronFromJavaDiff(diff.ok ? diff.stdout : "");
  return {
    kinds: ["jobs"],
    kind: "jobs",
    path: normPath(filePath),
    confidence: taskCodes.length || crons.length ? "key-diff" : "path",
    keys: crons.map((c) => ({ key: `cron:${c}`, change: "added", jobs: true })),
    taskCodes,
    detail: taskCodes.length ? `taskCodes=${taskCodes.join(",")}` : crons.length ? "cron annotation" : "jobs path",
  };
}

function buildIncrementalCandidates(root, base, head, files) {
  const byPath = new Map();
  const configKeys = [];
  const jobKeys = [];
  const taskCodes = new Set();
  const syncEnumMap = loadSyncTaskCodeMap(root);

  function upsert(cand) {
    const p = cand.path;
    const prev = byPath.get(p);
    if (!prev) {
      byPath.set(p, cand);
      return;
    }
    const kinds = new Set([...(prev.kinds || []), ...(cand.kinds || [])]);
    prev.kinds = [...kinds];
    prev.kind = prev.kinds[0];
    prev.confidence =
      prev.confidence === "key-diff" || cand.confidence === "key-diff" ? "key-diff" : prev.confidence;
    prev.keys = [...(prev.keys || []), ...(cand.keys || [])];
    prev.taskCodes = [...new Set([...(prev.taskCodes || []), ...(cand.taskCodes || [])])];
    if (cand.detail) prev.detail = [prev.detail, cand.detail].filter(Boolean).join("; ");
  }

  for (const f of files) {
    const n = normPath(f);

    if (isMigrationSql(n) || isDbChangeSql(n)) {
      upsert({
        kinds: ["sql"],
        kind: "sql",
        path: n,
        confidence: "path",
        keys: [],
        detail: isMigrationSql(n) ? `V${migrationVersion(n)}` : "docs/_change.sql",
      });
    }

    if (isApplicationYml(n)) {
      const enriched = enrichApplicationCandidate(root, base, head, n);
      upsert(enriched);
      for (const k of enriched.keys || []) {
        const row = { ...k, path: n };
        if (k.jobs) jobKeys.push(row);
        else configKeys.push(row);
      }
      continue;
    }

    if (isConfigPath(n)) {
      upsert({
        kinds: ["config"],
        kind: "config",
        path: n,
        confidence: "path",
        keys: [],
        detail: "config path",
      });
    }

    if (isJobsPath(n)) {
      if (/\.java$/i.test(n)) {
        const enriched = enrichJavaJobsCandidate(root, base, head, n, syncEnumMap);
        upsert(enriched);
        for (const t of enriched.taskCodes || []) taskCodes.add(t);
        for (const k of enriched.keys || []) jobKeys.push({ ...k, path: n });
      } else {
        upsert({
          kinds: ["jobs"],
          kind: "jobs",
          path: n,
          confidence: "path",
          keys: [],
          detail: "jobs docs/path",
        });
      }
    }

    if (isThirdPartyPath(n) && !byPath.has(n)) {
      upsert({
        kinds: ["third-party"],
        kind: "third-party",
        path: n,
        confidence: "path",
        keys: [],
        detail: "third-party path",
      });
    }
  }

  return {
    candidates: sortSqlCandidates([...byPath.values()]),
    configKeys,
    jobKeys,
    taskCodes: [...taskCodes].sort(),
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-freeze.mjs --root <REPO> --base <ref> --head <ref> [--prior auto|none|<path>] [--prior-since <id|date>] [--format json|md|draft-md|audit-json|summary] [--out <file>]
  node release-freeze.mjs --root <REPO> --first-release --head <ref> [--prior auto|none|<path>] [--prior-since <id|date>] [--format json|md|draft-md|audit-json|summary] [--out <file>]
  node release-freeze.mjs --root <REPO> --base none --head <ref> [--format json|md|draft-md|audit-json|summary] [--out <file>]
  --prior        清单已收录：默认 auto（archive 全量并集，优先 artifacts.json）；none 关闭；或显式路径
  --prior-since  仅并入 identity/日期 ≥ 该前缀的 archive（与 --prior auto 合用）
  --format       json（默认）| md | draft-md（WritePlan 三章预览）| audit-json（audit 短摘要）| summary（一屏摘要，WritePlan 白话摘要主输入）
  --out <file>   落盘到文件（避免大 JSON 打 stdout；PowerShell 必用，规避 UTF-16 BOM）`);
    process.exit(0);
  }
  if (!args.head) {
    console.error("require --head");
    process.exit(1);
  }
  if (!args.firstRelease && !args.base) {
    console.error("require --base and --head, or --first-release --head");
    process.exit(1);
  }

  const head = args.head;
  const firstRelease = args.firstRelease;
  const range = firstRelease ? `首次发版:${head}` : `${args.base}..${head}`;

  // 全量 hash（%H）；ISO 作者时间 → Asia/Shanghai
  const logArgs = firstRelease
    ? ["log", "--format=%H|%an|%aI|%s", head]
    : ["log", "--format=%H|%an|%aI|%s", range];
  const log = git(args.root, logArgs);
  if (!log.ok) {
    console.error(log.stderr || "git log failed");
    process.exit(1);
  }

  const commits = parseLogLines(log.stdout);

  const merges = commits
    .filter((c) => /^Merge\b/i.test(c.subject) || guessSourceBranch(c.subject))
    .map((c) => ({
      hash: c.hash,
      subject: c.subject,
      source: guessSourceBranch(c.subject),
    }));
  const mergeSources = buildMergeSources(merges);
  const releaseSummaryLines = buildReleaseSummaryLines(commits, {
    recentFirst: firstRelease,
    mergeSources,
  });

  const names = firstRelease
    ? git(args.root, ["ls-tree", "-r", "--name-only", head])
    : git(args.root, ["diff", "--name-only", range]);
  if (!names.ok) {
    console.error(names.stderr || "git path listing failed");
    process.exit(1);
  }
  const files = names.stdout ? names.stdout.split(/\r?\n/).filter(Boolean) : [];
  const pathStats = {
    "sms-ai/": 0,
    "sms-ai-web/": 0,
    "docs/": 0,
    "db/migration": 0,
    其它: 0,
  };
  for (const f of files) {
    pathStats[pathBucket(f)] += 1;
  }

  const authorsMap = new Map();
  for (const c of commits) {
    authorsMap.set(c.author, (authorsMap.get(c.author) || 0) + 1);
  }
  const authors = [...authorsMap.entries()]
    .map(([author, n]) => ({ author, commits: n }))
    .sort((a, b) => b.commits - a.commits);

  const warnings = [];
  let candidates = [];
  let configKeys = [];
  let jobKeys = [];
  let taskCodes = [];
  let inventory = null;
  let candidatePolicy = "incremental-key-diff";

  if (firstRelease) {
    candidatePolicy = "first-release-layered";
    inventory = buildFirstReleaseInventory(files);
    const layered = buildFirstReleaseLayeredCandidates(args.root, head, files);
    candidates = layered.candidates;
    configKeys = layered.configKeys;
    jobKeys = layered.jobKeys;
    taskCodes = layered.taskCodes;
    warnings.push(
      `首次发版分层: commits=${commits.length} files=${files.length}; draft←migration+application-prod+SyncTaskCode；其余 layerSuppressed；inventory.migrationRange=${inventory.migrationRange}`
    );
  } else {
    const built = buildIncrementalCandidates(args.root, args.base, head, files);
    candidates = built.candidates;
    configKeys = built.configKeys;
    jobKeys = built.jobKeys;
    taskCodes = built.taskCodes;
  }

  const baselinePresence = firstRelease
    ? { sqlScripts: [], configKeys: [], jobIds: [] }
    : computeBaselinePresence(args.root, args.base, { candidates, configKeys, jobKeys, taskCodes });

  const gitlabUrl = buildGitlabUrl(args.root, {
    firstRelease,
    base: args.base,
    head,
  });

  if (!gitlabUrl) {
    warnings.push("未能从 origin 推导 GitLab URL");
  }

  const dataRaw = {
    ok: true,
    firstRelease,
    candidatePolicy,
    root: args.root,
    base: firstRelease ? null : args.base,
    head,
    range,
    gitlabUrl,
    commits,
    merges,
    mergeSources,
    pathStats,
    authors,
    releaseSummaryLines,
    timezone: TZ_CHINA,
    candidates,
    configKeys,
    jobKeys,
    taskCodes,
    inventory,
    commitsDisplay: displayPayload(commits, gitlabUrl, truncateCommits),
    mergesDisplay: mergeSourcesDisplayPayload(mergeSources),
    fileCount: files.length,
    warnings,
  };

  const data = enrichFreezePayload(args.root, dataRaw, {
    prior: args.prior,
    priorSince: args.priorSince,
    baselinePresence,
  });

  if (args.format === "md") {
    const out = toMd(data);
    if (args.out) fs.writeFileSync(args.out, out + "\n", "utf8"), console.log(`written ${args.out}`);
    else console.log(out);
  } else if (args.format === "draft-md") {
    const out = toDraftPreviewMd(data);
    if (args.out) fs.writeFileSync(args.out, out + "\n", "utf8"), console.log(`written ${args.out}`);
    else console.log(out);
  } else if (args.format === "audit-json") {
    const out = JSON.stringify(toAuditFreezeSummary(data), null, 2);
    if (args.out) fs.writeFileSync(args.out, out + "\n", "utf8"), console.log(`written ${args.out}`);
    else console.log(out);
  } else if (args.format === "summary") {
    const out = toFreezeSummary(data);
    if (args.out) fs.writeFileSync(args.out, out + "\n", "utf8"), console.log(`written ${args.out}`);
    else console.log(out);
  } else {
    const out = JSON.stringify(data, null, 2);
    if (args.out) fs.writeFileSync(args.out, out + "\n", "utf8"), console.log(`written ${args.out}`);
    else console.log(out);
  }
  if (data.overdueHardGate) process.exit(1);
}

main();
