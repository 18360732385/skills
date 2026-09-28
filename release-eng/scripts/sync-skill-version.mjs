#!/usr/bin/env node
/**
 * Sync mechanical skill-version doc pins from `_meta/manifest.yaml` (SSOT).
 *
 * Usage:
 *   node scripts/sync-skill-version.mjs          # write
 *   node scripts/sync-skill-version.mjs --check  # drift → exit 1
 *   node scripts/sync-skill-version.mjs --help
 *
 * Does NOT touch: CHANGELOG.md, QUICKSTART.md, release.mjs headers, fixtures.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  readSkillVersion,
  escapeSemverRe,
  inferPinnedVersionFromDocs,
} from "./lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(SKILL_ROOT, "..");

function parseArgs(argv) {
  const out = { check: false, help: false };
  for (const a of argv.slice(2)) {
    if (a === "--check") out.check = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/sync-skill-version.mjs [--check] [--help]

SSOT: _meta/manifest.yaml → version
Syncs known doc "current version" headers (+ repo root README release-eng row).
Does not edit CHANGELOG.md / QUICKSTART.md.`);
}

function syncDoc(text, from, to, kind) {
  if (!from || from === to) return text;
  const fromRe = escapeSemverRe(from);
  let out = text;
  if (kind === "skill") {
    out = out.replace(
      new RegExp(`（\\*\\*${fromRe}\\*\\*；`),
      `（**${to}**；`
    );
  } else if (kind === "agent-index") {
    out = out.replace(
      new RegExp(`拓扑（${fromRe}）`),
      `拓扑（${to}）`
    );
  } else if (kind === "readme") {
    out = out.replace(
      new RegExp(`当前 \\*\\*${fromRe}\\*\\*`),
      `当前 **${to}**`
    );
    out = out.replace(
      new RegExp(`release-eng ${fromRe}\\)`),
      `release-eng ${to})`
    );
  } else if (kind === "verify") {
    out = out.replace(
      new RegExp(`验收记录（${fromRe}）`),
      `验收记录（${to}）`
    );
    out = out.replace(
      new RegExp(`当前 \\*\\*${fromRe}\\*\\*`),
      `当前 **${to}**`
    );
  } else if (kind === "repo-root") {
    // Replace whatever pin is on the release-eng README row (may lag SSOT badly).
    out = out.replace(
      /(release-eng\/README\.md[^\n]*当前 )\S+/,
      `$1${to}`
    );
  }
  return out;
}

function planUpdates(skillRoot, version) {
  const prev = inferPinnedVersionFromDocs(skillRoot) || version;
  /** @type {{ rel: string, abs: string, next: string }[]} */
  const updates = [];

  function queue(rel, abs, transform) {
    if (!fs.existsSync(abs)) {
      throw new Error(`sync target missing: ${rel}`);
    }
    const cur = fs.readFileSync(abs, "utf8");
    const next = transform(cur);
    if (next !== cur) updates.push({ rel, abs, next });
  }

  queue("SKILL.md", path.join(skillRoot, "SKILL.md"), (t) =>
    syncDoc(t, prev, version, "skill")
  );
  queue("AGENT-INDEX.md", path.join(skillRoot, "AGENT-INDEX.md"), (t) =>
    syncDoc(t, prev, version, "agent-index")
  );
  queue("README.md", path.join(skillRoot, "README.md"), (t) =>
    syncDoc(t, prev, version, "readme")
  );
  queue("VERIFY.md", path.join(skillRoot, "VERIFY.md"), (t) =>
    syncDoc(t, prev, version, "verify")
  );
  queue("../README.md", path.join(REPO_ROOT, "README.md"), (t) =>
    syncDoc(t, prev, version, "repo-root")
  );

  return { version, prev, updates };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const version = readSkillVersion(SKILL_ROOT);
  const { prev, updates } = planUpdates(SKILL_ROOT, version);

  if (args.check) {
    if (updates.length === 0) {
      console.log(`[sync-skill-version] ok — ${version} (no drift)`);
      process.exit(0);
    }
    console.error(
      `[sync-skill-version] drift vs SSOT ${version} (docs were ${prev}):`
    );
    for (const u of updates) console.error(`  - ${u.rel}`);
    console.error(`Run: node scripts/sync-skill-version.mjs`);
    process.exit(1);
  }

  for (const u of updates) {
    fs.writeFileSync(u.abs, u.next, "utf8");
    console.log(`[sync-skill-version] updated ${u.rel}`);
  }
  if (updates.length === 0) {
    console.log(`[sync-skill-version] already synced to ${version}`);
  } else {
    console.log(
      `[sync-skill-version] synced ${updates.length} file(s) → ${version}`
    );
  }
}

main();
