#!/usr/bin/env node
/**
 * fill-truths-auto — fill contract truths from inventory + source (no npm deps).
 *
 * Usage:
 *   node scripts/fill-truths-auto.mjs --root <TARGET>
 *       [--domains api,db,redis,func] [--modules a,b]
 *       [--merge] [--shard-size 80] [--dry-run] [--work-only]
 *
 * --merge: incremental merge into existing truths (preserve human non-TODO content)
 * --shard-size: func method count per part file (default 80); api still uses 200 endpoints
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadDomainInventory,
  discoverInventories,
  loadJsonSafe,
  defaultInventoryPath,
} from "./lib/inventory-paths.mjs";
import { endpointToMarkdown, writeAutoFillShards } from "./lib/fill-auto-api.mjs";
import { writeTruthFile } from "./lib/merge-truth.mjs";
import { createProgress } from "./lib/progress-log.mjs";
import { writeProgress } from "./lib/progress-file.mjs";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: null,
    domains: defaultContractDomains().filter((d) => d !== "jobs"),
    modules: [],
    dryRun: false,
    workOnly: false,
    merge: false,
    shardSize: 80,
    quiet: false,
    writeProgress: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--domains")
      out.domains = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--modules" || a === "--module")
      out.modules = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--inventory-dir") argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--work-only") out.workOnly = true;
    else if (a === "--merge") out.merge = true;
    else if (a === "--shard-size") out.shardSize = Number(argv[++i]) || 80;
    else if (a === "--quiet") out.quiet = true;
    else if (a === "--write-progress") out.writeProgress = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-truths-auto.mjs --root <TARGET>
      [--domains api,db,redis,func] [--modules sms-entrance,sms-safe]
      [--merge] [--shard-size 80] [--dry-run] [--work-only]
      [--quiet] [--write-progress]

Fills truths from docs/<domain>/.fill-work/inventory*.json + source evidence.
--merge: preserve human patches; replace TODO(harness-eng) when new evidence exists.
--quiet: suppress stderr progress.
--write-progress: update docs/harness-eng/progress.yaml
`);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function writeFile(abs, text, dryRun, log, rel, opts = {}) {
  return writeTruthFile(abs, text, {
    dryRun,
    merge: opts.merge || false,
    minBytes: opts.minBytes ?? 0,
    log,
    rel,
    fs,
    path,
  });
}

function extractCreateTable(sqlText, tableName) {
  const re = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?[\`"]?${tableName}[\`"]?\\s*\\(`,
    "i"
  );
  const m = sqlText.match(re);
  if (!m) return null;
  const start = m.index;
  let i = start + m[0].length;
  let depth = 1;
  while (i < sqlText.length && depth > 0) {
    const ch = sqlText[i++];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
  }
  let end = i;
  const rest = sqlText.slice(i);
  const semi = rest.search(/;/);
  if (semi >= 0) end = i + semi + 1;
  return sqlText.slice(start, end).trim();
}

function parseColumns(createSql) {
  const open = createSql.indexOf("(");
  const close = createSql.lastIndexOf(")");
  if (open < 0 || close < 0) return [];
  const inner = createSql.slice(open + 1, close);
  const lines = inner.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cols = [];
  for (const line of lines) {
    if (/^(PRIMARY\s+KEY|UNIQUE\s+KEY|KEY\s+|INDEX\s+|CONSTRAINT|UNIQUE\s*\()/i.test(line))
      continue;
    const m = line.match(
      /^[`"]?(\w+)[`"]?\s+([\w()]+(?:\s+UNSIGNED)?)\s*(.*)$/i
    );
    if (!m) continue;
    const name = m[1];
    const typ = m[2];
    const rest = m[3] || "";
    const nn = /NOT\s+NULL/i.test(rest) ? "是" : "否";
    const defM = rest.match(/DEFAULT\s+((?:'[^']*')|(?:"[^"]*")|\S+)/i);
    const def = defM ? defM[1] : "—";
    const cM = rest.match(/COMMENT\s+'([^']*)'/i) || rest.match(/COMMENT\s+"([^"]*)"/i);
    const comment = cM ? cM[1] : "—";
    cols.push({ name, typ, nn, def, comment });
  }
  return cols;
}

function parseIndexes(createSql) {
  const idxs = [];
  const re =
    /((?:UNIQUE\s+)?(?:KEY|INDEX)|PRIMARY\s+KEY)\s+(?:[`"]?(\w+)[`"]?\s*)?\(([^)]+)\)/gi;
  let m;
  while ((m = re.exec(createSql)) !== null) {
    idxs.push({
      type: m[1].replace(/\s+/g, " ").trim(),
      name: m[2] || "PRIMARY",
      cols: m[3].replace(/[`"]/g, ""),
    });
  }
  return idxs;
}

function enrichColComment(col, tableInv) {
  if (col.comment && col.comment !== "—") return col.comment;
  const map = tableInv?.columnComments || tableInv?.columns || {};
  const hit =
    map[col.name] ||
    map[col.name.toLowerCase()] ||
    (Array.isArray(map)
      ? map.find((c) => (c.name || c.column) === col.name)?.comment
      : null);
  if (hit && String(hit).trim()) return String(hit).trim();
  return col.comment || "—";
}

function fillDb(root, inv, dryRun, log, merge) {
  const tables = inv?.tables || [];
  const outDir = path.join(root, "docs", "db", "table");
  fs.mkdirSync(outDir, { recursive: true });
  const indexRows = [];
  tables.forEach((t, i) => {
    const nn = pad2(i + 1);
    const name = t.name;
    const relEv = String(t.evidence || "").split("#")[0];
    const sqlAbs = path.resolve(root, relEv);
    let createSql = t.preview || "";
    if (fs.existsSync(sqlAbs) && /\.sql$/i.test(sqlAbs)) {
      const full = fs.readFileSync(sqlAbs, "utf8");
      createSql = extractCreateTable(full, name) || createSql;
    } else if (t.createSql) {
      createSql = t.createSql;
    }
    const cols = parseColumns(createSql || "").map((c) => ({
      ...c,
      comment: enrichColComment(c, t),
    }));
    // If inventory provided columns without CREATE, merge
    if (!cols.length && Array.isArray(t.columns)) {
      for (const c of t.columns) {
        cols.push({
          name: c.name || c.column,
          typ: c.type || c.typ || "—",
          nn: c.nn || "—",
          def: c.def || "—",
          comment: c.comment || "—",
        });
      }
    }
    const idxs = parseIndexes(createSql || "");
    const colTable = [
      "| 字段名 | 类型 | 非空 | 默认值 | 说明 |",
      "|---|---|---|---|---|",
      ...cols.map(
        (c) => `| ${c.name} | ${c.typ} | ${c.nn} | ${c.def} | ${c.comment} |`
      ),
    ].join("\n");
    const idxTable = idxs.length
      ? [
          "| 类型 | 名称 | 列 |",
          "|---|---|---|",
          ...idxs.map((x) => `| ${x.type} | ${x.name} | ${x.cols} |`),
        ].join("\n")
      : "_无解析到索引_";
    const md = `# ${name}

> **真相文档（SSOT）** · fill-truths-auto  
> **evidence:** \`${t.evidence || "—"}\`

## 建表语句

\`\`\`sql
${createSql || `-- TODO(harness-eng): CREATE TABLE ${name}`}
\`\`\`

## 字段

${colTable || "_无字段_"}

## 索引

${idxTable}

`;
    const rel = `docs/db/table/${nn}-${name}.md`;
    writeFile(path.join(root, rel), md, dryRun, log, rel, { merge });
    indexRows.push(`| ${name} | [\`${nn}-${name}.md\`](table/${nn}-${name}.md) | auto |`);
  });
  updateIndexTable(
    root,
    "docs/db/db.md",
    "表文档",
    ["| 表名 | 路径 | 说明 |", "|---|---|---|", ...indexRows],
    dryRun,
    log,
    merge
  );
}

function isNoiseRedisPattern(pattern) {
  const p = String(pattern || "");
  if (/\\[dwWsSb]|yyyy|MM-dd|%s|%n|%d|\{0\}|\\\\/.test(p)) return true;
  if (/^[\d\-/:\s.]+$/.test(p)) return true;
  if (p.length < 2) return true;
  return false;
}

function isLikelyRedisKey(pattern, note) {
  if (isNoiseRedisPattern(pattern)) return false;
  if (/redis call/i.test(note || "")) return true;
  if (/:/.test(pattern)) return true;
  if (/key|redis|cache|token|captcha|session|lock/i.test(note || "")) return true;
  return false;
}

function redisGroupKey(pattern) {
  const p = String(pattern || "").trim();
  const colon = p.indexOf(":");
  if (colon > 0) {
    const seg = p.slice(0, colon).replace(/[^a-zA-Z0-9_-]/g, "");
    return seg || "misc";
  }
  const m = p.match(/^([a-zA-Z][a-zA-Z0-9_-]{0,31})/);
  return m ? m[1] : "misc";
}

/** 0.2.10: collapse live SCAN instance keys to prefix:* for SSOT */
function normalizeRedisPattern(pattern) {
  const p = String(pattern || "").trim();
  if (!p.includes(":")) return p;
  const parts = p.split(":");
  const last = parts[parts.length - 1];
  if (/^[0-9a-f]{16,}$/i.test(last) || /^\d{6,}$/.test(last) || last.length > 40) {
    return parts.slice(0, -1).join(":") + ":*";
  }
  return p;
}

