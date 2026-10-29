import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import {
  isFakeChatTranscriptPlaceholder,
  isLegalAuthorizedBy,
} from "../lib/auth.mjs";
import {
  RUN_MODE_ENUM,
  PATH_ENUM,
  INVOKE_ENUM,
  HANDOFF_ENUM,
  REVIEW_ENUM,
  CHEF_ENUM,
  PROGRESS_TOP_KEYS,
  ARTIFACT_KEYS,
  GATE_KEYS,
  validateProgressEnums,
  validateMonorepoPackages,
} from "../lib/progress-shape.mjs";
import { readSkillVersion, escapeSemverRe } from "../lib/skill-version.mjs";

export function parseArgv(argv) {
  return {
    verbose: argv.includes("--verbose") || argv.includes("-v"),
    noLog: argv.includes("--no-log"),
    strictLog: argv.includes("--strict-log"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

export function printHelp() {
  console.log(`Usage: node scripts/selfcheck.mjs [--verbose|-v] [--no-log] [--strict-log] [--help|-h]

Default: PASS/FAIL summary only.
--verbose / -v: list every ✓ assertion.
--no-log: skip ../_log/feature-eng retention checks (portable copy).
--strict-log: fail if ../_log/feature-eng is missing.`);
}

export function createHarness(skillRoot, flags) {
  const fail = [];
  const ok = [];
  function assert(cond, msg) {
    if (cond) ok.push(msg);
    else fail.push(msg);
  }
  function read(rel) {
    const p = path.join(skillRoot, rel);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8");
  }
  function exists(rel) {
    return fs.existsSync(path.join(skillRoot, rel));
  }
  const PIN = readSkillVersion(skillRoot);
  const VER_RE = escapeSemverRe(PIN);
  return {
    fs, os, path, spawnSync, skillRoot, assert, read, exists, ok, fail, PIN, VER_RE,
    verbose: flags.verbose, noLog: flags.noLog, strictLog: flags.strictLog,
    isFakeChatTranscriptPlaceholder, isLegalAuthorizedBy,
    RUN_MODE_ENUM, PATH_ENUM, INVOKE_ENUM, HANDOFF_ENUM, REVIEW_ENUM, CHEF_ENUM,
    PROGRESS_TOP_KEYS, ARTIFACT_KEYS, GATE_KEYS,
    validateProgressEnums, validateMonorepoPackages,
  };
}

export function report(ctx) {
  const { ok, fail, PIN, verbose } = ctx;
  const total = ok.length + fail.length;
  if (fail.length) {
    console.error(`FAIL ${fail.length}/${total}`);
    for (const m of fail) console.error("  ✗", m);
    process.exit(1);
  }
  console.log(`PASS ${ok.length}/${total} (feature-eng ${PIN})`);
  if (verbose) for (const m of ok) console.log("  ✓", m);
  else console.log("  (re-run with --verbose to list every ✓)");
}
