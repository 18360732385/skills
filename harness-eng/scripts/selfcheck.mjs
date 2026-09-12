#!/usr/bin/env node
/**
 * Stable-name selfcheck (scripts/selfcheck.mjs): pins current skill_version.
 * 0.5.9: P1 hot-path index, land.mjs, fill --domain, fixtures, schema_version.
 * Inherited 0.2.27–0.5.7 gates.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildReportUi } from "./lib/report-ui.mjs";
import {
  applyStrictGateDefaults,
  applyGoldGateDefaults,
  applyGoldCoverageDefaults,
  evaluateAiCodingGate,
  countHarnessTodos,
} from "./lib/ai-coding-gate.mjs";
import { parseDomainsYaml, resolveScoreDomains, expandDomainPackEntries, parseDomainPacksYaml, defaultContractDomains, knownContractDomainIds } from "./lib/domains.mjs";
import {
  HARNESS_META_CANONICAL,
  MCP_USAGE_GUIDE_CANONICAL,
  findHarnessMetaFile,
  harnessMetaExists,
  migrateHarnessMetaIfNeeded,
  findMcpUsageGuideFile,
  migrateMcpUsageGuideIfNeeded,
} from "./lib/harness-meta.mjs";
import { scanSignals } from "./lib/detect-signals.mjs";
import { isGeneratedHostPath, resolveLandAgentConfig } from "./land.mjs";

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
assert(/version:\s*"0\.5\.9"/.test(qYaml), "questions.yaml version 0.5.9");
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
assert(
  /value:\s*solo, label: 仅根, meta: agents_variant=solo/.test(qYaml),
  "Q_MODULES solo keeps agents_variant=solo meta"
);

// --- 0.2.19 domain merge scripts content ---
const mergeDbSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-db.mjs"),
  "utf8"
);
assert(/--domain"?,\s*"db"/.test(mergeDbSrc), "fill-merge-db uses domain=db");
assert(
  /fill-merge\.mjs/.test(mergeDbSrc),
  "fill-merge-db delegates to fill-merge.mjs"
);

const mergeRedisSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-redis.mjs"),
  "utf8"
);
assert(/--domain"?,\s*"redis"/.test(mergeRedisSrc), "fill-merge-redis uses domain=redis");

const mergeFuncSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/fill-merge-func.mjs"),
  "utf8"
);
assert(/--domain"?,\s*"func"/.test(mergeFuncSrc), "fill-merge-func uses domain=func");

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
assert(/version:\s*"0\.5\.9"/.test(manifest), "manifest 0.5.9");
const metaTmpl = fs.readFileSync(
  path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
  "utf8"
);
assert(/skill_version:\s*"0\.5\.9"/.test(metaTmpl), "harness-meta 0.5.9");
assert(/ready_coverage:\s*0\.8/.test(metaTmpl), "harness-meta ready_coverage 0.8");
assert(/fill_mcp_profile:\s*test/.test(metaTmpl), "harness-meta fill_mcp_profile test");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
assert(/## 0\.5\.2/.test(changelog), "CHANGELOG 0.5.2");
assert(/## 0\.5\.3/.test(changelog), "CHANGELOG 0.5.3");
assert(/## 0\.5\.4/.test(changelog), "CHANGELOG 0.5.4");
assert(/## 0\.5\.5/.test(changelog), "CHANGELOG 0.5.5");
assert(/## 0\.5\.6/.test(changelog), "CHANGELOG 0.5.6");
assert(/## 0\.5\.7/.test(changelog), "CHANGELOG 0.5.7");
assert(/## 0\.5\.8/.test(changelog), "CHANGELOG 0.5.8");
assert(/## 0\.5\.9/.test(changelog), "CHANGELOG 0.5.9");

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
assert(/findHarnessMetaFile/.test(scoreSrc), "fill-score uses harness-meta path ladder");
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
assert(/对用户摘要只输出三词|覆盖.*形态.*开干/.test(glossary026), "glossary three-word SSOT");
assert(/覆盖裁决/.test(glossary026), "glossary has 覆盖裁决");
assert(
  /覆盖裁决[\s\S]*?score-policy\.yaml[\s\S]*?为准/.test(glossary026),
  "glossary score-policy authority"
);
assert(/score-policy\.yaml/.test(glossary026), "glossary has score-policy");
assert(/ui\.version/.test(glossary026), "glossary documents ui.version ≠ skill");
assert(/gate_profile/.test(glossary026), "glossary documents gate_profile");
// technical field dump disclosed to fill-score (0.3.1+ prune)
assert(/fill-score\.md/.test(glossary026), "glossary points tech fields to fill-score");

const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(/^---\r?\nname: harness-eng\r?\n/.test(skill), "SKILL has YAML frontmatter name");
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
assert(
  fs.existsSync(path.join(skillRoot, "scripts/selfcheck.mjs")),
  "hot path is scripts/selfcheck.mjs"
);
const selfchecksHot = scriptsDir.filter((n) => /^selfcheck-0\.\d+\.\d+\.mjs$/.test(n));
assert(
  selfchecksHot.length === 0,
  "no versioned selfcheck-0.x.x.mjs in scripts/ (use selfcheck.mjs)"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.4.0.mjs")),
  "0.4.0 selfcheck archived"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.5.0.mjs")),
  "0.5.0 selfcheck archived"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.5.1.mjs")),
  "0.5.1 selfcheck archived"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/INDEX.md")),
  "legacy selfcheck INDEX"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/selfcheck-0.3.10.mjs")),
  "0.3.10 selfcheck in legacy/"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/selfcheck-0.3.9.mjs")),
  "0.3.9 selfcheck in legacy/"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/selfcheck-0.3.2.mjs")),
  "0.3.2 selfcheck in legacy/"
);
const archiveReadme = fs.readFileSync(path.join(skillRoot, "archive/README.md"), "utf8");
assert(/scripts\/selfcheck\.mjs/.test(archiveReadme), "archive README points to selfcheck.mjs");
assert(
  !/热路径仅当前 `scripts\/selfcheck-0\.3\.\*`/.test(archiveReadme),
  "archive README no stale 0.3 hot-path line"
);
assert(
  fs.existsSync(path.join(skillRoot, "archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY history archived"
);
const verifyMd = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
assert(/0\.5\.9/.test(verifyMd), "VERIFY is 0.5.9");
assert(/session-dashboard/.test(verifyMd), "VERIFY mentions session-dashboard");
assert(!/## 0\.2\.18 增量验收/.test(verifyMd), "VERIFY dropped historical increment tables");

const readme = fs.readFileSync(path.join(skillRoot, "README.md"), "utf8");
assert(/当前版本：0\.5\.9/.test(readme), "README header version 0.5.9");
assert(/当前 \*\*0\.5\.9\*\*/.test(readme), "README footer version 0.5.9");
assert(!/当前 \*\*0\.2\.25\*\*/.test(readme), "README no stale 0.2.25 footer");
assert(!/selfcheck-0\.2\.15/.test(readme), "README does not pin stale selfcheck 0.2.15");
assert(/selfcheck\.mjs/.test(readme), "README pins selfcheck.mjs");
assert(!/selfcheck-0\.5\.2/.test(readme), "README no stale selfcheck-0.5.2 pin");
assert(/archive\/selfcheck/.test(readme), "README points archive selfcheck");

const handbookMd = fs.readFileSync(path.join(skillRoot, "使用手册.md"), "utf8");
const handbookHtml = fs.readFileSync(path.join(skillRoot, "使用手册.html"), "utf8");
const quickstartMd = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
const ladderMd = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
assert(/版本：\*\*0\.5\.9\*\*/.test(handbookMd), "使用手册.md version 0.5.9");
assert(/v0\.5\.9/.test(handbookHtml), "使用手册.html version 0.5.9");
assert(/当前 \*\*0\.5\.9\*\*/.test(quickstartMd), "QUICKSTART version 0.5.9");
assert(/selfcheck\.mjs/.test(quickstartMd), "QUICKSTART pins selfcheck.mjs");
assert(/selfcheck\.mjs/.test(handbookMd), "使用手册.md pins selfcheck.mjs");
assert(/selfcheck\.mjs/.test(handbookHtml), "使用手册.html pins selfcheck.mjs");
const handbookSummary = fs.readFileSync(path.join(skillRoot, "使用手册-摘要.md"), "utf8");
for (const [label, text] of [
  ["使用手册.md", handbookMd],
  ["使用手册.html", handbookHtml],
  ["使用手册-摘要.md", handbookSummary],
  ["QUICKSTART.md", quickstartMd],
  ["README.md", readme],
]) {
  assert(/宿主的用户 skills 目录/.test(text), `${label} host-agnostic install wording`);
  assert(!/装到 ~\/\.cursor\/skills\/harness-eng/.test(text), `${label} no Cursor-only install dest`);
  assert(!/npx skills add[^\n]*--agent cursor/.test(text), `${label} CLI not --agent cursor only`);
}
assert(!/重启 Cursor/.test(readme), "README no restart Cursor");
assert(/6\.0 对话内会话仪表盘/.test(handbookMd), "使用手册.md session dashboard section");
assert(/详情请查询仪表盘/.test(handbookHtml), "使用手册.html session dashboard footer copy");
assert(!/v0\.5\.0/.test(handbookHtml), "使用手册.html no stale v0.5.0");
assert(!/不臆造/.test(handbookHtml), "使用手册.html no stale 不臆造 hooks");
assert(/L0–L5/.test(quickstartMd), "QUICKSTART audit L0-L5");
assert(/^# 阶梯 L0–L5/m.test(ladderMd), "ladder title L0-L5");
assert(/sync-hosts\.md/.test(handbookMd), "使用手册.md links sync-hosts");
assert(/4\.4 0\.5\.2\+ 多宿主对齐/.test(handbookMd), "使用手册.md has 0.5.2 multi-host section");
assert(/协议族/.test(handbookMd), "使用手册.md hooks protocol family table");

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
  assert(/applyStrictGateDefaults/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/ai-coding-gate.mjs"), "utf8")) || /ai-coding-gate/.test(scoreSrc), "strict gate defaults helper");
  assert(/gp \? gp\[1\] : "strict"/.test(scoreSrc), "policy present defaults gate_profile strict");
  assert(/ai-coding-gate/.test(scoreSrc), "fill-score imports ai-coding-gate");
  const reportUi = fs.readFileSync(path.join(skillRoot, "scripts/lib/report-ui.mjs"), "utf8");
  assert(/morph_floor:/.test(reportUi) && /harness_todo:/.test(reportUi), "report maps gate blockers to actions");
  assert(/仪表参考分/.test(reportUi), "composite renamed 仪表参考分");
  const qYaml2 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_GATE_PROFILE/.test(qYaml2), "questions has Q_GATE_PROFILE");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/存量升档|按 \*\*strict\*\*|未写则 \*\*strict\*\*/.test(gloss), "glossary 0.3.0 migration note");
}

// --- 0.3.1 Phase C ---
{
  const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/hasDbFieldEvidence/.test(scoreSrc), "db field evidence helper");
  assert(/##\s*Value(?:\s*结构)?|Value(?:\s*结构)?/.test(scoreSrc) || scoreSrc.includes("Value(?:\\s*结构)?"), "Value heading isomorphic");
  assert(/--focus/.test(scoreSrc), "fill-score --focus");
  assert(fs.existsSync(path.join(skillRoot, "fill-morph.md")), "fill-morph.md");
  assert(fs.existsSync(path.join(skillRoot, "fill-gate.md")), "fill-gate.md");
  const q = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/value:\s*fill-morph/.test(q) && /value:\s*fill-gate/.test(q), "Q_MODE has morph/gate");
  const tmpl = fs.readFileSync(
    path.join(skillRoot, "templates/report/harness-report.html.tmpl"),
    "utf8"
  );
  assert(!/综合评分/.test(tmpl), "report tmpl dropped 综合评分");
  assert(/composite-secondary|panel-trend/.test(tmpl) && /仪表参考分/.test(tmpl), "composite in trend secondary");
  assert(/0\.3\.[12] 计分同构/.test(fs.readFileSync(path.join(skillRoot, "templates/docs/redis/templates/redis-key-template.md"), "utf8")), "redis tmpl note");
  assert(/0\.3\.[12] 计分同构/.test(fs.readFileSync(path.join(skillRoot, "templates/docs/db/templates/db-table-template.md"), "utf8")), "db tmpl note");
}

