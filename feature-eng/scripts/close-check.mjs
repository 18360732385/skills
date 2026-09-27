#!/usr/bin/env node
/**
 * feature-eng close 双归档廉价校验（O7 + 0.2.11 gate-evidence）。
 * 不写盘；检查 archive 形状后组合 gate-evidence。
 *
 * Usage:
 *   node scripts/close-check.mjs --cwd <消费仓根> --slug <slug>
 *   node scripts/close-check.mjs --cwd scripts/fixtures/close-ready --slug 2026-09-19-close-ready-demo
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const warnings = [];

function exists(rel) {
  return fs.existsSync(path.join(cwd, rel));
}
function read(rel) {
  const p = path.join(cwd, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}
function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  let st;
  try {
    st = fs.statSync(dir);
  } catch {
    return acc;
  }
  if (st.isFile()) {
    acc.push(dir);
    return acc;
  }
  if (!st.isDirectory()) return acc;
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of names) {
    if (name === ".git" || name === "node_modules") continue;
    walkFiles(path.join(dir, name), acc);
  }
  return acc;
}
function looksLikeCommitCol(val) {
  const v = String(val || "").trim();
  if (!v || v === "—" || v === "-" || v === "–") return { ok: false, empty: true };
  if (/^https?:\/\//i.test(v)) return { ok: true };
  if (/^pr:\d+/i.test(v)) return { ok: true };
  if (/^[0-9a-f]{40}$/i.test(v)) return { ok: true };
  if (/^[0-9a-f]{7,12}$/i.test(v)) return { ok: true };
  return { ok: false, empty: false };
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

// E11: archive 树（及 artifacts 指向文件）不得残留 active/<slug> 死链
const activeNeedle = `docs/runs/active/${slug}`;
const scanFiles = [];
if (exists(archiveRel)) {
  for (const abs of walkFiles(path.join(cwd, archiveRel))) {
    if (/\.(md|ya?ml|txt)$/i.test(abs)) scanFiles.push(abs);
  }
}
if (progress) {
  for (const key of ["spec", "plan", "design", "proto", "report"]) {
    const p = nestedScalar(progress, "artifacts", key);
    if (p && typeof p === "string" && !p.startsWith("http")) {
      const abs = path.isAbsolute(p) ? p : path.join(cwd, p);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) scanFiles.push(abs);
    }
  }
}
const seenScan = new Set();
for (const abs of scanFiles) {
  const norm = path.resolve(abs);
  if (seenScan.has(norm)) continue;
  seenScan.add(norm);
  let text = "";
  try {
    text = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (text.includes(activeNeedle)) {
    const rel = path.relative(cwd, abs).replace(/\\/g, "/");
    issues.push(`dead active path in ${rel}: ${activeNeedle}`);
  }
}
if (!issues.some((i) => String(i).startsWith("dead active path"))) {
  ok.push("no active/<slug> dead links in archive/artifacts");
}

// E13: ARCHIVE「提交」列（有本主题行时）；不合规则 WARNING，不阻断独立仓
const archiveMd = read("docs/superpowers/ARCHIVE.md");
if (archiveMd) {
  const rows = archiveMd.split(/\r?\n/).filter((l) => /^\|/.test(l) && l.includes(slug));
  if (rows.length) {
    for (const row of rows) {
      // table: | 日期 | 主题 | Spec | Plan | 提交 |
      const parts = row.split("|").map((c) => c.trim()).filter((c) => c !== "");
      if (parts.length < 5) continue;
      const commitCell = parts[parts.length - 1];
      const check = looksLikeCommitCol(commitCell);
      if (check.ok) {
        ok.push("ARCHIVE 提交 column ok");
      } else if (check.empty) {
        warnings.push(`ARCHIVE 提交 column empty for slug=${slug}`);
      } else {
        warnings.push(
          `ARCHIVE 提交 column not PR/SHA (branch tip?): ${commitCell}`
        );
      }
    }
  } else {
    ok.push("ARCHIVE present but no slug row (skip 提交 check)");
  }
} else {
  ok.push("no ARCHIVE.md (skip 提交 check)");
}

if (issues.length) {
  console.error(`close-check FAIL ${issues.length} issue(s) slug=${slug}`);
  for (const i of issues) console.error("  ✗", i);
  for (const w of warnings) console.warn("  !", w);
  for (const o of ok) console.log("  ✓", o);
  process.exit(1);
}

const gateEvidence = path.join(__dirname, "gate-evidence.mjs");
const ge = spawnSync(
  process.execPath,
  [gateEvidence, "--cwd", cwd, "--slug", slug],
  { encoding: "utf8" }
);
const geOut = `${ge.stdout || ""}${ge.stderr || ""}`;
if (ge.status !== 0) {
  console.error(`close-check FAIL: gate-evidence exit ${ge.status}`);
  process.stdout.write(geOut);
  for (const o of ok) console.log("  ✓", o);
  process.exit(ge.status == null ? 1 : ge.status);
}
ok.push("gate-evidence PASS");
console.log(`close-check PASS slug=${slug} (${ok.length} checks)`);
for (const o of ok) console.log("  ✓", o);
for (const w of warnings) console.warn("  ! WARNING", w);
if (ge.stdout) process.stdout.write(ge.stdout);
