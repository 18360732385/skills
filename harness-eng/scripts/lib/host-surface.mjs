/**
 * Host surface projection for report_schema 0.4.0+.
 * Disk = present|absent only (never pass). Live = session-live statuses.
 * SSOT paths: host/session-live-checks.yaml via live-probes.
 */
import fs from "fs";
import path from "path";
import { parse as parseYaml } from "./yaml.mjs";
import {
  loadSessionLiveChecks,
  listBuiltinHosts,
  getHostSpec,
  SESSION_LIVE_LATEST_REL,
  SESSION_LIVE_MATRIX_REL,
  probeGithooks,
} from "./live-probes.mjs";

const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const SURFACES = ["rules", "hooks", "mcp", "githooks", "human_gates"];

function pathExistsNonEmpty(root, rel) {
  if (!rel) return false;
  const abs = path.join(root, ...String(rel).replace(/\\/g, "/").split("/"));
  if (!fs.existsSync(abs)) return false;
  try {
    const st = fs.statSync(abs);
    if (st.isFile()) return st.size > 0;
    const names = fs.readdirSync(abs);
    return names.length > 0;
  } catch {
    return false;
  }
}

function anyPathPresent(root, rels) {
  if (!Array.isArray(rels) || !rels.length) return false;
  return rels.some((r) => pathExistsNonEmpty(root, r));
}

function readYamlIfExists(root, rel) {
  const abs = path.join(root, ...rel.split("/"));
  if (!fs.existsSync(abs)) return null;
  try {
    const doc = parseYaml(fs.readFileSync(abs, "utf8"));
    return doc && typeof doc === "object" ? doc : null;
  } catch {
    return null;
  }
}

function probeDiskForHost(root, hostId, checks, githooksDisk) {
  const spec = getHostSpec(hostId, checks);
  if (!spec) {
    return {
      rules: "absent",
      hooks: "absent",
      mcp: "absent",
      githooks: githooksDisk,
      human_gates: "absent",
    };
  }
  const rulesPresent = anyPathPresent(root, spec.rules?.disk_paths || []);
  const hooksPaths = [
    ...(spec.hooks?.config_paths || []),
    ...(spec.hooks?.settings_paths || []),
  ];
  // Claude-family often uses settings.json for hooks
  if (spec.family === "claude" || hostId === "workbuddy") {
    const hintDirs = (spec.detect_hints || [])
      .filter((h) => String(h).includes("/"))
      .map((h) => String(h).replace(/\/$/, ""));
    for (const d of hintDirs) {
      hooksPaths.push(`${d}/settings.json`);
      hooksPaths.push(`${d}/hooks.json`);
    }
  }
  const hooksPresent = anyPathPresent(root, hooksPaths);
  const mcpPaths = [
    ...(spec.mcp?.secret_paths || []),
    ...(spec.mcp?.example_paths || []),
  ];
  const mcpPresent = anyPathPresent(root, mcpPaths);
  return {
    rules: rulesPresent ? "present" : "absent",
    hooks: hooksPresent ? "present" : "absent",
    mcp: mcpPresent ? "present" : "absent",
    githooks: githooksDisk,
    human_gates: "absent", // never auto-pass from disk
  };
}

function aggregateLiveSurface(checks, surface) {
  const subset = (checks || []).filter((c) => c.surface === surface || c.id?.startsWith?.(surface));
  if (!subset.length) {
    // fallback: match by id prefix
    const byId = (checks || []).filter((c) => {
      const id = String(c.id || "");
      if (surface === "rules") return id.startsWith("rules_");
      if (surface === "hooks") return id.startsWith("hooks_");
      if (surface === "mcp") return id.startsWith("mcp_");
      if (surface === "githooks") return id.startsWith("githooks_");
      if (surface === "human_gates") return c.surface === "human_gates" || id.includes("approval") || id.includes("trusted") || id.includes("settings_on") || id.includes("hooks_panel");
      return false;
    });
    return reduceStatuses(byId);
  }
  return reduceStatuses(subset);
}