// --- 0.3.2 wfa closeout ---
{
  const ui = buildReportUi({
    overall: 70,
    formula_ceiling: 75,
    coverage: { percent: 90, covered: 9, code: 10 },
    template_completeness: { overall: 100 },
    coverage_ready: { mode: "all_domains" },
  });
  assert(Array.isArray(ui.morph_strip), "morph_strip array");
  assert(!ui.morph_strip.some((x) => x.id === "coverage"), "morph_strip excludes coverage");
  assert(Array.isArray(ui.coverage_strip) && ui.coverage_strip.some((x) => x.id === "coverage"), "coverage_strip separate");
  assert(fs.existsSync(path.join(skillRoot, "scripts/bump-run-round.mjs")), "bump-run-round.mjs");
  assert(/bumpRunRound/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/run-latest.mjs"), "utf8")), "bumpRunRound export");
  const gate = applyStrictGateDefaults({});
  const failMorph = evaluateAiCodingGate(
    { root: skillRoot, domains: { api: { score: 40 }, func: { score: 70 } } },
    { gate_profile: "strict", gate },
    { blockers: 0 }
  );
  assert(failMorph.active && !failMorph.ok && failMorph.blockers.some((b) => String(b).startsWith("morph_floor:")), "strict morph_floor blocks");
  const skillTxt = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/开干/.test(skillTxt) && /形态/.test(skillTxt) && /覆盖/.test(skillTxt), "SKILL description leading words");
  assert(/bump-run-round/.test(fs.readFileSync(path.join(skillRoot, "fill-truths-agents.md"), "utf8")), "agents Done bumps round");
}

// --- 0.3.5 gold profile ---
{
  const goldGate = applyGoldGateDefaults({});
  assert(goldGate.morph_floor === 90, "gold morph_floor 90");
  assert(goldGate.template_completeness_min === 95, "gold tc min 95");
  assert(goldGate.todo_scan === "harness_docs", "gold todo_scan B");
  assert(goldGate.acceptance_warnings_max === 0, "gold warnings max 0");
  const cov = applyGoldCoverageDefaults({ api: 0.8 });
  assert(cov.api === 1 && cov.db === 1, "gold coverage forced 1.0");
  const gateMorphOnly = { ...goldGate, forbid_harness_todo: false };
  const failGoldMorph = evaluateAiCodingGate(
    {
      root: skillRoot,
      domains: { api: { score: 85 }, func: { score: 95 }, db: { score: 95 }, redis: { score: 95 } },
      template_completeness: { overall: 100 },
    },
    { gate_profile: "gold", gate: gateMorphOnly },
    { blockers: 0, warnings: 0 }
  );
  assert(
    failGoldMorph.active &&
      !failGoldMorph.ok &&
      failGoldMorph.blockers.some((b) => String(b).startsWith("morph_floor:")),
    "gold morph_floor 90 blocks api 85"
  );
  const failWarn = evaluateAiCodingGate(
    {
      root: skillRoot,
      domains: { api: { score: 95 } },
      template_completeness: { overall: 100 },
    },
    { gate_profile: "gold", gate: gateMorphOnly },
    { blockers: 0, warnings: 3 }
  );
  assert(
    failWarn.blockers.some((b) => String(b).startsWith("acceptance_warnings:")),
    "gold warnings block"
  );
  const nB = countHarnessTodos(skillRoot, "harness_docs");
  const nA = countHarnessTodos(skillRoot, "truths");
  assert(typeof nB === "number" && nB >= nA, "harness_docs scan >= truths");
  const q = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/value:\s*gold/.test(q), "Q_GATE_PROFILE has gold");
  assert(/recommended:\s*strict/.test(q), "Q still recommends strict");
  const policyTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
    "utf8"
  );
  assert(/gate_profile:\s*strict/.test(policyTmpl), "tmpl default still strict");
  assert(/todo_scan:/.test(policyTmpl) && /acceptance_warnings_max:/.test(policyTmpl), "tmpl gold fields");
  assert(/gold/.test(fs.readFileSync(path.join(skillRoot, "fill-gate.md"), "utf8")), "fill-gate docs gold");
  assert(/version:\s*"0\.5\.9"/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest 0.5.9");
}

// --- 0.3.4/0.3.5 jobs domain + domains.yaml + packs + inventory ---
{
  assert(
    fs.existsSync(path.join(skillRoot, "templates/_meta/domains.yaml")),
    "domains.yaml"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/_meta/domain-packs.yaml")),
    "domain-packs.yaml"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/domains.mjs")),
    "lib/domains.mjs"
  );
  const domYaml = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/^\s*jobs:/m.test(domYaml), "domains.yaml has jobs");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/docs/jobs/jobs.md.tmpl")),
    "jobs index tmpl"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/rules/20-jobs-doc-sync.mdc.tmpl")),
    "rule 20 tmpl"
  );
  const man = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/manifest.yaml"),
    "utf8"
  );
  assert(/GLOB_JOBS/.test(man), "manifest GLOB_JOBS");
  assert(/domain-packs\.yaml/.test(man), "manifest points to domain-packs");
  assert(!/id:\s*jobs-index/.test(man), "L1 jobs not inlined in manifest");
  const packs = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domain-packs.yaml"),
    "utf8"
  );
  assert(/id:\s*jobs-index/.test(packs), "domain-packs has jobs-index");
  const renderSrc = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/expandDomainPackEntries/.test(renderSrc), "render expands domain packs");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/fill-inventory-jobs.mjs")),
    "fill-inventory-jobs.mjs"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/fill-merge-jobs.mjs")),
    "fill-merge-jobs.mjs"
  );
  assert(
    /checkJobsFile/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/acceptance-check.mjs"), "utf8")
    ),
    "acceptance jobs"
  );
  const scoreSrc2 = fs.readFileSync(
    path.join(skillRoot, "scripts/fill-score.mjs"),
    "utf8"
  );
  assert(/--domains/.test(scoreSrc2), "fill-score --domains");
  assert(/domain === "jobs"/.test(scoreSrc2), "fill-score jobs morph");
  assert(/resolveScoreDomains/.test(scoreSrc2), "fill-score resolveScoreDomains");
  assert(/S_JOBS/.test(fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8")), "detect S_JOBS");
  assert(
    /mcp_tracking/.test(
      fs.readFileSync(path.join(skillRoot, "conflict-policy.md"), "utf8")
    ),
    "conflict-policy mcp_tracking"
  );
  assert(
    /value:\s*jobs/.test(fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8")),
    "Q_CONTRACT jobs"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/selfcheck-0.3.6.mjs")),
    "0.3.6 selfcheck in legacy/"
  );
  const reg = parseDomainsYaml(domYaml);
  assert(reg.jobs && reg.jobs.truths_dir === "tasks", "jobs truths_dir tasks");
  const resolved = resolveScoreDomains({
    cliDomains: ["api", "jobs"],
    registry: reg,
  });
  assert(resolved.includes("jobs") && resolved.includes("api"), "resolveScoreDomains cli");
  const packMap = parseDomainPacksYaml(packs);
  assert(Array.isArray(packMap.jobs) && packMap.jobs.length >= 5, "jobs pack entries");
  const expanded = expandDomainPackEntries(["jobs", "api"], { ladder: "L1" });
  assert(
    expanded.some((e) => e.id === "jobs-index") && expanded.some((e) => e.id === "api-index"),
    "expandDomainPackEntries L1"
  );
}

// --- 0.3.6 pointers + scheduler_link + domain-extend ---
{
  const skillMd = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/Cron|Scheduler|jobs/.test(skillMd), "SKILL description Cron/jobs");
  assert(
    fs.existsSync(path.join(skillRoot, "domain-extend.md")),
    "domain-extend.md"
  );
  assert(/domain-extend\.md/.test(skillMd), "SKILL branch points domain-extend");
  const invJobs = fs.readFileSync(
    path.join(skillRoot, "scripts/fill-inventory-jobs.mjs"),
    "utf8"
  );
  assert(/scheduler_link/.test(invJobs), "inventory scheduler_link");
  assert(/exact/.test(invJobs) && /heuristic/.test(invJobs), "inventory exact|heuristic");
  const accSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "utf8"
  );
  assert(/jobs-heuristic-unmarked/.test(accSrc), "acceptance jobs-heuristic-unmarked");
  assert(/jobs-heuristic-in-ssot/.test(accSrc), "acceptance jobs-heuristic-in-ssot");
  const workers = fs.readFileSync(path.join(skillRoot, "fill-workers.md"), "utf8");
  assert(/契约域 fragment/.test(workers), "fill-workers 契约域 fragment");
  assert(!/###\s*四域 fragment/.test(workers), "fill-workers no 四域 fragment heading");
  assert(/scheduler_link/.test(workers), "fill-workers documents scheduler_link");
}

// --- 0.3.7 domain registry un-hardcode (inherited) ---
{
  const ids = defaultContractDomains();
  assert(ids.includes("api") && ids.includes("jobs"), "defaultContractDomains has api+jobs");
  assert(knownContractDomainIds().length === ids.length, "knownContractDomainIds aligned");
  const accSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "utf8"
  );
  assert(/ACCEPTANCE_BY_DOMAIN/.test(accSrc), "ACCEPTANCE_BY_DOMAIN");
  assert(/knownContractDomainIds/.test(accSrc), "acceptance uses knownContractDomainIds");
  assert(!/\[\s*"api",\s*"func",\s*"db",\s*"redis",\s*"jobs"\s*\]/.test(accSrc), "acceptance no hardcoded five-tuple");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/fill-merge.mjs")),
    "fill-merge.mjs"
  );
  assert(
    /--domain/.test(fs.readFileSync(path.join(skillRoot, "scripts/fill-merge.mjs"), "utf8")),
    "fill-merge --domain"
  );
  assert(
    /defaultContractDomains/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/fill-plan.mjs"), "utf8")
    ),
    "fill-plan defaultContractDomains"
  );
  assert(
    /defaultContractDomains|knownContractDomainIds/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/lib/ai-coding-gate.mjs"), "utf8")
    ),
    "ai-coding-gate registry domains"
  );
  assert(
    /contractDomainList|knownContractDomainIds/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/lib/report-ui.mjs"), "utf8")
    ),
    "report-ui registry domains"
  );
  assert(/0\.3\.8/.test(fs.readFileSync(path.join(skillRoot, "domain-extend.md"), "utf8")), "domain-extend 0.3.8");
}

