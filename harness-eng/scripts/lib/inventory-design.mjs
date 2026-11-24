#!/usr/bin/env node
/**
 * fill-inventory-design — 前端设计资产 → inventory JSON（0.8.0）
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain design --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet] [--no-write]
 *
 * Default --out: docs/design/.fill-work/inventory.json
 *
 * Scans (language-agnostic; 不绑定 React/pnpm/antd):
 *   - token/theme/style 源文件（tokens.* / theme.* / styles 目录 / tailwind·unocss config）
 *   - 设计文档（DESIGN*.md 等；非运行文件 → archive_hint 建议归档 docs/design/）
 *   - UI 库依赖（package.json deps：antd / @mui / @radix-ui / element-plus / vant / chakra …）
 *   - 外部设计平台链接（figma / lanhu / mastergo / modao …；只索引 URL）
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
]);

const TOKEN_FILE_RE =
  /(^|[\\/])(tokens?|theme|colors?|palette)([.\-_ ][^\\/]*)?\.(css|scss|sass|less|styl|json|ya?ml)$/i;
const TOKEN_DIR_RE = /[\\\/](theme|tokens|styles)[\\\/]/i;
const STYLE_EXT_RE = /\.(css|scss|sass|less|styl)$/i;
const NOISE_FILE_RE = /(package\.json|readme\.md|index\.(ts|js))$/i;
const THEME_CONFIG_RE = /^(tailwind|unocss|windi)\.config\.[a-z]+$/i;
const DESIGN_DOC_RE = /(^|[\\/])(DESIGN|design[-_ ]?system|style[-_ ]?guide)[\-_a-z0-9]*\.md$/i;
const UI_LIB_DEP_RE =
  /^(antd|@ant-design\/.*|@mui\/.*|@radix-ui\/.*|element-plus|element-ui|vant|@chakra-ui\/.*|@headlessui\/.*|naive-ui|arco|taroify|@shopify\/polaris)/;
const EXT_LINK_RE =
  /https?:\/\/[^\s"'<>]*(figma\.com|lanhuapp\.com|mastergo\.com|modao\.cc|xiaopiu\.com|axure\.cloud|zeplin\.io|sketch\.com)/gi;
const DOC_SCAN_RE = /^(README|AGENTS|[A-Z][\w\-]*\.md|readme\.md)$/i;

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
  node scripts/fill-inventory.mjs --domain design --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet] [--no-write]

Scans:
  - tokens.* / theme 源文件 / styles 目录 / tailwind·unocss config（运行代码，留原地）
  - DESIGN*.md 设计文档（非运行 → archive_hint 归档 docs/design/，经确认）
  - package.json UI 库依赖（禁库盘点）
  - 外部设计平台链接（只索引 URL，不写盘）

Default --out: docs/design/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugId(root, p, kind) {
  const base = rel(root, p).replace(/\.[^./]+$/, "");
  const slug = base
    .replace(/[\\\/]/g, "-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return slug || kind;
}

/** Depth-capped walk; pred(fileRel, base) → truthy 收录。配额只计命中候选（0.8.1：大仓 Java 区不耗配额）。 */
function walkFiles(root, dir, acc, pred, depth = 0, filesSeen = { n: 0 }) {
  if (depth > 8) return acc;
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
      walkFiles(root, p, acc, pred, depth + 1, filesSeen);
      continue;
    }
    const item = pred(rel(root, p), name);
    if (item) {
      filesSeen.n++;
      acc.push(item);
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

function collectExternalLinks(root) {
  const links = [];
  const seen = new Set();
  const docsRoot = path.join(root, "docs");
  const targets = [];
  if (fs.existsSync(docsRoot)) {
    for (const name of fs.readdirSync(docsRoot)) {
      const p = path.join(docsRoot, name);
      if (SKIP_DIRS.has(name)) continue;
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) targets.push(p);
      else if (/\.md$/i.test(name)) targets.push(p);
    }
  }
  for (const base of [path.join(root, "README.md"), path.join(root, "AGENTS.md"), ...targets]) {
    const text = readUtf8(base);
    if (!text) continue;
    for (const m of text.matchAll(EXT_LINK_RE)) {
      const url = m[0];
      if (seen.has(url)) continue;
      seen.add(url);
      links.push({
        url,
        from: rel(root, base) || path.basename(base),
      });
    }
  }
  return links;
}

