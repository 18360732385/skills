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
 *
 * 只做：列出 modes/、转发 status-scan。不写 progress、不调子 skill、不跑硬闸。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const modesDir = path.join(skillRoot, "modes");
const statusScan = path.join(__dirname, "status-scan.mjs");

const MODE_HELP = [
  ["init", "首次绑定 11 环"],
  ["rebind", "改环节↔skill 映射"],
  ["start", "新主题开工（分诊 S/B/F）"],
  ["resume", "续跑进行中主题"],
  ["status", "只看进度（可机读扫描）"],
  ["advance", "声称当前环完成 → L1/L2/写盘/调起"],
  ["close", "收口归档 active→archive"],
  ["binding", "绑定 lookup / invoke / 截断"],
  ["stages", "环节表 / 裁剪 / runs 约定"],
  ["artifacts", "L1 产物勾选"],
  ["gates-review", "L2 环间语义审核"],
  ["gates-common", "硬闸短确认卡片"],
  ["domain-bridge", "定稿桥"],
  ["proto-bridge", "Proto 桥"],
  ["handoff", "交接"],
];

function printHelp() {
  console.log(`feature-eng 薄 CLI — 调度员不进厨房

Usage:
  node scripts/feature.mjs --help | help
  node scripts/feature.mjs modes
  node scripts/feature.mjs status [--cwd <dir>]
  node scripts/feature.mjs status-scan [--cwd <dir>]

Subcommands:
  help         本页
  modes        列出 modes/ 规格与一句话用途
  status       转发 scripts/status-scan.mjs（扫描 docs/runs/active）
  status-scan  status 别名

边界：本 CLI 不写 progress.yaml / 回链.md，不调起子 skill，不代答硬闸。
热路径：AGENT-INDEX.md · 模式正文：modes/ · 烟测：node scripts/selfcheck.mjs
`);
}

function listModes() {
  console.log("modes/\t用途\t文件");
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
    console.log(`${extra.replace(/\\.md$/, "")}\t（未编入帮助表）\tmodes/${extra}`);
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

console.error(`Unknown subcommand: ${cmd}`);
console.error(`Run: node scripts/feature.mjs --help`);
process.exit(1);
