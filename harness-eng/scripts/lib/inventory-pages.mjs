#!/usr/bin/env node
/**
 * fill-inventory-pages — 路由/页面 → inventory JSON（0.8.1）
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain pages --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet] [--no-write]
 *
 * Default --out: docs/pages/.fill-work/inventory.json
 *
 * 探测（语言中立，声明优先、目录约定兜底）：
 *   1) 路由声明源文件：含 react-router / vue-router / <Route / createBrowserRouter /
 *      RouterProvider / Routes / RouterModule / routes[:=] 信号 → 抽 path 字面量
 *   2) 目录约定：pages/ · views/ · screens/ · features/<模块>/pages/ → 每文件一页
 *      （Next/Nuxt/SvelteKit 等文件路由同构命中）
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
  "__pycache__",
]);

const ROUTE_SIGNAL_RE =
  /react-router|vue-router|createBrowserRouter|RouterProvider|RouterModule|<Route\b|<Routes\b|\broutes\s*[:=]\s*[\[{]|@angular\/router|definePage|useNavigate\s*\(/;
const ROUTE_PATH_RE = /\bpath\s*[:=]\s*["']([^"']+)["']/g;
const PAGE_CODE_RE = /\.(tsx|jsx|vue|svelte|ts|js)$/i;
const PAGE_DIR_RE = /[\\\/](pages?|views?|screens?)[\\\/]/i;
const FEATURE_PAGES_RE = /[\\\/]features?[\\\/][^\\\/]+[\\\/]pages[\\\/]/i;
const NOISE_PAGE_RE = /(\.test\.|\.spec\.|\.stories\.|\.d\.ts$|^_)/i;
const MAX_FILES = 2500;

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
  node scripts/fill-inventory.mjs --domain pages --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet] [--no-write]

Scans (声明优先、目录约定兜底):
  - 路由声明源（react-router / vue-router / <Route / routes: / RouterModule …）→ 抽 path 字面量
  - 目录约定（pages/ · views/ · screens/ · features/*/pages/）→ 每文件一页

Default --out: docs/pages/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugId(root, p, route) {
  const base = route
    ? String(route).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()
    : rel(root, p)
        .replace(/\.[^./\\]+$/, "")
        .replace(/[\\\/]/g, "-")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
  return base || "page";
}

function walkCodeFiles(root, dir, acc, depth = 0, seen = { n: 0 }) {
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
      walkCodeFiles(root, p, acc, depth + 1, seen);
    } else if (PAGE_CODE_RE.test(name)) {
      seen.n++; // 配额只计代码候选（0.8.1：大仓非代码文件不耗配额）
      acc.push(p);
    }
  }
  return acc;
}

function readUtf8(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function shardAssets(assets, shardSize) {
  const shards = [];
  for (let i = 0; i < assets.length; i += shardSize) {
    const slice = assets.slice(i, i + shardSize);
    const n = String(Math.floor(i / shardSize) + 1).padStart(2, "0");
    shards.push({ id: `shard-pages-${n}`, count: slice.length, assets: slice });
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

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-pages" });
  progress.log("scan");

  const codeFiles = walkCodeFiles(root, root, []);
  progress.step(1, 3, `code_files=${codeFiles.length}`);

  const assets = [];
  const seenRouteIds = new Set();

  // 1) 路由声明源：抽 path 字面量（跨框架）
  let routeSrcFiles = 0;
  let routes = 0;
  for (const f of codeFiles) {
    const text = readUtf8(f);
    if (!text || !ROUTE_SIGNAL_RE.test(text)) continue;
    const fRel = rel(root, f);
    // 目录约定已计的文件不重复抽 route
    routeSrcFiles++;
    ROUTE_PATH_RE.lastIndex = 0;
    for (const m of text.matchAll(ROUTE_PATH_RE)) {
      const route = m[1];
      if (!route || route.includes("*")) continue;
      const id = `route-${slugId(root, f, route)}`;
      if (seenRouteIds.has(id)) continue;
      seenRouteIds.add(id);
      routes++;
      assets.push({
        id,
        kind: "route",
        route,
        path: fRel,
        source: "route-decl",
      });
    }
  }
  progress.step(2, 3, `route_src=${routeSrcFiles} routes=${routes}`);

  // 2) 目录约定：pages/ views/ screens/ features/*/pages/ 每文件一页
  let pageFiles = 0;
  for (const f of codeFiles) {
    const fRel = rel(root, f);
    if (!PAGE_DIR_RE.test(fRel) && !FEATURE_PAGES_RE.test(fRel)) continue;
    if (NOISE_PAGE_RE.test(path.basename(f))) continue;
    if (seenRouteIds.has(`route-${slugId(root, f, null)}`)) continue;
    pageFiles++;
    assets.push({
      id: slugId(root, f, null),
      kind: "page_file",
      path: fRel,
      source: "dir-convention",
    });
  }
  progress.step(3, 3, `page_files=${pageFiles}`);

  const report = {
    ok: true,
    domain: "pages",
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
      message: "No routes / page files discovered (route decls + dir conventions)",
    });
  }

  const shards = shardAssets(assets, args.shardSize);
  report.assets = assets;
  report.shards = shards;
  report.stats = {
    assets: assets.length,
    routeSrcFiles,
    routes,
    pageFiles,
    documentedHint: "docs/pages/modules/NN-{page}.md",
  };
  stampInventoryGitHead(report, root);

  const outPath = resolveInventoryOutPath(root, args.out, "pages");
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
