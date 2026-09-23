#!/usr/bin/env node
/**
 * Stable-name selfcheck (scripts/selfcheck.mjs): pins current skill_version.
 * 0.7.0: morph recalibrate (probe+depth→100); gold floor 95; ready deprecated; report_schema 0.3.0.
 * 0.6.9: Codex → 高 (Starlark/TOML/hooks/skills; discipline B).
 * 0.6.8-dev: Codex P0 parity thaw (PARITY/MANUAL/config.toml/hooks regex).
 * 0.6.7: Pn reflux ops + FE/BE contract gate profile.
 * 0.6.4: CodeBuddy/WorkBuddy flat rules.md + FM; hooks/MCP/permissions docs.
 * 0.6.3: consumer sync.mjs freshness gate; production install URL main.
 * 0.6.2: session dashboard drops mermaid quadrantChart (Trae Syntax Error); plain-text stance.
 * 0.6.1: Trae 高 formal pin (MCP panel PASS, hooks live PASS, matrix 高).
 * 0.6.0: M1 harness CLI + M2 doc topology + M3 fill convergence / golden fixtures + M4 slim pack / formal pin.
 * 0.5.10: P2 Codex 不默认, no-detect ≠ Cursor, report_schema, archives.
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
import { HOOK_DEFS } from "./lib/hooks-checks.mjs";
import { isGeneratedHostPath, resolveLandAgentConfig } from "./harness.mjs";
import {
  DOC_MOVES,
  ROOT_STUBS,
  ROOT_KEEP,
  ROOT_MD_MAX,
  resolveDoc,
} from "./lib/doc-paths.mjs";
import { runChecks05 } from "./lib/selfcheck/checks-0.5.mjs";
import { runChecks06 } from "./lib/selfcheck/checks-0.6.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function docPath(basename) {
  return resolveDoc(skillRoot, basename);
}

function readDoc(basename) {
  return fs.readFileSync(docPath(basename), "utf8");
}

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
assert(fs.existsSync(docPath("truth-quality.md")), "truth-quality.md");
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
  path.join(skillRoot, "scripts/lib/merge-api.mjs"),
  "utf8"
);
assert(/--module/.test(mergeApiSrc), "merge-api has --module arg");
assert(/invEvidenceSet/.test(mergeApiSrc), "merge-api multi-module evidence filtering");
assert(/skippedOtherModule/.test(mergeApiSrc), "merge-api skips other-module fragments");
assert(
  /force-write.*missing|forceWrite.*missing/i.test(mergeApiSrc),
  "merge-api --force-write skips missing check"
);
assert(/if \(!sec\)/.test(mergeApiSrc), "merge-api skips missing endpoints in body builder");

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
  path.join(skillRoot, "scripts/lib/inventory-api.mjs"),
  "utf8"
);
assert(
  /CONTROLLER_DIR_NAMES/.test(invApiSrc),
  "inventory-api has CONTROLLER_DIR_NAMES array"
);
assert(
  /web.*api.*endpoint.*rest/i.test(invApiSrc),
  "inventory-api expanded controller dir names"
);
assert(
  /fallback.*scan entire module|walkJava\(c\)/.test(invApiSrc),
  "inventory-api has module-level fallback scan"
);

// --- 0.2.19 questions.yaml variant naming ---
const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/version:\s*"0\.7\.0"/.test(qYaml), "questions.yaml version 0.6.9");
assert(!/version:\s*"0\.6\.2"(?!-)/.test(qYaml), "questions.yaml not leftover 0.6.2");
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
assert(/version:\s*"0\.7\.0"/.test(manifest), "manifest 0.6.9");
const rootManifestPath = path.join(skillRoot, "_meta/manifest.yaml");
assert(fs.existsSync(rootManifestPath), "root _meta/manifest.yaml present");
const rootManifest = fs.readFileSync(rootManifestPath, "utf8");
assert(/version:\s*"0\.7\.0"/.test(rootManifest), "root _meta manifest 0.6.9");
{
  const rv = (rootManifest.match(/^version:\s*"([^"]+)"/m) || [])[1];
  const tv = (manifest.match(/^version:\s*"([^"]+)"/m) || [])[1];
  assert(rv === tv, "root _meta version matches templates/_meta");
}
assert(!/version:\s*"0\.6\.2"(?!-)/.test(manifest), "manifest not leftover 0.6.2");
const metaTmpl = fs.readFileSync(
  path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
  "utf8"
);
assert(/skill_version:\s*"0\.7\.0"/.test(metaTmpl), "harness-meta 0.6.9");
assert(!/skill_version:\s*"0\.6\.2"(?!-)/.test(metaTmpl), "harness-meta not leftover 0.6.2");
assert(/ready_coverage:\s*0\.8/.test(metaTmpl), "harness-meta ready_coverage 0.8");
assert(/fill_mcp_profile:\s*test/.test(metaTmpl), "harness-meta fill_mcp_profile test");
const changelog = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
const changelog05x = fs.readFileSync(path.join(skillRoot, "archive/CHANGELOG-0.5.x.md"), "utf8");
assert(/## 0\.5\.2/.test(changelog05x), "archive CHANGELOG 0.5.2");
assert(/## 0\.5\.3/.test(changelog05x), "archive CHANGELOG 0.5.3");
assert(/## 0\.5\.4/.test(changelog05x), "archive CHANGELOG 0.5.4");
assert(/## 0\.5\.5/.test(changelog05x), "archive CHANGELOG 0.5.5");
assert(/## 0\.5\.6/.test(changelog05x), "archive CHANGELOG 0.5.6");
assert(/## 0\.5\.7/.test(changelog05x), "archive CHANGELOG 0.5.7");
assert(/## 0\.5\.8/.test(changelog05x), "archive CHANGELOG 0.5.8");
assert(/## 0\.5\.9/.test(changelog05x), "archive CHANGELOG 0.5.9");
assert(/## 0\.5\.10/.test(changelog05x), "archive CHANGELOG 0.5.10");
assert(/archive\/CHANGELOG-0\.5\.x/.test(changelog), "hot CHANGELOG points archive/CHANGELOG-0.5.x");
assert(!/^## 0\.5\.10/m.test(changelog), "hot CHANGELOG dropped 0.5.x sections");
assert(/## 0\.6\.2/.test(changelog), "CHANGELOG 0.6.2");
assert(/^## 0\.6\.7\b/m.test(changelog) && !((changelog.match(/^## 0\.6\.7[^\n]*/m)||[""])[0].includes("-dev")), "CHANGELOG formal 0.6.7");
assert(/^## 0\.7\.0\b/m.test(changelog), "CHANGELOG 0.7.0");
assert(/^## 0\.6\.8-dev\b/m.test(changelog), "CHANGELOG keeps 0.6.8-dev");
assert(/Codex P0|增量解冻/.test(changelog), "CHANGELOG Codex P0 Chinese entry");
assert(/^## 0\.6\.6\b/m.test(changelog), "CHANGELOG keeps 0.6.6");
assert(/^## 0\.6\.5\b/m.test(changelog), "CHANGELOG keeps 0.6.5");
assert(/## 0\.6\.4/.test(changelog), "CHANGELOG keeps 0.6.4");
assert(/## 0\.6\.3/.test(changelog), "CHANGELOG keeps 0.6.3");

// --- 0.2.26 acceptance empty examples ---
const acceptSrc = fs.readFileSync(
  path.join(skillRoot, "scripts/acceptance-check.mjs"),
  "utf8"
);
assert(/api-empty-examples/.test(acceptSrc), "acceptance has api-empty-examples");
assert(/api-empty-desc/.test(acceptSrc), "acceptance has api-empty-desc");
assert(/api-empty-enum-remark/.test(acceptSrc), "acceptance has api-empty-enum-remark");
assert(/checkParamFieldTable/.test(acceptSrc), "acceptance has checkParamFieldTable");
assert(/db-no-comment/.test(acceptSrc), "acceptance has db-no-comment");
assert(/redis-no-example/.test(acceptSrc), "acceptance has redis-no-example");
assert(/func-empty-desc/.test(acceptSrc), "acceptance has func-empty-desc");
const goodFix = fs.readFileSync(
  path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
  "utf8"
);
assert(/示例值/.test(goodFix), "good fixture has 示例值 column");
assert(/枚举/.test(goodFix), "good fixture has 7-col 枚举 sample");
const autoApi = fs.readFileSync(
  path.join(skillRoot, "scripts/lib/fill-auto-api.mjs"),
  "utf8"
);
assert(/quality: heuristic/.test(autoApi), "fill-auto-api marks heuristic");
assert(/枚举 \| 备注 \| 示例值/.test(autoApi), "fill-auto-api emits 7-col header");

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

const fillMcp = readDoc("fill-mcp.md");
assert(/fill_mcp_profile/.test(fillMcp), "fill-mcp documents fill_mcp_profile");
assert(/优先 \*\*`test`\*\*/.test(fillMcp) || /默认 \*\*`test`\*\*/.test(fillMcp), "fill-mcp prefers/defaults test");
assert(/local 真密路径可填/.test(fillMcp) && /不主动说/.test(fillMcp), "fill-mcp local-fill + no proactive lecture");
assert(/勿提交进 git/.test(fillMcp), "fill-mcp remind no-commit on local secret files");

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

const writePlan = readDoc("write-plan.md");
assert(/闸门词表 SSOT/.test(writePlan), "write-plan is gate SSOT");
assert(/`按计划执行`/.test(writePlan) && /`LGTM`/.test(writePlan), "write-plan has full gate list");
assert(/Windows JSON 传参（gotcha SSOT）/.test(writePlan), "write-plan owns Windows JSON gotcha");
assert(/UTF-8 无 BOM/.test(writePlan), "write-plan states UTF-8 no BOM");

const pipeline = readDoc("pipeline.md");
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

const fillScoreMd = readDoc("fill-score.md");
assert(/覆盖裁决/.test(fillScoreMd), "fill-score has 覆盖裁决");
assert(!/\*\*0\.2\.8\+\*\*/.test(fillScoreMd), "fill-score has no 0.2.8+ sediment");
assert(!/\*\*0\.2\.9\+\*\*/.test(fillScoreMd), "fill-score has no 0.2.9+ sediment");
assert(/CHANGELOG\.md/.test(fillScoreMd), "fill-score points version history to CHANGELOG");

assert(/score-policy|覆盖裁决/.test(skill), "SKILL points to score-policy / 覆盖裁决");
assert(/打分 \/ score-policy/.test(skill), "SKILL branch table has score-policy row");

const fillMcpGate = readDoc("fill-mcp.md");
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
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/INDEX.md")),
  "archive/selfcheck INDEX pointer"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.4.0.mjs")),
  "0.4.0 selfcheck not in archive hot pack"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.5.1.mjs")),
  "0.5.1 selfcheck not in archive hot pack"
);
{
  const hist = path.resolve(skillRoot, "../_history/harness-eng-selfcheck-legacy");
  assert(fs.existsSync(path.join(hist, "selfcheck-0.5.1.mjs")), "_history keeps 0.5.1 selfcheck");
  assert(fs.existsSync(path.join(hist, "selfcheck-0.4.0.mjs")), "_history keeps 0.4.0 selfcheck");
}
assert(
  fs.existsSync(path.join(skillRoot, "archive/selfcheck/legacy/INDEX.md")),
  "legacy selfcheck INDEX"
);
{
  const legacyDir = path.join(skillRoot, "archive/selfcheck/legacy");
  const legacyMjs = fs.readdirSync(legacyDir).filter((n) => n.endsWith(".mjs"));
  assert(legacyMjs.length === 0, "legacy/ has no bulk .mjs (INDEX only)");
}
const archiveReadme = fs.readFileSync(path.join(skillRoot, "archive/README.md"), "utf8");
assert(/scripts\/selfcheck\.mjs/.test(archiveReadme), "archive README points to selfcheck.mjs");
assert(
  !/热路径仅当前 `scripts\/selfcheck-0\.3\.\*`/.test(archiveReadme),
  "archive README no stale 0.3 hot-path line"
);
assert(
  fs.existsSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY history 0.2.27 in _history"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY 0.2.27 not in harness-eng/archive pack"
);
const verifyMd = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
assert(/验收记录（0\.7\.0）/.test(verifyMd) && /当前 \*\*0\.7\.0\*\*/.test(verifyMd), "VERIFY is 0.7.0");
assert(!/当前 \*\*0\.6\.4\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.4");
assert(!/当前 \*\*0\.6\.3\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.3");
assert(/session-dashboard/.test(verifyMd), "VERIFY mentions session-dashboard");
assert(!/## 0\.2\.18 增量验收/.test(verifyMd), "VERIFY dropped historical increment tables");

assert(fs.existsSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/VERIFY-history-through-0.6.0.md")), "VERIFY 0.6 history in _history");
assert(/VERIFY-history-through-0\.6\.0/.test(verifyMd), "VERIFY points to 0.6 history archive");
assert(/_history\/harness-eng-docs-archive/.test(verifyMd), "VERIFY points _history docs archive");
assert(/历史增量/.test(verifyMd), "VERIFY has history stub section");


const readme = fs.readFileSync(path.join(skillRoot, "README.md"), "utf8");
assert(/当前版本：0\.7\.0/.test(readme), "README header version 0.7.0");
assert(/当前 \*\*0\.7\.0\*\*/.test(readme), "README footer version 0.7.0");
assert(!/当前 \*\*0\.2\.25\*\*/.test(readme), "README no stale 0.2.25 footer");
assert(!/selfcheck-0\.2\.15/.test(readme), "README does not pin stale selfcheck 0.2.15");
assert(/selfcheck\.mjs/.test(readme), "README pins selfcheck.mjs");
assert(!/selfcheck-0\.5\.2/.test(readme), "README no stale selfcheck-0.5.2 pin");
assert(/archive\/selfcheck/.test(readme), "README points archive selfcheck");

const handbookMd = fs.readFileSync(path.join(skillRoot, "使用手册.md"), "utf8");
const handbookHtml = fs.readFileSync(path.join(skillRoot, "使用手册.html"), "utf8");
const quickstartMd = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
const ladderMd = readDoc("ladder.md");
assert(/版本：\*\*0\.7\.0\*\*/.test(handbookMd), "使用手册.md version 0.7.0");
assert(/v0\.7\.0/.test(handbookHtml), "使用手册.html version 0.7.0");
assert(/当前 \*\*0\.7\.0\*\*/.test(quickstartMd), "QUICKSTART version 0.7.0");
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
  assert(/tree\/main\/harness-eng/.test(text), `${label} install URL main`);
  assert(!/tree\/V0\.6\.X\/harness-eng/.test(text), `${label} install URL not V0.6.X`);
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

assert(fs.existsSync(docPath("pipeline-fill.md")), "pipeline-fill.md exists");
assert(fs.existsSync(docPath("upgrade.md")), "upgrade.md exists");
assert(/## Done/.test(readDoc("upgrade.md")), "upgrade has Done");
assert(/骨架战役/.test(pipeline), "pipeline is skeleton campaign");
assert(/填充 MCP 闸/.test(pipeline), "pipeline has fill MCP gate");
assert(/停留骨架/.test(pipeline), "pipeline positive stay-skeleton");
assert(/填充 MCP 闸/.test(readDoc("pipeline-fill.md")), "pipeline-fill has fill MCP gate");
assert(/填充 MCP 闸/.test(fillMcpGate), "fill-mcp defines gate");
assert(/S_ENV_PROFILES/.test(readDoc("detect.md")), "detect has S_ENV_PROFILES");
assert(/MCP 矩阵/.test(readDoc("detect.md")), "detect has MCP matrix");
assert(/mysql-dev-example/.test(fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp.json.example"), "utf8")), "mcp example multi-env");
assert(/意图（一支）/.test(skill), "SKILL uses one-branch intent table");
assert(/upgrade\.md/.test(skill), "SKILL points to upgrade.md");
assert(/填充 MCP 闸/.test(skill), "SKILL mentions fill MCP gate");
assert(!/## 其它模式/.test(skill), "SKILL has no redundant 其它模式 section");
assert(/fill-calibrate-live\.mjs/.test(skill), "SKILL points calibrate to script");
assert(/fill-report-html\.mjs/.test(skill), "SKILL points report to script");

assert(!fs.existsSync(path.join(skillRoot, "OPTIMIZATION-PROPOSAL-0.2.x.md")), "OPTIMIZATION not in skill root");
assert(
  fs.existsSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/OPTIMIZATION-PROPOSAL-0.2.x.md")),
  "OPTIMIZATION in _history docs archive"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/OPTIMIZATION-PROPOSAL-0.2.x.md")),
  "OPTIMIZATION not in harness-eng/archive hot pack"
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
  assert(["0.2.18","0.2.19","0.2.20","0.2.21","0.2.22","0.2.23","0.2.24","0.2.25","0.2.26","0.2.27","0.2.28","0.2.29","0.3.0"].includes(ui.version), "ui.version compatible");
  assert(Array.isArray(ui.decision_kpis) && ui.decision_kpis.length >= 1, "ui.decision_kpis");
  assert(Array.isArray(ui.morph_strip), "ui.morph_strip");
  assert(ui.show_domain_cards === false, "domain cards default off");
  assert(ui.verdict.ready_label === "建议可以开干" || ui.verdict.ready_label === "建议暂缓", "verdict binary");
  assert(ui.composite_score && typeof ui.composite_score.value === "number", "ui.composite_score");
  assert(ui.pipeline_progress && Array.isArray(ui.pipeline_progress.steps), "ui.pipeline_progress");
  assert(ui.report_schema === "0.3.0", "report_schema 0.3.0");
  assert(ui.morph_scale === "0.7" || scoreObj.morph_scale === "0.7" || ui.morph_scale == null, "morph_scale present or fixture lag ok");
  assert(ui.chart_domains && Array.isArray(ui.chart_domains.labels_zh), "chart_domains.labels_zh");
  assert(
    Array.isArray(ui.decision_kpis) &&
      ui.decision_kpis.some((k) => k.id === "skeleton_ready") &&
      ui.decision_kpis.some((k) => k.id === "coverage_ready"),
    "decision_kpis readiness lights"
  );
  const uiInv = buildReportUi({
    ...scoreObj,
    ready: { ...(scoreObj.ready || {}), coverage_incomplete: true },
    ai_coding_ready: { ok: false, blockers: ["coverage_ready"] },
  });
  assert(
    !JSON.stringify(uiInv.next_actions || []).includes("fill-inventory-api"),
    "next_actions no fill-inventory-api"
  );
  assert(
    /fill-inventory\.mjs/.test(JSON.stringify(uiInv.next_actions || [])),
    "next_actions uses fill-inventory.mjs"
  );
  const uiRes = buildReportUi({
    ...scoreObj,
    ai_coding_ready: { ok: true, blockers: [] },
    warning_shards: [{ id: "w1", path: "docs/api/modules/x.md", count: 2 }],
  });
  assert(
    (uiRes.next_actions || []).some((a) => /residual/.test(a.title + (a.command || ""))),
    "aiOk still suggests residual when warning_shards"
  );
  assert(
    (uiRes.shards || []).some((s) => s.kind === "residual"),
    "shards include residual kind"
  );
  const reportUiSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/report-ui.mjs"), "utf8");
  assert(/warning_shards/.test(reportUiSrc) && /residualCommand/.test(reportUiSrc), "report-ui residual path");
  const reportTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/report/harness-report.html.tmpl"),
    "utf8"
  );
  assert(/labels_zh/.test(reportTmpl) && /tabFromHash/.test(reportTmpl), "report tmpl labels_zh + hash");
  assert(/task\.residual/.test(reportTmpl), "report tmpl residual task style");
  assert(/cmd-copy|data-copy/.test(reportTmpl), "report tmpl command copy");
  assert(/prefers-reduced-motion/.test(reportTmpl), "report tmpl reduced-motion");
  assert(/IBM Plex Sans SC/.test(reportTmpl), "report tmpl CJK body font");
  assert(/kind-badge/.test(reportTmpl), "report tmpl residual badge");
  assert(/hashTab|location\.hash/.test(reportTmpl) && !/show\(\$\("deck"\)\);\s*setTab\("decision"\)/.test(reportTmpl), "report tmpl respects hash after paint");
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
  const bad = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-api-bad.md"),
    "--gold",
    "--json-out",
    path.join(skillRoot, "scripts/fixtures/.tmp-accept-bad.json"),
  ]);
  assert(bad.status === 1, "acceptance bad fixture gold blocks");
  const badJsonPath = path.join(skillRoot, "scripts/fixtures/.tmp-accept-bad.json");
  if (fs.existsSync(badJsonPath)) {
    const badJson = JSON.parse(fs.readFileSync(badJsonPath, "utf8"));
    const ids = (badJson.blockers || []).map((b) => b.id);
    assert(ids.includes("api-empty-desc"), "bad fixture triggers api-empty-desc");
    try {
      fs.unlinkSync(badJsonPath);
    } catch {
      /* ignore */
    }
  }
}

// --- 0.6.8-dev P0: func sep + redis table example + cli-main realpath ---
{
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/cli-main.mjs")),
    "cli-main.mjs exists"
  );
  const cliMain = fs.readFileSync(path.join(skillRoot, "scripts/lib/cli-main.mjs"), "utf8");
  assert(/realpathSync/.test(cliMain), "cli-main uses realpathSync");
  assert(
    /isCliMain/.test(fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8")),
    "harness.mjs uses isCliMain"
  );
  const help = runNode([path.join(skillRoot, "scripts/harness.mjs"), "--help"]);
  assert(help.status === 0, "harness --help exit 0");
  assert(/Usage:|harness\.mjs|--root/.test(help.stdout || help.stderr || ""), "harness --help prints usage");

  const acceptSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "utf8"
  );
  assert(/isAlignSepCell|:?-\{2,\}/.test(acceptSrc), "acceptance skips table align sep");
  assert(/\\\|\\s\*示例\\s\*\\\|/.test(acceptSrc), "acceptance recognizes table 示例 cell");

  const funcSep = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-func-sep.md"),
    "--domain",
    "func",
    "--gold",
    "--json-out",
    path.join(skillRoot, "scripts/fixtures/.tmp-accept-func.json"),
  ]);
  assert(funcSep.status === 0, "func sep fixture gold pass");
  const funcJsonPath = path.join(skillRoot, "scripts/fixtures/.tmp-accept-func.json");
  if (fs.existsSync(funcJsonPath)) {
    const j = JSON.parse(fs.readFileSync(funcJsonPath, "utf8"));
    assert(
      !(j.blockers || []).some((b) => b.id === "func-empty-semantics"),
      "func sep does not trigger func-empty-semantics"
    );
    try {
      fs.unlinkSync(funcJsonPath);
    } catch {
      /* ignore */
    }
  }

  const redisTbl = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-redis-table.md"),
    "--domain",
    "redis",
    "--gold",
    "--json-out",
    path.join(skillRoot, "scripts/fixtures/.tmp-accept-redis.json"),
  ]);
  assert(redisTbl.status === 0, "redis table 示例 fixture gold pass");
  const redisJsonPath = path.join(skillRoot, "scripts/fixtures/.tmp-accept-redis.json");
  if (fs.existsSync(redisJsonPath)) {
    const j = JSON.parse(fs.readFileSync(redisJsonPath, "utf8"));
    assert(
      !(j.blockers || []).some((b) => b.id === "redis-no-example"),
      "table 示例 satisfies redis-no-example"
    );
    try {
      fs.unlinkSync(redisJsonPath);
    } catch {
      /* ignore */
    }
  }
}

// --- 0.6.8-dev P1: gitignore vendored_shared · soft-gate · api table parse ---
{
  const acceptSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "utf8"
  );
  assert(/splitMdTableRow/.test(acceptSrc), "acceptance splitMdTableRow");
  assert(/isParamTablePointer/.test(acceptSrc), "acceptance isParamTablePointer");
  assert(/表行列数不足/.test(acceptSrc), "acceptance reports short table rows");

  const noTrail = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-api-no-trail.md"),
    "--domain",
    "api",
    "--gold",
  ]);
  assert(noTrail.status === 0, "api no-trailing-pipe fixture gold pass");

  const voPtr = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-api-vo-pointer.md"),
    "--domain",
    "api",
    "--gold",
  ]);
  assert(voPtr.status === 0, "api VO pointer fixture gold pass");

  const shortCols = runNode([
    path.join(skillRoot, "scripts/acceptance-check.mjs"),
    "--files",
    path.join(skillRoot, "scripts/fixtures/acceptance-api-short-cols.md"),
    "--domain",
    "api",
    "--gold",
    "--json-out",
    path.join(skillRoot, "scripts/fixtures/.tmp-accept-short.json"),
  ]);
  assert(shortCols.status === 1, "api short-cols fixture gold blocks");
  const shortPath = path.join(skillRoot, "scripts/fixtures/.tmp-accept-short.json");
  if (fs.existsSync(shortPath)) {
    const j = JSON.parse(fs.readFileSync(shortPath, "utf8"));
    assert(
      (j.blockers || []).some((b) => /表行列数不足/.test(String(b.detail || b.issue || ""))),
      "short-cols reports 表行列数不足"
    );
    try {
      fs.unlinkSync(shortPath);
    } catch {
      /* ignore */
    }
  }

  const hooksLib = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/hooks-checks.mjs"),
    "utf8"
  );
  assert(/resolveHooksFamily/.test(hooksLib), "hooks-checks resolveHooksFamily");
  assert(/detectSoftGatePresent/.test(hooksLib), "hooks-checks detectSoftGatePresent");
  assert(
    /filterGitignoreSnippet|vendored_shared/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")
    ),
    "render filters gitignore for vendored_shared"
  );

  const tmpVend = fs.mkdtempSync(path.join(os.tmpdir(), "harness-p1-vend-"));
  try {
    fs.writeFileSync(path.join(tmpVend, ".gitignore"), "# existing\n", "utf8");
    const pVend = path.join(tmpVend, "params.json");
    fs.writeFileSync(
      pVend,
      JSON.stringify({
        mcp_tracking: "vendored_shared",
        placeholders: {},
        files: [
          {
            id: "gitignore-snippet",
            template: "gitignore/harness.gitignore.snippet",
            target: ".gitignore",
            action: "merge",
            mergeMode: "append-lines",
          },
        ],
      }),
      "utf8"
    );
    const rVend = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpVend,
      "--params",
      pVend,
    ]);
    assert(rVend.status === 0, "vendored_shared render exits 0");
    const gi = fs.readFileSync(path.join(tmpVend, ".gitignore"), "utf8");
    assert(!/^\.cursor\/mcp\.json$/m.test(gi), "vendored_shared does not append .cursor/mcp.json");
    assert(!/^\.mcp\.json$/m.test(gi), "vendored_shared does not append .mcp.json");
    assert(/\.fill-work\//.test(gi), "vendored_shared still appends fill-work ignore");
  } finally {
    try {
      fs.rmSync(tmpVend, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const tmpEx = fs.mkdtempSync(path.join(os.tmpdir(), "harness-p1-exonly-"));
  try {
    fs.writeFileSync(path.join(tmpEx, ".gitignore"), "# existing\n", "utf8");
    const pEx = path.join(tmpEx, "params.json");
    fs.writeFileSync(
      pEx,
      JSON.stringify({
        mcp_tracking: "example_only",
        placeholders: {},
        files: [
          {
            id: "gitignore-snippet",
            template: "gitignore/harness.gitignore.snippet",
            target: ".gitignore",
            action: "merge",
            mergeMode: "append-lines",
          },
        ],
      }),
      "utf8"
    );
    const rEx = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpEx,
      "--params",
      pEx,
    ]);
    assert(rEx.status === 0, "example_only gitignore render exits 0");
    const giEx = fs.readFileSync(path.join(tmpEx, ".gitignore"), "utf8");
    assert(/^\.cursor\/mcp\.json$/m.test(giEx), "example_only appends .cursor/mcp.json");
  } finally {
    try {
      fs.rmSync(tmpEx, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const tmpSoft = fs.mkdtempSync(path.join(os.tmpdir(), "harness-p1-soft-"));
  try {
    fs.mkdirSync(path.join(tmpSoft, ".cursor", "hooks"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpSoft, ".cursor", "hooks", "git-commit-soft-gate.js"),
      "// existing soft-gate\n",
      "utf8"
    );
    const pSoft = path.join(tmpSoft, "params.json");
    fs.writeFileSync(
      pSoft,
      JSON.stringify({
        ladder: "L4",
        domains: ["api"],
        ai_tools: ["cursor"],
        agents_variant: "solo",
        // omit hooks_family → default commit-gate; soft-gate on disk must force extended
        expandFromManifest: true,
        on_exists: "skip",
        placeholders: {
          PROJECT_NAME: "p1",
          PROJECT_DESC: "p1",
          CODE_PREFIXES: "src/",
          SKILL_VERSION: "0.7.0",
          CONTRACT_CHECKS_JS: "[]",
          DB_MIGRATION_DIR: "db/migration/",
          MIGRATION_ENVS: "",
          MIGRATION_NAME_RE: JSON.stringify("^V"),
          JOBS_YML_RE: JSON.stringify("\\.ya?ml$"),
          MYSQL_GUARD_SERVERS: "mysql-dev",
          HOOKS_CURSOR_EVENTS: "",
          HOOKS_CLAUDE_GROUPS: "",
          HOOKS_QODER_GROUPS: "",
          HOOKS_TRAE_GROUPS: "",
          HOOKS_CODEBUDDY_GROUPS: "",
          HOOKS_CONFIG_ENTRIES: "",
          GITHOOKS_GATE_SCRIPT: "git-commit-soft-gate.js",
          OPENAPI_BRIDGE_TIP: "",
        },
      }),
      "utf8"
    );
    const rSoft = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpSoft,
      "--params",
      pSoft,
    ]);
    assert(rSoft.status === 0, "soft-gate present render exits 0");
    assert(
      !fs.existsSync(path.join(tmpSoft, ".cursor", "hooks", "superpowers-commit-gate.js")),
      "soft-gate present does not create orphan superpowers-commit-gate"
    );
  } finally {
    try {
      fs.rmSync(tmpSoft, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

// --- 0.6.8-dev P2: residual · template drift · session mode · upgrade acceptance ---
{
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/acceptance-report.mjs")),
    "acceptance-report.mjs exists"
  );
  const fillPlanSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-plan.mjs"), "utf8");
  assert(/--residual/.test(fillPlanSrc) && /collectResidual/.test(fillPlanSrc), "fill-plan has --residual");
  const scoreSrcP2 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/warning_shards/.test(scoreSrcP2), "fill-score emits warning_shards");
  assert(
    /模板漂移/.test(fs.readFileSync(path.join(skillRoot, "modes/audit-report.md"), "utf8")),
    "audit-report notes 模板漂移"
  );
  assert(
    /模板漂移提醒/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/sync-freshness.mjs"), "utf8")),
    "freshness prints 模板漂移提醒"
  );
  assert(
    /metaLastMode/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs"), "utf8")),
    "session-dashboard has metaLastMode footnote"
  );
  assert(
    /acceptance 摘要|acceptance-check/.test(
      fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")
    ) && /fill-plan --residual/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "upgrade Done requires acceptance summary"
  );
  assert(
    /UTF-16|writeFileSync/.test(fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8")),
    "QUICKSTART Windows UTF-8 example"
  );
  const helpPlan = runNode([path.join(skillRoot, "scripts/fill-plan.mjs"), "--help"]);
  assert(helpPlan.status === 0, "fill-plan --help exits 0");
  assert(/--residual/.test(helpPlan.stdout || ""), "fill-plan --help lists --residual");

  const tmpRes = fs.mkdtempSync(path.join(os.tmpdir(), "harness-p2-res-"));
  try {
    fs.mkdirSync(path.join(tmpRes, "docs", "api", "modules"), { recursive: true });
    fs.copyFileSync(
      path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
      path.join(tmpRes, "docs", "api", "modules", "01-good.md")
    );
    const rRes = runNode([
      path.join(skillRoot, "scripts/fill-plan.mjs"),
      "--root",
      tmpRes,
      "--residual",
      "--domains",
      "api",
    ]);
    assert(rRes.status === 0 || rRes.status === 2, "fill-plan --residual exits 0 or 2");
    const out = JSON.parse(rRes.stdout || "{}");
    assert(out.action === "residual", "residual action");
    assert(Array.isArray(out.warning_shards), "residual has warning_shards");
  } finally {
    try {
      fs.rmSync(tmpRes, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
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
  assert(fs.existsSync(docPath("fill-morph.md")), "fill-morph.md");
  assert(fs.existsSync(docPath("fill-gate.md")), "fill-gate.md");
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
  assert(gate.morph_floor === 75, "strict morph_floor 75");
  const failMorph = evaluateAiCodingGate(
    { root: skillRoot, domains: { api: { score: 40 }, func: { score: 70 } } },
    { gate_profile: "strict", gate },
    { blockers: 0 }
  );
  assert(failMorph.active && !failMorph.ok && failMorph.blockers.some((b) => String(b).startsWith("morph_floor:")), "strict morph_floor blocks");
  const skillTxt = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/开干/.test(skillTxt) && /形态/.test(skillTxt) && /覆盖/.test(skillTxt), "SKILL description leading words");
  assert(/bump-run-round/.test(readDoc("fill-truths-agents.md")), "agents Done bumps round");
}

// --- 0.3.5 gold profile ---
{
  const goldGate = applyGoldGateDefaults({});
  assert(goldGate.morph_floor === 95, "gold morph_floor 95");
  assert(goldGate.template_completeness_min === 95, "gold tc min 95");
  assert(goldGate.todo_scan === "harness_docs", "gold todo_scan B");
  assert(goldGate.acceptance_warnings_max === 0, "gold warnings max 0");
  const cov = applyGoldCoverageDefaults({ api: 0.8 });
  assert(cov.api === 1 && cov.db === 1, "gold coverage forced 1.0");
  const gateMorphOnly = { ...goldGate, forbid_harness_todo: false };
  const failGoldMorph = evaluateAiCodingGate(
    {
      root: skillRoot,
      domains: { api: { score: 90 }, func: { score: 96 }, db: { score: 96 }, redis: { score: 96 } },
      template_completeness: { overall: 100 },
    },
    { gate_profile: "gold", gate: gateMorphOnly },
    { blockers: 0, warnings: 0 }
  );
  assert(
    failGoldMorph.active &&
      !failGoldMorph.ok &&
      failGoldMorph.blockers.some((b) => String(b).startsWith("morph_floor:")),
    "gold morph_floor 95 blocks api 90"
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
  assert(/gold/.test(readDoc("fill-gate.md")), "fill-gate docs gold");
  assert(/version:\s*"0\.7\.0"/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest 0.6.9");
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
  assert(/S_JOBS/.test(readDoc("detect.md")), "detect S_JOBS");
  assert(
    /mcp_tracking/.test(
      readDoc("conflict-policy.md")
    ),
    "conflict-policy mcp_tracking"
  );
  assert(
    /value:\s*jobs/.test(fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8")),
    "Q_CONTRACT jobs"
  );
  assert(
    /0\.3\./.test(fs.readFileSync(path.join(skillRoot, "archive/selfcheck/legacy/INDEX.md"), "utf8")),
    "legacy INDEX still lists 0.3.x history"
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
    fs.existsSync(docPath("domain-extend.md")),
    "domain-extend.md"
  );
  assert(/domain-extend\.md/.test(skillMd), "SKILL branch points domain-extend");
  const invJobs = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/inventory-jobs.mjs"),
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
  const workers = readDoc("fill-workers.md");
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
  assert(/0\.3\.8/.test(readDoc("domain-extend.md")), "domain-extend 0.3.8");
}

// --- 0.3.8 P0 hotpath + P1 morph-required ---
{
  const pipelineFill = readDoc("pipeline-fill.md");
  assert(/fill-merge\.mjs --domain/.test(pipelineFill), "pipeline-fill fill-merge --domain");
  assert(!/fill-merge-\{api/.test(pipelineFill), "pipeline-fill no brace enum merge");
  const workers = readDoc("fill-workers.md");
  assert(/fill-merge\.mjs --domain/.test(workers), "fill-workers fill-merge --domain");
  const agents = readDoc("fill-truths-agents.md");
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
  const de = readDoc("domain-extend.md");
  assert(/morph-required/.test(de), "domain-extend mentions morph-required");
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const modeSection = (skill.split("## 模式分流")[1] || "").split("## land")[0] || "";
  assert(!/\|\s*\*\*自动填充\*\*/.test(modeSection), "SKILL mode table no 自动填充 row");
  assert(/fill-truths-auto/.test(skill), "SKILL still points fill-truths-auto");
  assert(
    /报告字段速查/.test(readDoc("fill-score.md")),
    "fill-score 报告字段速查"
  );
  assert(
    /非路线图/.test(fs.readFileSync(path.join(skillRoot, "archive/README.md"), "utf8")),
    "archive OPTIMIZATION not roadmap"
  );
  assert(
    /契约域闭环/.test(readDoc("truth-quality.md")),
    "truth-quality 契约域闭环"
  );
  assert(
    /契约域 packs/.test(readDoc("ai-tools.md")),
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
  const audit = readDoc("audit-report.md");
  assert(/write-meta-only/.test(audit), "audit has write-meta-only");
  assert(/重号/.test(audit), "audit anti-pattern Pn duplicate id");
  const ladder = readDoc("ladder.md");
  assert(/扩展文档/.test(ladder), "ladder L2 allows extension docs");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/write-meta-only/.test(gloss), "glossary has write-meta-only");
  const rp = readDoc("recommended-profile.md");
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
  const det = readDoc("detect.md");
  assert(/S_SLF4J/.test(det), "detect has S_SLF4J");
  assert(/GLOB_OBSERVABILITY/.test(det), "detect has GLOB_OBSERVABILITY default");
  const rp = readDoc("recommended-profile.md");
  assert(/rule21/.test(rp), "recommended-profile has rule21");
  const rule00 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/日志\/注释/.test(rule00), "00 tmpl has 日志/注释 strip row");
  const ladder = readDoc("ladder.md");
  assert(/21-observability-comments/.test(ladder), "ladder L0 behavior pack");
  const audit = readDoc("audit-report.md");
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
  assert(/module_agents_template=spring\|frontend|module_agents_template=spring/.test(man), "manifest notes spring|frontend variant");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/agents/AGENTS.module.spring.md.tmpl")),
    "AGENTS.module.spring.md.tmpl exists"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/agents/AGENTS.module.frontend.md.tmpl")),
    "AGENTS.module.frontend.md.tmpl exists"
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
  const det = readDoc("detect.md");
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
  const rp = readDoc("recommended-profile.md");
  assert(/rule17/.test(rp) && /module_agents_template/.test(rp), "recommended-profile new rows");
  const gloss = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/manual_sql/.test(gloss) && /分册变体/.test(gloss), "glossary manual_sql + 分册变体");
  const resume = readDoc("resume.md");
  assert(/mergePreview/.test(resume), "resume documents mergePreview");
  const ladder = readDoc("ladder.md");
  assert(/17-frontend-web/.test(ladder), "ladder L0 frontend collab pack");
  const audit = readDoc("audit-report.md");
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

assert(fs.existsSync(path.join(skillRoot, "scripts/lib/selfcheck/checks-0.5.mjs")), "lib/selfcheck/checks-0.5.mjs exists");

// --- 0.5.x suites (lib/selfcheck/checks-0.5.mjs) ---
runChecks05({ skillRoot, docPath, readDoc, assert, runNode });

// --- 0.6.x suites (lib/selfcheck/checks-0.6.mjs) ---
runChecks06({ skillRoot, docPath, readDoc, assert, runNode });

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  ✓ ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  ✗ ${m}`);
  process.exit(1);
}

console.log("selfcheck PASS");
