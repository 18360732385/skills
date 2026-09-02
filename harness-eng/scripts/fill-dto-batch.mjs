#!/usr/bin/env node
/**
 * fill-dto-batch — per-endpoint DTO enrich (0.2.17+ binding gate).
 * Only injects classes declared on THAT endpoint (请求体类型 / 返回类型 / bodyType in block).
 * Never dumps all file-level DTOs into every 请求参数 section.
 *
 * Usage:
 *   node scripts/fill-dto-batch.mjs --root <TARGET> [--api-dir docs/api/modules]
 *       [--source-root <java-root>] [--dry-run]
 */
import fs from "fs";
import path from "path";
import { findClassFile, parseFields, toMarkdown } from "./fill-dto-fields.mjs";

function parseArgs(argv) {
  const out = {
    root: null,
    apiDir: "docs/api/modules",
    sourceRoot: null,
    dryRun: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--api-dir") out.apiDir = argv[++i];
    else if (a === "--source-root") out.sourceRoot = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-dto-batch.mjs --root <TARGET> [--api-dir docs/api/modules]
      [--source-root <java-root-or-repo>] [--dry-run]

0.2.17+: bind DTO tables to the declaring endpoint only (bodyType / 请求体类型 / 返回类型).
Unresolved classes → skipped (dto-unresolved). Cross-endpoint dumps are forbidden.
`);
}

function walkMd(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkMd(p, acc);
    else if (/\.md$/i.test(name)) acc.push(p);
  }
  return acc;
}

function simpleTypeName(t) {
  if (!t) return null;
  let s = String(t).trim();
  const gen = s.match(/<([^<>]+)>/);
  if (gen) s = gen[1].trim();
  s = s.replace(/\[\]$/, "");
  const parts = s.split(/[.,\s]/);
  s = parts[parts.length - 1];
  if (!s || /^(String|Integer|Long|Boolean|Object|Map|Void|void|List|AjaxResult|TableDataInfo)$/i.test(s))
    return null;
  return s;
}

function listJavaRoots(root) {
  const roots = [];
  const single = path.join(root, "src", "main", "java");
  if (fs.existsSync(single)) roots.push(single);
  try {
    for (const name of fs.readdirSync(root)) {
      if (name === "target" || name === ".git" || name === "node_modules" || name === "docs")
        continue;
      const javaRoot = path.join(root, name, "src", "main", "java");
      if (fs.existsSync(javaRoot)) roots.push(javaRoot);
    }
  } catch {
    /* ignore */
  }
  return [...new Set(roots.map((p) => path.resolve(p)))];
}

function resolveSourceRoots(root, sourceRootArg) {
  if (!sourceRootArg) return listJavaRoots(root).length ? listJavaRoots(root) : [root];
  const resolved = path.resolve(root, sourceRootArg);
  if (path.resolve(resolved) === path.resolve(root) || sourceRootArg === ".") {
    const listed = listJavaRoots(root);
    return listed.length ? listed : [root];
  }
  return [resolved];
}

function findClassInRoots(sourceRoots, className) {
  let lastErr = null;
  for (const sr of sourceRoots) {
    try {
      return findClassFile(sr, className);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`class not found: ${className}`);
}

/** Split markdown into ## endpoint blocks (keep preamble as index 0). */
function splitEndpointBlocks(text) {
  const re = /^##\s+/gm;
  const indices = [];
  let m;
  while ((m = re.exec(text))) indices.push(m.index);
  if (!indices.length) return [{ start: 0, text }];
  const blocks = [];
  if (indices[0] > 0) blocks.push({ start: 0, text: text.slice(0, indices[0]) });
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : text.length;
    blocks.push({ start, text: text.slice(start, end) });
  }
  return blocks;
}

function typesInBlock(block) {
  const req = new Set();
  const ret = new Set();
  for (const m of block.matchAll(/请求体类型：`([^`]+)`/g)) {
    const c = simpleTypeName(m[1]);
    if (c) req.add(c);
  }
  for (const m of block.matchAll(/返回类型：`([^`]+)`/g)) {
    const c = simpleTypeName(m[1]);
    if (c) ret.add(c);
  }
  for (const m of block.matchAll(/bodyType["\s:]+([A-Za-z0-9_<>.]+)/g)) {
    const c = simpleTypeName(m[1]);
    if (c) req.add(c);
  }
  for (const m of block.matchAll(/retType["\s:]+([A-Za-z0-9_<>.]+)/g)) {
    const c = simpleTypeName(m[1]);
    if (c) ret.add(c);
  }
  return { req, ret };
}

function injectTable(sectionBody, className, table) {
  const marker = `<!-- dto:${className} -->`;
  if (sectionBody.includes(marker) || (sectionBody.includes(className) && sectionBody.includes("| 字段"))) {
    return { body: sectionBody, changed: false };
  }
  const inject = `\n${marker}\n${table}\n`;
  return { body: sectionBody.trimEnd() + inject, changed: true };
}

function enrichBlock(block, sourceRoots) {
  if (!/^##\s+/.test(block)) return { text: block, changed: 0, unresolved: 0 };
  const { req, ret } = typesInBlock(block);
  let text = block;
  let changed = 0;
  let unresolved = 0;

  const applyToSection = (heading, classNames) => {
    const re = new RegExp(
      `(###\\s*${heading}\\s*\\n)([\\s\\S]*?)(?=\\n###\\s*|\\n##\\s+|$)`
    );
    const m = text.match(re);
    if (!m) return;
    let body = m[2];
    let localChange = false;
    for (const className of classNames) {
      try {
        const file = findClassInRoots(sourceRoots, className);
        const src = fs.readFileSync(file, "utf8");
        const fields = parseFields(src);
        if (!fields.length) continue;
        const table = toMarkdown(className, file.replace(/\\/g, "/"), fields).trim();
        const r = injectTable(body, className, table);
        body = r.body;
        if (r.changed) {
          localChange = true;
          changed++;
        }
      } catch {
        unresolved++;
      }
    }
    if (localChange) {
      text = text.replace(re, `$1${body}`);
    }
  };

  applyToSection("请求参数", [...req]);
  applyToSection("响应参数", [...ret]);
  return { text, changed, unresolved };
}

function enrichFile(abs, sourceRoots, dryRun) {
  const original = fs.readFileSync(abs, "utf8");
  const blocks = splitEndpointBlocks(original);
  let changed = 0;
  let unresolved = 0;
  const out = [];
  for (const b of blocks) {
    const r = enrichBlock(b.text, sourceRoots);
    out.push(r.text);
    changed += r.changed;
    unresolved += r.unresolved;
  }
  const next = out.join("");
  if (changed && !dryRun && next !== original) fs.writeFileSync(abs, next, "utf8");
  return { changed, unresolved };
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
  const apiDir = path.resolve(root, args.apiDir);
  const sourceRoots = resolveSourceRoots(root, args.sourceRoot);
  const files = walkMd(apiDir);
  let total = 0;
  let unresolved = 0;
  const touched = [];
  for (const f of files) {
    const n = enrichFile(f, sourceRoots, args.dryRun);
    if (n.changed) {
      total += n.changed;
      touched.push(path.relative(root, f).replace(/\\/g, "/"));
    }
    unresolved += n.unresolved;
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: args.dryRun,
        root,
        binding: "per-endpoint",
        sourceRoots: sourceRoots.map((s) => path.relative(root, s).replace(/\\/g, "/") || "."),
        files: files.length,
        enrichments: total,
        unresolved,
        touched,
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
