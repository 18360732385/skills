/**
 * hooks 家族（0.5.0+）：选择归一化 + 计算占位 + 文件展开。
 *
 * - HOOK_DEFS： hooks 家族登记表（脚本 / 各工具事件映射 / githooks 能力）
 * - normalizeHooksFamily：Q_HOOKS_FAMILY 答案 → 规范选择（extended 与 basic 门禁互斥）
 * - resolveAgentConfig：params.agent_config 或 ladder>=L5 → 配置 SSOT 管线模式
 * - buildHookPlaceholders：CONTRACT_CHECKS_JS / HOOKS_CURSOR_EVENTS /
 *   HOOKS_CLAUDE_GROUPS / HOOKS_QODER_GROUPS / HOOKS_TRAE_GROUPS /
 *   HOOKS_CONFIG_ENTRIES / GITHOOKS_GATE_SCRIPT /
 *   DB_MIGRATION_DIR / MIGRATION_ENVS / MYSQL_GUARD_SERVERS
 * - expandHooksFamily：选中 hook 的脚本文件条目（L5 → docs/agent-config/hooks/，
 *   否则 → .cursor/hooks/ 等直渲）
 *
 * 协议族（0.5.1+）：
 * - cursor：hooks.json + beforeShellExecution / afterFileEdit / …
 * - claude / qoder / trae：Claude 系（settings.json 或 hooks.json）+ PreToolUse / …
 *   经 claude-adapter.js 翻译；qoder 写入 .qoder/settings.json；trae 写入 .trae/hooks.json
 */
import path from "path";
import { fileURLToPath } from "url";
import { parseDomainsYaml } from "./domains.mjs";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "../..");
const DOMAINS_YAML = path.join(SKILL_ROOT, "templates/_meta/domains.yaml");

/** Claude 系宿主共用事件映射（qoder/trae 与 claude 同协议，经 adapter 翻译）。 */
const CLAUDE_STYLE = {
  "commit-gate": { event: "PreToolUse", matcher: "Bash", adapter: "shell-gate" },
  "commit-gate-extended": { event: "PreToolUse", matcher: "Bash", adapter: "shell-gate" },
  "mysql-guard": { event: "PreToolUse", matcher: "mcp__mysql", adapter: "mcp-guard" },
  "after-edit": {
    event: "PostToolUse",
    matcher: "Edit|Write|MultiEdit",
    adapter: "edit-reminder",
  },
  "stop-checklist": { event: "Stop", adapter: "stop-check" },
};

/** hooks 家族登记表。gate 类才有 git 模式（.githooks 兜底）。 */
export const HOOK_DEFS = {
  "commit-gate": {
    script: "superpowers-commit-gate.js",
    template: "hooks/superpowers-commit-gate.js.tmpl",
    gate: true,
    events: {
      cursor: { event: "beforeShellExecution", matcher: "git\\s+commit", timeout: 8 },
      claude: CLAUDE_STYLE["commit-gate"],
      qoder: CLAUDE_STYLE["commit-gate"],
      trae: CLAUDE_STYLE["commit-gate"],
    },
  },
  "commit-gate-extended": {
    script: "git-commit-soft-gate.js",
    template: "hooks/git-commit-soft-gate.js.tmpl",
    gate: true,
    events: {
      cursor: { event: "beforeShellExecution", matcher: "git\\s+(commit|merge)\\b", timeout: 12 },
      claude: CLAUDE_STYLE["commit-gate-extended"],
      qoder: CLAUDE_STYLE["commit-gate-extended"],
      trae: CLAUDE_STYLE["commit-gate-extended"],
    },
  },
  "mysql-guard": {
    script: "mcp-mysql-guard.js",
    template: "hooks/mcp-mysql-guard.js.tmpl",
    events: {
      cursor: { event: "beforeMCPExecution", timeout: 8 },
      claude: CLAUDE_STYLE["mysql-guard"],
      qoder: CLAUDE_STYLE["mysql-guard"],
      trae: CLAUDE_STYLE["mysql-guard"],
    },
  },
  "after-edit": {
    script: "after-edit-reminder.js",
    template: "hooks/after-edit-reminder.js.tmpl",
    events: {
      cursor: { event: "afterFileEdit", timeout: 8 },
      claude: CLAUDE_STYLE["after-edit"],
      qoder: CLAUDE_STYLE["after-edit"],
      trae: CLAUDE_STYLE["after-edit"],
    },
  },
  "stop-checklist": {
    script: "stop-delivery-checklist.js",
    template: "hooks/stop-delivery-checklist.js.tmpl",
    events: {
      cursor: { event: "stop", timeout: 8, loop_limit: 1 },
      claude: CLAUDE_STYLE["stop-checklist"],
      qoder: CLAUDE_STYLE["stop-checklist"],
      trae: CLAUDE_STYLE["stop-checklist"],
    },
  },
};

