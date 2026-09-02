#!/usr/bin/env node
/**
 * harness-eng render — no npm deps.
 * Usage:
 *   node scripts/render.mjs --root <TARGET> --params <params.json>
 *       [--dry-run] [--manifest <path>] [--backup]
 *
 * Explicit files:
 *   { "placeholders": {...}, "files": [{ "template", "target", "action" }] }
 *
 * Manifest expand (files missing or []):
 *   --manifest templates/_meta/manifest.yaml  (optional; defaults to skill manifest)
 *   OR params.expandFromManifest: true
 *   { "ladder":"L2", "domains":[...], "agents_variant":"solo",
 *     "include_optional":["rule-14"], "module_dirs":["app"],
 *     "default_action":"create", "on_exists":"skip",
 *     "placeholders":{...} }
 *
 * --backup: when action is create and target exists, rewrite as backup-create (.bak-harness-*).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "./lib/yaml.mjs";
import { expandDomainPackEntries } from "./lib/domains.mjs";
import {
  BASIC_GATE_IDS,
  buildHookPlaceholders,
  expandHooksFamily,
  normalizeHooksFamily,
  resolveAgentConfig,
} from "./lib/hooks-checks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const TEMPLATES = path.join(SKILL_ROOT, "templates");
const DEFAULT_MANIFEST = path.join(TEMPLATES, "_meta", "manifest.yaml");

const LADDER_ORD = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
const YAML_MANAGED_KEYS = new Set([
  "skill",
  "skill_version",
  "ladder",
  "domains",
  "agents_variant",
  "glob_profile",
  "last_mode",
  "ai_tools",
  "installed_at",
  "agent_config",
]);

/** pitfalls lint 默认封闭域词表（0.5.0+；可被 params.placeholders.PITFALL_DOMAINS 覆盖）。 */
const DEFAULT_PITFALL_DOMAINS =
  '"Build", "Auth", "Docs", "Config", "API", "Backend", "Test", "Cache", "Jobs", "Frontend", "DB", "MCP", "Prompt", "Graph"';

/** Built-in AI tool adapter files (SSOT pointers only). */
const AI_TOOL_ADAPTERS = {
  cursor: [
    {
      id: "ai-cursor-ssot",
      template: "ai-tools/cursor-harness-ssot.mdc.tmpl",
      target: ".cursor/rules/00-harness-ssot.mdc",
    },
  ],
  claude: [
    {
      id: "ai-claude",
      template: "ai-tools/CLAUDE.md.tmpl",
      target: "CLAUDE.md",
    },
  ],
  codex: [
    {
      id: "ai-codex",
      template: "ai-tools/codex-harness.md.tmpl",
      target: ".codex/harness.md",
    },
  ],
  qoder: [
    {
      id: "ai-qoder",
      template: "ai-tools/qoder-harness-ssot.md.tmpl",
      target: ".qoder/rules/00-harness-ssot.md",
    },
  ],
  trae: [
    {
      id: "ai-trae",
      template: "ai-tools/trae-harness-ssot.md.tmpl",
      target: ".trae/rules/00-harness-ssot.md",
    },
  ],
  workbuddy: [
    {
      id: "ai-workbuddy-root",
      template: "ai-tools/CODEBUDDY.md.tmpl",
      target: "CODEBUDDY.md",
    },
    {
      id: "ai-workbuddy-rule",
      template: "ai-tools/workbuddy-harness-ssot.md.tmpl",
      target: ".codebuddy/rules/00-harness-ssot.md",
    },
    {
      id: "ai-workbuddy-contract-sync",
      template: "ai-tools/contract-sync-mirror.md.tmpl",
      target: ".codebuddy/rules/1x-contract-sync.md",
    },
  ],
};

/** Non-cursor tools that need a contract-sync mirror so hosts see sync discipline. */
const CONTRACT_SYNC_MIRRORS = {
  claude: ".claude/rules/1x-contract-sync.md",
  codex: ".codex/contract-sync.md",
  qoder: ".qoder/rules/1x-contract-sync.md",
  trae: ".trae/rules/1x-contract-sync.md",
  // workbuddy included in AI_TOOL_ADAPTERS above
};

