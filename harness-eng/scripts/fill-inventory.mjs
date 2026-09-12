#!/usr/bin/env node
/**
 * fill-inventory — canonical inventory CLI (0.6.0-dev M3).
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain <id> --root <TARGET> [domain args...]
 *
 * Scan logic lives in lib/inventory-<domain>.mjs. Per-domain scripts are
 * deprecated shims that only forward argv.
 * Domain list: templates/_meta/domains.yaml
 */
import { fileURLToPath, pathToFileURL } from "url";
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

Canonical inventory entry (0.6.0-dev M3). Implementation: lib/inventory-<domain>.mjs.
Deprecated shims (argv forward only): fill-inventory-api|func|db|redis|jobs.mjs
`);
}

async function main() {
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
  const libPath = path.join(__dirname, "lib", `inventory-${domain}.mjs`);
  const mod = await import(pathToFileURL(libPath).href);
  if (typeof mod.main !== "function") {
    throw new Error(`lib/inventory-${domain}.mjs must export main()`);
  }
  const argv = [process.argv[0], process.argv[1], ...rest];
  await Promise.resolve(mod.main(argv));
}

try {
  await main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
