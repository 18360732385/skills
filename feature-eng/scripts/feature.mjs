#!/usr/bin/env node
/**
 * feature-eng 薄 CLI（调度员入口，不进厨房）。
 *
 * Usage:
 *   node scripts/feature.mjs --help
 *   node scripts/feature.mjs help
 *   node scripts/feature.mjs modes
 *   node scripts/feature.mjs status [--cwd <dir>]
 *   node scripts/feature.mjs status-scan   # alias of status
 *   node scripts/feature.mjs gate-evidence --cwd <dir> --slug <slug> [--expect-fail]
 *   node scripts/feature.mjs close-check --cwd <dir> --slug <slug>
 *
 * 只做：列出 modes/、转发 status-scan / gate-evidence / close-check。不写 progress、不调子 skill、不跑硬闸。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const modesDir = path.join(skillRoot, "modes");
const statusScan = path.join(__dirname, "status-scan.mjs");
const gateEvidence = path.join(__dirname, "gate-evidence.mjs");
const closeCheck = path.join(__dirname, "close-check.mjs");

const MODE_HELP = [
  ["init", "首次绑定 11 环"],
  ["rebind", "改环节↔skill 映射"],
  ["start", "新主题开工（分诊 S/B/F）"],
  ["resume", "续跑进行中主题"],
  ["status", "只看进度（可机读扫描）"],
  ["advance", "声称当前环完成 → L1/L2/写盘/调起"],
  ["close", "收口归档 active→archive"],
];

const SPEC_HELP = [
  ["flow", "环节表 + 绑定 lookup / invoke / 截断"],
  ["gates", "L1 产物 + L2 审核 + 硬闸"],
  ["bridges", "定稿桥 + Proto 桥"],
  ["handoff", "交接"],
];

function printHelp() {
  console.log(`feature-eng 薄 CLI — 调度员不进厨房

Usage:
  node scripts/feature.mjs --help | help
  node scripts/feature.mjs modes
  node scripts/feature.mjs status [--cwd <dir>]
  node scripts/feature.mjs status-scan [--cwd <dir>]
  node scripts/feature.mjs gate-evidence --cwd <dir> --slug <slug> [--expect-fail]
  node scripts/feature.mjs close-check --cwd <dir> --slug <slug>

Subcommands:
  help           本页
  modes          列出 modes/ 入口与 modes/specs/ 手册
  status         转发 scripts/status-scan.mjs（扫描 docs/runs/active）
  status-scan    status 别名
  gate-evidence  转发 scripts/gate-evidence.mjs（闸门证据）
  close-check    转发 scripts/close-check.mjs（含 gate-evidence）

边界：本 CLI 不写 progress.yaml / 回链.md，不调起子 skill，不代答硬闸。
热路径：AGENT-INDEX.md · 模式正文：modes/ · 烟测：node scripts/selfcheck.mjs
`);
}

function listModes() {
  console.log("入口\t用途\t文件");
  const onDisk = new Set(
    fs.existsSync(modesDir)
      ? fs
          .readdirSync(modesDir)
          .filter((f) => f.endsWith(".md") && f !== "README.md")
      : []
  );
  for (const [name, desc] of MODE_HELP) {
    const file = `${name}.md`;
    const mark = onDisk.has(file) ? "✓" : "✗";
    console.log(`${name}\t${desc}\tmodes/${file} ${mark}`);
    onDisk.delete(file);
  }
  for (const extra of [...onDisk].sort()) {
    console.log(`${extra.replace(/\.md$/, "")}\t（未编入帮助表）\tmodes/${extra}`);
  }

  const specsDir = path.join(modesDir, "specs");
  console.log("\nspecs/\t用途\t文件");
  const specDisk = new Set(
    fs.existsSync(specsDir)
      ? fs.readdirSync(specsDir).filter((f) => f.endsWith(".md"))
      : []
  );
  for (const [name, desc] of SPEC_HELP) {
    const file = `${name}.md`;
    const mark = specDisk.has(file) ? "✓" : "✗";
    console.log(`${name}\t${desc}\tmodes/specs/${file} ${mark}`);
    specDisk.delete(file);
  }
  for (const extra of [...specDisk].sort()) {
    console.log(
      `${extra.replace(/\.md$/, "")}\t（未编入帮助表）\tmodes/specs/${extra}`
    );
  }
  console.log(
    `\n详情：modes/README.md · 边界：SKILL.md「调度员不进厨房」`
  );
}

function runStatus(argv) {
  let cwd = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd") {
      cwd = path.resolve(argv[++i] || cwd);
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: node scripts/feature.mjs status [--cwd <dir>]`);
      process.exit(0);
    }
  }
  const r = spawnSync(process.execPath, [statusScan], {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });
  process.exit(r.status == null ? 1 : r.status);
}

function forwardScript(scriptPath, argv) {
  const r = spawnSync(process.execPath, [scriptPath, ...argv], {
    encoding: "utf8",
    stdio: "inherit",
  });
  process.exit(r.status == null ? 1 : r.status);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
  printHelp();
  process.exit(0);
}

if (cmd === "modes" || cmd === "list-modes") {
  listModes();
  process.exit(0);
}

if (cmd === "status" || cmd === "status-scan") {
  runStatus(args.slice(1));
}

if (cmd === "gate-evidence") {
  forwardScript(gateEvidence, args.slice(1));
}

if (cmd === "close-check") {
  forwardScript(closeCheck, args.slice(1));
}

console.error(`Unknown subcommand: ${cmd}`);
console.error(`Run: node scripts/feature.mjs --help`);
process.exit(1);