function reduceStatuses(items) {
  if (!items.length) return "unproven";
  const statuses = items.map((c) => c.status);
  if (statuses.some((s) => s === "fail")) return "fail";
  if (statuses.every((s) => s === "pass")) return "pass";
  if (statuses.every((s) => String(s).startsWith("skipped"))) return statuses[0];
  if (statuses.some((s) => s === "pass")) {
    // mixed pass + unproven → unproven overall for that surface unless all critical pass
    if (statuses.every((s) => s === "pass" || s === "unproven" || String(s).startsWith("skipped"))) {
      return statuses.includes("unproven") ? "unproven" : "pass";
    }
  }
  if (statuses.some((s) => s === "unproven")) return "unproven";
  return statuses[0] || "unproven";
}

function liveFromReport(report) {
  if (!report || typeof report !== "object") return null;
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const surfaces = {};
  for (const s of SURFACES) {
    surfaces[s] = aggregateLiveSurface(checks, s);
  }
  // Prefer claims when present for coarse signals
  if (report.claims?.githooks_ok === true) surfaces.githooks = "pass";
  if (report.claims?.human_gates_ok === true) surfaces.human_gates = "pass";
  if (report.claims?.mcp_gate_path_a === true && surfaces.mcp === "unproven") {
    surfaces.mcp = "pass";
  }
  return {
    host: report.host || null,
    at: report.at || null,
    surfaces,
    claims: report.claims || {},
    counts: report.counts || null,
  };
}

function isStale(atIso, now = Date.now()) {
  if (!atIso) return true;
  const t = Date.parse(atIso);
  if (Number.isNaN(t)) return true;
  return now - t > STALE_MS;
}

function capsuleStatus(hosts, livePresent, stale) {
  if (!livePresent) return "absent";
  if (stale) return "unproven";
  const liveHosts = hosts.filter((h) => h.live && h.live.status);
  if (!liveHosts.length) return "unproven";
  if (liveHosts.some((h) => h.claims?.behavior_pass_claim)) return "live";
  if (liveHosts.some((h) => Object.values(h.live).includes("pass"))) return "live";
  return "unproven";
}

/**
 * Build ui.host_surface for report / session-dash.
 * @param {string} root target repo
 * @param {object} [opts]
 * @param {object} [opts.meta]
 * @param {object} [opts.latest] session-live-latest override
 * @param {object} [opts.matrix] session-live-matrix override
 * @param {object} [opts.checks]
 */
