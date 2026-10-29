#!/usr/bin/env node
/**
 * feature-eng selfcheck：静态断言 + 夹具行为断言。版本 PIN 读自 `_meta/manifest.yaml`。
 * 主题套件：`scripts/selfcheck/suite-*.mjs`（fixtures 含原 O1–O14/M1–M6 与 gate-evidence 块）。
 *
 * Usage: node scripts/selfcheck.mjs [--verbose|-v] [--no-log] [--strict-log] [--help|-h]
 */
import path from "path";
import { fileURLToPath } from "url";
import { parseArgv, printHelp, createHarness, report } from "./selfcheck/harness.mjs";
import {
  MODES, MODE_EXTRAS, FLAT_SPEC_LEAKS, ROOT_MODE_LEAKS, BINDING_KEYS, TEMPLATES, stageSkillMap,
  FIX_GOOD, FIX_BAD, FIX_SLUG, FIX_ADV, ADV_SLUG, FIX_CLOSE, CLOSE_SLUG,
  FIX_THEATER, THEATER_SLUG, FIX_L2FAIL, L2FAIL_SLUG, FIX_MID, MID_SLUG,
  attachLogHelpers,
} from "./selfcheck/context.mjs";
import { run as runCore } from "./selfcheck/suite-core.mjs";
import { run as runLogs } from "./selfcheck/suite-logs.mjs";
import { run as runFixtures } from "./selfcheck/suite-fixtures.mjs";
import { run as runCompat } from "./selfcheck/suite-compat.mjs";
import { run as runRecent } from "./selfcheck/suite-recent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const flags = parseArgv(process.argv.slice(2));
if (flags.help) {
  printHelp();
  process.exit(0);
}

const ctx = createHarness(skillRoot, flags);
Object.assign(ctx, {
  MODES, MODE_EXTRAS, FLAT_SPEC_LEAKS, ROOT_MODE_LEAKS, BINDING_KEYS, TEMPLATES, stageSkillMap,
  FIX_GOOD, FIX_BAD, FIX_SLUG, FIX_ADV, ADV_SLUG, FIX_CLOSE, CLOSE_SLUG,
  FIX_THEATER, THEATER_SLUG, FIX_L2FAIL, L2FAIL_SLUG, FIX_MID, MID_SLUG,
});
attachLogHelpers(ctx);
runCore(ctx);
runLogs(ctx);
runFixtures(ctx);
runCompat(ctx);
runRecent(ctx);
report(ctx);
