#!/usr/bin/env node
/**
 * fill-inventory-components — 组件盘点 → inventory JSON（0.8.1）
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain components --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet] [--no-write]
 *
 * Default --out: docs/components/.fill-work/inventory.json
 *
 * 盘点（只列不抽 props——TS/Vue/Svelte 类型解析太脆，交 agents 精填）：
 *   - 组件根目录：components|ui|widgets|shared 段命中（排除 node_modules/dist）
 *   - 组件文件：.tsx/.jsx/.vue/.svelte；跳 index.* / *.test.* / *.stories.* / *.d.ts
 *   - 每组件一条 asset（name + path + 归属包/目录）
 *
 * Exit: 0 ok · 2 warnings · 1 error
 */
import fs from "fs";
import path from "path";
import { isCliMain } from "./cli-main.mjs";
import { resolveInventoryOutPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";
import { createProgress } from "./progress-log.mjs";
import { stampInventoryGitHead } from "./git-head.mjs";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "target",
  ".fill-work",
  "coverage",
  ".next",
  ".nuxt",
  "__tests__",
  "__pycache__",
]);

const COMPONENT_DIR_RE = /[\\\/](components?|ui|widgets?|shared)[\\\/]/i;
const COMPONENT_FILE_RE = /\.(tsx|jsx|vue|svelte)$/i;
const NOISE_COMP_RE = /(\.test\.|\.spec\.|\.stories\.|\.d\.ts$)/i;
const MAX_FILES = 1200;

function parseArgs(argv) {
  const out = { root: null, shardSize: 20, out: null, quiet: false, help: false, noWrite: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--shard-size") out.shardSize = Number(argv[++i]) || 20;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--quiet") out.quiet = true;
    else if (a === "--no-write") out.noWrite = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory.mjs --domain components --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet] [--no-write]

盘点（只列不抽 props；props/变体表交 fill-truths agents 按模板精填）:
  - 组件根目录段 components|ui|widgets|shared
  - 组件文件 .tsx/.jsx/.vue/.svelte（跳 index/test/stories）

Default --out: docs/components/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugId(root, p) {
  return (
    rel(root, p)
      .replace(/\.[^./\\]+$/, "")
      .replace(/[\\\/]/g, "-")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "component"
  );
}

/** 归属包：路径首个目录段（如 packages/ui/… → packages/ui）。 */
function pkgOf(fRel) {
  const seg = fRel.split("/");
  return seg.length > 2 ? seg.slice(0, 2).join("/") : seg[0];
}

function walkFiles(root, dir, acc, depth = 0, seen = { n: 0 }) {
  if (depth > 8 || seen.n > MAX_FILES) return acc;
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkFiles(root, p, acc, depth + 1, seen);
    } else {
      const fRel = rel(root, p);
      if (COMPONENT_DIR_RE.test(fRel) && COMPONENT_FILE_RE.test(name)) {
        seen.n++; // 配额只计组件候选（0.8.1：大仓其他文件不耗配额）
        acc.push(p);
      }
    }
  }
  return acc;
}

function shardAssets(assets, shardSize) {
  const shards = [];
  for (let i = 0; i < assets.length; i += shardSize) {
    const slice = assets.slice(i, i + shardSize);
    const n = String(Math.floor(i / shardSize) + 1).padStart(2, "0");
    shards.push({ id: `shard-components-${n}`, count: slice.length, assets: slice });
  }
  return shards;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.root) throw new Error("Required: --root <TARGET>");
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) throw new Error(`root missing: ${root}`);

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-components" });
  progress.log("scan");

  const files = walkFiles(root, root, []);
  progress.step(1, 2, `candidate_files=${files.length}`);

  const assets = [];
  for (const f of files) {
    const name = path.basename(f);
    if (NOISE_COMP_RE.test(name)) continue;
    if (/^index\./i.test(name)) continue;
    const fRel = rel(root, f);
    assets.push({
      id: slugId(root, f),
      kind: "component",
      name: name.replace(/\.[^.]+$/, ""),
      path: fRel,
      pkg: pkgOf(fRel),
      note: "盘点项；props/变体由 agents 按 docs/components/templates/ 精填，勿脚本虚构",
    });
  }
  progress.step(2, 2, `components=${assets.length}`);

  const report = {
    ok: true,
    domain: "components",
    root,
    generatedAt: new Date().toISOString(),
    assets: [],
    shards: [],
    stats: {},
    warnings: [],
  };

  if (!assets.length) {
    pushWarning(report, {
      code: "empty",
      message: "No component files discovered (components|ui|widgets|shared dirs)",
    });
  }

  const shards = shardAssets(assets, args.shardSize);
  report.assets = assets;
  report.shards = shards;
  report.stats = {
    assets: assets.length,
    documentedHint: "docs/components/modules/NN-{component}.md",
  };
  stampInventoryGitHead(report, root);

  const outPath = resolveInventoryOutPath(root, args.out, "components");
  if (!args.noWrite) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
    progress.log(`wrote ${outPath} assets=${assets.length}`);
  } else {
    progress.log(`--no-write assets=${assets.length} (stdout only)`);
  }
  console.log(
    JSON.stringify({ ...report, out: path.relative(root, outPath).replace(/\\/g, "/") }, null, 2)
  );
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