// --- 0.3.8 P0 hotpath + P1 morph-required ---
{
  const pipelineFill = fs.readFileSync(path.join(skillRoot, "pipeline-fill.md"), "utf8");
  assert(/fill-merge\.mjs --domain/.test(pipelineFill), "pipeline-fill fill-merge --domain");
  assert(!/fill-merge-\{api/.test(pipelineFill), "pipeline-fill no brace enum merge");
  const workers = fs.readFileSync(path.join(skillRoot, "fill-workers.md"), "utf8");
  assert(/fill-merge\.mjs --domain/.test(workers), "fill-workers fill-merge --domain");
  const agents = fs.readFileSync(path.join(skillRoot, "fill-truths-agents.md"), "utf8");
  assert(/fill-merge\.mjs --domain/.test(agents), "fill-truths-agents fill-merge --domain");
  const qs = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  const jobsRows = (qs.match(/fill-inventory-jobs/g) || []).length;
  assert(jobsRows === 1, "QUICKSTART single jobs row");
  assert(/fill-merge\.mjs --domain jobs/.test(qs), "QUICKSTART jobs uses fill-merge --domain");
  const morphPath = path.join(skillRoot, "templates/_meta/morph-required.yaml");
  assert(fs.existsSync(morphPath), "morph-required.yaml");
  const morphYaml = fs.readFileSync(morphPath, "utf8");
  for (const d of ["api", "func", "db", "redis", "jobs"]) {
    assert(
      new RegExp("^\\s*" + d + ":", "m").test(morphYaml) ||
        new RegExp("\\n\\s*" + d + ":").test(morphYaml),
      "morph-required has " + d
    );
  }
  assert(
    /loadMorphRequired|morph-required/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8")
    ),
    "fill-score loads morph-required"
  );
  assert(fs.existsSync(path.join(skillRoot, "scripts/lib/morph-required.mjs")), "morph-required.mjs");
  const de = fs.readFileSync(path.join(skillRoot, "domain-extend.md"), "utf8");
  assert(/morph-required/.test(de), "domain-extend mentions morph-required");
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const modeSection = (skill.split("## 模式分流")[1] || "").split("## land")[0] || "";
  assert(!/\|\s*\*\*自动填充\*\*/.test(modeSection), "SKILL mode table no 自动填充 row");
  assert(/fill-truths-auto/.test(skill), "SKILL still points fill-truths-auto");
  assert(
    /报告字段速查/.test(fs.readFileSync(path.join(skillRoot, "fill-score.md"), "utf8")),
    "fill-score 报告字段速查"
  );
  assert(
    /非路线图/.test(fs.readFileSync(path.join(skillRoot, "archive/README.md"), "utf8")),
    "archive OPTIMIZATION not roadmap"
  );
  assert(
    /契约域闭环/.test(fs.readFileSync(path.join(skillRoot, "truth-quality.md"), "utf8")),
    "truth-quality 契约域闭环"
  );
  assert(
    /契约域 packs/.test(fs.readFileSync(path.join(skillRoot, "ai-tools.md"), "utf8")),
    "ai-tools 契约域 packs"
  );
}

// --- 0.3.9 source-repo discipline backfill ---
{
  const rootMod = fs.readFileSync(
    path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"),
    "utf8"
  );
  const rootSolo = fs.readFileSync(
    path.join(skillRoot, "templates/agents/AGENTS.root.solo.md.tmpl"),
    "utf8"
  );
  for (const [name, src] of [["root", rootMod], ["solo", rootSolo]]) {
    assert(/docs\/func\|api\|db\|redis\|jobs/.test(src), `AGENTS ${name} tmpl docs include jobs`);
    assert(/docs\/releases/.test(src), `AGENTS ${name} tmpl mentions releases`);
  }
  const rule00 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/## 提交门禁/.test(rule00), "00 tmpl has 提交门禁");
  assert(/superpowers/.test(rule00) && /`Pn`/.test(rule00), "00 提交门禁 covers superpowers + Pn");
  const rule19 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/19-agent-kb.mdc.tmpl"),
    "utf8"
  );
  assert(/## 文档职责/.test(rule19), "19 tmpl has 文档职责");
  assert(/## 回流（强制）/.test(rule19), "19 tmpl has 回流（强制）");
  const q = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_MCP_TRACKING/.test(q), "questions has Q_MCP_TRACKING");
  assert(/vendored_shared/.test(q), "Q_MCP_TRACKING has vendored_shared");
  const audit = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
  assert(/write-meta-only/.test(audit), "audit has write-meta-only");
  assert(/重号/.test(audit), "audit anti-pattern Pn duplicate id");
  const ladder = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
  assert(/扩展文档/.test(ladder), "ladder L2 allows extension docs");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/write-meta-only/.test(gloss), "glossary has write-meta-only");
  const rp = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(/Q_MCP_TRACKING/.test(rp), "recommended-profile points Q_MCP_TRACKING");
}

// --- 0.3.10 behavior pack (rule 21) ---
{
  const r21 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/21-observability-comments.mdc.tmpl"),
    "utf8"
  );
  assert(/\{\{GLOB_OBSERVABILITY\}\}/.test(r21), "rule21 tmpl has GLOB_OBSERVABILITY placeholder");
  assert(/Throwable 放最后一参/.test(r21), "rule21 tmpl Throwable last param");
  assert(/必须打点/.test(r21) && /中文注释/.test(r21), "rule21 tmpl logging + comments sections");
  assert(!/sms-ai|WideEvent|LocalLogLookupService/.test(r21), "rule21 tmpl de-domainized");
  const man = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  assert(/id:\s*rule-21/.test(man), "manifest has rule-21");
  assert(/GLOB_OBSERVABILITY/.test(man), "manifest has GLOB_OBSERVABILITY");
  const domYaml = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/kind:\s*behavior/.test(domYaml), "domains.yaml has behavior pack");
  const q = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_RULE21/.test(q), "questions has Q_RULE21");
  const det = fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8");
  assert(/S_SLF4J/.test(det), "detect has S_SLF4J");
  assert(/GLOB_OBSERVABILITY/.test(det), "detect has GLOB_OBSERVABILITY default");
  const rp = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(/rule21/.test(rp), "recommended-profile has rule21");
  const rule00 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/日志\/注释/.test(rule00), "00 tmpl has 日志/注释 strip row");
  const ladder = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
  assert(/21-observability-comments/.test(ladder), "ladder L0 behavior pack");
  const audit = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
  assert(/行为包/.test(audit), "audit L0 behavior pack");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/行为包/.test(gloss), "glossary has 行为包");
}

// --- 0.4.0 package model: rule 17 / spring module variant / merge preview / manual_sql ---
{
  const r17 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/17-frontend-web.mdc.tmpl"),
    "utf8"
  );
  assert(/\{\{GLOB_FRONTEND\}\}/.test(r17), "rule17 tmpl has GLOB_FRONTEND placeholder");
  assert(/协作包/.test(r17), "rule17 tmpl marks collab pack");
  assert(!/sms-ai-web|Clinical Calm|antd/.test(r17), "rule17 tmpl de-domainized");
  const man = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  assert(/id:\s*rule-17/.test(man), "manifest has rule-17");
  assert(/GLOB_FRONTEND/.test(man) && /FRONTEND_DIR/.test(man) && /DB_MIGRATION_MODE/.test(man), "manifest new placeholders");
  assert(/module_agents_template=spring/.test(man), "manifest notes spring variant");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/agents/AGENTS.module.spring.md.tmpl")),
    "AGENTS.module.spring.md.tmpl exists"
  );
  const spring = fs.readFileSync(
    path.join(skillRoot, "templates/agents/AGENTS.module.spring.md.tmpl"),
    "utf8"
  );
  assert(/spring-boot:run/.test(spring) && /仓库根/.test(spring), "spring variant Maven discipline");
  assert(/manual_sql/.test(spring), "spring variant mentions migration mode");
  const renderSrc = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/module_agents_template/.test(renderSrc), "render supports module_agents_template");
  assert(/previewMarkdownMerge/.test(renderSrc), "render has previewMarkdownMerge");
  assert(/mergePreview/.test(renderSrc), "render logs mergePreview");
  const q = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_FRONTEND_RULE/.test(q), "questions has Q_FRONTEND_RULE");
  assert(/Q_MODULE_AGENTS/.test(q), "questions has Q_MODULE_AGENTS");
  assert(/Q_DB_MIGRATION/.test(q), "questions has Q_DB_MIGRATION");
  const det = fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8");
  assert(/S_SPRING/.test(det), "detect has S_SPRING");
  assert(/GLOB_FRONTEND/.test(det), "detect has GLOB_FRONTEND default");
  assert(/manual_sql/.test(det), "detect maps manual_sql");
  const r13 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/13-db-doc-sync.mdc.tmpl"),
    "utf8"
  );
  assert(/迁移模式/.test(r13) && /manual_sql/.test(r13), "rule13 tmpl has 迁移模式 section");
  const dbIdx = fs.readFileSync(
    path.join(skillRoot, "templates/docs/db/db.md.tmpl"),
    "utf8"
  );
  assert(/\{\{DB_MIGRATION_MODE\}\}/.test(dbIdx), "db index tmpl has DB_MIGRATION_MODE");
  const domYaml = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/migration_modes/.test(domYaml), "domains db migration_modes");
  assert(/S_FRONTEND/.test(domYaml) && !/sms-ai-web/.test(domYaml), "domains frontend pack generic + detect");
  const rp = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(/rule17/.test(rp) && /module_agents_template/.test(rp), "recommended-profile new rows");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/manual_sql/.test(gloss) && /分册变体/.test(gloss), "glossary manual_sql + 分册变体");
  const resume = fs.readFileSync(path.join(skillRoot, "resume.md"), "utf8");
  assert(/mergePreview/.test(resume), "resume documents mergePreview");
  const ladder = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
  assert(/17-frontend-web/.test(ladder), "ladder L0 frontend collab pack");
  const audit = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
  assert(/rule 17/.test(audit), "audit L0 rule 17");
}

