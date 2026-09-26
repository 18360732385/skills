#!/usr/bin/env node
/**
 * content-shell-scan — audit 旁路：分册 AGENTS 空壳 + Never do↔Pn（不写盘）。
 *
 * Usage:
 *   node scripts/content-shell-scan.mjs --root <TARGET> [--json] [--help]
 */
import path from "path";
import {
  scanContentShell,
  formatContentShellSummary,
} from "./lib/content-shell-scan.mjs";

const HELP = `content-shell-scan — harness-eng audit 内容扫描（只读）

用法:
  node scripts/content-shell-scan.mjs --root <TARGET> [--json]

选项:
  --root <path>   目标仓根（必填）
  --json          输出完整 JSON
  --help, -h      本帮助

说明:
  扫描子目录 AGENTS.md 的 TODO(harness-eng) 密度与「改动路径速查」实表；
  扫描根 AGENTS Never do 的 → Pn 回链（对齐 lint-pitfalls warn 语义）。
  exit 0 始终（findings 在输出里）；不改契约文件。
  规格见 modes/audit-report.md · modes/session-live.md
`;

function parseArgs(argv) {
  const out = { help: false, json: false, root: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--root") out.root = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  if (!args.root) throw new Error("--root required");
  const root = path.resolve(args.root);
  const report = scanContentShell(root);
  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(formatContentShellSummary(report));
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`content-shell-scan: ${err.message || err}\n`);
  process.exitCode = 1;
}
