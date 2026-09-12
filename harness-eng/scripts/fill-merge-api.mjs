#!/usr/bin/env node
/**
 * Deprecated shim (0.6.0-dev M3): prefer `fill-merge.mjs --domain api`.
 * Forwards argv (including --enrich-dto / --module / --auto-fill).
 * Implementation: lib/merge-api.mjs via the unified CLI.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, "fill-merge.mjs"), "--domain", "api", ...process.argv.slice(2)],
  { stdio: "inherit" }
);
process.exit(r.status === null ? 1 : r.status);
