#!/usr/bin/env node
/**
 * Public write entry (0.6.0-dev+).
 *
 * Usage:
 *   node scripts/harness.mjs --root <TARGET> --params <params.json>
 *       [--mode land|resume|upgrade|pipeline-skeleton]
 *       [--dry-run] [--manifest <path>] [--backup] [--no-sync]
 *
 * Reads harness-meta (docs/harness-eng/ then .cursor/ fallback).
 * If agent_config true (params or meta or ladder L5):
 *   - refuse explicit files[] targeting generated host paths
 *   - still delegate SSOT render to render.mjs (when_agent_config skips host paths)
 *   - then run target `node scripts/agent-config/sync.mjs` unless --no-sync / --dry-run
 * Else: delegate to render.mjs with the same argv patterns.
 *
 * pipeline-skeleton = skeleton campaign write only (not fill-* / pipeline-fill).
 * land.mjs is a thin alias of this file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { findHarnessMetaFile } from "./lib/harness-meta.mjs";
import { parse as parseYaml } from "./lib/yaml.mjs";
import { resolveAgentConfig } from "./lib/hooks-checks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDER = path.join(__dirname, "render.mjs");

const MODES = ["land", "resume", "upgrade", "pipeline-skeleton"];

const GENERATED_HOST_EXACT = new Set([
  "CLAUDE.md",
  "CODEBUDDY.md",
  ".cursor/hooks.json",
  ".claude/settings.json",
  ".qoder/settings.json",
  ".qoder/hooks.json",
  ".trae/hooks.json",
  ".codebuddy/settings.json",
  ".codex/hooks.json",
]);

const GENERATED_HOST_PREFIXES = [
  ".cursor/rules/",
  ".cursor/hooks/",
  ".claude/rules/",
  ".qoder/rules/",
  ".trae/rules/",
  ".codebuddy/rules/",
];

function parseArgs(argv) {
  const out = {
    dryRun: false,
    root: null,
    params: null,
    manifest: null,
    backup: false,
    mode: "land",
    noSync: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--backup") out.backup = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--params") out.params = argv[++i];
    else if (a === "--manifest") out.manifest = argv[++i];
    else if (a === "--mode") out.mode = String(argv[++i] || "land");
    else if (a === "--no-sync") out.noSync = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/harness.mjs --root <TARGET> --params <params.json>
      [--mode land|resume|upgrade|pipeline-skeleton]
      [--dry-run] [--manifest <path>] [--backup] [--no-sync]

Canonical Agent write entry (0.6.0-dev+). land.mjs is a thin alias.
  non-L5: delegates to render.mjs (same --root/--params/--dry-run/--manifest/--backup)
  L5 / agent_config: refuse render into generated host paths; run
    node scripts/agent-config/sync.mjs
    in the target (unless --no-sync or --dry-run).
  pipeline-skeleton: skeleton campaign write only — 不跑 fill-* / pipeline-fill.
`);
}

function loadParams(paramsPath) {
  return JSON.parse(fs.readFileSync(paramsPath, "utf8"));
}

function loadMeta(root) {
  const found = findHarnessMetaFile(root);
  if (!found) return null;
  try {
    return parseYaml(fs.readFileSync(found.abs, "utf8")) || null;
  } catch {
    return null;
  }
}

/** params 显式 true / L5，或目标仓 meta 已标 agent_config / L5。 */
export function resolveLandAgentConfig(params, meta) {
  if (params && (params.agent_config === true || params.agent_config === "true")) return true;
  if (meta && (meta.agent_config === true || meta.agent_config === "true")) return true;
  if (String((params && params.ladder) || "") === "L5") return true;
  if (meta && String(meta.ladder || "") === "L5") return true;
  if (params && (params.agent_config === false || params.agent_config === "false")) return false;
  return resolveAgentConfig(params || {});
}

export function isGeneratedHostPath(target) {
  const t = String(target || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  if (GENERATED_HOST_EXACT.has(t)) return true;
  if (t === ".cursor/rules" || t === ".claude/rules" || t === ".qoder/rules" || t === ".trae/rules" || t === ".codebuddy/rules") {
    return true;
  }
  return GENERATED_HOST_PREFIXES.some((p) => t.startsWith(p));
}

function refuseGeneratedFiles(params) {
  const files = (params && params.files) || [];
  const hits = [];
  for (const f of files) {
    const t = f && f.target;
    if (isGeneratedHostPath(t)) hits.push(String(t));
  }
  if (hits.length) {
    throw new Error(
      `L5/agent_config: refuse to render generated host path(s): ${hits.join(", ")}. ` +
        `Use node scripts/agent-config/sync.mjs in the target (SSOT: docs/agent-config/).`
    );
  }
}

function runRender(args) {
  const argv = [RENDER, "--root", args.root, "--params", args.params];
  if (args.dryRun) argv.push("--dry-run");
  if (args.backup) argv.push("--backup");
  if (args.manifest) argv.push("--manifest", args.manifest);
  return spawnSync(process.execPath, argv, { encoding: "utf8" });
}

function syncScript(root) {
  return path.join(root, "scripts", "agent-config", "sync.mjs");
}

function runSync(root) {
  const script = syncScript(root);
  if (!fs.existsSync(script)) {
    return {
      status: 0,
      stdout: "",
      stderr: "L5: scripts/agent-config/sync.mjs 尚未落地。先 land SSOT，再在目标仓执行：node scripts/agent-config/sync.mjs\n",
      missing: true,
    };
  }
  return spawnSync(process.execPath, [script], { encoding: "utf8", cwd: root });
}

function forward(r) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === null ? 1 : r.status;
}

function announceMode(mode) {
  if (mode === "pipeline-skeleton") {
    console.error(
      "harness: mode=pipeline-skeleton（仅骨架战役，不跑 fill-* / 不 Read pipeline-fill，除非骨架 Done 且非 fill_deferred）。"
    );
    return;
  }
  console.error(`harness: mode=${mode}。公开入口 scripts/harness.mjs（land.mjs 为薄别名）。`);
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.root || !args.params) {
    printHelp();
    process.exit(1);
  }
  const mode = String(args.mode || "land").toLowerCase();
  if (!MODES.includes(mode)) {
    throw new Error(`Unknown --mode ${args.mode} (use land|resume|upgrade|pipeline-skeleton)`);
  }

  const params = loadParams(args.params);
  const meta = loadMeta(args.root);
  const agentConfig = resolveLandAgentConfig(params, meta);

  announceMode(mode);

  if (!agentConfig) {
    process.exit(forward(runRender(args)));
  }

  refuseGeneratedFiles(params);
  console.error(
    `harness: agent_config=true（mode=${mode}）。生成宿主路径由 sync 发出，render 不得直写 .cursor/rules 等。`
  );

  const rendered = runRender(args);
  const renderStatus = forward(rendered);
  if (renderStatus !== 0) process.exit(renderStatus);

  if (args.dryRun) {
    console.error("harness: --dry-run，跳过 sync。确认后在目标仓执行：node scripts/agent-config/sync.mjs");
    process.exit(0);
  }
  if (args.noSync) {
    console.error("harness: --no-sync。请在目标仓执行：node scripts/agent-config/sync.mjs");
    process.exit(0);
  }

  const synced = runSync(args.root);
  const syncStatus = forward(synced);
  process.exit(syncStatus);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
