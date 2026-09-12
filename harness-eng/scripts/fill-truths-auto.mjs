#!/usr/bin/env node
/**
 * Legacy stub (0.5.10+). Implementation: archive/fill-truths-auto/fill-truths-auto.mjs
 * 仅脚本、对话不推荐。
 */
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const dest = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../archive/fill-truths-auto/fill-truths-auto.mjs"
);
await import(pathToFileURL(dest).href);
