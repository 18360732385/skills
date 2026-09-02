#!/usr/bin/env node
/**
 * release-note-merge — 将 freeze draft / Git 定版 写入发版单自动段
 *
 * Usage:
 *   node release-note-merge.mjs --root <REPO> --note <path> --freeze-json <file> [--dry-run]
 *   node release-note-merge.mjs --root <REPO> --note <path> --base <ref> --head <ref> [--prior auto] [--dry-run]
 *   node release-note-merge.mjs --root <REPO> --note <path> --first-release --head <ref> [--dry-run]
 *
 * 刷新：Git 定版两表（提交截断5·hash 前 8 位 / 合并来源 origin 归一·一句话）、上线摘要（分支级聚合）、
 * 数据库与 SQL、配置项（yml→YAML，注释在键上一行）、定时任务（← draft，不含 draftSuppressed）；
 * 目录包 jobs/ 生成单文件汇总清单（code/名称/cron/默认参数/引用链接），不再逐任务拷贝真相。
 * 保留：manual 段人工正文。
 * Exit 0=ok 1=error
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  nowChinaTime,
  gitEnvChina,
  buildMergeSources,
  buildReleaseSummaryLines,
  releaseSummaryMarkdown,
  shortCommitHash,
  identityFromBranch,
  formatConfigAsYamlMd,
  loadModuleBlurb,
  bundleLinkCell,
  matchH2,
  COMMIT_DISPLAY_MAX,
  COMMIT_DISPLAY_HEAD,
  COMMIT_DISPLAY_TAIL,
  H2,
  H3_GIT,
} from "./release-format.mjs";
import { buildArtifactsJson, loadJobsCatalog } from "./release-freeze-enrich.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    note: null,
    freezeJson: null,
    base: null,
    head: null,
    firstRelease: false,
    prior: "auto",
    priorSince: null,
    identity: null,
    releaseBranch: null,
    baseline: null,
    releaseDate: null,
    owner: null,
    status: "已定版",
    dryRun: false,
    bundleFiles: true,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--freeze-json") out.freezeJson = argv[++i];
    else if (a === "--base") out.base = argv[++i];
    else if (a === "--head") out.head = argv[++i];
    else if (a === "--first-release") out.firstRelease = true;
    else if (a === "--prior") out.prior = argv[++i] || "auto";
    else if (a === "--prior-since") out.priorSince = argv[++i] || null;
    else if (a === "--identity") out.identity = argv[++i];
    else if (a === "--release-branch") out.releaseBranch = argv[++i];
    else if (a === "--baseline") out.baseline = argv[++i];
    else if (a === "--release-date") out.releaseDate = argv[++i];
    else if (a === "--owner") out.owner = argv[++i];
    else if (a === "--status") out.status = argv[++i] || "已定版";
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--no-bundle-files") out.bundleFiles = false;
    else if (a === "--bundle-files") out.bundleFiles = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  if (out.base && ["none", "无", "-", "null"].includes(String(out.base).toLowerCase())) {
    out.firstRelease = true;
  }
  return out;
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function esc(v) {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function loadFreeze(args) {
  if (args.freezeJson) {
    const full = path.isAbsolute(args.freezeJson)
      ? args.freezeJson
      : path.join(args.root, args.freezeJson);
    const text = readText(full);
    if (!text) throw new Error(`cannot read --freeze-json ${full}`);
    return JSON.parse(text);
  }
  if (!args.head) throw new Error("require --freeze-json or --head (+ --base|--first-release)");
  const script = path.join(__dirname, "release-freeze.mjs");
  const cmd = ["--root", args.root, "--head", args.head, "--prior", args.prior, "--format", "json"];
  if (args.priorSince) cmd.push("--prior-since", args.priorSince);
  if (args.firstRelease) cmd.push("--first-release");
  else {
    if (!args.base) throw new Error("require --base with --head (or --first-release)");
    cmd.push("--base", args.base);
  }
  const r = spawnSync(process.execPath, [script, ...cmd], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "release-freeze.mjs failed");
  }
  return JSON.parse(r.stdout);
}

function displayRows(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.rows)) return payload.rows.filter((r) => !r.__omit__);
  if (Array.isArray(payload)) return payload;
  return [];
}

function buildGitSection(freeze) {
  const lines = [];
  const url = freeze.gitlabUrl || "<gitlabUrl>";
  const tz = freeze.timezone || "Asia/Shanghai";
  lines.push(`## ${H2.git}`);
  lines.push("");
  lines.push(
    `> 提交列表遵循 \`截断5\`（≤5 全量；>5 前 3 + \`…\` + 后 2；hash 取前 8 位）。合并来源按分支去重全量（\`origin/\` 前缀归一；来源分支功能为一句话中文总结）。时区：${tz}`
  );
  lines.push(`> 完整记录：${url}`);
  lines.push("");
  lines.push("<!-- auto:git:start -->");
  lines.push("");
  lines.push(`### ${H3_GIT.commits}`);
  lines.push("");
  lines.push("| hash | author | date | subject |");
  lines.push("|---|---|---|---|");
  const commitView = freeze.commitsDisplay?.rows
    ? { rows: freeze.commitsDisplay.rows, truncated: Boolean(freeze.commitsDisplay.truncated) }
    : truncateCommits(freeze.commits || []);
  if (!commitView.rows.length) lines.push("| — | — | — | （无） |");
  for (const c of commitView.rows) {
    if (c.__omit__) lines.push(`| … | … | … | （省略 ${c.omitted} 条） |`);
    else
      lines.push(
        `| ${esc(shortCommitHash(c.hash))} | ${esc(c.author)} | ${esc(c.date)} | ${esc(c.subject)} |`
      );
  }
  if (commitView.truncated) {
    lines.push("");
    lines.push(`> 完整记录请登录 GitLab 查看：${url}`);
  }
  lines.push("");
  lines.push(`### ${H3_GIT.merges}`);
  lines.push("");
  lines.push("| 推测来源分支 | 出现次数 | 来源分支功能 |");
  lines.push("|---|---|---|");
  const mergeRows =
    (freeze.mergeSources?.length ? freeze.mergeSources : null) ||
    (freeze.mergesDisplay?.rows?.length ? freeze.mergesDisplay.rows : null) ||
    buildMergeSources(freeze.merges);
  if (!mergeRows.length) lines.push("| — | 0 | 无 |");
  for (const m of mergeRows) {
    const summary = m.branchSummary || m.sampleSubject || m.subject || "";
    lines.push(`| ${esc(m.source || "无/未识别")} | ${m.count ?? 1} | ${esc(summary)} |`);
  }
  lines.push("");
  lines.push("<!-- auto:git:end -->");
  return lines.join("\n");
}

function truncateDisplay(rows, max, head, tail) {
  if (!rows || rows.length <= max) return { rows: rows || [], truncated: false };
  const omitted = rows.length - head - tail;
  return {
    rows: [...rows.slice(0, head), { __omit__: true, omitted }, ...rows.slice(-tail)],
    truncated: true,
  };
}

function truncateCommits(rows) {
  return truncateDisplay(rows, COMMIT_DISPLAY_MAX, COMMIT_DISPLAY_HEAD, COMMIT_DISPLAY_TAIL);
}

function buildSqlSection(draft) {
  const rows = draft?.sql || [];
  const lines = [];
  lines.push(`## ${H2.sql}`);
  lines.push("");
  lines.push("> 按 **SQL序**（`Vn` 数字升序；无版本号置后并注明依赖）填写执行序；目标 profile = `prod`。");
  lines.push("");
  lines.push("<!-- auto:sql:start -->");
  lines.push("");
  lines.push("| 执行序 | 脚本/版本 | 动作 | 目标 profile | 已确认 |");
  lines.push("|---|---|---|---|---|");
  if (!rows.length) lines.push("| — | 无 | 无 | prod | |");
  else {
    rows.forEach((r, i) => {
      lines.push(
        `| ${r.执行序 ?? i + 1} | ${esc(r.脚本)} | ${esc(r.动作 || "新增/变更")} | prod | ${esc(r.已确认 || "")} |`
      );
    });
  }
  lines.push("");
  lines.push("<!-- auto:sql:end -->");
  return lines.join("\n");
}

function buildConfigSection(freeze) {
  const rows = freeze.draft?.config || [];
  const lines = [];
  lines.push(`## ${H2.config}`);
  lines.push("");
  lines.push("> 允许含密文；来自 yml 的配置按 **YAML** 展示，键旁 `#` 为中文说明。目标 profile = `prod`。");
  lines.push("");
  lines.push("<!-- auto:config:start -->");
  lines.push("");
  lines.push(formatConfigAsYamlMd(rows));
  lines.push("");
  // 上线前必办：TODO 占位（防手工编造键）
  const todos = freeze.todoPlaceholders || [];
  if (todos.length) {
    lines.push(`> **上线前必办（TODO 占位 ${todos.length}）**：下列键值为 \`TODO_*\` 占位，须替换为生产真实连接（密文，窄例外已授权）后再上线。`);
    lines.push("");
    lines.push("| 键 | 来源 | 值 | 说明 |");
    lines.push("|---|---|---|---|");
    for (const t of todos) {
      lines.push(`| \`${esc(t.key)}\` | ${esc(t.path)} | \`${esc(t.value)}\` | ${esc(t.description || "待补")} |`);
    }
    lines.push("");
  }
  lines.push("<!-- auto:config:end -->");
  return lines.join("\n");
}

function buildJobsSection(freeze) {
  const rows = freeze.draft?.jobs || [];
  const lines = [];
  lines.push(`## ${H2.jobs}`);
  lines.push("");
  lines.push("> 目标 profile = `prod`。");
  lines.push("");
  lines.push("<!-- auto:jobs:start -->");
  lines.push("");
  lines.push("| task / cron 键 | 变更类型 | 说明 | 目标 profile | 已确认 |");
  lines.push("|---|---|---|---|---|");
  if (!rows.length) lines.push("| 无 | 无 | — | prod | |");
  else {
    for (const r of rows) {
      const key = r["task / cron 键"] || r.taskCode || "";
      const desc = [r.说明, r.taskCode && r.taskCode !== key ? `taskCode=${r.taskCode}` : "", r.真相]
        .filter(Boolean)
        .join(" · ");
      lines.push(
        `| ${esc(key)} | ${esc(r.变更类型 || "涉及")} | ${esc(desc)} | prod | ${esc(r.已确认 || "")} |`
      );
    }
  }
  lines.push("");
  if (rows.length) {
    lines.push("> 本版任务汇总清单（code / 名称 / cron 表达式 / 默认参数 / 引用链接）：[jobs/README.md](./jobs/README.md)");
    lines.push("");
  }
  // jobs ↔ config 交叉：有任务但 prod 配置无对应 cron 表达式键
  const gaps = freeze.jobsConfigGaps || [];
  if (gaps.length) {
    lines.push(`> **jobs ↔ config 交叉（${gaps.length} 个任务缺 cron 表达式键）**：下列任务的 cron 表达式键未在 prod 配置（application-prod.yml / Nacos overlay）中找到，可能由 Nacos DataId 提供，或本次未随 prod yml 上线；请勿手工编造键值。`);
    lines.push("");
    lines.push("| taskCode | cron 键 | 真相 | 说明 |");
    lines.push("|---|---|---|---|");
    for (const g of gaps) {
      lines.push(`| ${esc(g.taskCode || "—")} | \`${esc(g.cronKey)}\` | ${esc(g.truthPath || "—")} | ${esc(g.displayName || "—")} |`);
    }
    lines.push("");
  }
  lines.push("<!-- auto:jobs:end -->");
  return lines.join("\n");
}

function buildSummaryInner(freeze) {
  const lines = freeze.releaseSummaryLines?.length
    ? freeze.releaseSummaryLines.slice(0, 5)
    : buildReleaseSummaryLines(freeze.commits || [], { mergeSources: freeze.mergeSources });
  return releaseSummaryMarkdown(lines);
}

/** 确保元信息章内含 auto:summary 标记；剥离旧「## …上线内容摘要」独立章 */
function ensureSummaryInMeta(text) {
  let out = String(text);
  let preservedManual = "";
  const oldSummaryStart = (() => {
    const lines = out.split(/\r?\n/);
    return lines.findIndex((l) => matchH2(l, "上线内容摘要"));
  })();
  if (oldSummaryStart >= 0) {
    const lines = out.split(/\r?\n/);
    let end = lines.length;
    for (let i = oldSummaryStart + 1; i < lines.length; i++) {
      if (/^##\s/.test(lines[i])) {
        end = i;
        break;
      }
    }
    const chunk = lines.slice(oldSummaryStart, end).join("\n");
    const m = chunk.match(/<!--\s*manual:start\s*-->([\s\S]*?)<!--\s*manual:end\s*-->/i);
    if (m) preservedManual = m[1].trim();
    out = [...lines.slice(0, oldSummaryStart), ...lines.slice(end)].join("\n");
  }

  if (out.includes("<!-- auto:summary:start -->")) {
    return out;
  }

  const lines = out.split(/\r?\n/);
  const metaIdx = lines.findIndex((l) => matchH2(l, "元信息") || matchH2(l, H2.meta));
  if (metaIdx < 0) return out;

  let insertAt = lines.length;
  for (let i = metaIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      insertAt = i;
      break;
    }
  }
  const block = [
    "",
    "### 上线内容摘要（1～5 项）",
    "",
    "<!-- auto:summary:start -->",
    "",
    "（本版做什么）",
    "",
    "<!-- auto:summary:end -->",
  ];
  if (preservedManual) {
    block.push("", "<!-- manual:start -->", "", preservedManual, "", "<!-- manual:end -->");
  }
  block.push("");
  return [...lines.slice(0, insertAt), ...block, ...lines.slice(insertAt)].join("\n");
}

