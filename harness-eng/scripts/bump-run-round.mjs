#!/usr/bin/env node
/**
 * bump-run-round — increment docs/harness-eng/run-latest.json round (fill batch close).
 *
 * Usage:
 *   node scripts/bump-run-round.mjs --root <TARGET> [--note fill-truths-agents]
 *   node scripts/bump-run-round.mjs --root <TARGET> --dry-run
 */
import { bumpRunRound, loadRunLatest, nextRound } from "./lib/run-latest.mjs";

function parseArgs(argv) {
  const out = { root: null, note: "fill-batch", dryRun: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

const args = parseArgs(process.argv);
if (args.help || !args.root) {
  console.log(
    `Usage: node scripts/bump-run-round.mjs --root <TARGET> [--note text] [--dry-run]`
  );
  process.exit(args.help ? 0 : 1);
}

if (args.dryRun) {
  const existing = loadRunLatest(args.root);
  const would = {
    ...(existing && typeof existing === "object" ? existing : {}),
    round: nextRound(args.root, existing, { bump: true }),
    note: args.note || "fill-batch",
    at: "(dry-run)",
  };
  console.log(
    JSON.stringify(
      {
        ok: true,
        dry_run: true,
        path: "docs/harness-eng/run-latest.json",
        would_write: would,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const run = bumpRunRound(args.root, { note: args.note });
console.log(
  JSON.stringify({ ok: true, path: "docs/harness-eng/run-latest.json", run }, null, 2)
);