function parseArgs(argv) {
  const out = { dryRun: false, root: null, params: null, manifest: null, backup: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--backup") out.backup = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--params") out.params = argv[++i];
    else if (a === "--manifest") out.manifest = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!out.root || !out.params) {
    throw new Error(
      "Required: --root <TARGET> --params <params.json>\nOptional: --dry-run --manifest <path> --backup"
    );
  }
  return out;
}

function renderPlaceholders(text, placeholders) {
  let out = text;
  for (const [k, v] of Object.entries(placeholders || {})) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, "g");
    out = out.replace(re, v == null ? "" : String(v));
  }
  return out;
}

/** Q_RULE14 boolean → optional file id list; arrays pass through. */
function normalizeIncludeOptional(v) {
  if (Array.isArray(v)) return v;
  if (v === true) return ["rule-14"];
  return [];
}

/** Scan Maven <module> entries from root pom.xml (fs only, UTF-8). */
function scanPomModules(root) {
  const pom = path.join(root, "pom.xml");
  if (!fs.existsSync(pom)) return [];
  const text = fs.readFileSync(pom, "utf8");
  const mods = [];
  const re = /<module>\s*([^<]+?)\s*<\/module>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\\/g, "/");
    if (name && !name.includes("..")) mods.push(name);
  }
  return [...new Set(mods)];
}

function ensureYamlListPlaceholders(params, placeholders) {
  const ph = { ...placeholders };
  if (Array.isArray(params.domains)) {
    ph.DOMAINS_YAML = stringifyYaml(params.domains, { flow: true });
  } else if (ph.DOMAINS_YAML == null) {
    ph.DOMAINS_YAML = "[]";
  }
  const tools = Array.isArray(params.ai_tools) ? params.ai_tools : null;
  if (tools) {
    ph.AI_TOOLS_YAML = stringifyYaml(tools, { flow: true });
  } else if (ph.AI_TOOLS_YAML == null) {
    ph.AI_TOOLS_YAML = "[cursor]";
  }
  return ph;
}

function stripFrontmatter(src) {
  if (!src.startsWith("---")) return { fm: "", body: src };
  const end = src.indexOf("\n---", 3);
  if (end < 0) return { fm: "", body: src };
  const close = end + 4;
  const after = src.slice(close).replace(/^\r?\n/, "");
  return { fm: src.slice(0, close) + "\n", body: after };
}

function splitH2Sections(body) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m = /^(##\s+.+)$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = { title: m[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      current = { title: null, lines: [line] };
    }
  }
  if (current) sections.push(current);
  return sections;
}

function mergeMarkdown(existing, incoming, isMdc) {
  let existFm = "";
  let existBody = existing;
  let inFm = "";
  let inBody = incoming;
  if (isMdc) {
    ({ fm: existFm, body: existBody } = stripFrontmatter(existing));
    ({ fm: inFm, body: inBody } = stripFrontmatter(incoming));
  }
  const existSecs = splitH2Sections(existBody);
  const inSecs = splitH2Sections(inBody);
  const existTitles = new Set(
    existSecs.filter((s) => s.title).map((s) => s.title.replace(/\s*（harness-eng 补齐）\s*$/, "").trim())
  );
  const appended = [];
  for (const sec of inSecs) {
    if (!sec.title) continue;
    const norm = sec.title.trim();
    if (existTitles.has(norm)) continue;
    const tagged = sec.lines.slice();
    tagged[0] = `${sec.title}（harness-eng 补齐）`;
    appended.push(tagged.join("\n"));
  }
  let fmOut = existFm;
  if (isMdc && inFm && !existFm) fmOut = inFm;
  const bodyOut =
    existBody.replace(/\s*$/, "") +
    (appended.length ? "\n\n" + appended.join("\n\n") + "\n" : "\n");
  return fmOut + bodyOut;
}

/** Section-level merge preview: which incoming H2 would be appended vs kept (0.4.0+). */
function previewMarkdownMerge(existing, incoming, isMdc) {
  let existBody = existing;
  let inBody = incoming;
  if (isMdc) {
    ({ body: existBody } = stripFrontmatter(existing));
    ({ body: inBody } = stripFrontmatter(incoming));
  }
  const existTitles = new Set(
    splitH2Sections(existBody)
      .filter((s) => s.title)
      .map((s) => s.title.replace(/\s*（harness-eng 补齐）\s*$/, "").trim())
  );
  const append = [];
  const keep = [];
  for (const sec of splitH2Sections(inBody)) {
    if (!sec.title) continue;
    const t = sec.title.trim();
    (existTitles.has(t) ? keep : append).push(t);
  }
  return { append, keep };
}

