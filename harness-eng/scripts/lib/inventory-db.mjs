#!/usr/bin/env node
/**
 * fill-inventory-db — CREATE TABLE from SQL dirs + Entity/Mapper comment enrich (no npm deps).
 * Alias (0.5.9+): prefer `fill-inventory.mjs --domain db`.
 *
 * Usage:
 *   node scripts/fill-inventory-db.mjs --root <TARGET> [--sql-root file] [--out db-inv.json]
 *   node scripts/fill-inventory.mjs --domain db --root <TARGET> […]
 *
 * 0.2.9: also scans Java Entity (@TableField comment / JavaDoc) and Mapper XML <result>.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultInventoryPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";

function parseArgs(argv) {
  const out = { root: null, sqlRoot: "file", out: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--sql-root") out.sqlRoot = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory-db.mjs --root <TARGET> [--sql-root file] [--out db-inv.json]

Default --out (when omitted): docs/db/.fill-work/inventory.json

Scans *.sql for CREATE TABLE; enriches columnComments from Entity / Mapper XML.
Exit: 0 ok · 2 warnings · 1 error
`);
}

function walkFiles(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "target" || name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkFiles(p, pred, acc);
    else if (pred(name, p)) acc.push(p);
  }
  return acc;
}

function extractTables(sqlText, relFile) {
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/gi;
  let m;
  while ((m = re.exec(sqlText)) !== null) {
    const name = m[1];
    const start = m.index;
    const preview = sqlText.slice(start, start + 200).replace(/\s+/g, " ").trim();
    // Extract inline COMMENT per column from nearby CREATE body
    const columnComments = {};
    let i = start + m[0].length;
    let depth = 0;
    let bodyStart = -1;
    for (; i < sqlText.length; i++) {
      if (sqlText[i] === "(") {
        if (depth === 0) bodyStart = i + 1;
        depth++;
      } else if (sqlText[i] === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (bodyStart > 0) {
      const body = sqlText.slice(bodyStart, i);
      for (const line of body.split(/\r?\n/)) {
        const cm =
          line.match(/[`"]?(\w+)[`"]?\s+[\w()]+[\s\S]*?COMMENT\s+'([^']*)'/i) ||
          line.match(/[`"]?(\w+)[`"]?\s+[\w()]+[\s\S]*?COMMENT\s+"([^"]*)"/i);
        if (cm) columnComments[cm[1]] = cm[2];
      }
    }
    // COMMENT ON COLUMN table.col IS '...'
    const commentOn = new RegExp(
      `COMMENT\\s+ON\\s+COLUMN\\s+[\`"']?${name}[\`"']?\\.[\`"']?(\\w+)[\`"']?\\s+IS\\s+'([^']*)'`,
      "gi"
    );
    let cm;
    while ((cm = commentOn.exec(sqlText)) !== null) {
      columnComments[cm[1]] = cm[2];
    }
    tables.push({
      name,
      evidence: `${relFile}#CREATE:${name}`,
      preview,
      columnComments,
    });
  }
  return tables;
}

function camelToSnake(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

/** Scan Entity Java for @TableName + field comments. */
function collectEntityComments(root) {
  const byTable = new Map(); // tableNameLower -> { col -> comment }
  const javaFiles = walkFiles(root, (n) => /\.java$/i.test(n));
  for (const f of javaFiles) {
    const text = fs.readFileSync(f, "utf8");
    if (!/@TableName\b|@Entity\b|@Table\b/.test(text)) continue;
    let table = null;
    const tn = text.match(/@TableName\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    if (tn) table = tn[1];
    if (!table) {
      const tj = text.match(/@Table\s*\(\s*name\s*=\s*["']([^"']+)["']/);
      if (tj) table = tj[1];
    }
    if (!table) {
      const cls = text.match(/public\s+class\s+(\w+)/);
      if (cls) table = camelToSnake(cls[1]);
    }
    if (!table) continue;
    const key = table.toLowerCase();
    if (!byTable.has(key)) byTable.set(key, {});
    const map = byTable.get(key);

    // Field blocks: JavaDoc + annotations + type name;
    const fieldRe =
      /(\/\*\*([\s\S]*?)\*\/\s*)?(?:@\w+(?:\([^;]*?\))?\s*)*(?:private|protected|public)\s+[\w.<>,\s\[\]]+\s+(\w+)\s*;/g;
    let m;
    while ((m = fieldRe.exec(text)) !== null) {
      const javadoc = (m[2] || "").replace(/\s*\*\s?/g, " ").trim();
      const fieldName = m[3];
      const block = text.slice(Math.max(0, m.index - 200), m.index + m[0].length);
      let col = fieldName;
      const tf =
        block.match(/@TableField\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/) ||
        block.match(/@TableField\s*\([^)]*value\s*=\s*["']([^"']+)["']/);
      if (tf) col = tf[1];
      else {
        const colAnn = block.match(/@Column\s*\([^)]*name\s*=\s*["']([^"']+)["']/);
        if (colAnn) col = colAnn[1];
        else col = camelToSnake(fieldName);
      }
      let comment = "";
      const tc = block.match(/@TableField\s*\([^)]*comment\s*=\s*["']([^"']+)["']/);
      if (tc) comment = tc[1];
      if (!comment) {
        const cd = block.match(/columnDefinition\s*=\s*["'][^"']*COMMENT\s+'([^']+)'/i);
        if (cd) comment = cd[1];
      }
      if (!comment && javadoc) {
        comment = javadoc.replace(/^\s*@\w+[\s\S]*/, "").trim().slice(0, 120);
      }
      if (comment) map[col] = comment;
    }
  }
  return byTable;
}

/** Mapper XML <result property="x" column="y"/> — use property as weak comment hint. */
function collectMapperHints(root) {
  const byCol = new Map(); // global col -> hint (last wins)
  const xmlFiles = walkFiles(root, (n) => /\.xml$/i.test(n));
  for (const f of xmlFiles) {
    const text = fs.readFileSync(f, "utf8");
    if (!/<result\s/i.test(text) && !/<id\s/i.test(text)) continue;
    const re =
      /<(?:result|id)\s+[^>]*(?:property\s*=\s*"([^"]+)"[^>]*column\s*=\s*"([^"]+)"|column\s*=\s*"([^"]+)"[^>]*property\s*=\s*"([^"]+)")/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const prop = m[1] || m[4];
      const col = m[2] || m[3];
      if (col && prop && prop !== col) {
        byCol.set(col.toLowerCase(), `maps to ${prop}`);
      }
    }
  }
  return byCol;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.root) {
    printHelp();
    throw new Error("Required: --root");
  }
  const root = path.resolve(args.root);
  const sqlDir = path.resolve(root, args.sqlRoot);
  const files = walkFiles(sqlDir, (n) => /\.sql$/i.test(n));
  const tables = [];
  const seen = new Set();
  const warnings = [];

  if (!fs.existsSync(sqlDir)) {
    warnings.push(`sql-root missing: ${args.sqlRoot}`);
  }

  for (const f of files) {
    const rel = path.relative(root, f).replace(/\\/g, "/");
    const text = fs.readFileSync(f, "utf8");
    for (const t of extractTables(text, rel)) {
      const key = t.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tables.push(t);
    }
  }

  const entityMap = collectEntityComments(root);
  const mapperHints = collectMapperHints(root);
  let enriched = 0;
  for (const t of tables) {
    const key = t.name.toLowerCase();
    const fromEntity = entityMap.get(key) || {};
    t.columnComments = { ...(t.columnComments || {}) };
    for (const [col, comment] of Object.entries(fromEntity)) {
      if (!t.columnComments[col]) {
        t.columnComments[col] = comment;
        enriched++;
      }
    }
    // Weak mapper hints only when no comment yet
    for (const [col, hint] of mapperHints.entries()) {
      // Only attach if column already known from CREATE or entity
      const hasCol =
        t.columnComments[col] != null ||
        Object.keys(t.columnComments).some((c) => c.toLowerCase() === col);
      if (hasCol && !t.columnComments[col] && !t.columnComments[Object.keys(t.columnComments).find((c) => c.toLowerCase() === col)]) {
        t.columnComments[col] = hint;
        enriched++;
      }
    }
  }

  // Also add tables only known from Entity (no SQL) as soft entries
  for (const [key, comments] of entityMap.entries()) {
    if (seen.has(key)) continue;
    if (!Object.keys(comments).length) continue;
    seen.add(key);
    tables.push({
      name: key,
      evidence: `entity#@TableName:${key}`,
      preview: "",
      columnComments: comments,
      columns: Object.entries(comments).map(([name, comment]) => ({
        name,
        typ: "—",
        nn: "—",
        def: "—",
        comment,
      })),
    });
    warnings.push(`table ${key}: entity-only (no CREATE TABLE in sql-root)`);
  }

  tables.sort((a, b) => a.name.localeCompare(b.name));
  const report = {
    ok: true,
    root,
    sqlRoot: args.sqlRoot,
    tables,
    warnings,
    stats: {
      files: files.length,
      tables: tables.length,
      column_comments_enriched: enriched,
      entity_tables: entityMap.size,
    },
  };
  if (!tables.length) {
    pushWarning(report, "no CREATE TABLE found");
  }

  const json = JSON.stringify(report, null, 2);
  const outPath = path.resolve(args.out || defaultInventoryPath(root, "db"));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json, "utf8");
  console.error(
    `Wrote ${outPath} tables=${tables.length} enriched_comments≈${enriched}`
  );
  console.log(json);
  exitFromReport(report);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
