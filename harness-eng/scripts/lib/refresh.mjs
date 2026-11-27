/**
 * harness refresh — 契约变更后重建 inventory / acceptance / score（批 D4）。
 *
 * Exit：0 = ai_coding_ready；2 = 跑通但未开干（warn）；1 = 脚本失败（blocker）。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { findHarnessMetaFile } from "./harness-meta.mjs";
import { parseMetaDomains, defaultContractDomains } from "./domains.mjs";
import { readInventoryMeta, writeLastMode } from "./inventory-meta.mjs";
import { inventoryScanDomains } from "./frontend-coverage.mjs";
import { parseFillScoreJson } from "./json-read.mjs";
import { mergeTypeExportNote } from "./merge-type-export-note.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_SCRIPTS = path.resolve(__dirname, "..");

function runNode(scriptRel, argv, cwd) {
  const script = path.join(SKILL_SCRIPTS, scriptRel);
  const r = spawnSync(process.execPath, [script, ...argv], {
    encoding: "utf8",
    cwd,
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    status: r.status == null ? 1 : r.status,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
  };
}

function loadDomains(root) {
  const found = findHarnessMetaFile(root);
  if (!found) return defaultContractDomains().filter((d) => d === "api" || d === "func");
  try {
    // 0.7.24: pass raw YAML string (parseMetaDomains also accepts object)
    const raw = fs.readFileSync(found.abs, "utf8");
    const doms = parseMetaDomains(raw);
    if (Array.isArray(doms) && doms.length) return doms;
  } catch {
    /* fall through */
  }
  return defaultContractDomains().filter((d) => d === "api" || d === "func");
}

/** Replay meta paths for inventory CLI (refresh + fill-score live scan). */
export function inventoryArgv(domain, absRoot, { noWrite = false } = {}) {
  const argv = ["--domain", domain, "--root", absRoot];
  const inv = readInventoryMeta(absRoot);
  if (domain === "api" && inv.api?.controller_root) {
    argv.push("--controller-root", inv.api.controller_root);
  }
  if (domain === "db" && inv.db?.sql_root) {
    argv.push("--sql-root", inv.db.sql_root);
  }
  // 0.7.33 FS-1/G1: replay func --modules from harness-meta
  if (domain === "func" && Array.isArray(inv.func?.modules) && inv.func.modules.length) {
    argv.push("--modules", inv.func.modules.join(","));
  }
  if (noWrite) argv.push("--no-write");
  return argv;
}

/**
 * 0.8.2 patch (D14): scan backend truth docs for changelog placeholder residue.
 * The v{ts} two-step ritual (write placeholder → run new_changelog_version.py)
 * leaves `PLACEHOLDER` / literal `v{ts}` rows behind when a session drops; refresh
 * surfaces them as non-blocking warnings instead of silently shipping stale rows.
 * @param {string} root
 * @param {string[]} domains backend contract domains to scan
 * @returns {{ file: string, kind: string, line_snippet: string }[]}
 */
export function scanChangelogPlaceholders(root, domains) {
  const absRoot = path.resolve(root);
  const warns = [];
  const doms = (Array.isArray(domains) ? domains : []).filter((d) =>
    ["api", "db", "redis", "jobs", "func"].includes(d)
  );
  for (const d of doms) {
    const dir = path.join(absRoot, "docs", d);
    let files = [];
    try {
      files = fs.readdirSync(dir).filter((n) => n.endsWith(".md"));
    } catch {
      continue;
    }
    for (const name of files) {
      let text = "";
      try {
        text = fs.readFileSync(path.join(dir, name), "utf8");
      } catch {
        continue;
      }
      const rel = `docs/${d}/${name}`;
      // 只查表行（| 开头）：避免把正文/代码块里的示例文本误报
      for (const line of text.split(/\r?\n/)) {
        if (!/^\|/.test(line)) continue;
        if (/PLACEHOLDER/i.test(line) || /v\{ts\}|P\{ts\}/.test(line)) {
          warns.push({
            file: rel,
            kind: "changelog_placeholder",
            line_snippet: line.trim().slice(0, 80),
          });
          break; // 每文件报一条，避免刷屏
        }
      }
    }
  }
  return warns;
}

/**
 * @param {string} root
 * @param {{ write?: boolean, dryRun?: boolean }} [opts]
 * @returns {{ exitCode: number, report: object }}
 */
