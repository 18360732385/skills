#!/usr/bin/env node
/**
 * fill-inventory — domain-agnostic entry (0.5.9+)
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain <id> --root <TARGET> [domain args...]
 *
 * Prefer this over fill-inventory-<domain>.mjs. Per-domain scripts remain
 * as aliases and still hold domain scan logic (not rewritten in 0.5.9).
 * Domain list: templates/_meta/domains.yaml
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseDomain(argv) {
  const rest = [];
  let domain = null;
  let help = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--domain") {
      domain = argv[++i];
    } else if (a === "--help" || a === "-h") {
      help = true;
      rest.push(a);
    } else {
      rest.push(a);
    }
  }
  return { domain, help, rest };
}

function printHelp() {
  const ids = defaultContractDomains().join("|");
  console.log(`Usage:
  node scripts/fill-inventory.mjs --domain <${ids}> --root <TARGET> [domain-specific args]

Canonical inventory entry (0.5.9+). Dispatches to fill-inventory-<domain>.mjs.
Compat aliases: fill-inventory-api|func|db|redis|jobs.mjs
`);
}

function main() {
  const { domain, help, rest } = parseDomain(process.argv);
  if (help && !domain) {
    printHelp();
    process.exit(0);
  }
  if (!domain) {
    printHelp();
    process.exit(1);
  }
  const known = defaultContractDomains();
  if (!known.includes(domain)) {
    console.error(`Unknown domain: ${domain}. Known: ${known.join(", ")}`);
    process.exit(1);
  }
  const script = path.join(__dirname, `fill-inventory-${domain}.mjs`);
  const r = spawnSync(process.execPath, [script, ...rest], { stdio: "inherit" });
  process.exit(r.status === null ? 1 : r.status);
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
