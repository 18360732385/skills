/**
 * MCP JSON (Cursor/Claude shape) → Codex project config.toml fragment.
 * Never embeds env *values* — only variable names in env_vars.
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

function escapeTomlString(s) {
  return JSON.stringify(String(s));
}

/**
 * @param {{ mcpServers?: Record<string, any> }} doc
 * @param {{ policy?: Record<string, { enabled?: boolean }> }} [opts]
 * @returns {string}
 */
export function jsonServersToCodexToml(doc, opts = {}) {
  const servers = doc?.mcpServers || {};
  const lines = [
    "# GENERATED from docs/agent-config/mcp — do not put secrets here",
    "# Project .codex/config.toml loads only when the workspace is trusted",
    "",
  ];
  for (const [name, server] of Object.entries(servers)) {
    if (!server || typeof server !== "object") continue;
    const key = name.replace(/[^a-zA-Z0-9_]/g, "_");
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
    const policyEn = opts.policy?.[name]?.enabled;
    // Conservative default: disabled unless policy forces true
    const enabled = typeof policyEn === "boolean" ? policyEn : false;
    lines.push(`enabled = ${enabled}`);
    lines.push(`default_tools_approval_mode = "prompt"`);
    lines.push("");
  }
  return lines.join("\n");
}