// --- 0.4.0 runtime: spring variant + mergePreview dry-run ---
{
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-040-"));
  try {
    fs.writeFileSync(
      path.join(tmpRoot, "AGENTS.md"),
      "# 我的仓库\n\n## Commands\n\nuser written\n",
      "utf8"
    );
    const paramsPath = path.join(tmpRoot, "params.json");
    fs.writeFileSync(
      paramsPath,
      JSON.stringify({
        ladder: "L0",
        domains: [],
        agents_variant: "modules",
        module_dirs: ["demo-mod"],
        module_agents_template: "spring",
        on_exists: "merge",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          MODULE_DIRS: "demo-mod",
          DATE: "2026-08-24",
          LADDER_TARGET: "L0",
          AGENTS_VARIANT: "modules",
          GLOB_PROFILE: "wide",
          LAST_MODE: "resume",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpRoot,
      "--params",
      paramsPath,
      "--dry-run",
    ]);
    assert(r.status === 0, "0.4.0 render dry-run exits 0");
    let out = null;
    try {
      out = JSON.parse(r.stdout);
    } catch (_) {
      out = null;
    }
    assert(out && Array.isArray(out.results), "dry-run JSON results");
    if (out && Array.isArray(out.results)) {
      const mod = out.results.find((x) => x.target === "demo-mod/AGENTS.md");
      assert(mod && /Spring 后端分册/.test(mod.preview || ""), "spring variant template rendered");
      const rootRow = out.results.find((x) => x.target === "AGENTS.md");
      assert(rootRow && rootRow.action === "merge", "root AGENTS action merge");
      assert(
        rootRow &&
          rootRow.mergePreview &&
          Array.isArray(rootRow.mergePreview.append) &&
          rootRow.mergePreview.append.length >= 1 &&
          Array.isArray(rootRow.mergePreview.keep) &&
          rootRow.mergePreview.keep.includes("## Commands"),
        "mergePreview append/keep section-level"
      );
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

// --- 0.5.2 static: L5 配置 SSOT 管线 / hooks 家族 / pitfalls 工程化 ---
{
  // L5 模板包存在性 + 去域化
  for (const rel of [
    "templates/agent-config/README.md.tmpl",
    "templates/agent-config/sync.mjs.tmpl",
    "templates/agent-config/hooks/hooks.config.json.tmpl",
    "templates/agent-config/mcp/servers.example.json",
    "templates/agent-config/settings.json.tmpl",
  ]) {
    assert(fs.existsSync(path.join(skillRoot, rel)), `L5 template exists: ${rel}`);
  }
  const syncTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"),
    "utf8"
  );
  assert(/\{\{AI_TOOLS_JSON\}\}/.test(syncTmpl), "sync.mjs.tmpl driven by AI_TOOLS_JSON");
  assert(/--check/.test(syncTmpl), "sync.mjs.tmpl has --check drift mode");
  assert(!/sms-ai|juneyaoair/.test(syncTmpl), "sync.mjs.tmpl de-domainized");

  // hooks 家族模板存在性 + 去域化 + 占位
  const gateTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(/\{\{CONTRACT_CHECKS_JS\}\}/.test(gateTmpl), "extended gate has CONTRACT_CHECKS_JS");
  assert(/\{\{DB_MIGRATION_DIR\}\}/.test(gateTmpl), "extended gate has DB_MIGRATION_DIR");
  assert(!/sms-ai|apifox/i.test(gateTmpl), "extended gate de-domainized (no sms-ai/apifox)");
  assert(/--git/.test(gateTmpl), "extended gate supports --git mode");
  const guardTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/mcp-mysql-guard.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MYSQL_GUARD_SERVERS\}\}/.test(guardTmpl), "mysql-guard has MYSQL_GUARD_SERVERS");
  assert(!/sms-ai|P21/.test(guardTmpl), "mysql-guard de-domainized");
  const afterEditTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/after-edit-reminder.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MIGRATION_NAME_RE\}\}/.test(afterEditTmpl), "after-edit has MIGRATION_NAME_RE");
  const stopTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/stop-delivery-checklist.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MIGRATION_ENVS\}\}/.test(stopTmpl), "stop-checklist has MIGRATION_ENVS");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/claude-adapter.js")),
    "claude-adapter.js template"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/hooks.json.tmpl")),
    "hooks.json.tmpl (dynamic events)"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "templates/hooks/hooks.json")),
    "static hooks.json removed"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/claude-settings.hooks.json.tmpl")),
    "claude-settings.hooks.json.tmpl"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "templates/hooks/claude-settings.hooks.json")),
    "static claude-settings.hooks.json removed"
  );

  // 机制层
  const render050 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/L5:\s*5/.test(render050), "render LADDER_ORD has L5");
  assert(/when_agent_config/.test(render050), "render supports when_agent_config");
  assert(/buildHookPlaceholders/.test(render050), "render computes hook placeholders");
  assert(/"agent_config"/.test(render050), "harness-meta managed key agent_config");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs")),
    "lib/hooks-checks.mjs"
  );
  const hooksLib = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/hooks-checks.mjs"),
    "utf8"
  );
  assert(/HOOK_DEFS/.test(hooksLib) && /commit-gate-extended/.test(hooksLib), "hooks lib registry");
  const domYaml050 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/hook_code:/.test(domYaml050) && /hook_docs:/.test(domYaml050), "domains.yaml hook sections");
  assert(!/sms-ai/.test(domYaml050), "domains.yaml hook sections de-domainized");
  const man050 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/manifest.yaml"),
    "utf8"
  );
  assert(/id:\s*agent-config-sync/.test(man050), "manifest has agent-config-sync");
  assert(/id:\s*agent-config-hooks-config/.test(man050), "manifest has agent-config-hooks-config");
  assert(/id:\s*pitfalls-lint/.test(man050), "manifest has pitfalls-lint");
  assert(/when_agent_config:\s*false/.test(man050), "manifest direct-wiring entries L5-exclusive");
  const q050 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_AGENT_CONFIG/.test(q050), "questions has Q_AGENT_CONFIG");
  assert(/Q_HOOKS_FAMILY/.test(q050), "questions has Q_HOOKS_FAMILY");
  assert(/value:\s*L5/.test(q050), "Q_LADDER has L5 option");
  const metaTmpl050 = fs.readFileSync(
    path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
    "utf8"
  );
  assert(/agent_config:\s*\{\{AGENT_CONFIG\}\}/.test(metaTmpl050), "meta tmpl agent_config field");
  const ladder050 = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
  assert(/L5/.test(ladder050) && /配置 SSOT 管线/.test(ladder050), "ladder has L5 row");
  const gloss050 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/配置 SSOT 管线/.test(gloss050), "glossary L5");
  assert(/hooks 家族/.test(gloss050), "glossary hooks family");
  assert(/pitfalls lint/.test(gloss050), "glossary pitfalls lint");
  const det050 = fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8");
  assert(/S_AGENT_CONFIG/.test(det050) && /S_MULTI_TOOL/.test(det050), "detect L5 signals");
  const rp050 = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(/agent_config/.test(rp050) && /hooks_family/.test(rp050), "recommended-profile L5 rows");

  // pitfalls 工程化
  const pitTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/agent-kb/pitfalls.md"),
    "utf8"
  );
  assert(/触发路径\/关键词/.test(pitTmpl), "pitfalls tmpl 7-col header");
  assert(/## 路径速查/.test(pitTmpl) && /## 已根治留档/.test(pitTmpl), "pitfalls tmpl sections");
  assert(/\{\{PITFALL_DOMAINS\}\}/.test(pitTmpl), "pitfalls tmpl domains placeholder");
  const lintTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/lint-pitfalls.mjs.tmpl"),
    "utf8"
  );
  assert(/\{\{PITFALL_DOMAINS\}\}/.test(lintTmpl), "lint tmpl domains placeholder");
  assert(!/"Maven"/.test(lintTmpl), "lint tmpl default vocab de-domainized");
  const r19 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/19-agent-kb.mdc.tmpl"),
    "utf8"
  );
  assert(/lint-pitfalls\.mjs/.test(r19), "rule19 requires lint run");
  assert(/三问/.test(r19), "rule19 has 三问 timing");
  const r00050 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/路径速查/.test(r00050), "rule00 pitfalls query protocol");
  assert(/sync\.mjs/.test(r00050), "rule00 agent-config commit gate line");
  assert(/生成物勿手改/.test(r00050), "rule00 generated-artifacts rule");
  const conflict050 = fs.readFileSync(path.join(skillRoot, "conflict-policy.md"), "utf8");
  assert(/agent_config/.test(conflict050), "conflict-policy L5 rows");
  const upg050 = fs.readFileSync(path.join(skillRoot, "upgrade.md"), "utf8");
  assert(/0\.4\.0 → 0\.5\.0/.test(upg050), "upgrade has 0.4.0 → 0.5.0 path");
  assert(/0\.5\.0 → 0\.5\.1/.test(upg050), "upgrade has 0.5.0 → 0.5.1 path");
  assert(/0\.5\.1 → 0\.5\.2/.test(upg050), "upgrade has 0.5.1 → 0.5.2 path");
  assert(/0\.5\.2 → 0\.5\.3/.test(upg050), "upgrade has 0.5.2 → 0.5.3 path");
  assert(/0\.5\.3 → 0\.5\.4/.test(upg050), "upgrade has 0.5.3 → 0.5.4 path");
  assert(/0\.5\.4 → 0\.5\.5/.test(upg050), "upgrade has 0.5.4 → 0.5.5 path");
  assert(/0\.5\.5 → 0\.5\.6/.test(upg050), "upgrade has 0.5.5 → 0.5.6 path");
  assert(/0\.5\.6 → 0\.5\.7/.test(upg050), "upgrade has 0.5.6 → 0.5.7 path");
  assert(/0\.5\.7 → 0\.5\.8/.test(upg050), "upgrade has 0.5.7 → 0.5.8 path");
  assert(/0\.5\.8 → 0\.5\.9/.test(upg050), "upgrade has 0.5.8 → 0.5.9 path");
  assert(/反向拷贝/.test(upg050), "upgrade MATURE adopt L5 reverse-copy");
  const audit050 = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
  assert(/sync\.mjs --check/.test(audit050), "audit drift anti-pattern");
  assert(/pitfalls 未过 lint/.test(audit050), "audit pitfalls-lint anti-pattern");
  const aiTools050 = fs.readFileSync(path.join(skillRoot, "ai-tools.md"), "utf8");
  assert(/hooks 家族/.test(aiTools050), "ai-tools hooks family section");
  assert(/配置 SSOT 管线/.test(aiTools050), "ai-tools L5 section");
  assert(/协议族/.test(aiTools050), "ai-tools protocol family section");
  assert(/\.qoder\/settings\.json/.test(aiTools050), "ai-tools qoder settings hooks");
  assert(/\.trae\/hooks\.json/.test(aiTools050), "ai-tools trae hooks.json");
  assert(/workbuddy/.test(aiTools050) && /全家桶|settings\.json/.test(aiTools050), "ai-tools workbuddy family");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/qoder-settings.hooks.json.tmpl")),
    "qoder-settings.hooks.json.tmpl"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/trae-hooks.json.tmpl")),
    "trae-hooks.json.tmpl"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/codebuddy-settings.hooks.json.tmpl")),
    "codebuddy-settings.hooks.json.tmpl"
  );
  assert(/HOOKS_QODER_GROUPS/.test(manifest), "manifest HOOKS_QODER_GROUPS");
  assert(/HOOKS_TRAE_GROUPS/.test(manifest), "manifest HOOKS_TRAE_GROUPS");
  assert(/HOOKS_CODEBUDDY_GROUPS/.test(manifest), "manifest HOOKS_CODEBUDDY_GROUPS");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/mcp-paths.mjs")),
    "mcp-paths.mjs"
  );
  assert(fs.existsSync(path.join(skillRoot, "sync-hosts.md")), "sync-hosts.md");
  for (const a of ["cursor", "claude", "qoder", "trae", "workbuddy", "codex"]) {
    assert(
      fs.existsSync(path.join(skillRoot, `templates/ai-tools/adapters/${a}.md`)),
      `adapter ${a}.md`
    );
  }
}

