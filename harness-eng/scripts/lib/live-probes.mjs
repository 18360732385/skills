/**
 * session-live / fill-mcp 共享探针库（会话自证 · 检查表 1.2）。
 *
 * - 加载 host/session-live-checks.yaml
 * - 从 Agent 观测 JSON 评定 pass|fail|unproven|skipped_*
 * - human_gates：ok=true→pass；ok=false/缺省→unproven+reason_code（不用 fail）
 * - githooks 可由脚本自探；rules_scope / skills / starlark 需 Agent 观测
 * - playbook / matrix：多宿主粘贴剧本与合并报告
 * - behavior_pass_claim 仅看 MCP strong + hooks_trigger
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
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
export const SESSION_LIVE_STUBS_REL = "docs/harness-eng/session-live-stubs";
export const SESSION_LIVE_PLAYBOOK_REL = "docs/harness-eng/session-live-playbook.md";
export const SESSION_LIVE_MATRIX_REL = "docs/harness-eng/session-live-matrix.yaml";

export const REASON_CODES = Object.freeze({
  PANEL_MCP_OFF: "panel_mcp_off",
  HOOKS_PANEL_OFF: "hooks_panel_off",
  HOOKS_NOT_APPLIED: "hooks_not_applied",
  MCP_APPROVAL_PENDING: "mcp_approval_pending",
  WORKSPACE_UNTRUSTED: "workspace_untrusted",
  HOOKS_UNTRUSTED: "hooks_untrusted",
});

/** Per-host expected human_gates probe ids (1.2). */
export const HUMAN_GATES_BY_HOST = Object.freeze({
  cursor: ["mcp_first_approval"],
  claude: ["mcp_first_approval"],
  qoder: ["mcp_first_approval"],
  trae: ["mcp_settings_on", "hooks_settings_on"],
  workbuddy: ["hooks_panel_applied", "mcp_first_approval"],
  codex: ["workspace_trusted", "hooks_trusted"],
});
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
 * Auto-probe githooks (no Agent observation required).
 * @returns {{ hooksPath: string|null, pathOk: boolean, precommitOk: boolean }}
 */
export function probeGithooks(root) {
  let hooksPath = null;
  try {
    const r = spawnSync("git", ["config", "--get", "core.hooksPath"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    if (r.status === 0) hooksPath = String(r.stdout || "").trim() || null;
  } catch {
    hooksPath = null;
  }
  const norm = String(hooksPath || "").replace(/\\/g, "/");
  const pathOk = !!(norm && /(^|[\/])\.githooks(\/|$)/.test(norm));
  const precommitOk = fs.existsSync(path.join(root, ".githooks", "pre-commit"));
  return { hooksPath, pathOk, precommitOk };
}

/** List skill directory names under .agents/skills/ (exclude GENERATED.md). */
export function listAgentsSkillNames(root) {
  const dir = path.join(root, ".agents", "skills");
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => n && n !== "node_modules");
  } catch {
    return [];
  }
}

function hostHasProbe(spec, surface, id) {
  return !!(spec?.[surface]?.probes || []).some((p) => p.id === id);
}

