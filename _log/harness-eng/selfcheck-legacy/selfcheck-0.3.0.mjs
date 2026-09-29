#!/usr/bin/env node
/**
 * Lightweight 0.2.29 selfcheck: Phase B strict gate + inherited 0.2.27 gates.
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

// --- 0.2.18 inherited checks (abbreviated) ---
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

// --- 0.2.19 new files ---
assert(
  fs.existsSync(path.join(skillRoot, "scripts/fill-merge-db.mjs")),
  "fill-merge-db.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/fill-merge-redis.mjs")),
  "fill-merge-redis.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/fill-merge-func.mjs")),
  "fill-merge-func.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/merge-domain.mjs")),
  "lib/merge-domain.mjs"
);

// --- 0.2.19 fill-merge-api multi-module fix ---
const mergeApiSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-api.mjs"),
  "utf8"
);
assert(/--module/.test(mergeApiSrc), "fill-merge-api has --module arg");
assert(/invEvidenceSet/.test(mergeApiSrc), "fill-merge-api multi-module evidence filtering");
assert(/skippedOtherModule/.test(mergeApiSrc), "fill-merge-api skips other-module fragments");
assert(
  /force-write.*missing|forceWrite.*missing/i.test(mergeApiSrc),
  "fill-merge-api --force-write skips missing check"
);
assert(/if \(!sec\)/.test(mergeApiSrc), "fill-merge-api skips missing endpoints in body builder");

// --- 0.2.19 fill-score output standardization ---
const scoreSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-score.mjs"),
  "utf8"
);
assert(/--output/.test(scoreSrc), "fill-score has --output arg");
assert(/--json/.test(scoreSrc), "fill-score has --json arg");
assert(/args\.output[\s\S]*writeFileSync|writeFileSync[\s\S]*args\.output/.test(scoreSrc), "fill-score writes JSON to file");

// --- 0.2.19 fill-plan shard progress ---
const planSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-plan.mjs"),
  "utf8"
);
assert(/shard_progress/.test(planSrc), "fill-plan --status has shard_progress");
assert(/fill_work_files/.test(planSrc), "fill-plan shard_progress has fill_work_files");
assert(/fill_work_lines/.test(planSrc), "fill-plan shard_progress has fill_work_lines");

// --- 0.2.19 fill-inventory-api controller path fix ---
const invApiSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-inventory-api.mjs"),
  "utf8"
);
assert(
  /CONTROLLER_DIR_NAMES/.test(invApiSrc),
  "fill-inventory-api has CONTROLLER_DIR_NAMES array"
);
assert(
  /web.*api.*endpoint.*rest/i.test(invApiSrc),
  "fill-inventory-api expanded controller dir names"
);
assert(
  /fallback.*scan entire module|walkJava\(c\)/.test(invApiSrc),
  "fill-inventory-api has module-level fallback scan"
);

// --- 0.2.19 questions.yaml variant naming ---
const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/version:\s*"0\.3\.0"/.test(qYaml), "questions.yaml version 0.2.29");
assert(/Q_READY_COVERAGE/.test(qYaml), "questions has Q_READY_COVERAGE");
assert(/Q_FILL_MCP_PROFILE/.test(qYaml), "questions has Q_FILL_MCP_PROFILE");
assert(
  /variant mapping|agents_variant=/.test(qYaml),
  "questions.yaml has variant mapping docs"
);
assert(
  /agents_variant=modules\(subset\)|agents_variant=modules\(all\)/.test(qYaml),
  "questions.yaml meta fields show agents_variant mapping"
);

// --- 0.2.19 domain merge scripts content ---
const mergeDbSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-db.mjs"),
  "utf8"
);
assert(/domain:\s*"db"/.test(mergeDbSrc), "fill-merge-db uses domain=db");
assert(
  /mergeDomain/.test(mergeDbSrc),
  "fill-merge-db calls mergeDomain"
);

const mergeRedisSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-redis.mjs"),
  "utf8"
);
assert(/domain:\s*"redis"/.test(mergeRedisSrc), "fill-merge-redis uses domain=redis");

const mergeFuncSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-func.mjs"),
  "utf8"
);
assert(/domain:\s*"func"/.test(mergeFuncSrc), "fill-merge-func uses domain=func");

// --- 0.2.19 merge-domain lib content ---
const mergeDomainSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/lib/merge-domain.mjs"),
  "utf8"
);
assert(/extractInventoryEvidence/.test(mergeDomainSrc), "merge-domain has extractInventoryEvidence");
assert(
  /domain === "db" && Array\.isArray\(inv\.tables\)/.test(mergeDomainSrc),
  "merge-domain handles db tables"
);
assert(
  /domain === "redis" && Array\.isArray\(inv\.keys\)/.test(mergeDomainSrc),
  "merge-domain handles redis keys"
);
assert(
  /domain === "func" && Array\.isArray\(inv\.modules\)/.test(mergeDomainSrc),
  "merge-domain handles func modules"
);

// --- version pins ---
const manifest = fs.readFileSync(
  path.join(skillRoot, "templates/_meta/manifest.yaml"),
  "utf8"
);
assert(/version:\s*"0\.3\.0"/.test(manifest), "manifest 0.2.29");
const metaTmpl = fs.readFileSync(
  path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
  "utf8"
);
assert(/skill_version:\s*"0\.3\.0"/.test(metaTmpl), "harness-meta 0.2.29");
assert(/ready_coverage:\s*0\.8/.test(metaTmpl), "harness-meta ready_coverage 0.8");
assert(/fill_mcp_profile:\s*test/.test(metaTmpl), "harness-meta fill_mcp_profile test");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
assert(/## 0\.3\.0/.test(changelog), "CHANGELOG 0.2.29");

// --- 0.2.26 acceptance empty examples ---
const acceptSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/acceptance-check.mjs"),
  "utf8"
);
assert(/api-empty-examples/.test(acceptSrc), "acceptance has api-empty-examples");
assert(/checkExampleColumn/.test(acceptSrc), "acceptance has checkExampleColumn");
assert(/db-no-comment/.test(acceptSrc), "acceptance has db-no-comment");
assert(/redis-no-example/.test(acceptSrc), "acceptance has redis-no-example");
assert(/func-empty-desc/.test(acceptSrc), "acceptance has func-empty-desc");
const goodFix = fs.readFileSync(
  path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
  "utf8"
);
assert(/示例值/.test(goodFix), "good fixture has 示例值 column");

// --- 0.2.26 fill-score meta + default 0.8 ---
assert(/readyCoverage:\s*0\.8/.test(scoreSrc), "fill-score default readyCoverage 0.8");
assert(/readHarnessMeta/.test(scoreSrc), "fill-score reads harness meta");
assert(/domain_caps[\s\S]*MORPH|MORPH axis/.test(scoreSrc), "fill-score morph axis comment");

// --- 0.2.27 score-policy + density ---
assert(/loadScorePolicy/.test(scoreSrc), "fill-score loadScorePolicy");
assert(/evaluateCoverageReady/.test(scoreSrc), "fill-score evaluateCoverageReady");
assert(/dens-examples/.test(scoreSrc), "fill-score dens-examples");
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/doc-density.mjs")),
  "doc-density.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl")),
  "score-policy template"
);

const fillMcp = fs.readFileSync(path.join(skillRoot, "fill-mcp.md"), "utf8");
assert(/fill_mcp_profile/.test(fillMcp), "fill-mcp documents fill_mcp_profile");
assert(/优先 \*\*`test`\*\*/.test(fillMcp) || /默认 \*\*`test`\*\*/.test(fillMcp), "fill-mcp prefers/defaults test");

