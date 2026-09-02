/**
 * score-history.jsonl — append-only score snapshots for Dashboard trend (0.2.14+).
 * Path: docs/harness-eng/score-history.jsonl
 */

import fs from "fs";
import path from "path";

export const HISTORY_REL = "docs/harness-eng/score-history.jsonl";
export const DEFAULT_LIMIT = 20;

/**
 * @param {object} score
 * @param {object} [ctx]
 */
export function makeHistoryEntry(score, ctx = {}) {
  const s = score && typeof score === "object" ? score : {};
  const cov = s.coverage || {};
  return {
    at: ctx.at || new Date().toISOString(),
    mode: ctx.mode || null,
    overall: typeof s.overall === "number" ? s.overall : null,
    coverage_percent: typeof cov.percent === "number" ? cov.percent : null,
    ready: s.ready?.ok === true,
    formula_ceiling: typeof s.formula_ceiling === "number" ? s.formula_ceiling : null,
    round: ctx.run?.round ?? ctx.round ?? null,
    written: ctx.run?.written ?? null,
    merged: ctx.run?.merged ?? null,
    unchanged: ctx.run?.unchanged ?? null,
  };
}

/**
 * @param {string} root
 * @param {number} [limit]
 */
export function readScoreHistory(root, limit = DEFAULT_LIMIT) {
  const file = path.join(root, HISTORY_REL);
  if (!fs.existsSync(file)) return [];
  let raw = fs.readFileSync(file, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj && typeof obj === "object") out.push(obj);
    } catch {
      /* skip bad line */
    }
  }
  if (limit > 0 && out.length > limit) return out.slice(-limit);
  return out;
}

/**
 * Append one entry. Creates parent dirs. No secrets.
 * @param {string} root
 * @param {object} entry
 */
export function appendScoreHistory(root, entry) {
  const file = path.join(root, HISTORY_REL);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(file, line, "utf8");
  return file.replace(/\\/g, "/");
}

/**
 * Build series for chart from history entries (+ optional current).
 * @param {object[]} history
 * @param {object} [currentEntry]
 * @param {number} [limit]
 */
export function buildTrendSeries(history, currentEntry = null, limit = DEFAULT_LIMIT) {
  let pts = Array.isArray(history) ? history.slice() : [];
  if (currentEntry) {
    const last = pts[pts.length - 1];
    const same =
      last &&
      last.at === currentEntry.at &&
      last.overall === currentEntry.overall;
    if (!same) pts.push(currentEntry);
  }
  if (limit > 0 && pts.length > limit) pts = pts.slice(-limit);
  return {
    labels: pts.map((p, i) => {
      if (p.round != null) return `r${p.round}`;
      if (p.at) return String(p.at).slice(5, 16).replace("T", " ");
      return `#${i + 1}`;
    }),
    overall: pts.map((p) => (typeof p.overall === "number" ? p.overall : null)),
    coverage: pts.map((p) =>
      typeof p.coverage_percent === "number" ? p.coverage_percent : null
    ),
    ready: pts.map((p) => !!p.ready),
    points: pts,
  };
}