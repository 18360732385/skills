/**
 * score-history.jsonl — append-only score snapshots for Dashboard trend (0.2.14+).
 * Path: docs/harness-eng/score-history.jsonl
 * 0.4.0: entries carry report_schema + morph_scale; incomparable points greyed / not linked.
 */

import fs from "fs";
import path from "path";

export const HISTORY_REL = "docs/harness-eng/score-history.jsonl";
export const DEFAULT_LIMIT = 20;
export const CURRENT_REPORT_SCHEMA = "0.4.0";

/**
 * Compare dotted version strings (e.g. 0.3.0 vs 0.4.0).
 * @returns {number} negative if a<b, 0 if equal, positive if a>b
 */
export function cmpSchema(a, b) {
  const pa = String(a || "0")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "0")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

/**
 * @param {object} entry
 * @param {object} [ctx]
 * @param {string} [ctx.currentSchema]
 * @param {string} [ctx.currentMorphScale]
 */
export function isIncomparablePoint(entry, ctx = {}) {
  const wantSchema = ctx.currentSchema || CURRENT_REPORT_SCHEMA;
  const wantMorph = ctx.currentMorphScale || "0.7";
  const schema = entry?.report_schema;
  if (!schema || cmpSchema(schema, wantSchema) < 0) return true;
  const morph = entry?.morph_scale;
  if (morph != null && String(morph) !== String(wantMorph)) return true;
  return false;
}

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
    report_schema: ctx.report_schema || CURRENT_REPORT_SCHEMA,
    morph_scale: s.morph_scale || ctx.morph_scale || "0.7",
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
 * Marks incomparable points; comparable subset used for delta.
 * @param {object[]} history
 * @param {object} [currentEntry]
 * @param {number} [limit]
 * @param {object} [opts]
 */
export function buildTrendSeries(history, currentEntry = null, limit = DEFAULT_LIMIT, opts = {}) {
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

  const schemaCtx = {
    currentSchema: opts.currentSchema || CURRENT_REPORT_SCHEMA,
    currentMorphScale:
      opts.currentMorphScale ||
      currentEntry?.morph_scale ||
      "0.7",
  };

  const incomparable = pts.map((p) => isIncomparablePoint(p, schemaCtx));
  const comparableOverall = pts.map((p, i) =>
    incomparable[i] ? null : typeof p.overall === "number" ? p.overall : null
  );
  const comparableCoverage = pts.map((p, i) =>
    incomparable[i]
      ? null
      : typeof p.coverage_percent === "number"
        ? p.coverage_percent
        : null
  );

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
    /** Values used for line segments (null = break / skip link). */
    overall_linkable: comparableOverall,
    coverage_linkable: comparableCoverage,
    ready: pts.map((p) => !!p.ready),
    report_schema: pts.map((p) => p.report_schema || null),
    morph_scale: pts.map((p) => p.morph_scale || null),
    incomparable,
    points: pts,
  };
}
