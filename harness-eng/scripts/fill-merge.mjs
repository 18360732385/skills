#!/usr/bin/env node
/**
 * fill-merge — canonical merge CLI (0.3.7+ / 0.6.0-dev M3 / 0.7.26 P2).
 *
 * Usage:
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --check
 *   node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --target <ssot.md> --write
 *   node scripts/fill-merge.mjs --domain db ... --target-dir docs/db/table --split-by table --write
 *   node scripts/fill-merge.mjs --domain api ... --write --enrich-dto --source-root <java-root>
 *
 * api extras (--enrich-dto / --module / --auto-fill / --source-root / --out) live on this CLI.
 * Domain list: templates/_meta/domains.yaml
 */
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import {
  mergeDomain,
  mergeDomainSplitByTable,
  updateDomainIndex,
} from "./lib/merge-domain.mjs";
import { mergeApi } from "./lib/merge-api.mjs";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    domain: null,
    inventory: null,
    workDir: null,
    target: null,
    targetDir: null,
    splitBy: null,
    header: null,
    footer: null,
    preserveOrder: true,
    updateIndex: false,
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
    else if (a === "--target-dir") out.targetDir = argv[++i];
    else if (a === "--split-by") out.splitBy = argv[++i];
    else if (a === "--header") out.header = argv[++i];
    else if (a === "--footer") out.footer = argv[++i];
    else if (a === "--preserve-order") out.preserveOrder = true;
    else if (a === "--no-preserve-order") out.preserveOrder = false;
    else if (a === "--update-index") out.updateIndex = true;
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
  node scripts/fill-merge.mjs --domain db ... --target-dir docs/db/table --split-by table --write
  node scripts/fill-merge.mjs --domain api ... --write --enrich-dto --source-root <java-root>

Options:
  --gold --force-write --skip-acceptance --header <md> --footer <md>
  --preserve-order (default) | --no-preserve-order
  --target-dir <dir> --split-by table   # db/redis: one file per inventory item
  --update-index                        # refresh api.md / func.md / db.md index rows
api-only: --enrich-dto --source-root --auto-fill --module --out
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

  const splitByTable =
    args.splitBy === "table" ||
    (args.targetDir && (args.domain === "db" || args.domain === "redis"));

  if (args.write && !args.target && !args.targetDir && !splitByTable) {
    console.error("--write requires --target or --target-dir");
    process.exit(1);
  }

  let report = null;
  if (args.domain === "api") {
    report = mergeApi({
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
  } else if (args.write && splitByTable) {
    const dir =
      args.targetDir ||
      (args.domain === "db"
        ? "docs/db/table"
        : args.domain === "redis"
          ? "docs/redis/keys"
          : null);
    if (!dir) {
      console.error("--split-by table requires --target-dir for this domain");
      process.exit(1);
    }
    report = mergeDomainSplitByTable({
      inventory: args.inventory,
      workDir: args.workDir,
      targetDir: dir,
      domain: args.domain,
      gold: args.gold,
      forceWrite: args.forceWrite,
      skipAcceptance: args.skipAcceptance,
      scriptsDir: __dirname,
      header: args.header,
      footer: args.footer,
      preserveOrder: args.preserveOrder,
    });
  } else {
    report = mergeDomain({
      inventory: args.inventory,
      workDir: args.workDir,
      target: args.write ? args.target : null,
      domain: args.domain,
      gold: args.gold,
      forceWrite: args.forceWrite,
      skipAcceptance: args.skipAcceptance,
      scriptsDir: __dirname,
      header: args.header,
      footer: args.footer,
      preserveOrder: args.preserveOrder,
    });
  }

  if (args.write && args.updateIndex && report) {
    // work-dir = docs/<domain>/.fill-work → domain root = docs/<domain>
    const domainRoot = path.resolve(args.workDir, "..");
    const docsRoot = path.resolve(domainRoot, "..");
    const idx = updateDomainIndex({
      root: fs.existsSync(path.join(domainRoot, `${args.domain}.md`))
        ? docsRoot
        : domainRoot,
      domain: args.domain,
      inventory: args.inventory,
      targetDir: args.targetDir || null,
      target: args.target || null,
    });
    if (idx?.updated) console.error(`Updated index ${idx.path}`);
  }
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
