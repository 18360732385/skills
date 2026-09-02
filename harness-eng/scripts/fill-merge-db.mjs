#!/usr/bin/env node
/**
 * fill-merge-db — merge docs/db/.fill-work fragments into SSOT (0.2.19+).
 * Compat (0.3.7+): prefer `fill-merge.mjs --domain db`.
 *
 * Usage:
 *   node scripts/fill-merge-db.mjs --inventory inv.json --work-dir <root>/docs/db/.fill-work --check
 *   node scripts/fill-merge-db.mjs --inventory inv.json --work-dir ... --target docs/db/table/01-x.md --write
 *   node scripts/fill-merge-db.mjs ... --write --force-write   # skip acceptance + missing check
 *   node scripts/fill-merge-db.mjs --help
 *
 * Multi-module: fragments whose evidence is not in the inventory are auto-skipped.
 */
import { fileURLToPath } from "url";
import path from "path";
import { mergeDomain, walkMd } from "./lib/merge-domain.mjs";

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
  node scripts/fill-merge-db.mjs --inventory inv.json --work-dir <dir> --check
  node scripts/fill-merge-db.mjs --inventory inv.json --work-dir <dir> --target <ssot.md> --write
  node scripts/fill-merge-db.mjs ... --write --force-write

Options:
  --inventory   fill-inventory-db JSON
  --work-dir    directory of shard fragments (*.md)
  --target      SSOT table truth path (required with --write)
  --check       validate only; exit 1 on failure
  --write       write SSOT to --target (implies check + acceptance-check)
  --force-write skip acceptance blockers AND missing-item check
  --gold        acceptance gold mode
  --header      optional markdown header file prepended before ## 1.
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
    throw new Error("Required: --inventory and --work-dir");
  }
  if (args.write && !args.target) {
    throw new Error("--write requires --target");
  }

  mergeDomain({
    inventory: args.inventory,
    workDir: args.workDir,
    target: args.write ? args.target : null,
    domain: "db",
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
