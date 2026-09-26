/**
 * session-live / fill-mcp 共享探针库（会话自证）。
 *
 * - 加载 host/session-live-checks.yaml
 * - 从 Agent 观测 JSON 评定 pass|fail|unproven|skipped_*
 * - 写入 session-live-latest.yaml + meta.session_live 摘要
 * - MCP 强证结果可供填充 MCP 闸路径 A 复用（hooks 不在此闸内）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "./yaml.mjs";
import {
  findHarnessMetaFile,
  canonicalHarnessMetaPath,
} from "./harness-meta.mjs";
import {
  resolveMcpSecretTargets,
  findMcpSecretFile,
  MCP_SECRET_CANDIDATES,
} from "./mcp-paths.mjs";
import { codexTomlToMcpDoc } from "./codex-mcp-toml.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_ROOT = path.resolve(__dirname, "../..");
export const SESSION_LIVE_CHECKS_REL = "host/session-live-checks.yaml";
export const SESSION_LIVE_LATEST_REL = "docs/harness-eng/session-live-latest.yaml";

export const STATUS = Object.freeze({
  PASS: "pass",
  FAIL: "fail",
  UNPROVEN: "unproven",
  SKIPPED_WRONG_HOST: "skipped_wrong_host",
  SKIPPED_NO_LIVE_SURFACE: "skipped_no_live_surface",
});

const BUILTIN_HOSTS = ["cursor", "claude", "codex", "qoder", "trae", "workbuddy"];

/**
 * @param {string} [skillRoot]
 */
export function loadSessionLiveChecks(skillRoot = SKILL_ROOT) {
  const abs = path.join(skillRoot, ...SESSION_LIVE_CHECKS_REL.split("/"));
  if (!fs.existsSync(abs)) {
    throw new Error(`missing ${SESSION_LIVE_CHECKS_REL}`);
  }
  const doc = parseYaml(fs.readFileSync(abs, "utf8"));
  if (!doc?.hosts || typeof doc.hosts !== "object") {
    throw new Error("session-live-checks.yaml: missing hosts");
  }
  return doc;
}

export function listBuiltinHosts(checks = loadSessionLiveChecks()) {
  return Object.keys(checks.hosts || {}).filter((h) => BUILTIN_HOSTS.includes(h));
}

export function getHostSpec(hostId, checks = loadSessionLiveChecks()) {
  const id = String(hostId || "").trim().toLowerCase();
  if (!id) return null;
  if (checks.hosts?.[id]) return { id, ...checks.hosts[id] };
  return null;
}

/**
 * Heuristic host recommendation from disk signals (Agent may override).
 * @returns {{ recommended: string|null, candidates: string[], note: string }}
 */
export function recommendLiveHost(root, checks = loadSessionLiveChecks()) {
  const candidates = [];
  for (const id of listBuiltinHosts(checks)) {
    const spec = checks.hosts[id];
    const hints = spec.detect_hints || [];
    for (const h of hints) {
      const abs = path.join(root, ...String(h).replace(/\/$/, "").split("/"));
      if (fs.existsSync(abs)) {
        candidates.push(id);
        break;
      }
    }
  }
  const uniq = [...new Set(candidates)];
  if (uniq.length === 1) {
    return { recommended: uniq[0], candidates: uniq, note: "single disk hint" };
  }
  if (uniq.length === 0) {
    return { recommended: null, candidates: [], note: "no disk hints; ask Q_LIVE_HOST" };
  }
  return {
    recommended: null,
    candidates: uniq,
    note: "ambiguous hosts on disk; ask Q_LIVE_HOST (do not guess)",
  };
}

/**
 * List mcpServers keys from first available secret for host / ai_tools.
 */
export function listDiskMcpServerNames(root, hostId, aiTools) {
  const tools = aiTools?.length ? aiTools : hostId ? [hostId] : [];
  const preferred = resolveMcpSecretTargets(tools);
  const hit = findMcpSecretFile(root, preferred.length ? preferred : MCP_SECRET_CANDIDATES);
  if (!hit) {
    // Codex-only toml without JSON
    const toml = path.join(root, ".codex", "config.toml");
    const tomlEx = path.join(root, ".codex", "config.toml.example");
    for (const abs of [toml, tomlEx]) {
      if (!fs.existsSync(abs)) continue;
      try {
        const doc = codexTomlToMcpDoc(fs.readFileSync(abs, "utf8"), process.env);
        return {
          rel: path.relative(root, abs).replace(/\\/g, "/"),
          servers: Object.keys(doc.mcpServers || {}),
        };
      } catch {
        /* next */
      }
    }
    return { rel: null, servers: [] };
  }
  try {
    if (hit.rel.endsWith(".toml")) {
      const doc = codexTomlToMcpDoc(fs.readFileSync(hit.abs, "utf8"), process.env);
      return { rel: hit.rel, servers: Object.keys(doc.mcpServers || {}) };
    }
    const doc = JSON.parse(fs.readFileSync(hit.abs, "utf8"));
    return { rel: hit.rel, servers: Object.keys(doc.mcpServers || {}) };
  } catch {
    return { rel: hit.rel, servers: [] };
  }
}