function collectUiLibDeps(root) {
  const out = [];
  const pkgPaths = [];
  const rootPkg = path.join(root, "package.json");
  if (fs.existsSync(rootPkg)) pkgPaths.push(rootPkg);
  try {
    for (const name of fs.readdirSync(root)) {
      if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
      const p = path.join(root, name, "package.json");
      if (fs.existsSync(p)) pkgPaths.push(p);
    }
  } catch {
    /* ignore */
  }
  for (const pkgPath of pkgPaths) {
    let pkg = null;
    try {
      pkg = JSON.parse(readUtf8(pkgPath));
    } catch {
      continue;
    }
    if (pkg.workspaces) continue; // workspace 根由子包判定
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const dep of Object.keys(deps)) {
      if (!UI_LIB_DEP_RE.test(dep)) continue;
      out.push({ dep, from: rel(root, pkgPath) || "package.json" });
    }
  }
  return out;
}

function shardAssets(assets, shardSize) {
  const shards = [];
  for (let i = 0; i < assets.length; i += shardSize) {
    const slice = assets.slice(i, i + shardSize);
    const n = String(Math.floor(i / shardSize) + 1).padStart(2, "0");
    shards.push({ id: `shard-design-${n}`, count: slice.length, assets: slice });
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

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-design" });
  progress.log("scan");

  const assets = [];

  // 1) 运行 token/theme 源文件（留原地）
  const tokenFiles = walkFiles(root, root, [], (fileRel, name) => {
    if (DESIGN_DOC_RE.test(fileRel)) return null; // 设计文档归 2) 类
    if (NOISE_FILE_RE.test(name)) return null;
    if (THEME_CONFIG_RE.test(name)) return { fileRel, name };
    if (TOKEN_DIR_RE.test(fileRel) && STYLE_EXT_RE.test(name)) return { fileRel, name };
    if (TOKEN_FILE_RE.test(fileRel)) return { fileRel, name };
    return null;
  });
  for (const f of tokenFiles) {
    assets.push({
      id: slugId(root, path.join(root, f.fileRel), "tokens"),
      kind: "tokens",
      runtime: true,
      path: f.fileRel,
      note: "运行代码，留原地；真相只索引 + 回链",
    });
  }
  progress.step(1, 4, `tokens=${tokenFiles.length}`);

  // 2) 设计文档（非运行 → 归档提示）
  const designDocs = walkFiles(root, root, [], (fileRel, name) =>
    DESIGN_DOC_RE.test(fileRel) && /\.md$/i.test(name) ? { fileRel } : null
  );
  for (const d of designDocs) {
    assets.push({
      id: slugId(root, path.join(root, d.fileRel), "design_doc"),
      kind: "design_doc",
      runtime: false,
      path: d.fileRel,
      archive_hint: "非运行文件：经确认归档 docs/design/（upgrade 提示 rename/move，不擅删）",
    });
  }
  progress.step(2, 4, `design_docs=${designDocs.length}`);

  // 3) UI 库依赖（禁库盘点）
  const uiLibs = collectUiLibDeps(root);
  for (const u of uiLibs) {
    assets.push({
      id: `ui-lib-${u.dep.replace(/[^a-zA-Z0-9_-]+/g, "-")}`,
      kind: "ui_lib_dep",
      path: u.from,
      note: `依赖 ${u.dep}；是否禁库由 design 真相裁决（rule 102）`,
    });
  }
  progress.step(3, 4, `ui_libs=${uiLibs.length}`);

  // 4) 外部设计平台链接
  const links = collectExternalLinks(root);
  for (const l of links) {
    assets.push({
      id: `link-${l.url.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60)}`,
      kind: "external_link",
      url: l.url,
      path: l.from,
      note: "只索引链接，不写盘外部资产",
    });
  }
  progress.step(4, 4, `links=${links.length}`);

  const report = {
    ok: true,
    domain: "design",
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
      message: "No design assets discovered (tokens / design docs / ui libs / links)",
    });
  }
  if (!tokenFiles.length) {
    pushWarning(report, {
      code: "no-tokens",
      message: "No token/theme source files found; design 真相需手工补主设计源",
    });
  }

  const shards = shardAssets(assets, args.shardSize);
  report.assets = assets;
  report.shards = shards;
  report.stats = {
    assets: assets.length,
    tokens: tokenFiles.length,
    designDocs: designDocs.length,
    uiLibs: uiLibs.length,
    links: links.length,
    documentedHint: "docs/design/modules/NN-{asset}.md",
  };
  stampInventoryGitHead(report, root);

  const outPath = resolveInventoryOutPath(root, args.out, "design");
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
