#!/usr/bin/env node
/**
 * fill-merge-jobs — merge docs/jobs/.fill-work fragments into SSOT (0.3.5+)
 * Compat (0.3.7+): prefer `fill-merge.mjs --domain jobs`.
 *
 * Usage:
 *   node scripts/fill-merge-jobs.mjs --inventory inv.json --work-dir <root>/docs/jobs/.fill-work --check
 *   node scripts/fill-merge-jobs.mjs --inventory inv.json --work-dir ... --target docs/jobs/tasks/01-x.md --write
 *   node scripts/fill-merge-jobs.mjs ... --write --force-write
 *   node scripts/fill-merge-jobs.mjs --help
 *
 * Prefer one task truth per file; --target may be a single NN-*.md or a combined draft.
 */
import { fileURLToPath } from "url";
import path from "path";
import { mergeDomain } from "./lib/merge-domain.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    inventory: null,
    workDir: null,
    target: null,
    header: null,
    check: false,
    write: false,
    forceWrite: false,
    skipAcceptance: false,
    gold: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--inventory") out.inventory = argv[++i];
    else if (a === "--work-dir") out.workDir = argv[++i];
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--header") out.header = argv[++i];
    else if (a === "--check") out.check = true;
    else if (a === "--write") out.write = true;
    else if (a === "--force-write") out.forceWrite = true;
    else if (a === "--skip-acceptance") out.skipAcceptance = true;
    else if (a === "--gold") out.gold = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-merge-jobs.mjs --inventory <inv.json> --work-dir <docs/jobs/.fill-work> --check
  node scripts/fill-merge-jobs.mjs --inventory <inv.json> --work-dir ... --target <docs/jobs/tasks/NN-*.md> --write
  Options: --gold --force-write --skip-acceptance --header <md>
`);
}

try {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.inventory || !args.workDir) {
    printHelp();
    process.exit(1);
  }
  if (!args.check && !args.write) {
    console.error("Specify --check and/or --write");
    process.exit(1);
  }

  mergeDomain({
    inventory: args.inventory,
    workDir: args.workDir,
    target: args.write ? args.target : null,
    domain: "jobs",
    gold: args.gold,
    forceWrite: args.forceWrite,
    skipAcceptance: args.skipAcceptance,
    scriptsDir: __dirname,
    header: args.header,
  });
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
