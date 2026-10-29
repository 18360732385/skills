/**
 * Consumer `scripts/agent-config/sync.mjs` vs skill `templates/agent-config/sync.mjs.tmpl`
 * freshness (0.6.3+). Marker must appear in BOTH the skill tmpl and instantiated script.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { findHarnessMetaFile } from "./harness-meta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SKILL_ROOT = path.resolve(__dirname, "..");

export const SYNC_TMPL_REL = "templates/agent-config/sync.mjs.tmpl";
export const CONSUMER_SYNC_REL = "scripts/agent-config/sync.mjs";

export const SYNC_TMPL_ID_RE = /HARNESS_SYNC_TMPL_ID:\s*(\S+)/;
export const HARNESS_ENG_VERSION_RE = /HARNESS_ENG_VERSION:\s*(\S+)/;

export function readMarker(text, re = SYNC_TMPL_ID_RE) {
  const m = String(text || "").match(re);
  if (!m) return null;
  return String(m[1]).replace(/^["'`]+/, "").replace(/["'`]+$/, "");
}

export function compareSyncFreshness(targetRoot, skillRoot = DEFAULT_SKILL_ROOT) {
  const tmplPath = path.join(skillRoot, ...SYNC_TMPL_REL.split("/"));
  const consumerPath = path.join(targetRoot, ...CONSUMER_SYNC_REL.split("/"));
  const tmplExists = fs.existsSync(tmplPath);
  const consumerExists = fs.existsSync(consumerPath);
  if (!consumerExists) {
    return {
      status: "skip",
      reason: "no-consumer-sync",
      tmplPath,
      consumerPath,
      skillId: null,
      consumerId: null,
    };
  }
  if (!tmplExists) {
    return {
      status: "error",
      reason: "no-skill-tmpl",
      tmplPath,
      consumerPath,
      skillId: null,
      consumerId: null,
    };
  }
  const tmplText = fs.readFileSync(tmplPath, "utf8");
  const consumerText = fs.readFileSync(consumerPath, "utf8");
  const skillId = readMarker(tmplText);
  const consumerId = readMarker(consumerText);
  const skillVer = readMarker(tmplText, HARNESS_ENG_VERSION_RE);
  const consumerVer = readMarker(consumerText, HARNESS_ENG_VERSION_RE);
  if (!skillId) {
    return {
      status: "error",
      reason: "tmpl-missing-marker",
      tmplPath,
      consumerPath,
      skillId,
      consumerId,
      skillVer,
      consumerVer,
    };
  }
  if (!consumerId || consumerId !== skillId) {
    return {
      status: "stale",
      reason: consumerId ? "marker-mismatch" : "consumer-missing-marker",
      tmplPath,
      consumerPath,
      skillId,
      consumerId,
      skillVer,
      consumerVer,
    };
  }
  return {
    status: "fresh",
    reason: "ok",
    tmplPath,
    consumerPath,
    skillId,
    consumerId,
    skillVer,
    consumerVer,
  };
}

export function formatFreshnessMessage(report, targetRoot) {
  const root = targetRoot || "<TARGET>";
  if (report.status === "error" && report.reason === "no-skill-tmpl") {
    return (
      "harness: 找不到 skill templates/agent-config/sync.mjs.tmpl，无法做 freshness 对照。请从技能根执行 scripts/harness.mjs。\n"
    );
  }
  if (report.status === "error" && report.reason === "tmpl-missing-marker") {
    return "harness: skill templates/agent-config/sync.mjs.tmpl 缺少 HARNESS_SYNC_TMPL_ID 标记。\n";
  }
  return [
    `harness: scripts/agent-config/sync.mjs 落后于 skill 模板（消费仓 HARNESS_SYNC_TMPL_ID=${report.consumerId || "(无)"}，skill tmpl=${report.skillId || "(无)"}）。`,
    "静默过期会导致 Trae FM strip 等旧行为。刷新步骤：",
    "  1. land / upgrade（L5）重渲 artifact `agent-config-sync`，或把 `templates/agent-config/sync.mjs.tmpl` 渲染/复制为 `scripts/agent-config/sync.mjs`",
    "  2. 在目标仓执行：node scripts/agent-config/sync.mjs",
    `  3. 再跑：node scripts/harness.mjs --check-freshness --root ${root}`,
    "详见 host/TRAE-P0-MANUAL.md §0 · modes/conflict-policy.md · QUICKSTART.md",
    "",
  ].join("\n");
}

/**
 * 0.7.32 升级提示缺口：rule13 / db.md 维护约定 / score-policy 可能仍 skip，需手工 replace。
 * Heuristic only — avoid false positives on fresh land.
 */
