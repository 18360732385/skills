/**
 * MCP 真密/example 多宿主路径（0.5.2+）。
 *
 * 约定（与 ai-tools.md 一致）：
 * - cursor → .cursor/mcp.json
 * - claude / qoder / workbuddy → 根 .mcp.json（官方主路径）
 * - trae → .trae/mcp.json
 *
 * fill-mcp 经确认可写入下列真密路径；calibrate-live 按优先级读取第一个存在的文件。
 */
import fs from "fs";
import path from "path";

/** 真密路径候选（读取优先级：cursor → 根 → trae → 遗留 .qoder） */
export const MCP_SECRET_CANDIDATES = [
  ".cursor/mcp.json",
  ".mcp.json",
  ".trae/mcp.json",
  ".qoder/mcp.json",
];

/** example 路径（按工具） */
export const MCP_EXAMPLE_BY_TOOL = {
  cursor: ".cursor/mcp.json.example",
  claude: ".mcp.json.example",
  qoder: ".mcp.json.example",
  workbuddy: ".mcp.json.example",
  trae: ".trae/mcp.json.example",
};

/**
 * 按 ai_tools 列出应写入的真密路径（去重、保序）。
 * @param {string[]} aiTools
 * @returns {string[]}
 */
export function resolveMcpSecretTargets(aiTools) {
  const tools = new Set(
    (Array.isArray(aiTools) ? aiTools : [])
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (!tools.size) tools.add("cursor");
  const out = [];
  const push = (p) => {
    if (!out.includes(p)) out.push(p);
  };
  if (tools.has("cursor")) push(".cursor/mcp.json");
  if (tools.has("claude") || tools.has("qoder") || tools.has("workbuddy")) {
    push(".mcp.json");
  }
  if (tools.has("trae")) push(".trae/mcp.json");
  return out;
}

/**
 * 按 ai_tools 列出应有的 example 路径。
 * @param {string[]} aiTools
 * @returns {string[]}
 */
export function resolveMcpExampleTargets(aiTools) {
  const tools = new Set(
    (Array.isArray(aiTools) ? aiTools : [])
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (!tools.size) tools.add("cursor");
  const out = [];
  const push = (p) => {
    if (p && !out.includes(p)) out.push(p);
  };
  for (const t of tools) push(MCP_EXAMPLE_BY_TOOL[t]);
  return out;
}

/**
 * 在目标仓查找第一个存在的真密 mcp.json。
 * @returns {{ rel: string, abs: string } | null}
 */
export function findMcpSecretFile(root, preferredRels) {
  const list =
    Array.isArray(preferredRels) && preferredRels.length
      ? preferredRels
      : MCP_SECRET_CANDIDATES;
  for (const rel of list) {
    const abs = path.join(root, ...rel.split("/"));
    if (fs.existsSync(abs)) return { rel, abs };
  }
  return null;
}

/**
 * 从 mcpServers 中抽取 mysql / redis 连接（按 server 名前缀，优先非 -example）。
 */
export function extractMysqlRedisFromMcpDoc(doc) {
  if (!doc || typeof doc !== "object") return { mysql: null, redisUrl: null };
  const servers = doc.mcpServers || {};
  const names = Object.keys(servers);

  const pickMysql = () => {
    const ranked = names
      .filter((n) => /^mysql/i.test(n))
      .sort((a, b) => Number(/example/i.test(a)) - Number(/example/i.test(b)));
    for (const n of ranked) {
      const env = servers[n]?.env || {};
      if (env.MYSQL_HOST || env.MYSQL_USER || env.MYSQL_DB) {
        return {
          host: env.MYSQL_HOST,
          port: Number(env.MYSQL_PORT || 3306),
          user: env.MYSQL_USER,
          password: env.MYSQL_PASS,
          database: env.MYSQL_DB,
          server: n,
        };
      }
    }
    return null;
  };

  const pickRedis = () => {
    const ranked = names
      .filter((n) => /^redis/i.test(n))
      .sort((a, b) => Number(/example/i.test(a)) - Number(/example/i.test(b)));
    for (const n of ranked) {
      const args = servers[n]?.args;
      if (!Array.isArray(args)) continue;
      const idx = args.indexOf("--url");
      if (idx >= 0 && args[idx + 1]) {
        return { redisUrl: args[idx + 1], server: n };
      }
    }
    return null;
  };

  const mysql = pickMysql();
  const redis = pickRedis();
  return { mysql, redisUrl: redis?.redisUrl || null, mysqlServer: mysql?.server, redisServer: redis?.server };
}

/**
 * 读取目标仓 mcp 真密并抽取连接。
 * @returns {{ rel: string, mysql: object|null, redisUrl: string|null } | null}
 */
export function loadMcpCredentials(root, preferredRels) {
  const hit = findMcpSecretFile(root, preferredRels);
  if (!hit) return null;
  try {
    const doc = JSON.parse(fs.readFileSync(hit.abs, "utf8"));
    const extracted = extractMysqlRedisFromMcpDoc(doc);
    return { rel: hit.rel, ...extracted };
  } catch {
    return { rel: hit.rel, mysql: null, redisUrl: null };
  }
}