export const DEFAULT_HOOKS_FAMILY = ["commit-gate"];

/** Claude 系宿主（settings.json 或 hooks.json + adapter）。 */
export const CLAUDE_STYLE_TOOLS = ["claude", "qoder", "trae"];

/** 与 extended 门禁互斥的基础门禁 manifest 条目（cursor/claude/qoder/trae/githooks）。 */
export const BASIC_GATE_IDS = [
  "hooks-gate",
  "hooks-claude-gate",
  "hooks-qoder-gate",
  "hooks-trae-gate",
  "hooks-githooks-gate",
];

/** Q_HOOKS_FAMILY 答案归一化；extended 选中时剔除 basic。 */
export function normalizeHooksFamily(input) {
  let sel = Array.isArray(input) ? input.map((s) => String(s).trim()).filter(Boolean) : [];
  if (sel.length === 0) sel = [...DEFAULT_HOOKS_FAMILY];
  sel = sel.filter((k) => HOOK_DEFS[k]);
  if (sel.includes("commit-gate-extended")) {
    sel = sel.filter((k) => k !== "commit-gate");
  }
  if (sel.length === 0) sel = [...DEFAULT_HOOKS_FAMILY];
  return [...new Set(sel)];
}

/** L5 配置 SSOT 管线是否启用：显式 agent_config 或目标阶梯 L5。 */
export function resolveAgentConfig(params) {
  const v = params && params.agent_config;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return String(params && params.ladder || "") === "L5";
}

function indent(text, pad) {
  return text
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}

/** 单个 code 条件：'/regex/' → new RegExp（JSON 字符串包裹，避免分隔符冲突）；否则前缀匹配。 */
function codePred(entry) {
  const s = String(entry);
  if (s.length > 1 && s.startsWith("/") && s.endsWith("/")) {
    return `new RegExp(${JSON.stringify(s.slice(1, -1))}).test(f)`;
  }
  return `f.startsWith(${JSON.stringify(s)})`;
}

let registryCache = null;
function loadRegistry() {
  if (registryCache) return registryCache;
  try {
    registryCache = parseDomainsYaml(fs.readFileSync(DOMAINS_YAML, "utf8"));
  } catch {
    registryCache = {};
  }
  return registryCache;
}

/** 从 domains.yaml 的 hook_* 段生成 CONTRACT_CHECKS 数组字面量。 */
export function buildContractChecksJs(domains) {
  const registry = loadRegistry();
  const blocks = [];
  for (const d of domains || []) {
    const def = registry[d];
    if (!def || !def.hook_docs) continue;
    const codes = Array.isArray(def.hook_code) ? def.hook_code : [];
    if (!codes.length) continue;
    const tip = def.hook_tip || `同步 ${def.hook_docs}`;
    blocks.push(
      [
        "{",
        `  id: ${JSON.stringify(d)},`,
        `  code: (f) => ${codes.map(codePred).join(" ||\n    ")},`,
        `  docs: (f) => f.startsWith(${JSON.stringify(def.hook_docs)}),`,
        `  tip: ${JSON.stringify(tip)},`,
        "}",
      ].join("\n")
    );
  }
  if (!blocks.length) return "[]";
  return "[\n" + blocks.map((b) => indent(b, "  ")).join(",\n") + ",\n]";
}

