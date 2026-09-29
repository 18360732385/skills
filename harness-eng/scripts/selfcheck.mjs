#!/usr/bin/env node
/**
 * Stable-name selfcheck (scripts/selfcheck.mjs): pins current skill_version.
 * 0.7.27: e2e P0 hotfix（NEW-1 buildSpringDbBlock · LT-1/HS-7 sync SSOT · passesWhenGates · HS-3 slash · SG-7 CJK · NEW-2 abs root）; 其上 0.7.26 e2e P2; 0.7.23 P3/P4; 0.7.22 中性 refresh-score; 0.7.20 批 E.
 * 0.7.17: 批 A P0（L5 ladderOrd · score-policy land · 全角 evidence · githooks +x · Spring mvn -f）.
 * 0.7.16: docs/runs + rule18 mid-commit (+0.7.15 handoff).
 * 0.7.13: handbook rewrite (+0.7.12 guide/ / 0.7.11 dual-write / 0.7.10 compress).
 * 0.7.4: Codex hooks codex-hook.cmd + mcp__mysql + HOOK_DEFS.codex.
 * 0.7.3: Codex hooks commandWindows + Stop checklist + gitignore.
 * 0.7.2: hard-delete land.mjs + domain fill shims.
 * 0.7.1: hot-path slim (stubs/html/archive/superpowers).
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
import { buildHostSurface, formatHostSurfaceLine } from "./lib/host-surface.mjs";
import {
  isIncomparablePoint,
  buildTrendSeries,
  CURRENT_REPORT_SCHEMA,
} from "./lib/score-history.mjs";
import {
  applyStrictGateDefaults,
  applyGoldGateDefaults,
  applyGoldCoverageDefaults,
  reapplyGateProfile,
  evaluateAiCodingGate,
  countHarnessTodos,
  checkEntryReady,
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
import {
  buildContractChecksJs,
  globListToCodePreds,
  buildHookPlaceholders,
  HOOK_DEFS,
} from "./lib/hooks-checks.mjs";
import { splitTableRows } from "./lib/doc-density.mjs";
import {
  replaceCreateTableBlock,
  formatDdlDiff,
  extractShowCreateDdl,
  normalizeDdlForCompare,
} from "./fill-calibrate-live.mjs";
import { updateDomainIndex, extractInventoryEvidence } from "./lib/merge-domain.mjs";
import { applyCommandsPrefill } from "./lib/prefill-commands.mjs";
import { resolveInventoryOutPath } from "./lib/inventory-paths.mjs";
import {
  writeInventoryMeta,
  readInventoryMeta,
  stripWrappingQuotes,
} from "./lib/inventory-meta.mjs";
import { parse as parseYaml } from "./lib/yaml.mjs";
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
import { readSkillVersion, escapeSemverRe } from "./lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const EXPECTED = readSkillVersion(skillRoot);
const VER_RE = escapeSemverRe(EXPECTED);
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

// --- 0.2.19 / 0.7.2: unified merge + lib (domain shims removed) ---
assert(fs.existsSync(path.join(skillRoot, "scripts/fill-merge.mjs")), "fill-merge.mjs");
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/merge-domain.mjs")),
  "lib/merge-domain.mjs"
);
for (const id of ["api", "func", "db", "redis", "jobs"]) {
  assert(!fs.existsSync(path.join(skillRoot, `scripts/fill-merge-${id}.mjs`)), `fill-merge-${id}.mjs absent`);
  assert(!fs.existsSync(path.join(skillRoot, `scripts/fill-inventory-${id}.mjs`)), `fill-inventory-${id}.mjs absent`);
}
assert(!fs.existsSync(path.join(skillRoot, "scripts/land.mjs")), "land.mjs absent");

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
assert(new RegExp(`version:\\s*"${VER_RE}"`).test(qYaml), `questions.yaml version ${EXPECTED}`);
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

// --- 0.2.19 / 0.7.2: unified fill-merge --domain ---
const mergeUniSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-merge.mjs"), "utf8");
assert(/--domain/.test(mergeUniSrc), "fill-merge.mjs accepts --domain");
assert(/mergeDomain/.test(mergeUniSrc) || /mergeApi/.test(mergeUniSrc), "fill-merge.mjs has merge body");

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
assert(new RegExp(`version:\\s*"${VER_RE}"`).test(manifest), `manifest ${EXPECTED}`);
const rootManifestPath = path.join(skillRoot, "_meta/manifest.yaml");
assert(fs.existsSync(rootManifestPath), "root _meta/manifest.yaml present");
const rootManifest = fs.readFileSync(rootManifestPath, "utf8");
assert(new RegExp(`version:\\s*"${VER_RE}"`).test(rootManifest), `root _meta manifest ${EXPECTED}`);
{
  const rv = (rootManifest.match(/^version:\s*"([^"]+)"/m) || [])[1];
  const tv = (manifest.match(/^version:\s*"([^"]+)"/m) || [])[1];
  assert(rv === tv, "root _meta version matches templates/_meta");
  assert(rv === EXPECTED, "root manifest version == SSOT EXPECTED");
}
assert(!/version:\s*"0\.6\.2"(?!-)/.test(manifest), "manifest not leftover 0.6.2");
const metaTmpl = fs.readFileSync(
  path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
  "utf8"
);
assert(new RegExp(`skill_version:\\s*"${VER_RE}"`).test(metaTmpl), `harness-meta ${EXPECTED}`);
assert(!/skill_version:\s*"0\.6\.2"(?!-)/.test(metaTmpl), "harness-meta not leftover 0.6.2");
assert(/ready_coverage:\s*0\.8/.test(metaTmpl), "harness-meta ready_coverage 0.8");
assert(/fill_mcp_profile:\s*test/.test(metaTmpl), "harness-meta fill_mcp_profile test");
{
  const syncCheck = runNode([path.join(skillRoot, "scripts/sync-skill-version.mjs"), "--check"]);
  assert(syncCheck.status === 0, "sync-skill-version --check exit 0");
}
const logRoot = path.resolve(skillRoot, "../_log/harness-eng");
function logExists(ver) {
  return fs.existsSync(path.join(logRoot, `${ver}.md`));
}
function readLog(ver) {
  const p = path.join(logRoot, `${ver}.md`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
const changelogIndex = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
const changelog = fs.existsSync(logRoot)
  ? fs
      .readdirSync(logRoot)
      .filter((f) => /^\d+\.\d+\.\d/.test(f) && f.endsWith(".md"))
      .map((f) => fs.readFileSync(path.join(logRoot, f), "utf8"))
      .join("\n")
  : "";
assert(/_log\/harness-eng\//.test(changelogIndex), "CHANGELOG points to _log/harness-eng/");
for (const ver of ["0.5.2","0.5.3","0.5.4","0.5.5","0.5.6","0.5.7","0.5.8","0.5.9","0.5.10"]) {
  assert(logExists(ver), `_log has ${ver}`);
  assert(changelogIndex.includes(`${ver}.md`), `CHANGELOG index links ${ver}`);
}
assert(!/^## 0\.5\.10/m.test(changelogIndex), "hot CHANGELOG dropped 0.5.x ## sections");
for (const ver of [
  "0.6.2","0.6.3","0.6.4","0.6.5","0.6.6","0.6.7","0.6.8-dev",
  "0.7.0","0.7.2","0.7.3","0.7.4","0.7.5","0.7.6","0.7.7","0.7.8","0.7.9",
  "0.7.10","0.7.11","0.7.12","0.7.14","0.7.15","0.7.16","0.7.20","0.7.21",
  "0.7.22","0.7.23","0.7.24","0.7.25","0.7.26", EXPECTED,
]) {
  assert(logExists(ver), `_log has ${ver}`);
  assert(changelogIndex.includes(`${ver}.md`), `CHANGELOG index links ${ver}`);
}
assert(!/# 0\.6\.7[^\n]*-dev/.test(readLog("0.6.7")), "CHANGELOG formal 0.6.7 no -dev");
assert(/Codex P0|增量解冻/.test(changelog), "CHANGELOG Codex P0 Chinese entry");

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
assert(/打分 \/ score-policy/.test(skill), "SKILL keeps score-policy pointer literal");
assert(/对外四支/.test(skill), "SKILL documents 对外四支 mode buckets");
assert(/对外三档/.test(skill), "SKILL documents 对外三档 ladder");

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
  const hist = path.resolve(skillRoot, "../_log/harness-eng/selfcheck-legacy");
  assert(fs.existsSync(path.join(hist, "selfcheck-0.5.1.mjs")), "_log keeps 0.5.1 selfcheck");
  assert(fs.existsSync(path.join(hist, "selfcheck-0.4.0.mjs")), "_log keeps 0.4.0 selfcheck");
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
  fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/VERIFY-history-through-0.2.27.md")),
  "VERIFY history 0.2.27 in _log"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY 0.2.27 not in harness-eng/archive pack"
);
const verifyMd = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
assert(new RegExp(`验收记录（${VER_RE}）`).test(verifyMd) && new RegExp(`当前 \\*\\*${VER_RE}\\*\\*`).test(verifyMd), `VERIFY is ${EXPECTED}`);
assert(!/当前 \*\*0\.6\.4\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.4");
assert(!/当前 \*\*0\.6\.3\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.3");
assert(/session-dashboard/.test(verifyMd), "VERIFY mentions session-dashboard");
assert(!/## 0\.2\.18 增量验收/.test(verifyMd), "VERIFY dropped historical increment tables");

assert(fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/VERIFY-history-through-0.6.0.md")), "VERIFY 0.6 history in _log");
assert(/VERIFY-history-through-0\.6\.0/.test(verifyMd), "VERIFY points to 0.6 history archive");
assert(/_log\/harness-eng\/docs/.test(verifyMd), "VERIFY points _log/harness-eng/docs");
assert(/历史增量/.test(verifyMd), "VERIFY has history stub section");


const readme = fs.readFileSync(path.join(skillRoot, "README.md"), "utf8");
assert(new RegExp(`当前版本：${VER_RE}`).test(readme), `README header version ${EXPECTED}`);
assert(new RegExp(VER_RE).test(readme), `README mentions ${EXPECTED}`);
assert(!/当前 \*\*0\.2\.25\*\*/.test(readme), "README no stale 0.2.25 footer");
assert(!/selfcheck-0\.2\.15/.test(readme), "README does not pin stale selfcheck 0.2.15");
assert(/selfcheck\.mjs/.test(readme), "README pins selfcheck.mjs");
assert(!/selfcheck-0\.5\.2/.test(readme), "README no stale selfcheck-0.5.2 pin");
assert(/archive\/selfcheck/.test(readme), "README points archive selfcheck");

