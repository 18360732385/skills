/**
 * 0.7.38 G-up-ready-regress: machine-readable upgrade strictness diff.
 * 0.7.41: skill_version from manifest SSOT; doc_todos handoff (no auto doc rewrite).
 * Does not rewrite user truth docs. fill-score is --json only (no --output).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { readSkillVersion } from "./skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_SCRIPTS = path.resolve(__dirname, "..");
const SKILL_ROOT = path.resolve(__dirname, "../..");
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

/**
 * Map newly added blockers to human-readable doc migration TODOs (handoff only).
 * @param {string[]|null|undefined} addedBlockers
 * @returns {string[]}
 */
export function buildDocTodos(addedBlockers) {
  const added = (addedBlockers || []).map(String);
  if (!added.length) return [];
  const todos = [];
  const seen = new Set();
  const push = (s) => {
    if (!seen.has(s)) {
      seen.add(s);
      todos.push(s);
    }
  };
  let unknown = false;
  for (const b of added) {
    if (
      b === "coverage_ready" ||
      b.includes("covered_gt") ||
      b.startsWith("inventory_undercount")
    ) {
      push(
        "coverage / covered_gt：对照 fill-score 分域 coverage_gaps，补齐 docs/{api,func,db,redis,jobs} 覆盖或收窄 inventory；勿靠假绿"
      );
    } else if (b.includes("doc_task_drift") || b.includes("doc_schedule_drift")) {
      push("jobs：对齐 docs/jobs/ 与源码 @Scheduled task id / cron（doc_task_drift / doc_schedule_drift）");
    } else if (b.includes("doc_path_drift")) {
      push("api：对齐 docs/api 接口路径与 Controller（doc_path_drift）");
    } else if (b.includes("doc_field_drift")) {
      push("db/api：对齐字段文档与 live inventory / DTO（doc_field_drift）");
    } else {
      unknown = true;
    }
  }
  if (unknown) {
    push(
      `对照 docs/harness-eng/upgrade-diff.json 的 added blockers，手改真相文档后重跑 fill-score：${added.join(" · ")}`
    );
  }
  return todos;
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
    skill_version: readSkillVersion(SKILL_ROOT),
    before,
    after: [],
    added: [],
    removed: [],
    unchanged: [],
    doc_todos: [],
    ready_regressed: false,
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

  payload.ready_regressed =
    payload.ready_before === true && payload.ready_after === false;
  payload.doc_todos = buildDocTodos(payload.added);
  if (payload.ready_regressed && !payload.doc_todos.length) {
    payload.doc_todos = [
      "ready YES→NO：对照 upgrade-diff.json before/after blockers，手改真相文档后重跑 fill-score（升严不自动改文档）",
    ];
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
      (payload.score_error ? ` score_error` : "") +
      (payload.ready_regressed ? ` ready_regressed` : ""),
    `  ready ${payload.ready_before === true ? "YES" : payload.ready_before === false ? "NO" : "?"} → ${
      payload.ready_after === true ? "YES" : payload.ready_after === false ? "NO" : "?"
    }`,
    payload.added.length ? `  added: ${payload.added.join(" · ")}` : "  added: (none)",
    `  落盘 ${DIFF_REL}（不自动改用户文档）`,
  ];
  if (payload.ready_regressed || payload.added.length) {
    line.push("  文档迁移 TODO（手改；升严不自动改用户文档）：");
    for (const t of payload.doc_todos) line.push(`    - ${t}`);
  }
  console.error(line.join("\n"));
  console.error(JSON.stringify(payload));
  return payload;
}
