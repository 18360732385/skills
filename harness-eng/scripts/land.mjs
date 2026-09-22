#!/usr/bin/env node
/**
 * Thin alias of scripts/harness.mjs (0.6.0+).
 *
 * Prefer:
 *   node scripts/harness.mjs --root <TARGET> --params <params.json>
 *       [--mode land|resume|upgrade|pipeline-skeleton]
 *
 * This file keeps the 0.5.9 command path and re-exports helpers for callers.
 */
import { isCliMain } from "./lib/cli-main.mjs";
import { main, isGeneratedHostPath, resolveLandAgentConfig } from "./harness.mjs";

export { main, isGeneratedHostPath, resolveLandAgentConfig };

if (isCliMain(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