const handbookMd = fs.readFileSync(path.join(skillRoot, "guide", "使用手册.md"), "utf8");
const quickstartMd = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
const ladderMd = readDoc("ladder.md");
assert(new RegExp(`版本：\\*\\*${VER_RE}\\*\\*`).test(handbookMd), `使用手册.md version ${EXPECTED}`);
assert(new RegExp(`当前 \\*\\*${VER_RE}\\*\\*`).test(quickstartMd), `QUICKSTART version ${EXPECTED}`);
assert(/selfcheck\.mjs/.test(quickstartMd), "QUICKSTART pins selfcheck.mjs");
assert(/selfcheck\.mjs/.test(handbookMd), "使用手册.md pins selfcheck.mjs");
assert(fs.existsSync(path.join(skillRoot, "guide", "使用手册.html")), "使用手册.html present");
const handbookHtml = fs.readFileSync(path.join(skillRoot, "guide", "使用手册.html"), "utf8");
assert(new RegExp(`v${VER_RE}`).test(handbookHtml) && /id="s6"/.test(handbookHtml), "使用手册.html version + #s6");
assert(
  /harness\.mjs/.test(handbookHtml) && /fill-inventory\.mjs --domain/.test(handbookHtml),
  "使用手册.html documents unified CLI"
);
assert(/公开 CLI|harness\.mjs/.test(handbookMd), "使用手册.md documents public CLI");
assert(/使用手册\.html/.test(handbookMd), "使用手册.md links HTML edition");
const handbookSummary = fs.readFileSync(path.join(skillRoot, "guide", "使用手册-摘要.md"), "utf8");
for (const [label, text] of [
  ["使用手册.md", handbookMd],
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
assert(/详情请查询仪表盘/.test(handbookMd), "使用手册.md session dashboard footer copy");
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
assert(/模式分流（对外四支）/.test(skill), "SKILL uses 对外四支 mode table");
assert(!/意图（一支）/.test(skill), "SKILL dropped legacy one-branch intent table header");
assert(!/## 分支\s*→\s*Read/.test(skill), "SKILL dropped 分支→Read mini-table");
assert(/打分 \/ score-policy/.test(skill), "SKILL keeps score-policy pointer literal");
assert(/upgrade\.md/.test(skill), "SKILL points to upgrade.md");
assert(/填充 MCP 闸/.test(skill), "SKILL mentions fill MCP gate");
assert(!/## 其它模式/.test(skill), "SKILL has no redundant 其它模式 section");
assert(/fill-calibrate-live\.mjs/.test(skill), "SKILL points calibrate to script");
assert(/fill-report-html\.mjs/.test(skill), "SKILL points report to script");

assert(!fs.existsSync(path.join(skillRoot, "OPTIMIZATION-PROPOSAL-0.2.x.md")), "OPTIMIZATION not in skill root");
assert(
  fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/OPTIMIZATION-PROPOSAL-0.2.x.md")),
  "OPTIMIZATION in _log docs"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/OPTIMIZATION-PROPOSAL-0.2.x.md")),
  "OPTIMIZATION not in harness-eng/archive hot pack"
);

// --- fill-merge --domain --help smoke ---
for (const id of ["db", "redis", "func"]) {
  const r = runNode([
    path.join(skillRoot, "scripts/fill-merge.mjs"),
    "--domain",
    id,
    "--help",
  ]);
  assert(
    r.status === 0 && /--inventory|--work-dir|--domain/.test(r.stdout + r.stderr),
    `fill-merge --domain ${id} --help shows usage`
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
  assert(["0.2.18","0.2.19","0.2.20","0.2.21","0.2.22","0.2.23","0.2.24","0.2.25","0.2.26","0.2.27","0.2.28","0.2.29","0.3.0","0.4.0"].includes(ui.version), "ui.version compatible");
  assert(Array.isArray(ui.decision_kpis) && ui.decision_kpis.length >= 1, "ui.decision_kpis");
  assert(Array.isArray(ui.morph_strip), "ui.morph_strip");
  assert(ui.show_domain_cards === false, "domain cards default off");
  assert(ui.verdict.ready_label === "建议可以开干" || ui.verdict.ready_label === "建议暂缓", "verdict binary");
  assert(ui.composite_score && typeof ui.composite_score.value === "number", "ui.composite_score");
  assert(ui.pipeline_progress && Array.isArray(ui.pipeline_progress.steps), "ui.pipeline_progress");
  assert(ui.report_schema === "0.4.0", "report_schema 0.4.0");
  assert(ui.go_nogo && typeof ui.go_nogo.ok === "boolean", "ui.go_nogo");
  assert(Array.isArray(ui.tasks), "ui.tasks");
  assert(ui.ladder_progress && Array.isArray(ui.ladder_progress.steps), "ui.ladder_progress");
  assert(ui.diagnose && Array.isArray(ui.diagnose.story), "ui.diagnose.story");
  assert(ui.pipeline_progress.label_zh === "开干闸路径", "pipeline labeled 开干闸路径");
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
  assert(/data-tab="host"/.test(reportTmpl) && /宿主台/.test(reportTmpl), "report tmpl host tab");
  assert(/ladder_progress|施工阶梯/.test(reportTmpl), "report tmpl ladder axis");
  assert(/host-capsule|host_surface/.test(reportTmpl), "report tmpl host capsule");
  assert(/overall_linkable|incomparable/.test(reportTmpl), "report tmpl history hard-cut");
  assert(fs.existsSync(path.join(skillRoot, "scripts/lib/host-surface.mjs")), "host-surface.mjs");
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
    /UTF-16/.test(fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8")) &&
      /write-plan\.md/.test(fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8")),
    "QUICKSTART Windows tip points write-plan"
  );
  assert(
    /UTF-16|writeFileSync/.test(fs.readFileSync(path.join(skillRoot, "modes/write-plan.md"), "utf8")) &&
      /REPO_NAME:'x'/.test(fs.readFileSync(path.join(skillRoot, "modes/write-plan.md"), "utf8")) &&
      /replace/.test(fs.readFileSync(path.join(skillRoot, "modes/write-plan.md"), "utf8")),
    "write-plan Windows UTF-8 example uses REPO_NAME + replace"
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
  assert(new RegExp(`version:\\s*"${VER_RE}"`).test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), `manifest ${EXPECTED}`);
}

// --- 0.7.3–0.7.14: Codex hooks + Skills + MCP policy + calibrate + rulehook + docs compress/dedupe ---
{
  const codexHooks = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-hooks.json.tmpl"), "utf8");
  assert(/commandWindows/.test(codexHooks), "codex-hooks.json.tmpl has commandWindows");
  assert(/CODEX_MYSQL_HOOK_ENTRY/.test(codexHooks), "codex-hooks.json.tmpl has mysql entry placeholder");
  // 0.7.32 NEW-16: Bash+Stop in tmpl; mysql matcher only via CODEX_MYSQL_HOOK_ENTRY when MCP selected
  assert((codexHooks.match(/commandWindows/g) || []).length >= 2, "Bash+Stop have commandWindows in tmpl");
  assert(!/mcp__mysql/.test(codexHooks.replace(/\{\{CODEX_MYSQL_HOOK_ENTRY\}\}/g, "")), "codex-hooks tmpl has no static mysql matcher");
  const hooksChkMysql = fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8");
  assert(/mcp__mysql/.test(hooksChkMysql) && /CODEX_MYSQL_HOOK_ENTRY/.test(hooksChkMysql), "codex mysql matcher built in hooks-checks");
  const phMysql = buildHookPlaceholders({
    params: { mcp: ["mysql"], domains: ["api", "db"], ai_tools: ["codex"] },
    agentConfig: false,
    existing: {},
    root: skillRoot,
  });
  assert(/mcp__mysql/.test(phMysql.CODEX_MYSQL_HOOK_ENTRY || ""), "CODEX_MYSQL_HOOK_ENTRY has mcp__mysql when mysql MCP");
  assert(/commandWindows/.test(phMysql.CODEX_MYSQL_HOOK_ENTRY || ""), "CODEX_MYSQL_HOOK_ENTRY has commandWindows");
  const phNoMysql = buildHookPlaceholders({
    params: { mcp: [], domains: ["api"], ai_tools: ["codex"] },
    agentConfig: false,
    existing: {},
    root: skillRoot,
  });
  assert(!(phNoMysql.CODEX_MYSQL_HOOK_ENTRY || "").trim(), "CODEX_MYSQL_HOOK_ENTRY empty without mysql MCP");
  assert(/codex-hook\.cmd/.test(codexHooks), "codex-hooks commandWindows uses codex-hook.cmd");
  assert(fs.existsSync(path.join(skillRoot, "templates/hooks/codex-hook.cmd")), "codex-hook.cmd template");
  const syncCodex = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/commandWindows/.test(syncCodex) && /codex-hook\.cmd/.test(syncCodex), "sync.mjs.tmpl Codex hooks commandWindows via cmd");
  assert(/mcp__mysql/.test(syncCodex), "sync default Codex hooks include mysql-guard");
  const stopTmpl = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-stop-checklist.js.tmpl"), "utf8");
  assert(/git status/.test(stopTmpl) && /stderr/.test(stopTmpl), "codex-stop not a stub");
  assert(/交付收口/.test(stopTmpl), "codex-stop soft checklist message");
  assert(!/Companion to templates\/hooks\/codex-hooks\.json Stop event/.test(stopTmpl), "old stub header gone");
  const adapter = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-adapter.js"), "utf8");
  assert(/stderr\.write/.test(adapter) && /spawn failed/.test(adapter), "adapter forwards stderr");
  assert(/mcp-guard/.test(adapter), "adapter supports mcp-guard mode");
  assert(HOOK_DEFS["commit-gate"]?.events?.codex, "HOOK_DEFS commit-gate has events.codex");
  assert(HOOK_DEFS["mysql-guard"]?.events?.codex, "HOOK_DEFS mysql-guard has events.codex");
  assert(HOOK_DEFS["stop-checklist"]?.events?.codex, "HOOK_DEFS stop-checklist has events.codex");
  assert(!HOOK_DEFS["after-edit"]?.events?.codex, "HOOK_DEFS after-edit omits codex");
  const gi = fs.readFileSync(path.join(skillRoot, "templates/gitignore/harness.gitignore.snippet"), "utf8");
  assert(/\.codex\/config\.toml/.test(gi), "gitignore ignores .codex/config.toml");
  const agentsRoot = fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"), "utf8");
  const agentsSolo = fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.solo.md.tmpl"), "utf8");
  for (const [label, body] of [
    ["root", agentsRoot],
    ["solo", agentsSolo],
  ]) {
    assert(/Rules 索引/.test(body), `AGENTS.${label} has Rules 索引`);
    assert(/不自动加载/.test(body) && /\.mdc/.test(body), `AGENTS.${label} says Codex does not auto-load .mdc`);
    assert(!/^## Cursor rules\s*$/m.test(body), `AGENTS.${label} no Cursor-only rules heading`);
  }
  const harnessPtr = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/codex-harness.md.tmpl"), "utf8");
  assert(/MCP 启用仪式/.test(harnessPtr) && /commandWindows/.test(harnessPtr), "codex-harness enablement ritual");
  const fxHooks = fs.readFileSync(
    path.join(skillRoot, "scripts/fixtures/l5-sync-codex/.codex/hooks.json"),
    "utf8"
  );
  assert(/commandWindows/.test(fxHooks), "l5-sync-codex hooks.json has commandWindows");
  assert(/codex-hook\.cmd/.test(fxHooks), "l5-sync-codex hooks use codex-hook.cmd");
  assert(/mcp__mysql/.test(fxHooks), "l5-sync-codex hooks include mcp__mysql");
  const fxStop = fs.readFileSync(
    path.join(skillRoot, "scripts/fixtures/l5-sync-codex/.codex/hooks/codex-stop-checklist.js"),
    "utf8"
  );
  assert(/git status/.test(fxStop), "l5-sync-codex stop checklist not stub");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/fixtures/l5-sync-codex/.codex/hooks/codex-hook.cmd")),
    "l5-sync-codex has codex-hook.cmd"
  );
  for (const skill of [
    "contract-sync",
    "api-doc-sync",
    "db-doc-sync",
    "redis-doc-sync",
    "jobs-doc-sync",
    "frontend-web",
  ]) {
    assert(
      fs.existsSync(path.join(skillRoot, `templates/agent-config/skills/${skill}/SKILL.md`)),
      `skill seed ${skill}`
    );
    assert(
      fs.existsSync(
        path.join(skillRoot, `scripts/fixtures/l5-sync-codex/.agents/skills/${skill}/SKILL.md`)
      ),
      `l5-sync-codex emits .agents/skills/${skill}`
    );
  }
  // 0.7.32 LT-6: skills/docs via placeholders (domain-gated at render)
  assert(
    /\{\{AGENTS_SKILLS_LIST\}\}/.test(agentsRoot) &&
      /\{\{DOCS_CONTRACT_TREE\}\}/.test(agentsRoot),
    "AGENTS.root uses skill/docs placeholders"
  );
  assert(
    /AGENTS_SKILLS_LIST/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")
    ) &&
      /frontend-web/.test(
        fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")
      ) &&
      /redis-doc-sync/.test(
        fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")
      ),
    "AGENTS.root skills built in render (incl. redis/frontend when domains allow)"
  );
  assert(/agent-config-skill-contract-sync/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest wires skill seeds");
  assert(/agent-config-skill-redis-doc-sync/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest wires redis skill");
  assert(/agent-config-skill-frontend-web/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest wires frontend skill");
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
    fs.existsSync(path.join(skillRoot, "scripts/lib/inventory-jobs.mjs")),
    "lib/inventory-jobs.mjs"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "scripts/fill-inventory-jobs.mjs")),
    "fill-inventory-jobs.mjs absent"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "scripts/fill-merge-jobs.mjs")),
    "fill-merge-jobs.mjs absent"
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
  assert(/fill-inventory\.mjs --domain jobs/.test(qs), "QUICKSTART jobs uses fill-inventory --domain");
  assert(!/fill-inventory-jobs/.test(qs), "QUICKSTART no fill-inventory-jobs shim");
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
    /_log|_history|历史|迁出/.test(fs.readFileSync(path.join(skillRoot, "archive/README.md"), "utf8")),
    "archive README points _log"
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
    // 0.7.32 LT-6: docs tree is domain-gated placeholder (may include jobs when enabled)
    assert(
      /\{\{DOCS_CONTRACT_TREE\}\}/.test(src) && /\{\{DOCS_CONTRACT_PRIORITY\}\}/.test(src),
      `AGENTS ${name} tmpl docs use domain placeholders`
    );
    assert(/docs\/releases/.test(src), `AGENTS ${name} tmpl mentions releases`);
  }
  const rule00 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/## 提交门禁/.test(rule00), "00 tmpl has 提交门禁");
  assert(/superpowers/.test(rule00) && /`Pn`/.test(rule00), "00 提交门禁 covers superpowers + Pn");
  assert(/docs\/runs/.test(rule00), "00 tmpl mentions docs/runs");
  assert(/active→archive|active\/<slug>/.test(rule00) && /中途 commit/.test(rule00), "00 delivery dual-archive + mid-commit");
  const rule18 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/18-superpowers-corpus.mdc.tmpl"),
    "utf8"
  );
  assert(/中途 commit/.test(rule18) && /假收口/.test(rule18), "18 allows mid-commit / forbids fake close");
  assert(/双归档|docs\/runs\/active/.test(rule18), "18 dual-archive on delivery");
  for (const name of ["AGENTS.root.md.tmpl", "AGENTS.root.solo.md.tmpl"]) {
    const ag = fs.readFileSync(path.join(skillRoot, "templates/agents", name), "utf8");
    assert(/docs\/runs/.test(ag), `AGENTS ${name} mentions docs/runs`);
  }
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
  const renderSrc = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/\{\{MAVEN_TEST_CMD\}\}/.test(spring) && /\{\{MAVEN_DISCIPLINE_NOTE\}\}/.test(spring), "spring variant Maven discipline placeholders");
  assert(/\{\{SPRING_DB_BLOCK\}\}/.test(spring), "spring variant has SPRING_DB_BLOCK slot");
  assert(
    /manual_sql/.test(renderSrc) &&
      /function buildSpringDbBlock/.test(renderSrc) &&
      !/SPRING_DB_BLOCK_ENABLED/.test(renderSrc),
    "spring variant uses buildSpringDbBlock (no dead SPRING_DB_BLOCK_ENABLED)"
  );
  assert(/module_agents_template/.test(renderSrc), "render supports module_agents_template");
  assert(/if\s*\(\s*!passesWhenGates\(e\)\s*\)/.test(renderSrc), "0.7.27 passesWhenGates is called in expand loop");
  assert(
    /DB_MIGRATION_DIR/.test(renderSrc) && renderSrc.includes('.replace(/\\/?$/, "/")'),
    "0.7.27 ensureStandardPlaceholders normalizes DB_MIGRATION_DIR slash"
  );
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

// --- 0.7.14 / report_schema 0.4.0 ---
{
  assert(CURRENT_REPORT_SCHEMA === "0.4.0", "score-history CURRENT_REPORT_SCHEMA 0.4.0");
  assert(
    isIncomparablePoint({ report_schema: "0.3.0", morph_scale: "0.7" }),
    "history 0.3.0 incomparable"
  );
  assert(
    !isIncomparablePoint({ report_schema: "0.4.0", morph_scale: "0.7" }),
    "history 0.4.0 comparable"
  );
  const series = buildTrendSeries(
    [{ at: "2026-01-01", overall: 50, report_schema: "0.3.0", morph_scale: "0.7" }],
    { at: "2026-09-26", overall: 70, report_schema: "0.4.0", morph_scale: "0.7" },
    20
  );
  assert(
    Array.isArray(series.incomparable) &&
      series.incomparable[0] === true &&
      series.overall_linkable[0] === null,
    "trend series greys old points"
  );

  const tmpHs = fs.mkdtempSync(path.join(os.tmpdir(), "harness-hs-"));
  try {
    fs.mkdirSync(path.join(tmpHs, ".cursor", "rules"), { recursive: true });
    fs.writeFileSync(path.join(tmpHs, ".cursor", "rules", "x.mdc"), "# r\n", "utf8");
    const hs = buildHostSurface(tmpHs, { meta: { ladder: "L4", ai_tools: ["cursor"] } });
    assert(hs && hs.status, "host_surface builds");
    assert(
      (hs.hosts || []).some((h) => h.id === "cursor" && h.disk?.rules === "present"),
      "host_surface disk rules present"
    );
    assert(
      (hs.hosts || []).every((h) => h.disk?.rules !== "pass"),
      "disk layer never uses pass"
    );
    const line = formatHostSurfaceLine(hs);
    assert(!line || /宿主面/.test(line), "host line format or omit");

    const uiHs = buildReportUi(
      {
        overall: 60,
        morph_scale: "0.7",
        ai_coding_ready: { ok: false, blockers: ["semantic_ready"], rule: "test" },
        skeleton_ready: { ok: true, ladder: "L4" },
        coverage_ready: { ok: true },
        semantic_ready: { ok: false },
        coverage: { percent: 80 },
        fill_plan: { present: true, all_closed: false },
      },
      { meta: { ladder: "L4" }, root: tmpHs, host_surface: hs }
    );
    assert(uiHs.report_schema === "0.4.0", "ui 0.4.0 with host");
    assert(uiHs.host_surface && uiHs.host_surface.status, "ui carries host_surface");
    assert(uiHs.go_nogo.ok === false, "go_nogo from ai_coding_ready");
    assert(uiHs.ladder_progress.current === "L4", "ladder_progress from meta");
  } finally {
    fs.rmSync(tmpHs, { recursive: true, force: true });
  }

  const sessionDashSrc = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/session-dashboard.mjs"),
    "utf8"
  );
  assert(/formatHostSurfaceLine|hostLine/.test(sessionDashSrc), "session-dash host line");
  assert(/五台读法/.test(sessionDashSrc), "session-dash handbook 五台读法");
  const sessionDashMd0714 = readDoc("session-dashboard.md");
  assert(
    /宿主面/.test(sessionDashMd0714) && /五台读法/.test(sessionDashMd0714),
    "session-dashboard.md 0.4.0"
  );
  const handbookMd0714 = fs.readFileSync(path.join(skillRoot, "guide/使用手册.md"), "utf8");
  assert(/仪表盘五台|宿主台/.test(handbookMd0714), "handbook §6 five panels");
  assert(
    /0\.4\.0/.test(fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8")),
    "glossary report_schema 0.4.0"
  );
}

// --- 0.7.19 批 B P0：sync skills prune · inventory rescan · --output；+ D1 soft-gate ---
{
  const softGate = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(/listActiveTopicRuns|docs\/runs\/active/.test(softGate), "soft-gate reads docs/runs/active");
  assert(/listActiveTopicRuns/.test(softGate), "soft-gate uses listActiveTopicRuns");
  assert(!/listActiveFeatureRuns/.test(softGate), "soft-gate dropped listActiveFeatureRuns");
  assert(/主题进行中|宣称交付|主题收口/.test(softGate), "soft-gate in-flight wording");
  assert(!/若本提交完成其主功能，先按 rule 18 收口/.test(softGate), "soft-gate dropped premature-close nudge");
  assert(!/【feature-eng 软提醒】|收口在 feature-eng close/.test(softGate), "soft-gate no hard feature-eng brand");

  const skillMd021 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/可选接力（主题流程）/.test(skillMd021), "SKILL has optional handoff section");
  assert(!/与 feature-eng 的配合与互斥/.test(skillMd021), "SKILL dropped hard couple heading");
  const prefill021 = fs.readFileSync(path.join(skillRoot, "modes/prefill.md"), "utf8");
  assert(/若\*?\*?用主题流程|否则本 skill Done/.test(prefill021), "prefill P1 theme-flow optional");

  const syncTmplB = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/SKILLS_DIRS/.test(syncTmplB), "sync tmpl has SKILLS_DIRS");
  assert(/harness-managed\.json/.test(syncTmplB), "sync tmpl writes harness-managed.json");
  assert(/unmanaged/.test(syncTmplB), "sync tmpl reports unmanaged");
  assert(new RegExp(`HARNESS_ENG_VERSION = "${VER_RE}"`).test(syncTmplB), `sync tmpl version ${EXPECTED}`);

  const invApi = fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-api.mjs"), "utf8");
  assert(/scanApiInventoryMemory/.test(invApi), "inventory-api exports scanApiInventoryMemory");
  assert(/write !== false|opts\.write/.test(invApi), "scanOneModule supports write:false");

  const fillScoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/coverage_source/.test(fillScoreSrc), "fill-score sets coverage_source");
  assert(/scanApiInventoryMemory/.test(fillScoreSrc), "fill-score imports memory rescan");
  assert(/path\.isAbsolute\(args\.output\)/.test(fillScoreSrc), "fill-score --output relative to root");

  // sync: foreign skill survives
  const golden = path.join(skillRoot, "scripts/fixtures/l5-sync-golden");
  const tmpSync = fs.mkdtempSync(path.join(os.tmpdir(), "harness-b1-"));
  try {
    fs.cpSync(golden, tmpSync, { recursive: true });
    const foreignDir = path.join(tmpSync, ".cursor", "skills", "foreign");
    fs.mkdirSync(foreignDir, { recursive: true });
    fs.writeFileSync(path.join(foreignDir, "SKILL.md"), "# foreign\n", "utf8");
    const syncRun = runNode([path.join(tmpSync, "scripts/agent-config/sync.mjs")], { cwd: tmpSync });
    assert(syncRun.status === 0, "sync with foreign skill exits 0");
    assert(
      fs.existsSync(path.join(foreignDir, "SKILL.md")),
      "foreign skill SKILL.md retained after sync"
    );
    assert(
      /unmanaged/i.test(syncRun.stdout + syncRun.stderr),
      "sync mentions unmanaged"
    );
    const checkRun = runNode([path.join(tmpSync, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpSync,
    });
    assert(checkRun.status === 0, "sync --check green with unmanaged foreign skill");
    assert(
      /unmanaged/i.test(checkRun.stdout + checkRun.stderr),
      "sync --check reports unmanaged"
    );
  } finally {
    fs.rmSync(tmpSync, { recursive: true, force: true });
  }
}

