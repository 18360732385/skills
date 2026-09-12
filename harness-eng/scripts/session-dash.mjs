#!/usr/bin/env node
/**
 * session-dash — markdown footer dashboard for harness-eng engineering turns.
 * Agent decides SHOW/HIDE per session-dashboard.md; this script only renders.
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
 *
 * --intent engineering (default): render the four-panel footer.
 * --intent meta: omit markdown (json: { omitted: true, reason: "meta" }).
 */
import { buildSessionDashboard, renderSessionDashboardMarkdown } from "./lib/session-dashboard.mjs";

function parseArgs(argv) {
  const out = { json: false, intent: "engineering" };
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
