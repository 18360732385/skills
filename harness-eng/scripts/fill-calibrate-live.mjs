#!/usr/bin/env node
/**
 * fill-calibrate-live — when Cursor MCP mysql/redis is NOT mounted in-session,
 * calibrate db CREATE TABLE + redis key families via direct drivers.
 *
 * Usage:
 *   node scripts/fill-calibrate-live.mjs --root <TARGET> [--profile mysql]
 *   node scripts/fill-calibrate-live.mjs --root <TARGET> --dry-run
 *   node scripts/fill-calibrate-live.mjs --root <TARGET> --write-ddl
 *
 * 0.7.24: default = compare/diff only（不写盘）。显式 --write-ddl 才替换「建表语句」代码块；
 * --dry-run 是默认行为的别名。整文件 writeTableDoc 仅用于新建缺失表文档。
 *
 * Prefer fill-mcp + host MCP when available. This is the fallback path (0.2.10+; multi-path 0.5.2+; Codex toml 0.7.8+).
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import os from "os";
import { loadMcpCredentials } from "./lib/mcp-paths.mjs";
import { isCliMain } from "./lib/cli-main.mjs";
import { writeFillMcpProfile } from "./lib/inventory-meta.mjs";

/** mysql2 createConnection whitelist (0.7.26 FC-11) — drop MCP metadata like `server`. */
const MYSQL2_CONN_KEYS = new Set([
  "host",
  "port",
  "user",
  "password",
  "database",
  "charset",
  "timezone",
  "ssl",
  "socketPath",
  "uri",
  "connectTimeout",
]);

function mysql2ConnectionConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (MYSQL2_CONN_KEYS.has(k) && v != null) out[k] = v;
  }
  return out;
}