// --- 0.7.19 批 D2–D4：delivery-checklist · refresh · rule 18 时机 ---
{
  const checklist = path.join(skillRoot, "templates/docs/agent-kb/delivery-checklist.md");
  assert(fs.existsSync(checklist), "delivery-checklist.md template exists");
  const clBody = fs.readFileSync(checklist, "utf8");
  assert(/唯一正文/.test(clBody) && /harness.*refresh|refresh/.test(clBody), "checklist has refresh step");
  assert(/kb-delivery-checklist/.test(manifest), "manifest wires kb-delivery-checklist");

  const rule00 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/delivery-checklist\.md/.test(rule00), "rule 00 points to delivery-checklist");
  const rule18 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/18-superpowers-corpus.mdc.tmpl"),
    "utf8"
  );
  assert(/不是.*每次.*commit|交付.*合并.*前/.test(rule18), "rule 18 timing: not every commit");
  assert(/delivery-checklist\.md/.test(rule18), "rule 18 points to checklist");

  const harnessSrc = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(/mode refresh|refresh/.test(harnessSrc) && /runRefresh/.test(harnessSrc), "harness.mjs has refresh mode");
  assert(fs.existsSync(path.join(skillRoot, "scripts/lib/refresh.mjs")), "lib/refresh.mjs exists");

  const dryRefresh = runNode(
    [path.join(skillRoot, "scripts/harness.mjs"), "--mode", "refresh", "--root", skillRoot, "--dry-run"],
    { cwd: skillRoot }
  );
  assert(dryRefresh.status === 0, "harness refresh --dry-run exits 0");
  assert(/"mode":\s*"refresh"/.test(dryRefresh.stdout), "refresh dry-run JSON mode");
}