/**
 * Score probes from Agent observation (+ auto githooks).
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
      schema: "session-live/v1.2",
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
        githooks_ok: false,
        human_gates_ok: false,
      },
      skipped_hosts: buildSkippedHosts(host, aiTools, checks),
    };
  }

  const results = [];

  // --- Human gates (before MCP/hooks; never fail — unproven + reason_code) ---
  const gateProbes = spec.human_gates?.probes || [];
  const gateObs = obs.human_gates || {};
  for (const gp of gateProbes) {
    const raw = gateObs[gp.id];
    let status = STATUS.UNPROVEN;
    let reason = gp.reason_code || null;
    if (raw === true) {
      status = STATUS.PASS;
      reason = null;
    } else if (raw === false) {
      status = STATUS.UNPROVEN;
      reason = gp.reason_code || "gate_off";
    }
    results.push({
      id: gp.id,
      surface: "human_gates",
      strength: "gate",
      status,
      reason_code: reason,
      note: status === STATUS.PASS ? "" : gp.how || "",
    });
  }

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

  // Codex skills_seen (listed under mcp.probes in checks yaml)
  if (hostHasProbe(spec, "mcp", "skills_seen")) {
    const diskSkills = listAgentsSkillNames(root);
    const seenSkills = [
      ...(obs.skills?.seen || []),
      ...(obs.mcp?.skills_seen || []),
    ].map(String);
    let skStatus = STATUS.UNPROVEN;
    if (obs.skills?.skipped === true) {
      skStatus = STATUS.UNPROVEN;
    } else if (seenSkills.length) {
      const overlapSk = diskSkills.length
        ? diskSkills.filter((n) => seenSkills.includes(n))
        : seenSkills;
      skStatus = overlapSk.length || (!diskSkills.length && seenSkills.length)
        ? STATUS.PASS
        : STATUS.FAIL;
    } else if (Array.isArray(obs.skills?.seen) || Array.isArray(obs.mcp?.skills_seen)) {
      skStatus = diskSkills.length ? STATUS.FAIL : STATUS.UNPROVEN;
    }
    results.push({
      id: "skills_seen",
      surface: "mcp",
      strength: "medium",
      status: skStatus,
      expected: diskSkills,
      seen: seenSkills,
      note: obs.skills?.note || "Codex /skills or $ visibility",
    });
  }

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

  // --- Githooks (auto unless skip_auto) ---
  if (spec.githooks?.probes?.length) {
    const skipAuto = obs.githooks?.skip_auto === true;
    let pathStatus = STATUS.UNPROVEN;
    let preStatus = STATUS.UNPROVEN;
    let gh = { hooksPath: null, pathOk: false, precommitOk: false };
    if (!skipAuto) {
      gh = probeGithooks(root);
      if (typeof obs.githooks?.path_ok === "boolean") {
        pathStatus = obs.githooks.path_ok ? STATUS.PASS : STATUS.FAIL;
      } else {
        pathStatus = gh.pathOk ? STATUS.PASS : STATUS.FAIL;
      }
      if (typeof obs.githooks?.precommit_ok === "boolean") {
        preStatus = obs.githooks.precommit_ok ? STATUS.PASS : STATUS.FAIL;
      } else {
        preStatus = gh.precommitOk ? STATUS.PASS : STATUS.FAIL;
      }
    } else if (typeof obs.githooks?.path_ok === "boolean") {
      pathStatus = obs.githooks.path_ok ? STATUS.PASS : STATUS.FAIL;
      preStatus =
        typeof obs.githooks?.precommit_ok === "boolean"
          ? obs.githooks.precommit_ok
            ? STATUS.PASS
            : STATUS.FAIL
          : STATUS.UNPROVEN;
    }
    results.push({
      id: "githooks_path",
      surface: "githooks",
      strength: "medium",
      status: pathStatus,
      hooksPath: gh.hooksPath,
      note: obs.githooks?.note || "",
    });
    results.push({
      id: "githooks_precommit",
      surface: "githooks",
      strength: "medium",
      status: preStatus,
      note: "",
    });
  }

  // --- Rules ---
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

  if (hostHasProbe(spec, "rules", "rules_scope_probe")) {
    const scope = obs.rules?.scope || {};
    let scopeStatus = STATUS.UNPROVEN;
    const hasMatched = typeof scope.matched_injected === "boolean";
    const hasUnmatched = typeof scope.unmatched_weak === "boolean";
    if (hasMatched && hasUnmatched) {
      scopeStatus =
        scope.matched_injected === true && scope.unmatched_weak === true
          ? STATUS.PASS
          : STATUS.FAIL;
    } else if (hasMatched || hasUnmatched) {
      scopeStatus = STATUS.FAIL;
    }
    results.push({
      id: "rules_scope_probe",
      surface: "rules",
      strength: "medium",
      status: scopeStatus,
      matched_path: scope.matched_path || null,
      unmatched_path: scope.unmatched_path || null,
      note: scope.note || "medium; does not alone authorize behavior_pass_claim",
    });
  }

  if (hostHasProbe(spec, "rules", "starlark_forbid")) {
    const st = obs.starlark || {};
    let stStatus = STATUS.UNPROVEN;
    if (st.observed === true) {
      stStatus = st.forbid_or_prompt === true ? STATUS.PASS : STATUS.FAIL;
    } else if (st.observed === false) {
      stStatus = STATUS.UNPROVEN;
    }
    results.push({
      id: "starlark_forbid",
      surface: "rules",
      strength: "medium",
      status: stStatus,
      note: st.note || "observe_only; never run push --force / reset --hard",
    });
  }

  const counts = countStatuses(results);
  const mcpPass =
    results.find((c) => c.id === "mcp_tools_seen")?.status === STATUS.PASS &&
    results.find((c) => c.id === "mcp_readonly_call")?.status === STATUS.PASS;
  const hooksPass = results.find((c) => c.id === "hooks_trigger")?.status === STATUS.PASS;
  const hooksFail = results.find((c) => c.id === "hooks_trigger")?.status === STATUS.FAIL;
  const mcpFail = results.some(
    (c) => c.id === "mcp_tools_seen" || c.id === "mcp_readonly_call"
      ? c.status === STATUS.FAIL
      : false
  );
  const githooksOk =
    results.find((c) => c.id === "githooks_path")?.status === STATUS.PASS &&
    results.find((c) => c.id === "githooks_precommit")?.status === STATUS.PASS;
  const gateChecks = results.filter((c) => c.surface === "human_gates");
  const humanGatesOk =
    gateChecks.length > 0 && gateChecks.every((c) => c.status === STATUS.PASS);

  return {
    schema: "session-live/v1.2",
    at: now,
    host,
    family: spec.family,
    checks: results,
    counts,
    claims: {
      behavior_pass_claim: mcpPass && hooksPass && !hooksFail && !mcpFail,
      mcp_gate_path_a: mcpPass,
      githooks_ok: !!githooksOk,
      human_gates_ok: !!humanGatesOk,
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
  const out = { rel: SESSION_LIVE_LATEST_REL, abs };
  if (report.host) {
    const stubDir = path.join(root, ...SESSION_LIVE_STUBS_REL.split("/"));
    fs.mkdirSync(stubDir, { recursive: true });
    const stubRel = `${SESSION_LIVE_STUBS_REL}/report-${report.host}.yaml`;
    const stubAbs = path.join(root, ...stubRel.split("/"));
    fs.writeFileSync(stubAbs, text, "utf8");
    out.stubRel = stubRel;
  }
  return out;
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
    githooks_ok: !!report.claims?.githooks_ok,
    human_gates_ok: !!report.claims?.human_gates_ok,
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
  const lines = [
    `# session-live checklist — ${hostId} (family=${spec.family}, checks=${checks.version || "?"})`,
    "",
  ];
  for (const surface of ["human_gates", "mcp", "hooks", "githooks", "rules"]) {
    const block = spec[surface];
    if (!block?.probes) continue;
    lines.push(`## ${surface}`);
    if (block.note) lines.push(`note: ${block.note}`);
    if (block.manual) lines.push(`manual: ${block.manual}`);
    if (block.event_hint) lines.push(`event: ${block.event_hint}`);
    if (block.matcher_hint) lines.push(`matcher: ${block.matcher_hint}`);
    for (const p of block.probes) {
      const safe = p.safe ? ` safe=${p.safe}` : "";
      const rc = p.reason_code ? ` reason=${p.reason_code}` : "";
      lines.push(
        `- [${p.strength}] ${p.id}: ${p.how || p.expect || p.safe_command || ""}${rc}${safe}`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Required probe ids shared by all hosts (1.2 still needs 1.1 set). */
