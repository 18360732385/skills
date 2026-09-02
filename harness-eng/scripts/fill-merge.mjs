#!/usr/bin/env node
/**
 * fill-merge — domain-agnostic entry (0.3.7+)
 *
 * Usage:
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --check
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --target <ssot.md> --write
 *
 * Prefer this over fill-merge-<domain>.mjs when adding domains; thin wrappers remain for compat.
 * Domain list: templates/_meta/domains.yaml
 */
import { fileURLToPath } from "url";
import path from "path";
import { mergeDomain } from "./lib/merge-domain.mjs";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    domain: null,
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
    if (a === "--domain") out.domain = argv[++i];
    else if (a === "--inventory") out.inventory = argv[++i];
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
  const ids = defaultContractDomains().join("|");
  console.log(`Usage:
  node scripts/fill-merge.mjs --domain <${ids}> --inventory <inv.json> --work-dir <docs/<d>/.fill-work> --check
  node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir ... --target <ssot.md> --write

Options: --gold --force-write --skip-acceptance --header <md>
Compat: fill-merge-api|func|db|redis|jobs.mjs still work (thin wrappers).
`);
}

try {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.domain || !args.inventory || !args.workDir) {
    printHelp();
    process.exit(1);
  }
  const known = defaultContractDomains();
  if (!known.includes(args.domain)) {
    console.error(`Unknown domain: ${args.domain}. Known: ${known.join(", ")}`);
    process.exit(1);
  }
  if (!args.check && !args.write) {
    console.error("Specify --check and/or --write");
    process.exit(1);
  }
  if (args.write && !args.target) {
    console.error("--write requires --target");
    process.exit(1);
  }

  mergeDomain({
    inventory: args.inventory,
    workDir: args.workDir,
    target: args.write ? args.target : null,
    domain: args.domain,
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
