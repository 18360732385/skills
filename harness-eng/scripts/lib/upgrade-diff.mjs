/**
 * 0.7.38 G-up-ready-regress: machine-readable upgrade strictness diff.
 * 0.7.41: skill_version from manifest SSOT; doc_todos handoff.
 * 0.7.44: default structured migrate-docs (AUTO); --no-migrate-docs keeps handoff-only.
 * fill-score is --json only (no --output).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { readSkillVersion } from "./skill-version.mjs";
import { runMigrateDocs } from "./migrate-docs.mjs";

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
    } else if (b.includes("doc_key_drift")) {
      push("redis：对齐 docs/redis/keys 与 inventory Key 模式（doc_key_drift）");
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

function runFillScoreJson(absRoot) {
  const script = path.join(SKILL_SCRIPTS, "fill-score.mjs");
  const r = spawnSync(process.execPath, [script, "--root", absRoot, "--json", "--no-write"], {
    encoding: "utf8",
    cwd: absRoot,
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    report: parseFillScoreJson(r.stdout),
    stderr: String(r.stderr || r.stdout || ""),
  };
}

/**
 * Normalize migrateDocs mode from opts.
 * @param {{ dryRun?: boolean, migrateDocs?: string|boolean }} opts
 * @returns {'auto'|'off'|'dry-run'}
 */
export function resolveMigrateDocsMode(opts = {}) {
  if (opts.dryRun) return "dry-run";
  const m = opts.migrateDocs;
  if (m === false || m === "off" || m === "false" || m === "no") return "off";
  if (m === "dry-run" || m === "dryrun") return "dry-run";
  return "auto";
}

/**
 * @param {string} root
 * @param {{ dryRun?: boolean, migrateDocs?: string|boolean }} [opts]
 * @returns {object}
 */
export function emitUpgradeStrictnessDiff(root, opts = {}) {
  const absRoot = path.resolve(root);
  const migrateMode = resolveMigrateDocsMode(opts);
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
    migrate_docs: { mode: migrateMode, applied: [], skipped: [] },
    note:
      migrateMode === "off"
        ? "升严不自动改用户文档（--no-migrate-docs）；对照 docs/harness-eng/upgrade-diff.json"
        : migrateMode === "dry-run"
          ? "升严 migrate-docs=dry-run：只预览结构化补丁，不写真相文档"
          : "升严默认自动结构化迁移真相文档（path/field/task/schedule/key）；coverage 仍移交；--no-migrate-docs 可退出",
  };

  // Backward-compat: opts.dryRun (no migrateDocs) skips fill-score entirely (selfcheck / harness).
  // Explicit migrateDocs='dry-run' still scores and plans patches without writing docs.
  if (opts.dryRun && opts.migrateDocs == null) {
    payload.ok = true;
    payload.note = "dry-run: skipped fill-score";
    return payload;
  }

  const first = runFillScoreJson(absRoot);
  if (!first.report) {
    payload.ok = false;
    payload.score_error = first.stderr.slice(0, 800) || "fill-score produced no JSON";
  } else {
    payload.after = collectScoreBlockers(first.report);
    payload.ready_after = first.report.ai_coding_ready?.ok ?? null;
    const d = diffBlockers(before, payload.after);
    payload.added = d.added;
    payload.removed = d.removed;
    payload.unchanged = d.unchanged;
  }

  payload.ready_regressed =
    payload.ready_before === true && payload.ready_after === false;

  const shouldMigrate =
    migrateMode !== "off" &&
    (payload.ready_regressed || payload.added.length > 0 || payload.after.length > 0);

  if (shouldMigrate) {
    const migrateBlockers =
      payload.added.length > 0 ? payload.added : payload.after;
    const mig = runMigrateDocs(absRoot, {
      mode: migrateMode,
      blockers: migrateBlockers,
    });
    payload.migrate_docs = {
      mode: migrateMode,
      applied: mig.applied || [],
      skipped: mig.skipped || [],
      errors: mig.errors || [],
      ops: mig.plan?.ops?.length ?? 0,
    };

    if (migrateMode === "auto" && (mig.applied || []).some((a) => a.action !== "noop")) {
      const second = runFillScoreJson(absRoot);
      if (second.report) {
        payload.after = collectScoreBlockers(second.report);
        payload.ready_after = second.report.ai_coding_ready?.ok ?? null;
        const d2 = diffBlockers(before, payload.after);
        payload.added = d2.added;
        payload.removed = d2.removed;
        payload.unchanged = d2.unchanged;
        payload.ready_regressed =
          payload.ready_before === true && payload.ready_after === false;
      } else {
        payload.score_error =
          payload.score_error ||
          `post-migrate fill-score: ${second.stderr.slice(0, 400)}`;
      }
    }
  }

  payload.doc_todos = buildDocTodos(payload.added);
  if (payload.ready_regressed && !payload.doc_todos.length) {
    payload.doc_todos = [
      migrateMode === "off"
        ? "ready YES→NO：对照 upgrade-diff.json before/after blockers，手改真相文档后重跑 fill-score（--no-migrate-docs）"
        : "ready YES→NO：结构化 migrate-docs 未能消尽 blockers；对照 upgrade-diff.json / migrate-docs-report.json 手改残留后重跑 fill-score",
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

  const migApplied = (payload.migrate_docs.applied || []).filter(
    (a) => a.action && a.action !== "noop"
  ).length;
  const line = [
    `harness: upgrade 升严差分 added=${payload.added.length} removed=${payload.removed.length}` +
      (payload.score_error ? ` score_error` : "") +
      (payload.ready_regressed ? ` ready_regressed` : "") +
      (migrateMode !== "off" ? ` migrate_docs=${migrateMode} applied=${migApplied}` : " migrate_docs=off"),
    `  ready ${payload.ready_before === true ? "YES" : payload.ready_before === false ? "NO" : "?"} → ${
      payload.ready_after === true ? "YES" : payload.ready_after === false ? "NO" : "?"
    }`,
    payload.added.length ? `  added: ${payload.added.join(" · ")}` : "  added: (none)",
    `  落盘 ${DIFF_REL}` +
      (migrateMode === "auto"
        ? "（默认已尝试结构化 migrate-docs）"
        : migrateMode === "dry-run"
          ? "（migrate-docs dry-run，未写真相文档）"
          : "（--no-migrate-docs，不自动改用户文档）"),
  ];
  if (payload.ready_regressed || payload.added.length) {
    line.push(
      migrateMode === "off"
        ? "  文档迁移 TODO（手改）："
        : "  残留文档迁移 TODO（migrate-docs 未消尽 / coverage 类）："
    );
    for (const t of payload.doc_todos) line.push(`    - ${t}`);
  }
  console.error(line.join("\n"));
  console.error(JSON.stringify(payload));
  return payload;
}