export function buildHostSurface(root, opts = {}) {
  const checks = opts.checks || loadSessionLiveChecks();
  const hostIds = listBuiltinHosts(checks);
  const meta = opts.meta && typeof opts.meta === "object" ? opts.meta : {};
  const aiTools = Array.isArray(meta.ai_tools)
    ? meta.ai_tools.map((t) => String(t).toLowerCase())
    : [];

  const gh = root ? probeGithooks(root) : { pathOk: false, precommitOk: false };
  const githooksDisk =
    gh.pathOk || gh.precommitOk || pathExistsNonEmpty(root, ".githooks")
      ? "present"
      : "absent";

  const latest =
    opts.latest ||
    (root ? readYamlIfExists(root, SESSION_LIVE_LATEST_REL) : null);
  const matrix =
    opts.matrix ||
    (root ? readYamlIfExists(root, SESSION_LIVE_MATRIX_REL) : null);

  const liveByHost = {};
  if (latest?.host) {
    liveByHost[String(latest.host).toLowerCase()] = liveFromReport(latest);
  }
  const matrixHosts = Array.isArray(matrix?.hosts) ? matrix.hosts : [];
  for (const row of matrixHosts) {
    const id = String(row.host || row.id || "").toLowerCase();
    if (!id) continue;
    if (!liveByHost[id] || (row.at && liveByHost[id].at && row.at > liveByHost[id].at)) {
      liveByHost[id] = liveFromReport({
        host: id,
        at: row.at,
        checks: row.checks || [],
        claims: row.claims || {},
        counts: row.counts || null,
      });
    }
  }

  // Lean meta.session_live only fills current host claims if no full report
  const metaLive = meta.session_live;
  if (metaLive && typeof metaLive === "object" && metaLive.host) {
    const id = String(metaLive.host).toLowerCase();
    if (!liveByHost[id]) {
      liveByHost[id] = {
        host: id,
        at: metaLive.at || null,
        surfaces: {
          rules: "unproven",
          hooks: metaLive.behavior_pass_claim ? "pass" : "unproven",
          mcp: metaLive.mcp_gate_path_a ? "pass" : "unproven",
          githooks: metaLive.githooks_ok ? "pass" : "unproven",
          human_gates: metaLive.human_gates_ok ? "pass" : "unproven",
        },
        claims: {
          behavior_pass_claim: !!metaLive.behavior_pass_claim,
          mcp_gate_path_a: !!metaLive.mcp_gate_path_a,
          githooks_ok: !!metaLive.githooks_ok,
          human_gates_ok: !!metaLive.human_gates_ok,
        },
        counts: null,
        from_meta: true,
      };
    }
  }

  const current =
    (latest && latest.host) ||
    (metaLive && metaLive.host) ||
    (aiTools.length === 1 ? aiTools[0] : null) ||
    null;

  const generatedAt =
    (latest && latest.at) ||
    (metaLive && metaLive.at) ||
    null;
  const stale = !generatedAt || isStale(generatedAt);
  const livePresent = Object.keys(liveByHost).length > 0;

  const hosts = hostIds.map((id) => {
    const disk = root
      ? probeDiskForHost(root, id, checks, githooksDisk)
      : {
          rules: "absent",
          hooks: "absent",
          mcp: "absent",
          githooks: "absent",
          human_gates: "absent",
        };
    const liveEntry = liveByHost[id] || null;
    let live = null;
    if (liveEntry) {
      live = { ...liveEntry.surfaces };
    } else if (aiTools.length && !aiTools.includes(id) && current && id !== current) {
      live = {
        rules: "skipped_wrong_host",
        hooks: "skipped_wrong_host",
        mcp: "skipped_wrong_host",
        githooks: "skipped_wrong_host",
        human_gates: "skipped_wrong_host",
      };
    }

    const diskAny = SURFACES.some((s) => disk[s] === "present");
    return {
      id,
      label_zh: id,
      current: current === id,
      in_ai_tools: !aiTools.length || aiTools.includes(id),
      disk,
      live,
      claims: liveEntry?.claims || null,
      live_at: liveEntry?.at || null,
      disk_any: diskAny,
      status: liveEntry
        ? liveEntry.claims?.behavior_pass_claim
          ? "live"
          : "unproven"
        : diskAny
          ? "disk_only"
          : "absent",
    };
  });

  const status = capsuleStatus(hosts, livePresent, stale);
  const hintCmd =
    "node scripts/session-live.mjs --root <TARGET> --emit-playbook";

  let summary_zh = "未自证";
  if (status === "live") summary_zh = current ? `${current} live` : "已自证";
  else if (status === "unproven" && livePresent) summary_zh = "自证不完整/过期";
  else if (hosts.some((h) => h.disk_any)) summary_zh = "仅磁盘齐套（≠生效）";

  return {
    status,
    summary_zh,
    current: current ? String(current).toLowerCase() : null,
    generated_at: generatedAt,
    stale,
    claims: latest?.claims || metaLive || null,
    hosts,
    surfaces: SURFACES,
    legend: {
      disk: "灰灯=磁盘存在（present/absent），≠生效",
      live: "彩灯=session-live（pass/fail/unproven/skipped）",
    },
    empty_hint:
      status === "absent"
        ? "尚未 session-live；磁盘有文件也不等于 hooks/MCP/rules 生效。"
        : null,
    hint_command: hintCmd,
  };
}

/**
 * One-line summary for session dashboard.
 */
export function formatHostSurfaceLine(hs) {
  if (!hs || typeof hs !== "object") return null;
  if (hs.status === "absent" && !(hs.hosts || []).some((h) => h.disk_any)) {
    return null;
  }
  const parts = [];
  const hosts = Array.isArray(hs.hosts) ? hs.hosts : [];
  const focus = hosts.filter((h) => h.current || h.live || (h.in_ai_tools && h.disk_any));
  const list = (focus.length ? focus : hosts.filter((h) => h.disk_any || h.live)).slice(0, 4);
  for (const h of list) {
    const bits = [h.id];
    if (h.status === "live") bits.push("live");
    else if (h.live) bits.push("未自证");
    else if (h.disk_any) bits.push("磁盘");
    else bits.push("无");
    if (h.live?.hooks === "pass") bits.push("hooks✓");
    if (h.live?.mcp === "pass") bits.push("mcp✓");
    if (h.live?.rules === "pass") bits.push("rules✓");
    parts.push(bits.join(" "));
  }
  if (!parts.length) return `宿主面：${hs.summary_zh || "未自证"}`;
  return `宿主面：${parts.join(" · ")}`;
}

export { SURFACES, STALE_MS };
