#!/usr/bin/env node
/**
 * session-dash — markdown footer dashboard for harness-eng chat turns.
 *
 * Usage:
 *   node scripts/session-dash.mjs --root <TARGET>
 *     [--mode audit|land|pipeline|...]
 *     [--phase "WritePlan 待确认"]
 *     [--preauth yes|no]
 *     [--pending "等待确认 WritePlan"]
 *     [--next "下一动作"]
 *     [--json]
 */
import { buildSessionDashboard, renderSessionDashboardMarkdown } from "./lib/session-dashboard.mjs";

function parseArgs(argv) {
  const out = { json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--mode") out.sessionMode = argv[++i];
    else if (a === "--phase") out.sessionPhase = argv[++i];
    else if (a === "--preauth") {
      const v = String(argv[++i] || "").toLowerCase();
      out.preauth = v === "yes" || v === "true" || v === "是";
    } else if (a === "--pending") out.pending = argv[++i];
    else if (a === "--next") out.nextAction = argv[++i];
    else if (a === "--json") out.json = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const data = buildSessionDashboard(args);
  if (args.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    return;
  }
  process.stdout.write(renderSessionDashboardMarkdown(data) + "\n");
}

main();
