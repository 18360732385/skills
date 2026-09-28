#!/usr/bin/env node
/**
 * fill-inventory-db — CREATE TABLE from SQL dirs + Entity/Mapper comment enrich (no npm deps).
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain db --root <TARGET> [--sql-root file] [--out db-inv.json]
 *   node scripts/fill-inventory.mjs --domain db --root <TARGET> […]
 *
 * 0.2.9: also scans Java Entity (@TableField comment / JavaDoc) and Mapper XML <result>.
 */
import fs from "fs";
import path from "path";
import { isCliMain } from "./cli-main.mjs";
import { resolveInventoryOutPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";
import { writeInventoryMeta, toRootRelative } from "./inventory-meta.mjs";

function parseArgs(argv) {
  const out = {
    root: null,
    sqlRoot: "file",
    out: null,
    help: false,
    sqlRootSet: false,
    noWrite: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--sql-root") {
      out.sqlRoot = argv[++i];
      out.sqlRootSet = true;
    } else if (a === "--out") out.out = argv[++i];
    else if (a === "--no-write") out.noWrite = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

/** 0.7.24: when default sql-root missing, probe common Flyway/Liquibase layouts. */
export function discoverSqlRoot(root) {
  const candidates = [
    "db/migration",
    "src/main/resources/db/migration",
    "backend/src/main/resources/db/migration",
    "src/main/resources/db/migrations",
    "resources/db/migration",
  ];
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return rel.replace(/\\/g, "/");
  }
  // shallow walk for **/db/migration
  const found = [];
  function walk(d, depth) {
    if (depth > 5 || found.length || !fs.existsSync(d)) return;
    let names;
    try {
      names = fs.readdirSync(d);
    } catch {
      return;
    }
    for (const name of names) {
      if (name === "node_modules" || name === ".git" || name === "target" || name === "dist")
        continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      const norm = p.replace(/\\/g, "/");
      if (/\/db\/migration$/i.test(norm) || /\/db\/migrations$/i.test(norm)) {
        found.push(path.relative(root, p).replace(/\\/g, "/"));
        return;
      }
      walk(p, depth + 1);
    }
  }
  walk(root, 0);
  return found[0] || null;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory.mjs --domain db --root <TARGET> [--sql-root file] [--out db-inv.json]

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

const SQL_CONSTRAINT_HEAD =
  /^(PRIMARY|UNIQUE|KEY|CONSTRAINT|INDEX|FOREIGN|CHECK|FULLTEXT|SPATIAL)\b/i;

/** Parse CREATE body lines → all columns (not only COMMENT lines). 0.7.25 FC-4 */
function parseCreateBodyColumns(body) {
  const columnComments = {};
  const columns = [];
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/,\s*$/, "");
    if (!trimmed || SQL_CONSTRAINT_HEAD.test(trimmed)) continue;
    const colMatch = trimmed.match(/^[`"']?(\w+)[`"']?\s+/);
    if (!colMatch) continue;
    const name = colMatch[1];
    if (SQL_CONSTRAINT_HEAD.test(name)) continue;
    const cm =
      trimmed.match(/COMMENT\s+'([^']*)'/i) || trimmed.match(/COMMENT\s+"([^"]*)"/i);
    const comment = cm ? cm[1] : "";
    columnComments[name] = comment;
    columns.push({
      name,
      typ: "—",
      nn: "—",
      def: "—",
      comment: comment || "—",
    });
  }
  return { columnComments, columns };
}

function extractTables(sqlText, relFile) {
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/gi;
  let m;
  while ((m = re.exec(sqlText)) !== null) {
    const name = m[1];
    const start = m.index;
    const preview = sqlText.slice(start, start + 200).replace(/\s+/g, " ").trim();
    let columnComments = {};
    let columns = [];
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
      const parsed = parseCreateBodyColumns(sqlText.slice(bodyStart, i));
      columnComments = parsed.columnComments;
      columns = parsed.columns;
    }
    const commentOn = new RegExp(
      `COMMENT\\s+ON\\s+COLUMN\\s+[\`"']?${name}[\`"']?\\.[\`"']?(\\w+)[\`"']?\\s+IS\\s+'([^']*)'`,
      "gi"
    );
    let cm;
    while ((cm = commentOn.exec(sqlText)) !== null) {
      columnComments[cm[1]] = cm[2];
      const col = columns.find((c) => c.name === cm[1]);
      if (col) col.comment = cm[2];
      else
        columns.push({
          name: cm[1],
          typ: "—",
          nn: "—",
          def: "—",
          comment: cm[2],
        });
    }
    tables.push({
      name,
      evidence: `${relFile}#CREATE:${name}`,
      preview,
      columnComments,
      columns,
    });
  }
  return tables;
}

/**
 * 0.7.25 FC-4: ALTER TABLE … ADD [COLUMN] … (and DROP COLUMN).
 * @returns {{ table: string, add: string[], drop: string[], evidence: string }[]}
 */
