/**
 * Shared harness-eng selfcheck helpers.
 * Entry remains scripts/selfcheck.mjs; suites live under lib/selfcheck/.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { resolveDoc } from "../doc-paths.mjs";

export function createSelfcheckHelpers(skillRoot, { ok, fail }) {
  function docPath(basename) {
    return resolveDoc(skillRoot, basename);
  }
  function readDoc(basename) {
    return fs.readFileSync(docPath(basename), "utf8");
  }
  function assert(cond, msg) {
    if (cond) ok.push(msg);
    else fail.push(msg);
  }
  function runNode(args, opts = {}) {
    return spawnSync(process.execPath, args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      ...opts,
    });
  }
  return { skillRoot, docPath, readDoc, assert, runNode, ok, fail, fs, path };
}