function formatValueFields(fields) {
  if (!fields || !fields.length) return "—";
  return fields.map((f) => (typeof f === "string" ? f : f.name || JSON.stringify(f))).join(", ");
}

function fillRedis(root, inv, dryRun, log, merge) {
  const keys = (inv?.keys || []).map((k) => ({
    ...k,
    pattern: normalizeRedisPattern(k.pattern),
    redis: k.redis != null ? k.redis : isLikelyRedisKey(k.pattern, k.note),
  }));
  // 0.2.9: do not emit related-constants noise into truths by default
  const real = keys.filter((k) => k.redis !== false && k.redis);
  const groups = new Map();
  for (const k of real) {
    const g = redisGroupKey(k.pattern);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(k);
  }
  if (groups.size > 20) {
    const tiny = [...groups.entries()].filter(([, arr]) => arr.length < 2);
    for (const [g, arr] of tiny) {
      if (g === "misc") continue;
      if (!groups.has("misc")) groups.set("misc", []);
      groups.get("misc").push(...arr);
      groups.delete(g);
    }
  }

  const sorted = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );
  const indexRows = [];
  let idx = 0;
  for (const [prefix, arr] of sorted) {
    idx++;
    const nn = pad2(idx);
    const safe = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    // de-dupe patterns after normalize
    const byPat = new Map();
    for (const k of arr) {
      const prev = byPat.get(k.pattern);
      if (!prev) byPat.set(k.pattern, k);
      else
        byPat.set(k.pattern, {
          ...prev,
          ...k,
          ttl: k.ttl || prev.ttl,
          valueType: k.valueType || prev.valueType,
          note: [prev.note, k.note].filter(Boolean).join("; "),
        });
    }
    const uniq = [...byPat.values()];
    const rows = uniq.map(
      (k) =>
        `| \`${k.pattern}\` | ${k.note || "—"} | \`${k.evidence || "—"}\` |`
    );
    const valueRows = uniq
      .filter((k) => k.valueType || (k.valueFields && k.valueFields.length) || k.ttl)
      .map(
        (k) =>
          `| \`${k.pattern}\` | ${k.valueType || "—"} | ${formatValueFields(k.valueFields)} | ${k.ttl || "—"} | \`${k.evidence || "—"}\` |`
      );
    const valueSection = valueRows.length
      ? `## Value 结构

| 模式 | valueType | 字段 | TTL | evidence |
|---|---|---|---|---|
${valueRows.join("\n")}
`
      : `## Value 结构

| 模式 | valueType | 字段 | TTL | evidence |
|---|---|---|---|---|
| \`${prefix}:*\` | — | — | — | fill-truths-auto |
`;
    // 0.2.10: always emit ## TTL (score requires this section)
    const ttlRows = uniq.map((k) => {
      const ttl = k.ttl || "未知/业务 TTL（见调用方 expire 或 MCP SCAN）";
      return `| \`${k.pattern}\` | ${ttl} | \`${k.evidence || "—"}\` |`;
    });
    const ttlSection = `## TTL

| 模式 | TTL | evidence |
|---|---|---|
${ttlRows.join("\n") || `| \`${prefix}:*\` | 未知/业务 TTL | — |`}
`;
    const md = `# Redis Key · ${prefix}