/** 将一级章标题对齐到当前 H2 编号（兼容旧「上线内容摘要」独立章移除后的错位） */
function normalizeSectionHeadings(text) {
  const map = [
    ["元信息", H2.meta],
    ["Git 定版", H2.git],
    ["涉及服务与模块", H2.services],
    ["数据库与 SQL", H2.sql],
    ["配置项", H2.config],
    ["定时任务", H2.jobs],
    ["包内附属文件", H2.bundle],
    ["第三方与外部依赖", H2.third],
    ["上线步骤与回滚", H2.steps],
    ["风险与验收", H2.risk],
    ["附录：关联契约与规划（可选）", H2.appendix],
    ["附录", H2.appendix],
  ];
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const [bare, titled] of map) {
      if (matchH2(lines[i], bare) || matchH2(lines[i], titled)) {
        lines[i] = `## ${titled}`;
        break;
      }
    }
  }
  return lines.join("\n");
}

function replaceMarked(text, name, bodyInner) {
  const start = `<!-- auto:${name}:start -->`;
  const end = `<!-- auto:${name}:end -->`;
  if (text.includes(start) && text.includes(end)) {
    const re = new RegExp(
      `${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`,
      "m"
    );
    return text.replace(re, `${start}\n\n${bodyInner.trim()}\n\n${end}`);
  }
  return null;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 替换 ## 标题整节（到下一个 ##）；兼容「一、」编号前缀 */
function replaceHeadingSection(text, headingLine, newSection) {
  const lines = String(text).split(/\r?\n/);
  const start = lines.findIndex((l) => matchH2(l, headingLine));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const next = [
    ...lines.slice(0, start),
    ...String(newSection).trim().split(/\r?\n/),
    "",
    ...lines.slice(end),
  ];
  return next.join("\n");
}

function applySections(text, freeze) {
  let out = ensureSummaryInMeta(text);
  out = normalizeSectionHeadings(out);
  const draft = freeze.draft || { sql: [], config: [], jobs: [] };

  const gitFull = buildGitSection(freeze);
  const sqlFull = buildSqlSection(draft);
  const configFull = buildConfigSection(freeze);
  const jobsFull = buildJobsSection(freeze);
  const summaryInner = buildSummaryInner(freeze);

  let marked = replaceMarked(out, "summary", summaryInner);
  if (marked != null) out = marked;

  const gitInner = gitFull
    .replace(/^##[^\n]*[\s\S]*?<!-- auto:git:start -->\n*/, "")
    .replace(/\n*<!-- auto:git:end -->[\s\S]*$/, "");
  const sqlInner = sqlFull.replace(/^[\s\S]*?<!-- auto:sql:start -->\n*/, "").replace(/\n*<!-- auto:sql:end -->[\s\S]*$/, "");
  const configInner = configFull.replace(/^[\s\S]*?<!-- auto:config:start -->\n*/, "").replace(/\n*<!-- auto:config:end -->[\s\S]*$/, "");
  const jobsInner = jobsFull.replace(/^[\s\S]*?<!-- auto:jobs:start -->\n*/, "").replace(/\n*<!-- auto:jobs:end -->[\s\S]*$/, "");

  marked = replaceMarked(out, "git", gitInner);
  if (marked != null) out = marked;
  else {
    const r = replaceHeadingSection(out, "Git 定版", gitFull);
    if (r != null) out = r;
  }

  marked = replaceMarked(out, "sql", sqlInner);
  if (marked != null) out = marked;
  else {
    const r = replaceHeadingSection(out, "数据库与 SQL", sqlFull);
    if (r != null) out = r;
  }

  marked = replaceMarked(out, "config", configInner);
  if (marked != null) out = marked;
  else {
    const r = replaceHeadingSection(out, "配置项", configFull);
    if (r != null) out = r;
  }

  marked = replaceMarked(out, "jobs", jobsInner);
  if (marked != null) out = marked;
  else {
    const r = replaceHeadingSection(out, "定时任务", jobsFull);
    if (r != null) out = r;
  }

  return out;
}

/** 发版日期：优先显式 --release-date；兼容旧 identity 日期前缀（YYYY-MM-DD-*）；兜底今日（上海） */
function resolveReleaseDate(meta) {
  if (meta.releaseDate && /\d{4}-\d{2}-\d{2}/.test(meta.releaseDate)) {
    return meta.releaseDate.match(/\d{4}-\d{2}-\d{2}/)[0];
  }
  const m = String(meta.identity || "").match(/^(\d{4}-\d{2}-\d{2})-/);
  if (m) return m[1];
  return nowChinaTime().slice(0, 10);
}

function skeletonNote(meta) {
  const id = meta.identity;
  const date = resolveReleaseDate(meta);
  const baseline = meta.baseline ?? "main";
  const range =
    baseline === "无" || meta.firstRelease
      ? `首次发版:${meta.head || "HEAD"}`
      : `origin/${meta.releaseBranch || "release"} .. origin/${baseline}`;
  return `# 发版单：${id}

> 状态：${meta.status}
> 发版日期：${date}
> 发版分支：${meta.releaseBranch || "release"} · 基线分支：${baseline === "无" ? "无" : baseline}（首次发版填「无」）
> 定版引用：${range}
> 定版时间：${meta.freezeTime}（Asia/Shanghai）
> 负责人：${meta.owner || ""}

## ${H2.meta}

| 项 | 值 |
|---|---|
| 版本身份 | ${id} |
| 发版日期 | ${date} |
| 发版分支 | ${meta.releaseBranch || "release"} |
| 基线分支 | ${baseline === "无" ? "无" : baseline} |
| 定版时间 | ${meta.freezeTime} |
| 状态 | ${meta.status} |
| 上线日期 | （seal 时填；可与发版日期相同） |
| 上线执行人 | （seal 时填） |

### 上线内容摘要（1～5 项）

<!-- auto:summary:start -->

（本版做什么）

<!-- auto:summary:end -->

## ${H2.git}

> 提交列表遵循 \`截断5\`（前 3 后 2；hash 取前 8 位）；合并来源按分支去重全量（\`origin/\` 归一；来源分支功能一句话）。时区：Asia/Shanghai
> 完整记录：

<!-- auto:git:start -->

<!-- auto:git:end -->

## ${H2.services}

| 服务/模块 | 是否涉及 | 说明 |
|---|---|---|
| sms-ai | | |
| sms-ai-web | | |
| 其它 | | |

## ${H2.sql}

> 按 **SQL序**；目标 profile = \`prod\`。

<!-- auto:sql:start -->

<!-- auto:sql:end -->

## ${H2.config}

> 目标 profile = \`prod\`；yml 来源按 YAML 格式展示。

<!-- auto:config:start -->

<!-- auto:config:end -->

## ${H2.jobs}

> 目标 profile = \`prod\`。

<!-- auto:jobs:start -->

<!-- auto:jobs:end -->

## ${H2.bundle}

<!-- auto:bundle:start -->

| 类别 | 包内路径 | 仓库源路径 |
|---|---|---|
| — | 无 | — |

<!-- auto:bundle:end -->

## ${H2.third}

| 依赖 | 变更说明 | 已确认 |
|---|---|---|
| | 无 | |

## ${H2.steps}

<!-- manual:start -->

### 1、步骤

1. …

### 2、回滚

- …

<!-- manual:end -->

## ${H2.risk}

<!-- manual:start -->

### 1、风险

- …

### 2、验收

- [ ] …

<!-- manual:end -->

## ${H2.appendix}

| 类型 | 路径 |
|---|---|
| func/api/db/jobs | |
| superpowers | |
`;
}

function patchMeta(text, meta) {
  let out = text;
  if (meta.status) {
    out = out.replace(/(> 状态：)[^\n]*/, `$1${meta.status}`);
    out = out.replace(/(\| 状态 \| )[^|]*/, `$1${meta.status} `);
  }
  if (meta.freezeTime) {
    out = out.replace(/(> 定版时间：)[^\n]*/, `$1${meta.freezeTime}`);
    out = out.replace(/(\| 定版时间 \| )[^|]*/, `$1${meta.freezeTime} `);
  }
  if (meta.owner) {
    out = out.replace(/(> 负责人：)[^\n]*/, `$1${meta.owner}`);
  }
  if (meta.identity) {
    const date = resolveReleaseDate(meta);
    out = out.replace(/(> 发版日期：)[^\n]*/, `$1${date}`);
    out = out.replace(/(\| 版本身份 \| )[^|]*/, `$1${meta.identity} `);
    out = out.replace(/(\| 发版日期 \| )[^|]*/, `$1${date} `);
  }
  if (freezeRangeLine(meta)) {
    out = out.replace(/(> 定版引用：)[^\n]*/, `$1${freezeRangeLine(meta)}`);
  }
  return out;
}

function freezeRangeLine(meta) {
  if (meta.firstRelease || meta.baseline === "无") {
    return `首次发版:${meta.head || "HEAD"}`;
  }
  if (meta.range) return meta.range;
  return null;
}

function inferServices(root, freeze) {
  const stats = freeze.pathStats || {};
  const rows = [
    ["sms-ai", (stats["sms-ai/"] || 0) > 0 ? "是" : "否", loadModuleBlurb(root, "sms-ai")],
    ["sms-ai-web", (stats["sms-ai-web/"] || 0) > 0 ? "是" : "否", loadModuleBlurb(root, "sms-ai-web")],
    [
      "其它",
      (stats["其它"] || 0) > 0 || (stats["docs/"] || 0) > 0 ? "是" : "否",
      loadModuleBlurb(root, "其它"),
    ],
  ];
  const block = [
    `## ${H2.services}`,
    "",
    "| 服务/模块 | 是否涉及 | 说明 |",
    "|---|---|---|",
    ...rows.map((r) => `| ${r[0]} | ${r[1]} | ${esc(r[2])} |`),
  ].join("\n");
  return block;
}

/**
 * 规范化为目录包路径：notes/{identity}/{identity}.md
 * 若传入旧扁平 notes/{identity}.md 或目录 notes/{identity}/，均解析为夹内同名 md。
 */
function resolveNoteBundle(root, noteArg, identityHint) {
  const abs = path.isAbsolute(noteArg) ? noteArg : path.join(root, noteArg);
  const rel = path.relative(root, abs).replace(/\\/g, "/");
  let identity = identityHint;
  let notePath = abs;

  if (rel.match(/docs\/releases\/notes\/[^/]+\/[^/]+\.md$/i)) {
    identity = identity || path.basename(abs, ".md");
    notePath = abs;
  } else if (rel.match(/docs\/releases\/notes\/[^/]+\.md$/i)) {
    identity = identity || path.basename(abs, ".md");
    notePath = path.join(root, "docs", "releases", "notes", identity, `${identity}.md`);
  } else if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    identity = identity || path.basename(abs);
    notePath = path.join(abs, `${identity}.md`);
  } else if (identity) {
    notePath = path.join(root, "docs", "releases", "notes", identity, `${identity}.md`);
  } else {
    identity = path.basename(abs).replace(/\.md$/i, "") || "unknown";
    notePath = path.join(root, "docs", "releases", "notes", identity, `${identity}.md`);
  }

  const bundleDir = path.dirname(notePath);
  return {
    identity,
    notePath,
    bundleDir,
    relNote: path.relative(root, notePath).replace(/\\/g, "/"),
    relBundle: path.relative(root, bundleDir).replace(/\\/g, "/"),
  };
}

function gitShow(root, ref, filePath) {
  const norm = String(filePath).replace(/\\/g, "/");
  const r = spawnSync("git", ["-C", root, "show", `${ref}:${norm}`], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    env: gitEnvChina(),
  });
  if (r.status !== 0) return null;
  return r.stdout;
}

function shortHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16).slice(0, 6);
}

function uniqueDestName(destDir, baseName, used) {
  let name = baseName;
  if (!used.has(name.toLowerCase())) {
    used.add(name.toLowerCase());
    return name;
  }
  const ext = path.extname(baseName);
  const stem = path.basename(baseName, ext);
  name = `${stem}__${shortHash(baseName)}${ext}`;
  used.add(name.toLowerCase());
  return name;
}

/** 仅 migration 脚本进 sql/（不含 docs/_change.sql 等对照件） */
function isBundleMigrationSql(filePath) {
  const n = String(filePath || "").replace(/\\/g, "/");
  const base = path.basename(n);
  return /\/db\/migration\/V\d+__.+\.sql$/i.test(n) || (/^V\d+__.+\.sql$/i.test(base) && n.includes("db/migration"));
}

/**
 * 目录包附属路径：只收本版 draft 中的「新增」制品，不收 candidates 扫描到的涉及文件。
 * - sql：draft.sql 中的 migration
 * - config：draft.config 且 变更=added 的来源文件
 * - jobs：不拷贝逐任务真相，改由 buildJobsSummaryMd 生成单文件汇总清单（jobs/README.md）
 */
function collectDraftBundlePaths(freeze) {
  const draft = freeze.draft || {};
  const sqlPaths = new Set();
  for (const r of draft.sql || []) {
    const p = r.路径 ? String(r.路径).replace(/\\/g, "/") : "";
    if (p && isBundleMigrationSql(p)) sqlPaths.add(p);
  }

  const configPaths = new Set();
  for (const r of draft.config || []) {
    if (String(r.变更 || "") !== "added") continue;
    if (r.来源) configPaths.add(String(r.来源).replace(/\\/g, "/"));
  }

  return {
    sql: [...sqlPaths],
    config: [...configPaths],
    jobs: [],
  };
}

