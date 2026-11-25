#!/usr/bin/env node
/**
 * fill-inventory-client-api — 前端契约消费层 → inventory JSON（0.8.1）
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain client-api --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet] [--no-write]
 *
 * Default --out: docs/client-api/.fill-work/inventory.json
 *
 * 扫描（消费层清单；字段表交 agents 按双态模板精填）：
 *   - 消费层根：api-client / services/api / queries / packages/types 段命中
 *   - 导出方法：export (async)?function X / export const X（函数式）
 *   - Query hooks：use[A-Z] 开头且文件含 useQuery/useMutation
 *   - type modules：types 目录 .ts 导出面
 *
 * 真相双态（见 docs/client-api/templates/）：
 *   - fullstack → 回链 docs/api 模块号（禁展开字段表）
 *   - 纯前端（repo_kind=frontend）→ 字段级消费表（标「提供侧外部，以生成物为准」）
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

const CONSUMER_DIR_RE = /[\\\/](api-client|queries|types)([\\\/]|$)/i;
const SERVICES_API_RE = /[\\\/]services[\\\/]api([\\\/]|$)/i;
const CONSUMER_ROOT_HINT_RE = /[\\\/](packages)[\\\/](api-client|queries|types)([\\\/]|$)/i;
const CODE_RE = /\.(ts|tsx|js|jsx|mts|cts)$/i;
const NOISE_RE = /(\.test\.|\.spec\.|\.d\.ts$|\.stories\.)/i;
const EXPORT_FN_RE = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_CONST_RE = /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|function|[A-Za-z_$][\w$]*\s*=>)/g;
const EXPORT_TYPE_RE = /export\s+(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const QUERY_HINT_RE = /useQuery|useMutation|useInfiniteQuery|useSuspenseQuery/;
/** 消费 hook：直接 useXxx 或工厂 createUseXxx（TanStack query factory 常见形态） */
function hookKind(name, queryish) {
  if (!queryish) return null;
  return /^(use[A-Z]|createUse)/.test(name) ? "query_hook" : null;
}
const MAX_FILES = 1500;

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
  node scripts/fill-inventory.mjs --domain client-api --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet] [--no-write]

扫描（消费层清单；字段真相按双态模板交 agents 精填）:
  - 消费层根：api-client / queries / types / services/api（含 packages/*）
  - 导出方法 / React Query hooks（use* + useQuery|useMutation）/ type 导出面

真相双态: fullstack → 回链 docs/api（禁展开字段表）
         纯前端 → 字段级消费表（标「提供侧外部，以生成物为准」）
Default --out: docs/client-api/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugId(name, fRel) {
  const stem = fRel
    .replace(/\.[^./\\]+$/, "")
    .replace(/[\\\/]/g, "-");
  const base = `${stem}-${name}`
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return base || "client-api";
}

function readUtf8(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
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
      const inConsumer =
        CONSUMER_DIR_RE.test(fRel) ||
        SERVICES_API_RE.test(fRel) ||
        CONSUMER_ROOT_HINT_RE.test(fRel);
      if (inConsumer && CODE_RE.test(name) && !NOISE_RE.test(name)) {
        seen.n++; // 配额只计消费层候选（0.8.1：大仓其他文件不耗配额）
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
    shards.push({ id: `shard-client-api-${n}`, count: slice.length, assets: slice });
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

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-client-api" });
  progress.log("scan");

  const files = walkFiles(root, root, []);
  progress.step(1, 2, `candidate_files=${files.length}`);

  const assets = [];
  const seenIds = new Set();
  const push = (a) => {
    if (seenIds.has(a.id)) return;
    seenIds.add(a.id);
    assets.push(a);
  };

  for (const f of files) {
    const fRel = rel(root, f);
    const text = readUtf8(f);
    if (!text) continue;
    const isTypes = /[\\\/]types([\\\/]|$)/i.test(fRel);
    const queryish = QUERY_HINT_RE.test(text);

    EXPORT_FN_RE.lastIndex = 0;
    for (const m of text.matchAll(EXPORT_FN_RE)) {
      const name = m[1];
      push({
        id: slugId(name, fRel),
        kind: hookKind(name, queryish) || "api_method",
        name,
        path: fRel,
      });
    }
    EXPORT_CONST_RE.lastIndex = 0;
    for (const m of text.matchAll(EXPORT_CONST_RE)) {
      const name = m[1];
      push({
        id: slugId(name, fRel),
        kind: hookKind(name, queryish) || "api_method",
        name,
        path: fRel,
      });
    }
    if (isTypes) {
      EXPORT_TYPE_RE.lastIndex = 0;
      for (const m of text.matchAll(EXPORT_TYPE_RE)) {
        push({
          id: slugId(m[1], fRel),
          kind: "type_export",
          name: m[1],
          path: fRel,
        });
      }
    }
  }
  progress.step(2, 2, `assets=${assets.length}`);

  const report = {
    ok: true,
    domain: "client-api",
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
      message: "No client-api consumer exports discovered (api-client/queries/types/services/api)",
    });
  }

  const shards = shardAssets(assets, args.shardSize);
  report.assets = assets;
  report.shards = shards;
  report.stats = {
    assets: assets.length,
    apiMethods: assets.filter((a) => a.kind === "api_method").length,
    queryHooks: assets.filter((a) => a.kind === "query_hook").length,
    typeExports: assets.filter((a) => a.kind === "type_export").length,
    documentedHint: "docs/client-api/modules/NN-{consumer}.md",
  };
  stampInventoryGitHead(report, root);

  const outPath = resolveInventoryOutPath(root, args.out, "client-api");
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