/** Whether default markdown H2 merge applies (vs yaml-keys / append-lines / json-hooks). */
function isMarkdownMergeTarget(targetRel, item) {
  const n = targetRel.replace(/\\/g, "/").toLowerCase();
  if (n.endsWith(".gitignore")) return false;
  if (item && item.mergeMode) return false;
  if (isYamlTarget(targetRel, item)) return false;
  return /\.mdc$/i.test(n) || n.endsWith(".md");
}

/** Flat YAML map: comments + key: value + key: [a, b] */
function parseSimpleYamlMap(text) {
  const headerComments = [];
  const map = {};
  const order = [];
  let inHeader = true;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw;
    const trimmed = line.trim();
    if (!trimmed) {
      if (inHeader) headerComments.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      if (inHeader) headerComments.push(line);
      continue;
    }
    inHeader = false;
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(trimmed);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      const inner = val.slice(1, -1).trim();
      val = inner
        ? inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))
        : [];
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    if (!(key in map)) order.push(key);
    map[key] = val;
  }
  return { headerComments, map, order };
}

function formatYamlValue(v) {
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  return String(v);
}

function mergeYamlMaps(existingText, incomingText) {
  const exist = parseSimpleYamlMap(existingText);
  const incoming = parseSimpleYamlMap(incomingText);
  const out = { ...exist.map };
  for (const [k, v] of Object.entries(incoming.map)) {
    if (YAML_MANAGED_KEYS.has(k)) out[k] = v;
    else if (!(k in out)) out[k] = v;
    // else: keep existing non-managed key
  }
  const order = [];
  for (const k of exist.order) {
    if (k in out) order.push(k);
  }
  for (const k of Object.keys(out)) {
    if (!order.includes(k)) order.push(k);
  }
  const header =
    exist.headerComments.length > 0
      ? exist.headerComments
      : incoming.headerComments;
  const lines = [...header];
  if (lines.length && lines[lines.length - 1].trim() !== "") lines.push("");
  for (const k of order) {
    lines.push(`${k}: ${formatYamlValue(out[k])}`);
  }
  return lines.join("\n").replace(/\s*$/, "") + "\n";
}

