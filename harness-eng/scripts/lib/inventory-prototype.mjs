#!/usr/bin/env node
/**
 * fill-inventory-prototype — 原型资产 → inventory JSON（0.8.0）
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain prototype --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet] [--no-write]
 *
 * Default --out: docs/prototype/.fill-work/inventory.json
 *
 * 多根扫描（0.8.0 归一 SSOT = docs/prototype/）：
 *   - 原型目录：ui-prototypes/ prototypes/ prototype/ mockups/ wireframes/
 *     （前端包内 + 仓根 docs/** 皆扫；命中旧路径 → archive_hint 归档提示）
 *   - 目录内静态资产：*.html / 图片 / *.pdf / *.md（非运行时）
 *   - 外部原型平台链接（figma / 蓝湖 / mastergo / modao …；只索引 URL）
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

const PROTO_DIR_RE = /^(ui-prototypes?|prototypes?|prototype|mockups?|wireframes?)$/i;
const ASSET_FILE_RE = /\.(html?|png|jpe?g|gif|svg|webp|pdf|md)$/i;
const EXT_LINK_RE =
  /https?:\/\/[^\s"'<>]*(figma\.com|lanhuapp\.com|mastergo\.com|modao\.cc|xiaopiu\.com|axure\.cloud)/gi;
const MAX_FILES_PER_DIR = 400;

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
  node scripts/fill-inventory.mjs --domain prototype --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet] [--no-write]

Scans (multi-root: 前端包内 + 仓根 docs/**；SSOT 归一 docs/prototype/):
  - 原型目录（ui-prototypes / prototypes / prototype / mockups / wireframes）
  - 目录内静态资产（*.html / 图片 / *.pdf；非运行时）
  - 外部原型平台链接（只索引 URL，不写盘）

Default --out: docs/prototype/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugId(root, p) {
  const base = rel(root, p).replace(/\.[^./\\]+$/, "");
  return (
    base
      .replace(/[\\\/]/g, "-")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "prototype"
  );
}

/** 找原型目录：从 root 与一层/仓内 docs 递归下探 ≤4 层。 */
function findProtoDirs(root) {
  const hits = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length) {
    const { dir, depth } = stack.pop();
    if (depth > 4) continue;
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
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
      if (!st.isDirectory()) continue;
      if (PROTO_DIR_RE.test(name)) {
        hits.push(p);
        continue; // 目录整体收录；不再下探找嵌套原型目录
      }
      if (depth < 4) stack.push({ dir: p, depth: depth + 1 });
    }
  }
  return hits;
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
  const candidates = [
    path.join(root, "README.md"),
    path.join(root, "AGENTS.md"),
    path.join(root, "docs"),
  ];
  const files = [];
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    let st;
    try {
      st = fs.statSync(c);
    } catch {
      continue;
    }
    if (st.isFile()) files.push(c);
    else if (st.isDirectory()) {
      const docsRoot = c;
      const stack = [{ dir: docsRoot, depth: 0 }];
      while (stack.length) {
        const { dir, depth } = stack.pop();
        if (depth > 2) continue;
        let names = [];
        try {
          names = fs.readdirSync(dir);
        } catch {
          continue;
        }
        for (const name of names) {
          if (SKIP_DIRS.has(name)) continue;
          const p = path.join(dir, name);
          let s2;
          try {
            s2 = fs.statSync(p);
          } catch {
            continue;
          }
          if (s2.isDirectory()) stack.push({ dir: p, depth: depth + 1 });
          else if (/\.md$/i.test(name)) files.push(p);
        }
      }
    }
  }
  for (const f of files) {
    const text = readUtf8(f);
    if (!text) continue;
    for (const m of text.matchAll(EXT_LINK_RE)) {
      const url = m[0];
      if (seen.has(url)) continue;
      seen.add(url);
      links.push({ url, from: rel(root, f) || path.basename(f) });
    }
  }
  return links;
}

function shardAssets(assets, shardSize) {
  const shards = [];
  for (let i = 0; i < assets.length; i += shardSize) {
    const slice = assets.slice(i, i + shardSize);
    const n = String(Math.floor(i / shardSize) + 1).padStart(2, "0");
    shards.push({ id: `shard-prototype-${n}`, count: slice.length, assets: slice });
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

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-prototype" });
  progress.log("scan");

  const assets = [];
  const protoDirs = findProtoDirs(root);
  progress.step(1, 3, `proto_dirs=${protoDirs.length}`);

  let fileCount = 0;
  const collectDirFiles = (dir, depth, dirRel, isSsotDir) => {
    if (depth > 3) return;
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (fileCount >= MAX_FILES_PER_DIR) return;
      if (SKIP_DIRS.has(name)) continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        collectDirFiles(p, depth + 1, dirRel, isSsotDir);
        continue;
      }
      if (!ASSET_FILE_RE.test(name)) continue;
      if (name.startsWith("_") && /\.(js|css)$/i.test(name)) continue; // 原型配套脚本/样式不入资产表
      const fileRel = rel(root, p).replace(/\\/g, "/");
      // 0.8.5: SSOT docs/prototype 下的 md 是真相/索引/模板，不是原型资产（防分母污染）
      if (isSsotDir && /\.md$/i.test(name)) continue;
      // 非 SSOT：仍可收 md 说明页，但排除 README 与 templates/
      if (!isSsotDir && /\.md$/i.test(name)) {
        if (/^README/i.test(name)) continue;
        if (/\/templates\//i.test(fileRel)) continue;
      }
      fileCount++;
      assets.push({
        id: slugId(root, p),
        kind: "prototype_file",
        runtime: false,
        dir: dirRel,
        path: fileRel,
        archive_hint: isSsotDir
          ? "已在 docs/prototype/ SSOT 树内"
          : `非 SSOT 路径：经确认归档 docs/prototype/（upgrade 提示 rename/move，不擅删）`,
      });
    }
  };
  for (const dir of protoDirs) {
    const dirRel = rel(root, dir);
    const isSsotDir = dirRel.replace(/\\/g, "/").startsWith("docs/prototype");
    collectDirFiles(dir, 0, dirRel, isSsotDir);
  }
  progress.step(2, 3, `files=${assets.length}`);

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
  progress.step(3, 3, `links=${links.length}`);

  const report = {
    ok: true,
    domain: "prototype",
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
      message: "No prototype assets discovered (proto dirs / files / links)",
    });
  }

  const shards = shardAssets(assets, args.shardSize);
  report.assets = assets;
  report.shards = shards;
  report.stats = {
    assets: assets.length,
    protoDirs: protoDirs.length,
    files: fileCount,
    links: links.length,
    documentedHint: "docs/prototype/modules/NN-{page}.md",
  };
  stampInventoryGitHead(report, root);

  const outPath = resolveInventoryOutPath(root, args.out, "prototype");
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