function cursorEventsJson(selection) {
  const byEvent = new Map();
  for (const key of selection) {
    const def = HOOK_DEFS[key];
    const ev = def.events.cursor;
    if (!ev) continue;
    const entry = {
      command: `node .cursor/hooks/${def.script}`,
      ...(ev.matcher ? { matcher: ev.matcher } : {}),
      ...(ev.timeout ? { timeout: ev.timeout } : {}),
      failClosed: false,
      ...(ev.loop_limit ? { loop_limit: ev.loop_limit } : {}),
    };
    if (!byEvent.has(ev.event)) byEvent.set(ev.event, []);
    byEvent.get(ev.event).push(entry);
  }
  const parts = [];
  for (const [event, entries] of byEvent) {
    const inner = entries
      .map((e) => indent(JSON.stringify(e, null, 2), "      "))
      .join(",\n");
    parts.push(`${JSON.stringify(event)}: [\n${inner}\n    ]`);
  }
  return parts.join(",\n    ");
}

function claudeStyleGroupsJson(selection, toolKey, hooksDir) {
  const byEvent = new Map();
  for (const key of selection) {
    const def = HOOK_DEFS[key];
    const ev = def.events[toolKey];
    if (!ev) continue;
    const command =
      key === "commit-gate"
        ? `node ${hooksDir}/${def.script} --claude`
        : `node ${hooksDir}/claude-adapter.js ${ev.adapter} ${def.script}`;
    const group = {
      ...(ev.matcher ? { matcher: ev.matcher } : {}),
      hooks: [{ type: "command", command, timeout: 8 }],
    };
    if (!byEvent.has(ev.event)) byEvent.set(ev.event, []);
    byEvent.get(ev.event).push(group);
  }
  const parts = [];
  for (const [event, groups] of byEvent) {
    const inner = groups
      .map((g) => indent(JSON.stringify(g, null, 2), "      "))
      .join(",\n");
    parts.push(`${JSON.stringify(event)}: [\n${inner}\n    ]`);
  }
  return parts.join(",\n    ");
}

/** @deprecated use claudeStyleGroupsJson(selection, "claude", ".claude/hooks") */
function claudeGroupsJson(selection) {
  return claudeStyleGroupsJson(selection, "claude", "${CLAUDE_PROJECT_DIR}/.claude/hooks");
}

/** L5：hooks.config.json 的 hooks 数组片段（按 ai_tools 裁剪 targets）。 */
function hooksConfigEntriesJson(selection, aiTools) {
  const tools = new Set(aiTools && aiTools.length ? aiTools : ["cursor"]);
  const entries = [];
  for (const key of selection) {
    const def = HOOK_DEFS[key];
    const targets = {};
    for (const t of ["cursor", "claude", "qoder", "trae"]) {
      if (!tools.has(t)) continue;
      const ev = def.events[t];
      if (ev) targets[t] = ev;
    }
    if (!Object.keys(targets).length) continue;
    entries.push(
      JSON.stringify({ id: key, script: def.script, targets }, null, 2)
    );
  }
  if (!entries.length) return "";
  return entries.map((e) => indent(e, "    ")).join(",\n");
}

/**
 * 计算 hooks 家族相关占位。已存在于 existing 的键不覆盖（params.placeholders 优先）。
 */