// --- 0.7.22 P2：中性 refresh-score + eng_snapshot ---
{
  const rsTmpl = path.join(skillRoot, "templates/scripts/refresh-score.mjs.tmpl");
  assert(fs.existsSync(rsTmpl), "refresh-score.mjs.tmpl exists");
  const rsBody = fs.readFileSync(rsTmpl, "utf8");
  assert(/HARNESS_ENG_ROOT/.test(rsBody), "refresh-score resolves HARNESS_ENG_ROOT");
  assert(/--mode["\s,]*refresh|mode.*refresh/.test(rsBody), "refresh-score delegates harness refresh");
  assert(/kb-refresh-score/.test(manifest), "manifest wires kb-refresh-score");
  const clBody22 = fs.readFileSync(
    path.join(skillRoot, "templates/docs/agent-kb/delivery-checklist.md"),
    "utf8"
  );
  assert(/scripts\/agent-kb\/refresh-score\.mjs/.test(clBody22), "checklist §2 uses refresh-score");
  assert(/eng_snapshot/.test(clBody22), "checklist mentions eng_snapshot");
  assert(!/双写/.test(clBody22), "checklist no dual-write requirement");
  assert(/兼容.*harness_snapshot|harness_snapshot/.test(clBody22), "checklist notes harness_snapshot compat");
  assert(/本仓工程化渲染|宣称交付/.test(clBody22), "checklist neutral SSOT/timing");
  assert(!/须点名 feature-eng|若使用 feature-eng：其 close/.test(clBody22), "checklist no hard feature-eng brand");
  assert(
    !fs.existsSync(path.join(skillRoot, "conventions/repo-layout.md")),
    "no conventions/repo-layout.md (P5 rolled back)"
  );
  assert(
    !fs.existsSync(path.resolve(skillRoot, "../_contracts/repo-layout.md")),
    "no root _contracts/repo-layout.md (P5 rolled back)"
  );
  const detectMd23 = fs.readFileSync(path.join(skillRoot, "modes/detect.md"), "utf8");
  assert(/外部控制器可选/.test(detectMd23), "detect S_RUNS notes optional external controller");
  const rule0022 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(!/若使用 feature-eng/.test(rule0022), "rule 00 no hard feature-eng brand");
  const rule1822 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/18-superpowers-corpus.mdc.tmpl"),
    "utf8"
  );
  assert(!/若使用 feature-eng/.test(rule1822), "rule 18 no hard feature-eng brand");
}

// --- 0.7.20 批 E（仍适用）：E1 monorepo detect · E2 entry_ready · E7 GLOB hooks · E8 sp skip ---
{
  const fixMono = path.join(skillRoot, "scripts/fixtures/stack-monorepo-fe-be");
  assert(fs.existsSync(fixMono), "stack-monorepo-fe-be fixture exists");
  const sigMono = scanSignals(fixMono);
  assert(sigMono.S_STACK === true, "E1 monorepo S_STACK");
  assert(sigMono.S_SPRING === true, "E1 monorepo S_SPRING");
  assert(sigMono.S_FRONTEND === true, "E1 monorepo S_FRONTEND");
  const detectMd = fs.readFileSync(path.join(skillRoot, "modes/detect.md"), "utf8");
  assert(/S_SP.*不算|不算.*S_SP|S_RUNS/.test(detectMd) && /不算.*harness 信号/.test(detectMd), "E1 detect PARTIAL excludes S_SP/S_RUNS");

  const tmpEntry = fs.mkdtempSync(path.join(os.tmpdir(), "harness-e2-entry-"));
  try {
    fs.writeFileSync(
      path.join(tmpEntry, "AGENTS.md"),
      "# demo\n\n## Commands\n\n| Task | Command |\n|---|---|\n| build | TODO(harness-eng) |\n",
      "utf8"
    );
    const gateEntry = evaluateAiCodingGate(
      {
        root: tmpEntry,
        domains: { api: { score: 90 } },
        template_completeness: { overall: 90 },
      },
      {
        gate_profile: "strict",
        gate: applyStrictGateDefaults({ forbid_harness_todo: false }),
      },
      { blockers: 0 }
    );
    assert(gateEntry.active && !gateEntry.ok, "E2 strict entry_todo blocks open");
    assert(
      gateEntry.blockers.some((b) => String(b).startsWith("entry_todo:")),
      "E2 blocker entry_todo"
    );
    assert(gateEntry.checks.frontend_coverage === "not_measured", "E2 frontend_coverage not_measured");
  } finally {
    fs.rmSync(tmpEntry, { recursive: true, force: true });
  }

  const preds = globListToCodePreds("frontend/src/api/**,**/dto/**");
  assert(
    preds.some((p) => String(p).includes("frontend/src/api")),
    "E7 globListToCodePreds frontend/src/api"
  );
  // 0.7.26 HS-1: **/* must not become .[^/]*
  const ctrlPreds = globListToCodePreds("backend/src/main/java/**/*Controller.java");
  assert(ctrlPreds.length === 1 && String(ctrlPreds[0]).startsWith("/"), "E7 HS-1 controller glob is regex");
  {
    const body = String(ctrlPreds[0]).slice(1, -1);
    const re = new RegExp(body);
    assert(
      re.test("backend/src/main/java/com/example/taskboard/task/TaskController.java"),
      "E7 HS-1 **/*Controller.java matches nested package"
    );
  }
  // HS-2: file-level glob exact, no trailing /
  const filePreds = globListToCodePreds("backend/src/main/java/com/example/task/Task.java");
  assert(
    filePreds.length === 1 && filePreds[0] === "backend/src/main/java/com/example/task/Task.java",
    "E7 HS-2 file glob exact path"
  );
  // HS-3: DB_MIGRATION_DIR trailing slash
  const phMig = buildHookPlaceholders({
    params: { db_migration_dir: "backend/src/main/resources/db/migration", domains: ["db"] },
    agentConfig: false,
    existing: {},
    root: skillRoot,
  });
  assert(
    phMig.DB_MIGRATION_DIR === "backend/src/main/resources/db/migration/",
    "E7 HS-3 migration dir gets trailing slash"
  );
  // 0.7.27 HS-3: force-normalize when existing already set without slash
  const phMigChained = buildHookPlaceholders({
    params: { domains: ["db"] },
    agentConfig: false,
    existing: { DB_MIGRATION_DIR: "backend/src/main/resources/db/migration" },
    root: skillRoot,
  });
  assert(
    phMigChained.DB_MIGRATION_DIR === "backend/src/main/resources/db/migration/",
    "0.7.27 HS-3 chained existing DB_MIGRATION_DIR gets trailing slash"
  );
  const checksJs = buildContractChecksJs(["api"], { GLOB_API: "frontend/src/api/**" });
  assert(/frontend\/src\/api/.test(checksJs), "E7 buildContractChecksJs unions GLOB_API");
  const checksArr = new Function(`return (${checksJs});`)();
  assert(
    Array.isArray(checksArr) &&
      checksArr.some((c) => c.id === "api" && typeof c.code === "function" && c.code("frontend/src/api/x.ts")),
    "E7 staged frontend/src/api/x.ts hits api predicate"
  );
  const domYamlE = fs.readFileSync(path.join(skillRoot, "templates/_meta/domains.yaml"), "utf8");
  assert(/dto/.test(domYamlE), "E7 domains.yaml has dto");

  const tmpSp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-e8-sp-"));
  try {
    const spDir = path.join(tmpSp, "docs", "superpowers");
    fs.mkdirSync(path.join(tmpSp, "docs", "runs", "active"), { recursive: true });
    fs.mkdirSync(spDir, { recursive: true });
    const oldReadme =
      "# docs/superpowers\n\n## 进行中主题\n\n| 日期 | 主题 | Spec | Plan | 提交 |\n|---|---|---|---|---|\n| 2026-01-01 | old-theme | a | b | pr:1 |\n";
    fs.writeFileSync(path.join(spDir, "README.md"), oldReadme, "utf8");
    fs.writeFileSync(
      path.join(spDir, "ARCHIVE.md"),
      "# ARCHIVE\n\n## 已交付主题\n\n| 日期 | 主题 | Spec | Plan | 提交 |\n|---|---|---|---|---|\n| — | （尚无） | — | — | — |\n",
      "utf8"
    );
    const pSp = path.join(tmpSp, "params.json");
    fs.writeFileSync(
      pSp,
      JSON.stringify({
        ladder: "L3",
        domains: ["api"],
        expandFromManifest: true,
        on_exists: "merge",
        ai_tools: ["cursor"],
        hooks_family: ["commit-gate-extended"],
        placeholders: {
          PROJECT_NAME: "e8",
          PROJECT_DESC: "e8",
          CODE_PREFIXES: "src/",
          SKILL_VERSION: "0.7.22",
          DATE: "2026-09-27",
          GLOB_API: "**/controller/**",
        },
      }),
      "utf8"
    );
    const rSp = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpSp,
      "--params",
      pSp,
    ]);
    assert(rSp.status === 0, "E8 render with existing sp index exits 0");
    const outSp = rSp.stdout || "";
    assert(/既有索引|不 H2 补齐/.test(outSp), "E8 skip note in render log");
    const readmeAfter = fs.readFileSync(path.join(spDir, "README.md"), "utf8");
    assert(!/（harness-eng 补齐）/.test(readmeAfter), "E8 no H2 补齐 on existing README table");
    assert(readmeAfter.includes("old-theme"), "E8 preserves existing theme row");
  } finally {
    fs.rmSync(tmpSp, { recursive: true, force: true });
  }

  assert(/merge commit SHA|pr:<n>|squash/.test(
    fs.readFileSync(path.join(skillRoot, "templates/docs/agent-kb/delivery-checklist.md"), "utf8")
  ), "E13 delivery-checklist ARCHIVE 提交 wording");
}