export function extractAlterOps(sqlText, relFile) {
  const ops = [];
  const stmtRe = /ALTER\s+TABLE\s+[`"]?(\w+)[`"]?\s+([\s\S]*?)(?:;|$)/gi;
  let m;
  while ((m = stmtRe.exec(sqlText)) !== null) {
    const table = m[1];
    const body = m[2] || "";
    const add = [];
    const drop = [];
    const addRe = /ADD\s+(?:COLUMN\s+)?[`"]?(\w+)[`"]?/gi;
    let a;
    while ((a = addRe.exec(body)) !== null) {
      if (!SQL_CONSTRAINT_HEAD.test(a[1])) add.push(a[1]);
    }
    const dropRe = /DROP\s+(?:COLUMN\s+)?[`"]?(\w+)[`"]?/gi;
    let d;
    while ((d = dropRe.exec(body)) !== null) {
      if (!/PRIMARY|FOREIGN|INDEX|KEY|CONSTRAINT/i.test(d[1])) drop.push(d[1]);
    }
    if (add.length || drop.length) {
      ops.push({
        table,
        add,
        drop,
        evidence: `${relFile}#ALTER:${table}`,
      });
    }
  }
  return ops;
}

function mergeAlterIntoTable(table, op) {
  table.columnComments = { ...(table.columnComments || {}) };
  table.columns = Array.isArray(table.columns) ? [...table.columns] : [];
  for (const col of op.add || []) {
    if (!(col in table.columnComments)) table.columnComments[col] = "";
    if (!table.columns.some((c) => c.name.toLowerCase() === col.toLowerCase())) {
      table.columns.push({
        name: col,
        typ: "—",
        nn: "—",
        def: "—",
        comment: "—",
      });
    }
  }
  for (const col of op.drop || []) {
    delete table.columnComments[col];
    const k = Object.keys(table.columnComments).find(
      (c) => c.toLowerCase() === col.toLowerCase()
    );
    if (k) delete table.columnComments[k];
    table.columns = table.columns.filter(
      (c) => c.name.toLowerCase() !== col.toLowerCase()
    );
  }
  if (op.evidence) {
    table.evidence = table.evidence
      ? `${table.evidence};${op.evidence}`
      : op.evidence;
  }
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
  let sqlRootRel = args.sqlRoot;
  const sqlDirDefault = path.resolve(root, sqlRootRel);
  if ((!args.sqlRootSet || sqlRootRel === "file") && !fs.existsSync(sqlDirDefault)) {
    const discovered = discoverSqlRoot(root);
    if (discovered) {
      sqlRootRel = discovered;
    }
  }
  const sqlDir = path.resolve(root, sqlRootRel);
  const files = walkFiles(sqlDir, (n) => /\.sql$/i.test(n));
  const tables = [];
  const seen = new Set();
  const warnings = [];

  if (!fs.existsSync(sqlDir)) {
    warnings.push(`sql-root missing: ${sqlRootRel}`);
  } else if (sqlRootRel !== args.sqlRoot) {
    warnings.push(`sql-root auto-discovered: ${sqlRootRel}`);
  }

  // Sort so V1 before V2; CREATE then ALTER merge (0.7.25 FC-4)
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const byKey = new Map();
  for (const f of files) {
    const rel = path.relative(root, f).replace(/\\/g, "/");
    const text = fs.readFileSync(f, "utf8");
    for (const t of extractTables(text, rel)) {
      const key = t.name.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, t);
        seen.add(key);
      }
    }
    for (const op of extractAlterOps(text, rel)) {
      const key = op.table.toLowerCase();
      let t = byKey.get(key);
      if (!t) {
        t = {
          name: op.table,
          evidence: op.evidence,
          preview: "",
          columnComments: {},
          columns: [],
        };
        byKey.set(key, t);
        seen.add(key);
        warnings.push(`table ${op.table}: ALTER before CREATE in sql-root`);
      }
      mergeAlterIntoTable(t, op);
    }
  }
  tables.push(...byKey.values());

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

  // 0.7.29 FC-6: preserve SQL/migration discovery order (do not alpha-sort names)
  const report = {
    ok: true,
    root: ".",
    sqlRoot: sqlRootRel,
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
  if (!args.noWrite) {
    const outPath = resolveInventoryOutPath(root, args.out, "db");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json, "utf8");
    console.error(
      `Wrote ${outPath} tables=${tables.length} enriched_comments≈${enriched}`
    );
    if (tables.length && sqlRootRel && sqlRootRel !== "file") {
      try {
        writeInventoryMeta(root, {
          db: { sql_root: toRootRelative(root, sqlRootRel) || sqlRootRel },
        });
      } catch {
        /* meta optional */
      }
    }
  } else {
    console.error(
      `[inventory-db] --no-write tables=${tables.length} (stdout only)`
    );
  }
  console.log(json);
  exitFromReport(report);
}

if (isCliMain(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