// --- 0.5.2 runtime: L4 hooks 家族直渲 + L5 render→sync --check + lint-pitfalls 好坏例 ---
{
  const basePlaceholders = {
    REPO_NAME: "demo",
    REPO_DESC: "demo",
    DATE: "2026-08-31",
    AGENTS_VARIANT: "solo",
    LADDER_TARGET: "L4",
    GLOB_PROFILE: "wide",
    LAST_MODE: "land",
    MODULE_DIRS: "",
    CODE_PREFIXES: "src/,apps/",
    COMMAND_TEST: "echo test",
    COMMAND_BUILD: "echo build",
    GLOB_API: "**/controller/**,docs/api/**",
    GLOB_FUNC: "**/src/**,docs/func/**",
    GLOB_DB: "**/db/**,docs/db/**",
    GLOB_JOBS: "docs/jobs/**",
    GLOB_KB: "docs/agent-kb/**",
    GLOB_SUPERPOWERS: "docs/superpowers/**",
    GLOB_AI_TOOLS: ".cursor/**",
    GLOB_OBSERVABILITY: "**/src/**",
    GLOB_FRONTEND: "apps/**",
    STACK_BADGES: "Java",
    PROJECT_NAME: "demo",
    PROJECT_DESC: "demo",
  };
  const family = ["commit-gate-extended", "mysql-guard", "after-edit", "stop-checklist"];

  // A) 非 L5：hooks 家族直渲
  const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), "harness-050-l4-"));
  try {
    const pA = path.join(tmpA, "params.json");
    fs.writeFileSync(
      pA,
      JSON.stringify({
        ladder: "L4",
        domains: ["func", "api", "db"],
        ai_tools: ["cursor", "claude", "qoder", "trae", "workbuddy"],
        agents_variant: "solo",
        hooks_family: family,
        expandFromManifest: true,
        placeholders: basePlaceholders,
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpA,
      "--params",
      pA,
    ]);
    assert(r.status === 0, "0.5.2 L4 render exits 0");
    const hooksJson = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".cursor/hooks.json"), "utf8")
    );
    assert(
      JSON.stringify(hooksJson).includes("git-commit-soft-gate.js"),
      "L4 hooks.json wires extended gate"
    );
    assert(
      hooksJson.hooks.beforeMCPExecution && hooksJson.hooks.afterFileEdit && hooksJson.hooks.stop,
      "L4 hooks.json wires family events"
    );
    const gateJs = fs.readFileSync(
      path.join(tmpA, ".cursor/hooks/git-commit-soft-gate.js"),
      "utf8"
    );
    assert(/id: "api"/.test(gateJs) && /id: "db"/.test(gateJs), "CONTRACT_CHECKS has selected domains");
    assert(!/\{\{[A-Z]/.test(gateJs), "extended gate no unresolved placeholders");
    for (const f of [
      ".cursor/hooks/git-commit-soft-gate.js",
      ".cursor/hooks/mcp-mysql-guard.js",
      ".cursor/hooks/after-edit-reminder.js",
      ".cursor/hooks/stop-delivery-checklist.js",
      ".claude/hooks/claude-adapter.js",
      ".qoder/hooks/claude-adapter.js",
      ".trae/hooks/claude-adapter.js",
      ".codebuddy/hooks/claude-adapter.js",
    ]) {
      assert(fs.existsSync(path.join(tmpA, f)), `L4 rendered ${f}`);
      const c = runNode(["--check", path.join(tmpA, f)]);
      assert(c.status === 0, `node --check ${f}`);
    }
    assert(
      !fs.existsSync(path.join(tmpA, ".cursor/hooks/superpowers-commit-gate.js")),
      "basic gate skipped when extended selected"
    );
    assert(
      !fs.existsSync(path.join(tmpA, "docs/agent-config")),
      "L4 without agent_config has no SSOT dir"
    );
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".claude/settings.json"), "utf8")
    );
    assert(
      JSON.stringify(settings).includes("claude-adapter.js"),
      "claude settings wired via adapter"
    );
    const qoderSettings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".qoder/settings.json"), "utf8")
    );
    assert(
      qoderSettings.hooks && qoderSettings.hooks.PreToolUse,
      "qoder settings uses Claude-style PreToolUse"
    );
    assert(
      !fs.existsSync(path.join(tmpA, ".qoder/hooks.json")),
      "qoder must not get Cursor-style hooks.json"
    );
    const traeHooks = JSON.parse(fs.readFileSync(path.join(tmpA, ".trae/hooks.json"), "utf8"));
    assert(traeHooks.hooks && traeHooks.hooks.PreToolUse, "trae hooks.json Claude-style");
    assert(
      fs.existsSync(path.join(tmpA, ".qoder/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to qoder .md"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".trae/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to trae .md"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".claude/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to claude .md"
    );
    const cbSettings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".codebuddy/settings.json"), "utf8")
    );
    assert(
      cbSettings.hooks && cbSettings.hooks.PreToolUse,
      "codebuddy settings Claude-style family hooks"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".codebuddy/rules/00-project-docs-overview/RULE.mdc")),
      "L4 mirrors rules to codebuddy RULE.mdc"
    );
    assert(fs.existsSync(path.join(tmpA, ".mcp.json.example")), "L4 root mcp example for qoder/claude");
    assert(fs.existsSync(path.join(tmpA, ".trae/mcp.json.example")), "L4 trae mcp example");
    const preCommit = fs.readFileSync(path.join(tmpA, ".githooks/pre-commit"), "utf8");
    assert(/git-commit-soft-gate\.js/.test(preCommit), "githooks pre-commit uses extended gate");
    assert(
      fs.existsSync(path.join(tmpA, ".githooks/git-commit-soft-gate.js")),
      "githooks gate copy rendered"
    );

    // lint-pitfalls：好例过、坏例拦
    const lint = runNode([path.join(tmpA, "scripts/agent-kb/lint-pitfalls.mjs")], {
      cwd: tmpA,
    });
    assert(lint.status === 0, "lint-pitfalls passes rendered template");
    fs.writeFileSync(
      path.join(tmpA, "docs/agent-kb/pitfalls.md"),
      [
        "# pitfalls",
        "",
        "## 路径速查",
        "",
        "| 路径 | 坑 |",
        "|---|---|",
        "| x | P1 |",
        "",
        "## 域速查",
        "",
        "| 域 | 坑 |",
        "|---|---|",
        "| NotADomain | P1 |",
        "",
        "## 台账（活跃）",
        "",
        "| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |",
        "|---|---|---|---|---|---|---|",
        "| P1 | 活跃 | NotADomain | x | y | z | w |",
        "",
        "## 已根治留档",
        "",
        "| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |",
        "|---|---|---|---|---|---|---|",
        "",
      ].join("\n"),
      "utf8"
    );
    const lintBad = runNode([path.join(tmpA, "scripts/agent-kb/lint-pitfalls.mjs")], {
      cwd: tmpA,
    });
    assert(lintBad.status === 1, "lint-pitfalls rejects bad domain");
  } finally {
    fs.rmSync(tmpA, { recursive: true, force: true });
  }

  // B) L5：render → sync → --check 无漂移
  const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), "harness-050-l5-"));
  try {
    const pB = path.join(tmpB, "params.json");
    fs.writeFileSync(
      pB,
      JSON.stringify({
        ladder: "L5",
        domains: ["func", "api", "db"],
        ai_tools: ["cursor", "claude", "qoder", "trae", "workbuddy"],
        agents_variant: "solo",
        hooks_family: family,
        expandFromManifest: true,
        placeholders: { ...basePlaceholders, LADDER_TARGET: "L5" },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpB,
      "--params",
      pB,
    ]);
    assert(r.status === 0, "0.5.2 L5 render exits 0");
    assert(
      fs.existsSync(path.join(tmpB, "docs/agent-config/README.md")) &&
        fs.existsSync(path.join(tmpB, "scripts/agent-config/sync.mjs")) &&
        fs.existsSync(path.join(tmpB, "docs/agent-config/hooks/hooks.config.json")),
      "L5 pack rendered"
    );
    assert(
      fs.existsSync(path.join(tmpB, "docs/agent-config/rules/00-project-docs-overview.mdc")),
      "L5 rules rendered to SSOT side"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc")),
      "L5 does not direct-render .cursor/rules"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".cursor/hooks.json")),
      "L5 skips direct hooks.json (sync owns it)"
    );
    assert(
      !fs.existsSync(path.join(tmpB, "CLAUDE.md")),
      "L5 skips template CLAUDE.md (sync owns it)"
    );
    const syncSrc = fs.readFileSync(path.join(tmpB, "scripts/agent-config/sync.mjs"), "utf8");
    assert(!/\{\{[A-Z]/.test(syncSrc), "rendered sync.mjs no unresolved placeholders");
    const check0 = runNode(["--check", path.join(tmpB, "scripts/agent-config/sync.mjs")]);
    assert(check0.status === 0, "rendered sync.mjs syntax");
    const meta = fs.readFileSync(path.join(tmpB, "docs/harness-eng/harness-meta.yaml"), "utf8");
    assert(/agent_config:\s*true/.test(meta), "harness-meta agent_config true");

    const sync1 = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs")], { cwd: tmpB });
    assert(sync1.status === 0, "sync.mjs runs");
    const syncCheck = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpB,
    });
    assert(syncCheck.status === 0, "sync --check no drift after sync");
    assert(
      fs.existsSync(path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc")),
      "sync generated .cursor/rules"
    );
    const genHooks = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".cursor/hooks.json"), "utf8")
    );
    assert(
      JSON.stringify(genHooks).includes("git-commit-soft-gate.js") &&
        genHooks.hooks.beforeMCPExecution,
      "sync generated hooks.json with family"
    );
    const qoderSyncSettings = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".qoder/settings.json"), "utf8")
    );
    assert(
      qoderSyncSettings.hooks && qoderSyncSettings.hooks.PreToolUse,
      "L5 sync qoder settings Claude-style hooks"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".qoder/hooks.json")),
      "L5 sync must not emit .qoder/hooks.json"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".qoder/rules/00-project-docs-overview.md")),
      "L5 sync qoder rules as .md"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".claude/rules/00-project-docs-overview.md")),
      "L5 sync claude rules as .md"
    );
    assert(fs.existsSync(path.join(tmpB, ".mcp.json.example")), "L5 sync root mcp example");
    const traeSyncHooks = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".trae/hooks.json"), "utf8")
    );
    assert(traeSyncHooks.hooks && traeSyncHooks.hooks.PreToolUse, "L5 sync trae hooks.json");
    assert(
      fs.existsSync(path.join(tmpB, ".trae/rules/00-project-docs-overview.md")),
      "L5 sync trae rules as .md"
    );
    assert(fs.existsSync(path.join(tmpB, ".trae/mcp.json.example")), "L5 sync trae mcp example");
    const cbSync = JSON.parse(fs.readFileSync(path.join(tmpB, ".codebuddy/settings.json"), "utf8"));
    assert(cbSync.hooks && cbSync.hooks.PreToolUse, "L5 sync codebuddy settings hooks");
    assert(
      fs.existsSync(path.join(tmpB, ".codebuddy/rules/00-project-docs-overview/RULE.mdc")),
      "L5 sync codebuddy rules"
    );
    const preCommitB = fs.readFileSync(path.join(tmpB, ".githooks/pre-commit"), "utf8");
    assert(
      /\.\.\/docs\/agent-config\/hooks\/git-commit-soft-gate\.js/.test(preCommitB),
      "L5 githooks references SSOT script"
    );

    // 漂移检测：手改生成物后 --check 必须非 0
    fs.appendFileSync(
      path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc"),
      "\nhand edit\n",
      "utf8"
    );
    const drift = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpB,
    });
    assert(drift.status === 1, "sync --check detects drift");

    // 功能：extended 门禁对契约漏同步出提醒（有 git 才跑）
    const gitOk = spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0;
    if (gitOk) {
      const sync2 = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs")], { cwd: tmpB });
      assert(sync2.status === 0, "sync re-applied after drift");
      const g = (args) =>
        spawnSync("git", args, { cwd: tmpB, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      g(["init", "-q"]);
      g(["config", "user.email", "t@t.com"]);
      g(["config", "user.name", "t"]);
      fs.mkdirSync(path.join(tmpB, "src/controller"), { recursive: true });
      fs.writeFileSync(path.join(tmpB, "src/controller/Foo.java"), "class Foo {}\n", "utf8");
      g(["add", "src/controller/Foo.java"]);
      const gateRun = spawnSync(
        "node",
        [".cursor/hooks/git-commit-soft-gate.js"],
        {
          cwd: tmpB,
          input: JSON.stringify({ command: "git " + "commit -m x" }),
          encoding: "utf8",
          timeout: 15000,
        }
      );
      let reply = null;
      try {
        reply = JSON.parse(gateRun.stdout.trim().split(/\r?\n/).pop());
      } catch (_) {
        reply = null;
      }
      assert(reply && reply.permission === "allow", "gate fail-open allow");
      assert(
        reply && /\[api\]/.test(reply.agent_message || ""),
        "gate reminds api contract sync"
      );
    }
  } finally {
    fs.rmSync(tmpB, { recursive: true, force: true });
  }
}