// --- 0.7.17 批 A P0：L5 / land / merge / hooks / Spring ---
{
  const qnSrc = fs.readFileSync(path.join(skillRoot, "scripts/questions-next.mjs"), "utf8");
  assert(/L5:\s*5/.test(qnSrc), "questions-next ladderOrd has L5");
  assert(/Unknown ladder/.test(qnSrc), "questions-next rejects unknown ladder");
  const tmpQn = fs.mkdtempSync(path.join(os.tmpdir(), "harness-qn-l5-"));
  try {
    const ansPath = path.join(tmpQn, "answers.json");
    fs.writeFileSync(
      ansPath,
      JSON.stringify({
        type: "NEW_CODE_NO_HARNESS",
        mode: "land",
        ladder: "L5",
        answered_batches: ["batch-0-global", "batch-1-new", "batch-1-new-b", "batch-2-contracts", "batch-2-openapi"],
      }),
      "utf8"
    );
    const qnL5 = runNode([path.join(skillRoot, "scripts/questions-next.mjs"), "--answers", ansPath]);
    assert(qnL5.status === 0, "questions-next L5 exits 0");
    const qnOut = qnL5.stdout || "";
    assert(
      /Q_HOOKS_FAMILY|Q_MCP|Q_CODE_PREFIXES|Q_HOOK|batch-3-l3l4/.test(qnOut),
      "questions-next L5 emits L3+ batch (hooks/MCP/prefixes)"
    );
  } finally {
    fs.rmSync(tmpQn, { recursive: true, force: true });
  }

  assert(/id:\s*score-policy/.test(manifest), "manifest files includes score-policy");
  assert(/gate_profile/.test(metaTmpl), "harness-meta tmpl has gate_profile");

  const mergeDomSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/merge-domain.mjs"), "utf8");
  assert(/evidence\[:：\]/.test(mergeDomSrc), "merge-domain extractEvidence accepts fullwidth colon");
  assert(/export function extractEvidence/.test(mergeDomSrc), "extractEvidence is shared export");
  const mergeApiSrcA = fs.readFileSync(path.join(skillRoot, "scripts/lib/merge-api.mjs"), "utf8");
  assert(/from "\.\/merge-domain\.mjs"/.test(mergeApiSrcA), "merge-api imports shared extractEvidence");

  const renderSrcA = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/chmodSync/.test(renderSrcA) && /maybeChmodExecutable/.test(renderSrcA), "render chmods hooks");
  assert(/mavenCmdsForModule/.test(renderSrcA) && /mvn -f/.test(renderSrcA), "render Spring mvn -f branch");
  assert(/可执行/.test(ladderMd), "ladder checks hook executable bit");
}

