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
import path from "path";
import { fileURLToPath } from "url";
import { main, isGeneratedHostPath, resolveLandAgentConfig } from "./harness.mjs";

export { main, isGeneratedHostPath, resolveLandAgentConfig };

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