export function warnManualReplaceGaps(targetRoot, log = console) {
  const hints = [];
  const ruleCandidates = [
    path.join(targetRoot, ".cursor", "rules", "13-db-doc-sync.mdc"),
    path.join(targetRoot, "docs", "agent-config", "rules", "13-db-doc-sync.mdc"),
  ];
  for (const p of ruleCandidates) {
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, "utf8");
    if (/内容\s*\/\s*操作人\s*\/\s*时间/.test(t) || /V\[0-9\]\{4\}__\(DDL\|DML\)/.test(t)) {
      hints.push("rule 13（旧头注释/命名约定）");
      break;
    }
  }
  const dbMd = path.join(targetRoot, "docs", "db", "db.md");
  if (fs.existsSync(dbMd)) {
    const t = fs.readFileSync(dbMd, "utf8");
    if (!/维护约定/.test(t)) hints.push("docs/db/db.md（缺「维护约定」节）");
  }
  const policy = path.join(targetRoot, "docs", "harness-eng", "score-policy.yaml");
  if (fs.existsSync(policy)) {
    const t = fs.readFileSync(policy, "utf8");
    if (/acceptance_warnings_max:\s*null\s*#\s*null=不检/.test(t) || /morph_floor:\s*60\b/.test(t)) {
      hints.push("score-policy.yaml（旧缺省/注释指纹）");
    }
  }
  if (hints.length) {
    log.error(
      `harness: 需手工 replace（upgrade 默认 skip）：${hints.join("；")}。详见 modes/upgrade.md`
    );
  }
  return hints;
}

const MAINT_HEAD = "## 维护约定（SSOT）";

/**
 * Detect db migration mode from meta / docs hints / fingerprint files.
 * @returns {'flyway'|'manual_sql'|'none'}
 */
