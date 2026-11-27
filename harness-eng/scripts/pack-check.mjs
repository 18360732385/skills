#!/usr/bin/env node
/**
 * Install-payload check: applies .skillignore, rejects runtime artifacts and
 * _log paths, and reports the footprint by top-level category.
 *
 * Usage: node scripts/pack-check.mjs [--max-mb 3.5] [--max-files 500]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const out = { maxMb: 3.5, maxFiles: 500 };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--max-mb") out.maxMb = Number(argv[++i]);
    else if (argv[i] === "--max-files") out.maxFiles = Number(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") out.help = true;
  }
  return out;
}

function globToRe(glob) {
  const source = glob.replace(/\\/g, "/").replace(/^\.\//, "");
  let re = "";
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "*") {
      if (source[i + 1] === "*") {
        i += 1;
        if (source[i + 1] === "/") {
          i += 1;
          re += "(?:.*/)?";
        } else {
          re += ".*";
        }
      } else {
        re += "[^/]*";
      }
    } else if (ch === "?") {
      re += "[^/]";
    } else {
      re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

function loadIgnore() {
  const file = path.join(SKILL_ROOT, ".skillignore");
  if (!fs.existsSync(file)) return { excludes: [], negates: [] };
  const excludes = [];
  const negates = [];
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("!")) negates.push(globToRe(line.slice(1)));
    else excludes.push(globToRe(line));
  }
  return { excludes, negates };
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (ent.isFile()) out.push(abs);
  }
  return out;
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log("Usage: node scripts/pack-check.mjs [--max-mb 3.5] [--max-files 500]");
  process.exit(0);
}

const { excludes, negates } = loadIgnore();
const files = walk(SKILL_ROOT);
const leaked = [];
const included = [];
for (const abs of files) {
  const rel = path.relative(SKILL_ROOT, abs).replace(/\\/g, "/");
  const ignored = excludes.some((re) => re.test(rel)) && !negates.some((re) => re.test(rel));
  if (ignored) continue;
  included.push({ rel, size: fs.statSync(abs).size });
  if (/^(\.\.\/|_log\/)|(^|\/)docs\/harness-eng\/(score-latest|report-latest|score-history)/.test(rel)) {
    leaked.push(rel);
  }
}

const totalBytes = included.reduce((sum, f) => sum + f.size, 0);
const totalMb = totalBytes / (1024 * 1024);
const byTop = new Map();
for (const f of included) {
  const top = f.rel.includes("/") ? f.rel.split("/")[0] : "(root)";
  const cur = byTop.get(top) || { files: 0, bytes: 0 };
  cur.files += 1;
  cur.bytes += f.size;
  byTop.set(top, cur);
}

console.log(
  `[pack-check] install payload: ${included.length} files, ${totalMb.toFixed(2)} MB (limits: ${args.maxFiles} files, ${args.maxMb} MB)`
);
for (const [top, stat] of [...byTop.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${top.padEnd(12)} ${String(stat.files).padStart(4)} files  ${(stat.bytes / 1024).toFixed(1)} KB`);
}
const devOnly = included.filter(
  (f) => f.rel.startsWith("scripts/fixtures/") || /^scripts\/selfcheck.*\.mjs$/.test(f.rel)
);
console.log(
  `[pack-check] dev-only payload (fixtures + selfcheck): ${devOnly.length} files, ${(
    devOnly.reduce((sum, f) => sum + f.size, 0) / 1024
  ).toFixed(1)} KB`
);

let failed = false;
if (leaked.length) {
  failed = true;
  console.error("[pack-check] forbidden runtime/_log paths in install payload:");
  for (const rel of leaked) console.error(`  - ${rel}`);
}
if (included.length > args.maxFiles) {
  failed = true;
  console.error(`[pack-check] file count ${included.length} > ${args.maxFiles}`);
}
if (totalMb > args.maxMb) {
  failed = true;
  console.error(`[pack-check] size ${totalMb.toFixed(2)} MB > ${args.maxMb} MB`);
}
process.exit(failed ? 1 : 0);
