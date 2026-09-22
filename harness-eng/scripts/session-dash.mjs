#!/usr/bin/env node
/**
 * session-dash — markdown footer dashboard for harness-eng this-turn engineering steps.
 * Agent decides SHOW/HIDE per session-dashboard.md (this-turn gate); this script only renders.
 *
 * Usage:
 *   node scripts/session-dash.mjs --root <TARGET>
 *     [--mode audit|land|pipeline|...]
 *     [--phase "WritePlan 待确认"]
 *     [--preauth yes|no]
 *     [--pending "等待确认 WritePlan"]
 *     [--next "下一动作"]
 *     [--intent engineering|meta]
 *     [--json]
 *     [--help]
 *
 * --intent engineering (default): render the four-panel footer.
 * --intent meta: omit markdown (json: { omitted: true, reason: "meta" }).
 * 无 score 且诊断空时默认精简一行（减噪）；--json 仍输出完整结构。
 */
import { buildSessionDashboard, renderSessionDashboardMarkdown } from "./lib/session-dashboard.mjs";

const HELP = `session-dash — harness-eng 会话仪表盘（本轮工程步进末尾四台摘要）

用法:
  node scripts/session-dash.mjs --root <TARGET> [选项]

选项:
  --root <path>              目标仓根（可读 score / meta）
  --mode <name>              会话模式（audit|land|pipeline|…）
  --phase <text>             当前阶段文案
  --preauth yes|no|是        是否已预授权
  --pending <text>           待办提示
  --next <text>              下一动作（例：确认后 harness.mjs）
  --intent engineering|meta  engineering=渲染；meta=省略（默认 engineering）
  --json                     输出 JSON
  --help, -h                 显示本帮助

说明:
  SHOW/HIDE 由 Agent 按 modes/session-dashboard.md 按本轮判定；本脚本只负责渲染。
  --mode 为本轮意图（必填推荐）；省略时显示「—」，meta.last_mode 仅脚注，不顶替本轮模式。
  无 score / 诊断空时默认精简一行，避免空四台噪音。
`;

function parseArgs(argv) {
  const out = { json: false, intent: "engineering", help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--mode") out.sessionMode = argv[++i];
    else if (a === "--phase") out.sessionPhase = argv[++i];
    else if (a === "--preauth") {
      const v = String(argv[++i] || "").toLowerCase();
      out.preauth = v === "yes" || v === "true" || v === "是";
    } else if (a === "--pending") out.pending = argv[++i];
    else if (a === "--next") out.nextAction = argv[++i];
    else if (a === "--intent") {
      const v = String(argv[++i] || "").toLowerCase();
      if (v !== "engineering" && v !== "meta") {
        throw new Error("--intent must be engineering|meta");
      }
      out.intent = v;
    } else if (a === "--json") out.json = true;
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
  if (args.intent === "meta") {
    if (args.json) {
      process.stdout.write(JSON.stringify({ omitted: true, reason: "meta" }, null, 2) + "\n");
    }
    return;
  }
  const data = buildSessionDashboard(args);
  if (args.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    return;
  }
  process.stdout.write(renderSessionDashboardMarkdown(data) + "\n");
}

main();
