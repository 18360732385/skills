/**
 * 0.7.45: CI-stable harness-meta comparison (default ignore last_mode).
 * Cross-mode resume↔upgrade flips last_mode; content hash tools should strip it.
 */
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { findHarnessMetaFile } from "./harness-meta.mjs";

export const DEFAULT_IGNORE_KEYS = ["last_mode"];

/**
 * Remove top-level YAML scalar lines for given keys (and blank-line cleanup).
 * @param {string} text
 * @param {string[]} [keys]
 */
export function stripYamlKeys(text, keys = DEFAULT_IGNORE_KEYS) {
  const keySet = new Set((keys || []).map((k) => String(k).trim()).filter(Boolean));
  if (!keySet.size) return String(text || "");
  const lines = String(text || "").split(/\r?\n/);
  const out = [];
  for (const ln of lines) {
    const m = ln.match(/^\s*([A-Za-z_][\w]*)\s*:/);
    if (m && keySet.has(m[1])) continue;
    out.push(ln);
  }
  // collapse trailing empties to single newline
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n") + (out.length ? "\n" : "");
}

/**
 * @param {string} text
 * @param {{ ignoreKeys?: string[] }} [opts]
 * @returns {string} hex sha256
 */
export function hashHarnessMetaText(text, opts = {}) {
  const ignoreKeys = opts.ignoreKeys ?? DEFAULT_IGNORE_KEYS;
  const normalized = stripYamlKeys(text, ignoreKeys);
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * @param {string} a
 * @param {string} b
 * @param {{ ignoreKeys?: string[] }} [opts]
 */
export function compareHarnessMetaStable(a, b, opts = {}) {
  const ignoreKeys = opts.ignoreKeys ?? DEFAULT_IGNORE_KEYS;
  const hashA = hashHarnessMetaText(a, { ignoreKeys });
  const hashB = hashHarnessMetaText(b, { ignoreKeys });
  return {
    equal: hashA === hashB,
    hashA,
    hashB,
    ignoreKeys: [...ignoreKeys],
  };
}

/**
 * Read current harness-meta text from target root (docs/ then .cursor/).
 * @param {string} root
 * @returns {{ abs: string|null, text: string|null, rel: string|null }}
 */
export function readHarnessMetaText(root) {
  const found = findHarnessMetaFile(root);
  if (!found?.abs || !fs.existsSync(found.abs)) {
    return { abs: null, text: null, rel: null };
  }
  return {
    abs: found.abs,
    text: fs.readFileSync(found.abs, "utf8"),
    rel: path.relative(path.resolve(root), found.abs).replace(/\\/g, "/"),
  };
}

/**
 * CLI helper: print hash and optionally compare to baseline file.
 * @param {string} root
 * @param {{ baseline?: string|null, ignoreKeys?: string[] }} [opts]
 * @returns {{ ok: boolean, status: number, report: object }}
 */
export function runMetaStableCheck(root, opts = {}) {
  const ignoreKeys = opts.ignoreKeys ?? DEFAULT_IGNORE_KEYS;
  const cur = readHarnessMetaText(root);
  if (!cur.text) {
    const report = {
      ok: false,
      reason: "no-harness-meta",
      ignoreKeys,
    };
    return { ok: false, status: 1, report };
  }
  const hash = hashHarnessMetaText(cur.text, { ignoreKeys });
  const report = {
    ok: true,
    path: cur.rel,
    hash,
    ignoreKeys,
    baseline: null,
    equal: null,
  };
  if (!opts.baseline) {
    return { ok: true, status: 0, report };
  }
  const baseAbs = path.resolve(opts.baseline);
  if (!fs.existsSync(baseAbs)) {
    report.ok = false;
    report.reason = "baseline-missing";
    report.baseline = baseAbs;
    return { ok: false, status: 1, report };
  }
  const baseText = fs.readFileSync(baseAbs, "utf8");
  const cmp = compareHarnessMetaStable(cur.text, baseText, { ignoreKeys });
  report.baseline = baseAbs.replace(/\\/g, "/");
  report.equal = cmp.equal;
  report.hashBaseline = cmp.hashB;
  report.ok = cmp.equal;
  if (!cmp.equal) {
    report.reason = "content-diff-beyond-ignored-keys";
  } else {
    report.note = "equal after stripping ignored keys (default: last_mode)";
  }
  return { ok: cmp.equal, status: cmp.equal ? 0 : 1, report };
}