// --- 0.7.27 e2e P0 hotfix: NEW-1 · SG-7 · NEW-2 · LT-1 sync · LT-6/8 ---
{
  const syncTmpl27 = fs.readFileSync(
    path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"),
    "utf8"
  );
  assert(/git-commit-soft-gate\.js/.test(syncTmpl27), "0.7.27 sync prefers soft-gate when present");
  assert(/hasMysqlGuard/.test(syncTmpl27), "0.7.27 sync gates mysql matcher on SSOT");
  assert(
    /codex-adapter\\\.js\|codex-hook\\\.cmd/.test(syncTmpl27) &&
      /commit-gate\|mcp-guard\|--direct/.test(syncTmpl27),
    "0.7.27 collectHookScriptRefs parses Codex adapter bare scripts"
  );
  assert(new RegExp(`→ ${VER_RE}`).test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")), `upgrade has → ${EXPECTED}`);

  // NEW-1: spring+db module dry-run must not ReferenceError; preview has migration mode
  const tmpSpring = fs.mkdtempSync(path.join(os.tmpdir(), "harness-027-spring-"));
  try {
    fs.mkdirSync(path.join(tmpSpring, "demo-be"), { recursive: true });
    fs.writeFileSync(path.join(tmpSpring, "demo-be", "pom.xml"), "<project/>\n", "utf8");
    const paramsPath = path.join(tmpSpring, "params.json");
    fs.writeFileSync(
      paramsPath,
      JSON.stringify({
        ladder: "L0",
        domains: ["db"],
        agents_variant: "modules",
        module_dirs: ["demo-be"],
        module_agents_template: "spring",
        db_migration_mode: "flyway",
        db_migration_dir: "demo-be/src/main/resources/db/migration",
        on_exists: "skip",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          MODULE_DIRS: "demo-be",
          DATE: "2026-09-28",
          LADDER_TARGET: "L0",
          AGENTS_VARIANT: "modules",
          GLOB_PROFILE: "wide",
          LAST_MODE: "land",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpSpring,
      "--params",
      paramsPath,
      "--dry-run",
    ]);
    assert(r.status === 0, "0.7.27 NEW-1 spring+db dry-run exits 0");
    assert(!/ReferenceError|SPRING_DB_BLOCK_ENABLED is not defined/.test(String(r.stderr || "") + String(r.stdout || "")), "0.7.27 NEW-1 no ReferenceError");
    // write for real to assert SPRING_DB_BLOCK substitution (dry-run preview may omit extras)
    const rWrite = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpSpring,
      "--params",
      paramsPath,
    ]);
    assert(rWrite.status === 0, "0.7.27 NEW-1 spring+db write exits 0");
    const agentsBody = fs.readFileSync(path.join(tmpSpring, "demo-be", "AGENTS.md"), "utf8");
    assert(
      /迁移模式/.test(agentsBody) && /flyway/.test(agentsBody),
      "0.7.27 NEW-1 SPRING_DB_BLOCK has migration mode from buildSpringDbBlock"
    );
  } finally {
    fs.rmSync(tmpSpring, { recursive: true, force: true });
  }

  // SG-7: Chinese section title TODO detection
  const tmpZh = fs.mkdtempSync(path.join(os.tmpdir(), "harness-027-zh-"));
  try {
    fs.writeFileSync(
      path.join(tmpZh, "AGENTS.md"),
      "# demo\n\n## 常用命令\n\n| Task | Command |\n|---|---|\n| build | TODO(harness-eng) |\n",
      "utf8"
    );
    const zh = checkEntryReady(tmpZh);
    assert(!zh.ok && zh.files.includes("AGENTS.md"), "0.7.27 SG-7 Chinese 常用命令 TODO detected");
  } finally {
    fs.rmSync(tmpZh, { recursive: true, force: true });
  }

  // NEW-2: fill-score --root from skill CWD must still see entry_todo
  const tmpScore = fs.mkdtempSync(path.join(os.tmpdir(), "harness-027-score-"));
  try {
    fs.writeFileSync(
      path.join(tmpScore, "AGENTS.md"),
      "# demo\n\n## Commands\n\n| Task | Command |\n|---|---|\n| build | TODO(harness-eng) |\n",
      "utf8"
    );
    fs.mkdirSync(path.join(tmpScore, "docs", "harness-eng"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpScore, "docs", "harness-eng", "score-policy.yaml"),
      "gate_profile: strict\ngate:\n  forbid_harness_todo: false\n",
      "utf8"
    );
    const scoreOut = path.join(tmpScore, "score.json");
    const rScore = runNode(
      [
        path.join(skillRoot, "scripts/fill-score.mjs"),
        "--root",
        tmpScore,
        "--domains",
        "api",
        "--json",
        "--output",
        scoreOut,
      ],
      { cwd: skillRoot }
    );
    assert(rScore.status === 0 || rScore.status === 2, "0.7.27 NEW-2 fill-score runs from skill CWD");
    let report = null;
    if (fs.existsSync(scoreOut)) {
      try {
        report = JSON.parse(fs.readFileSync(scoreOut, "utf8"));
      } catch {
        report = null;
      }
    }
    if (!report) {
      try {
        report = JSON.parse(rScore.stdout || "");
      } catch {
        report = null;
      }
    }
    assert(report && String(report.root) === ".", "0.7.30 ID-8 report.root persisted as .");
    assert(
      report &&
        report.ai_coding_ready &&
        Array.isArray(report.ai_coding_ready.blockers) &&
        report.ai_coding_ready.blockers.some((b) => String(b).startsWith("entry_todo:")),
      "0.7.27 NEW-2 entry_todo when fill-score run from skill CWD"
    );
  } finally {
    fs.rmSync(tmpScore, { recursive: true, force: true });
  }

  // LT-6/8: no redis domain → no redis-doc-sync; no mysql MCP → no mcp-mysql-guard
  const tmpGate = fs.mkdtempSync(path.join(os.tmpdir(), "harness-027-gate-"));
  try {
    const paramsPath = path.join(tmpGate, "params.json");
    fs.writeFileSync(
      paramsPath,
      JSON.stringify({
        ladder: "L5",
        agent_config: true,
        domains: ["api"],
        ai_tools: ["codex"],
        mcp: [],
        hooks_family: ["commit-gate"],
        on_exists: "skip",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          DATE: "2026-09-28",
          LADDER_TARGET: "L5",
          AGENTS_VARIANT: "solo",
          GLOB_PROFILE: "wide",
          LAST_MODE: "land",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpGate,
      "--params",
      paramsPath,
      "--dry-run",
    ]);
    assert(r.status === 0, "0.7.27 LT-6/8 dry-run exits 0");
    let out = null;
    try {
      out = JSON.parse(r.stdout);
    } catch {
      out = null;
    }
    const targets = (out && out.results ? out.results : []).map((x) => String(x.target || ""));
    assert(
      !targets.some((t) => /redis-doc-sync/.test(t)),
      "0.7.27 LT-6 no redis-doc-sync without redis domain"
    );
    assert(
      !targets.some((t) => /mcp-mysql-guard/.test(t)),
      "0.7.27 LT-8 no mcp-mysql-guard without mysql MCP"
    );
    assert(
      targets.some((t) => /superpowers-commit-gate\.js|git-commit-soft-gate\.js/.test(t)),
      "0.7.27 LT-1 L5 renders commit gate into SSOT"
    );
  } finally {
    fs.rmSync(tmpGate, { recursive: true, force: true });
  }
}

// --- 0.7.28 e2e P1: upgrade hooks · SG-6 · HS-4 · SG-5 · ID-3/4 ---
{
  const renderSrc28 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/isUpgradeFixHookTarget/.test(renderSrc28), "0.7.28 upgrade fix-hooks helper");
  assert(/upgrade_fix_hooks/.test(renderSrc28), "0.7.28 upgrade_fix_hooks gate");

  // SG-6: null acceptance_warnings_max is not explicit
  const scoreSrc28 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(
    /aw\[1\] !== "null"/.test(scoreSrc28) &&
      /explicit\.acceptance_warnings_max = true/.test(scoreSrc28),
    "0.7.28 SG-6 null warnings not explicit"
  );
  const policyTmpl28 = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
    "utf8"
  );
  assert(/null=按 profile/.test(policyTmpl28), "0.7.28 score-policy tmpl null=profile");

  // HS-4: docs/ prefix gets docsGuard
  const hooksSrc28 = fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8");
  assert(
    /norm\.startsWith\("docs\/"\)/.test(hooksSrc28) ||
      /startsWith\("docs\/"\)[\s\S]{0,80}docsGuard/.test(hooksSrc28),
    "0.7.28 HS-4 docs prefix docsGuard"
  );
  const predsDocs = globListToCodePreds("docs/api/**");
  assert(predsDocs.includes("docs/api/"), "0.7.28 HS-4 glob expands docs/api/");
  const checksDocs = buildContractChecksJs(["api"], { GLOB_API: "docs/api/**" });
  assert(
    /!f\.startsWith\("docs\/"\)/.test(checksDocs) && /docs\/api\//.test(checksDocs),
    "0.7.28 HS-4 docs/api/** code pred guarded"
  );

  // SG-5 / NEW-4: narrow header — data row with 返回类型 must not reset headers
  const tbl = `| 参数名 | 类型 | 示例 |
|---|---|---|
| foo | string | a |
| bar | 返回类型说明 | b |
`;
  const split = splitTableRows(tbl);
  assert(split.rows.length === 2, "0.7.28 SG-5 data rows not misclassified as headers");

  // ID-4: pass=false when covIncomplete (0.7.31 also missingInventoryDomains / undercount)
  assert(
    /covIncomplete \? false : report\.ready\.ok/.test(scoreSrc28) ||
      /covIncomplete \|\| missingInventoryDomains\.length \|\| undercount/.test(scoreSrc28),
    "0.7.28 ID-4 no morph-pass without inventory"
  );
  assert(/covered_gt_code/.test(scoreSrc28) && /inventory_undercount/.test(scoreSrc28), "0.7.28 ID-3 anomaly blocks ready");

  // upgrade replace soft-gate when mode=upgrade
  const tmpUp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-028-up-"));
  try {
    const hooksDir = path.join(tmpUp, ".cursor", "hooks");
    fs.mkdirSync(hooksDir, { recursive: true });
    const oldGate = path.join(hooksDir, "git-commit-soft-gate.js");
    fs.writeFileSync(oldGate, "// OLD .[^/]* fingerprint\nconst x = 1;\n", "utf8");
    const paramsPath = path.join(tmpUp, "params.json");
    fs.writeFileSync(
      paramsPath,
      JSON.stringify({
        mode: "upgrade",
        upgrade_fix_hooks: true,
        ladder: "L4",
        domains: ["api"],
        ai_tools: ["cursor"],
        hooks_family: ["commit-gate-extended"],
        on_exists: "skip",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "up",
          REPO_DESC: "up",
          DATE: "2026-09-28",
          LADDER_TARGET: "L4",
          AGENTS_VARIANT: "solo",
          GLOB_PROFILE: "wide",
          LAST_MODE: "upgrade",
          CODE_PREFIXES: "src/",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpUp,
      "--params",
      paramsPath,
    ]);
    assert(r.status === 0, "0.7.28 upgrade render exits 0");
    const body = fs.readFileSync(oldGate, "utf8");
    assert(!/OLD \.\[\^\/\]\*/.test(body), "0.7.28 upgrade replaced soft-gate");
    assert(/CONTRACT_CHECKS|permission|git/.test(body), "0.7.28 upgrade soft-gate looks rendered");
  } finally {
    fs.rmSync(tmpUp, { recursive: true, force: true });
  }

  assert(
    /0\.7\.27 → 0\.7\.28/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "0.7.28 upgrade.md migration section"
  );
}

