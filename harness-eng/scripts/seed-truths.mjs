#!/usr/bin/env node
/**
 * seed-truths — create empty truth shells + index nav rows (no npm deps).
 *
 * Usage:
 *   node scripts/seed-truths.mjs --root <TARGET>
 *       [--domains api,func,db,redis] [--modules sms-entrance,sms-safe]
 *       [--dry-run] [--max-db 40] [--max-redis 20]
 *
 * Boundaries: shells + index nav only; never overwrite non-empty truth bodies.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: null,
    domains: defaultContractDomains(),
    modules: [],
    dryRun: false,
    maxDb: 0,
    maxRedis: 0,
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
    else if (a === "--modules")
      out.modules = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--max-db") {
      const n = Number(argv[++i]);
      out.maxDb = Number.isFinite(n) ? n : 0;
    } else if (a === "--max-redis") {
      const n = Number(argv[++i]);
      out.maxRedis = Number.isFinite(n) ? n : 0;
    } else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/seed-truths.mjs --root <TARGET>
      [--domains api,func,db,redis] [--modules a,b]
      [--dry-run] [--max-db 0] [--max-redis 0]

Creates empty 01-*.md shells + appends missing index nav rows.
Skips existing non-empty truth files.
--max-db / --max-redis default 0 = no limit. When tables > 100, prints a batch hint.
`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function slugify(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function isNonEmptyTruth(text) {
  const t = (text || "").trim();
  if (!t) return false;
  // Empty shell still has TODO(harness-eng); treat as shell if mostly TODO / short
  const hasTodo = /TODO\(harness-eng\)/i.test(t);
  if (hasTodo && t.length < 800) return false;
  // Real content: real API path, CREATE TABLE, Key pattern filled, service table rows
  if (/\*\*接口地址[：:]\*\*\s*\/\S+/.test(t)) return true;
  if (/CREATE\s+TABLE\s+`?\w+/i.test(t) && !/CREATE TABLE …/.test(t)) return true;
  if (/##\s*Key 模式/.test(t) && !/从业务调用方补全/.test(t) && t.length > 400) return true;
  if (/###\s*服务类/.test(t) && !/TODO\(harness-eng\)/.test(t) && t.length > 400) return true;
  if (!hasTodo && t.length > 400) return true;
  return false;
}

function parsePomModules(root) {
  const pom = path.join(root, "pom.xml");
  if (!fs.existsSync(pom)) return [];
  const text = fs.readFileSync(pom, "utf8");
  const mods = [];
  const re = /<module>\s*([^<]+)\s*<\/module>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\\/g, "/").split("/").pop();
    if (name && !mods.includes(name)) mods.push(name);
  }
  return mods;
}

function listExistingShells(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^\d{2}-.+\.md$/i.test(n))
    .map((n) => {
      const m = n.match(/^(\d{2})-(.+)\.md$/i);
      return { nn: Number(m[1]), slug: m[2], file: n };
    })
    .sort((a, b) => a.nn - b.nn);
}

function nextNn(existing) {
  if (!existing.length) return 1;
  return Math.max(...existing.map((e) => e.nn)) + 1;
}

function findBySlug(existing, slug) {
  return existing.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

function walkSql(dir, acc = []) {
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
    if (st.isDirectory()) walkSql(p, acc);
    else if (/\.sql$/i.test(name)) acc.push(p);
  }
  return acc;
}

function extractTablesFromSql(root) {
  const candidates = ["file", "sql", "db", "docs/db"];
  const tables = [];
  const seen = new Set();
  for (const rel of candidates) {
    const dir = path.join(root, rel);
    for (const f of walkSql(dir)) {
      const text = fs.readFileSync(f, "utf8");
      const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/gi;
      let m;
      while ((m = re.exec(text)) !== null) {
        const name = m[1];
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tables.push(name);
      }
    }
  }
  // @TableName fallback
  function walkJava(dir, depth) {
    if (depth > 6 || !fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      if (name === "target" || name === ".git" || name === "node_modules") continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walkJava(p, depth + 1);
      else if (/\.java$/i.test(name)) {
        const text = fs.readFileSync(p, "utf8");
        const re = /@TableName\s*\(\s*"([^"]+)"\s*\)/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          const key = m[1].toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          tables.push(m[1]);
        }
      }
    }
  }
  walkJava(root, 0);
  return tables;
}

function extractRedisFamilies(root) {
  const families = [];
  const seen = new Set();
  function walkJava(dir, depth) {
    if (depth > 6 || !fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      if (name === "target" || name === ".git" || name === "node_modules") continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walkJava(p, depth + 1);
      else if (/\.java$/i.test(name)) {
        const text = fs.readFileSync(p, "utf8");
        const re = /["']([a-z][a-z0-9_]{2,40}):(?:\{?[^"']*\}?|[a-z0-9_*]+)["']/gi;
        let m;
        while ((m = re.exec(text)) !== null) {
          const fam = m[1].toLowerCase().replace(/_+/g, "-");
          if (seen.has(fam)) continue;
          // skip common noise
          if (["http", "https", "com", "org", "java", "spring"].includes(fam)) continue;
          seen.add(fam);
          families.push(fam);
        }
      }
    }
  }
  walkJava(root, 0);
  if (!families.length) families.push("redis-cache");
  return families;
}

function shellApi(slug) {
  return `# ${slug} 接口文档

> **真相文档（SSOT）**。索引见 [\`../api.md\`](../api.md)。冲突以本文为准。

TODO(harness-eng): 从代码补全接口清单（完整档）

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 创建空壳 | harness-eng | ${today()} |
`;
}

function shellFunc(slug) {
  return `# ${slug} 功能资产

> **真相文档（SSOT）**。索引见 [\`../func.md\`](../func.md)。冲突以本文为准。

TODO(harness-eng): 从代码补全服务类与方法清单

### 服务类

TODO(harness-eng)

### 方法清单

TODO(harness-eng)

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 创建空壳 | harness-eng | ${today()} |
`;
}

function shellDb(table) {
  return `# 表 \`${table}\`

> **真相文档（SSOT）**。索引见 [\`../db.md\`](../db.md)。冲突以本文为准。

TODO(harness-eng): 从 SQL / 实体补全建表语句与字段说明

## 建表语句

\`\`\`sql
-- TODO(harness-eng): CREATE TABLE \`${table}\` …
\`\`\`

## 字段

TODO(harness-eng)

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 创建空壳 | harness-eng | ${today()} |
`;
}

function shellRedis(family) {
  return `# ${family}

> **真相文档（SSOT）**。索引见 [\`../redis.md\`](../redis.md)。冲突以本文为准。

TODO(harness-eng): 从业务调用方补全 Key 模式

## Key 模式

| 项 | 说明 |
|---|---|
| 模式 | TODO(harness-eng) |
| 示例 | … |
| 数据结构 | … |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 创建空壳 | harness-eng | ${today()} |
`;
}

function indexMeta(domain) {
  if (domain === "api")
    return {
      index: "docs/api/api.md",
      dir: "docs/api/modules",
      section: "## 模块文档",
      linkPrefix: "./modules/",
      headers: "| 模块 | 真相路径 | 基础路径 | 接口数 |",
      row: (nn, slug) =>
        `| ${slug} | [modules/${pad2(nn)}-${slug}.md](./modules/${pad2(nn)}-${slug}.md) | TODO | 0 |`,
    };
  if (domain === "func")
    return {
      index: "docs/func/func.md",
      dir: "docs/func/modules",
      section: "## 模块文档",
      linkPrefix: "./modules/",
      headers: "| 模块 | 真相路径 | 说明 |",
      row: (nn, slug) =>
        `| ${slug} | [modules/${pad2(nn)}-${slug}.md](./modules/${pad2(nn)}-${slug}.md) | TODO(harness-eng) |`,
    };
  if (domain === "db")
    return {
      index: "docs/db/db.md",
      dir: "docs/db/table",
      section: "## 表文档",
      linkPrefix: "./table/",
      headers: "| 表名 | 真相路径 | 说明 |",
      row: (nn, slug) =>
        `| ${slug} | [table/${pad2(nn)}-${slug}.md](./table/${pad2(nn)}-${slug}.md) | TODO(harness-eng) |`,
    };
  return {
    index: "docs/redis/redis.md",
    dir: "docs/redis/keys",
    section: "## Key 文档",
    linkPrefix: "./keys/",
    headers: "| Key 族 | 真相路径 | 说明 |",
    row: (nn, slug) =>
      `| ${slug} | [keys/${pad2(nn)}-${slug}.md](./keys/${pad2(nn)}-${slug}.md) | TODO(harness-eng) |`,
  };
}

function ensureIndexNav(root, domain, nn, slug, dryRun, log) {
  const meta = indexMeta(domain);
  const abs = path.join(root, meta.index);
  if (!fs.existsSync(abs)) {
    log.push({ action: "skip-index", domain, reason: "index missing", path: meta.index });
    return;
  }
  let text = fs.readFileSync(abs, "utf8");
  const linkNeedle = `${pad2(nn)}-${slug}.md`;
  const slugNeedle = `-${slug}.md`;
  if (text.includes(linkNeedle) || text.includes(slugNeedle)) {
    log.push({ action: "skip-index-row", domain, slug, reason: "already listed" });
    return;
  }
  const row = meta.row(nn, slug);
  // Append after section table header if present, else append at end of section
  const secIdx = text.indexOf(meta.section);
  if (secIdx >= 0) {
    // Find end of first markdown table after section
    const after = text.slice(secIdx);
    const tableStart = after.search(/^\|.+\|$/m);
    if (tableStart >= 0) {
      let pos = secIdx + tableStart;
      // skip header + separator
      const lines = text.slice(pos).split(/\r?\n/);
      let i = 0;
      while (i < lines.length && /^\|/.test(lines[i])) i++;
      const insertAt = pos + lines.slice(0, i).join("\n").length;
      const before = text.slice(0, insertAt);
      const afterPart = text.slice(insertAt);
      const nl = before.endsWith("\n") ? "" : "\n";
      text = before + nl + row + (afterPart.startsWith("\n") ? "" : "\n") + afterPart;
    } else {
      text = text.replace(/\s*$/, "") + `\n\n${meta.headers}\n|---|---|---|\n${row}\n`;
    }
  } else {
    text = text.replace(/\s*$/, "") + `\n\n${meta.section}\n\n${meta.headers}\n|---|---|---|\n${row}\n`;
  }
  if (dryRun) {
    log.push({ action: "dry-run-index", domain, slug, path: meta.index, row });
    return;
  }
  fs.writeFileSync(abs, text, "utf8");
  log.push({ action: "index-row", domain, slug, path: meta.index });
}

function writeShell(root, domain, nn, slug, body, dryRun, log) {
  const meta = indexMeta(domain);
  const rel = `${meta.dir}/${pad2(nn)}-${slug}.md`;
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    const cur = fs.readFileSync(abs, "utf8");
    if (isNonEmptyTruth(cur)) {
      log.push({ action: "skip", domain, path: rel, reason: "non-empty truth" });
      return { nn, slug, skipped: true };
    }
    log.push({ action: "skip", domain, path: rel, reason: "shell already exists" });
    return { nn, slug, skipped: true };
  }
  if (dryRun) {
    log.push({
      action: "dry-run",
      domain,
      path: rel,
      bytes: Buffer.byteLength(body, "utf8"),
      preview: body.split("\n").slice(0, 12).join("\n"),
    });
    return { nn, slug, skipped: false };
  }
  ensureDir(abs);
  fs.writeFileSync(abs, body, "utf8");
  log.push({ action: "create", domain, path: rel });
  return { nn, slug, skipped: false };
}

function seedDomain(root, domain, names, dryRun, log) {
  const meta = indexMeta(domain);
  const dirAbs = path.join(root, meta.dir);
  fs.mkdirSync(dirAbs, { recursive: true });
  const existing = listExistingShells(dirAbs);
  let nnCursor = nextNn(existing);
  for (const raw of names) {
    const slug = slugify(raw);
    if (!slug) continue;
    const hit = findBySlug(existing, slug);
    let nn;
    if (hit) {
      nn = hit.nn;
    } else {
      nn = nnCursor++;
      existing.push({ nn, slug, file: `${pad2(nn)}-${slug}.md` });
    }
    const body =
      domain === "api"
        ? shellApi(slug)
        : domain === "func"
          ? shellFunc(slug)
          : domain === "db"
            ? shellDb(slug)
            : shellRedis(slug);
    writeShell(root, domain, nn, slug, body, dryRun, log);
    ensureIndexNav(root, domain, nn, slug, dryRun, log);
  }
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

  let modules = args.modules.length ? args.modules : parsePomModules(root);
  // Prefer app modules (sms-*); drop parent aggregator names if mixed
  if (!args.modules.length && modules.length) {
    const sms = modules.filter((m) => /^sms-/i.test(m));
    if (sms.length) modules = sms;
  }
  if (!modules.length) modules = ["app"];

  const log = [];
  const plan = { modules, domains: args.domains, names: {} };

  for (const d of args.domains) {
    if (d === "api" || d === "func") {
      plan.names[d] = modules.map(slugify);
      seedDomain(root, d, plan.names[d], args.dryRun, log);
    } else if (d === "db") {
      let tables = extractTablesFromSql(root).map(slugify).filter(Boolean);
      if (!tables.length) {
        log.push({ action: "skip-domain", domain: "db", reason: "no table evidence" });
        plan.names.db = [];
        continue;
      }
      tables = [...new Set(tables)];
      if (tables.length > 100 && args.maxDb === 0) {
        console.error(
          `提示: 表数 ${tables.length} > 100。默认全量写入；若需分批可传 --max-db 100`
        );
      }
      if (args.maxDb > 0) tables = tables.slice(0, args.maxDb);
      plan.names.db = tables;
      seedDomain(root, "db", tables, args.dryRun, log);
    } else if (d === "redis") {
      let fams = extractRedisFamilies(root).map(slugify).filter(Boolean);
      fams = [...new Set(fams)];
      if (args.maxRedis > 0) fams = fams.slice(0, args.maxRedis);
      plan.names.redis = fams;
      seedDomain(root, "redis", fams, args.dryRun, log);
    } else if (d === "jobs") {
      log.push({
        action: "skip-domain",
        domain: "jobs",
        reason:
          "jobs shells via land templates (docs/jobs); task docs via fill-truths-agents / inventory SyncTaskCode",
      });
      plan.names.jobs = [];
    } else {
      log.push({ action: "skip-domain", domain: d, reason: "unknown domain" });
    }
  }

  const report = {
    ok: true,
    dryRun: args.dryRun,
    root,
    plan,
    results: log,
    skill: path.resolve(__dirname, ".."),
  };
  console.log(JSON.stringify(report, null, 2));
  console.log("");
  console.log("—— seed-truths 摘要 ——");
  console.log(`modules: ${modules.join(", ")}`);
  console.log(`domains: ${args.domains.join(", ")}`);
  const created = log.filter((x) => x.action === "create" || x.action === "dry-run").length;
  const skipped = log.filter((x) => x.action === "skip").length;
  console.log(`shells create/dry-run: ${created}  skip: ${skipped}`);
  if (args.dryRun) console.log("(dry-run：未写盘)");
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