/** 从任务真相 md 正文抽取汇总列（task_code / 显示名 / 默认表达式 / 默认参数 / 配置键） */
function parseJobTruthText(text) {
  if (!text) return null;
  const grab = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };
  const defaultDays = grab(/\|\s*defaultDays\s*\|\s*([^|]+)\|/i);
  const defaultHours = grab(/\|\s*defaultHours\s*\|\s*([^|]+)\|/i);
  const params = [];
  if (defaultDays != null && defaultDays !== "" && defaultDays !== "—") params.push(`days=${defaultDays}`);
  if (defaultHours != null && defaultHours !== "" && defaultHours !== "—") params.push(`hours=${defaultHours}`);
  return {
    taskCode: grab(/\|\s*task_code\s*\|\s*`([^`]+)`/),
    displayName: grab(/\|\s*显示名\s*\|\s*([^|]+)\|/),
    defaultCron: grab(/\|\s*默认表达式\s*\|\s*`([^`]+)`/),
    cronKey: grab(/\|\s*配置键\s*\|\s*`([^`]+)`/),
    defaultParams: params.length ? params.join("，") : "—",
  };
}

/**
 * 定时任务汇总清单（单文件）：覆盖本版 draft.jobs 全部任务。
 * 列：code / 名称 / cron 表达式 / 默认参数 / 引用文件（相对链接，指向 docs/jobs 真相 SSOT）。
 * 数据优先级：head 树真相文档 → 磁盘 docs/jobs 目录 → draft 行自有字段。
 */
function buildJobsSummaryMd(root, freeze, head) {
  const rows = freeze.draft?.jobs || [];
  if (!rows.length) return null;
  const diskCatalog = loadJobsCatalog(root);
  const seen = new Set();
  const table = [];
  for (const r of rows) {
    const key = r["task / cron 键"] || r.taskCode || "";
    const truth = r.真相 ? String(r.真相).replace(/\\/g, "/") : "";
    const dedupKey = r.taskCode || key || truth;
    if (dedupKey && seen.has(dedupKey)) continue;
    if (dedupKey) seen.add(dedupKey);

    let info = truth ? parseJobTruthText(head ? gitShow(root, head, truth) : null) : null;
    if (!info && truth) info = parseJobTruthText(readText(path.join(root, truth)));
    const disk =
      (r.taskCode && diskCatalog.byTaskCode.get(r.taskCode)) ||
      (key && diskCatalog.byCronKey.get(key)) ||
      (truth && diskCatalog.bySlugFile.get(path.basename(truth))) ||
      null;

    const code = info?.taskCode || r.taskCode || disk?.taskCode || key || "—";
    const name = info?.displayName || r.说明 || disk?.displayName || "—";
    const cron = info?.defaultCron || disk?.defaultCron || "—";
    const params = info?.defaultParams || "—";
    const link = truth
      ? `[${path.basename(truth)}](../../../../${truth.replace(/^docs\//, "")})`
      : "（待补）";
    table.push({ code, name, cron, params, link });
  }
  if (!table.length) return null;

  const lines = [];
  lines.push(`# 定时任务清单（本版 ${table.length} 项）`);
  lines.push("");
  lines.push(
    `> 生成：${nowChinaTime()}（Asia/Shanghai）；目标 profile = \`prod\`。引用文件指向仓库 \`docs/jobs/tasks/\` 真相（SSOT），调度契约以真相为准。`
  );
  lines.push("");
  lines.push("| code | 名称 | cron 表达式 | 默认参数 | 引用文件 |");
  lines.push("|---|---|---|---|---|");
  for (const t of table) {
    lines.push(
      `| \`${esc(t.code)}\` | ${esc(t.name)} | \`${esc(t.cron)}\` | ${esc(t.params)} | ${t.link} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** 刷新前清空 sql/config/jobs，避免上次 candidates 污染残留 */
function resetBundleKindDirs(bundleDir) {
  for (const kind of ["sql", "config", "jobs"]) {
    const dir = path.join(bundleDir, kind);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
  }
}

/**
 * 从 head 拷贝本版新增制品到 bundleDir/{sql,config}/（← draft 新增；不含 candidates）；
 * jobs/ 不拷贝真相文档，生成单文件汇总清单 `jobs/README.md`（← draft.jobs 全量任务）。
 */
function copyBundleFiles(root, bundleDir, freeze, head) {
  const warnings = [];
  const copied = [];
  if (!head) {
    warnings.push("无 head ref，跳过附属文件拷贝");
    return { copied, warnings };
  }

  resetBundleKindDirs(bundleDir);

  const groups = Object.entries(collectDraftBundlePaths(freeze));

  for (const [kind, paths] of groups) {
    if (!paths.length) continue;
    const destDir = path.join(bundleDir, kind);
    fs.mkdirSync(destDir, { recursive: true });
    const used = new Set();
    for (const src of paths) {
      const content = gitShow(root, head, src);
      if (content == null) {
        warnings.push(`无法从 ${head} 读取 ${src}`);
        continue;
      }
      const destName = uniqueDestName(destDir, path.basename(src), used);
      const dest = path.join(destDir, destName);
      fs.writeFileSync(dest, content, "utf8");
      copied.push({
        kind,
        bundlePath: `${kind}/${destName}`,
        sourcePath: src,
      });
    }
  }

  const jobsSummary = buildJobsSummaryMd(root, freeze, head);
  if (jobsSummary) {
    const destDir = path.join(bundleDir, "jobs");
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, "README.md"), jobsSummary + "\n", "utf8");
    copied.push({
      kind: "jobs",
      bundlePath: "jobs/README.md",
      sourcePath: `docs/jobs/tasks/（汇总 ${(freeze.draft?.jobs || []).length} 项）`,
    });
  }
  return { copied, warnings };
}

function buildBundleSection(copied) {
  const lines = [];
  lines.push(`## ${H2.bundle}`);
  lines.push("");
  lines.push("> 定版时仅拷贝本版 **新增** 制品到 `sql/` / `config/`（← draft：migration / 变更=added 的配置来源；**不含** candidates 扫描到的涉及文件）；`jobs/` 为单文件汇总清单 `README.md`（← draft.jobs；不逐任务拷贝真相）。包内路径为相对本发版单的 Markdown 链接。");
  lines.push("");
  lines.push("<!-- auto:bundle:start -->");
  lines.push("");
  lines.push("| 类别 | 包内路径 | 仓库源路径 |");
  lines.push("|---|---|---|");
  if (!copied.length) lines.push("| — | 无 | — |");
  else {
    for (const c of copied) {
      lines.push(`| ${esc(c.kind)} | ${bundleLinkCell(c.bundlePath)} | \`${esc(c.sourcePath)}\` |`);
    }
  }
  lines.push("");
  lines.push("<!-- auto:bundle:end -->");
  return lines.join("\n");
}

function applyBundleSection(text, copied) {
  const full = buildBundleSection(copied);
  const inner = full
    .replace(/^[\s\S]*?<!-- auto:bundle:start -->\n*/, "")
    .replace(/\n*<!-- auto:bundle:end -->[\s\S]*$/, "");
  const marked = replaceMarked(text, "bundle", inner);
  if (marked != null) return marked;
  const replaced = replaceHeadingSection(text, "包内附属文件", full);
  if (replaced != null) return replaced;
  // 插在「第三方」之前
  const insertAt = (() => {
    const lines = text.split(/\r?\n/);
    const i = lines.findIndex((l) => matchH2(l, "第三方与外部依赖"));
    if (i < 0) return -1;
    // reconstruct offset
    let off = 0;
    for (let j = 0; j < i; j++) off += lines[j].length + 1;
    return off;
  })();
  if (insertAt >= 0) {
    return `${text.slice(0, insertAt).trimEnd()}\n\n${full}\n\n${text.slice(insertAt)}`;
  }
  return `${text.trimEnd()}\n\n${full}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-note-merge.mjs --root <REPO> --note <path> --freeze-json <file> [--dry-run]
  node release-note-merge.mjs --root <REPO> --note <path> --base <ref> --head <ref> [--prior auto] [--dry-run]
  node release-note-merge.mjs --root <REPO> --note <path> --first-release --head <ref> [--dry-run]
Options: --identity --release-branch --baseline --release-date --owner --status --no-bundle-files
Note path: docs/releases/notes/{identity}/{identity}.md（目录包；扁平 .md 会规范化）
identity 约定：发版分支名（去 origin/ 前缀、/ → -），如 release-V260827；发版日期经 --release-date 传入`);
    process.exit(0);
  }
  if (!args.note) {
    console.error("require --note");
    process.exit(1);
  }

  const freeze = loadFreeze(args);
  const noteBase = path.basename(String(args.note).replace(/[/\\]$/, "")).replace(/\.md$/i, "");
  // 版本身份：显式 --identity 优先；note 路径占位于语义名（release/含日期前缀的旧约定）时按发版分支派生
  const identityHint =
    args.identity ||
    (args.releaseBranch && (!noteBase || noteBase === "notes" || noteBase === ".")
      ? identityFromBranch(args.releaseBranch)
      : noteBase);
  const bundle = resolveNoteBundle(args.root, args.note, identityHint);
  const notePath = bundle.notePath;
  const identity = bundle.identity;

  const meta = {
    identity,
    status: args.status,
    owner: args.owner || "",
    releaseBranch: args.releaseBranch || "release",
    baseline: args.firstRelease || freeze.firstRelease ? "无" : args.baseline || "main",
    releaseDate: args.releaseDate || null,
    firstRelease: args.firstRelease || freeze.firstRelease,
    head: args.head || freeze.head,
    range: freeze.range,
    freezeTime: nowChinaTime(),
  };

  let text = readText(notePath);
  // 兼容读旧扁平 notes/{id}.md
  if (!text) {
    const flat = path.join(args.root, "docs", "releases", "notes", `${identity}.md`);
    text = readText(flat);
  }
  if (!text) {
    text = skeletonNote(meta);
  }

  text = patchMeta(text, meta);
  text = applySections(text, freeze);

  const svc = inferServices(args.root, freeze);
  const svcReplaced = replaceHeadingSection(text, "涉及服务与模块", svc);
  if (svcReplaced != null) text = svcReplaced;

  let bundleResult = { copied: [], warnings: [] };
  if (args.dryRun) {
    const planCopied = args.bundleFiles ? planBundleFiles(freeze) : [];
    text = applyBundleSection(text, planCopied);
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          note: bundle.relNote,
          bundle: bundle.relBundle,
          artifacts: `${bundle.relBundle}/artifacts.json`,
          draft: {
            sql: freeze.draft?.sql?.length || 0,
            config: freeze.draft?.config?.length || 0,
            jobs: freeze.draft?.jobs?.length || 0,
          },
          changeObjects: freeze.changeObjects?.length || 0,
          bundleFiles: planCopied.length,
          prior: freeze.priorRelease?.path || null,
          todoPlaceholders: freeze.todoPlaceholders?.length || 0,
          jobsConfigGaps: freeze.jobsConfigGaps?.length || 0,
          indexDrift: freeze.indexDrift?.length || 0,
          bytes: Buffer.byteLength(text, "utf8"),
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  if (args.bundleFiles) {
    fs.mkdirSync(bundle.bundleDir, { recursive: true });
    bundleResult = copyBundleFiles(args.root, bundle.bundleDir, freeze, meta.head);
    text = applyBundleSection(text, bundleResult.copied);
  }

  // artifacts.json SSOT（允许密文值；不做密文拦截）
  const artifacts = buildArtifactsJson(identity, freeze);
  const artifactsPath = path.join(bundle.bundleDir, "artifacts.json");
  fs.mkdirSync(bundle.bundleDir, { recursive: true });
  fs.writeFileSync(artifactsPath, JSON.stringify(artifacts, null, 2), "utf8");

  fs.mkdirSync(path.dirname(notePath), { recursive: true });
  fs.writeFileSync(notePath, text, "utf8");
  console.log(
    JSON.stringify(
      {
        ok: true,
        written: bundle.relNote,
        bundle: bundle.relBundle,
        artifacts: path.relative(args.root, artifactsPath).replace(/\\/g, "/"),
        draft: {
          sql: freeze.draft?.sql?.length || 0,
          config: freeze.draft?.config?.length || 0,
          jobs: freeze.draft?.jobs?.length || 0,
        },
        changeObjects: freeze.changeObjects?.length || 0,
        bundleFiles: bundleResult.copied.length,
        warnings: bundleResult.warnings,
        prior: freeze.priorRelease?.path || null,
        todoPlaceholders: freeze.todoPlaceholders?.length || 0,
        jobsConfigGaps: freeze.jobsConfigGaps?.length || 0,
        indexDrift: freeze.indexDrift?.length || 0,
      },
      null,
      2
    )
  );
}

function planBundleFiles(freeze) {
  const groups = collectDraftBundlePaths(freeze);
  const out = [];
  for (const [kind, paths] of Object.entries(groups)) {
    for (const src of paths) {
      out.push({
        kind,
        bundlePath: `${kind}/${path.basename(src)}`,
        sourcePath: src,
      });
    }
  }
  if ((freeze.draft?.jobs || []).length) {
    out.push({
      kind: "jobs",
      bundlePath: "jobs/README.md",
      sourcePath: `docs/jobs/tasks/（汇总 ${freeze.draft.jobs.length} 项）`,
    });
  }
  return out;
}

try {
  main();
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}