// --- 0.7.29 e2e P2: calibrate · merge · render · inventory · score UX ---
{
  // FC-1: replaceCreateTableBlock preserves 说明
  const mdWithNote = `## 建表语句\n\n> 以下建表语句**始终为最新完整版本**\n\n\`\`\`sql\nCREATE TABLE t (id INT);\n\`\`\`\n`;
  const patched = replaceCreateTableBlock(mdWithNote, "CREATE TABLE t (id INT, name VARCHAR(10));");
  assert(/始终为最新完整版本/.test(patched), "0.7.29 FC-1 write-ddl keeps 说明");
  assert(/name VARCHAR/.test(patched), "0.7.29 FC-1 write-ddl updates fence");
  assert(formatDdlDiff("a\nb", "a\nc").includes("-"), "0.7.29 FC-1 formatDdlDiff");
  assert(
    extractShowCreateDdl({ "Create Table": "CREATE TABLE x(id int)" }) === "CREATE TABLE x(id int)",
    "0.7.29 FC-1 SHOW CREATE MySQL key"
  );
  assert(
    normalizeDdlForCompare("CREATE TABLE t(id int) ENGINE=InnoDB COMMENT='x'") ===
      normalizeDdlForCompare("CREATE TABLE t(id int)"),
    "0.7.29 FC-1 normalize strips ENGINE/COMMENT"
  );

  // FC-9: updateDomainIndex targets ## 表文档
  const tmpIdx = fs.mkdtempSync(path.join(os.tmpdir(), "harness-029-idx-"));
  try {
    const docsDb = path.join(tmpIdx, "docs", "db");
    const tableDir = path.join(docsDb, "table");
    fs.mkdirSync(tableDir, { recursive: true });
    fs.writeFileSync(
      path.join(docsDb, "db.md"),
      `# db\n\n## 表文档\n\n| 名称 | 文件 | 备注 |\n|---|---|---|\n| 01-old | [\`01-old.md\`](table/01-old.md) | — |\n\n## 变更记录（索引级）\n\n| 版本 | 类型 | 内容 | 操作人 | 更新时间 |\n|---|---|---|---|---|\n| v0.1 | init | x | y | 2026-01-01 |\n`,
      "utf8"
    );
    fs.writeFileSync(path.join(tableDir, "01-old.md"), "# old\n", "utf8");
    fs.writeFileSync(path.join(tableDir, "02-new.md"), "# new\n", "utf8");
    const r = updateDomainIndex({ root: tmpIdx, domain: "db", targetDir: tableDir });
    assert(r.updated, "0.7.29 FC-9 index updated");
    const body = fs.readFileSync(path.join(docsDb, "db.md"), "utf8");
    const changelogSec = body.split(/##\s*变更记录/)[1] || "";
    assert(/02-new/.test(body), "0.7.29 FC-9 new row present");
    assert(!/02-new/.test(changelogSec), "0.7.29 FC-9 row not in 变更记录");
  } finally {
    fs.rmSync(tmpIdx, { recursive: true, force: true });
  }

  // LT-5: 常用命令 prefill
  const prefillSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/prefill-commands.mjs"), "utf8");
  assert(/常用命令/.test(prefillSrc), "0.7.29 LT-5 matches 常用命令");
  assert(typeof applyCommandsPrefill === "function", "0.7.29 LT-5 applyCommandsPrefill export");

  // LT-11: skipped-unresolved
  const renderSrc29 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/skipped-unresolved/.test(renderSrc29), "0.7.29 LT-11 skip write on unresolved");
  assert(/typeof v === "boolean"/.test(renderSrc29), "0.7.29 ID-6 formatYamlValue booleans");

  // SG-10: resolveInventoryOutPath
  const rootFake = path.join(os.tmpdir(), "harness-029-root");
  assert(
    resolveInventoryOutPath(rootFake, "docs/out.json", "api").replace(/\\/g, "/").endsWith("docs/out.json"),
    "0.7.29 SG-10 relative --out under root"
  );

  // ID-7 / SG-10 CLI / SG-1
  const reportSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-report-html.mjs"), "utf8");
  assert(/skipScoreCopy/.test(reportSrc), "0.7.29 ID-7 skipScoreCopy when score is latest");
  const scoreSrc29 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/--gate-profile/.test(scoreSrc29), "0.7.29 SG-10 --gate-profile");
  assert(/detectFuncMethodDrift/.test(scoreSrc29), "0.7.29 SG-1 func drift wired");
  assert(/requestFields/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-api.mjs"), "utf8")), "0.7.29 SG-1 requestFields");
  assert(/empty_inventory:db/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/field-drift.mjs"), "utf8")), "0.7.29 NEW-8 empty inventory drift");

  // FC-8 / HS-8 docs
  const heReadme = fs.readFileSync(path.join(skillRoot, "templates/docs/harness-eng/README.md"), "utf8");
  assert(/\.fill-work/.test(heReadme) && /hooksPath/.test(heReadme), "0.7.29 FC-8/HS-8 README tips");
  assert(
    /\.fill-work/.test(fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"), "utf8")),
    "0.7.29 FC-8 AGENTS tip"
  );
  assert(/tipGitHooks/.test(fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8")), "0.7.29 HS-8 land tip");

  // LT-7 HEADER
  assert(
    /时间 \/ 撰写 \/ 目的 \/ 类型/.test(
      fs.readFileSync(path.join(skillRoot, "templates/rules/13-db-doc-sync.mdc.tmpl"), "utf8")
    ),
    "0.7.29 LT-7 rule13 HEADER align"
  );

  assert(
    /0\.7\.28 → 0\.7\.29/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "0.7.29 upgrade.md migration section"
  );
}

// --- 0.7.30 e2e P0 hotfix: NEW-10/11/12/14/15 ---
{
  // NEW-10: yaml quoted keys + inventory-meta no inflation
  const y = parseYaml('inventory:\n  api:\n    module_roots:\n      "project": "project"\n');
  assert(
    y?.inventory?.api?.module_roots &&
      Object.keys(y.inventory.api.module_roots).includes("project") &&
      !Object.keys(y.inventory.api.module_roots).some((k) => k.includes('"')),
    "0.7.30 NEW-10 yaml parseScalar on map keys"
  );
  assert(stripWrappingQuotes('"""project"""') === "project", "0.7.30 NEW-10 stripWrappingQuotes");
  const tmpMeta = fs.mkdtempSync(path.join(os.tmpdir(), "harness-030-meta-"));
  try {
    const metaDir = path.join(tmpMeta, "docs", "harness-eng");
    fs.mkdirSync(metaDir, { recursive: true });
    const metaPath = path.join(metaDir, "harness-meta.yaml");
    fs.writeFileSync(metaPath, "skill_version: \"0.7.30\"\nladder: L2\n", "utf8");
    writeInventoryMeta(tmpMeta, {
      api: { module_roots: { project: "backend/src/.../project" } },
    });
    writeInventoryMeta(tmpMeta, {
      api: { module_roots: { project: "backend/src/.../project" } },
    });
    const raw = fs.readFileSync(metaPath, "utf8");
    assert(
      /module_roots:\s*\n\s+project:/.test(raw) && !/"project"/.test(raw),
      "0.7.30 NEW-10 write unquoted safe key"
    );
    const inv = readInventoryMeta(tmpMeta);
    assert(
      inv.api?.module_roots?.project === "backend/src/.../project",
      "0.7.30 NEW-10 read after double-write"
    );
    assert(
      !Object.keys(inv.api.module_roots).some((k) => /"/.test(k)),
      "0.7.30 NEW-10 keys not quote-inflated"
    );
  } finally {
    fs.rmSync(tmpMeta, { recursive: true, force: true });
  }

  // NEW-12: reapplyGateProfile clears strict fingerprints for CLI gold
  const goldFromStrict = reapplyGateProfile(
    {
      gate: { morph_floor: 75, todo_scan: "truths", forbid_harness_todo: true },
      coverage_targets: { api: 0.8, func: 0.8, db: 0.8 },
      coverage_mode: "overall",
    },
    "gold",
    { coverageModeFromFile: false }
  );
  assert(goldFromStrict.gate.morph_floor === 95, "0.7.30 NEW-12 gold morph 95");
  assert(goldFromStrict.gate.template_completeness_min === 95, "0.7.30 NEW-12 gold tc 95");
  assert(goldFromStrict.gate.todo_scan === "harness_docs", "0.7.30 NEW-12 gold todo_scan harness_docs");
  assert(goldFromStrict.gate.acceptance_warnings_max === 0, "0.7.30 NEW-12 gold warnings 0");
  assert(goldFromStrict.coverage_mode === "all_domains", "0.7.30 NEW-12 gold coverage_mode");
  assert(goldFromStrict.coverage_targets.api === 1.0, "0.7.30 NEW-12 gold coverage 1.0");

  // NEW-11: frontend 常用命令 code-block prefill must not clobber api-client table
  const feMd = `# fe\n\n## 常用命令\n\n\`\`\`text\nTODO(harness-eng): install / dev\n\`\`\`\n\n## api-client / 契约同步\n\n| 变更 | 必须同步 |\n|---|---|\n| 后端 REST 契约 | docs/api |\n| 仅前端展示 | 本模块 |\n\nTODO(harness-eng): paths\n`;
  const tmpFe = fs.mkdtempSync(path.join(os.tmpdir(), "harness-030-fe-"));
  try {
    fs.writeFileSync(
      path.join(tmpFe, "package.json"),
      JSON.stringify({ scripts: { test: "vitest", lint: "eslint ." } }),
      "utf8"
    );
    const out = applyCommandsPrefill(feMd, tmpFe, {});
    assert(/\| Task \| Command \|/.test(out), "0.7.30 NEW-11 installs Commands table");
    assert(/npm run test/.test(out), "0.7.30 NEW-11 prefills npm test");
    assert(/后端 REST 契约/.test(out) && /仅前端展示/.test(out), "0.7.30 NEW-11 keeps api-client rows");
    const cmdsSec = (out.split(/##\s*api-client/)[0] || "");
    assert(/常用命令/.test(cmdsSec) && /npm run/.test(cmdsSec), "0.7.30 NEW-11 commands in 常用命令 sec");
  } finally {
    fs.rmSync(tmpFe, { recursive: true, force: true });
  }

  // NEW-15: soft-gate tmpl has HOST_SOFT / --codex; mini runtime mirrors allow()
  const softTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(/HOST_SOFT/.test(softTmpl) && /--codex/.test(softTmpl), "0.7.30 NEW-15 soft-gate HOST_SOFT");
  assert(
    /if \(HOST_SOFT\)[\s\S]*console\.error\(extra\.agent_message\)/.test(softTmpl),
    "0.7.30 NEW-15 soft-gate stderr on HOST_SOFT"
  );
  const tmpHook = fs.mkdtempSync(path.join(os.tmpdir(), "harness-030-hook-"));
  try {
    const mini = `
const argv = process.argv.slice(2);
const GIT_MODE = argv.includes("--git") || process.env.HARNESS_HOOK_MODE === "git";
const CODEX_MODE = argv.includes("--codex") || process.env.HARNESS_HOOK_MODE === "codex";
const HOST_SOFT = GIT_MODE || CODEX_MODE;
function allow(extra = {}) {
  if (HOST_SOFT) {
    if (extra.agent_message) console.error(extra.agent_message);
    process.exit(0);
  }
  process.stdout.write(JSON.stringify({ permission: "allow", ...extra }));
  process.exit(0);
}
allow({ agent_message: "[api] probe" });
`;
    const miniPath = path.join(tmpHook, "mini-soft.js");
    fs.writeFileSync(miniPath, mini, "utf8");
    const rCodex = spawnSync(process.execPath, [miniPath, "--codex"], {
      encoding: "utf8",
      windowsHide: true,
    });
    assert(rCodex.status === 0, "0.7.30 NEW-15 mini --codex exit 0");
    assert(/\[api\] probe/.test(rCodex.stderr || ""), "0.7.30 NEW-15 reminder on stderr");
    assert(!/\[api\] probe/.test(rCodex.stdout || ""), "0.7.30 NEW-15 not on stdout");
    const rCursor = spawnSync(process.execPath, [miniPath], {
      encoding: "utf8",
      windowsHide: true,
    });
    assert(/agent_message/.test(rCursor.stdout || ""), "0.7.30 NEW-15 Cursor still JSON stdout");
  } finally {
    fs.rmSync(tmpHook, { recursive: true, force: true });
  }

  assert(
    /0\.7\.29 → 0\.7\.30/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "0.7.30 upgrade.md migration section"
  );
  assert(/reapplyGateProfile/.test(fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8")), "0.7.30 fill-score uses reapplyGateProfile");
}

// --- 0.7.31 e2e P1: ID-3/4/5 · FC-1/9 · SG-1 · HS-7 ---
{
  const scoreSrc31 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/missing_inventory/.test(scoreSrc31), "0.7.31 ID-4 missing_inventory in fill-score");
  assert(
    /covIncomplete \|\| missingInventoryDomains\.length \|\| undercount/.test(scoreSrc31),
    "0.7.31 ID-4 pass=false on missing inventory"
  );

  // ID-3: inventory --no-write + refresh wiring
  assert(
    /--no-write/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-api.mjs"), "utf8")),
    "0.7.31 ID-3 inventory-api --no-write"
  );
  assert(
    /noWrite: !write/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/refresh.mjs"), "utf8")),
    "0.7.31 ID-3 refresh passes noWrite"
  );

  // FC-1: normalize + exit on db_diff + write-ddl disclaimer
  assert(
    /AUTO_INCREMENT/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/fill-calibrate-live.mjs"), "utf8")
    ),
    "0.7.31 FC-1 normalize AUTO_INCREMENT"
  );
  assert(
    /db_diff/.test(fs.readFileSync(path.join(skillRoot, "scripts/fill-calibrate-live.mjs"), "utf8")) &&
      /非 Flyway 逐字/.test(
        fs.readFileSync(path.join(skillRoot, "scripts/fill-calibrate-live.mjs"), "utf8")
      ),
    "0.7.31 FC-1 db_diff exit + write-ddl disclaimer"
  );
  assert(
    normalizeDdlForCompare("CREATE TABLE `t` (id int) AUTO_INCREMENT=9 ENGINE=InnoDB") ===
      normalizeDdlForCompare("CREATE TABLE t (id int)"),
    "0.7.31 FC-1 normalize backticks+AUTO_INCREMENT"
  );
  const patchedFly = replaceCreateTableBlock(
    "## 建表语句\n\n与 Flyway 迁移逐字一致\n\n```sql\nold\n```\n",
    "CREATE TABLE t(id int)"
  );
  assert(/非 Flyway 逐字/.test(patchedFly), "0.7.31 FC-1 rewrite Flyway claim");
  assert(/CREATE TABLE t/.test(patchedFly), "0.7.31 FC-1 write-ddl updates fence");

  // SG-1 thresholds + annotationParams
  const driftSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/field-drift.mjs"), "utf8");
  assert(/: 0\.15/.test(driftSrc), "0.7.31 SG-1 api ratio 0.15");
  assert(/0\.25/.test(driftSrc), "0.7.31 SG-1 func ratio 0.25");
  assert(/annotationParams/.test(driftSrc), "0.7.31 SG-1 annotationParams drift");
  assert(
    /dtoSearchRoot|extractTypeFieldNames\(text, bodyType, dtoSearchRoot\)/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-api.mjs"), "utf8")
    ),
    "0.7.31 SG-1 cross-file DTO search"
  );

  // ID-5: fail→skip + JSON error
  const harnessSrc = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(/on_exists === "fail"/.test(harnessSrc), "0.7.31 ID-5 fail→skip");
  assert(/ok: false, error:/.test(harnessSrc) || /ok:\s*false,\s*error:/.test(harnessSrc), "0.7.31 ID-5 JSON error");

  // HS-7 bareRe
  const syncTmpl31 = fs.readFileSync(
    path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"),
    "utf8"
  );
  // HS-7: optional quote between adapter.js and commit-gate (functional extract asserted below)
  assert(
    /codex-adapter\\.js\|codex-hook\\.cmd\)\["'\]\?\\s\+/.test(syncTmpl31) ||
      syncTmpl31.includes('["\']?\\s+(?:commit-gate|mcp-guard|--direct)'),
    "0.7.31 HS-7 bareRe allows quote after .js"
  );
  const bareRe = /(?:codex-adapter\.js|codex-hook\.cmd)["']?\s+(?:commit-gate|mcp-guard|--direct)\s+([A-Za-z0-9_.-]+\.(?:js|cmd|mjs))\b/g;
  const sampleCmd =
    'node "$(git rev-parse --show-toplevel)/.codex/hooks/codex-adapter.js" commit-gate missing-gate.js';
  const bm = bareRe.exec(sampleCmd);
  assert(bm && bm[1] === "missing-gate.js", "0.7.31 HS-7 bareRe extracts script after quote");

  // FC-9: update-index path + placeholder strip
  const tmpFc9 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-031-fc9-"));
  try {
    const docsApi = path.join(tmpFc9, "docs", "api");
    const modules = path.join(docsApi, "modules");
    const fillWork = path.join(docsApi, ".fill-work", "project");
    fs.mkdirSync(modules, { recursive: true });
    fs.mkdirSync(fillWork, { recursive: true });
    fs.writeFileSync(
      path.join(docsApi, "api.md"),
      `# api\n\n## 模块文档\n\n| 名称 | 文件 | 备注 | 负责人 |\n|---|---|---|---|\n| 01-old | [\`01-old.md\`](modules/01-old.md) | — | x |\n| 02-new | — | （待补充） | — |\n\n## 变更记录\n\n| v | note |\n|---|---|\n`,
      "utf8"
    );
    fs.writeFileSync(path.join(modules, "01-old.md"), "# old\n", "utf8");
    fs.writeFileSync(path.join(modules, "02-new.md"), "# new\n", "utf8");
    const r = updateDomainIndex({
      root: tmpFc9,
      domain: "api",
      targetDir: modules,
    });
    assert(r.updated, "0.7.31 FC-9 index updated");
    const body = fs.readFileSync(path.join(docsApi, "api.md"), "utf8");
    assert(/02-new/.test(body) && /modules\/02-new\.md/.test(body), "0.7.31 FC-9 real row");
    assert(!/待补充/.test(body), "0.7.31 FC-9 placeholder removed");
    // 4-col header → row has 4 cells
    const dataRows = body
      .split(/##\s*模块文档/)[1]
      .split(/##\s*变更记录/)[0]
      .split(/\n/)
      .filter((l) => /^\|/.test(l) && !/---/.test(l) && !/名称/.test(l));
    const newRow = dataRows.find((l) => /02-new/.test(l));
    assert(newRow && newRow.split("|").filter((c) => c.trim() !== "").length === 4, "0.7.31 FC-9 col align");
  } finally {
    fs.rmSync(tmpFc9, { recursive: true, force: true });
  }

  assert(
    /0\.7\.30 → 0\.7\.31/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "0.7.31 upgrade.md migration section"
  );
  assert(
    /fill-work/.test(fs.readFileSync(path.join(skillRoot, "scripts/fill-merge.mjs"), "utf8")),
    "0.7.31 FC-9 fill-merge resolves fill-work"
  );
}

// --- 0.7.32 e2e P2: LT-6/7/11 · FC-6 · NEW-8/16/17 · ID-6 · 升级提示 · §7#2 ---
{
  const agentsRoot = fs.readFileSync(
    path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"),
    "utf8"
  );
  assert(/DOCS_CONTRACT_TREE/.test(agentsRoot), "0.7.32 LT-6 AGENTS uses DOCS_CONTRACT_TREE");
  assert(/AGENTS_SKILLS_LIST/.test(agentsRoot), "0.7.32 LT-6 AGENTS uses AGENTS_SKILLS_LIST");
  assert(!/redis-doc-sync.*jobs-doc-sync/.test(agentsRoot), "0.7.32 LT-6 no hard-coded redis/jobs skills");

  const hooksChk = fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8");
  assert(/MIGRATION_HEADER_KEYS[\s\S]*?"\[\]"/.test(hooksChk) || /\|\|\s*"\[\]"/.test(hooksChk), "0.7.32 LT-7 HEADER_KEYS default []");
  assert(/mysql-\(local\|dev\|test\|uat\)/.test(hooksChk), "0.7.32 LT-11 default includes mysql-local");
  assert(/CODEX_MYSQL_HOOK_ENTRY/.test(hooksChk), "0.7.32 NEW-16 CODEX_MYSQL_HOOK_ENTRY builder");

  const afterEdit = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/after-edit-reminder.js.tmpl"),
    "utf8"
  );
  assert(/MIGRATION_ANY_RE/.test(afterEdit), "0.7.32 LT-7 MIGRATION_ANY_RE for non-V* sql");

  const mergeDom = fs.readFileSync(path.join(skillRoot, "scripts/lib/merge-domain.mjs"), "utf8");
  assert(/svc\.class\s*\|\|/.test(mergeDom), "0.7.32 FC-6 extract uses svc.class");

  const calSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-calibrate-live.mjs"), "utf8");
  assert(
    /no docs\/db\/\.fill-work\/inventory\.json/.test(calSrc) || /no inventory\.json/.test(calSrc),
    "0.7.32 NEW-8 refuse missing inventory"
  );
  assert(/never write tables:\[\]|tables\.length > 0/.test(calSrc), "0.7.32 NEW-8 no empty inventory write");

  const harnessSrc32 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(/LAST_MODE = mode/.test(harnessSrc32), "0.7.32 ID-6 force LAST_MODE");
  assert(/warnManualReplaceGaps/.test(harnessSrc32), "0.7.32 upgrade tip wired");

  const renderSrc32 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/valuesEqual/.test(renderSrc32) || /value unchanged/.test(renderSrc32), "0.7.32 ID-6 preserve YAML block");
  assert(/bak-harness/.test(renderSrc32) && /upgrade_fix_hooks/.test(renderSrc32), "0.7.32 NEW-17 backup on replace");

  const codexTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/codex-hooks.json.tmpl"),
    "utf8"
  );
  assert(/CODEX_MYSQL_HOOK_ENTRY/.test(codexTmpl), "0.7.32 NEW-16 tmpl placeholder");
  assert(!/mcp__mysql/.test(codexTmpl.replace(/\{\{CODEX_MYSQL_HOOK_ENTRY\}\}/, "")), "0.7.32 NEW-16 no static mysql matcher");

  const freshSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/sync-freshness.mjs"), "utf8");
  assert(/warnManualReplaceGaps/.test(freshSrc), "0.7.32 freshness manual-replace hints");

  const mergeApi = fs.readFileSync(path.join(skillRoot, "scripts/lib/merge-api.mjs"), "utf8");
  assert(
    /filtered\.length/.test(mergeApi) && /moduleName/.test(mergeApi),
    "0.7.32 §7#2 module filter"
  );

  assert(
    /DOCS_CONTRACT_TREE/.test(fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")),
    "0.7.32 LT-6 render builds DOCS_CONTRACT_TREE"
  );

  const ev = extractInventoryEvidence(
    {
      modules: [
        {
          services: [
            { class: "TaskService", evidence: "a/TaskService.java" },
            { class: "ProjectService", evidence: "a/ProjectService.java" },
            { class: "CommentService", evidence: "a/CommentService.java" },
          ],
        },
      ],
    },
    "func"
  );
  assert(
    ev.map((x) => x.label).join(",") === "TaskService,ProjectService,CommentService",
    "0.7.32 FC-6 preserve discovery order labels"
  );

  assert(
    /0\.7\.31 → 0\.7\.32/.test(fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8")),
    "0.7.32 upgrade.md migration section"
  );
}

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
