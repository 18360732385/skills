#!/usr/bin/env node
/**
 * feature-eng close 双归档廉价校验（O7）。
 * 不写盘；只检查消费仓内 archive 形状与指针。
 *
 * Usage:
 *   node scripts/close-check.mjs --cwd <消费仓根> --slug <slug>
 *   node scripts/close-check.mjs --cwd scripts/fixtures/close-ready --slug 2026-09-19-close-ready-demo
 */
import fs from "fs";
import path from "path";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const cwd = path.resolve(arg("--cwd", process.cwd()));
const slug = arg("--slug");
if (!slug) {
  console.error("usage: node scripts/close-check.mjs --cwd <dir> --slug <slug>");
  process.exit(2);
}

const issues = [];
const ok = [];

function exists(rel) {
  return fs.existsSync(path.join(cwd, rel));
}
function read(rel) {
  const p = path.join(cwd, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}
function readScalar(text, key) {
  if (!text) return undefined;
  const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}
function nestedScalar(text, parentKey, childKey) {
  if (!text) return undefined;
  const start = text.search(new RegExp(`^${parentKey}:\\s*$`, "m"));
  if (start < 0) return undefined;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  const m = block.match(new RegExp(`^\\s+${childKey}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}

const activeRel = `docs/runs/active/${slug}`;
const archiveRel = `docs/runs/archive/${slug}`;
const progressRel = `${archiveRel}/progress.yaml`;
const huilianRel = `${archiveRel}/回链.md`;

if (exists(activeRel)) {
  issues.push(`active still present: ${activeRel}`);
} else {
  ok.push("active/<slug> absent");
}

if (!exists(archiveRel)) {
  issues.push(`archive missing: ${archiveRel}`);
} else {
  ok.push("archive/<slug> present");
}

const progress = read(progressRel);
if (!progress) {
  issues.push(`missing ${progressRel}`);
} else {
  ok.push("archive progress.yaml present");
  if (readScalar(progress, "stage") !== "done") {
    issues.push(`stage != done (got ${readScalar(progress, "stage")})`);
  } else {
    ok.push("stage=done");
  }
  const closeTs = nestedScalar(progress, "gates", "close");
  if (!closeTs || !/^\d{4}-\d{2}-\d{2}T/.test(String(closeTs))) {
    issues.push("gates.close missing or not ISO timestamp");
  } else {
    ok.push("gates.close ISO");
  }
  const slugField = readScalar(progress, "slug");
  if (slugField !== slug) {
    issues.push(`progress.slug mismatch (${slugField})`);
  } else {
    ok.push("progress.slug matches");
  }
}

if (!exists(huilianRel)) {
  issues.push(`missing ${huilianRel}`);
} else {
  ok.push("archive 回链.md present");
}

if (issues.length) {
  console.error(`close-check FAIL ${issues.length} issue(s) slug=${slug}`);
  for (const i of issues) console.error("  ✗", i);
  for (const o of ok) console.log("  ✓", o);
  process.exit(1);
}
console.log(`close-check PASS slug=${slug} (${ok.length} checks)`);
for (const o of ok) console.log("  ✓", o);