export const REQUIRED_PROBE_IDS_1_1 = Object.freeze([
  "mcp_tools_seen",
  "mcp_readonly_call",
  "hooks_trigger",
  "githooks_path",
  "githooks_precommit",
  "rules_disk",
  "rules_self_report",
  "rules_scope_probe",
]);

export function validateChecksDoc(checks = loadSessionLiveChecks()) {
  const errors = [];
  if (String(checks.version) !== "1.2") {
    errors.push(`version want 1.2 got ${checks.version}`);
  }
  for (const id of listBuiltinHosts(checks)) {
    const spec = checks.hosts[id];
    const ids = [];
    for (const surface of ["human_gates", "mcp", "hooks", "githooks", "rules"]) {
      for (const p of spec[surface]?.probes || []) ids.push(p.id);
    }
    for (const req of REQUIRED_PROBE_IDS_1_1) {
      if (!ids.includes(req)) errors.push(`${id} missing probe ${req}`);
    }
    const wantGates = HUMAN_GATES_BY_HOST[id] || [];
    for (const g of wantGates) {
      if (!ids.includes(g)) errors.push(`${id} missing human_gate ${g}`);
    }
  }
  const codexIds = [];
  for (const surface of ["mcp", "hooks", "githooks", "rules", "human_gates"]) {
    for (const p of checks.hosts?.codex?.[surface]?.probes || []) codexIds.push(p.id);
  }
  if (!codexIds.includes("skills_seen")) errors.push("codex missing skills_seen");
  if (!codexIds.includes("starlark_forbid")) errors.push("codex missing starlark_forbid");
  return { ok: errors.length === 0, errors };
}