> **真相文档（SSOT）** · fill-truths-auto  
> 前缀/分组 \`${prefix}\` · ${uniq.length} keys（实例 Key 已归一为前缀）

## Key 模式

| 模式 | 说明 | evidence |
|---|---|---|
${rows.join("\n") || "| — | — | — |"}

${valueSection}${ttlSection}`;
    const rel = `docs/redis/keys/${nn}-${safe}.md`;
    writeFile(path.join(root, rel), md, dryRun, log, rel, { merge });
    indexRows.push(
      `| ${prefix} | [\`${nn}-${safe}.md\`](keys/${nn}-${safe}.md) | ${uniq.length} keys |`
    );
  }

  updateIndexTable(
    root,
    "docs/redis/redis.md",
    "Key 文档",
    ["| 文档 | 路径 | 说明 |", "|---|---|---|", ...indexRows],
    dryRun,
    log,
    merge
  );
}

function walkJavaServices(dir, acc = []) {
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
    if (st.isDirectory()) walkJavaServices(p, acc);
    else if (/Service(Impl)?\.java$/i.test(name) || /Component\.java$/i.test(name))
      acc.push(p);
  }
  return acc;
}

function parseServiceMethods(text) {
  const classM = text.match(/public\s+(?:class|interface)\s+(\w+)/);
  const cls = classM ? classM[1] : "?";
  const methods = [];
  const re =
    /(?:public|protected)\s+(?!class)([\w.<>,\s\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws[^{;]+)?[{;]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[2];
    if (/^(if|for|while|switch|catch|return|new)$/.test(name)) continue;
    methods.push({ ret: m[1].replace(/\s+/g, " ").trim(), name, params: m[3].trim() });
  }
  return { cls, methods };
}

const MIN_TRUTH_BYTES = 200;

function buildFuncMarkdown(modName, services, partLabel) {
  const svcRows = services.map(
    (s) =>
      `| ${s.class} | \`${s.evidence || "—"}\` | ${s.methods?.length || 0} | ${(s.annotations || []).join(", ") || "—"} |`
  );
  const methodBlocks = services.map((s) => {
    const rows = (s.methods || []).map(
      (m) => `| ${m.name} | ${m.ret} | \`${(m.params || "").slice(0, 60)}\` |`
    );
    return `#### ${s.class}\n\nevidence: \`${s.evidence || "—"}\`\n\n| 方法 | 返回 | 参数 |\n|---|---|---|\n${rows.join("\n") || "| — | — | — |"}\n`;
  });
  const methodCount = services.reduce((n, s) => n + (s.methods?.length || 0), 0);
  const title = partLabel ? `${modName} 功能 (${partLabel})` : `${modName} 功能`;
  return `# ${title}

> **真相文档（SSOT）** · fill-truths-auto  
> 服务类 ${services.length} · 方法 ${methodCount}

### 服务类

| 类名 | evidence | 方法数 | 注解 |
|---|---|---|---|
${svcRows.join("\n")}

### 方法清单

${methodBlocks.join("\n")}
`;
}

/** Flatten services into method units for sharding; keep service grouping when possible. */
function shardServicesByMethods(services, shardSize) {
  const total = services.reduce((n, s) => n + (s.methods?.length || 0), 0);
  if (total <= shardSize) return [services];

  const parts = [];
  let buf = [];
  let bufMethods = 0;

  for (const s of services) {
    const mcount = s.methods?.length || 0;
    if (mcount > shardSize) {
      if (buf.length) {
        parts.push(buf);
        buf = [];
        bufMethods = 0;
      }
      const methods = s.methods || [];
      for (let i = 0; i < methods.length; i += shardSize) {
        parts.push([
          {
            ...s,
            methods: methods.slice(i, i + shardSize),
          },
        ]);
      }
      continue;
    }
    if (bufMethods + mcount > shardSize && buf.length) {
      parts.push(buf);
      buf = [];
      bufMethods = 0;
    }
    buf.push(s);
    bufMethods += mcount;
  }
  if (buf.length) parts.push(buf);
  return parts.length ? parts : [services];
}

function fillFuncFromInventory(root, inv, modulesFilter, dryRun, log, merge, shardSize) {
  const mods = (inv.modules || []).filter(
    (m) => !modulesFilter.length || modulesFilter.includes(m.name)
  );
  if (!mods.length) return false;
  const indexRows = [];
  let fileIdx = 0;
  mods.forEach((mod) => {
    const services = mod.services || [];
    if (!services.length) {
      log.push({
        action: "skip-empty",
        path: `func/${mod.name}`,
        reason: "no services in inventory",
      });
      return;
    }
    const parts = shardServicesByMethods(services, shardSize);
    if (parts.length === 1) {
      fileIdx++;
      const nn = pad2(fileIdx);
      const methodCount = services.reduce((n, s) => n + (s.methods?.length || 0), 0);
      const md = buildFuncMarkdown(mod.name, parts[0], null);
      const rel = `docs/func/modules/${nn}-${mod.name}.md`;
      writeFile(path.join(root, rel), md, dryRun, log, rel, {
        minBytes: MIN_TRUTH_BYTES,
        merge,
      });
      indexRows.push(
        `| ${mod.name} | [\`${nn}-${mod.name}.md\`](modules/${nn}-${mod.name}.md) | ${services.length} svc / ${methodCount} methods |`
      );
    } else {
      const partLinks = [];
      let methodCount = 0;
      for (let p = 0; p < parts.length; p++) {
        fileIdx++;
        const nn = pad2(fileIdx);
        const slice = parts[p];
        methodCount += slice.reduce((n, s) => n + (s.methods?.length || 0), 0);
        const partName = `${mod.name}-part${p + 1}`;
        const md = buildFuncMarkdown(mod.name, slice, `part ${p + 1}`);
        const rel = `docs/func/modules/${nn}-${partName}.md`;
        writeFile(path.join(root, rel), md, dryRun, log, rel, {
          minBytes: MIN_TRUTH_BYTES,
          merge,
        });
        partLinks.push(`[\`${nn}-${partName}.md\`](modules/${nn}-${partName}.md)`);
      }
      indexRows.push(
        `| ${mod.name} | ${partLinks.join(" · ")} | ${services.length} svc / ${methodCount} methods (paged) |`
      );
    }
  });
  if (indexRows.length) {
    updateIndexTable(
      root,
      "docs/func/func.md",
      "模块文档",
      ["| 模块 | 路径 | 说明 |", "|---|---|---|", ...indexRows],
      dryRun,
      log,
      merge
    );
  }
  return true;
}

function fillFunc(root, modules, dryRun, log, merge, shardSize) {
  const inv = loadDomainInventory(root, "func");
  if (inv && Array.isArray(inv.modules) && inv.modules.length) {
    if (fillFuncFromInventory(root, inv, modules, dryRun, log, merge, shardSize)) return;
  }
  const mods =
    modules.length > 0
      ? modules
      : fs
          .readdirSync(root)
          .filter((n) => {
            try {
              return (
                fs.statSync(path.join(root, n)).isDirectory() &&
                fs.existsSync(path.join(root, n, "pom.xml"))
              );
            } catch {
              return false;
            }
          })
          .slice(0, 20);
  const indexRows = [];
  let fileIdx = 0;
  mods.forEach((mod) => {
    const javaRoot = path.join(root, mod, "src", "main", "java");
    const files = walkJavaServices(javaRoot);
    if (!files.length) {
      log.push({
        action: "skip-empty",
        path: `func/${mod}`,
        reason: "no Service/Component",
      });
      return;
    }
    const services = [];
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      const { cls, methods } = parseServiceMethods(text);
      const relEv = path.relative(root, f).replace(/\\/g, "/");
      services.push({ class: cls, evidence: relEv, methods, annotations: [] });
    }
    const parts = shardServicesByMethods(services, shardSize);
    if (parts.length === 1) {
      fileIdx++;
      const nn = pad2(fileIdx);
      const methodCount = services.reduce((n, s) => n + s.methods.length, 0);
      const md = buildFuncMarkdown(mod, parts[0], null);
      const rel = `docs/func/modules/${nn}-${mod}.md`;
      writeFile(path.join(root, rel), md, dryRun, log, rel, {
        minBytes: MIN_TRUTH_BYTES,
        merge,
      });
      indexRows.push(
        `| ${mod} | [\`${nn}-${mod}.md\`](modules/${nn}-${mod}.md) | ${files.length} svc / ${methodCount} methods |`
      );
    } else {
      const partLinks = [];
      let methodCount = 0;
      for (let p = 0; p < parts.length; p++) {
        fileIdx++;
        const nn = pad2(fileIdx);
        methodCount += parts[p].reduce((n, s) => n + s.methods.length, 0);
        const partName = `${mod}-part${p + 1}`;
        const md = buildFuncMarkdown(mod, parts[p], `part ${p + 1}`);
        const rel = `docs/func/modules/${nn}-${partName}.md`;
        writeFile(path.join(root, rel), md, dryRun, log, rel, {
          minBytes: MIN_TRUTH_BYTES,
          merge,
        });
        partLinks.push(`[\`${nn}-${partName}.md\`](modules/${nn}-${partName}.md)`);
      }
      indexRows.push(
        `| ${mod} | ${partLinks.join(" · ")} | ${files.length} svc / ${methodCount} methods (paged) |`
      );
    }
  });
  if (indexRows.length) {
    updateIndexTable(
      root,
      "docs/func/func.md",
      "模块文档",
      ["| 模块 | 路径 | 说明 |", "|---|---|---|", ...indexRows],
      dryRun,
      log,
      merge
    );
  }
}

function fillApi(root, args, dryRun, log, merge) {
  const files = discoverInventories(root, "api");
  if (!files.length) {
    log.push({ action: "skip-domain", domain: "api", reason: "no inventory" });
    return;
  }
  const workDir = path.join(root, "docs", "api", ".fill-work");
  const indexRows = [];
  let fileIdx = 0;
  for (const invFile of files) {
    const inv = loadJsonSafe(invFile);
    if (!inv || !Array.isArray(inv.endpoints)) continue;
    if (inv.skip) {
      log.push({
        action: "skip-empty",
        path: `api/${inv.module || path.basename(invFile)}`,
        reason: inv.skip,
      });
      continue;
    }
    const mod = inv.module || path.basename(invFile, ".json").replace(/^inventory-?/, "") || "api";
    if (args.modules.length && !args.modules.includes(mod)) continue;
    if (!inv.endpoints.length) {
      log.push({
        action: "skip-empty",
        path: `api/${mod}`,
        reason: "no endpoints",
      });
      continue;
    }

    const written = writeAutoFillShards(inv, workDir, root, dryRun);
    log.push({
      action: dryRun ? "dry-run-shards" : "write-shards",
      module: mod,
      shards: written,
    });

    if (args.workOnly) continue;

    const eps = inv.endpoints;
    const PART = 200;
    if (eps.length <= PART) {
      fileIdx++;
      const nn = pad2(fileIdx);
      const parts = eps.map((ep, i) => endpointToMarkdown(ep, i + 1, root));
      const md = `# ${mod} API

> **真相文档（SSOT）** · fill-truths-auto  
> **累计接口数**：${eps.length}

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 自动填充 | fill-truths-auto | harness-eng | ${new Date().toISOString().slice(0, 10)} |

---

${parts.join("\n")}
`;
      const rel = `docs/api/modules/${nn}-${mod}.md`;
      writeFile(path.join(root, rel), md, dryRun, log, rel, { merge });
      indexRows.push(
        `| ${mod} | [\`${nn}-${mod}.md\`](modules/${nn}-${mod}.md) | ${eps.length} endpoints |`
      );
    } else {
      const partLinks = [];
      for (let p = 0; p * PART < eps.length; p++) {
        fileIdx++;
        const nn = pad2(fileIdx);
        const slice = eps.slice(p * PART, (p + 1) * PART);
        const parts = slice.map((ep, i) => endpointToMarkdown(ep, i + 1, root));
        const partName = `${mod}-part${p + 1}`;
        const rel = `docs/api/modules/${nn}-${partName}.md`;
        const md = `# ${mod} API (part ${p + 1})

> **真相文档（SSOT）** · fill-truths-auto  
> **本片接口数**：${slice.length}

${parts.join("\n")}
`;
        writeFile(path.join(root, rel), md, dryRun, log, rel, {
          minBytes: MIN_TRUTH_BYTES,
          merge,
        });
        partLinks.push(`[\`${nn}-${partName}.md\`](modules/${nn}-${partName}.md)`);
      }
      indexRows.push(
        `| ${mod} | ${partLinks.join(" · ")} | ${eps.length} endpoints (paged) |`
      );
    }
  }
  if (!args.workOnly && indexRows.length) {
    updateIndexTable(
      root,
      "docs/api/api.md",
      "模块文档",
      ["| 模块 | 路径 | 说明 |", "|---|---|---|", ...indexRows],
      dryRun,
      log,
      merge
    );
  }
}

function updateIndexTable(root, indexRel, sectionHint, tableLines, dryRun, log, merge) {
  const abs = path.join(root, indexRel);
  if (!fs.existsSync(abs)) {
    log.push({ action: "skip-index", path: indexRel, reason: "missing" });
    return;
  }
  let text = fs.readFileSync(abs, "utf8");
  const block = tableLines.join("\n");
  const secRe = new RegExp(
    `(##\\s*[^\\n]*${sectionHint}[^\\n]*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`,
    "i"
  );
  if (secRe.test(text)) {
    text = text.replace(secRe, `$1\n${block}\n\n`);
  } else if (/TODO\(harness-eng\)/.test(text)) {
    text = text.replace(/TODO\(harness-eng\)[^\n]*/, `\n${block}\n`);
  } else {
    text = text.trimEnd() + `\n\n## ${sectionHint}\n\n${block}\n`;
  }
  writeFile(abs, text, dryRun, log, indexRel, { merge: false });
}

function main() {
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
  if (!fs.existsSync(root)) throw new Error(`root missing: ${root}`);

  const progress = createProgress({ quiet: args.quiet, label: "fill-truths-auto" });
  progress.log(`domains=${args.domains.join(",")}${args.merge ? " merge" : ""}`);

  const log = [];
  const merge = args.merge;
  let di = 0;
  for (const d of args.domains) {
    di++;
    progress.step(di, args.domains.length, d);
    if (d === "api") {
      fillApi(root, args, args.dryRun, log, merge);
    } else if (d === "db") {
      const inv = loadDomainInventory(root, "db");
      if (!inv) {
        log.push({
          action: "skip-domain",
          domain: "db",
          reason: `no inventory (expected ${defaultInventoryPath(root, "db")})`,
        });
      } else fillDb(root, inv, args.dryRun, log, merge);
    } else if (d === "redis") {
      const inv = loadDomainInventory(root, "redis");
      if (!inv) {
        log.push({ action: "skip-domain", domain: "redis", reason: "no inventory" });
      } else fillRedis(root, inv, args.dryRun, log, merge);
    } else if (d === "func") {
      fillFunc(root, args.modules, args.dryRun, log, merge, args.shardSize);
    } else {
      log.push({ action: "skip-domain", domain: d, reason: "unknown" });
    }
  }

  const written = log.filter((x) => x.action === "write" || x.action === "write-shards");
  const merged = log.filter((x) => x.action === "merged");
  const unchanged = log.filter((x) => x.action === "unchanged");
  const skips = log.filter((x) => String(x.action).startsWith("skip"));

  const report = {
    ok: true,
    dryRun: args.dryRun,
    workOnly: args.workOnly,
    merge: args.merge,
    shardSize: args.shardSize,
    root,
    domains: args.domains,
    stats: {
      written: written.length,
      merged: merged.length,
      unchanged: unchanged.length,
      skipped: skips.length,
    },
    results: log,
    skill: path.resolve(__dirname, ".."),
  };

  if (args.writeProgress && !args.dryRun) {
    try {
      const p = writeProgress(root, {
        domain: args.domains.join(","),
        last_mode: "fill-truths-auto",
        last_merge: args.merge ? new Date().toISOString() : "",
        notes: `written=${report.stats.written} merged=${report.stats.merged} unchanged=${report.stats.unchanged}`,
      });
      progress.log(`progress ${p}`);
    } catch (e) {
      progress.log(`progress skip: ${e.message || e}`);
    }
  }
  progress.done(
    `written=${report.stats.written} merged=${report.stats.merged} unchanged=${report.stats.unchanged}`
  );

  console.log(JSON.stringify(report, null, 2));
  console.log("");
  console.log("—— fill-truths-auto 摘要 ——");
  console.log(
    `written: ${report.stats.written}  merged: ${report.stats.merged}  unchanged: ${report.stats.unchanged}  skips: ${report.stats.skipped}  merge=${args.merge}  dryRun=${args.dryRun}`
  );
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
