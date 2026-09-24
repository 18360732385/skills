/**
 * MCP JSON (Cursor/Claude shape) → Codex project config.toml fragment.
 * Never embeds env *values* — only variable names in env_vars.
 *
 * Optional docs/agent-config/mcp/policy.json drives enabled / approval_mode
 * (per-server overrides + safe/writable heuristics).
 */

/** @param {Record<string, string>|undefined} env */
export function redactEnvToNames(env) {
  if (!env || typeof env !== "object") return [];
  return Object.keys(env).filter(Boolean);
}

/** @param {string} name */
export function looksWritableDb(name) {
  const n = String(name).toLowerCase();
  if (/readonly|read-only|read_only|\bro[-_]/.test(n)) return false;
  return /mysql|postgres|postgresql|mongo|redis|mariadb/.test(n);
}

/** gitlab / IDE / 文档类：默认可建议启用（仍须 trust + 本机 toml） */
export function looksSafeReadonlyTool(name) {
  const n = String(name).toLowerCase().replace(/_/g, "-");
  if (/readonly|read-only|read_only|\bro[-_]/.test(n)) return true;
  return /^(gitlab|chrome(-devtools)?|sonarqube|apifox|context7|node[-_]?repl|filesystem|fetch|memory)$/.test(
    n
  );
}

/**
 * @typedef {{ enabled?: boolean, approval_mode?: string }} McpServerPolicy
 * @typedef {{
 *   defaults?: McpServerPolicy,
 *   heuristics?: { enabled?: boolean, safe_tools_enabled?: boolean, writable_stores_enabled?: boolean },
 *   servers?: Record<string, McpServerPolicy>
 * }} McpPolicyDoc
 */

/**
 * Resolve enabled + approval_mode for one MCP server name.
 * Order: servers[name] → heuristics (safe/writable) → defaults → conservative false/prompt.
 *
 * @param {string} name
 * @param {McpPolicyDoc|null|undefined} policy
 * @returns {{ enabled: boolean, approval_mode: string }}
 */
export function resolveMcpServerPolicy(name, policy) {
  const defaults = policy?.defaults || {};
  const servers = policy?.servers || {};
  const heur = policy?.heuristics || {};
  const override = servers[name] || {};

  let enabled;
  if (typeof override.enabled === "boolean") {
    enabled = override.enabled;
  } else if (heur.enabled === false) {
    enabled = typeof defaults.enabled === "boolean" ? defaults.enabled : false;
  } else if (looksWritableDb(name)) {
    enabled =
      typeof heur.writable_stores_enabled === "boolean"
        ? heur.writable_stores_enabled
        : false;
  } else if (looksSafeReadonlyTool(name)) {
    enabled =
      typeof heur.safe_tools_enabled === "boolean" ? heur.safe_tools_enabled : true;
  } else {
    enabled = typeof defaults.enabled === "boolean" ? defaults.enabled : false;
  }

  const approval_mode =
    (typeof override.approval_mode === "string" && override.approval_mode) ||
    (typeof defaults.approval_mode === "string" && defaults.approval_mode) ||
    "prompt";

  return { enabled, approval_mode };
}

function escapeTomlString(s) {
  return JSON.stringify(String(s));
}

/**
 * @param {{ mcpServers?: Record<string, any> }} doc
 * @param {{ policy?: McpPolicyDoc }} [opts]
 * @returns {string}
 */
