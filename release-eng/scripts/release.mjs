#!/usr/bin/env node
/**
 * release-eng 统一入口（0.4+）
 *
 * - prepare：半自动编排到 WritePlan 预览（转发 release-prepare.mjs）
 * - audit / seal / cancel / sync-scripts / migrate-notes
 * - 脚本别名转发
 *
 * Usage:
 *   node scripts/release.mjs --help | modes
 *   node scripts/release.mjs prepare -- --root . --release-date YYYY-MM-DD --release-branch BR --baseline main
 *   node scripts/release.mjs cancel -- --root . --identity release-V261126 --dry-run
 *   node scripts/release.mjs sync-scripts -- --root . --check
 *   node scripts/release.mjs migrate-notes -- --root . --dry-run
 *   node scripts/release.mjs freeze -- --root . --base … --head … --format draft-md
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
    desc: "半自动：首问后 → push-gate → freeze → WritePlan 预览（同身份=刷新）",
    scripts: ["prepare", "push-gate", "freeze", "note-merge", "note-html"],
    runnable: true,
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
    desc: "已上线：seal-check 通过后 进行中目录→archive",
    scripts: ["seal-check", "seal"],
    hint: "确认词后 release.mjs seal -- --apply …",
    runnable: true,
  },
  {
    name: "cancel",
    doc: "modes/prepare.md",
    desc: "取消未 seal 的进行中目录包（删包+清索引）",
    scripts: ["cancel"],
    runnable: true,
  },
];

const DISPATCH = {
  prepare: "release-prepare.mjs",
  cancel: "release-cancel.mjs",
  "sync-scripts": "release-sync-scripts.mjs",
  "migrate-notes": "release-migrate-notes.mjs",
  "push-gate": "release-push-gate.mjs",
  freeze: "release-freeze.mjs",
  enrich: "release-freeze-enrich.mjs",
  "freeze-enrich": "release-freeze-enrich.mjs",
  "ai-track": "release-ai-track.mjs",
  "sql-classify": "release-sql-classify.mjs",
  "sql-bundle": "release-sql-bundle.mjs",
  "sql-stats": "release-sql-stats.mjs",
  "note-merge": "release-note-merge.mjs",
  "note-html": "release-note-html.mjs",
  "seal-check": "release-seal-check.mjs",
  seal: "release-seal.mjs",
  "seal-apply": "release-seal.mjs",
};

function printHelp() {
  console.log(`release-eng CLI 0.4+ — 半自动发版仪式入口（非 harness land）

Usage:
  node scripts/release.mjs --help | help
  node scripts/release.mjs modes
  node scripts/release.mjs prepare -- --root . --release-date YYYY-MM-DD --release-branch BR --baseline main
  node scripts/release.mjs audit|seal|cancel [--help]
  node scripts/release.mjs sync-scripts|migrate-notes -- <args...>
  node scripts/release.mjs <script> -- <args...>

模式:
  prepare   半自动到 WritePlan 预览（同身份目录存在=刷新；原 resume 已并入）
  audit     只读检查（永不写盘）
  seal      已上线归档
  cancel    取消进行中包

辅助:
  sync-scripts   仓内 scripts/release-eng VERSION 对账 / --apply
  migrate-notes  notes/ → docs/releases/<id>/

可转发脚本:
  push-gate | freeze | enrich | ai-track | note-merge | note-html | seal-check | seal | sql-bundle | …

边界：确认词 / 问卷高风险打断仍由 Agent；note-merge / seal --apply / cancel --apply 仅确认词后。
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
    if (alias === "freeze-enrich" || alias === "seal-apply") continue;
    const ok = fs.existsSync(path.join(__dirname, file)) ? "✓" : "✗";
    console.log(`  ${alias}\tscripts/${file} ${ok}`);
  }
  console.log("\n详情：modes/README.md · SKILL.md · QUICKSTART.md");
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
  - 版本身份 = release-V{yyMMdd}（← 发版日期）
  - 确认词才写盘；audit 永不写盘；预览仅会话
  - seal 前先 seal-check；cancel ≠ seal

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

// resume → prepare 指引
if (cmd === "resume") {
  console.error(
    "0.4 已移除对外 resume：同身份目录存在时直接 prepare（刷新）。\n见：node scripts/release.mjs prepare --help"
  );
  process.exit(1);
}

// mode help / runnable
if (["prepare", "audit", "seal", "cancel"].includes(cmd)) {
  const rest = args.slice(1);
  if (cmd === "audit" && rest[0] === "--") {
    dispatch("freeze", rest.slice(1));
  }
  if (cmd === "seal" && rest[0] === "--") {
    dispatch("seal", rest.slice(1));
  }
  if (cmd === "prepare" && rest[0] === "--") {
    dispatch("prepare", rest.slice(1));
  }
  if (cmd === "cancel" && rest[0] === "--") {
    dispatch("cancel", rest.slice(1));
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
    `模式 ${cmd}：需要 \`--\` 转发参数，或 \`--help\`。\n例：node scripts/release.mjs ${cmd} -- --help`
  );
  process.exit(1);
}

// script dispatch
if (DISPATCH[cmd]) {
  let forwarded = args.slice(1);
  if (forwarded[0] === "--") forwarded = forwarded.slice(1);
  if (
    forwarded.length === 0 ||
    forwarded[0] === "--help" ||
    forwarded[0] === "-h"
  ) {
    dispatch(cmd, ["--help"]);
  }
  dispatch(cmd, forwarded);
}

console.error(`Unknown subcommand: ${cmd}`);
console.error(`Run: node scripts/release.mjs --help`);
process.exit(1);
