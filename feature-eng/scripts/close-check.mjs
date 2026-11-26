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
import {
  ARTIFACT_KEYS,
  stripYamlInlineComment,
} from "./lib/progress-shape.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const expectFail = process.argv.includes("--expect-fail");
const cwd = path.resolve(arg("--cwd", process.cwd()));
const slug = arg("--slug");
if (!slug) {
  console.error(
    "usage: node scripts/close-check.mjs --cwd <dir> --slug <slug> [--expect-fail]"
  );
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
  if (/^[0-9a-f]{7,40}$/i.test(v)) return { ok: true };
  return { ok: false, empty: false };
}
function isIsoTs(v) {
  return v != null && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(v));
}
function normalizeScalar(raw) {
  let v = stripYamlInlineComment(raw).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "" || v === "—") return null;
  return v;
}
function readScalar(text, key) {
  if (!text) return undefined;
  const m = text.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  return normalizeScalar(m[1]);
}
function nestedScalar(text, parentKey, childKey) {
  if (!text) return undefined;
  const start = text.search(
    new RegExp(`^${parentKey}\\s*:\\s*(?:#.*)?$`, "m")
  );
  if (start < 0) return undefined;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  const m = block.match(new RegExp(`^\\s+${childKey}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  return normalizeScalar(m[1]);
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
  if (!isIsoTs(closeTs)) {
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

  const pathVal = readScalar(progress, "path");
  if (pathVal == null) {
    issues.push("progress.path missing/null");
  } else if (pathVal === "full") {
    for (const key of ["spec", "testcases", "test_report"]) {
      if (!nestedScalar(progress, "artifacts", key)) {
        issues.push(`full path close requires artifacts.${key}`);
      }
    }
    if (!isIsoTs(nestedScalar(progress, "gates", "verify"))) {
      issues.push("full path close requires ISO gates.verify");
    }
    const reportRel = nestedScalar(progress, "artifacts", "test_report");
    if (reportRel) {
      const abs = path.isAbsolute(reportRel)
        ? reportRel
        : path.join(cwd, reportRel);
      if (fs.existsSync(abs)) {
        const body = fs.readFileSync(abs, "utf8");
        if (/\|\s*TC-\d+\s*\|\s*pass\s*\/\s*fail\s*\/\s*blocked\s*\|/i.test(body)) {
          issues.push(`test report still template placeholder: ${reportRel}`);
        }
      }
    }
  }

  // D6-①：close 归档态下 spec/plan 应指向 docs/superpowers/…/archive/，不得残留未归档路径
  for (const key of ["spec", "plan"]) {
    const p = nestedScalar(progress, "artifacts", key);
    if (
      p &&
      typeof p === "string" &&
      p.includes("docs/superpowers/") &&
      !p.includes("/archive/")
    ) {
      issues.push(`artifacts.${key} still points at un-archived superpowers path: ${p}`);
    }
  }
  // D6-②：归档态 artifacts 指针（非 null 非 http 的可路径键）必须对应真实文件
  for (const key of ARTIFACT_KEYS.filter((k) => k !== "adr")) {
    const p = nestedScalar(progress, "artifacts", key);
    if (p && typeof p === "string" && !p.startsWith("http")) {
      const abs = path.isAbsolute(p) ? p : path.join(cwd, p);
      if (!fs.existsSync(abs)) {
        issues.push(`artifacts.${key} dangling after archive: ${p}`);
      } else {
        ok.push(`artifacts.${key} exists`);
      }
    }
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
  // 修复幽灵键：design/report 不是 progress.yaml 的 artifacts 键；
  // 改扫 lib ARTIFACT_KEYS 中可为路径的键（adr 为数组，跳过）
  for (const key of ARTIFACT_KEYS.filter((k) => k !== "adr")) {
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

// E13: ARCHIVE「Commit」列（有本主题行时）；不合规则 WARNING，不阻断独立仓
// 0.2.28 / harness 0.7.55：权威路径 archive/ARCHIVE.md；遗留根级仅兼容读
const archiveMd =
  read("docs/superpowers/archive/ARCHIVE.md") ||
  read("docs/superpowers/ARCHIVE.md");
if (archiveMd) {
  const lines = archiveMd.split(/\r?\n/);
  const header = lines.find((l) => /^\|/.test(l) && /commit/i.test(l));
  if (!header) warnings.push("ARCHIVE header missing Commit column");
  const rows = lines.filter((l) => /^\|/.test(l) && l.includes(slug));
  if (rows.length) {
    for (const row of rows) {
      // table: | 日期 | 用户 | 主题 | Spec | Plan | Commit |
      // 保留空单元格，避免 Commit 为空时把 Plan 当成 Commit。
      const raw = row.split("|");
      if (raw.length && raw[0].trim() === "") raw.shift();
      if (raw.length && raw[raw.length - 1].trim() === "") raw.pop();
      const cells = raw.map((c) => c.trim());
      if (cells.length !== 6) {
        warnings.push(
          `ARCHIVE row has ${cells.length} columns (expect 6): ${row.trim()}`
        );
        continue;
      }
      const commitCell = cells[5];
      const check = looksLikeCommitCol(commitCell);
      if (check.ok) {
        ok.push("ARCHIVE Commit column ok");
      } else if (check.empty) {
        warnings.push(`ARCHIVE Commit column empty for slug=${slug}`);
      } else {
        warnings.push(
          `ARCHIVE Commit column not PR/SHA (branch tip?): ${commitCell}`
        );
      }
    }
  } else if (header) {
    issues.push(`ARCHIVE missing row for slug=${slug}`);
  } else {
    ok.push("ARCHIVE present but no slug row (skip Commit check)");
  }
} else {
  ok.push("no ARCHIVE.md (skip Commit check)");
}

// 索引表仍挂进行中行 → warn（L1 可指认，不阻断独立仓）
for (const rel of ["docs/runs/README.md", "docs/superpowers/README.md"]) {
  const text = read(rel);
  if (!text) continue;
  const line = text
    .split(/\r?\n/)
    .find((l) => l.includes(slug) && !l.includes("/archive/"));
  if (line) warnings.push(`${rel} still references slug: ${line.trim()}`);
}
if (
  !exists(`${archiveRel}/门禁清单.md`) &&
  !/门禁清单/.test(read(`${archiveRel}/回链.md`) || "")
) {
  issues.push("门禁清单.md missing and 回链 does not reference it");
}

if (issues.length) {
  if (expectFail) {
    console.log(
      `close-check EXPECT-FAIL OK slug=${slug} (${issues.length} issue(s))`
    );
    for (const i of issues) console.log("  ✗", i);
    for (const w of warnings) console.warn("  !", w);
    for (const o of ok) console.log("  ✓", o);
    process.exit(0);
  }
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
  if (expectFail) {
    console.log(
      `close-check EXPECT-FAIL OK slug=${slug} (gate-evidence exit ${ge.status})`
    );
    process.stdout.write(geOut);
    for (const w of warnings) console.warn("  ! WARNING", w);
    for (const o of ok) console.log("  ✓", o);
    process.exit(0);
  }
  console.error(`close-check FAIL: gate-evidence exit ${ge.status}`);
  process.stdout.write(geOut);
  for (const o of ok) console.log("  ✓", o);
  process.exit(ge.status == null ? 1 : ge.status);
}
ok.push("gate-evidence PASS");
if (expectFail) {
  console.error(
    `close-check EXPECT-FAIL but PASSED slug=${slug} (${ok.length} checks)`
  );
  for (const o of ok) console.log("  ✓", o);
  process.exit(1);
}
console.log(`close-check PASS slug=${slug} (${ok.length} checks)`);
for (const o of ok) console.log("  ✓", o);
for (const w of warnings) console.warn("  ! WARNING", w);
if (ge.stdout) process.stdout.write(ge.stdout);