// --- 0.5.6 harness-meta / mcp-usage-guide under docs/harness-eng ---
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/harness-meta.mjs")),
  "lib/harness-meta.mjs"
);
assert(
  /target:\s*docs\/harness-eng\/harness-meta\.yaml/.test(manifest),
  "manifest harness-meta target is docs/harness-eng/"
);
assert(
  /target:\s*docs\/harness-eng\/mcp-usage-guide\.md/.test(manifest),
  "manifest mcp-usage-guide target is docs/harness-eng/"
);
assert(
  !/target:\s*\.cursor\/harness-meta\.yaml/.test(manifest),
  "manifest harness-meta target is no longer .cursor/"
);
assert(
  !/target:\s*\.cursor\/mcp-usage-guide\.md/.test(manifest),
  "manifest mcp-usage-guide target is no longer .cursor/"
);
{
  const detect056 = fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8");
  assert(
    /docs\/harness-eng\/harness-meta\.yaml/.test(detect056) && /S_HARNESS_META/.test(detect056),
    "detect S_HARNESS_META prefers docs/harness-eng/"
  );
  assert(/回退|\.cursor\/harness-meta/.test(detect056), "detect S_HARNESS_META documents legacy fallback");
}
assert(
  /docs\/harness-eng\/harness-meta\.yaml/.test(ladderMd),
  "ladder L0 checklist prefers docs/harness-eng/harness-meta.yaml"
);
assert(
  !/^- \[ \] `\.cursor\/harness-meta\.yaml` 存在/.test(ladderMd),
  "L0 checklist is not .cursor-only for meta"
);
assert(/回退/.test(ladderMd), "ladder documents legacy meta fallback");
assert(
  /docs\/harness-eng\/mcp-usage-guide\.md/.test(ladderMd),
  "ladder L4 prefers docs/harness-eng/mcp-usage-guide.md"
);
assert(/docs\/harness-eng\/harness-meta\.yaml/.test(skill), "SKILL Done prefers new meta path");
{
  const conflict056 = fs.readFileSync(path.join(skillRoot, "conflict-policy.md"), "utf8");
  assert(/docs\/harness-eng\/harness-meta\.yaml/.test(conflict056), "conflict-policy writes new meta path");
  assert(/不自动删除/.test(conflict056), "conflict-policy leaves legacy meta in place");
}
assert(
  /宿主的 MCP 设置|当前 Agent 宿主/.test(
    fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp-usage-guide.md.tmpl"), "utf8")
  ),
  "mcp-usage-guide enable steps are host-agnostic"
);
assert(
  !/Cursor → Settings → MCP/.test(
    fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp-usage-guide.md.tmpl"), "utf8")
  ),
  "mcp-usage-guide dropped Cursor-only Settings → MCP"
);
{
  const libDash = fs.readFileSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs"), "utf8");
  const reportSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-report-html.mjs"), "utf8");
  assert(/findHarnessMetaFile|HARNESS_META_READ_CANDIDATES/.test(libDash), "session-dash reads via harness-meta helper");
  assert(/HARNESS_META_READ_CANDIDATES/.test(reportSrc), "fill-report-html reads via harness-meta candidates");
  const render056 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/migrateHarnessMetaIfNeeded/.test(render056), "render migrates legacy meta to new path");
}
{
  const tmpMeta = fs.mkdtempSync(path.join(os.tmpdir(), "he-meta-ladder-"));
  try {
    fs.mkdirSync(path.join(tmpMeta, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpMeta, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L2\ncustom_user_key: keep-me\n',
      "utf8"
    );
    assert(harnessMetaExists(tmpMeta), "helper sees legacy .cursor meta");
    const foundLegacy = findHarnessMetaFile(tmpMeta);
    assert(foundLegacy && foundLegacy.rel === ".cursor/harness-meta.yaml", "helper falls back to .cursor yaml");
    const newDir = path.join(tmpMeta, "docs/harness-eng");
    fs.mkdirSync(newDir, { recursive: true });
    fs.writeFileSync(path.join(newDir, "harness-meta.yaml"), "ladder: L4\n", "utf8");
    const foundNew = findHarnessMetaFile(tmpMeta);
    assert(foundNew && foundNew.rel === HARNESS_META_CANONICAL, "helper prefers docs/harness-eng/ meta");
    fs.rmSync(path.join(newDir, "harness-meta.yaml"));
    const mig = migrateHarnessMetaIfNeeded(tmpMeta);
    assert(mig.migrated === true && fs.existsSync(path.join(tmpMeta, HARNESS_META_CANONICAL)), "migrate copies old meta to new path");
    assert(fs.existsSync(path.join(tmpMeta, ".cursor/harness-meta.yaml")), "migrate leaves legacy meta in place");
    fs.writeFileSync(path.join(tmpMeta, ".cursor/mcp-usage-guide.md"), "# old guide\n勿提交真密\n", "utf8");
    assert(findMcpUsageGuideFile(tmpMeta)?.rel === ".cursor/mcp-usage-guide.md", "guide helper falls back to .cursor");
    const migG = migrateMcpUsageGuideIfNeeded(tmpMeta);
    assert(migG.migrated === true && fs.existsSync(path.join(tmpMeta, MCP_USAGE_GUIDE_CANONICAL)), "migrate copies old guide to new path");
    assert(fs.existsSync(path.join(tmpMeta, ".cursor/mcp-usage-guide.md")), "migrate leaves legacy guide in place");
  } finally {
    fs.rmSync(tmpMeta, { recursive: true, force: true });
  }
}
{
  const skelNew = fs.mkdtempSync(path.join(os.tmpdir(), "he-skel-new-"));
  const skelOld = fs.mkdtempSync(path.join(os.tmpdir(), "he-skel-old-"));
  try {
    const seed = (root, metaRel) => {
      fs.mkdirSync(path.join(root, "docs/api"), { recursive: true });
      fs.mkdirSync(path.join(root, "docs/func"), { recursive: true });
      fs.mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
      fs.writeFileSync(path.join(root, "AGENTS.md"), "# agents\n", "utf8");
      fs.writeFileSync(path.join(root, "docs/api/api.md"), "# api\n", "utf8");
      fs.writeFileSync(path.join(root, "docs/func/func.md"), "# func\n", "utf8");
      fs.writeFileSync(
        path.join(root, metaRel),
        'skill: harness-eng\nladder: L4\nskill_version: "0.5.6"\n',
        "utf8"
      );
      fs.mkdirSync(path.join(root, ".cursor"), { recursive: true });
      fs.writeFileSync(path.join(root, ".cursor/mcp.json.example"), "{}\n", "utf8");
      const guideRel =
        metaRel.startsWith("docs/")
          ? "docs/harness-eng/mcp-usage-guide.md"
          : ".cursor/mcp-usage-guide.md";
      fs.mkdirSync(path.dirname(path.join(root, guideRel)), { recursive: true });
      fs.writeFileSync(path.join(root, guideRel), "# guide\n勿提交真密\n", "utf8");
    };
    seed(skelNew, HARNESS_META_CANONICAL);
    seed(skelOld, ".cursor/harness-meta.yaml");
    const runScore = (root) => {
      const r = runNode([
        path.join(skillRoot, "scripts/fill-score.mjs"),
        "--root",
        root,
        "--json",
      ]);
      assert(r.status === 0, `fill-score exits 0 for ${root}`);
      let json = null;
      try {
        json = JSON.parse(r.stdout.trim());
      } catch {
        json = null;
      }
      return json;
    };
    const newScore = runScore(skelNew);
    const oldScore = runScore(skelOld);
    assert(newScore?.skeleton_ready?.ok === true, "fill-score L0/L4 skeleton accepts new meta path only");
    assert(oldScore?.skeleton_ready?.ok === true, "fill-score L0/L4 skeleton accepts legacy .cursor meta");
    assert(newScore?.skeleton_ready?.files_ok >= 4, "new-path skeleton counts meta file");
    assert(oldScore?.skeleton_ready?.files_ok >= 4, "legacy-path skeleton counts meta file");
  } finally {
    fs.rmSync(skelNew, { recursive: true, force: true });
    fs.rmSync(skelOld, { recursive: true, force: true });
  }
}
{
  const tmpR = fs.mkdtempSync(path.join(os.tmpdir(), "he-meta-render-"));
  const pR = path.join(tmpR, "params.json");
  try {
    fs.mkdirSync(path.join(tmpR, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpR, ".cursor/harness-meta.yaml"),
      [
        "skill: harness-eng",
        'skill_version: "0.5.5"',
        "ladder: L0",
        "custom_user_key: keep-me",
        "domains: []",
        "",
      ].join("\n"),
      "utf8"
    );
    fs.writeFileSync(
      pR,
      JSON.stringify({
        ladder: "L0",
        domains: [],
        agents_variant: "solo",
        on_exists: "skip",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          DATE: "2026-09-12",
          AGENTS_VARIANT: "solo",
          LADDER_TARGET: "L0",
          DOMAINS_YAML: "[]",
          GLOB_PROFILE: "wide",
          LAST_MODE: "resume",
          AI_TOOLS_YAML: "[cursor]",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpR,
      "--params",
      pR,
    ]);
    assert(r.status === 0, "render resume migrates/writes new meta path");
    assert(
      fs.existsSync(path.join(tmpR, "docs/harness-eng/harness-meta.yaml")),
      "render wrote docs/harness-eng/harness-meta.yaml"
    );
    const migrated = fs.readFileSync(path.join(tmpR, "docs/harness-eng/harness-meta.yaml"), "utf8");
    assert(/custom_user_key:\s*keep-me/.test(migrated), "render migrate+merge keeps user keys");
    assert(/skill_version:\s*"?0\.5\.9"?/.test(migrated), "render migrate+merge updates skill_version");
    assert(
      fs.existsSync(path.join(tmpR, ".cursor/harness-meta.yaml")),
      "render leaves legacy meta file"
    );
  } finally {
    fs.rmSync(tmpR, { recursive: true, force: true });
  }
}

// --- 0.5.3 / 0.5.4 session dashboard ---
assert(
  fs.existsSync(path.join(skillRoot, "session-dashboard.md")),
  "session-dashboard.md"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/session-dash.mjs")),
  "session-dash.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs")),
  "lib/session-dashboard.mjs"
);
assert(/会话仪表盘/.test(skill), "SKILL mandates session dashboard footer");
assert(/session-dashboard\.md/.test(skill), "SKILL points session-dashboard.md");
assert(/工程轮/.test(skill), "SKILL gates dashboard to engineering turns");
assert(!/\*\*每轮回复末尾\*\*/.test(skill), "SKILL no unconditional every-turn dashboard");
const sessionDashMd = fs.readFileSync(path.join(skillRoot, "session-dashboard.md"), "utf8");
assert(/决策台/.test(sessionDashMd) && /趋势台/.test(sessionDashMd), "session-dashboard four panels");
assert(/详情请查询仪表盘/.test(sessionDashMd), "session-dashboard detail link copy");
assert(/使用手册\.html#s6/.test(sessionDashMd), "session-dashboard handbook anchor");
assert(/\*\*SHOW\*\*/.test(sessionDashMd) && /\*\*HIDE\*\*/.test(sessionDashMd), "session-dashboard SHOW/HIDE");
assert(/当前版本号多少/.test(sessionDashMd), "session-dashboard version-question hide example");
assert(/WritePlan 确认/.test(sessionDashMd), "session-dashboard mid-session meta still SHOW");
assert(/含糊/.test(sessionDashMd), "session-dashboard ambiguous defaults HIDE");
assert(/--intent engineering\|meta/.test(sessionDashMd), "session-dashboard documents --intent");
assert(!/会话内\*\*每一轮\*\*/.test(sessionDashMd), "session-dashboard SSOT no longer every-turn");
assert(/工程轮/.test(handbookMd), "使用手册.md dashboard is engineering-turn gated");
assert(!/Agent \*\*每一轮\*\*/.test(handbookMd), "使用手册.md no unconditional every-turn dashboard");
assert(/工程轮/.test(handbookHtml), "使用手册.html dashboard is engineering-turn gated");
assert(!/Agent <strong>每一轮<\/strong>/.test(handbookHtml), "使用手册.html no unconditional every-turn dashboard");
assert(/工程轮/.test(quickstartMd), "QUICKSTART dashboard is engineering-turn gated");
{
    const dashRoot = fs.mkdtempSync(path.join(os.tmpdir(), "he-session-dash-"));
  try {
    const scoreDir = path.join(dashRoot, "docs/harness-eng");
    fs.mkdirSync(scoreDir, { recursive: true });
    fs.copyFileSync(
      path.join(skillRoot, "scripts/fixtures/score-sample.json"),
      path.join(scoreDir, "score-latest.json")
    );
    fs.mkdirSync(path.join(dashRoot, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(dashRoot, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L3\ndomains: [api]\nlast_mode: audit\n',
      "utf8"
    );
    const dashRun = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--mode",
      "fill-score",
      "--json",
    ]);
    assert(dashRun.status === 0, "session-dash exits 0");
    let dashJson = null;
    try {
      dashJson = JSON.parse(dashRun.stdout.trim());
    } catch {
      dashJson = null;
    }
    assert(
      dashJson && dashJson.decision?.ai_coding_ready === false,
      "session-dash reads score ai_coding_ready"
    );
    assert(dashJson && dashJson.diagnose?.ladder === "L3", "session-dash reads legacy .cursor meta");
    const dashMd = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
    ]);
    assert(dashMd.status === 0 && /quadrantChart/.test(dashMd.stdout || ""), "session-dash renders mermaid");
    assert(/详情请查询仪表盘/.test(dashMd.stdout || ""), "session-dash detail link line");
    assert(/使用手册\.html#s6/.test(dashMd.stdout || ""), "session-dash handbook link");
    const dashEng = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--intent",
      "engineering",
    ]);
    assert(
      dashEng.status === 0 && /## harness-eng 会话仪表盘/.test(dashEng.stdout || ""),
      "session-dash --intent engineering renders"
    );
    const dashMeta = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--intent",
      "meta",
    ]);
    assert(dashMeta.status === 0, "session-dash --intent meta exits 0");
    assert(
      !/会话仪表盘/.test(dashMeta.stdout || ""),
      "session-dash --intent meta omits markdown"
    );
    const dashMetaJson = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--intent",
      "meta",
      "--json",
    ]);
    let metaJson = null;
    try {
      metaJson = JSON.parse((dashMetaJson.stdout || "").trim());
    } catch {
      metaJson = null;
    }
    assert(
      dashMetaJson.status === 0 && metaJson && metaJson.omitted === true && metaJson.reason === "meta",
      "session-dash --intent meta --json omitted"
    );
  } finally {
    fs.rmSync(dashRoot, { recursive: true, force: true });
  }
}