/**
 * Build multi-host playbook markdown + obs stubs.
 * @returns {{ playbookMd: string, stubs: { host: string, rel: string, json: object }[], hosts: string[] }}
 */
export function buildPlaybook({
  root,
  aiTools,
  currentHost,
  checks = loadSessionLiveChecks(),
}) {
  const tools = (aiTools || []).map((t) => String(t).toLowerCase()).filter(Boolean);
  let targets = tools;
  if (!targets.length) {
    const rec = recommendLiveHost(root, checks);
    targets = rec.candidates.length ? rec.candidates : [];
  }
  const cur = String(currentHost || "").toLowerCase() || null;
  const others = targets.filter((h) => h !== cur && getHostSpec(h, checks));

  const lines = [
    `# session-live playbook`,
    ``,
    `生成于会话自证 1.2。**人开面板/trust → 在对应 IDE 跑探针 → --write → --merge-matrix**。`,
    `当前宿主：\`${cur || "（未指定）"}\` · ai_tools：${targets.join(", ") || "（空）"}`,
    ``,
  ];

  const stubs = [];
  for (const host of others) {
    const spec = getHostSpec(host, checks);
    const gates = (spec.human_gates?.probes || []).map((p) => ({
      id: p.id,
      reason_code: p.reason_code,
      how: p.how,
    }));
    const human_gates = {};
    for (const g of gates) human_gates[g.id] = null;

    const stub = {
      host,
      ai_tools: targets,
      human_gates,
      mcp: { tools_seen: [], readonly_call: {} },
      hooks: {},
      rules: { self_report: {}, scope: {} },
      githooks: { skip_auto: false },
    };
    if (host === "codex") {
      stub.skills = { seen: [] };
      stub.starlark = { observed: false };
    }
    const rel = `${SESSION_LIVE_STUBS_REL}/obs-${host}.json`;
    stubs.push({ host, rel, json: stub });

    lines.push(`## ${host}`);
    if (spec.human_gates?.manual) lines.push(`手册：\`${spec.human_gates.manual}\``);
    lines.push(``);
    lines.push(`### 人工闸（先做）`);
    for (const g of gates) {
      lines.push(`1. ${g.how} → 观测 \`human_gates.${g.id}=true\`（未开 reason=\`${g.reason_code}\`）`);
    }
    if (!gates.length) lines.push(`1. （无额外面板闸）`);
    lines.push(``);
    lines.push(`### 在本宿主会话`);
    lines.push(`1. 打开项目根；填 \`${rel}\`（或复制 stub）`);
    lines.push(`2. 跑 MCP 列表∩只读、hooks dry-run、rules 作用域等（见 \`--host ${host} --checklist\`）`);
    lines.push(
      `3. \`node scripts/session-live.mjs --root <TARGET> --write --from-json ${rel}\``
    );
    lines.push(``);
  }

  if (!others.length) {
    lines.push(`（无其它宿主需要剧本；仅当前宿主或 ai_tools 为空）`);
    lines.push(``);
  }

  lines.push(`## 合并`);
  lines.push(``);
  lines.push(`各宿主 --write 后：`);
  lines.push(``);
  lines.push(`\`\`\`bash`);
  lines.push(`node scripts/session-live.mjs --root <TARGET> --merge-matrix`);
  lines.push(`\`\`\``);
  lines.push(``);

  return { playbookMd: lines.join("\n"), stubs, hosts: others };
}

