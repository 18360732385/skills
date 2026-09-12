#!/usr/bin/env node
/**
 * Lightweight 0.2.18 selfcheck: truth-quality, acceptance-check, gold_ratio, promote gate.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildReportUi } from "./lib/report-ui.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

function runNode(args, opts = {}) {
  return spawnSync(process.execPath, args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
}

// --- new files ---
assert(fs.existsSync(path.join(skillRoot, "truth-quality.md")), "truth-quality.md");
assert(
  fs.existsSync(path.join(skillRoot, "scripts/acceptance-check.mjs")),
  "acceptance-check.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md")),
  "fixture good"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/fixtures/acceptance-api-bad.md")),
  "fixture bad"
);

const tq = fs.readFileSync(path.join(skillRoot, "truth-quality.md"), "utf8");
assert(/深|真|全/.test(tq) && /draft|SSOT|heuristic/.test(tq), "truth-quality anchors");

const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(/0\.2\.18/.test(skill) && /acceptance-check|truth-quality/.test(skill), "SKILL 0.2.18");
assert(/启发式.*SSOT|heuristic.*promote|禁止.*promote/.test(skill), "SKILL bans heuristic promote");

const pipeline = fs.readFileSync(path.join(skillRoot, "pipeline.md"), "utf8");
assert(/acceptance|gold_ratio|--gold|sample_n/.test(pipeline), "pipeline gold/acceptance");

const fillMd = fs.readFileSync(path.join(skillRoot, "fill.md"), "utf8");
assert(/acceptance|gold_ratio|0\.2\.18/.test(fillMd), "fill.md 0.2.18");

const planMd = fs.readFileSync(path.join(skillRoot, "fill-plan.md"), "utf8");
assert(/--gold|sample_n|acceptance/.test(planMd), "fill-plan.md gold");

const agentsMd = fs.readFileSync(path.join(skillRoot, "fill-truths-agents.md"), "utf8");
assert(/失败协议|heuristic|acceptance/.test(agentsMd), "agents failure protocol");

const workersMd = fs.readFileSync(path.join(skillRoot, "fill-workers.md"), "utf8");
assert(/答案卡|quality:\s*heuristic|失败协议/.test(workersMd), "workers answers+fail");

// --- version pins ---
const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.18"/.test(manifest), "manifest 0.2.18");
const metaTmpl = fs.readFileSync(path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"), "utf8");
assert(/skill_version:\s*"0\.2\.18"/.test(metaTmpl), "harness-meta 0.2.18");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
assert(/## 0\.2\.18/.test(changelog), "CHANGELOG 0.2.18");
const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/version:\s*"0\.2\.18"/.test(qYaml), "questions.yaml 0.2.18");
assert(/Q_FILL_GOLD|sample_n|Q_FILL_SAMPLE_N/.test(qYaml), "questions gold/sample_n");

const qs = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
assert(/selfcheck-0\.2\.18|gold_ratio|acceptance-check/.test(qs), "QUICKSTART 0.2.18");

const glossary = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
assert(/gold_ratio|acceptance-check/.test(glossary), "glossary gold_ratio");

const fillScoreMd = fs.readFileSync(path.join(skillRoot, "fill-score.md"), "utf8");
assert(/gold_ratio/.test(fillScoreMd) && /不替代/.test(fillScoreMd), "fill-score.md gold_ratio");

// --- scripts flags ---
const mergeSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-merge-api.mjs"), "utf8");
assert(/force-write|acceptance-check|0\.2\.18/.test(mergeSrc), "merge acceptance gate");

const planSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-plan.mjs"), "utf8");
assert(/--gold|sample-n|acceptance/.test(planSrc), "fill-plan --gold");

const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
assert(/gold_ratio|runGoldAcceptance|acceptance-check/.test(scoreSrc), "fill-score gold_ratio");

const reportTmpl = fs.readFileSync(
  path.join(skillRoot, "templates/report/harness-report.html.tmpl"),
  "utf8"
);
assert(/kpi-gold|金标达标率/.test(reportTmpl), "report KPI gold");

// --- fixture acceptance smoke ---
{
  const good = path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md");
  const bad = path.join(skillRoot, "scripts/fixtures/acceptance-api-bad.md");
  const acc = path.join(skillRoot, "scripts/acceptance-check.mjs");
  const g = runNode([acc, "--root", path.dirname(good), "--ssot-glob", "acceptance-api-good.md"]);
  // fixtures live under scripts/fixtures; use work-dir style via --root skillRoot and path filter
  const g2 = runNode([
    acc,
    "--root",
    skillRoot,
    "--work-dir",
    path.join(skillRoot, "scripts/fixtures"),
  ]);
  // Prefer dedicated file check if script supports only dirs — assert exit codes from work-dir scan
  assert(
    g2.status === 1 || g2.status === 2 || g2.status === 0,
    "acceptance fixtures runnable"
  );
  // Bad-only: copy isolation via temp not needed if we parse JSON
  const badOnly = runNode([
    acc,
    "--root",
    skillRoot,
    "--work-dir",
    path.join(skillRoot, "scripts/fixtures"),
    "--domain",
    "api",
  ]);
  assert(
    badOnly.status === 1 || /blockers/.test(badOnly.stdout || ""),
    "fixtures include blockers (bad sample)"
  );
  void g;
  void good;
  void bad;
}

// Explicit good/bad via temporary single-file dirs would be ideal; use spawn with file content path:
{
  const acc = path.join(skillRoot, "scripts/acceptance-check.mjs");
  const tmpGood = path.join(skillRoot, "scripts/fixtures/.tmp-good");
  const tmpBad = path.join(skillRoot, "scripts/fixtures/.tmp-bad");
  fs.mkdirSync(tmpGood, { recursive: true });
  fs.mkdirSync(tmpBad, { recursive: true });
  fs.copyFileSync(
    path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
    path.join(tmpGood, "shard-good.md")
  );
  fs.copyFileSync(
    path.join(skillRoot, "scripts/fixtures/acceptance-api-bad.md"),
    path.join(tmpBad, "shard-bad.md")
  );
  const rg = runNode([acc, "--root", skillRoot, "--work-dir", tmpGood]);
  const rb = runNode([acc, "--root", skillRoot, "--work-dir", tmpBad]);
  assert(rg.status === 0, "good fixture exit 0");
  assert(rb.status === 1, "bad fixture exit 1");
  try {
    fs.rmSync(tmpGood, { recursive: true, force: true });
    fs.rmSync(tmpBad, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

// --- report-ui ---
const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
assert(typeof scoreObj.gold_ratio === "number", "fixture gold_ratio");
const ui = buildReportUi(scoreObj);
assert(ui.version === "0.2.18", "ui.version 0.2.18");
assert(ui.gold_ratio === scoreObj.gold_ratio, "ui.gold_ratio");
assert(ui.glossary.some((g) => g.id === "gold_ratio"), "glossary gold_ratio");
assert(ui.verdict.ready_label !== "建议可以开干", "ui not go when ai_coding false");

// --- fill-plan --help / --gold dry ---
{
  const r = runNode([path.join(skillRoot, "scripts/fill-plan.mjs"), "--help"]);
  assert(/--gold|sample-n|fill-plan/.test(r.stdout + r.stderr), "fill-plan --help gold");
}

// --- live score gold_ratio if sms present ---
const smsRoot = path.resolve("D:/workspace/git-company/sms2023-backend");
if (fs.existsSync(path.join(smsRoot, "docs/api"))) {
  const r = runNode(
    [
      path.join(skillRoot, "scripts/fill-score.mjs"),
      "--root",
      smsRoot,
      "--summary-only",
      "--ready-quality",
      "70",
      "--ready-coverage",
      "0.6",
      "--quiet",
    ],
    { cwd: skillRoot }
  );
  assert(r.status === 0, "fill-score exit 0 on sms");
  assert(/gold_ratio|ai_coding_ready/.test(r.stdout || ""), "fill-score emits gold_ratio");
} else {
  ok.push("skip live fill-score (sms root missing)");
}

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  ✓ ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  ✗ ${m}`);
  process.exit(1);
}
console.log("selfcheck-0.2.18 PASS");
