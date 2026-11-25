/**
 * selfcheck 共享工具
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readSkillVersion, escapeSemverRe } from "../lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const skillRoot = path.resolve(__dirname, "../..");

export function createKit({ verbose = false } = {}) {
  const ok = [];
  const fail = [];
  const PIN = readSkillVersion(skillRoot);
  const VER_RE = escapeSemverRe(PIN);

  function assert(cond, msg) {
    if (cond) ok.push(msg);
    else fail.push(msg);
  }

  function read(rel) {
    const p = path.join(skillRoot, rel);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8");
  }

  function exists(rel) {
    return fs.existsSync(path.join(skillRoot, rel));
  }

  function report(label = PIN) {
    const total = ok.length + fail.length;
    if (fail.length) {
      console.error(`FAIL ${fail.length}/${total} (${label})`);
      for (const m of fail) console.error("  ✗", m);
      return 1;
    }
    console.log(`PASS ${ok.length}/${total} (${label})`);
    if (verbose) for (const m of ok) console.log("  ✓", m);
    return 0;
  }

  return { skillRoot, PIN, VER_RE, assert, read, exists, ok, fail, report, verbose };
}
