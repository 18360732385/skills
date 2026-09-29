#!/usr/bin/env node
/**
 * Legacy stub (0.6.3+). Implementation moved to repo `_log/harness-eng/docs`.
 * See archive/fill-truths-auto/INDEX.md
 */
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(
  __dirname,
  "../../../_log/harness-eng/docs/fill-truths-auto.mjs"
);
const { default: run } = await import(pathToFileURL(target).href);
await run(process.argv.slice(2));