export function buildHookPlaceholders({ params, agentConfig, existing }) {
  const ph = existing || {};
  const out = {};
  const selection = normalizeHooksFamily(params && params.hooks_family);
  const domains = (params && params.domains) || [];
  const aiTools = (params && params.ai_tools) || [];

  const put = (k, v) => {
    if (ph[k] == null) out[k] = v;
  };

  put("CONTRACT_CHECKS_JS", buildContractChecksJs(domains));
  const registry = loadRegistry();
  const migDir =
    (params && params.db_migration_dir) ||
    (registry.db && registry.db.hook_migration_dir) ||
    "db/migration/";
  put("DB_MIGRATION_DIR", migDir);
  // flyway 自动迁移仓关闭「人工同步环境」提醒：MIGRATION_ENVS 置空
  const migMode =
    (ph.DB_MIGRATION_MODE != null && String(ph.DB_MIGRATION_MODE)) ||
    (params && params.db_migration_mode) ||
    "";
  put("MIGRATION_ENVS", migMode === "flyway" ? "" : "dev / test / uat");
  // 正则源统一以 JSON 字符串形式下发，模板用 new RegExp(...) 包裹（避免 / 分隔符冲突）
  put(
    "MIGRATION_NAME_RE",
    JSON.stringify("^V[0-9]{4}__(DDL|DML)__[a-z0-9_]+\\.sql$")
  );
  put(
    "JOBS_YML_RE",
    JSON.stringify(
      (registry.jobs && registry.jobs.hook_yml_re) ||
        "(application[^/]*\\.ya?ml|config/.*\\.ya?ml)$"
    )
  );
  put("MYSQL_GUARD_SERVERS", "mysql-(dev|test|uat)");
  put("HOOKS_CURSOR_EVENTS", cursorEventsJson(selection));
  put(
    "HOOKS_CLAUDE_GROUPS",
    claudeStyleGroupsJson(selection, "claude", "${CLAUDE_PROJECT_DIR}/.claude/hooks")
  );
  put("HOOKS_QODER_GROUPS", claudeStyleGroupsJson(selection, "qoder", ".qoder/hooks"));
  put("HOOKS_TRAE_GROUPS", claudeStyleGroupsJson(selection, "trae", ".trae/hooks"));
  put(
    "HOOKS_CONFIG_ENTRIES",
    hooksConfigEntriesJson(selection, aiTools)
  );
  const gate = selection.find((k) => HOOK_DEFS[k].gate);
  // L5 下脚本只有 SSOT 单份；.githooks 预提交跨过目录引用（sync 不管理 .githooks）
  put(
    "GITHOOKS_GATE_SCRIPT",
    agentConfig
      ? `../docs/agent-config/hooks/${HOOK_DEFS[gate].script}`
      : HOOK_DEFS[gate].script
  );
  return out;
}

/**
 * 选中 hook 的脚本文件条目。
 * L5：单份 SSOT（docs/agent-config/hooks/）；否则按工具直渲副本。
 */
export function expandHooksFamily(params, agentConfig, actionForTarget) {
  const selection = normalizeHooksFamily(params && params.hooks_family);
  const tools = new Set(
    (Array.isArray(params && params.ai_tools) ? params.ai_tools : [])
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const has = (t) => (tools.size ? tools.has(t) : t === "cursor");
  const out = [];
  const seen = new Set();
  const push = (id, template, target) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, template, target, action: actionForTarget(target, id) });
  };

  for (const key of selection) {
    const def = HOOK_DEFS[key];
    if (agentConfig) {
      push(`hookfam-${key}`, def.template, `docs/agent-config/hooks/${def.script}`);
      continue;
    }
    if (has("cursor")) push(`hookfam-${key}-cursor`, def.template, `.cursor/hooks/${def.script}`);
    if (has("claude")) push(`hookfam-${key}-claude`, def.template, `.claude/hooks/${def.script}`);
    if (has("qoder")) push(`hookfam-${key}-qoder`, def.template, `.qoder/hooks/${def.script}`);
    if (has("trae")) push(`hookfam-${key}-trae`, def.template, `.trae/hooks/${def.script}`);
    if (def.gate) push(`hookfam-${key}-githooks`, def.template, `.githooks/${def.script}`);
  }

  // 家族 hook 走 claude-adapter（basic gate 自带 --claude 模式，不需要适配器）
  const needsAdapter =
    CLAUDE_STYLE_TOOLS.some((t) => has(t)) && selection.some((k) => k !== "commit-gate");
  if (needsAdapter) {
    if (agentConfig) {
      push("hookfam-claude-adapter", "hooks/claude-adapter.js", "docs/agent-config/hooks/claude-adapter.js");
    } else {
      if (has("claude")) {
        push("hookfam-claude-adapter", "hooks/claude-adapter.js", ".claude/hooks/claude-adapter.js");
      }
      if (has("qoder")) {
        push("hookfam-qoder-adapter", "hooks/claude-adapter.js", ".qoder/hooks/claude-adapter.js");
      }
      if (has("trae")) {
        push("hookfam-trae-adapter", "hooks/claude-adapter.js", ".trae/hooks/claude-adapter.js");
      }
    }
  }
  return out;
}