// --- 0.5.7: contract-sync 指针去 Cursor 唯权威 + 全量镜像宿主跳过冗余 1x ---
{
  const contractTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/ai-tools/contract-sync-mirror.md.tmpl"),
    "utf8"
  );
  assert(
    !/以[^\n]*\.cursor\/rules\/11\|12\|13\|16[^\n]*为准/.test(contractTmpl),
    "contract-sync tmpl no longer treats .cursor 11|12|13|16 as universal authority"
  );
  assert(/AGENTS\.md/.test(contractTmpl), "contract-sync tmpl points to root AGENTS.md");
  assert(/docs\//.test(contractTmpl), "contract-sync tmpl points to docs/** SSOT");
  assert(
    /\.claude\/rules|\.qoder\/rules|\.trae\/rules|\.codebuddy\/rules/.test(contractTmpl),
    "contract-sync tmpl mentions this-host mirrored sync rules"
  );
  assert(
    /示例|含 cursor|ai_tools/i.test(contractTmpl),
    "contract-sync tmpl treats .cursor/rules only as Cursor example"
  );

  const aiTools057 = fs.readFileSync(path.join(skillRoot, "ai-tools.md"), "utf8");
  assert(/对齐矩阵/.test(aiTools057), "ai-tools.md has 对齐矩阵");
  assert(/部分（P2）|部分对齐（P2）/.test(aiTools057), "ai-tools.md marks Codex as partial P2");
  assert(/中高/.test(aiTools057), "ai-tools.md marks Trae as 中高");
  assert(
    /跳过|不再强制|omit|不另写/.test(aiTools057) && /1x-contract-sync|契约 sync/.test(aiTools057),
    "ai-tools.md documents skip/omit 1x for full-mirror hosts"
  );
  assert(!/非 `cursor` 工具额外写入 \*\*契约 sync 镜像\*\*/.test(aiTools057) || /L0–L2|不全量镜像/.test(aiTools057),
    "ai-tools.md no longer implies 1x is always-on for every non-cursor host");

  const render057 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(
    /FULL_RULES_MIRROR_HOSTS|hostGetsFullRulesMirror|shouldEmitContractSync/.test(render057),
    "render encodes full-mirror / 1x emit conditions"
  );

  const handbook057 = fs.readFileSync(path.join(skillRoot, "使用手册.md"), "utf8");
  const syncHosts057 = fs.readFileSync(path.join(skillRoot, "sync-hosts.md"), "utf8");
  const codexAd057 = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/codex.md"), "utf8");
  assert(/对齐矩阵|部分（P2）|部分对齐（P2）/.test(handbook057), "handbook FAQ/docs mention alignment / Codex P2");
  assert(/部分对齐|P2/.test(syncHosts057), "sync-hosts.md keeps Codex as P2 / 部分对齐");
  assert(/部分对齐|P2/.test(codexAd057), "codex adapter stays 部分对齐 P2");
  assert(!/全量镜像/.test(codexAd057) || /暂不全量|不全量/.test(codexAd057), "codex adapter does not claim full sync");

  const conflict057 = fs.readFileSync(path.join(skillRoot, "conflict-policy.md"), "utf8");
  assert(
    /1x-contract-sync|契约 sync/.test(conflict057) && /不自动删除|不删/.test(conflict057),
    "conflict-policy: leftover 1x skip, do not auto-delete"
  );

  function dryTargets(ladder, tools, extra = {}) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "he-057-1x-"));
    const p = path.join(tmp, "params.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        ladder,
        domains: ["func", "api", "db", "redis"],
        ai_tools: tools,
        agents_variant: "solo",
        expandFromManifest: true,
        on_exists: "skip",
        ...extra,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          DATE: "2026-09-12",
          AGENTS_VARIANT: "solo",
          LADDER_TARGET: ladder,
          GLOB_PROFILE: "wide",
          LAST_MODE: "land",
          GLOB_API: "**/controller/**,docs/api/**",
          GLOB_FUNC: "**/src/**,docs/func/**",
          GLOB_DB: "**/db/**,docs/db/**",
          GLOB_REDIS: "**/redis/**,docs/redis/**",
        },
      }),
      "utf8"
    );
    try {
      const r = runNode([
        path.join(skillRoot, "scripts/render.mjs"),
        "--root",
        tmp,
        "--params",
        p,
        "--dry-run",
      ]);
      assert(r.status === 0, `0.5.7 dry-run ${ladder} exits 0`);
      if (r.status !== 0) {
        return { tmp, targets: [] };
      }
      const json = JSON.parse(r.stdout);
      const targets = (json.results || []).map((x) => String(x.target || "").replace(/\\/g, "/"));
      return { tmp, targets };
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  const FULL_MIRROR_1X = [
    ".claude/rules/1x-contract-sync.md",
    ".qoder/rules/1x-contract-sync.md",
    ".trae/rules/1x-contract-sync.md",
    ".codebuddy/rules/1x-contract-sync.md",
  ];
  const allTools = ["cursor", "claude", "qoder", "trae", "workbuddy", "codex"];

  const l0 = dryTargets("L0", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(l0.targets.includes(t), `L0 still emits ${t} (no full rules mirror yet)`);
  }
  assert(l0.targets.includes(".codex/contract-sync.md"), "L0 Codex still gets contract-sync pointer");
  assert(!l0.targets.includes(".cursor/rules/1x-contract-sync.md"), "Cursor never gets separate 1x");

  const l3 = dryTargets("L3", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(!l3.targets.includes(t), `L3 full-mirror host skips redundant ${t}`);
  }
  assert(l3.targets.includes(".codex/contract-sync.md"), "L3 Codex still gets contract-sync pointer");
  assert(
    l3.targets.includes(".claude/rules/11-func-sync-rules.md") ||
      l3.targets.includes(".qoder/rules/11-func-sync-rules.md"),
    "L3 full-mirror hosts still receive *-sync* rules"
  );

  const l5 = dryTargets("L5", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(!l5.targets.includes(t), `L5 omits redundant ${t}`);
  }
  assert(l5.targets.includes(".codex/contract-sync.md"), "L5 Codex still gets contract-sync pointer");
  assert(
    !l5.targets.some((t) => /1x-contract-sync/.test(t) && !t.startsWith(".codex/")),
    "L5 does not emit alwaysApply 1x alongside full mirrored sync rules"
  );
}

// --- 0.5.8 P0-1: detect / MATURE multi-host honesty ---
{
  const det058 = fs.readFileSync(path.join(skillRoot, "detect.md"), "utf8");
  assert(/\.claude\/rules/.test(det058), "S_RULES includes .claude/rules");
  assert(/\.qoder\/rules/.test(det058), "S_RULES includes .qoder/rules");
  assert(/\.trae\/rules/.test(det058), "S_RULES includes .trae/rules");
  assert(/\.codebuddy\/rules/.test(det058), "S_RULES includes .codebuddy/rules");
  assert(
    !/\| `S_RULES` \| `\.cursor\/rules\/\*\.mdc` 至少一个 \|/.test(det058),
    "S_RULES is not Cursor-only"
  );
  assert(/\.claude\/settings\.json/.test(det058), "S_HOOKS includes .claude/settings.json");
  assert(/\.qoder\/settings\.json/.test(det058), "S_HOOKS includes .qoder/settings.json");
  assert(/\.codebuddy\/settings\.json/.test(det058), "S_HOOKS includes .codebuddy/settings.json");
  assert(/\.trae\/hooks\.json/.test(det058), "S_HOOKS includes .trae/hooks.json");
  assert(/\.codex\/hooks\.json/.test(det058), "S_HOOKS includes .codex/hooks.json");
  assert(/\.githooks\/pre-commit/.test(det058), "S_HOOKS includes .githooks/pre-commit");
  assert(
    !/\| `S_HOOKS` \| `\.cursor\/hooks\.json` \|/.test(det058),
    "S_HOOKS is not Cursor-only"
  );
  assert(
    /MATURE[\s\S]*S_AGENTS_ROOT[\s\S]*S_RULES[\s\S]*S_KB/.test(det058),
    "MATURE still AGENTS + rules + contract + kb"
  );
  assert(
    /任一宿主|非仅 Cursor|非仅 `\.cursor\/rules`/.test(det058),
    "MATURE host-honest wording"
  );
  const rp058 = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(
    /S_RULES|S_HOOKS/.test(rp058) && /任一宿主|非仅 Cursor/.test(rp058),
    "recommended-profile MATURE uses host-honest detect"
  );
}

// --- 0.5.8 P0-4: Codex / L5 expectation (P2 / 部分对齐) ---
{
  const wp058 = fs.readFileSync(path.join(skillRoot, "write-plan.md"), "utf8");
  assert(/部分对齐|P2/.test(wp058) && /codex/i.test(wp058), "write-plan Codex P2 warning");
  assert(
    /不全量/.test(wp058) && /hooks/.test(wp058) && /MCP/.test(wp058) && /skills/.test(wp058),
    "write-plan says sync does not fully emit Codex rules/hooks/MCP/skills"
  );
  assert(/adapters\/codex/.test(wp058), "write-plan cross-links adapters/codex.md");

  const audit058 = fs.readFileSync(path.join(skillRoot, "audit-report.md"), "utf8");
  assert(
    /把 Codex \+ L5 当成全量对齐/.test(audit058) && /P2/.test(audit058),
    "audit anti-pattern Codex+L5 full-parity"
  );
  assert(/adapters\/codex/.test(audit058), "audit cross-links adapters/codex.md");

  const syncHosts058 = fs.readFileSync(path.join(skillRoot, "sync-hosts.md"), "utf8");
  assert(
    /## Done[\s\S]*部分对齐（P2）[\s\S]*\*\*不\*\*全量发出 Codex/.test(syncHosts058),
    "sync-hosts Done Codex P2 / not full emit"
  );
  assert(/adapters\/codex/.test(syncHosts058), "sync-hosts cross-links adapters/codex.md");

  const ladder058 = fs.readFileSync(path.join(skillRoot, "ladder.md"), "utf8");
  assert(
    /P2 \/ 部分对齐/.test(ladder058) && /\*\*不\*\*全量分发 Codex/.test(ladder058),
    "ladder L5 Codex P2 checklist"
  );

  const qYaml058 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(
    /Codex（部分对齐 P2/.test(qYaml058),
    "questions.yaml Codex option labels P2"
  );
  assert(
    /含 Codex 仍为 P2/.test(qYaml058),
    "questions.yaml L5 option mentions Codex P2"
  );

  const qMd058 = fs.readFileSync(path.join(skillRoot, "questions.md"), "utf8");
  assert(
    /部分（P2）/.test(qMd058) && /adapters\/codex/.test(qMd058),
    "questions.md Codex P2 + adapter link"
  );

  const rpCodex = fs.readFileSync(path.join(skillRoot, "recommended-profile.md"), "utf8");
  assert(
    /部分对齐（P2）/.test(rpCodex) && /\*\*不\*\*全量发出 Codex/.test(rpCodex),
    "recommended-profile Codex P2 footnote"
  );

  const heReadmeTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/README.md"),
    "utf8"
  );
  assert(
    (heReadmeTmpl.match(/\| `progress\.yaml` \|/g) || []).length === 1,
    "docs/harness-eng README tmpl has single progress.yaml row"
  );
  const domainsHead = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/schema_version/.test(domainsHead), "domains.yaml notes schema_version ≠ skill_version");
  const packsHead = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domain-packs.yaml"),
    "utf8"
  );
  assert(/schema_version/.test(packsHead), "domain-packs.yaml notes schema_version ≠ skill_version");
}

