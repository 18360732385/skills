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
import { parse as parseYaml } from "./yaml.mjs";
import { parseMetaDomains, defaultContractDomains } from "./domains.mjs";

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
    const meta = parseYaml(fs.readFileSync(found.abs, "utf8")) || {};
    const doms = parseMetaDomains(meta);
    if (Array.isArray(doms) && doms.length) return doms;
  } catch {
    /* fall through */
  }
  return defaultContractDomains().filter((d) => d === "api" || d === "func");
}

function parseFillScoreJson(stdout) {
  const i = stdout.indexOf("{");
  const j = stdout.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(stdout.slice(i, j + 1));
  } catch {
    return null;
  }
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

  const inventoryDomains = domains.filter((d) =>
    ["api", "func", "db", "redis", "jobs"].includes(d)
  );

  for (const d of inventoryDomains) {
    if (dryRun) {
      steps.push({ step: "inventory", domain: d, skipped: "dry-run" });
      continue;
    }
    const r = runNode(
      "fill-inventory.mjs",
      ["--domain", d, "--root", absRoot],
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

  const ready = !!(scoreReport && scoreReport.ai_coding_ready && scoreReport.ai_coding_ready.ok);
  const blockers = scoreReport?.ai_coding_ready?.blockers || [];
  const fillPlanPath = path.join(absRoot, "docs", "harness-eng", "fill-plan.yaml");
  const hints = [];
  if (!ready && fs.existsSync(fillPlanPath)) {
    hints.push(
      "覆盖/语义未就绪：检查 docs/harness-eng/fill-plan.yaml；必要时 fill-plan --init 或补开放批次后 fill-merge"
    );
  }

  const exitCode = dryRun ? 0 : ready ? 0 : 2;
  return {
    exitCode,
    report: {
      ok: ready,
      mode: "refresh",
      root: absRoot,
      domains: inventoryDomains,
      ai_coding_ready: ready,
      blockers,
      coverage_source: scoreReport?.coverage_source ?? null,
      score_path: write ? scoreOutRel : null,
      steps,
      acceptance,
      hints,
    },
  };
}

export default { runRefresh };
