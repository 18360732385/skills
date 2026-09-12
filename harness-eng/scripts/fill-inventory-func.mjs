#!/usr/bin/env node
/**
 * Deprecated shim (0.6.0-dev M3): prefer `fill-inventory.mjs --domain func`.
 * Forwards argv only; scan logic lives in lib/inventory-func.mjs.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, "fill-inventory.mjs"), "--domain", "func", ...process.argv.slice(2)],
  { stdio: "inherit" }
);
process.exit(r.status === null ? 1 : r.status);
