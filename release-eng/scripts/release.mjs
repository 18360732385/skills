#!/usr/bin/env node
/**
 * release-eng 统一薄入口（0.3.19-dev）。
 *
 * 只做：模式/子命令帮助 + 转发到既有 scripts/*。
 * 不写盘、不代答确认词、不跑完整 prepare 仪式（Agent 仍按模式 md 调度）。
 *
 * Usage:
 *   node scripts/release.mjs --help | help
 *   node scripts/release.mjs modes
 *   node scripts/release.mjs prepare|resume|audit|seal [--help]
 *   node scripts/release.mjs push-gate|freeze|enrich|ai-track|note-merge|seal-check|format -- <args...>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");

const MODES = [
  {
    name: "prepare",
    doc: "modes/prepare.md",
    desc: "新建发版单：首问 → push-gate → freeze → 问卷 → WritePlan",
    scripts: ["push-gate", "freeze", "note-merge"],
  },
  {
    name: "resume",
    doc: "modes/resume.md",
    desc: "同版本身份续跑（刷新 draft / 补问卷 / 再定版）",
    scripts: ["freeze", "note-merge"],
  },
  {
    name: "audit",
    doc: "modes/audit.md",
    desc: "只读体检 prior·freeze（不写盘）",
    scripts: ["freeze"],
    hint: "典型：freeze --format audit-json",
  },
  {
    name: "seal",
    doc: "modes/seal.md",
    desc: "已上线：seal-check 通过后 notes→archive",
    scripts: ["seal-check"],
  },
];

const DISPATCH = {
  "push-gate": "release-push-gate.mjs",
  freeze: "release-freeze.mjs",
  enrich: "release-freeze-enrich.mjs",
  "freeze-enrich": "release-freeze-enrich.mjs",
  "ai-track": "release-ai-track.mjs",
  "note-merge": "release-note-merge.mjs",
  "seal-check": "release-seal-check.mjs",
  format: "release-format.mjs",
};

function printHelp() {
  console.log(`release-eng 薄 CLI — 统一入口（非 harness land）

Usage:
  node scripts/release.mjs --help | help
  node scripts/release.mjs modes
  node scripts/release.mjs prepare|resume|audit|seal [--help]
  node scripts/release.mjs <script> -- <args...>

模式（仪式规格，Agent Read 对应 md；本 CLI 只打印指引）:
  prepare   新建发版单
  resume    同版本身份续跑
  audit     只读检查（永不写盘）
  seal      已上线上归档

可转发脚本子命令:
  push-gate | freeze | enrich | ai-track | note-merge | seal-check | format

示例:
  node scripts/release.mjs modes
  node scripts/release.mjs audit --help
  node scripts/release.mjs freeze -- --root . --base main --head HEAD --format audit-json
  node scripts/release.mjs seal-check -- --root . --note docs/releases/notes/<slug>/<slug>.md

边界：确认词 / WritePlan / 问卷仍由 Agent 按模式 md 执行；本入口不代写盘。
热路径：AGENT-INDEX.md · 烟测：node scripts/selfcheck.mjs
`);
}

function listModes() {
  console.log("mode\t用途\t规格\t相关脚本");
  for (const m of MODES) {
    const docOk = fs.existsSync(path.join(skillRoot, m.doc)) ? "✓" : "✗";
    console.log(
      `${m.name}\t${m.desc}\t${m.doc} ${docOk}\t${m.scripts.join(",")}${
        m.hint ? `（${m.hint}）` : ""
      }`
    );
  }
  console.log("\n脚本别名 → 文件");
  for (const [alias, file] of Object.entries(DISPATCH)) {
    if (alias === "freeze-enrich") continue;
    const ok = fs.existsSync(path.join(__dirname, file)) ? "✓" : "✗";
    console.log(`  ${alias}\tscripts/${file} ${ok}`);
  }
  console.log("\n详情：modes/README.md · SKILL.md 模式分流 · QUICKSTART.md");
}

function printModeHelp(modeName) {
  const m = MODES.find((x) => x.name === modeName);
  if (!m) return false;
  console.log(`模式 ${m.name} — ${m.desc}

规格：Read ${m.doc}
相关脚本：${m.scripts.map((s) => `release.mjs ${s}`).join(" · ")}
${m.hint ? `提示：${m.hint}\n` : ""}
硬闸提醒：
  - 首问齐（发版日期 + 分支 + 基线/首次发版）后才 push-gate
  - 确认词才写盘；audit 永不写盘
  - seal 前先 seal-check

转发示例：
${m.scripts
  .map((s) => `  node scripts/release.mjs ${s} -- --help`)
  .join("\n")}
`);
  return true;
}

function dispatch(alias, forwarded) {
  const file = DISPATCH[alias];
  if (!file) return false;
  const bin = path.join(__dirname, file);
  if (!fs.existsSync(bin)) {
    console.error(`Missing script: scripts/${file}`);
    process.exit(1);
  }
  // format.mjs is a library — show a short tip instead of executing
  if (alias === "format") {
    console.log(
      `release-format.mjs 为库模块（供 freeze/note-merge import），无独立 CLI。\n导出见 scripts/release-format.mjs；自检：node scripts/selfcheck.mjs`
    );
    process.exit(0);
  }
  const r = spawnSync(process.execPath, [bin, ...forwarded], {
    cwd: process.cwd(),
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

// mode help / guide
if (["prepare", "resume", "audit", "seal"].includes(cmd)) {
  const rest = args.slice(1);
  // allow `audit -- --format ...` to mean freeze with those args for convenience
  if (cmd === "audit" && rest[0] === "--") {
    dispatch("freeze", rest.slice(1));
  }
  if (cmd === "seal" && rest[0] === "--") {
    dispatch("seal-check", rest.slice(1));
  }
  if (
    rest.length === 0 ||
    rest[0] === "--help" ||
    rest[0] === "-h" ||
    rest[0] === "help"
  ) {
    printModeHelp(cmd);
    process.exit(0);
  }
  console.error(
    `模式 ${cmd} 无直接子参数（仪式由 Agent 按 modes/${cmd}.md 执行）。\n查看指引：node scripts/release.mjs ${cmd} --help\n或转发脚本：node scripts/release.mjs <script> -- <args...>`
  );
  process.exit(1);
}

// script dispatch: `freeze -- --root ...` or `freeze --root ...`
if (DISPATCH[cmd]) {
  let forwarded = args.slice(1);
  if (forwarded[0] === "--") forwarded = forwarded.slice(1);
  if (
    forwarded.length === 0 ||
    forwarded[0] === "--help" ||
    forwarded[0] === "-h"
  ) {
    // prefer underlying --help when available
    dispatch(cmd, ["--help"]);
  }
  dispatch(cmd, forwarded);
}

console.error(`Unknown subcommand: ${cmd}`);
console.error(`Run: node scripts/release.mjs --help`);
process.exit(1);