export function jsonServersToCodexToml(doc, opts = {}) {
  const servers = doc?.mcpServers || {};
  const policy = opts.policy || null;
  const lines = [
    "# GENERATED from docs/agent-config/mcp — do not put secrets here",
    "# Project .codex/config.toml loads only when the workspace is trusted",
    "# enabled / approval_mode from mcp/policy.json (heuristics + per-server overrides)",
    "",
  ];
  for (const [name, server] of Object.entries(servers)) {
    if (!server || typeof server !== "object") continue;
    const key = name.replace(/[^a-zA-Z0-9_]/g, "_");
    const { enabled, approval_mode } = resolveMcpServerPolicy(name, policy);
    lines.push(`[mcp_servers.${key}]`);
    if (server.command) {
      lines.push(`command = ${escapeTomlString(server.command)}`);
      if (Array.isArray(server.args)) {
        lines.push(`args = [${server.args.map(escapeTomlString).join(", ")}]`);
      }
    } else if (server.url) {
      lines.push(`url = ${escapeTomlString(server.url)}`);
      if (server.bearer_token_env_var) {
        lines.push(
          `bearer_token_env_var = ${escapeTomlString(server.bearer_token_env_var)}`
        );
      }
    }
    const names = redactEnvToNames(server.env);
    if (names.length) {
      lines.push(`env_vars = [${names.map(escapeTomlString).join(", ")}]`);
    }
    lines.push(`enabled = ${enabled}`);
    lines.push(`default_tools_approval_mode = ${escapeTomlString(approval_mode)}`);
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Unquote a TOML string literal (double or single quotes) or bare token.
 * @param {string} raw
 */
function unquoteTomlScalar(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      return JSON.parse(s.startsWith("'") ? `"${s.slice(1, -1).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : s);
    } catch {
      return s.slice(1, -1);
    }
  }
  return s;
}

/**
 * Parse a TOML array of strings: ["a", "b"] or ['a'].
 * @param {string} raw
 * @returns {string[]}
 */
function parseTomlStringArray(raw) {
  const s = String(raw || "").trim();
  if (!s.startsWith("[") || !s.endsWith("]")) return [];
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  const out = [];
  const re = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
  let m;
  while ((m = re.exec(inner))) {
    out.push(m[1] != null ? JSON.parse(`"${m[1]}"`) : m[2].replace(/\\'/g, "'"));
  }
  return out;
}

/**
 * Minimal Codex MCP TOML subset parser.
 * Recognizes [mcp_servers.NAME], [mcp_servers.NAME.env], command/args/env_vars/enabled/url.
 *
 * @param {string} text
 * @returns {{ name: string, command?: string, args?: string[], url?: string, env_vars: string[], env?: Record<string,string>, enabled?: boolean }[]}
 */
export function parseCodexMcpToml(text) {
  /** @type {Map<string, { name: string, command?: string, args?: string[], url?: string, env_vars: string[], env: Record<string,string>, enabled?: boolean }>} */
  const byName = new Map();
  let section = null; // { kind: 'server'|'env', name }
  const lines = String(text || "").split(/\r?\n/);

  const ensure = (name) => {
    if (!byName.has(name)) {
      byName.set(name, { name, env_vars: [], env: {} });
    }
    return byName.get(name);
  };

  for (let rawLine of lines) {
    const hash = rawLine.indexOf("#");
    if (hash >= 0) {
      // only strip comments outside quotes — simple: strip if # not in quotes
      let inQ = false;
      let cut = -1;
      for (let i = 0; i < rawLine.length; i++) {
        const c = rawLine[i];
        if (c === '"' && rawLine[i - 1] !== "\\") inQ = !inQ;
        if (c === "#" && !inQ) {
          cut = i;
          break;
        }
      }
      if (cut >= 0) rawLine = rawLine.slice(0, cut);
    }
    const line = rawLine.trim();
    if (!line) continue;

    const header = line.match(/^\[([^\]]+)\]$/);
    if (header) {
      const path = header[1].trim();
      const envM = path.match(/^mcp_servers\.([A-Za-z0-9_]+)\.env$/);
      const srvM = path.match(/^mcp_servers\.([A-Za-z0-9_]+)$/);
      if (envM) {
        section = { kind: "env", name: envM[1] };
        ensure(envM[1]);
      } else if (srvM) {
        section = { kind: "server", name: srvM[1] };
        ensure(srvM[1]);
      } else {
        section = null;
      }
      continue;
    }

    if (!section) continue;
    const kv = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2].trim();
    const srv = ensure(section.name);

    if (section.kind === "env") {
      srv.env[key] = unquoteTomlScalar(val);
      continue;
    }

    if (key === "command") srv.command = unquoteTomlScalar(val);
    else if (key === "url") srv.url = unquoteTomlScalar(val);
    else if (key === "args") srv.args = parseTomlStringArray(val);
    else if (key === "env_vars") srv.env_vars = parseTomlStringArray(val);
    else if (key === "enabled") srv.enabled = /^(true|false)$/i.test(val) ? /^true$/i.test(val) : srv.enabled;
  }

  return [...byName.values()].map((s) => {
    const out = {
      name: s.name,
      env_vars: s.env_vars || [],
    };
    if (s.command) out.command = s.command;
    if (s.args) out.args = s.args;
    if (s.url) out.url = s.url;
    if (s.enabled != null) out.enabled = s.enabled;
    if (s.env && Object.keys(s.env).length) out.env = s.env;
    return out;
  });
}

/**
 * Convert Codex MCP TOML text into Cursor-shaped { mcpServers } doc.
 * Resolves env_vars names from `processEnv` (missing keys skipped — never invent).
 * Inline [mcp_servers.x.env] values win over processEnv for the same key.
 *
 * @param {string} text
 * @param {NodeJS.ProcessEnv|Record<string,string|undefined>} [processEnv]
 * @returns {{ mcpServers: Record<string, { command?: string, args?: string[], url?: string, env: Record<string,string> }> }}
 */
export function codexTomlToMcpDoc(text, processEnv = process.env) {
  const servers = {};
  for (const s of parseCodexMcpToml(text)) {
    const env = {};
    for (const k of s.env_vars || []) {
      const v = processEnv?.[k];
      if (v != null && String(v) !== "") env[k] = String(v);
    }
    if (s.env) {
      for (const [k, v] of Object.entries(s.env)) {
        if (v != null && String(v) !== "") env[k] = String(v);
      }
    }
    const entry = { env };
    if (s.command) entry.command = s.command;
    if (s.args) entry.args = s.args;
    if (s.url) entry.url = s.url;
    servers[s.name] = entry;
  }
  return { mcpServers: servers };
}