export function detectDbMigrationMode(root) {
  const abs = path.resolve(root);
  const metaCandidates = [
    path.join(abs, "docs", "harness-eng", "harness-meta.yaml"),
    path.join(abs, ".cursor", "harness-meta.yaml"),
  ];
  for (const m of metaCandidates) {
    if (!fs.existsSync(m)) continue;
    try {
      const t = fs.readFileSync(m, "utf8");
      const hit = t.match(/db_migration_mode:\s*["']?(\w+)/i);
      if (hit) {
        const v = hit[1].toLowerCase();
        if (v === "flyway" || v === "manual_sql" || v === "none") return v;
      }
    } catch {
      /* ignore */
    }
  }
  const dbMd = path.join(abs, "docs", "db", "db.md");
  if (fs.existsSync(dbMd)) {
    try {
      const t = fs.readFileSync(dbMd, "utf8");
      if (/manual_sql|人工按序|四位.*(DDL|DML)|DDL\s*\|\s*DML/i.test(t)) return "manual_sql";
      if (/flyway_schema_history|V\{?\d+\}?__/i.test(t) && /Flyway/i.test(t)) return "flyway";
    } catch {
      /* ignore */
    }
  }
  // fingerprint: presence of db/migration Flyway scripts vs numbered DDL/DML
  const flywayDirs = [
    path.join(abs, "src", "main", "resources", "db", "migration"),
    path.join(abs, "db", "migration"),
  ];
  for (const d of flywayDirs) {
    if (!fs.existsSync(d)) continue;
    try {
      if (fs.readdirSync(d).some((n) => /^V\d+__.*\.sql$/i.test(n))) return "flyway";
    } catch {
      /* ignore */
    }
  }
  return "manual_sql";
}

function buildMaintenanceBlock(mode) {
  if (mode === "flyway") {
    return `${MAINT_HEAD}

### 迁移命名

- 默认（Flyway 标准）：\`V{数字}__{snake}.sql\`，正则 \`^V[0-9]+__[a-z0-9_]+\\.sql$\`
- 只追加新版本；**禁止**修改已发布脚本

### 表文档演进

- \`## 建表语句\` = **最新完整 CREATE TABLE**（含后续 ALTER 已合并的列）
- \`_change.sql\`：**追加**各版本迁移原文，勿当首迁唯一来源

### flyway vs 人工执行

- \`flyway\`：应用启动自动迁移时，**勿**要求「人工执行到 mysql」
`;
  }
  if (mode === "none") {
    return `${MAINT_HEAD}

### 迁移命名

- 本仓 \`db_migration_mode=none\`：无统一迁移管线；表结构以真相文档 \`## 建表语句\` 为准

### 表文档演进

- \`## 建表语句\` = **最新完整 CREATE TABLE**
- 变更同步更新字段说明 / 业务说明
`;
  }
  // manual_sql (default for thick non-Flyway repos)
  // 0.7.53: never invent naming samples — thick repos vary; SSOT = AGENTS / rule 13
  return `${MAINT_HEAD}

### 迁移命名

- 模式：\`manual_sql\`（无 Flyway 依赖；禁伪造 \`flyway_schema_history\`）
- **命名以本仓 AGENTS / rule 13 为准**（双轨/自定义正则勿抄通用样例）；hooks 占位 \`MIGRATION_NAME_RE\` 与之一致
- 只追加新脚本；**禁止**修改已发布 SQL

### 表文档演进

- \`## 建表语句\` = **最新完整 CREATE TABLE**（含后续变更已合并的列）
- \`_change.sql\`：追加各版本原文，勿当首迁唯一来源
- 字段说明 / 业务说明随列变更同步

### flyway vs 人工执行

- \`manual_sql\`：发版 / 新环境须**人工按序**执行；勿伪造 \`flyway_schema_history\`
`;
}

/**
 * 0.7.40: append db.md 维护约定 if missing. Does not rewrite the user index.
 * 0.7.48: render by db_migration_mode (manual_sql / flyway / none); never replace {{}} with "none".
 * @returns {{ appended: boolean, path?: string, mode?: string }}
 */
export function ensureDbMdMaintenance(root, skillRoot = DEFAULT_SKILL_ROOT) {
  const dbMd = path.join(path.resolve(root), "docs", "db", "db.md");
  if (!fs.existsSync(dbMd)) return { appended: false };
  const cur = fs.readFileSync(dbMd, "utf8");
  if (/维护约定/.test(cur)) return { appended: false, path: dbMd };
  const mode = detectDbMigrationMode(root);
  let block = buildMaintenanceBlock(mode);
  // Prefer template slice when flyway and tmpl present — fill known placeholders only
  if (mode === "flyway") {
    const tmpl = path.join(skillRoot, "templates", "docs", "db", "db.md.tmpl");
    if (fs.existsSync(tmpl)) {
      const raw = fs.readFileSync(tmpl, "utf8");
      const m = raw.match(/##\s*维护约定[\s\S]*?(?=\n##\s+表文档|\n##\s+变更记录|$)/);
      if (m) {
        block = m[0]
          .trim()
          .replace(/\{\{DB_MIGRATION_MODE\}\}/g, "flyway")
          .replace(/\{\{MIGRATION_NAME_RE\}\}/g, "^V[0-9]+__[a-z0-9_]+\\.sql$")
          .replace(/\{\{[^}]+\}\}/g, "");
      }
    }
  }
  const next = cur.replace(/\s*$/, "") + "\n\n" + block + "\n";
  fs.writeFileSync(dbMd, next, "utf8");
  console.error(
    `harness: 已补齐 docs/db/db.md「维护约定」（mode=${mode}，merge 追加，未改索引正文）`
  );
  return { appended: true, path: dbMd, mode };
}

function readMcpServerKeys(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const servers = j?.mcpServers && typeof j.mcpServers === "object" ? j.mcpServers : {};
    return Object.keys(servers).sort();
  } catch {
    return [];
  }
}

function envTokensFromKeys(keys) {
  const tokens = new Set();
  for (const k of keys) {
    const n = String(k).toLowerCase();
    for (const env of ["test", "dev", "local"]) {
      if (n.includes(env)) tokens.add(env);
    }
  }
  return tokens;
}

function readFillMcpProfile(root) {
  const found = findHarnessMetaFile(root);
  if (!found?.abs || !fs.existsSync(found.abs)) return null;
  try {
    const raw = fs.readFileSync(found.abs, "utf8");
    const m = raw.match(/fill_mcp_profile:\s*["']?([A-Za-z0-9_-]+)["']?/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * 0.7.40: warn example vs fill_mcp_profile vs live server names. Never rewrite secrets.
 * @returns {{ warned: boolean, example: string[], live: string[], profile: string|null }}
 */
export function warnMcpExampleProfile(root, log = console) {
  const abs = path.resolve(root);
  const exampleRels = [
    ".cursor/mcp.json.example",
    ".mcp.json.example",
    ".trae/mcp.json.example",
  ];
  const liveRels = [".cursor/mcp.json", ".mcp.json", ".trae/mcp.json"];
  const example = [];
  const live = [];
  for (const rel of exampleRels) {
    for (const k of readMcpServerKeys(path.join(abs, rel))) {
      if (!example.includes(k)) example.push(k);
    }
  }
  for (const rel of liveRels) {
    for (const k of readMcpServerKeys(path.join(abs, rel))) {
      if (!live.includes(k)) live.push(k);
    }
  }
  const profile = readFillMcpProfile(abs);
  const exTok = envTokensFromKeys(example);
  const liveTok = envTokensFromKeys(live);
  let mismatch = false;
  if (profile && exTok.size && !exTok.has(String(profile).toLowerCase())) mismatch = true;
  if (profile && liveTok.size && !liveTok.has(String(profile).toLowerCase())) mismatch = true;
  if (exTok.size && liveTok.size && [...exTok].every((t) => !liveTok.has(t))) mismatch = true;
  if (!example.length) {
    return { warned: false, example, live, profile };
  }
  if (!mismatch && !profile) {
    return { warned: false, example, live, profile };
  }
  if (!mismatch) return { warned: false, example, live, profile };
  log.error(
    [
      "harness: MCP example 与 live / fill_mcp_profile 不一致（不改真密）：",
      `  example: ${example.join(", ") || "(none)"}`,
      `  live: ${live.join(", ") || "(none)"}`,
      `  fill_mcp_profile: ${profile || "(unset)"}`,
    ].join("\n")
  );
  return { warned: true, example, live, profile };
}

/**
 * Check-mode: skip (no consumer script) and fresh → 0; stale / error → 1.
 */
export function runFreshnessCheck(targetRoot, skillRoot = DEFAULT_SKILL_ROOT, log = console) {
  const report = compareSyncFreshness(targetRoot, skillRoot);
  if (report.status === "skip") {
    log.error(`harness: --check-freshness skip（目标仓无 ${CONSUMER_SYNC_REL}）。`);
    log.error(
      "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
    );
    warnManualReplaceGaps(targetRoot, log);
    return 0;
  }
  if (report.status === "fresh") {
    log.error(`harness: sync.mjs freshness OK（HARNESS_SYNC_TMPL_ID=${report.skillId}）。`);
    log.error(
      "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
    );
    warnManualReplaceGaps(targetRoot, log);
    return 0;
  }
  log.error(formatFreshnessMessage(report, targetRoot));
  log.error(
    "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
  );
  warnManualReplaceGaps(targetRoot, log);
  return 1;
}
