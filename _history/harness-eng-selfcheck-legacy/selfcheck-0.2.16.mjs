#!/usr/bin/env node
/**
 * Lightweight 0.2.16 selfcheck: agents mode, Q_FILL_ENGINE, template_completeness, host mirrors.
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
assert(fs.existsSync(path.join(skillRoot, "fill-truths-agents.md")), "fill-truths-agents.md");
const agentsMd = fs.readFileSync(path.join(skillRoot, "fill-truths-agents.md"), "utf8");
assert(/fill-truths-agents|多 Agent|模板/.test(agentsMd), "agents md content");

const workers = fs.readFileSync(path.join(skillRoot, "fill-workers.md"), "utf8");
assert(/ai_tools|四域|func|redis|workbuddy|CodeBuddy/.test(workers), "fill-workers four domains + ai_tools");

const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(/fill-truths-agents/.test(skill) && /hybrid/.test(skill), "SKILL agents+hybrid");

const pipeline = fs.readFileSync(path.join(skillRoot, "pipeline.md"), "utf8");
assert(/fill-truths-agents|hybrid/.test(pipeline), "pipeline hybrid/agents");
assert(/template_completeness|薄|回退|auto/.test(pipeline), "pipeline auto fallback / tc");

const fillMd = fs.readFileSync(path.join(skillRoot, "fill.md"), "utf8");
assert(/hybrid|fill-truths-agents/.test(fillMd), "fill.md hybrid default");

const autoMd = fs.readFileSync(path.join(skillRoot, "fill-truths-auto.md"), "utf8");
assert(/薄|回退|不.*默认|非.*默认|optional|可选/.test(autoMd), "auto is thin/fallback");

// --- questions ---
const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/Q_FILL_ENGINE/.test(qYaml), "questions.yaml Q_FILL_ENGINE");
assert(/value:\s*hybrid/.test(qYaml), "Q_FILL_ENGINE hybrid option");
const qMd = fs.readFileSync(path.join(skillRoot, "questions.md"), "utf8");
assert(/Q_FILL_ENGINE/.test(qMd), "questions.md Q_FILL_ENGINE");

// --- host align ---
assert(
  fs.existsSync(path.join(skillRoot, "templates/ai-tools/contract-sync-mirror.md.tmpl")),
  "contract-sync-mirror.tmpl"
);
const aiTools = fs.readFileSync(path.join(skillRoot, "ai-tools.md"), "utf8");
assert(/1x-contract-sync|宿主对齐/.test(aiTools), "ai-tools mirror docs");
const renderSrc = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
assert(/CONTRACT_SYNC_MIRRORS|contract-sync-mirror/.test(renderSrc), "render mirrors");
const audit = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
assert(/ai_tools.*镜像|镜像 rules|1x-contract-sync/.test(audit), "audit antipattern host");

// --- version ---
const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.16"/.test(manifest), "manifest 0.2.16");
const metaTmpl = fs.readFileSync(path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"), "utf8");
assert(/skill_version:\s*"0\.2\.16"/.test(metaTmpl), "harness-meta skill_version 0.2.16");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
assert(/## 0\.2\.16/.test(changelog), "CHANGELOG 0.2.16");

// --- template_completeness ---
const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
assert(/template_completeness/.test(scoreSrc), "fill-score template_completeness field");
assert(/missing-req-section/.test(scoreSrc), "fill-score missing-req-section");
assert(/TEMPLATE_REQUIRED/.test(scoreSrc), "fill-score TEMPLATE_REQUIRED");

const fillScoreMd = fs.readFileSync(path.join(skillRoot, "fill-score.md"), "utf8");
assert(/template_completeness/.test(fillScoreMd), "fill-score.md documents tc");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
assert(
  scoreObj.template_completeness && typeof scoreObj.template_completeness.overall === "number",
  "fixture template_completeness"
);
const ui = buildReportUi(scoreObj);
assert(ui.version === "0.2.16", "ui.version 0.2.16");
assert(typeof ui.template_completeness === "number", "ui.template_completeness");
assert(ui.glossary.some((g) => g.id === "template_completeness"), "glossary tc");
assert(/fill-truths-agents|模板完整度/.test(ui.headline), "headline suggests agents when tc low");

const tmpl = fs.readFileSync(path.join(skillRoot, "templates/report/harness-report.html.tmpl"), "utf8");
assert(/kpi-tc/.test(tmpl) && /模板完整度/.test(tmpl), "HTML kpi template_completeness");

// --- smoke: score emits field name ---
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
  assert(/template_completeness/.test(r.stdout || ""), "fill-score stdout has template_completeness");
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
console.log("selfcheck-0.2.16 PASS");