function isYamlTarget(targetRel, item) {
  if (item && item.mergeMode === "yaml-keys") return true;
  const n = targetRel.replace(/\\/g, "/").toLowerCase();
  return n.endsWith(".yaml") || n.endsWith(".yml");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function isMcpJson(targetRel) {
  const n = targetRel.replace(/\\/g, "/");
  return n === ".cursor/mcp.json" || n.endsWith("/.cursor/mcp.json");
}

function todayStamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Parse manifest.yaml files via vendored YAML (0.2.6+) */
function parseManifestFiles(manifestText) {
  const doc = parseYaml(manifestText) || {};
  const files = Array.isArray(doc.files) ? doc.files : [];
  return files
    .map((e) => {
      if (!e || !e.id) return null;
      const when =
        e.when && typeof e.when === "object" && !Array.isArray(e.when) ? e.when : {};
      let whenAi = e.when_ai_tools;
      if (typeof whenAi === "string") {
        whenAi = whenAi
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (whenAi != null && !Array.isArray(whenAi)) {
        whenAi = [String(whenAi)];
      }
      return {
        id: String(e.id),
        ladder: e.ladder,
        template: e.template,
        target: e.target,
        domain: e.domain,
        optional: Boolean(e.optional),
        when,
        when_ai_tools: whenAi && whenAi.length ? whenAi.map(String) : undefined,
        placeholders: e.placeholders,
        note: e.note,
        action_hint: e.action_hint,
        mergeMode: e.mergeMode || e.merge_mode,
        when_agent_config:
          e.when_agent_config === true || e.when_agent_config === "true"
            ? true
            : e.when_agent_config === false || e.when_agent_config === "false"
              ? false
              : undefined,
      };
    })
    .filter(Boolean);
}

function expandFromManifest(manifestPath, params, root) {
  const text = fs.readFileSync(manifestPath, "utf8");
  const entries = parseManifestFiles(text);
  const targetLadder = params.ladder || "L0";
  if (!(targetLadder in LADDER_ORD)) {
    throw new Error(`Invalid ladder: ${targetLadder}`);
  }
  // L5 配置 SSOT 管线：显式 agent_config=true 时即使目标阶梯 < L5 也渲染 L5 包
  const agentConfig = resolveAgentConfig(params);
  const maxOrd = Math.max(LADDER_ORD[targetLadder], agentConfig ? LADDER_ORD.L5 : 0);
  // hooks 家族选了 extended 门禁时，跳过基础门禁脚本条目（避免双提醒；codex/codebuddy 仍保留基础门禁）
  const hooksFamily = normalizeHooksFamily(params.hooks_family);
  const skipBasicGate = hooksFamily.includes("commit-gate-extended");
  const domains = new Set(params.domains || []);
  const variant = params.agents_variant || "solo";
  const includeOptional = new Set(normalizeIncludeOptional(params.include_optional));
  let moduleDirs = params.module_dirs || [];
  if (params.all_modules === true || params.all_modules === "true") {
    const scanned = scanPomModules(root);
    if (scanned.length) moduleDirs = scanned;
  }
  const defaultAction = params.default_action || "create";
  /** @type {"fail"|"skip"|"merge"} */
  const onExists = params.on_exists || "fail";
  if (!["fail", "skip", "merge"].includes(onExists)) {
    throw new Error(`Invalid on_exists: ${onExists} (use fail|skip|merge)`);
  }
  const aiTools = new Set(
    (Array.isArray(params.ai_tools) ? params.ai_tools : [])
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const files = [];

  function actionForTarget(targetRel, entryId, entry) {
    if (entryId === "gitignore-snippet") return "merge";
    if (entryId === "harness-meta") {
      return fs.existsSync(path.join(root, targetRel)) ? "merge" : "create";
    }
    if (
      entry &&
      (entry.action_hint === "merge-json-hooks" ||
        entry.mergeMode === "json-hooks" ||
        /settings\.json$/i.test(targetRel) && /hooks-(claude|codebuddy|codex)/.test(entryId || ""))
    ) {
      return fs.existsSync(path.join(root, targetRel)) ? "merge" : "create";
    }
    if (entryId === "hooks-codex-json") {
      return fs.existsSync(path.join(root, targetRel)) ? "merge" : "create";
    }
    const abs = path.join(root, targetRel);
    if (defaultAction === "create" && fs.existsSync(abs)) {
      if (onExists === "skip") return "skip";
      if (onExists === "merge") return "merge";
    }
    return defaultAction;
  }

  // 0.3.5: L1 contract files come from domain-packs.yaml (not manifest)
  const packEntries = expandDomainPackEntries([...domains], { ladder: targetLadder });
  const seenIds = new Set();

  function pushEntry(e) {
    if (!e || !e.id || seenIds.has(e.id)) return;
    if (e.optional && !includeOptional.has(e.id)) return;
    if (e.when && e.when.agents_variant && e.when.agents_variant !== variant) return;
    if (e.when_ai_tools && e.when_ai_tools.length) {
      const tools = aiTools.size ? aiTools : new Set(["cursor"]);
      if (!e.when_ai_tools.some((t) => tools.has(String(t).toLowerCase()))) return;
    }
    seenIds.add(e.id);
    // L5：rules 落到 SSOT 侧，由 sync.mjs 分发到各工具目录
    if (agentConfig && typeof e.target === "string" && e.target.startsWith(".cursor/rules/")) {
      e = { ...e, target: `docs/agent-config/rules/${path.basename(e.target)}` };
    }
    if (e.id === "agents-module") {
      for (const dir of moduleDirs) {
        const name = path.basename(dir);
        files.push({
          ...e,
          target: String(e.target || "").replace(/\{\{MODULE_DIR\}\}/g, dir),
          action: actionForTarget(
            String(e.target || "").replace(/\{\{MODULE_DIR\}\}/g, dir),
            e.id,
            e
          ),
          placeholders_extra: { MODULE_DIR: dir, MODULE_NAME: name },
        });
      }
      return;
    }
    files.push({
      ...e,
      action: actionForTarget(e.target, e.id, e),
    });
  }

  for (const e of packEntries) pushEntry(e);

  for (const e of entries) {
    const ord = LADDER_ORD[e.ladder];
    if (ord == null || ord > maxOrd) continue;
    // Legacy: skip domain-scoped L1 leftovers if any remain in manifest
    if (e.domain && e.ladder === "L1") continue;
    if (e.domain && !domains.has(e.domain)) continue;
    if (e.when && e.when.agents_variant && e.when.agents_variant !== variant) continue;
    if (e.when_agent_config != null && e.when_agent_config !== agentConfig) continue;
    if (skipBasicGate && BASIC_GATE_IDS.includes(e.id)) continue;
    if (e.optional && !includeOptional.has(e.id)) continue;
    if (e.when_ai_tools && e.when_ai_tools.length) {
      const tools = aiTools.size ? aiTools : new Set(["cursor"]);
      if (!e.when_ai_tools.some((t) => tools.has(String(t).toLowerCase()))) continue;
    }

    if (e.id === "agents-module") {
      const moduleTmpl =
        params.module_agents_template === "spring"
          ? "agents/AGENTS.module.spring.md.tmpl"
          : e.template;
      for (const dir of moduleDirs) {
        const name = path.basename(dir);
        const target = `${dir}/AGENTS.md`;
        files.push({
          id: e.id,
          template: moduleTmpl,
          target,
          action: actionForTarget(target, e.id, e),
          placeholders_extra: { MODULE_DIR: dir, MODULE_NAME: name },
        });
      }
      continue;
    }

    // L5：rules 落到 SSOT 侧，由 sync.mjs 分发到各工具目录
    const itemTarget =
      agentConfig && typeof e.target === "string" && e.target.startsWith(".cursor/rules/")
        ? `docs/agent-config/rules/${path.basename(e.target)}`
        : e.target;
    const action = actionForTarget(itemTarget, e.id, e);
    const item = {
      id: e.id,
      template: e.template,
      target: itemTarget,
      action,
    };
    if (e.id === "gitignore-snippet") item.mergeMode = "append-lines";
    if (e.id === "harness-meta") item.mergeMode = "yaml-keys";
    if (
      e.action_hint === "merge-json-hooks" ||
      e.id === "hooks-codex-json" ||
      e.id === "hooks-claude-settings" ||
      e.id === "hooks-codebuddy-settings"
    ) {
      item.mergeMode = "json-hooks";
    }
    files.push(item);
  }

  // AI tool adapters (L0+); always eligible when listed in params.ai_tools
  files.push(...expandAiToolAdapters(params, root, actionForTarget, agentConfig));
  // hooks 家族脚本（0.5.0+；L5 → docs/agent-config/hooks/，否则按工具直渲）
  files.push(...expandHooksFamily(params, agentConfig, actionForTarget));
  return files;
}

/** sync.mjs 托管的规则目录前缀（L5 下 render 不再直渲，避免被当 stale 清理）。 */
const SYNC_MANAGED_RULE_PREFIXES = [".qoder/rules/", ".trae/rules/", ".codebuddy/rules/"];

function expandAiToolAdapters(params, root, actionForTarget, agentConfig) {
  const tools = Array.isArray(params.ai_tools) ? params.ai_tools : [];
  const customs = Array.isArray(params.ai_tools_custom) ? params.ai_tools_custom : [];
  const out = [];
  const seen = new Set();

  /** L5 适配层归并：CLAUDE.md 由 sync 生成；.cursor/rules 改投 SSOT；托管目录直渲跳过。 */
  const adaptTarget = (target) => {
    if (!agentConfig) return target;
    if (target === "CLAUDE.md") return null;
    if (target.startsWith(".cursor/rules/")) {
      return `docs/agent-config/rules/${path.basename(target)}`;
    }
    if (SYNC_MANAGED_RULE_PREFIXES.some((p) => target.startsWith(p))) return null;
    return target;
  };

  for (const raw of tools) {
    const id = String(raw || "")
      .trim()
      .toLowerCase();
    if (!id || id === "custom") continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const adapters = AI_TOOL_ADAPTERS[id];
    if (!adapters) {
      throw new Error(
        `Unknown ai_tools id: ${id}. Built-ins: ${Object.keys(AI_TOOL_ADAPTERS).join(", ")}. Use ai_tools_custom for others.`
      );
    }
    for (const a of adapters) {
      const target = adaptTarget(a.target);
      if (!target) continue;
      out.push({
        id: a.id,
        template: a.template,
        target,
        action: actionForTarget(target, a.id),
      });
    }
    const mirrorTarget = CONTRACT_SYNC_MIRRORS[id];
    if (mirrorTarget) {
      const target = adaptTarget(mirrorTarget);
      if (!target) continue;
      out.push({
        id: `ai-${id}-contract-sync`,
        template: "ai-tools/contract-sync-mirror.md.tmpl",
        target,
        action: actionForTarget(target, `ai-${id}-contract-sync`),
      });
    }
  }

  for (const c of customs) {
    const entry = (c.entry || c.path || "").trim().replace(/\\/g, "/");
    const toolId = String(c.id || "custom")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    const label = (c.label || c.name || toolId).trim();
    if (!entry) {
      throw new Error(`ai_tools_custom entry missing entry/path for id=${toolId}`);
    }
    if (entry.includes("..") || path.isAbsolute(entry)) {
      throw new Error(`ai_tools_custom entry must be repo-relative: ${entry}`);
    }
    out.push({
      id: `ai-custom-${toolId}`,
      template: "ai-tools/custom-entry.md.tmpl",
      target: entry,
      action: actionForTarget(entry, `ai-custom-${toolId}`),
      placeholders_extra: {
        CUSTOM_TOOL_ID: toolId,
        CUSTOM_TOOL_LABEL: label,
        CUSTOM_ENTRY_PATH: entry,
      },
    });
  }

  return out;
}

function findUnresolvedPlaceholders(text) {
  const matches = text.match(/\{\{[A-Z][A-Z0-9_]*\}\}/g);
  return matches ? [...new Set(matches)] : [];
}

function normalizeHookCommand(cmd) {
  return String(cmd || "")
    .replace(/\\/g, "/")
    .replace(/\$\{CLAUDE_PROJECT_DIR\}/g, "")
    .replace(/\$CODEBUDDY_PROJECT_DIR/g, "")
    .replace(/\$\([^)]+\)/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Merge settings/hooks JSON: keep user keys; append hook commands by path dedupe */
function mergeJsonHooks(existingText, incomingText) {
  let cur = {};
  let inc = {};
  try {
    cur = JSON.parse(existingText || "{}");
  } catch {
    cur = {};
  }
  try {
    inc = JSON.parse(incomingText || "{}");
  } catch {
    return existingText;
  }
  if (!cur || typeof cur !== "object") cur = {};
  if (!inc || typeof inc !== "object") return JSON.stringify(cur, null, 2) + "\n";

  for (const [k, v] of Object.entries(inc)) {
    if (k === "hooks") continue;
    if (!(k in cur)) cur[k] = v;
  }

  if (!inc.hooks || typeof inc.hooks !== "object") {
    return JSON.stringify(cur, null, 2) + "\n";
  }
  if (!cur.hooks || typeof cur.hooks !== "object") cur.hooks = {};

  for (const [event, groups] of Object.entries(inc.hooks)) {
    if (!Array.isArray(groups)) continue;
    if (!Array.isArray(cur.hooks[event])) cur.hooks[event] = [];
    const existingCmds = new Set();
    for (const g of cur.hooks[event]) {
      for (const h of g.hooks || []) {
        if (h && h.command) existingCmds.add(normalizeHookCommand(h.command));
      }
    }
    for (const group of groups) {
      const newHooks = (group.hooks || []).filter(
        (h) => h && h.command && !existingCmds.has(normalizeHookCommand(h.command))
      );
      if (!newHooks.length) continue;
      for (const h of newHooks) existingCmds.add(normalizeHookCommand(h.command));
      const matcher = group.matcher;
      let target = cur.hooks[event].find((g) => g && g.matcher === matcher);
      if (!target) {
        cur.hooks[event].push({
          ...(matcher != null ? { matcher } : {}),
          hooks: newHooks,
        });
      } else {
        target.hooks = [...(target.hooks || []), ...newHooks];
      }
    }
  }
  return JSON.stringify(cur, null, 2) + "\n";
}

function applyOne(root, item, placeholders, dryRun, log) {
  const action = item.action || "create";
  const targetRel = item.target;
  if (!targetRel) throw new Error("file entry missing target");
  if (isMcpJson(targetRel) && action !== "skip") {
    throw new Error(`Refusing to write/overwrite ${targetRel} (mcp.json never overwrite)`);
  }

  const abs = path.join(root, targetRel);
  const exists = fs.existsSync(abs);
  const ph = { ...placeholders, ...(item.placeholders_extra || {}) };

  if (action === "skip") {
    log.push({ target: targetRel, action: "skip", status: "ok" });
    return;
  }

  if (!item.template) throw new Error(`file ${targetRel}: missing template`);
  const tmplPath = path.join(TEMPLATES, item.template);
  if (!fs.existsSync(tmplPath)) throw new Error(`Template not found: ${tmplPath}`);
  const rendered = renderPlaceholders(fs.readFileSync(tmplPath, "utf8"), ph);
  const unresolvedPlaceholders = findUnresolvedPlaceholders(rendered);

  if (dryRun) {
    const entry = {
      target: targetRel,
      action,
      status: "dry-run",
      exists,
      bytes: Buffer.byteLength(rendered, "utf8"),
      id: item.id || undefined,
      preview: rendered.split(/\r?\n/).slice(0, 20).join("\n"),
      unresolvedPlaceholders,
    };
    if (action === "merge" && exists && isMarkdownMergeTarget(targetRel, item)) {
      entry.mergePreview = previewMarkdownMerge(
        fs.readFileSync(abs, "utf8"),
        rendered,
        /\.mdc$/i.test(targetRel) || targetRel.endsWith(".md")
      );
    }
    log.push(entry);
    return;
  }

  if (action === "create") {
    if (exists) throw new Error(`create refused: ${targetRel} already exists (use merge/skip/backup-create)`);
    ensureDir(abs);
    fs.writeFileSync(abs, rendered, "utf8");
    log.push({
      target: targetRel,
      action: "create",
      status: "written",
      unresolvedPlaceholders: unresolvedPlaceholders.length ? unresolvedPlaceholders : undefined,
    });
    return;
  }

  if (action === "backup-create") {
    if (exists) {
      const bak = `${abs}.bak-harness-${todayStamp()}`;
      fs.copyFileSync(abs, bak);
      log.push({ target: targetRel, action: "backup", status: "ok", backup: path.basename(bak) });
    }
    ensureDir(abs);
    fs.writeFileSync(abs, rendered, "utf8");
    log.push({
      target: targetRel,
      action: "backup-create",
      status: "written",
      unresolvedPlaceholders: unresolvedPlaceholders.length ? unresolvedPlaceholders : undefined,
    });
    return;
  }

  if (action === "merge") {
    if (!exists) {
      ensureDir(abs);
      fs.writeFileSync(abs, rendered, "utf8");
      log.push({
        target: targetRel,
        action: "merge",
        status: "created-as-new",
        unresolvedPlaceholders: unresolvedPlaceholders.length ? unresolvedPlaceholders : undefined,
      });
      return;
    }
    if (targetRel.replace(/\\/g, "/").endsWith(".gitignore") || item.mergeMode === "append-lines") {
      const cur = fs.readFileSync(abs, "utf8");
      const lines = rendered.split(/\r?\n/).filter((l) => l.trim() && !cur.includes(l));
      if (lines.length) {
        const next = cur.replace(/\s*$/, "") + "\n\n" + lines.join("\n") + "\n";
        fs.writeFileSync(abs, next, "utf8");
        log.push({ target: targetRel, action: "merge", status: "appended-lines", count: lines.length });
      } else {
        log.push({ target: targetRel, action: "merge", status: "noop" });
      }
      return;
    }
    const cur = fs.readFileSync(abs, "utf8");
    let merged;
    if (item.mergeMode === "json-hooks") {
      merged = mergeJsonHooks(cur, rendered);
      log.push({ target: targetRel, action: "merge", status: "json-hooks-merged" });
    } else if (isYamlTarget(targetRel, item)) {
      merged = mergeYamlMaps(cur, rendered);
      log.push({ target: targetRel, action: "merge", status: "yaml-keys-merged" });
    } else {
      const isMdc = /\.mdc$/i.test(targetRel) || targetRel.endsWith(".md");
      const mergePreview = previewMarkdownMerge(cur, rendered, isMdc);
      merged = mergeMarkdown(cur, rendered, isMdc);
      log.push({ target: targetRel, action: "merge", status: "merged", mergePreview });
    }
    fs.writeFileSync(abs, merged, "utf8");
    const unresolvedMerged = findUnresolvedPlaceholders(merged);
    if (unresolvedMerged.length) {
      log[log.length - 1].unresolvedPlaceholders = unresolvedMerged;
    }
    return;
  }

  throw new Error(`Unknown action: ${action}`);
}

function resolveManifestPath(args, params) {
  if (args.manifest) return path.resolve(args.manifest);
  if (params.expandFromManifest) return DEFAULT_MANIFEST;
  // 0.2.15+: empty files → default skill manifest
  const files = params.files;
  if (!files || (Array.isArray(files) && files.length === 0)) return DEFAULT_MANIFEST;
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.root);
  const params = JSON.parse(fs.readFileSync(path.resolve(args.params), "utf8"));
  const placeholders = ensureYamlListPlaceholders(params, params.placeholders || {});
  // 0.5.0 计算占位：agent_config / pitfalls 词表 / hooks 家族（params.placeholders 优先）
  const agentConfig = resolveAgentConfig(params);
  if (placeholders.AGENT_CONFIG == null) {
    placeholders.AGENT_CONFIG = agentConfig ? "true" : "false";
  }
  if (placeholders.PITFALL_DOMAINS == null) {
    placeholders.PITFALL_DOMAINS = DEFAULT_PITFALL_DOMAINS;
  }
  if (placeholders.AI_TOOLS_JSON == null) {
    const tools = Array.isArray(params.ai_tools) && params.ai_tools.length ? params.ai_tools : ["cursor"];
    placeholders.AI_TOOLS_JSON = JSON.stringify(tools);
  }
  Object.assign(
    placeholders,
    buildHookPlaceholders({ params, agentConfig, existing: placeholders })
  );
  const log = [];

  if (!fs.existsSync(root)) {
    throw new Error(`Target root does not exist: ${root}`);
  }

  let files = Array.isArray(params.files) ? params.files : null;
  let expandedFromManifest = false;
  const manifestPath = resolveManifestPath(args, params);

  if ((!files || files.length === 0) && manifestPath) {
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }
    files = expandFromManifest(manifestPath, params, root);
    expandedFromManifest = true;
  } else if (!files) {
    files = [];
  }

  if (files.length === 0) {
    throw new Error(
      "No files to write: provide params.files or --manifest / expandFromManifest with ladder filters"
    );
  }

  if (args.backup) {
    files = files.map((item) => {
      const action = item.action || params.default_action || "create";
      if (action === "create") return { ...item, action: "backup-create" };
      return item;
    });
  }

  for (const item of files) {
    applyOne(root, item, placeholders, args.dryRun, log);
  }

  const unresolved = [];
  for (const item of log) {
    if (item.unresolvedPlaceholders && item.unresolvedPlaceholders.length) {
      unresolved.push({
        target: item.target,
        placeholders: item.unresolvedPlaceholders,
      });
    }
  }
  // Post-write scan for written files (catch merge leftovers)
  if (!args.dryRun) {
    for (const item of log) {
      if (!["written", "created-as-new", "merged", "yaml-keys-merged", "appended-lines"].includes(item.status))
        continue;
      if (item.unresolvedPlaceholders) continue;
      const abs = path.join(root, item.target);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
      try {
        const content = fs.readFileSync(abs, "utf8");
        const matches = findUnresolvedPlaceholders(content);
        if (matches.length) unresolved.push({ target: item.target, placeholders: matches });
      } catch {
        /* ignore */
      }
    }
  }

  if (unresolved.length) {
    console.warn("⚠️ 未解析的占位符:");
    for (const u of unresolved) {
      console.warn(`  ${u.target}: ${u.placeholders.join(", ")}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: args.dryRun,
        backup: !!args.backup,
        root,
        expandedFromManifest,
        manifest: expandedFromManifest ? manifestPath : undefined,
        warnings: unresolved.length ? { unresolved } : undefined,
        results: log,
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