// --- 0.5.9 P1: hot-path index · land entry · fill CLI · fixtures · schema_version ---
{
  assert(fs.existsSync(path.join(skillRoot, "AGENT-INDEX.md")), "AGENT-INDEX.md");
  const agentIndex = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/必读/.test(agentIndex) && /land\.mjs/.test(agentIndex), "AGENT-INDEX has 必读 + land.mjs");
  assert(/fill\/README\.md/.test(agentIndex), "AGENT-INDEX points fill/README");
  assert(fs.existsSync(path.join(skillRoot, "fill/README.md")), "fill/README.md");
  const fillIdx = fs.readFileSync(path.join(skillRoot, "fill/README.md"), "utf8");
  assert(/fill-inventory\.mjs --domain/.test(fillIdx), "fill index documents unified inventory");
  assert(/fill-merge\.mjs --domain/.test(fillIdx), "fill index documents unified merge");
  assert(/别名/.test(fillIdx), "fill index says per-domain scripts are aliases");
  const skill059 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/AGENT-INDEX\.md/.test(skill059), "SKILL points AGENT-INDEX");
  assert(/fill\/README\.md/.test(skill059), "SKILL fill rows point at fill index");
  assert(/land\.mjs/.test(skill059), "SKILL prefers land.mjs");
  const fillMd059 = fs.readFileSync(path.join(skillRoot, "fill.md"), "utf8");
  assert(/fill-inventory\.mjs --domain/.test(fillMd059), "fill.md documents unified inventory");
  const wp059 = fs.readFileSync(path.join(skillRoot, "write-plan.md"), "utf8");
  assert(/land\.mjs/.test(wp059), "write-plan prefers land.mjs");
  const conflict059 = fs.readFileSync(path.join(skillRoot, "conflict-policy.md"), "utf8");
  assert(/land\.mjs/.test(conflict059), "conflict-policy names land.mjs");
  const qs059 = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  assert(/land\.mjs/.test(qs059), "QUICKSTART names land.mjs");
  assert(/fill-inventory\.mjs --domain/.test(qs059), "QUICKSTART unified inventory");

  const morphHead = fs.readFileSync(path.join(skillRoot, "templates/_meta/morph-required.yaml"), "utf8");
  assert(/schema_version/.test(morphHead) && /≠ skill_version|!= skill_version/.test(morphHead), "morph-required schema_version ≠ skill_version");
  const policyHead = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
    "utf8"
  );
  assert(/schema_version/.test(policyHead) && /≠ skill_version|!= skill_version/.test(policyHead), "score-policy schema_version ≠ skill_version");

  assert(fs.existsSync(path.join(skillRoot, "scripts/land.mjs")), "land.mjs");
  assert(fs.existsSync(path.join(skillRoot, "scripts/fill-inventory.mjs")), "fill-inventory.mjs");
  const invUni = fs.readFileSync(path.join(skillRoot, "scripts/fill-inventory.mjs"), "utf8");
  assert(/--domain/.test(invUni), "fill-inventory --domain");
  const landHelp = runNode([path.join(skillRoot, "scripts/land.mjs"), "--help"]);
  assert(landHelp.status === 0 && /--root/.test(landHelp.stdout), "land.mjs --help");
  const invHelp = runNode([path.join(skillRoot, "scripts/fill-inventory.mjs"), "--help"]);
  assert(invHelp.status === 0 && /--domain/.test(invHelp.stdout), "fill-inventory.mjs --help");
  const invDbHelp = runNode([
    path.join(skillRoot, "scripts/fill-inventory.mjs"),
    "--domain",
    "db",
    "--help",
  ]);
  assert(
    invDbHelp.status === 0 && /fill-inventory-db|--sql-root|--root/.test(invDbHelp.stdout + invDbHelp.stderr),
    "fill-inventory --domain db --help dispatches"
  );

  const matureFix = path.join(skillRoot, "scripts/fixtures/mature-claude");
  const qoderFix = path.join(skillRoot, "scripts/fixtures/qoder-hooks");
  const stackFix = path.join(skillRoot, "scripts/fixtures/stack-node");
  assert(fs.existsSync(path.join(matureFix, "AGENTS.md")), "mature-claude AGENTS.md");
  assert(fs.existsSync(path.join(matureFix, ".claude/rules/00-overview.md")), "mature-claude .claude/rules");
  assert(fs.existsSync(path.join(matureFix, "docs/api/api.md")), "mature-claude docs/api");
  assert(fs.existsSync(path.join(matureFix, "docs/agent-kb/README.md")), "mature-claude agent-kb");
  assert(!fs.existsSync(path.join(matureFix, ".cursor/rules")), "mature-claude has no .cursor/rules");
  const matureSig = scanSignals(matureFix);
  assert(matureSig.S_AGENTS_ROOT && matureSig.S_RULES && !matureSig.S_CURSOR_RULES, "mature-claude rules without cursor");
  assert(matureSig.S_API && matureSig.S_KB && matureSig.MATURE, "mature-claude MATURE without .cursor/rules");
  assert(fs.existsSync(path.join(qoderFix, ".qoder/settings.json")), "qoder-hooks settings.json");
  const qoderSig = scanSignals(qoderFix);
  assert(qoderSig.S_HOOKS, "qoder-hooks S_HOOKS via settings.json");
  assert(fs.existsSync(path.join(stackFix, "package.json")), "stack-node package.json");
  const stackSig = scanSignals(stackFix);
  assert(stackSig.S_STACK && !stackSig.MATURE, "stack-node S_STACK only");

  assert(isGeneratedHostPath(".cursor/rules/00-project-docs-overview.mdc"), "generated host: .cursor/rules");
  assert(isGeneratedHostPath("CLAUDE.md"), "generated host: CLAUDE.md");
  assert(!isGeneratedHostPath("docs/agent-config/rules/00.mdc"), "SSOT is not generated host");
  assert(!isGeneratedHostPath("AGENTS.md"), "AGENTS.md is not generated host");
  assert(
    resolveLandAgentConfig({ ladder: "L4" }, { agent_config: true }) === true,
    "land reads meta.agent_config"
  );
  assert(
    resolveLandAgentConfig({ ladder: "L5" }, null) === true,
    "land treats params.ladder L5 as agent_config"
  );
  assert(
    resolveLandAgentConfig({ ladder: "L4" }, { ladder: "L2" }) === false,
    "land L4 without meta flag is not agent_config"
  );

  const tmpL5 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-059-l5-"));
  try {
    const ph = {
      REPO_NAME: "demo",
      REPO_DESC: "demo",
      DATE: "2026-09-12",
      AGENTS_VARIANT: "solo",
      LADDER_TARGET: "L5",
      GLOB_PROFILE: "wide",
      LAST_MODE: "land",
      MODULE_DIRS: "",
      CODE_PREFIXES: "src/",
      COMMAND_TEST: "echo test",
      COMMAND_BUILD: "echo build",
      GLOB_API: "**/controller/**,docs/api/**",
      GLOB_FUNC: "**/src/**,docs/func/**",
      GLOB_DB: "**/db/**,docs/db/**",
      GLOB_JOBS: "docs/jobs/**",
      GLOB_KB: "docs/agent-kb/**",
      GLOB_SUPERPOWERS: "docs/superpowers/**",
      GLOB_AI_TOOLS: ".cursor/**",
      GLOB_OBSERVABILITY: "**/src/**",
      GLOB_FRONTEND: "apps/**",
      STACK_BADGES: "Java",
      PROJECT_NAME: "demo",
      PROJECT_DESC: "demo",
    };
    const pRefuse = path.join(tmpL5, "params-refuse.json");
    fs.writeFileSync(
      pRefuse,
      JSON.stringify({
        ladder: "L5",
        agent_config: true,
        files: [
          {
            template: "rules/00-project-docs-overview.mdc.tmpl",
            target: ".cursor/rules/00-project-docs-overview.mdc",
            action: "create",
          },
        ],
        placeholders: ph,
      }),
      "utf8"
    );
    const rRefuse = runNode([
      path.join(skillRoot, "scripts/land.mjs"),
      "--root",
      tmpL5,
      "--params",
      pRefuse,
      "--no-sync",
    ]);
    assert(rRefuse.status !== 0, "land L5 refuses explicit .cursor/rules file");
    assert(
      !fs.existsSync(path.join(tmpL5, ".cursor/rules/00-project-docs-overview.mdc")),
      "L5 land did not write .cursor/rules via render"
    );

    fs.mkdirSync(path.join(tmpL5, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpL5, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L5\nagent_config: true\nskill_version: "0.5.9"\n',
      "utf8"
    );
    const pMeta = path.join(tmpL5, "params-meta.json");
    fs.writeFileSync(
      pMeta,
      JSON.stringify({
        ladder: "L4",
        files: [
          {
            template: "rules/karpathy-guidelines.mdc",
            target: ".cursor/rules/karpathy-guidelines.mdc",
            action: "create",
          },
        ],
        placeholders: ph,
      }),
      "utf8"
    );
    const rMeta = runNode([
      path.join(skillRoot, "scripts/land.mjs"),
      "--root",
      tmpL5,
      "--params",
      pMeta,
      "--no-sync",
    ]);
    assert(rMeta.status !== 0, "land refuses generated host path when legacy meta agent_config");

    const tmpExpand = fs.mkdtempSync(path.join(os.tmpdir(), "harness-059-l5e-"));
    try {
      const pExp = path.join(tmpExpand, "params.json");
      fs.writeFileSync(
        pExp,
        JSON.stringify({
          ladder: "L5",
          domains: ["api"],
          ai_tools: ["cursor"],
          agents_variant: "solo",
          hooks_family: ["commit-gate"],
          expandFromManifest: true,
          placeholders: { ...ph, LADDER_TARGET: "L5" },
        }),
        "utf8"
      );
      const rExp = runNode([
        path.join(skillRoot, "scripts/land.mjs"),
        "--root",
        tmpExpand,
        "--params",
        pExp,
        "--no-sync",
      ]);
      assert(rExp.status === 0, "land L5 expand --no-sync exits 0");
      assert(
        !fs.existsSync(path.join(tmpExpand, ".cursor/rules/00-project-docs-overview.mdc")),
        "land L5 --no-sync does not write generated .cursor/rules"
      );
      assert(
        fs.existsSync(path.join(tmpExpand, "scripts/agent-config/sync.mjs")) ||
          fs.existsSync(path.join(tmpExpand, "docs/agent-config")),
        "land L5 still renders SSOT / sync script"
      );
    } finally {
      fs.rmSync(tmpExpand, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tmpL5, { recursive: true, force: true });
  }
}

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  ✓ ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  ✗ ${m}`);
  process.exit(1);
}

console.log("selfcheck PASS");
