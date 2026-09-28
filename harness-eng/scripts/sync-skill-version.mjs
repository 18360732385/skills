#!/usr/bin/env node
/**
 * Sync mechanical skill-version copies from `_meta/manifest.yaml` (SSOT).
 *
 * Usage:
 *   node scripts/sync-skill-version.mjs          # write
 *   node scripts/sync-skill-version.mjs --check  # drift → exit 1
 *   node scripts/sync-skill-version.mjs --help
 *
 * Does NOT touch: CHANGELOG.md, modes/upgrade.md, l5-sync-stale, evals, schema versions.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import {
  readSkillVersion,
  readTemplatesManifestVersion,
  escapeSemverRe,
} from "./lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");

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
Syncs mechanical copies + known doc "current version" headers.
Does not edit CHANGELOG / upgrade.md / stale fixtures / schema versions.`);
}

function syncSyncMarkers(text, version) {
  let out = text;
  out = out.replace(
    /HARNESS_SYNC_TMPL_ID:\s*\S+/g,
    `HARNESS_SYNC_TMPL_ID: ${version}`
  );
  out = out.replace(
    /HARNESS_ENG_VERSION:\s*\S+/g,
    `HARNESS_ENG_VERSION: ${version}`
  );
  out = out.replace(
    /const HARNESS_SYNC_TMPL_ID = "[^"]*"/g,
    `const HARNESS_SYNC_TMPL_ID = "${version}"`
  );
  out = out.replace(
    /const HARNESS_ENG_VERSION = "[^"]*"/g,
    `const HARNESS_ENG_VERSION = "${version}"`
  );
  return out;
}

/**
 * Replace known "current version" doc pins from `from` → `to`.
 * Only touches patterns selfcheck asserts; leaves historical tables alone when possible.
 */
function syncDocHeaders(text, from, to, kind) {
  if (!from || from === to) return text;
  const fromRe = escapeSemverRe(from);
  let out = text;
  if (kind === "readme") {
    out = out.replace(
      new RegExp(`当前版本：${fromRe}`),
      `当前版本：${to}`
    );
  } else if (kind === "quickstart") {
    out = out.replace(
      new RegExp(`当前 \\*\\*${fromRe}\\*\\*`),
      `当前 **${to}**`
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
  } else if (kind === "handbook") {
    out = out.replace(
      new RegExp(`版本：\\*\\*${fromRe}\\*\\*`),
      `版本：**${to}**`
    );
  } else if (kind === "handbook-html") {
    out = out.replace(new RegExp(`v${fromRe}`, "g"), `v${to}`);
  }
  return out;
}

function planUpdates(skillRoot, version) {
  const prev = readTemplatesManifestVersion(skillRoot) || version;
  /** @type {{ rel: string, next: string }[]} */
  const updates = [];

  function queue(rel, transform) {
    const abs = path.join(skillRoot, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`sync target missing: ${rel}`);
    }
    const cur = fs.readFileSync(abs, "utf8");
    const next = transform(cur);
    if (next !== cur) updates.push({ rel, next });
  }

  queue("templates/_meta/manifest.yaml", (t) =>
    t.replace(/^version:\s*"[^"]*"/m, `version: "${version}"`)
  );
  queue("templates/meta/harness-meta.yaml.tmpl", (t) =>
    t.replace(/^skill_version:\s*"[^"]*"/m, `skill_version: "${version}"`)
  );
  queue("questions.yaml", (t) =>
    t.replace(/^version:\s*"[^"]*"/m, `version: "${version}"`)
  );

  const syncRelPaths = [
    "templates/agent-config/sync.mjs.tmpl",
    "scripts/fixtures/l5-sync-codex/scripts/agent-config/sync.mjs",
    "scripts/fixtures/l5-sync-golden/scripts/agent-config/sync.mjs",
  ];
  for (const rel of syncRelPaths) {
    queue(rel, (t) => syncSyncMarkers(t, version));
  }

  queue("README.md", (t) => syncDocHeaders(t, prev, version, "readme"));
  queue("QUICKSTART.md", (t) => syncDocHeaders(t, prev, version, "quickstart"));
  queue("VERIFY.md", (t) => syncDocHeaders(t, prev, version, "verify"));
  queue("guide/使用手册.md", (t) => syncDocHeaders(t, prev, version, "handbook"));
  queue("guide/使用手册-摘要.md", (t) =>
    syncDocHeaders(t, prev, version, "handbook")
  );
  queue("guide/使用手册.html", (t) =>
    syncDocHeaders(t, prev, version, "handbook-html")
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
      `[sync-skill-version] drift vs SSOT ${version} (templates was ${prev}):`
    );
    for (const u of updates) console.error(`  - ${u.rel}`);
    console.error(`Run: node scripts/sync-skill-version.mjs`);
    process.exit(1);
  }

  for (const u of updates) {
    fs.writeFileSync(path.join(SKILL_ROOT, u.rel), u.next, "utf8");
    console.log(`[sync-skill-version] updated ${u.rel}`);
  }

  // After bumping golden sync.mjs markers, regenerate its managed outputs so --check stays green.
  const goldenSync = path.join(
    SKILL_ROOT,
    "scripts/fixtures/l5-sync-golden/scripts/agent-config/sync.mjs"
  );
  if (fs.existsSync(goldenSync)) {
    const r = spawnSync(process.execPath, [goldenSync], {
      cwd: path.join(SKILL_ROOT, "scripts/fixtures/l5-sync-golden"),
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(
        `[sync-skill-version] golden fixture sync failed:\n${r.stderr || r.stdout}`
      );
      process.exit(r.status || 1);
    }
    console.log(`[sync-skill-version] refreshed l5-sync-golden managed outputs`);
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
