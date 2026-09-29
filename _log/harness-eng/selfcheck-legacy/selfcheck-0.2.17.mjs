#!/usr/bin/env node
/**
 * Lightweight 0.2.17 selfcheck: L4+agents defaults, fill-plan, ai_coding_ready, dto bind.
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

// --- docs / modes ---
assert(fs.existsSync(path.join(skillRoot, "fill-plan.md")), "fill-plan.md");
assert(fs.existsSync(path.join(skillRoot, "scripts/fill-plan.mjs")), "fill-plan.mjs");

const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(/0\.2\.17/.test(skill) && /fill-plan/.test(skill), "SKILL 0.2.17+fill-plan");
assert(/ai_coding_ready/.test(skill) && /agents/.test(skill), "SKILL ai_coding+agents");

const pipeline = fs.readFileSync(path.join(skillRoot, "pipeline.md"), "utf8");
assert(/默认 \*\*L4\*\*|目标 \*\*L4\*\*|默认目标阶 = L4|目标阶梯 \| \*\*L4\*\*/.test(pipeline), "pipeline default L4");
assert(/fill_engine=agents|Q_FILL_ENGINE.*agents|默认.*agents/.test(pipeline), "pipeline agents");
assert(/fill-plan/.test(pipeline) && /ai_coding_ready/.test(pipeline), "pipeline plan+ai_coding");
assert(/跳过.*fill-truths-auto|禁止.*SSOT|legacy/.test(pipeline), "pipeline skips auto SSOT");

const profile = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
assert(/默认 \*\*L4\*\*|默认 \*\*agents\*\*/.test(profile), "recommended-profile L4+agents");

const autoMd = fs.readFileSync(path.join(skillRoot, "fill-truths-auto.md"), "utf8");
assert(/legacy|不推荐|work-only/.test(autoMd), "auto marked legacy");

const fillMd = fs.readFileSync(path.join(skillRoot, "fill.md"), "utf8");
assert(/agents【推荐】|引擎=agents|fill_engine=agents/.test(fillMd) || /agents.*推荐/.test(fillMd), "fill.md agents default");

// --- questions ---
const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/version:\s*"0\.2\.17"/.test(qYaml), "questions.yaml 0.2.17");
assert(/recommended:\s*agents/.test(qYaml), "Q_FILL_ENGINE recommended agents");
assert(/L4.*recommended_when|value:\s*L4,\s*label:.*recommended_when/.test(qYaml), "L4 recommended");
assert(!/value:\s*L2,\s*label:.*recommended_when:\s*"large_repo"/.test(qYaml), "L2 not large_repo default");
assert(/fill-plan/.test(qYaml), "Q_MODE fill-plan");

const qMd = fs.readFileSync(path.join(skillRoot, "questions.md"), "utf8");
assert(/agents【推荐】|agents.*大仓推荐/.test(qMd), "questions.md agents");
assert(/L4/.test(qMd), "questions.md L4");

// --- version ---
const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.17"/.test(manifest), "manifest 0.2.17");
const metaTmpl = fs.readFileSync(path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"), "utf8");
assert(/skill_version:\s*"0\.2\.17"/.test(metaTmpl), "harness-meta skill_version 0.2.17");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
assert(/## 0\.2\.17/.test(changelog), "CHANGELOG 0.2.17");

// --- score + report-ui ---
const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
assert(/ai_coding_ready/.test(scoreSrc), "fill-score ai_coding_ready");
assert(/skeleton_ready|semantic_ready|loadFillPlanSummary/.test(scoreSrc), "fill-score layered ready");

const dtoSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-dto-batch.mjs"), "utf8");
assert(/binding gate|declaring endpoint|0\.2\.17/.test(dtoSrc), "dto-batch binding gate");

const fillScoreMd = fs.readFileSync(path.join(skillRoot, "fill-score.md"), "utf8");
assert(/ai_coding_ready/.test(fillScoreMd), "fill-score.md ai_coding");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
assert(scoreObj.ai_coding_ready && scoreObj.ai_coding_ready.ok === false, "fixture ai_coding false");
assert(scoreObj.fill_plan && scoreObj.fill_plan.open_total > 0, "fixture fill_plan open");

const ui = buildReportUi(scoreObj);
assert(ui.version === "0.2.17", "ui.version 0.2.17");
assert(ui.verdict.ready_label !== "建议可以开干", "ui not go when ai_coding false");
assert(/fill-plan|semantic|ai_coding|暂缓|骨架\/覆盖/.test(ui.verdict.ready_label + ui.headline), "ui headline/verdict 0.2.17");
assert(ui.glossary.some((g) => g.id === "ai_coding_ready"), "glossary ai_coding_ready");
assert(!/fill-truths-auto\.mjs --root <TARGET> --merge &&/.test(JSON.stringify(ui.next_actions)), "next_actions not default auto merge");

const glossary = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
assert(/ai_coding_ready/.test(glossary) && /大仓常见起步：\*\*L4\*\*/.test(glossary), "glossary L4+ai_coding");

const qs = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
assert(/selfcheck-0\.2\.17|fill_engine=agents|ai_coding_ready/.test(qs), "QUICKSTART 0.2.17");

// --- smoke: score emits field ---
const smsRoot = path.resolve("D:/workspace/git-company/sms2023-backend");
if (fs.existsSync(path.join(smsRoot, "docs/api"))) {
  const r = spawnSync(
    process.execPath,
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
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
  );
  assert(r.status === 0, "fill-score exit 0 on sms");
  assert(/ai_coding_ready/.test(r.stdout || ""), "fill-score stdout has ai_coding_ready");
} else {
  ok.push("skip live fill-score (sms root missing)");
}

// --- fill-plan --help ---
{
  const r = spawnSync(
    process.execPath,
    [path.join(skillRoot, "scripts/fill-plan.mjs"), "--help"],
    { encoding: "utf8" }
  );
  assert(r.status === 0 || /Usage:|fill-plan/.test(r.stdout + r.stderr), "fill-plan --help");
}

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  ✓ ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  ✗ ${m}`);
  process.exit(1);
}
console.log("selfcheck-0.2.17 PASS");
