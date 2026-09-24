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
