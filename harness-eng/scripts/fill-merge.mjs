#!/usr/bin/env node
/**
 * fill-merge — canonical merge CLI (0.3.7+ / 0.6.0-dev M3).
 *
 * Usage:
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --check
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --target <ssot.md> --write
 *   node scripts/fill-merge.mjs --domain api ... --write --enrich-dto --source-root <java-root>
 *
 * api extras (--enrich-dto / --module / --auto-fill / --source-root / --out) live on this CLI.
 * Domain list: templates/_meta/domains.yaml
 * Deprecated shims: fill-merge-api|func|db|redis|jobs.mjs (argv forward only).
 */
import { fileURLToPath } from "url";
import path from "path";
import { mergeDomain } from "./lib/merge-domain.mjs";
import { mergeApi } from "./lib/merge-api.mjs";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    domain: null,
    inventory: null,
    workDir: null,
    target: null,
    header: null,
    module: null,
    check: false,
    write: false,
    forceWrite: false,
    skipAcceptance: false,
    gold: false,
    help: false,
    enrichDto: false,
    sourceRoot: null,
    autoFill: false,
    out: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--domain") out.domain = argv[++i];
    else if (a === "--inventory") out.inventory = argv[++i];
    else if (a === "--work-dir") out.workDir = argv[++i];
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--header") out.header = argv[++i];
    else if (a === "--module") out.module = argv[++i];
    else if (a === "--check") out.check = true;
    else if (a === "--write") out.write = true;
    else if (a === "--force-write") out.forceWrite = true;
    else if (a === "--skip-acceptance") out.skipAcceptance = true;
    else if (a === "--gold") out.gold = true;
    else if (a === "--enrich-dto") out.enrichDto = true;
    else if (a === "--source-root") out.sourceRoot = argv[++i];
    else if (a === "--auto-fill") out.autoFill = true;
    else if (a === "--out") out.out = argv[++i];
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
  node scripts/fill-merge.mjs --domain api ... --write --enrich-dto --source-root <java-root>
  node scripts/fill-merge.mjs --domain api ... --auto-fill --module <name>

Options: --gold --force-write --skip-acceptance --header <md>
api-only: --enrich-dto --source-root --auto-fill --module --out
Deprecated shims: fill-merge-api|func|db|redis|jobs.mjs (argv forward only).
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
  const apiOnly = args.enrichDto || args.autoFill || args.module || args.sourceRoot || args.out;
  if (apiOnly && args.domain !== "api") {
    console.error("--enrich-dto / --module / --auto-fill / --source-root / --out are api-only");
    process.exit(1);
  }
  if (!args.check && !args.write && !args.out) {
    console.error("Specify --check and/or --write");
    process.exit(1);
  }
  if (args.write && !args.target) {
    console.error("--write requires --target");
    process.exit(1);
  }

  if (args.domain === "api") {
    mergeApi({
      inventory: args.inventory,
      workDir: args.workDir,
      target: args.target,
      header: args.header,
      module: args.module,
      check: args.check,
      write: args.write,
      out: args.out,
      enrichDto: args.enrichDto,
      sourceRoot: args.sourceRoot,
      autoFill: args.autoFill,
      forceWrite: args.forceWrite,
      skipAcceptance: args.skipAcceptance,
      gold: args.gold,
      scriptsDir: __dirname,
    });
  } else {
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
  }
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