/**
 * Persist playbook + obs stubs under target root.
 */
export function writePlaybook(root, playbook) {
  const pbAbs = path.join(root, ...SESSION_LIVE_PLAYBOOK_REL.split("/"));
  fs.mkdirSync(path.dirname(pbAbs), { recursive: true });
  fs.writeFileSync(pbAbs, playbook.playbookMd, "utf8");
  const written = [{ rel: SESSION_LIVE_PLAYBOOK_REL }];
  for (const s of playbook.stubs) {
    const abs = path.join(root, ...s.rel.split("/"));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(s.json, null, 2) + "\n", "utf8");
    written.push({ rel: s.rel, host: s.host });
  }
  return written;
}

/**
 * Merge per-host reports into session-live-matrix.yaml.
 * @param {object[]} reports
 */
export function mergeSessionLiveReports(reports) {
  const byHost = {};
  const totals = { pass: 0, fail: 0, unproven: 0, skipped: 0 };
  for (const r of reports || []) {
    if (!r?.host) continue;
    byHost[r.host] = {
      at: r.at,
      claims: r.claims || {},
      counts: r.counts || {},
      checks_n: Array.isArray(r.checks) ? r.checks.length : 0,
    };
    for (const k of Object.keys(totals)) {
      totals[k] += Number(r.counts?.[k] || 0);
    }
  }
  const tested = Object.keys(byHost);
  return {
    schema: "session-live-matrix/v1",
    at: new Date().toISOString(),
    hosts: byHost,
    tested,
    totals,
    notes: [
      "human_gates_ok false does not block fill-mcp",
      "behavior_pass_claim is per-host; matrix does not invent cross-host PASS",
    ],
  };
}

export function writeSessionLiveMatrix(root, matrix) {
  const abs = path.join(root, ...SESSION_LIVE_MATRIX_REL.split("/"));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, stringifyYaml(matrix) + "\n", "utf8");
  return { rel: SESSION_LIVE_MATRIX_REL, abs };
}

/**
 * Load report-*.yaml from stubs dir (+ optional latest).
 */
export function loadStubReports(root) {
  const dir = path.join(root, ...SESSION_LIVE_STUBS_REL.split("/"));
  const out = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      if (!/^report-.+\.ya?ml$/i.test(name)) continue;
      try {
        const doc = parseYaml(fs.readFileSync(path.join(dir, name), "utf8"));
        if (doc?.host) out.push(doc);
      } catch {
        /* skip */
      }
    }
  }
  const latestAbs = path.join(root, ...SESSION_LIVE_LATEST_REL.split("/"));
  if (fs.existsSync(latestAbs)) {
    try {
      const doc = parseYaml(fs.readFileSync(latestAbs, "utf8"));
      if (doc?.host && !out.some((r) => r.host === doc.host)) out.push(doc);
    } catch {
      /* skip */
    }
  }
  return out;
}