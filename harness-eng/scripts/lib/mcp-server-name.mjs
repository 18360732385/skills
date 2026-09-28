/**
 * MCP server naming: {engine}-{profile} with dedupe when profile==engine (0.7.26 CD-3).
 *
 * Examples:
 *   mcpServerName("mysql", "dev")   → "mysql-dev"
 *   mcpServerName("mysql", "mysql") → "mysql-local"  (avoid mysql-mysql)
 *   mcpServerName("mysql", "mysql-test") → "mysql-test" (already prefixed)
 */

/**
 * @param {string} engine
 * @param {string} profile
 * @returns {string}
 */
export function mcpServerName(engine, profile) {
  const eng = String(engine || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  let prof = String(profile || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  if (!eng) return prof || "unknown";
  if (!prof) return eng;
  if (prof === eng) return `${eng}-local`;
  if (prof.startsWith(`${eng}-`)) return prof;
  return `${eng}-${prof}`;
}

export default { mcpServerName };