function parseArgs(argv) {
  const out = {
    root: null,
    profile: "dev",
    dryRun: true, // 0.7.24: default compare-only
    writeDdl: false,
    writeRedis: false,
    maxRedis: 80,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--profile") out.profile = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--write-ddl") {
      out.writeDdl = true;
      out.dryRun = false;
    } else if (a === "--write-redis") {
      out.writeRedis = true;
      out.dryRun = false;
    } else if (a === "--max-redis") out.maxRedis = Number(argv[++i]) || 80;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-calibrate-live.mjs --root <TARGET> [--profile mysql]
  node scripts/fill-calibrate-live.mjs --root <TARGET> --dry-run
  node scripts/fill-calibrate-live.mjs --root <TARGET> --write-ddl [--write-redis]

Default (0.7.24): compare/diff only — does NOT overwrite table docs.
  --write-ddl    replace only the CREATE TABLE fenced block in existing docs
                 (preserves 业务说明 / 字段说明 / 变更记录); creates stub if missing
  --write-redis  write redis key family docs + inventory (opt-in)
  --dry-run      alias for default compare-only

Reads credentials from mcp.json | .codex/config.toml | application-<profile>.yml; never invents.
Requires mysql2 + ioredis (install once under TEMP/harness-mcp-calibrate).
`);
}

/** Replace only the fenced ```sql block under ## 建表语句; preserve heading + 说明.
 * 0.7.31 FC-1: if prose claims Flyway byte-identical, rewrite to live SHOW CREATE disclaimer.
 */
export function replaceCreateTableBlock(md, ddl) {
  const fence = "```sql\n" + String(ddl || "").trim() + "\n```";
  let out = md;
  // Prefer: keep ## 建表语句 … prose, swap only ```sql…```
  if (/##\s*建表语句[\s\S]*?```sql[\s\S]*?```/i.test(out)) {
    out = out.replace(/(##\s*建表语句[\s\S]*?)```sql[\s\S]*?```/i, `$1${fence}`);
  } else {
    // No section — append
    out = out.replace(/\s*$/, `\n\n## 建表语句\n\n${fence}\n`);
  }
  out = out.replace(
    /(与\s*Flyway[^\n]*一致)/gi,
    "来自 live SHOW CREATE（非 Flyway 逐字）"
  );
  return out;
}

function extractCreateSqlFence(md) {
  const m = md.match(/##\s*建表语句[\s\S]*?```sql\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : null;
}

/** Normalize SHOW CREATE DDL for compare (strip ENGINE/COMMENT/AUTO_INCREMENT noise; keep structure). */
export function normalizeDdlForCompare(ddl) {
  return String(ddl || "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*ENGINE\s*=\s*\w+/gi, "")
    .replace(/\s*AUTO_INCREMENT\s*=\s*\d+/gi, "")
    .replace(/\s*DEFAULT\s+CHARSET\s*=\s*\w+/gi, "")
    .replace(/\s*COLLATE\s*=\s*[\w]+/gi, "")
    .replace(/\s*COMMENT\s*=\s*'[^']*'/gi, "")
    .replace(/\s*COMMENT\s+'[^']*'/gi, "")
    .replace(/,\s*\)/g, ")")
    .trim()
    .toLowerCase();
}

/** Short unified-ish diff for stderr (cap lines). */
export function formatDdlDiff(prevDdl, liveDdl, maxLines = 40) {
  const a = String(prevDdl || "").split(/\r?\n/);
  const b = String(liveDdl || "").split(/\r?\n/);
  const out = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && out.length < maxLines; i++) {
    const la = a[i];
    const lb = b[i];
    if (la === lb) continue;
    if (la != null && lb == null) out.push(`- ${la}`);
    else if (la == null && lb != null) out.push(`+ ${lb}`);
    else {
      out.push(`- ${la}`);
      out.push(`+ ${lb}`);
    }
  }
  if (out.length >= maxLines) out.push("… (diff truncated)");
  return out.join("\n");
}

/** Extract CREATE TABLE SQL from SHOW CREATE TABLE row (MySQL + MariaDB keys). */
export function extractShowCreateDdl(row) {
  if (!row || typeof row !== "object") return null;
  const prefer = ["Create Table", "Create table", "Create Table ", "CREATE TABLE"];
  for (const k of prefer) {
    if (typeof row[k] === "string" && row[k]) return row[k];
  }
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && /create\s+table/i.test(k) && /CREATE\s+TABLE/i.test(v)) {
      return v;
    }
  }
  // Fallback: second column (table name, ddl)
  const vals = Object.values(row);
  if (vals.length >= 2 && typeof vals[1] === "string") return vals[1];
  return null;
}

function ddlLooksHollow(md) {
  // Minimal acceptance: field comment column all "—" and no 业务说明 body → warn
  const fieldSec = md.match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/);
  if (!fieldSec) return false;
  const rows = fieldSec[0].match(/^\|[^|\n]+\|/gm) || [];
  const data = rows.filter((r) => !/---/.test(r) && !/字段名/.test(r));
  if (!data.length) return false;
  const allEmpty = data.every((r) => /\|\s*—\s*\|\s*$/.test(r.trim()) || /\| — \|$/.test(r));
  return allEmpty;
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
  return loadMcpCredentials(root);
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
    throw new Error("No mysql/redis connection found in mcp.json / Codex toml / application yml");
  }

  const stats = {
    ok: true,
    root,
    dryRun: args.dryRun,
    drivers_from: from,
    mcp: mcp?.rel || null,
    yml: ymlPath ? path.relative(root, ymlPath).replace(/\\/g, "/") : null,
    db_ok: 0,
    db_miss: 0,
    db_err: 0,
    redis_keys: 0,
    redis_families: 0,
  };

  if (mysqlCfg) {
    const invPath = path.join(root, "docs", "db", ".fill-work", "inventory.json");
    const invExists = fs.existsSync(invPath);
    let inv = { tables: [] };
    if (invExists) {
      try {
        inv = JSON.parse(fs.readFileSync(invPath, "utf8"));
      } catch {
        inv = { tables: [] };
      }
    }
    const tableDir = path.join(root, "docs", "db", "table");
    const byName = new Map();
    if (fs.existsSync(tableDir)) {
      for (const f of fs.readdirSync(tableDir)) {
        const m = /^(\d+)-(.+)\.md$/.exec(f);
        if (m) byName.set(m[2], { nn: m[1], file: f });
      }
    }
    // 0.7.32 NEW-8: missing or empty inventory → refuse write/doc-scan; no empty inventory.json
    const invTables = Array.isArray(inv.tables) ? inv.tables : [];
    if (!invExists || invTables.length === 0) {
      stats.empty_inventory = true;
      console.error(
        invExists
          ? "fill-calibrate-live: inventory.json has tables:[] — refuse write/doc-scan (empty_inventory)"
          : "fill-calibrate-live: no docs/db/.fill-work/inventory.json — refuse write/doc-scan (empty_inventory); run fill-inventory --domain db first"
      );
      process.exitCode = 2;
    } else {
    fs.mkdirSync(tableDir, { recursive: true });
    const conn = await mysql.createConnection({
      ...mysql2ConnectionConfig(mysqlCfg),
      connectTimeout: 10000,
    });
    const tables = invTables;
    stats.diffs = stats.diffs || [];
    for (const t of tables) {
      const name = t.name;
      if (!name) continue;
      try {
        const [rows] = await conn.query(`SHOW CREATE TABLE \`${name}\``);
        if (!rows?.[0]) {
          stats.db_miss++;
          continue;
        }
        const ddl = extractShowCreateDdl(rows[0]);
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
        const docPath = path.join(tableDir, meta.file);
        const liveDdl = ddl.trim();
        let existing = null;
        if (fs.existsSync(docPath)) existing = fs.readFileSync(docPath, "utf8");
        const prevDdl = existing ? extractCreateSqlFence(existing) : null;
        const changed =
          !prevDdl ||
          normalizeDdlForCompare(prevDdl) !== normalizeDdlForCompare(liveDdl);
        if (!args.writeDdl) {
          // default / --dry-run: compare only — emit readable diff (FC-1)
          if (changed) {
            stats.db_diff = (stats.db_diff || 0) + 1;
            const snippet = formatDdlDiff(prevDdl || "(missing)", liveDdl);
            stats.diffs.push({ file: meta.file, table: name, diff: snippet });
            console.error(
              `[calibrate] diff ${meta.file}: DDL ${prevDdl ? "changed" : "missing in doc"}`
            );
            if (snippet) console.error(snippet);
          } else {
            stats.db_unchanged = (stats.db_unchanged || 0) + 1;
          }
        } else if (existing) {
          const patched = replaceCreateTableBlock(existing, liveDdl);
          if (ddlLooksHollow(patched)) {
            console.error(
              `[calibrate] abort write ${meta.file}: field comments look hollow (db-no-comment risk)`
            );
            stats.db_err++;
          } else {
            fs.writeFileSync(docPath, patched, "utf8");
            stats.db_wrote = (stats.db_wrote || 0) + 1;
          }
        } else {
          // new file only under --write-ddl
          fs.writeFileSync(
            docPath,
            writeTableDoc(
              name,
              liveDdl,
              `mysql://${mysqlCfg.database}#SHOW CREATE TABLE ${name}`,
              cols.length ? cols : t.columns || []
            ),
            "utf8"
          );
          stats.db_wrote = (stats.db_wrote || 0) + 1;
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
    // 0.7.32 NEW-8: only rewrite inventory when it has tables (never write tables:[])
    if (args.writeDdl && Array.isArray(inv.tables) && inv.tables.length > 0) {
      fs.mkdirSync(path.dirname(invPath), { recursive: true });
      fs.writeFileSync(invPath, JSON.stringify(inv, null, 2));
    }
    } // end else (non-empty inventory)
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
      if (args.writeRedis) fs.writeFileSync(path.join(keysDir, `${nn}-${safe}.md`), body, "utf8");
      stats.redis_families++;
    }
    stats.redis_keys = samples.length;

    const redisInvPath = path.join(root, "docs", "redis", ".fill-work", "inventory.json");
    if (args.writeRedis) {
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

  // 0.7.26 FC-10: record profile used for live calibrate into meta
  if (args.profile) {
    try {
      writeFillMcpProfile(root, args.profile);
    } catch {
      /* meta optional */
    }
  }

  // 0.7.26 SG-9: inventory has tables but db_ok=0 → empty gate / fail
  // 0.7.32 NEW-8: missing inventory or tables:[] + mysql → empty_inventory (may already be set)
  let invTableCount = 0;
  let invFileExists = false;
  try {
    const invPath = path.join(root, "docs", "db", ".fill-work", "inventory.json");
    if (fs.existsSync(invPath)) {
      invFileExists = true;
      const inv = JSON.parse(fs.readFileSync(invPath, "utf8"));
      invTableCount = Array.isArray(inv.tables) ? inv.tables.length : 0;
    }
  } catch {
    invTableCount = 0;
  }
  if (mysqlCfg && (!invFileExists || invTableCount === 0)) {
    stats.empty_inventory = true;
    if (process.exitCode !== 2) {
      console.error(
        invFileExists
          ? "fill-calibrate-live: empty_inventory (tables:[]) with mysql configured"
          : "fill-calibrate-live: empty_inventory (no inventory.json) with mysql configured"
      );
    }
    process.exitCode = 2;
  } else if (mysqlCfg && invTableCount > 0 && stats.db_ok === 0) {
    console.error(
      `fill-calibrate-live: db_ok=0 but inventory has ${invTableCount} table(s) (empty gate)`
    );
    process.exitCode = 2;
  } else if (!args.writeDdl && (stats.db_diff || 0) > 0) {
    // 0.7.31 FC-1: compare-only with real DDL drift → exit 2
    console.error(
      `fill-calibrate-live: db_diff=${stats.db_diff} (DDL changed vs docs; use --write-ddl to apply)`
    );
    process.exitCode = 2;
  }
}

if (isCliMain(import.meta.url)) {
  try {
    await main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
