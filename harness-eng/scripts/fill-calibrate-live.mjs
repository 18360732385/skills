#!/usr/bin/env node
/**
 * fill-calibrate-live — when Cursor MCP mysql/redis is NOT mounted in-session,
 * calibrate db CREATE TABLE + redis key families via direct drivers.
 *
 * Usage:
 *   node scripts/fill-calibrate-live.mjs --root <TARGET> [--profile dev] [--help]
 *   node scripts/fill-calibrate-live.mjs --root <TARGET> --dry-run
 *
 * Connection (no inventing secrets):
 *   1) .cursor/mcp.json env (if present, usually gitignored)
 *   2) sms-entrance/src/main/resources/application-<profile>.yml (or application.yml)
 *
 * Deps (one-shot in TEMP):
 *   npm install mysql2 ioredis   # under %TEMP%/harness-mcp-calibrate or /tmp/...
 *
 * Prefer fill-mcp + Cursor MCP when available. This is the fallback path (0.2.10).
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import os from "os";

function parseArgs(argv) {
  const out = {
    root: null,
    profile: "dev",
    dryRun: false,
    maxRedis: 80,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--profile") out.profile = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--max-redis") out.maxRedis = Number(argv[++i]) || 80;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-calibrate-live.mjs --root <TARGET> [--profile dev] [--dry-run]

Calibrate docs/db/table via MySQL SHOW CREATE TABLE and docs/redis/keys via Redis SCAN.
Reads credentials from .cursor/mcp.json or application-<profile>.yml (never invents).
Requires mysql2 + ioredis (install once under TEMP/harness-mcp-calibrate).
`);
}

function loadDrivers() {
  const candidates = [
    path.join(os.tmpdir(), "harness-mcp-calibrate", "node_modules"),
    path.join(process.cwd(), "node_modules"),
  ];
  for (const nm of candidates) {
    const pkg = path.join(path.dirname(nm), "package.json");
    const marker = fs.existsSync(path.join(nm, "mysql2")) ? nm : null;
    if (!marker) continue;
    const require = createRequire(path.join(path.dirname(nm), "package.json"));
    try {
      return {
        mysql: require("mysql2/promise"),
        Redis: require("ioredis"),
        from: nm,
      };
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `mysql2/ioredis not found. Run once:\n` +
      `  mkdir -p "$TMPDIR/harness-mcp-calibrate" && cd "$TMPDIR/harness-mcp-calibrate" && npm init -y && npm i mysql2 ioredis\n` +
      `  (Windows: %TEMP%\\harness-mcp-calibrate)`
  );
}

function parseMcpJson(root) {
  const p = path.join(root, ".cursor", "mcp.json");
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const mysql = j.mcpServers?.mysql?.env || j.mcpServers?.["mysql-local-example"]?.env;
    const redisArgs = j.mcpServers?.redis?.args || j.mcpServers?.["redis-local-example"]?.args;
    let redisUrl = null;
    if (Array.isArray(redisArgs)) {
      const idx = redisArgs.indexOf("--url");
      if (idx >= 0) redisUrl = redisArgs[idx + 1];
    }
    return {
      mysql: mysql
        ? {
            host: mysql.MYSQL_HOST,
            port: Number(mysql.MYSQL_PORT || 3306),
            user: mysql.MYSQL_USER,
            password: mysql.MYSQL_PASS,
            database: mysql.MYSQL_DB,
          }
        : null,
      redisUrl,
    };
  } catch {
    return null;
  }
}

function parseYmlMysqlRedis(text) {
  const host = (text.match(/url:\s*jdbc:mysql:\/\/([^:\/]+)/) || [])[1];
  const port = (text.match(/jdbc:mysql:\/\/[^:]+:(\d+)\//) || [])[1];
  const db = (text.match(/jdbc:mysql:\/\/[^\/]+\/([^?\s]+)/) || [])[1];
  const user = (text.match(/master:[\s\S]*?username:\s*(\S+)/) || [])[1];
  const password = (text.match(/master:[\s\S]*?password:\s*(\S+)/) || [])[1];
  const rhost = (text.match(/redis:[\s\S]*?host:\s*(\S+)/) || [])[1];
  const rport = (text.match(/redis:[\s\S]*?port:\s*(\d+)/) || [])[1];
  const rpass = (text.match(/redis:[\s\S]*?password:\s*(\S+)/) || [])[1];
  const rdb = (text.match(/redis:[\s\S]*?database:\s*(\d+)/) || [])[1];
  return {
    mysql:
      host && user
        ? {
            host,
            port: Number(port || 3306),
            user,
            password: password || "",
            database: db || "",
          }
        : null,
    redis:
      rhost
        ? {
            host: rhost,
            port: Number(rport || 6379),
            password: rpass || undefined,
            db: Number(rdb || 0),
          }
        : null,
  };
}

function findAppYml(root, profile) {
  const candidates = [
    path.join(root, "sms-entrance", "src", "main", "resources", `application-${profile}.yml`),
    path.join(root, "sms-entrance", "src", "main", "resources", "application.yml"),
    path.join(root, "src", "main", "resources", `application-${profile}.yml`),
    path.join(root, "src", "main", "resources", "application.yml"),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function parseColumns(createSql) {
  const open = createSql.indexOf("(");
  const close = createSql.lastIndexOf(")");
  if (open < 0 || close < 0) return [];
  const inner = createSql.slice(open + 1, close);
  const cols = [];
  for (const line of inner.split(/\n/)) {
    const t = line.trim().replace(/,\s*$/, "");
    if (!t || /^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FULLTEXT|SPATIAL)/i.test(t)) continue;
    const m = t.match(/^[`"]?(\w+)[`"]?\s+(\S+)/);
    if (!m) continue;
    const cm =
      t.match(/COMMENT\s+'((?:\\'|[^'])*)'/i) || t.match(/COMMENT\s+"((?:\\"|[^"])*)"/i);
    cols.push({
      name: m[1],
      typ: m[2],
      nn: /\bNOT NULL\b/i.test(t) ? "YES" : "—",
      def: (t.match(/DEFAULT\s+((?:'[^']*'|"[^"]*"|\S+))/i) || [])[1] || "—",
      comment: cm ? cm[1].replace(/\\'/g, "'") : "—",
    });
  }
  return cols;
}

function writeTableDoc(name, ddl, evidence, cols) {
  const colTable = [
    "| 字段名 | 类型 | 非空 | 默认值 | 说明 |",
    "|---|---|---|---|---|",
    ...cols.map(
      (c) =>
        `| ${c.name} | ${c.typ} | ${c.nn} | ${c.def} | ${String(c.comment || "—").slice(0, 80)} |`
    ),
  ].join("\n");
  return `# ${name}

> **真相文档（SSOT）** · MySQL SHOW CREATE TABLE 校准（fill-calibrate-live）  
> **evidence:** \`${evidence}\`

## 建表语句

\`\`\`sql
${ddl}
\`\`\`

## 字段

${colTable}

## 索引

_见建表语句内 KEY / PRIMARY_

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.2 | 校准 | SHOW CREATE TABLE | harness-eng | ${new Date().toISOString().slice(0, 10)} |
`;
}

function normalizePrefix(key) {
  const parts = String(key).split(":");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (/^[0-9a-f]{16,}$/i.test(last) || /^\d+$/.test(last) || last.length > 40) {
      return parts.slice(0, -1).join(":") + ":*";
    }
    return parts.slice(0, Math.min(3, parts.length)).join(":");
  }
  return key.slice(0, 24);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.root) {
    printHelp();
    throw new Error("Required: --root");
  }
  const root = path.resolve(args.root);
  const { mysql, Redis, from } = loadDrivers();

  const mcp = parseMcpJson(root);
  const ymlPath = findAppYml(root, args.profile);
  const yml = ymlPath ? parseYmlMysqlRedis(fs.readFileSync(ymlPath, "utf8")) : null;

  const mysqlCfg = mcp?.mysql || yml?.mysql;
  let redisCfg = yml?.redis || null;
  if (mcp?.redisUrl) {
    try {
      const u = new URL(mcp.redisUrl);
      redisCfg = {
        host: u.hostname,
        port: Number(u.port || 6379),
        password: decodeURIComponent(u.password || "") || undefined,
        db: Number((u.pathname || "/0").replace(/^\//, "") || 0),
      };
    } catch {
      /* keep yml */
    }
  }

  if (!mysqlCfg && !redisCfg) {
    throw new Error("No mysql/redis connection found in mcp.json or application yml");
  }

  const stats = {
    ok: true,
    root,
    dryRun: args.dryRun,
    drivers_from: from,
    yml: ymlPath ? path.relative(root, ymlPath).replace(/\\/g, "/") : null,
    db_ok: 0,
    db_miss: 0,
    db_err: 0,
    redis_keys: 0,
    redis_families: 0,
  };

  if (mysqlCfg) {
    const invPath = path.join(root, "docs", "db", ".fill-work", "inventory.json");
    const inv = fs.existsSync(invPath)
      ? JSON.parse(fs.readFileSync(invPath, "utf8"))
      : { tables: [] };
    const tableDir = path.join(root, "docs", "db", "table");
    fs.mkdirSync(tableDir, { recursive: true });
    const byName = new Map();
    if (fs.existsSync(tableDir)) {
      for (const f of fs.readdirSync(tableDir)) {
        const m = /^(\d+)-(.+)\.md$/.exec(f);
        if (m) byName.set(m[2], { nn: m[1], file: f });
      }
    }
    const conn = await mysql.createConnection({
      ...mysqlCfg,
      connectTimeout: 10000,
    });
    const tables = inv.tables?.length
      ? inv.tables
      : [...byName.keys()].map((name) => ({ name }));
    for (const t of tables) {
      const name = t.name;
      if (!name) continue;
      try {
        const [rows] = await conn.query(`SHOW CREATE TABLE \`${name}\``);
        if (!rows?.[0]) {
          stats.db_miss++;
          continue;
        }
        const ddl =
          rows[0]["Create Table"] ||
          rows[0]["Create table"] ||
          Object.values(rows[0])[1];
        if (!ddl || typeof ddl !== "string") {
          stats.db_miss++;
          continue;
        }
        t.createSql = ddl;
        t.ddlSource = "mysql:SHOW CREATE TABLE";
        const cols = parseColumns(ddl);
        if (cols.length) {
          t.columns = cols;
          t.columnComments = Object.fromEntries(cols.map((c) => [c.name, c.comment]));
        }
        let meta = byName.get(name);
        if (!meta) {
          const nn = String(byName.size + 1).padStart(2, "0");
          meta = { nn, file: `${nn}-${name}.md` };
          byName.set(name, meta);
        }
        if (!args.dryRun) {
          fs.writeFileSync(
            path.join(tableDir, meta.file),
            writeTableDoc(
              name,
              ddl,
              `mysql://${mysqlCfg.database}#SHOW CREATE TABLE ${name}`,
              cols.length ? cols : t.columns || []
            ),
            "utf8"
          );
        }
        stats.db_ok++;
      } catch (e) {
        if (/doesn't exist|Unknown table/i.test(e.message)) stats.db_miss++;
        else {
          stats.db_err++;
          if (stats.db_err <= 3) console.error("mysql err", name, e.message);
        }
      }
    }
    await conn.end();
    if (!args.dryRun && inv.tables) {
      fs.mkdirSync(path.dirname(invPath), { recursive: true });
      fs.writeFileSync(invPath, JSON.stringify(inv, null, 2));
    }
  }

  if (redisCfg) {
    const redis = new Redis({
      ...redisCfg,
      connectTimeout: 8000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const samples = [];
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", "*", "COUNT", 200);
      cursor = next;
      for (const k of keys) {
        if (samples.length >= args.maxRedis) break;
        const type = await redis.type(k);
        const ttl = await redis.ttl(k);
        samples.push({ pattern: k, type, ttl });
      }
    } while (cursor !== "0" && samples.length < args.maxRedis);

    const groups = new Map();
    for (const s of samples) {
      const g = normalizePrefix(s.pattern);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(s);
    }
    const keysDir = path.join(root, "docs", "redis", "keys");
    fs.mkdirSync(keysDir, { recursive: true });
    const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    let idx = 20;
    for (const [prefix, arr] of sorted.slice(0, 12)) {
      idx++;
      const safe =
        prefix
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 40) || "scan";
      const nn = String(idx).padStart(2, "0");
      const pat = prefix.endsWith(":*") ? prefix : prefix + (prefix.includes(":") ? "" : ":*");
      const ttlSample =
        arr.find((x) => x.ttl >= 0)?.ttl >= 0
          ? `${arr.find((x) => x.ttl >= 0).ttl}s`
          : "业务/运行时 TTL";
      const body = `# ${prefix}

> **真相文档（SSOT）** · Redis SCAN（fill-calibrate-live；已前缀归一）

## Key 模式

| 模式 | 说明 | evidence |
|---|---|---|
| \`${pat}\` | live SCAN 前缀族 · ${arr.length} samples | \`redis:SCAN\` |

## Value 结构

| 模式 | valueType | 字段 | TTL | evidence |
|---|---|---|---|---|
| \`${pat}\` | ${arr[0]?.type || "—"} | — | ${ttlSample} | \`redis:SCAN\` |

## TTL

| 模式 | TTL | evidence |
|---|---|---|
| \`${pat}\` | ${ttlSample} | \`redis:SCAN\` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.2 | 扫描 | fill-calibrate-live | harness-eng | ${new Date().toISOString().slice(0, 10)} |
`;
      if (!args.dryRun) fs.writeFileSync(path.join(keysDir, `${nn}-${safe}.md`), body, "utf8");
      stats.redis_families++;
    }
    stats.redis_keys = samples.length;

    const redisInvPath = path.join(root, "docs", "redis", ".fill-work", "inventory.json");
    if (!args.dryRun) {
      const redisInv = fs.existsSync(redisInvPath)
        ? JSON.parse(fs.readFileSync(redisInvPath, "utf8"))
        : { keys: [] };
      for (const s of samples) {
        const pat = normalizePrefix(s.pattern);
        if (!redisInv.keys.some((k) => k.pattern === pat)) {
          redisInv.keys.push({
            pattern: pat,
            evidence: "redis:SCAN",
            note: "live scan prefix",
            redis: true,
            valueType: s.type,
            ttl: s.ttl >= 0 ? `${s.ttl}s` : undefined,
          });
        }
      }
      redisInv.stats = {
        ...(redisInv.stats || {}),
        live_scan: samples.length,
        redis_true: (redisInv.keys || []).filter((k) => k.redis).length,
      };
      fs.mkdirSync(path.dirname(redisInvPath), { recursive: true });
      fs.writeFileSync(redisInvPath, JSON.stringify(redisInv, null, 2));
    }
    await redis.quit();
  }

  console.log(JSON.stringify(stats, null, 2));
  console.log(
    "—— fill-calibrate-live 摘要 ——\n" +
      `db_ok=${stats.db_ok} db_miss=${stats.db_miss} redis_keys=${stats.redis_keys} families=${stats.redis_families}`
  );
}

try {
  await main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
