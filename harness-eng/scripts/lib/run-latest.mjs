/**
 * docs/harness-eng/run-latest.json — fill/report round metadata (0.2.29+).
 */
import fs from "fs";
import path from "path";
import { readScoreHistory } from "./score-history.mjs";

export const RUN_LATEST_REL = "docs/harness-eng/run-latest.json";

/**
 * @param {string} root
 * @returns {object|null}
 */
export function loadRunLatest(root) {
  const abs = path.join(root, RUN_LATEST_REL);
  if (!fs.existsSync(abs)) return null;
  let raw = fs.readFileSync(abs, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} root
 * @param {object} run
 */
export function writeRunLatest(root, run) {
  const abs = path.join(root, RUN_LATEST_REL);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const body = { ...run, at: run.at || new Date().toISOString() };
  fs.writeFileSync(abs, JSON.stringify(body, null, 2) + "\n", "utf8");
  return abs.replace(/\\/g, "/");
}

/**
 * Next round number from history + existing run-latest.
 * When bump=true (default for fill batch close), always increment past current.
 * @param {string} root
 * @param {object|null} [existing]
 * @param {{ bump?: boolean }} [opts]
 */
export function nextRound(root, existing = null, opts = {}) {
  const hist = readScoreHistory(root, 100);
  let max = 0;
  for (const h of hist) {
    if (typeof h.round === "number" && h.round > max) max = h.round;
  }
  const cur = typeof existing?.round === "number" ? existing.round : 0;
  if (opts.bump) return Math.max(max, cur) + 1;
  if (typeof existing?.round === "number") return existing.round;
  return max > 0 ? max + 1 : 1;
}

/**
 * Ensure a run object with non-null round; optionally persist.
 * @param {string} root
 * @param {object|null} run
 * @param {{ persist?: boolean, note?: string, bump?: boolean }} [opts]
 */
export function ensureRunWithRound(root, run, opts = {}) {
  const existing = run || loadRunLatest(root);
  const out = {
    ...(existing && typeof existing === "object" ? existing : {}),
    round: nextRound(root, existing, { bump: !!opts.bump }),
    note: opts.note || existing?.note || "auto",
  };
  if (opts.persist !== false) writeRunLatest(root, out);
  return out;
}

/**
 * Fill-batch close: always bump round and persist.
 * @param {string} root
 * @param {{ note?: string, written?: number, merged?: number, unchanged?: number }} [stats]
 */
export function bumpRunRound(root, stats = {}) {
  const existing = loadRunLatest(root);
  const out = {
    ...(existing && typeof existing === "object" ? existing : {}),
    round: nextRound(root, existing, { bump: true }),
    note: stats.note || "fill-batch",
    written: stats.written ?? existing?.written ?? null,
    merged: stats.merged ?? existing?.merged ?? null,
    unchanged: stats.unchanged ?? existing?.unchanged ?? null,
    at: new Date().toISOString(),
  };
  writeRunLatest(root, out);
  return out;
}