function hasNonEmptyDir(root, rel) {
  const abs = path.join(root, ...String(rel).split("/"));
  if (!fs.existsSync(abs)) return false;
  try {
    const st = fs.statSync(abs);
    if (st.isFile()) return st.size > 0;
    const names = fs.readdirSync(abs);
    return names.some((n) => {
      try {
        return fs.statSync(path.join(abs, n)).size > 0 || fs.statSync(path.join(abs, n)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Score one probe from Agent observation.
 * @param {object} obs — see modes/session-live.md observations
 */
export function evaluateObservations(root, obs, checks = loadSessionLiveChecks()) {
  const host = String(obs.host || obs.live_host || "").trim().toLowerCase();
  const spec = getHostSpec(host, checks);
  const now = obs.observed_at || new Date().toISOString();
  const aiTools = Array.isArray(obs.ai_tools) ? obs.ai_tools : [];

  if (!spec) {
    const status = STATUS.SKIPPED_NO_LIVE_SURFACE;
    return {
      schema: "session-live/v1",
      at: now,
      host: host || null,
      checks: [
        {
          id: "host_surface",
          surface: "meta",
          status,
          note: "unknown or custom-entry host; no live surface",
        },
      ],
      counts: countStatuses([{ status }]),
      claims: {
        behavior_pass_claim: false,
        mcp_gate_path_a: false,
      },
      skipped_hosts: buildSkippedHosts(host, aiTools, checks),
    };
  }

  const results = [];

  // --- MCP ---
  const diskMcp = listDiskMcpServerNames(root, host, aiTools.length ? aiTools : [host]);
  const expected =
    Array.isArray(obs.mcp?.expected_servers) && obs.mcp.expected_servers.length
      ? obs.mcp.expected_servers.map(String)
      : diskMcp.servers;
  const seen = new Set((obs.mcp?.tools_seen || []).map((s) => String(s)));
  const overlap = expected.filter((s) => seen.has(s));
  let mcpListStatus = STATUS.UNPROVEN;
  if (obs.mcp?.skipped) {
    mcpListStatus = STATUS.UNPROVEN;
  } else if (!expected.length) {
    mcpListStatus = seen.size ? STATUS.PASS : STATUS.UNPROVEN;
  } else if (overlap.length) {
    mcpListStatus = STATUS.PASS;
  } else if (Array.isArray(obs.mcp?.tools_seen)) {
    mcpListStatus = STATUS.FAIL;
  }
  results.push({
    id: "mcp_tools_seen",
    surface: "mcp",
    strength: "strong",
    status: mcpListStatus,
    expected,
    seen: [...seen],
    overlap,
    disk_secret: diskMcp.rel,
    note: obs.mcp?.list_note || "",
  });

  const call = obs.mcp?.readonly_call || {};
  let mcpCallStatus = STATUS.UNPROVEN;
  if (call.calibrate_live_ok === true) {
    mcpCallStatus = STATUS.PASS;
  } else if (call.ok === true) {
    mcpCallStatus = STATUS.PASS;
  } else if (call.ok === false) {
    mcpCallStatus = STATUS.FAIL;
  }
  results.push({
    id: "mcp_readonly_call",
    surface: "mcp",
    strength: "strong",
    status: mcpCallStatus,
    server: call.server || null,
    note: call.note || "",
  });

  // --- Hooks ---
  const hooksObs = obs.hooks || {};
  let hooksStatus = STATUS.UNPROVEN;
  if (hooksObs.triggered === true && hooksObs.injection_seen === true) {
    hooksStatus = STATUS.PASS;
  } else if (hooksObs.triggered === true && hooksObs.injection_seen === false) {
    hooksStatus = STATUS.FAIL;
  } else if (hooksObs.panel_disabled === true) {
    hooksStatus = STATUS.UNPROVEN;
  }
  results.push({
    id: "hooks_trigger",
    surface: "hooks",
    strength: "strong",
    status: hooksStatus,
    event_hint: spec.hooks?.event_hint,
    matcher_hint: spec.hooks?.matcher_hint,
    command: hooksObs.command || spec.hooks?.probes?.[0]?.safe_command || null,
    note: hooksObs.note || spec.hooks?.note || "",
  });

  // --- Rules (weak) ---
  const rulesPaths = spec.rules?.disk_paths || [];
  const diskOk =
    typeof obs.rules?.disk_ok === "boolean"
      ? obs.rules.disk_ok
      : rulesPaths.some((p) => hasNonEmptyDir(root, p));
  results.push({
    id: "rules_disk",
    surface: "rules",
    strength: "weak",
    status: diskOk ? STATUS.PASS : STATUS.FAIL,
    paths: rulesPaths,
    note: obs.rules?.disk_note || "",
  });

  const sr = obs.rules?.self_report || {};
  let srStatus = STATUS.UNPROVEN;
  if (sr.ok === true && String(sr.quoted || "").trim()) srStatus = STATUS.PASS;
  else if (sr.ok === false) srStatus = STATUS.FAIL;
  results.push({
    id: "rules_self_report",
    surface: "rules",
    strength: "weak",
    status: srStatus,
    quoted: sr.quoted || null,
    note: sr.note || "weak evidence only",
  });

  const counts = countStatuses(results);
  const mcpPass =
    results.find((c) => c.id === "mcp_tools_seen")?.status === STATUS.PASS &&
    results.find((c) => c.id === "mcp_readonly_call")?.status === STATUS.PASS;
  const hooksPass = results.find((c) => c.id === "hooks_trigger")?.status === STATUS.PASS;
  const hooksFail = results.find((c) => c.id === "hooks_trigger")?.status === STATUS.FAIL;
  const mcpFail = results.some(
    (c) => c.surface === "mcp" && c.status === STATUS.FAIL
  );

  return {
    schema: "session-live/v1",
    at: now,
    host,
    family: spec.family,
    checks: results,
    counts,
    claims: {
      behavior_pass_claim: mcpPass && hooksPass && !hooksFail && !mcpFail,
      mcp_gate_path_a: mcpPass,
    },
    skipped_hosts: buildSkippedHosts(host, aiTools, checks),
    notes: obs.notes || [],
  };
}

function buildSkippedHosts(current, aiTools, checks) {
  const out = [];
  const tools = (aiTools || []).map((t) => String(t).toLowerCase());
  for (const id of listBuiltinHosts(checks)) {
    if (id === current) continue;
    if (tools.length && !tools.includes(id)) continue;
    out.push({ host: id, status: STATUS.SKIPPED_WRONG_HOST });
  }
  return out;
}

function countStatuses(checks) {
  const counts = {
    pass: 0,
    fail: 0,
    unproven: 0,
    skipped: 0,
  };
  for (const c of checks) {
    const s = c.status;
    if (s === STATUS.PASS) counts.pass++;
    else if (s === STATUS.FAIL) counts.fail++;
    else if (s === STATUS.UNPROVEN) counts.unproven++;
    else if (String(s).startsWith("skipped")) counts.skipped++;
  }
  return counts;
}

/**
 * Whether fill-mcp path A is satisfied by a session-live report (or claims).
 */
export function mcpGatePathAFromReport(report) {
  return !!(report?.claims?.mcp_gate_path_a);
}

export function writeSessionLiveReport(root, report) {
  const abs = path.join(root, ...SESSION_LIVE_LATEST_REL.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const text = stringifyYaml(report) + "\n";
  fs.writeFileSync(abs, text, "utf8");
  return { rel: SESSION_LIVE_LATEST_REL, abs };
}

/**
 * Merge lean session_live summary into harness-meta.yaml.
 */
export function patchHarnessMetaSessionLive(root, report) {
  const summary = {
    at: report.at,
    host: report.host,
    pass: report.counts?.pass ?? 0,
    fail: report.counts?.fail ?? 0,
    unproven: report.counts?.unproven ?? 0,
    skipped: report.counts?.skipped ?? 0,
    behavior_pass_claim: !!report.claims?.behavior_pass_claim,
    mcp_gate_path_a: !!report.claims?.mcp_gate_path_a,
  };

  const found = findHarnessMetaFile(root);
  const dest = canonicalHarnessMetaPath(root);
  let doc = {};
  if (found) {
    try {
      doc = parseYaml(fs.readFileSync(found.abs, "utf8")) || {};
    } catch {
      doc = {};
    }
  }
  doc.session_live = summary;
  fs.mkdirSync(path.dirname(dest.abs), { recursive: true });
  fs.writeFileSync(dest.abs, stringifyYaml(doc) + "\n", "utf8");
  return { rel: dest.rel, summary };
}

/**
 * Print checklist for Agent (no scoring).
 */
export function formatHostChecklist(hostId, checks = loadSessionLiveChecks()) {
  const spec = getHostSpec(hostId, checks);
  if (!spec) return `Unknown host: ${hostId}\n`;
  const lines = [`# session-live checklist — ${hostId} (family=${spec.family})`, ""];
  for (const surface of ["mcp", "hooks", "rules"]) {
    const block = spec[surface];
    if (!block?.probes) continue;
    lines.push(`## ${surface}`);
    if (block.note) lines.push(`note: ${block.note}`);
    if (block.event_hint) lines.push(`event: ${block.event_hint}`);
    if (block.matcher_hint) lines.push(`matcher: ${block.matcher_hint}`);
    for (const p of block.probes) {
      lines.push(`- [${p.strength}] ${p.id}: ${p.how || p.expect || p.safe_command || ""}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
