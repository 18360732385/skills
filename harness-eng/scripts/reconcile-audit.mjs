#!/usr/bin/env node
/**
 * Official coverage-audit id migration.
 * Matches audit rows to the current inventory by evidence_path and updates unit_id.
 * Does not rewrite hashes or verdicts, and does not invent new rows.
 *
 * Usage:
 *   node scripts/reconcile-audit.mjs --root <TARGET> --domain prototype
 *   node scripts/reconcile-audit.mjs --root <TARGET> --domain all --write
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isCliMain } from "./lib/cli-main.mjs";
import { reconcileAudit } from "./lib/reconcile-audit.mjs";
import { loadDomainInventory } from "./lib/inventory-paths.mjs";
import { FRONTEND_COVERAGE_DOMAINS } from "./lib/frontend-coverage.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { root: null, domain: "all", write: false, help: false, json: false };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--write") out.write = true;
    else if (a === "--json") out.json = true;
    else if (a === "--dry-run") out.write = false;
    else if (a === "--root") out.root = args[++i];
    else if (a.startsWith("--root=")) out.root = a.slice("--root=".length);
    else if (a === "--domain") out.domain = args[++i];
    else if (a.startsWith("--domain=")) out.domain = a.slice("--domain=".length);
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/reconcile-audit.mjs --root <TARGET> [--domain <id|all>] [--write] [--json]

按 evidence_path 把 coverage-audit 行的 unit_id 迁到当前库存 id。
默认 dry-run；加 --write 才落盘。不改哈希、不改编造 verdict、不新增行。
`);
}

function domainsToRun(root, domain) {
  if (domain && domain !== "all") return [domain];
  const found = [];
  for (const d of FRONTEND_COVERAGE_DOMAINS) {
    const inv = loadDomainInventory(root, d);
    const audit = path.join(root, "docs", "harness-eng", "coverage-audit", `${d}.json`);
    if (inv || fs.existsSync(audit)) found.push(d);
  }
  return found.length ? found : FRONTEND_COVERAGE_DOMAINS;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help || !args.root) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const root = path.resolve(args.root);
  const domains = domainsToRun(root, args.domain);
  const reports = domains.map((domain) =>
    reconcileAudit({ root, domain, write: args.write })
  );
  const payload = { ok: true, write: args.write, dry_run: !args.write, reports };
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const r of reports) {
      const n = (r.changes || []).length;
      const verb = r.written ? "已迁移" : "将迁移";
      console.log(
        `${r.domain}: ${verb} ${n} 条 unit_id；缺行 ${ (r.missing_inventory || []).length }；无法匹配 ${(r.unmatched_audit || []).length}`
      );
      for (const c of r.changes || []) {
        console.log(`  ${c.from_id} → ${c.to_id}  (${c.evidence_path})`);
      }
    }
    if (!args.write) console.error("reconcile-audit: dry-run（未写盘）。确认后加 --write。");
  }
  const failed = reports.some((r) => r.ok === false);
  process.exit(failed ? 1 : 0);
}

if (isCliMain(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`reconcile-audit: ${e && e.message ? e.message : e}`);
    process.exit(1);
  }
}
