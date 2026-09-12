#!/usr/bin/env node
/**
 * fill-merge-func — alias for `fill-merge.mjs --domain func` (0.5.9).
 * Prefer the unified entry; this wrapper stays for back-compat.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, "fill-merge.mjs"), "--domain", "func", ...process.argv.slice(2)],
  { stdio: "inherit" }
);
process.exit(r.status === null ? 1 : r.status);