export function runRefresh(root, opts = {}) {
  const write = opts.write !== false;
  const dryRun = !!opts.dryRun;
  const absRoot = path.resolve(root);
  const steps = [];
  const domains = loadDomains(absRoot);

  const inventoryDomains = inventoryScanDomains(domains);

  for (const d of inventoryDomains) {
    if (dryRun) {
      steps.push({ step: "inventory", domain: d, skipped: "dry-run" });
      continue;
    }
    // 0.7.31 ID-3: --no-write → inventory --no-write (no files / no meta)
    const r = runNode(
      "fill-inventory.mjs",
      inventoryArgv(d, absRoot, { noWrite: !write }),
      absRoot
    );
    steps.push({
      step: "inventory",
      domain: d,
      status: r.status,
      stderr_tail: (r.stderr || "").slice(-400),
    });
    // api/func 失败不立即 abort（无代码时常见）；记录即可
  }

  let acceptance = { ok: null, status: null };
  if (!dryRun) {
    const ar = runNode(
      "acceptance-check.mjs",
      ["--root", absRoot, "--domain", "all"],
      absRoot
    );
    acceptance = { status: ar.status, stdout_tail: (ar.stdout || "").slice(-500) };
    steps.push({ step: "acceptance", status: ar.status });
  } else {
    steps.push({ step: "acceptance", skipped: "dry-run" });
  }

  const scoreOutRel = path.join("docs", "harness-eng", "score-latest.json");
  const scoreOutAbs = path.join(absRoot, scoreOutRel);
  let scoreReport = null;
  if (!dryRun) {
    const scoreArgv = ["--root", absRoot, "--json"];
    if (write) {
      scoreArgv.push("--output", scoreOutAbs);
    }
    const sr = runNode("fill-score.mjs", scoreArgv, absRoot);
    scoreReport = parseFillScoreJson(sr.stdout);
    // 0.7.24 belt: if stdout empty but --output wrote the file, read it
    if (!scoreReport && write && fs.existsSync(scoreOutAbs)) {
      try {
        scoreReport = JSON.parse(fs.readFileSync(scoreOutAbs, "utf8"));
      } catch {
        /* keep null */
      }
    }
    steps.push({
      step: "fill-score",
      status: sr.status,
      output: write ? scoreOutRel : null,
      coverage_source: scoreReport?.coverage_source ?? null,
    });
    if (sr.status !== 0 && !scoreReport) {
      return {
        exitCode: 1,
        report: {
          ok: false,
          reason: "fill-score_failed",
          steps,
          acceptance,
          stderr: sr.stderr?.slice(-800),
        },
      };
    }
  } else {
    steps.push({ step: "fill-score", skipped: "dry-run" });
  }

  let scoreSource = scoreReport ? "scored" : null;
  if (dryRun && !scoreReport && fs.existsSync(scoreOutAbs)) {
    try {
      scoreReport = JSON.parse(fs.readFileSync(scoreOutAbs, "utf8"));
      scoreSource = "disk";
    } catch {
      /* keep null */
    }
  }
  const ready = scoreReport
    ? !!(scoreReport.ai_coding_ready && scoreReport.ai_coding_ready.ok)
    : null;
  const blockers = scoreReport?.ai_coding_ready?.blockers || [];
  const fillPlanPath = path.join(absRoot, "docs", "harness-eng", "fill-plan.yaml");
  const hints = [];
  const orphanDomains = Object.entries(scoreReport?.coverage_audit?.by_domain || {})
    .filter(([, row]) => row && row.orphan_count > 0)
    .map(([d, row]) => `${d}:${row.orphan_count}`);
  if (orphanDomains.length) {
    hints.push(
      `coverage-audit 有旧 unit_id 不在当前清单（文件可能改名）：${orphanDomains.join("、")}；` +
        "请用 scripts/reconcile-audit.mjs 按 evidence_path 对账（默认 dry-run，加 --write 才迁 id；refresh 不会自动搬移）"
    );
  }
  if (dryRun) {
    hints.push("未计分 / dry-run 未跑门禁（跳过 inventory、acceptance、fill-score）");
    if (scoreSource === "disk") {
      hints.push("ai_coding_ready 回读自磁盘 score-latest.json，不代表本轮门禁结果");
    }
  }
  if (!dryRun && ready === false && fs.existsSync(fillPlanPath)) {
    hints.push(
      "覆盖/语义未就绪：检查 docs/harness-eng/fill-plan.yaml；必要时 fill-plan --init 或补开放批次后 fill-merge"
    );
  }
  const typeExport = mergeTypeExportNote(absRoot, { write: false });
  if (typeExport.action === "would_merge") {
    hints.push(typeExport.note || "索引缺失 type_export 说明");
  }
  // 0.8.2 patch (D14): changelog placeholder residue is non-blocking, but visible.
  const placeholderWarns = scanChangelogPlaceholders(absRoot, domains);
  if (placeholderWarns.length) {
    hints.push(
      `变更记录有未分配版本号的占位残留（PLACEHOLDER / v{ts}，D14）：${placeholderWarns.length} 个文件；` +
        `跑 scripts/new_changelog_version.py 补号或手工补齐后再提交`
    );
  }
  if (!dryRun && write && scoreReport && fs.existsSync(scoreOutAbs)) {
    const hr = runNode(
      "fill-report-html.mjs",
      ["--root", absRoot, "--score", scoreOutAbs],
      absRoot
    );
    steps.push({
      step: "fill-report-html",
      status: hr.status,
      stderr_tail: (hr.stderr || "").slice(-400),
    });
    if (hr.status !== 0) {
      hints.push(
        "report-latest.html 未刷新：" +
          (hr.stderr || hr.stdout || "fill-report-html failed").trim().slice(-200)
      );
    }
  }

  // 0.8.13: refresh is a mode change too; keep harness-meta.last_mode honest.
  if (!dryRun && write) writeLastMode(absRoot, "refresh");

  const exitCode = dryRun ? 0 : ready ? 0 : 2;
  return {
    exitCode,
    report: {
      ok: dryRun ? true : !!ready,
      mode: "refresh",
      root: absRoot,
      domains: inventoryDomains,
      dry_run: dryRun,
      scored: !dryRun,
      ai_coding_ready: ready,
      ai_coding_ready_source: dryRun ? scoreSource || "none" : "scored",
      blockers,
      coverage_source: scoreReport?.coverage_source ?? null,
      score_path: write ? scoreOutRel : null,
      steps,
      acceptance,
      hints,
      // 0.8.2 patch (D14): residue list for report shells (non-blocking).
      changelog_placeholder_warnings: placeholderWarns,
    },
  };
}

export default { runRefresh };
