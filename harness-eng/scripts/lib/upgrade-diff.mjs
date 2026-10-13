/**
 * 0.7.38 G-up-ready-regress: machine-readable upgrade strictness diff.
 * Does not rewrite user truth docs. fill-score is --json only (no --output).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_SCRIPTS = path.resolve(__dirname, "..");
const SCORE_REL = path.join("docs", "harness-eng", "score-latest.json");
const DIFF_REL = path.join("docs", "harness-eng", "upgrade-diff.json");

/**
 * @param {string[]|null|undefined} before
 * @param {string[]|null|undefined} after
 * @returns {{ added: string[], removed: string[], unchanged: string[] }}
 */
export function diffBlockers(before, after) {
  const a = new Set((before || []).map(String));
  const b = new Set((after || []).map(String));
  const added = [...b].filter((x) => !a.has(x)).sort();
  const removed = [...a].filter((x) => !b.has(x)).sort();
  const unchanged = [...a].filter((x) => b.has(x)).sort();
  return { added, removed, unchanged };
}

/**
 * Union of ai_coding_ready.blockers + acceptance.blockers from a score report.
 * @param {object|null} report
 * @returns {string[]}
 */
export function collectScoreBlockers(report) {
  if (!report || typeof report !== "object") return [];
  const ai = report.ai_coding_ready?.blockers;
  const acc = report.acceptance?.blockers;
  const out = new Set();
  for (const x of [...(Array.isArray(ai) ? ai : []), ...(Array.isArray(acc) ? acc : [])]) {
    if (x != null && String(x).trim()) out.add(String(x));
  }
  return [...out].sort();
}

function loadScoreLatest(root) {
  const p = path.join(root, SCORE_REL);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function parseFillScoreJson(stdout) {
  const i = String(stdout || "").indexOf("{");
  const j = String(stdout || "").lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(stdout.slice(i, j + 1));
  } catch {
    return null;
  }
}

/**
 * @param {string} root
 * @param {{ dryRun?: boolean }} [opts]
 * @returns {object}
 */
export function emitUpgradeStrictnessDiff(root, opts = {}) {
  const absRoot = path.resolve(root);
  const beforeReport = loadScoreLatest(absRoot);
  const before = collectScoreBlockers(beforeReport);
  const payload = {
    ok: true,
    skill_version: "0.7.38",
    before,
    after: [],
    added: [],
    removed: [],
    unchanged: [],
    had_score_latest: !!beforeReport,
    score_error: null,
    ready_before: beforeReport?.ai_coding_ready?.ok ?? null,
    ready_after: null,
    note: "升严不自动改用户文档；对照 docs/harness-eng/upgrade-diff.json",
  };

  if (opts.dryRun) {
    payload.ok = true;
    payload.note = "dry-run: skipped fill-score";
    return payload;
  }

  const script = path.join(SKILL_SCRIPTS, "fill-score.mjs");
  const r = spawnSync(process.execPath, [script, "--root", absRoot, "--json", "--no-write"], {
    encoding: "utf8",
    cwd: absRoot,
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true,
  });
  const afterReport = parseFillScoreJson(r.stdout);
  if (!afterReport) {
    payload.ok = false;
    payload.score_error = String(r.stderr || r.stdout || "fill-score produced no JSON").slice(0, 800);
  } else {
    payload.after = collectScoreBlockers(afterReport);
    payload.ready_after = afterReport.ai_coding_ready?.ok ?? null;
    const d = diffBlockers(before, payload.after);
    payload.added = d.added;
    payload.removed = d.removed;
    payload.unchanged = d.unchanged;
  }

  try {
    const outAbs = path.join(absRoot, DIFF_REL);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, JSON.stringify(payload, null, 2), "utf8");
    payload.out_path = DIFF_REL;
  } catch (e) {
    payload.ok = false;
    payload.score_error = payload.score_error || `write upgrade-diff: ${e.message}`;
  }

  const line = [
    `harness: upgrade 升严差分 added=${payload.added.length} removed=${payload.removed.length}` +
      (payload.score_error ? ` score_error` : ""),
    `  ready ${payload.ready_before === true ? "YES" : payload.ready_before === false ? "NO" : "?"} → ${
      payload.ready_after === true ? "YES" : payload.ready_after === false ? "NO" : "?"
    }`,
    payload.added.length ? `  added: ${payload.added.join(" · ")}` : "  added: (none)",
    `  落盘 ${DIFF_REL}（不自动改用户文档）`,
  ].join("\n");
  console.error(line);
  console.error(JSON.stringify(payload));
  return payload;
}