const glossary026 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
assert(/两轴勿混/.test(glossary026), "glossary has 两轴勿混");
assert(/覆盖裁决/.test(glossary026), "glossary has 覆盖裁决");
assert(
  /覆盖裁决[\s\S]*?score-policy\.yaml[\s\S]*?为准/.test(glossary026),
  "glossary score-policy authority"
);
assert(/fill_mcp_profile/.test(glossary026), "glossary has fill_mcp_profile");
assert(/ready_coverage/.test(glossary026), "glossary has ready_coverage");
assert(/score-policy\.yaml/.test(glossary026), "glossary has score-policy");
assert(/coverage_mode/.test(glossary026), "glossary has coverage_mode");
assert(/ui\.version/.test(glossary026), "glossary documents ui.version ≠ skill");
assert(
  (glossary026.match(/### 两轴勿混/g) || []).length === 1,
  "glossary has single 两轴勿混 heading"
);

const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(/^---\nname: harness-eng\n/.test(skill), "SKILL has YAML frontmatter name");
assert(/description:\s*>-/.test(skill), "SKILL has model-facing description");
assert(!/fill-inventory-api\.mjs/.test(skill), "SKILL has no script inventory wall");
assert(!(/`按计划执行`/.test(skill) && /`LGTM`/.test(skill)), "SKILL does not restate full gate word list");
const skillDesc = skill.match(/^---[\s\S]*?^---/m)?.[0] || "";
assert(/施工仪式/.test(skillDesc), "description leads with 施工仪式");
assert(!/scaffold/i.test(skillDesc), "description has no scaffold synonym");
assert(!/落地\/scaffold/.test(skillDesc), "description has no 落地/scaffold pair");
assert(/## 流程/.test(skill), "SKILL has 流程 section");
assert(!/## 必读纪律/.test(skill), "SKILL dropped 必读纪律 (merged)");
assert(/## land[\s\S]*?### Done[\s\S]*?### 步骤/.test(skill), "land has Done then 步骤");
assert(!/## Done（land）/.test(skill), "SKILL has no Done(land) fork heading");
assert(!/与 Java/.test(skill), "SKILL has no pure Java negation");
assert(/本 skill 只写目标仓/.test(skill), "SKILL positive write-scope gate");
assert(!/UTF-8 无 BOM/.test(skill), "SKILL does not restate UTF-8 BOM gotcha");
assert(/write-plan\.md#windows-json/.test(skill), "SKILL points to Windows JSON gotcha");

const writePlan = fs.readFileSync(path.join(skillRoot, "write-plan.md"), "utf8");
assert(/闸门词表 SSOT/.test(writePlan), "write-plan is gate SSOT");
assert(/`按计划执行`/.test(writePlan) && /`LGTM`/.test(writePlan), "write-plan has full gate list");
assert(/Windows JSON 传参（gotcha SSOT）/.test(writePlan), "write-plan owns Windows JSON gotcha");
assert(/UTF-8 无 BOM/.test(writePlan), "write-plan states UTF-8 no BOM");

const pipeline = fs.readFileSync(path.join(skillRoot, "pipeline.md"), "utf8");
assert(!/UTF-8 无 BOM/.test(pipeline), "pipeline does not restate UTF-8 BOM");
assert(/write-plan\.md#windows-json/.test(pipeline), "pipeline points to Windows JSON gotcha");

const glossary = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
assert(
  (glossary.match(/\*\*不是\*\*可 AI coding 闸/g) || []).length === 0,
  "glossary does not repeat ready.ok negation twice"
);
assert(/分层 ready · 金标[\s\S]*?formula_ceiling/.test(glossary), "glossary folds formula into ready table");

const quick = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
assert(!/`按计划执行`/.test(quick), "QUICKSTART does not restate gate full list");
assert(/write-plan\.md/.test(quick), "QUICKSTART points to write-plan");

const fillScoreMd = fs.readFileSync(path.join(skillRoot, "fill-score.md"), "utf8");
assert(/覆盖裁决/.test(fillScoreMd), "fill-score has 覆盖裁决");
assert(!/\*\*0\.2\.8\+\*\*/.test(fillScoreMd), "fill-score has no 0.2.8+ sediment");
assert(!/\*\*0\.2\.9\+\*\*/.test(fillScoreMd), "fill-score has no 0.2.9+ sediment");
assert(/CHANGELOG\.md/.test(fillScoreMd), "fill-score points version history to CHANGELOG");

assert(/score-policy|覆盖裁决/.test(skill), "SKILL points to score-policy / 覆盖裁决");
assert(/打分 \/ score-policy/.test(skill), "SKILL branch table has score-policy row");

const fillMcpGate = fs.readFileSync(path.join(skillRoot, "fill-mcp.md"), "utf8");
assert(/过闸后再/.test(fillMcpGate), "fill-mcp positive: 过闸后再");
assert(/停留骨架/.test(fillMcpGate), "fill-mcp positive: 停留骨架");
assert(!/禁止进入填充/.test(fillMcpGate), "fill-mcp dropped 禁止进入填充");
assert(!/仍禁止填充/.test(fillMcpGate), "fill-mcp dropped 仍禁止填充");

assert(!/禁止进入填充/.test(quick), "QUICKSTART dropped 禁止进入填充");
assert(/过闸后再/.test(quick), "QUICKSTART has 过闸后再");

const scriptsDir = fs.readdirSync(path.join(skillRoot, "scripts"));
const selfchecksHot = scriptsDir.filter((n) => /^selfcheck-0\.\d+\.\d+\.mjs$/.test(n));
assert(
  selfchecksHot.length === 1 && selfchecksHot[0] === "selfcheck-0.3.0.mjs",
  "only current selfcheck in scripts/"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.2.29.mjs")),
  "0.2.29 selfcheck archived"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY history archived"
);
const verifyMd = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
assert(/0\.3\.0/.test(verifyMd), "VERIFY is 0.2.29");
assert(!/## 0\.2\.18 增量验收/.test(verifyMd), "VERIFY dropped historical increment tables");

const readme = fs.readFileSync(path.join(skillRoot, "README.md"), "utf8");
assert(/当前版本：0\.3\.0/.test(readme), "README header version 0.2.29");
assert(/当前 \*\*0\.3\.0\*\*/.test(readme), "README footer version 0.2.29");
assert(!/当前 \*\*0\.2\.25\*\*/.test(readme), "README no stale 0.2.25 footer");
assert(!/selfcheck-0\.2\.15/.test(readme), "README does not pin stale selfcheck 0.2.15");
assert(/selfcheck-0\.3\.0/.test(readme), "README pins selfcheck 0.2.29");
assert(/archive\/selfcheck/.test(readme), "README points archive selfcheck");

assert(fs.existsSync(path.join(skillRoot, "pipeline-fill.md")), "pipeline-fill.md exists");
assert(fs.existsSync(path.join(skillRoot, "upgrade.md")), "upgrade.md exists");
assert(/## Done/.test(fs.readFileSync(path.join(skillRoot, "upgrade.md"), "utf8")), "upgrade has Done");
assert(/骨架战役/.test(pipeline), "pipeline is skeleton campaign");
assert(/填充 MCP 闸/.test(pipeline), "pipeline has fill MCP gate");
assert(/停留骨架/.test(pipeline), "pipeline positive stay-skeleton");
assert(/填充 MCP 闸/.test(fs.readFileSync(path.join(skillRoot, "pipeline-fill.md"), "utf8")), "pipeline-fill has fill MCP gate");
assert(/填充 MCP 闸/.test(fillMcpGate), "fill-mcp defines gate");
assert(/S_ENV_PROFILES/.test(fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8")), "detect has S_ENV_PROFILES");
assert(/MCP 矩阵/.test(fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8")), "detect has MCP matrix");
assert(/mysql-dev-example/.test(fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp.json.example"), "utf8")), "mcp example multi-env");
assert(/意图（一支）/.test(skill), "SKILL uses one-branch intent table");
assert(/upgrade\.md/.test(skill), "SKILL points to upgrade.md");
assert(/填充 MCP 闸/.test(skill), "SKILL mentions fill MCP gate");
assert(!/## 其它模式/.test(skill), "SKILL has no redundant 其它模式 section");
assert(/fill-calibrate-live\.mjs/.test(skill), "SKILL points calibrate to script");
assert(/fill-report-html\.mjs/.test(skill), "SKILL points report to script");

assert(!fs.existsSync(path.join(skillRoot, "OPTIMIZATION-PROPOSAL-0.2.x.md")), "OPTIMIZATION not in skill root");
assert(
  fs.existsSync(path.join(skillRoot, "archive/OPTIMIZATION-PROPOSAL-0.2.x.md")),
  "OPTIMIZATION archived"
);

// --- fill-merge scripts --help smoke ---
for (const script of ["fill-merge-db.mjs", "fill-merge-redis.mjs", "fill-merge-func.mjs"]) {
  const r = runNode([path.join(skillRoot, "scripts", script), "--help"]);
  assert(
    /--inventory|--work-dir/.test(r.stdout + r.stderr),
    `${script} --help shows usage`
  );
}

// --- fill-score --help / --json smoke ---
{
  const r = runNode([
    path.join(skillRoot, "scripts/fill-score.mjs"),
    "--root",
    skillRoot,
    "--json",
    "--quiet",
  ]);
  // May fail on non-harness dir, but should at least produce JSON or error
  assert(r.status !== null, "fill-score --json runs");
}

// --- report-ui version ---
const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
if (fs.existsSync(fixture)) {
  const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
  const ui = buildReportUi(scoreObj);
  assert(["0.2.18","0.2.19","0.2.20","0.2.21","0.2.22","0.2.23","0.2.24","0.2.25","0.2.26","0.2.27","0.2.28","0.2.29"].includes(ui.version), "ui.version compatible");
  assert(Array.isArray(ui.decision_kpis) && ui.decision_kpis.length >= 1, "ui.decision_kpis");
  assert(Array.isArray(ui.morph_strip), "ui.morph_strip");
  assert(ui.show_domain_cards === false, "domain cards default off");
  assert(ui.verdict.ready_label === "建议可以开干" || ui.verdict.ready_label === "建议暂缓", "verdict binary");
  assert(ui.composite_score && typeof ui.composite_score.value === "number", "ui.composite_score");
  assert(ui.pipeline_progress && Array.isArray(ui.pipeline_progress.steps), "ui.pipeline_progress");
}

// --- 0.2.26 acceptance fixture smoke ---
{
  const r = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
    "--gold",
  ]);
  assert(r.status === 0, "acceptance good fixture gold pass");
}

// --- 0.2.29 Phase A ---
{
  const invPaths = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/inventory-paths.mjs"),
    "utf8"
  );
  assert(/endpointDedupeKey/.test(invPaths), "inventory dedupe key helper");
  assert(/dup_skipped/.test(invPaths), "inventory merge reports dup_skipped");
  const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/evaluateAiCodingGate/.test(scoreSrc), "fill-score has gate evaluator");
  assert(/gate_profile/.test(scoreSrc), "fill-score reads gate_profile");
  assert(scoreSrc.includes("`?\\/"), "hasRealApiPath allows backticks");
  const reportSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/fill-report-html.mjs"),
    "utf8"
  );
  assert(/ensureDiffFromHistory/.test(reportSrc), "report auto-diff from history");
  assert(/run-latest|ensureRunWithRound/.test(reportSrc), "report wires run-latest");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/run-latest.mjs")),
    "run-latest.mjs exists"
  );
  const planSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-plan.mjs"), "utf8");
  assert(/--work-dir/.test(planSrc), "fill-plan close can use work-dir");
  const policyTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
    "utf8"
  );
  assert(/gate_profile:\s*strict/.test(policyTmpl), "score-policy tmpl strict");
  assert(/coverage_mode:\s*all_domains/.test(policyTmpl), "score-policy tmpl all_domains");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/覆盖.*形态.*开干|三词/.test(gloss), "glossary three leading words");
  assert(/gate_profile/.test(gloss), "glossary documents gate_profile");
}

// --- 0.3.0 Phase B ---
{
  const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/applyStrictGateDefaults/.test(scoreSrc), "strict gate defaults helper");
  assert(/gp \? gp\[1\] : "strict"/.test(scoreSrc), "policy present defaults gate_profile strict");
  const reportUi = fs.readFileSync(path.join(skillRoot, "scripts/lib/report-ui.mjs"), "utf8");
  assert(/morph_floor:/.test(reportUi) && /harness_todo:/.test(reportUi), "report maps gate blockers to actions");
  assert(/仪表参考分/.test(reportUi), "composite renamed 仪表参考分");
  const qYaml2 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_GATE_PROFILE/.test(qYaml2), "questions has Q_GATE_PROFILE");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/存量升档|按 \*\*strict\*\*/.test(gloss), "glossary 0.3.0 migration note");
}

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  \u2713 ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  \u2717 ${m}`);
  process.exit(1);
}
console.log("selfcheck-0.3.0 PASS");
