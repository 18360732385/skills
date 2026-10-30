#!/usr/bin/env node
/**
 * calibrate-live — alias for fill-calibrate-live.mjs (0.7.58).
 * Prefer the canonical name; this entry exists to catch misremembered CLI.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "fill-calibrate-live.mjs");

console.error(
  "harness: calibrate-live.mjs 为别名；正式入口是 fill-calibrate-live.mjs（参数原样转发）"
);

const r = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(r.status == null ? 1 : r.status);
