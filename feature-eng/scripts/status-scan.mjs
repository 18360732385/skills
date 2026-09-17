#!/usr/bin/env node
/**
 * feature-eng status-scan：列出 docs/runs/active/<slug>/progress.yaml 的 slug / stage / path。
 * 在仓库根或任意子目录运行均可（向上查找含 docs/runs 的根）。
 * 无 active 主题时友好退出 0。
 */
import fs from "fs";
import path from "path";

function findRunsRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, "docs", "runs");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function readField(text, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const m = text.match(re);
  if (!m) return null;
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

const runsRoot = findRunsRoot(process.cwd());
if (!runsRoot) {
  console.log("（未找到 docs/runs/ — 本仓尚无过程态目录，或请在仓库根附近运行）");
  process.exit(0);
}

const activeDir = path.join(runsRoot, "active");
if (!fs.existsSync(activeDir)) {
  console.log(`（无进行中主题：${path.relative(process.cwd(), activeDir) || "docs/runs/active"} 不存在）`);
  process.exit(0);
}

const entries = fs
  .readdirSync(activeDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (entries.length === 0) {
  console.log("（docs/runs/active/ 为空 — 无进行中主题）");
  process.exit(0);
}

const rows = [];
for (const slugDir of entries) {
  const progressPath = path.join(activeDir, slugDir, "progress.yaml");
  const rel = path.relative(process.cwd(), progressPath) || progressPath;
  if (!fs.existsSync(progressPath)) {
    rows.push({
      slug: slugDir,
      stage: "—",
      path: "—",
      note: `缺 progress.yaml（${rel}）`,
    });
    continue;
  }
  const text = fs.readFileSync(progressPath, "utf8");
  rows.push({
    slug: readField(text, "slug") || slugDir,
    stage: readField(text, "stage") || "—",
    path: readField(text, "path") || "—",
    note: rel,
  });
}

console.log("slug\tstage\tpath\tprogress");
for (const r of rows) {
  console.log(`${r.slug}\t${r.stage}\t${r.path}\t${r.note}`);
}
console.log(`\n共 ${rows.length} 个 active 主题`);
