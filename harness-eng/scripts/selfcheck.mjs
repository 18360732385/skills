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
import { createHash } from "crypto";
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
  applyMatureCompatGateDefaults,
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
  expandHooksFamily,
  resolveAgentConfig,
  HOOK_DEFS,
} from "./lib/hooks-checks.mjs";
import { mavenCmdsForModule } from "./lib/maven-cmds.mjs";
import { morphDepthBonus } from "./lib/morph-depth.mjs";
import { pickRecommended } from "./questions-next.mjs";
import { isInventoryStale } from "./lib/git-head.mjs";
import { createSelfcheckHelpers } from "./lib/selfcheck/helpers.mjs";
import {
  detectRedisKeyDrift,
  detectJobsTaskDrift,
  detectApiFieldDrift,
  detectDbFieldDrift,
  parseDocFieldNames,
  parseDocCreateFieldNames,
  normalizeScheduleToken,
  docCreateCoversColumns,
} from "./lib/field-drift.mjs";
import { isNoisePattern } from "./lib/inventory-redis.mjs";
import { scanApiInventoryMemory } from "./lib/inventory-api.mjs";
import { readGitHead } from "./lib/git-head.mjs";
import {
  diffBlockers,
  buildDocTodos,
  emitUpgradeStrictnessDiff,
  resolveMigrateDocsMode,
  resolveCoverageMode,
} from "./lib/upgrade-diff.mjs";
import {
  planMigrateDocs,
  applyMigrateDocs,
  runMigrateDocs,
  planCoverageAppend,
  normalizeCoverageMode,
  detectThickTruths,
  pickApiDocForPath,
} from "./lib/migrate-docs.mjs";
import {
  stripYamlKeys,
  compareHarnessMetaStable,
  hashHarnessMetaText,
  runMetaStableCheck,
} from "./lib/meta-stable.mjs";
import { splitTableRows } from "./lib/doc-density.mjs";
import {
  replaceCreateTableBlock,
  formatDdlDiff,
  extractShowCreateDdl,
  normalizeDdlForCompare,
  classifyDdlDiff,
  structuralDdlFingerprint,
} from "./fill-calibrate-live.mjs";
import { updateDomainIndex, extractInventoryEvidence } from "./lib/merge-domain.mjs";
import { applyCommandsPrefill, collectCommandPrefill } from "./lib/prefill-commands.mjs";
import { resolveInventoryOutPath, mergeApiInventories } from "./lib/inventory-paths.mjs";
import { inventoryArgv } from "./lib/refresh.mjs";
import {
  writeInventoryMeta,
  readInventoryMeta,
  stripWrappingQuotes,
  writeMysqlGuardServers,
  readMysqlGuardServers,
  writeSkillRoot,
  readSkillRoot,
  resolveSkillRoot,
  SKILL_ROOT_ENV_SENTINEL,
} from "./lib/inventory-meta.mjs";
import {
  findObsoleteWrappers,
  retireObsoleteWrappers,
  warnObsoleteWrappers,
} from "./lib/obsolete-wrappers.mjs";
import { applyGateProfileToPolicyFile } from "./lib/score-policy-migrate.mjs";
import { buildBackfillPlan } from "./lib/backfill-plan.mjs";
import { parse as parseYaml } from "./lib/yaml.mjs";
import { isGeneratedHostPath, resolveLandAgentConfig } from "./harness.mjs";
import { mergeYamlMaps } from "./render.mjs";
import {
  ensureDbMdMaintenance,
  detectDbMigrationMode,
  warnMcpExampleProfile,
  warnManualReplaceGaps,
} from "./lib/sync-freshness.mjs";
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

const _helpers = createSelfcheckHelpers(skillRoot, { ok, fail });
const { docPath, readDoc, assert, runNode } = _helpers;
assert(typeof createSelfcheckHelpers === "function", "selfcheck helpers.mjs wired");
assert(
  fs.existsSync(path.join(skillRoot, "templates/_meta/RENDER-REGISTRIES.md")),
  "RENDER-REGISTRIES.md documents code registries"
);

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
// 0.7.50 双态门禁：install 态（npx skills add，无 _log 兄弟目录）自动跳过仓库级档案断言
const hasLogRoot = fs.existsSync(logRoot);
if (!hasLogRoot) {
  console.log("[install mode] 无仓库级 _log 档案（安装包不含）：档案类断言自动跳过（dev 全仓态全量真跑）。");
}
function logFile(ver) {
  const m = String(ver).match(/^(\d+\.\d+)\./);
  return m ? path.join(logRoot, m[1], `${ver}.md`) : path.join(logRoot, `${ver}.md`);
}
function logExists(ver) {
  return !hasLogRoot || fs.existsSync(logFile(ver));
}
function upgradeCorpus() {
  let text = fs.readFileSync(path.join(skillRoot, "modes/upgrade.md"), "utf8");
  if (hasLogRoot) {
    const hist = path.resolve(skillRoot, "../_log/harness-eng/docs/upgrade-history-through-0.7.51.md");
    if (fs.existsSync(hist)) text += "\n" + fs.readFileSync(hist, "utf8");
  }
  return text;
}
function verifyCorpus() {
  let text = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  if (hasLogRoot) {
    const hist = path.resolve(skillRoot, "../_log/harness-eng/docs/VERIFY-history-through-0.7.51.md");
    if (fs.existsSync(hist)) text += "\n" + fs.readFileSync(hist, "utf8");
  }
  return text;
}
function readLog(ver) {
  const p = logFile(ver);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
function listVersionLogFiles(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
    if (ent.isDirectory() && /^\d+\.\d+$/.test(ent.name)) {
      for (const f of fs.readdirSync(path.join(root, ent.name))) {
        if (/^\d+\.\d+\.\d/.test(f) && f.endsWith(".md")) out.push(path.join(root, ent.name, f));
      }
    } else if (ent.isFile() && /^\d+\.\d+\.\d/.test(ent.name) && ent.name.endsWith(".md")) {
      out.push(path.join(root, ent.name));
    }
  }
  return out;
}
const changelogIndex = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
const changelog = listVersionLogFiles(logRoot)
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");
assert(!/_log[\/\\]/.test(changelogIndex), "CHANGELOG purged of _log paths");
for (const ver of ["0.5.2","0.5.3","0.5.4","0.5.5","0.5.6","0.5.7","0.5.8","0.5.9","0.5.10"]) {
  assert(logExists(ver), `_log has ${ver}`);
  assert(changelogIndex.includes(`| ${ver} |`), `CHANGELOG index row ${ver}`);
}
assert(!/^## 0\.5\.10/m.test(changelogIndex), "hot CHANGELOG dropped 0.5.x ## sections");
for (const ver of [
  "0.6.2","0.6.3","0.6.4","0.6.5","0.6.6","0.6.7","0.6.8-dev",
  "0.7.0","0.7.2","0.7.3","0.7.4","0.7.5","0.7.6","0.7.7","0.7.8","0.7.9",
  "0.7.10","0.7.11","0.7.12","0.7.14","0.7.15","0.7.16","0.7.20","0.7.21",
  "0.7.22","0.7.23","0.7.24","0.7.25","0.7.26", EXPECTED,
]) {
  assert(logExists(ver), `_log has ${ver}`);
  assert(changelogIndex.includes(`| ${ver} |`), `CHANGELOG index row ${ver}`);
}
assert(!/# 0\.6\.7[^\n]*-dev/.test(readLog("0.6.7")), "CHANGELOG formal 0.6.7 no -dev");
assert(!hasLogRoot || /Codex P0|增量解冻/.test(changelog), "CHANGELOG Codex P0 Chinese entry");

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
assert(/用户点名 harness-eng/.test(skillDesc), "description starts with 用户点名 (SDO triggers)");
assert(!/生成\/补齐/.test(skillDesc), "description has no workflow product list");
assert(!/施工仪式/.test(skillDesc), "description is triggers-only (no 施工仪式 summary)");
assert(!/scaffold/i.test(skillDesc), "description has no scaffold synonym");
assert(!/落地\/scaffold/.test(skillDesc), "description has no 落地/scaffold pair");
assert(/仅作触发/.test(skillDesc), "description states triggers-only in Chinese");
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
  assert(!hasLogRoot || fs.existsSync(path.join(hist, "selfcheck-0.5.1.mjs")), "_log keeps 0.5.1 selfcheck");
  assert(!hasLogRoot || fs.existsSync(path.join(hist, "selfcheck-0.4.0.mjs")), "_log keeps 0.4.0 selfcheck");
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
  !hasLogRoot ||
    fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/VERIFY-history-through-0.2.27.md")),
  "VERIFY history 0.2.27 in _log"
);
assert(
  !fs.existsSync(path.join(skillRoot, "archive/VERIFY-history-through-0.2.27.md")),
  "VERIFY 0.2.27 not in harness-eng/archive pack"
);
const verifyMd = verifyCorpus();
assert(new RegExp(`验收记录（${VER_RE}）`).test(verifyMd) && new RegExp(`当前 \\*\\*${VER_RE}\\*\\*`).test(verifyMd), `VERIFY is ${EXPECTED}`);
assert(!/当前 \*\*0\.6\.4\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.4");
assert(!/当前 \*\*0\.6\.3\*\*/.test(verifyMd), "VERIFY current pin not leftover 0.6.3");
assert(/session-dashboard/.test(verifyMd), "VERIFY mentions session-dashboard");
assert(!/## 0\.2\.18 增量验收/.test(verifyMd), "VERIFY dropped historical increment tables");

assert(
  !hasLogRoot || fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/VERIFY-history-through-0.6.0.md")),
  "VERIFY 0.6 history in _log"
);
assert(/VERIFY-history-through-0\.6\.0/.test(verifyMd), "VERIFY points to 0.6 history archive");
assert(!/_log[\/\\]/.test(verifyMd), "VERIFY purged of _log paths");
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
assert(!/当前文档按 \*\*\d+\.\d+\.\d+\*\*/.test(handbookMd), "使用手册.md Q12 no hard version pin");
assert(!/（当前 <strong>\d+\.\d+\.\d+<\/strong>）/.test(handbookHtml), "使用手册.html Q12 no hard version pin");
assert(/文首版本钉/.test(handbookMd) && /文首版本钉/.test(handbookHtml), "handbook Q12 MD↔HTML 文首版本钉");
assert(/双维护/.test(handbookMd) && /双维护/.test(handbookHtml), "handbook MD↔HTML dual-maintain wording");
assert(!/两边 `version` 当前 \*\*\d+\.\d+\.\d+\*\*/.test(readme), "README no hard dual-manifest version pin");
assert(/维护者验收/.test(readme), "README VERIFY audience label");
assert(/落地后常见产物/.test(quickstartMd), "QUICKSTART has artifacts section");
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
  !hasLogRoot || fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/OPTIMIZATION-PROPOSAL-0.2.x.md")),
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
    "--no-write",
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
      upgradeCorpus()
    ) && /fill-plan --residual/.test(upgradeCorpus()),
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
  // 0.7.35 FS-9: tmpl uses {{GATE_PROFILE}} (render defaults to strict)
  assert(
    /gate_profile:\s*"\{\{GATE_PROFILE\}\}"/.test(policyTmpl) ||
      /gate_profile:\s*strict/.test(policyTmpl),
    "score-policy tmpl strict"
  );
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
  assert(
    /gate_profile:\s*"\{\{GATE_PROFILE\}\}"/.test(policyTmpl) ||
      /gate_profile:\s*strict/.test(policyTmpl),
    "tmpl default still strict"
  );
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
  const mavenCmdsSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/maven-cmds.mjs"), "utf8");
  assert(
    /mavenCmdsForModule/.test(renderSrcA) && /mvn -f/.test(mavenCmdsSrc),
    "render Spring mvn -f branch"
  );
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
  assert(new RegExp(`→ ${VER_RE}`).test(upgradeCorpus()), `upgrade has → ${EXPECTED}`);

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
    /0\.7\.27 → 0\.7\.28/.test(upgradeCorpus()),
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
    /0\.7\.28 → 0\.7\.29/.test(upgradeCorpus()),
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
    const payload = {};
    if (extra.agent_message) payload.agent_message = extra.agent_message;
    process.stdout.write(JSON.stringify(payload));
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
    // 0.7.35: Codex also gets agent_message on stdout JSON (NEW-15 residual)
    assert(
      /"agent_message"\s*:\s*"\[api\] probe"/.test(rCodex.stdout || ""),
      "0.7.30/0.7.35 NEW-15 agent_message on stdout JSON"
    );
    const rCursor = spawnSync(process.execPath, [miniPath], {
      encoding: "utf8",
      windowsHide: true,
    });
    assert(/agent_message/.test(rCursor.stdout || ""), "0.7.30 NEW-15 Cursor still JSON stdout");
  } finally {
    fs.rmSync(tmpHook, { recursive: true, force: true });
  }

  assert(
    /0\.7\.29 → 0\.7\.30/.test(upgradeCorpus()),
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
    /0\.7\.30 → 0\.7\.31/.test(upgradeCorpus()),
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
    /0\.7\.31 → 0\.7\.32/.test(upgradeCorpus()),
    "0.7.32 upgrade.md migration section"
  );
  assert(
    /0\.7\.32 → 0\.7\.33/.test(upgradeCorpus()),
    "0.7.33 upgrade.md migration section"
  );
  assert(
    /0\.7\.33 → 0\.7\.34/.test(upgradeCorpus()),
    "0.7.34 upgrade.md migration section"
  );
  assert(
    /0\.7\.34 → 0\.7\.35/.test(upgradeCorpus()),
    "0.7.35 upgrade.md migration section"
  );
  assert(
    /0\.7\.35 → 0\.7\.36/.test(upgradeCorpus()),
    "0.7.36 upgrade.md migration section"
  );
  assert(
    /0\.7\.36 → 0\.7\.37/.test(upgradeCorpus()),
    "0.7.37 upgrade.md migration section"
  );
  assert(
    /0\.7\.37 → 0\.7\.38/.test(upgradeCorpus()),
    "0.7.38 upgrade.md migration section"
  );
  assert(
    /0\.7\.38 → 0\.7\.39/.test(upgradeCorpus()),
    "0.7.39 upgrade.md migration section"
  );
  assert(
    /0\.7\.39 → 0\.7\.40/.test(upgradeCorpus()),
    "0.7.40 upgrade.md migration section"
  );
}

// --- 0.7.33 e2e-11 P0: FS-1/FS-2 func modules · LD-1/LD-2 mysql-guard · FS-3 jobs ---
{
  // FS-1/FS-2: nested reactor discovery + meta persistence + refresh replay
  const fxFunc = path.join(skillRoot, "scripts/fixtures/nested-reactor-func");
  assert(fs.existsSync(path.join(fxFunc, "backend/pom.xml")), "0.7.33 nested-reactor-func fixture");
  const invFuncTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-033-func-"));
  try {
    // copy fixture into temp so we can write inventory/meta
    const copyDir = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        const s = path.join(src, name);
        const d = path.join(dest, name);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
      }
    };
    copyDir(fxFunc, invFuncTmp);
    const r = runNode([
      path.join(skillRoot, "scripts/fill-inventory.mjs"),
      "--domain",
      "func",
      "--root",
      invFuncTmp,
    ]);
    assert(r.status === 0 || r.status === 2, "0.7.33 FS-1 inventory-func exit ok");
    const inv = readInventoryMeta(invFuncTmp);
    assert(
      Array.isArray(inv.func?.modules) &&
        inv.func.modules.some((m) => /backend\/order-service/.test(m)),
      "0.7.33 FS-1 meta persists func.modules"
    );
    const invJson = path.join(invFuncTmp, "docs/func/.fill-work");
    const invFiles = fs.existsSync(invJson)
      ? fs.readdirSync(invJson).filter((f) => f.startsWith("inventory"))
      : [];
    assert(invFiles.length > 0, "0.7.33 FS-1 wrote func inventory file");
    let services = 0;
    for (const f of invFiles) {
      const j = JSON.parse(fs.readFileSync(path.join(invJson, f), "utf8"));
      services += j.stats?.services || 0;
    }
    assert(services >= 1, "0.7.33 FS-1 nested reactor finds services without --modules");

    // refresh argv must replay --modules
    const refreshSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/refresh.mjs"), "utf8");
    assert(
      /domain === "func"/.test(refreshSrc) && /inv\.func\?\.modules/.test(refreshSrc),
      "0.7.33 FS-1 refresh replays func modules"
    );
    writeInventoryMeta(invFuncTmp, {
      func: { modules: ["backend/order-service"] },
    });
    writeInventoryMeta(invFuncTmp, {
      api: { controller_root: "backend/order-service/src/main/java" },
    });
    const round = readInventoryMeta(invFuncTmp);
    assert(
      round.func?.modules?.includes("backend/order-service") &&
        round.api?.controller_root === "backend/order-service/src/main/java",
      "0.7.33 FS-1 meta keeps func+api after merge write"
    );
  } finally {
    fs.rmSync(invFuncTmp, { recursive: true, force: true });
  }

  // LD-1: mysql-guard target appears once for L5 SSOT and for L4+codex
  assert(
    !/id:\s*hooks-codex-mysql-guard/.test(
      fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")
    ),
    "0.7.33 LD-1 manifest has no static hooks-codex-mysql-guard"
  );
  assert(
    !/push\(\s*"hookfam-codex-mysql-guard"/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8")
    ),
    "0.7.33 LD-1 no redundant L5 mysql-guard push"
  );
  const hooksParamsBase = {
    ladder: "L5",
    ai_tools: ["cursor", "codex"],
    mcp: ["mysql"],
    hooks_family: ["commit-gate-extended", "after-edit", "stop-checklist", "mysql-guard"],
    domains: ["func", "api"],
  };
  {
    const paramsL5 = { ...hooksParamsBase, agent_config: true };
    const itemsL5 = expandHooksFamily(
      paramsL5,
      resolveAgentConfig(paramsL5),
      () => "create",
      skillRoot,
      new Set(["mysql"])
    );
    const tL5 = itemsL5.filter((i) => /mcp-mysql-guard\.js$/.test(i.target)).map((i) => i.target);
    assert(
      tL5.length === 1 && tL5[0] === "docs/agent-config/hooks/mcp-mysql-guard.js",
      `0.7.33 LD-1 L5 SSOT mysql-guard once (got ${tL5.join(",")})`
    );
    const paramsL4 = { ...hooksParamsBase, ladder: "L4", agent_config: false };
    const itemsL4 = expandHooksFamily(
      paramsL4,
      resolveAgentConfig(paramsL4),
      () => "create",
      skillRoot,
      new Set(["mysql"])
    );
    const tL4 = itemsL4.filter((i) => /mcp-mysql-guard\.js$/.test(i.target)).map((i) => i.target);
    assert(
      tL4.length === new Set(tL4).size &&
        tL4.includes(".codex/hooks/mcp-mysql-guard.js") &&
        tL4.includes(".cursor/hooks/mcp-mysql-guard.js"),
      `0.7.33 LD-1 L4+codex unique mysql-guard targets (got ${tL4.join(",")})`
    );
  }

  // LD-2: mcp=["mysql"] → mysql-local; invalid mysql- throws; meta persist
  const hookFamWithGate = ["commit-gate-extended", "mysql-guard"];
  const phMysqlEngine = buildHookPlaceholders({
    params: { mcp: ["mysql"], hooks_family: hookFamWithGate, domains: ["api"] },
    agentConfig: false,
    existing: {},
    root: null,
  });
  assert(
    /mysql-local/.test(phMysqlEngine.MYSQL_GUARD_SERVERS) &&
      /mysql-dev/.test(phMysqlEngine.MYSQL_GUARD_SERVERS),
    `0.7.36 G-mysql-guard-scope mcp=mysql → local|dev (got ${phMysqlEngine.MYSQL_GUARD_SERVERS})`
  );
  assert(
    new RegExp("^" + phMysqlEngine.MYSQL_GUARD_SERVERS + "$").test("mysql-local"),
    "0.7.36 mysql-local matches"
  );
  assert(
    new RegExp("^" + phMysqlEngine.MYSQL_GUARD_SERVERS + "$").test("mysql-dev"),
    "0.7.36 mysql-dev matches"
  );
  let threwInvalid = false;
  try {
    buildHookPlaceholders({
      params: { mysql_guard_servers: "mysql-", hooks_family: hookFamWithGate },
      agentConfig: false,
      existing: {},
      root: null,
    });
  } catch (e) {
    threwInvalid = /MYSQL_GUARD_SERVERS invalid/.test(String(e && e.message ? e.message : e));
  }
  assert(threwInvalid, "0.7.33 LD-2 rejects mysql- empty capture");
  const metaGuardTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-033-guard-"));
  try {
    const md = path.join(metaGuardTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    fs.writeFileSync(path.join(md, "harness-meta.yaml"), "skill_version: \"0.7.33\"\n", "utf8");
    writeMysqlGuardServers(metaGuardTmp, "mysql-(dev|local)");
    assert(
      readMysqlGuardServers(metaGuardTmp) === "mysql-(dev|local)",
      "0.7.33 LD-2 meta mysql_guard_servers roundtrip"
    );
    const phFromMeta = buildHookPlaceholders({
      params: { hooks_family: hookFamWithGate, domains: ["api"] },
      agentConfig: false,
      existing: {},
      root: metaGuardTmp,
    });
    assert(
      phFromMeta.MYSQL_GUARD_SERVERS === "mysql-(dev|local)",
      "0.7.33 LD-2 buildHookPlaceholders reads meta"
    );
  } finally {
    fs.rmSync(metaGuardTmp, { recursive: true, force: true });
  }

  // FS-3: *Job.java with @Scheduled counted; empty inventory merge refuses
  const fxJobs = path.join(skillRoot, "scripts/fixtures/nested-reactor-jobs");
  const jobsTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-033-jobs-"));
  try {
    const copyDir = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        const s = path.join(src, name);
        const d = path.join(dest, name);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
      }
    };
    copyDir(fxJobs, jobsTmp);
    const jr = runNode([
      path.join(skillRoot, "scripts/fill-inventory.mjs"),
      "--domain",
      "jobs",
      "--root",
      jobsTmp,
    ]);
    assert(jr.status === 0 || jr.status === 2, "0.7.33 FS-3 inventory-jobs exit ok");
    const jobsInvPath = path.join(jobsTmp, "docs/jobs/.fill-work/inventory.json");
    assert(fs.existsSync(jobsInvPath), "0.7.33 FS-3 wrote jobs inventory");
    const jobsInv = JSON.parse(fs.readFileSync(jobsInvPath, "utf8"));
    assert(
      Array.isArray(jobsInv.tasks) && jobsInv.tasks.length >= 1,
      `0.7.33 FS-3 OrderTimeoutJob → tasks>=1 (got ${jobsInv.tasks?.length})`
    );

    const emptyInv = path.join(jobsTmp, "docs/jobs/.fill-work/empty-inventory.json");
    fs.writeFileSync(emptyInv, JSON.stringify({ tasks: [] }, null, 2), "utf8");
    const emptyTarget = path.join(jobsTmp, "docs/jobs/jobs-empty.md");
    const mr = runNode([
      path.join(skillRoot, "scripts/fill-merge.mjs"),
      "--domain",
      "jobs",
      "--inventory",
      emptyInv,
      "--work-dir",
      path.join(jobsTmp, "docs/jobs/.fill-work"),
      "--target",
      emptyTarget,
      "--write",
      "--skip-acceptance",
    ]);
    assert(mr.status !== 0, "0.7.33 FS-3 empty inventory merge nonzero");
    assert(!fs.existsSync(emptyTarget), "0.7.33 FS-3 empty inventory did not write SSOT");
  } finally {
    fs.rmSync(jobsTmp, { recursive: true, force: true });
  }
}

// --- 0.7.34 e2e-11 P1: drift/stale · nested maven · JOBS_YML_RE · morph 400 · detect ---
{
  // FS-5: inventory_stale helper
  assert(
    isInventoryStale({ git_head: "aaa" }, "bbb") === true,
    "0.7.34 FS-5 mismatch is stale"
  );
  assert(
    isInventoryStale({ git_head: "abc" }, "abc") === false,
    "0.7.34 FS-5 matching head not stale"
  );
  assert(
    isInventoryStale({ keys: [] }, "abc") === true,
    "0.7.34 FS-5 missing git_head is stale"
  );

  // FS-4: redis/jobs anomaly path in fill-score source
  const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(
    /out\.redis\.anomaly\s*=\s*"covered_gt_code"/.test(scoreSrc) &&
      /out\.jobs\.anomaly\s*=\s*"covered_gt_code"/.test(scoreSrc),
    "0.7.34 FS-4 redis/jobs covered_gt_code"
  );
  assert(/detectRedisKeyDrift/.test(scoreSrc) && /detectJobsTaskDrift/.test(scoreSrc), "0.7.34 FS-4 drift wired");
  assert(/inventory_stale/.test(scoreSrc), "0.7.34 FS-5 inventory_stale blocker");

  // redis positional @Cacheable
  const redisSrc = fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-redis.mjs"), "utf8");
  assert(/positional/.test(redisSrc), "0.7.34 Cacheable positional");

  // redis drift: code key not in docs
  const driftTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-034-drift-"));
  try {
    fs.mkdirSync(path.join(driftTmp, "docs", "redis", "keys"), { recursive: true });
    fs.writeFileSync(
      path.join(driftTmp, "docs", "redis", "keys", "01-known.md"),
      "## Key 模式\n\n| `known:key` | — |\n",
      "utf8"
    );
    const rd = detectRedisKeyDrift(driftTmp, {
      keys: [
        { pattern: "known:key", redis: true },
        { pattern: "undocumented:cache", redis: true },
      ],
    });
    assert(!rd.ok && rd.blockers.length, "0.7.34 FS-4 redis key drift fires");
    const jd = detectJobsTaskDrift(driftTmp, {
      tasks: [{ task_code: "ghost-job", slug: "ghost-job" }],
    });
    assert(!jd.ok && jd.blockers.length, "0.7.34 FS-4 jobs task drift fires");
  } finally {
    fs.rmSync(driftTmp, { recursive: true, force: true });
  }

  // LD-3: nested reactor maven cmds
  const fxNest = path.join(skillRoot, "scripts/fixtures/nested-reactor-func");
  const mvn = mavenCmdsForModule(fxNest, "backend/order-service");
  assert(
    /mvn -f backend\/pom\.xml -pl order-service -am test/.test(mvn.test),
    `0.7.34 LD-3 nested reactor test cmd (got ${mvn.test})`
  );
  assert(
    !/mvn -f backend\/order-service\/pom\.xml/.test(mvn.test),
    "0.7.34 LD-3 not bare module -f"
  );

  // HK-1: JOBS_YML_RE matches application.yml
  const phJobs = buildHookPlaceholders({
    params: {
      hooks_family: ["commit-gate-extended", "after-edit"],
      domains: ["jobs"],
    },
    agentConfig: false,
    existing: {},
    root: null,
  });
  const jobsRe = new RegExp(JSON.parse(phJobs.JOBS_YML_RE));
  assert(jobsRe.test("src/main/resources/application.yml"), "0.7.34 HK-1 application.yml");
  assert(jobsRe.test("src/main/resources/application-dev.yml"), "0.7.34 HK-1 application-dev.yml");

  // FS-6: long 业务说明 still scores
  const longBiz =
    "## 业务说明\n\n" +
    "用途：" +
    "甲".repeat(480) +
    "\n\n## 字段\n\n| a | b |\n";
  const morph = morphDepthBonus(longBiz, "db");
  assert(morph.parts?.business === 10, `0.7.34 FS-6 long biz scores (got ${JSON.stringify(morph)})`);
  assert(
    !(morph.issues || []).some((i) => /业务说明偏薄/.test(i)),
    "0.7.34 FS-6 no 偏薄 on long section"
  );

  // LD-4/LD-5: code S_JOBS + Q_AGENT_CONFIG at L5
  const fxJobs2 = path.join(skillRoot, "scripts/fixtures/nested-reactor-jobs");
  const sigJobs = scanSignals(fxJobs2);
  assert(sigJobs.S_JOBS === true, "0.7.34 LD-4 S_JOBS from @Scheduled");
  assert(sigJobs.S_CODE_JOBS === true, "0.7.34 LD-4 S_CODE_JOBS");
  const qAgent = {
    id: "Q_AGENT_CONFIG",
    type: "boolean",
    recommended_when: "S_MULTI_TOOL || S_AGENT_CONFIG || ladder >= L5",
  };
  assert(
    pickRecommended(qAgent, { ladder: "L5", signals: [] }) === true,
    "0.7.34 LD-5 Q_AGENT_CONFIG true at L5"
  );
  const qYaml = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/S_CODE_API/.test(qYaml) && /S_CODE_REDIS/.test(qYaml), "0.7.34 LD-4 Q_CONTRACT S_CODE_*");
  assert(
    (qYaml.match(/recommended_when:\s*"S_MULTI_TOOL \|\| S_AGENT_CONFIG \|\| ladder >= L5"/g) || [])
      .length >= 2,
    "0.7.34 LD-5 both Q_AGENT_CONFIG recommended_when"
  );
}

// --- 0.7.35 e2e-11 P2: HK-2/3/4/5 · FS-7/8/9 · NEW-15 residual ---
{
  const renderSrc35 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/status:\s*"unchanged"/.test(renderSrc35), "0.7.35 HK-2 identical → unchanged");
  assert(
    /\.codex\/hooks\//.test(renderSrc35) && /docs\/agent-config\/hooks\//.test(renderSrc35),
    "0.7.35 HK-3 maybeChmod host hooks"
  );
  const gi = fs.readFileSync(
    path.join(skillRoot, "templates/gitignore/harness.gitignore.snippet"),
    "utf8"
  );
  assert(/\.bak-harness-\*/.test(gi), "0.7.35 HK-2 gitignore bak");

  const syncTmpl35 = fs.readFileSync(
    path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"),
    "utf8"
  );
  assert(/maybeChmodHostHook/.test(syncTmpl35), "0.7.35 HK-3 sync chmod");

  // HK-5 skill_root
  const metaTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-035-meta-"));
  try {
    const md = path.join(metaTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    fs.writeFileSync(
      path.join(md, "harness-meta.yaml"),
      'skill: harness-eng\nskill_version: "0.7.35"\n',
      "utf8"
    );
    writeSkillRoot(metaTmp, skillRoot);
    // 0.7.42: out-of-repo skill → env sentinel (was abs path in 0.7.35)
    assert(
      readSkillRoot(metaTmp) === SKILL_ROOT_ENV_SENTINEL,
      "0.7.35 HK-5 write/read skill_root (portable sentinel)"
    );
    const rsTmpl = fs.readFileSync(
      path.join(skillRoot, "templates/scripts/refresh-score.mjs.tmpl"),
      "utf8"
    );
    assert(/skillRootFromMeta/.test(rsTmpl), "0.7.35 HK-5 refresh-score reads meta");
  } finally {
    fs.rmSync(metaTmp, { recursive: true, force: true });
  }

  // HK-4 backfill
  const findTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-035-bf-"));
  try {
    const findings = path.join(findTmp, "findings.json");
    fs.writeFileSync(
      findings,
      JSON.stringify([
        "docs/api/modules/01-order.md",
        { path: "docs/db/table/01-orders.md" },
      ]),
      "utf8"
    );
    const plan = buildBackfillPlan(findings, { root: findTmp });
    assert(plan.paths.length >= 2, "0.7.35 HK-4 parses findings paths");
    assert(/WritePlan/.test(plan.markdown), "0.7.35 HK-4 WritePlan header");
    assert(/docs\/api\/modules\/01-order\.md/.test(plan.markdown), "0.7.35 HK-4 lists SSOT");
    const bf = runNode([
      path.join(skillRoot, "scripts/harness.mjs"),
      "--mode",
      "backfill",
      "--root",
      findTmp,
      "--findings",
      findings,
    ]);
    assert(bf.status === 0, "0.7.35 HK-4 harness backfill exit 0");
    assert(/WritePlan/.test(bf.stdout || ""), "0.7.35 HK-4 stdout WritePlan");
    assert(!fs.existsSync(path.join(findTmp, "docs")), "0.7.35 HK-4 no disk write");
  } finally {
    fs.rmSync(findTmp, { recursive: true, force: true });
  }

  // FS-7 frontend exclusion
  const scoreSrc35 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/isFrontendFuncDoc/.test(scoreSrc35), "0.7.35 FS-7 isFrontendFuncDoc");

  // FS-8 _change.sql + inventory order
  const mergeSrc35 = fs.readFileSync(path.join(skillRoot, "scripts/lib/merge-domain.mjs"), "utf8");
  assert(/_change\.sql/.test(mergeSrc35) && /inventory discovery order/.test(mergeSrc35), "0.7.35 FS-8 merge");

  // FS-9 gate_profile落盘
  const polTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-035-pol-"));
  try {
    const polDir = path.join(polTmp, "docs", "harness-eng");
    fs.mkdirSync(polDir, { recursive: true });
    fs.writeFileSync(
      path.join(polDir, "score-policy.yaml"),
      "gate_profile: strict\ncoverage_mode: all_domains\ncoverage_targets:\n  api: 0.8\n  func: 0.8\n",
      "utf8"
    );
    const ap = applyGateProfileToPolicyFile(polTmp, "gold");
    assert(ap.changed, "0.7.35 FS-9 apply gold changed");
    const pol = fs.readFileSync(path.join(polDir, "score-policy.yaml"), "utf8");
    assert(/gate_profile:\s*gold/.test(pol), "0.7.35 FS-9 policy is gold");
    assert(
      /gate_profile:\s*"\{\{GATE_PROFILE\}\}"/.test(
        fs.readFileSync(
          path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
          "utf8"
        )
      ),
      "0.7.35 FS-9 tmpl GATE_PROFILE"
    );
  } finally {
    fs.rmSync(polTmp, { recursive: true, force: true });
  }

  // NEW-15 residual tmpl
  const soft35 = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(
    /HOST_SOFT[\s\S]*process\.stdout\.write\(JSON\.stringify\(payload\)\)/.test(soft35),
    "0.7.35 NEW-15 soft-gate stdout JSON"
  );
  const adapter35 = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/codex-adapter.js"),
    "utf8"
  );
  assert(/merged\.agent_message/.test(adapter35), "0.7.35 NEW-15 adapter merges agent_message");

}

// --- 0.5.x suites (lib/selfcheck/checks-0.5.mjs) ---
runChecks05({ skillRoot, docPath, readDoc, assert, runNode });

// --- 0.6.x suites (lib/selfcheck/checks-0.6.mjs) ---
runChecks06({ skillRoot, docPath, readDoc, assert, runNode });

// --- 0.7.36 e2e-12 P0/P1: merge git_head · live sql_root · path/schedule drift · module-leak · LD-3 bare ---
{
  // G-api-merge-stale: merge preserves consistent git_head
  const mergeTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-036-merge-"));
  try {
    const fill = path.join(mergeTmp, "docs", "api", ".fill-work");
    fs.mkdirSync(fill, { recursive: true });
    const head = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    fs.writeFileSync(
      path.join(fill, "inventory-a.json"),
      JSON.stringify({
        git_head: head,
        module: "a",
        endpoints: [{ method: "GET", path: "/a", evidence: "a#1" }],
      }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(fill, "inventory-b.json"),
      JSON.stringify({
        git_head: head,
        module: "b",
        endpoints: [{ method: "POST", path: "/b", evidence: "b#1" }],
      }),
      "utf8"
    );
    const merged = mergeApiInventories(mergeTmp);
    assert(merged && merged.git_head === head, "0.7.36 mergeApiInventories preserves git_head");
    assert(isInventoryStale(merged, head) === false, "0.7.36 merged inventory not stale vs own head");
    assert(isInventoryStale(merged, "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb") === true, "0.7.36 merged stale on mismatch");
  } finally {
    fs.rmSync(mergeTmp, { recursive: true, force: true });
  }

  // G-db-live-sql-root: inventoryArgv replays sql_root
  const sqlArgv = inventoryArgv("db", "/tmp/x", { noWrite: true });
  assert(sqlArgv.includes("--no-write"), "0.7.36 inventoryArgv noWrite");
  const sqlMetaTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-036-sql-"));
  try {
    const md = path.join(sqlMetaTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    fs.writeFileSync(
      path.join(md, "harness-meta.yaml"),
      'skill_version: "0.7.36"\ninventory:\n  db:\n    sql_root: backend/src/main/resources/db/migration\n',
      "utf8"
    );
    writeInventoryMeta(sqlMetaTmp, {
      db: { sql_root: "backend/src/main/resources/db/migration" },
    });
    const argv = inventoryArgv("db", sqlMetaTmp, { noWrite: true });
    assert(
      argv.includes("--sql-root") &&
        argv.includes("backend/src/main/resources/db/migration"),
      `0.7.36 live/refresh argv has sql_root (got ${argv.join(" ")})`
    );
    const scoreSrc36 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
    assert(/inventoryArgv/.test(scoreSrc36), "0.7.36 fill-score liveInventoryScan uses inventoryArgv");
  } finally {
    fs.rmSync(sqlMetaTmp, { recursive: true, force: true });
  }

  // G8-like: api path drift (0.7.37: no-backtick bold-colon template form)
  const pathTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-036-path-"));
  try {
    fs.mkdirSync(path.join(pathTmp, "docs", "api", "modules"), { recursive: true });
    fs.writeFileSync(
      path.join(pathTmp, "docs", "api", "modules", "01-demo.md"),
      "## 1. list\n\n**接口地址：** /api/old\n**请求方式：** GET\n",
      "utf8"
    );
    const pd = detectApiFieldDrift(pathTmp, {
      endpoints: [{ method: "GET", path: "/api/renamed", requestFields: [] }],
    });
    assert(
      !pd.ok && pd.blockers.some((b) => /doc_path_drift:api/.test(b)),
      `0.7.36/37 api path drift fires without backticks (got ${JSON.stringify(pd.blockers)})`
    );
    fs.writeFileSync(
      path.join(pathTmp, "docs", "api", "modules", "01-demo.md"),
      "## 1. list\n\n**接口地址：** /api/renamed\n**请求方式：** GET\n",
      "utf8"
    );
    const pdOk = detectApiFieldDrift(pathTmp, {
      endpoints: [{ method: "GET", path: "/api/renamed", requestFields: [] }],
    });
    assert(
      !pdOk.blockers.some((b) => /doc_path_drift:api/.test(b)),
      `0.7.37 matching bold-colon path must not doc_path_drift (got ${JSON.stringify(pdOk.blockers)})`
    );
  } finally {
    fs.rmSync(pathTmp, { recursive: true, force: true });
  }

  // G8-like: jobs schedule drift (truths_dir = docs/jobs/tasks)
  const schedTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-036-sched-"));
  try {
    fs.mkdirSync(path.join(schedTmp, "docs", "jobs", "tasks"), { recursive: true });
    fs.writeFileSync(
      path.join(schedTmp, "docs", "jobs", "tasks", "01-close.md"),
      "# close-stale\n\ntask_code: close-stale-resolved\ncron: 0 0 * * *\n",
      "utf8"
    );
    const sd = detectJobsTaskDrift(schedTmp, {
      tasks: [
        {
          task_code: "close-stale-resolved",
          scheduler: { method: "run", fixedRate: "86400000" },
        },
      ],
    });
    assert(
      !sd.ok && sd.blockers.some((b) => /doc_schedule_drift:jobs/.test(b)),
      `0.7.36 jobs schedule drift fires (got ${JSON.stringify(sd.blockers)})`
    );
  } finally {
    fs.rmSync(schedTmp, { recursive: true, force: true });
  }

  // LD-3: bare module name resolves nested reactor
  const fxNest36 = path.join(skillRoot, "scripts/fixtures/nested-reactor-func");
  const mvnBare = mavenCmdsForModule(fxNest36, "order-service");
  assert(
    /mvn -f backend\/pom\.xml -pl order-service -am test/.test(mvnBare.test),
    `0.7.36 LD-3 bare leaf resolves nested (got ${mvnBare.test})`
  );

  // G-api-module-leak: module mode returns null (source guard)
  const apiSrc36 = fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-api.mjs"), "utf8");
  assert(
    /G-api-module-leak|must not fall back to other modules/.test(apiSrc36),
    "0.7.36 G-api-module-leak no root fallback in module mode"
  );

  // G-redis-false-KEY: Cache class / colon KEY promote
  const redisSrc36 = fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-redis.mjs"), "utf8");
  assert(
    /class\s+\\w\*Cache|G-redis-false-KEY/.test(redisSrc36),
    "0.7.36 redis Cache neighborhood / KEY promote"
  );
}

// --- 0.7.37 e2e-13: bold-colon path · root Maven prefill · cold live inventory · func narrow ---
{
  const driftSrc37 = fs.readFileSync(path.join(skillRoot, "scripts/lib/field-drift.mjs"), "utf8");
  assert(
    /接口地址\[：:\]\?\\\*\\\*\[：:\]\?/.test(driftSrc37) ||
      /\\\*\\\*接口地址\[：:\]\?\\\*\\\*/.test(driftSrc37),
    "0.7.37 collectDocApiPaths accepts bold-colon"
  );

  const fxNest37 = path.join(skillRoot, "scripts/fixtures/nested-reactor-func");
  const prefill = collectCommandPrefill(fxNest37, {
    moduleDirs: ["backend/order-service"],
  });
  assert(
    prefill.rows.some((r) =>
      /mvn -f backend\/pom\.xml -pl order-service -am test/.test(r.cmd)
    ),
    `0.7.37 root prefill nested reactor (got ${JSON.stringify(prefill.rows)})`
  );
  assert(
    !prefill.rows.some((r) => /mvn -f backend\/order-service\/pom\.xml/.test(r.cmd)),
    "0.7.37 prefill must not use leaf module pom -f"
  );
  assert(
    !prefill.rows.some((r) => /spring-boot:run/.test(r.cmd)),
    "0.7.37 prefill no spring-boot:run without Boot app"
  );

  const scoreSrc37 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(
    /liveInventorySatisfies|0\.7\.37 cold-fill-work/.test(scoreSrc37),
    "0.7.37 fill-score live satisfies missing_inventory"
  );

  const funcSrc37 = fs.readFileSync(path.join(skillRoot, "scripts/lib/inventory-func.mjs"), "utf8");
  assert(/FS-func-noise|entity\|mapper\|job/.test(funcSrc37), "0.7.37 inventory-func FS-func-noise filter");
  assert(
    !/\/\\\/service\\\/\/i\.test\(p\.replace/.test(funcSrc37),
    "0.7.37 inventory-func dropped bare /service/ walk"
  );

  const domYaml37 = fs.readFileSync(path.join(skillRoot, "templates/_meta/domains.yaml"), "utf8");
  assert(
    /Service\(Impl\)\?.*java\$\//.test(domYaml37),
    "0.7.37 domains.yaml func hook_code narrowed to Service.java"
  );
  assert(
    !/func:[\s\S]*?hook_code:\s*\["\\\/\\\/service\\\/\//.test(domYaml37),
    "0.7.37 no bare /\\/service\\// func hook"
  );

  // func inventory: entity under service/ must not count
  const funcTmp37 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-037-func-"));
  try {
    const javaBase = path.join(
      funcTmp37,
      "backend",
      "demo",
      "src",
      "main",
      "java",
      "com",
      "x"
    );
    fs.mkdirSync(path.join(javaBase, "service", "entity"), { recursive: true });
    fs.mkdirSync(path.join(funcTmp37, "backend"), { recursive: true });
    fs.writeFileSync(
      path.join(funcTmp37, "backend", "pom.xml"),
      "<project><modules><module>demo</module></modules></project>\n",
      "utf8"
    );
    fs.writeFileSync(path.join(funcTmp37, "backend", "demo", "pom.xml"), "<project/>\n", "utf8");
    fs.writeFileSync(
      path.join(javaBase, "service", "entity", "Appointment.java"),
      "package com.x.service.entity;\npublic class Appointment {}\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(javaBase, "service", "AppointmentService.java"),
      "package com.x.service;\nimport org.springframework.stereotype.Service;\n@Service\npublic class AppointmentService {}\n",
      "utf8"
    );
    const invOut = spawnSync(
      process.execPath,
      [
        path.join(skillRoot, "scripts/fill-inventory.mjs"),
        "--domain",
        "func",
        "--root",
        funcTmp37,
        "--modules",
        "backend/demo",
        "--no-write",
      ],
      { encoding: "utf8", cwd: skillRoot, windowsHide: true }
    );
    assert(invOut.status === 0 || invOut.status === 2, `0.7.37 func inventory exit (got ${invOut.status}): ${invOut.stderr}`);
    const out = String(invOut.stdout || "");
    const i = out.indexOf("{");
    const j = out.lastIndexOf("}");
    const report = JSON.parse(out.slice(i, j + 1));
    const services = (report.modules || []).flatMap((m) => m.services || []);
    assert(
      services.some((s) => s.class === "AppointmentService") &&
        !services.some((s) => s.class === "Appointment"),
      `0.7.37 func inventory excludes entity (got ${JSON.stringify(services.map((s) => s.class))})`
    );
  } finally {
    fs.rmSync(funcTmp37, { recursive: true, force: true });
  }
}

// --- 0.7.38 e2e-14 P0: cold memory git_head · db live drift · upgrade-diff ---
{
  const memTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-038-mem-"));
  try {
    const javaDir = path.join(memTmp, "src", "main", "java", "com", "x");
    fs.mkdirSync(javaDir, { recursive: true });
    fs.writeFileSync(
      path.join(javaDir, "DemoController.java"),
      [
        "package com.x;",
        "import org.springframework.web.bind.annotation.*;",
        "@RestController",
        "public class DemoController {",
        "  @GetMapping(\"/api/demo\")",
        "  public String demo() { return \"ok\"; }",
        "}",
        "",
      ].join("\n"),
      "utf8"
    );
    const git = (args) =>
      spawnSync("git", args, { cwd: memTmp, encoding: "utf8", windowsHide: true });
    assert(git(["init"]).status === 0, "0.7.38 mem fixture git init");
    git(["add", "-A"]);
    const commit = git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-m", "t"]);
    assert(commit.status === 0, `0.7.38 mem fixture git commit: ${commit.stderr}`);
    const mem = scanApiInventoryMemory(memTmp);
    const head = readGitHead(memTmp);
    assert(mem && mem.git_head, `0.7.38 scanApiInventoryMemory stamps git_head (got ${JSON.stringify(mem && mem.git_head)})`);
    assert(head && mem.git_head === head, "0.7.38 memory git_head matches HEAD");
    assert(isInventoryStale(mem, head) === false, "0.7.38 memory inventory not stale vs HEAD");
  } finally {
    fs.rmSync(memTmp, { recursive: true, force: true });
  }

  const driftTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-038-db-"));
  try {
    const tableDir = path.join(driftTmp, "docs", "db", "table");
    fs.mkdirSync(tableDir, { recursive: true });
    fs.writeFileSync(
      path.join(tableDir, "01-t_foo.md"),
      [
        "表名：`t_foo`",
        "",
        "## 字段",
        "",
        "| 字段名 | 类型 |",
        "|---|---|",
        "| id | bigint |",
        "",
      ].join("\n"),
      "utf8"
    );
    const empty = detectDbFieldDrift(driftTmp);
    assert(empty.ok === true, "0.7.38 detectDbFieldDrift no inv → ok");
    const live = {
      tables: [
        {
          name: "t_foo",
          columns: [{ name: "id" }, { name: "new_col" }],
        },
      ],
    };
    const disk = {
      tables: [{ name: "t_foo", columns: [{ name: "id" }] }],
    };
    const liveDrift = detectDbFieldDrift(driftTmp, live);
    assert(
      !liveDrift.ok && liveDrift.blockers.some((b) => /doc_field_drift:t_foo:new_col/.test(b)),
      `0.7.38 live db drift (got ${JSON.stringify(liveDrift.blockers)})`
    );
    const diskOnly = detectDbFieldDrift(driftTmp, disk);
    assert(
      diskOnly.ok,
      "0.7.38 disk inv without new_col must not invent live columns"
    );
  } finally {
    fs.rmSync(driftTmp, { recursive: true, force: true });
  }

  const d = diffBlockers(["a", "b"], ["b", "c"]);
  assert(
    d.added.join(",") === "c" && d.removed.join(",") === "a" && d.unchanged.join(",") === "b",
    `0.7.38 diffBlockers (got ${JSON.stringify(d)})`
  );
  const harnessSrc38 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /emitUpgradeStrictnessDiff/.test(harnessSrc38) &&
      /upgrade-diff/.test(harnessSrc38),
    "0.7.38 harness wires upgrade-diff"
  );
  const upMd38 = upgradeCorpus();
  assert(
    /upgrade-diff\.json/.test(upMd38) && /不自动改用户文档/.test(upMd38),
    "0.7.38 upgrade.md documents upgrade-diff"
  );
}

// --- 0.7.39 e2e-14 P1: wrappers · score-latest default · portable skill_root ---
{
  const wrapTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-039-wrap-"));
  try {
    const kb = path.join(wrapTmp, "scripts", "agent-kb");
    fs.mkdirSync(kb, { recursive: true });
    fs.writeFileSync(path.join(kb, "fill-score-ready.mjs"), "export {}\n", "utf8");
    fs.writeFileSync(path.join(kb, "cold-bootstrap-inventory.mjs"), "export {}\n", "utf8");
    fs.writeFileSync(
      path.join(kb, "refresh-score.mjs"),
      "/* inventory_stale fill-score-ready --inventory */\n",
      "utf8"
    );
    const found = findObsoleteWrappers(wrapTmp);
    assert(
      found.retire.includes("scripts/agent-kb/fill-score-ready.mjs") &&
        found.retire.includes("scripts/agent-kb/cold-bootstrap-inventory.mjs"),
      `0.7.39 findObsoleteWrappers retire (got ${JSON.stringify(found)})`
    );
    assert(found.refreshStale.includes("scripts/agent-kb/refresh-score.mjs"), "0.7.39 stale refresh-score flagged");
    const { moved } = retireObsoleteWrappers(wrapTmp);
    assert(moved.length === 2, `0.7.39 retire moved 2 (got ${JSON.stringify(moved)})`);
    assert(
      !fs.existsSync(path.join(kb, "fill-score-ready.mjs")) &&
        fs.existsSync(path.join(kb, "_obsolete", "fill-score-ready.mjs")) &&
        fs.existsSync(path.join(kb, "refresh-score.mjs")),
      "0.7.39 retire moves wrappers, keeps refresh-score"
    );
  } finally {
    fs.rmSync(wrapTmp, { recursive: true, force: true });
  }

  const scoreSrc39 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/score-latest\.json/.test(scoreSrc39) && /noWrite|--no-write/.test(scoreSrc39), "0.7.39 fill-score default score-latest / --no-write");
  const upDiff39 = fs.readFileSync(path.join(skillRoot, "scripts/lib/upgrade-diff.mjs"), "utf8");
  assert(/--no-write/.test(upDiff39), "0.7.39 upgrade-diff fill-score --no-write");
  const harnessSrc39 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /retire-wrappers|retireWrappers/.test(harnessSrc39) && /warnObsoleteWrappers/.test(harnessSrc39),
    "0.7.39 harness wires obsolete-wrappers"
  );

  const scoreTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-039-score-"));
  try {
    fs.mkdirSync(path.join(scoreTmp, "docs", "harness-eng"), { recursive: true });
    const runScore = (extra) =>
      spawnSync(
        process.execPath,
        [path.join(skillRoot, "scripts/fill-score.mjs"), "--root", scoreTmp, "--json", ...extra],
        { encoding: "utf8", cwd: skillRoot, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }
      );
    const latest = path.join(scoreTmp, "docs", "harness-eng", "score-latest.json");
    const r0 = runScore(["--no-write"]);
    assert(!fs.existsSync(latest), `0.7.39 --no-write skips score-latest (status=${r0.status})`);
    const r1 = runScore([]);
    assert(fs.existsSync(latest), `0.7.39 default writes score-latest (status=${r1.status} stderr=${String(r1.stderr || "").slice(0, 200)})`);
  } finally {
    fs.rmSync(scoreTmp, { recursive: true, force: true });
  }

  const relTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-039-rel-"));
  try {
    const nested = path.join(relTmp, "vendor", "harness-eng", "scripts");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "harness.mjs"), "// nested skill\n", "utf8");
    const md = path.join(relTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    fs.writeFileSync(path.join(md, "harness-meta.yaml"), 'skill: harness-eng\nskill_version: "0.7.39"\n', "utf8");
    writeSkillRoot(relTmp, path.join(relTmp, "vendor", "harness-eng"));
    assert(readSkillRoot(relTmp) === "vendor/harness-eng", `0.7.39 write relative skill_root (got ${readSkillRoot(relTmp)})`);
    assert(
      resolveSkillRoot(relTmp) === path.resolve(relTmp, "vendor/harness-eng"),
      "0.7.39 resolveSkillRoot relative"
    );
    const envDir = fs.mkdtempSync(path.join(os.tmpdir(), "harness-039-env-"));
    fs.mkdirSync(path.join(envDir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(envDir, "scripts", "harness.mjs"), "// env skill\n", "utf8");
    const prev = process.env.HARNESS_ENG_ROOT;
    process.env.HARNESS_ENG_ROOT = envDir;
    try {
      assert(resolveSkillRoot(relTmp) === path.resolve(envDir), "0.7.39 resolveSkillRoot prefers HARNESS_ENG_ROOT");
    } finally {
      if (prev == null) delete process.env.HARNESS_ENG_ROOT;
      else process.env.HARNESS_ENG_ROOT = prev;
      fs.rmSync(envDir, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(relTmp, { recursive: true, force: true });
  }

  const rsTmpl39 = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/refresh-score.mjs.tmpl"),
    "utf8"
  );
  assert(/path\.resolve\(repoRoot,\s*v\)/.test(rsTmpl39), "0.7.39 refresh-score resolves meta vs repoRoot");
}

// --- 0.7.40 e2e-14 P2: last_mode noop · db.md 维护约定 · MCP example warn · multi-batch hash ---
{
  const renderSrc40 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/merged === cur/.test(renderSrc40) && /status = "noop"/.test(renderSrc40), "0.7.40 render yaml-keys noop");

  const baseMeta = [
    "skill: harness-eng",
    'skill_version: "0.7.40"',
    "last_mode: land",
    "ladder: L2",
    "",
  ].join("\n");
  const incomingUp = [
    "skill: harness-eng",
    'skill_version: "0.7.40"',
    "last_mode: upgrade",
    "ladder: L2",
    "",
  ].join("\n");
  const once = mergeYamlMaps(baseMeta, incomingUp);
  const twice = mergeYamlMaps(once, incomingUp);
  assert(once === twice, "0.7.40 mergeYamlMaps second upgrade identical");
  assert(/last_mode:\s*upgrade/.test(once), "0.7.40 first merge updates last_mode");

  const incomingRe = incomingUp.replace("last_mode: upgrade", "last_mode: resume");
  let meta = baseMeta;
  const hash = (s) => createHash("sha256").update(s).digest("hex");
  const scoreTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-040-rf-"));
  try {
    fs.mkdirSync(path.join(scoreTmp, "docs", "harness-eng"), { recursive: true });
    const rf = spawnSync(
      process.execPath,
      [path.join(skillRoot, "scripts/fill-score.mjs"), "--root", scoreTmp, "--json", "--no-write"],
      { encoding: "utf8", cwd: skillRoot, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }
    );
    assert(rf.status === 0, `0.7.40 refresh-semantics fill-score --no-write (status=${rf.status})`);
    meta = mergeYamlMaps(meta, incomingRe);
    meta = mergeYamlMaps(meta, incomingUp);
    const h1 = hash(meta);
    const rf2 = spawnSync(
      process.execPath,
      [path.join(skillRoot, "scripts/fill-score.mjs"), "--root", scoreTmp, "--json", "--no-write"],
      { encoding: "utf8", cwd: skillRoot, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }
    );
    assert(rf2.status === 0, "0.7.40 second fill-score --no-write");
    meta = mergeYamlMaps(meta, incomingRe);
    meta = mergeYamlMaps(meta, incomingUp);
    assert(hash(meta) === h1, "0.7.40 interleaved rf→re→up ×2 meta hash stable");
  } finally {
    fs.rmSync(scoreTmp, { recursive: true, force: true });
  }

  const dbTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-040-db-"));
  try {
    const dbMd = path.join(dbTmp, "docs", "db", "db.md");
    fs.mkdirSync(path.dirname(dbMd), { recursive: true });
    fs.writeFileSync(dbMd, "# 索引\n\n用户索引勿动\n", "utf8");
    const r1 = ensureDbMdMaintenance(dbTmp, skillRoot);
    assert(r1.appended && /维护约定/.test(fs.readFileSync(dbMd, "utf8")), "0.7.40 append db.md 维护约定");
    assert(/用户索引勿动/.test(fs.readFileSync(dbMd, "utf8")), "0.7.40 db.md keeps user index");
    const r2 = ensureDbMdMaintenance(dbTmp, skillRoot);
    assert(!r2.appended, "0.7.40 db.md append idempotent");
    const hints = warnManualReplaceGaps(dbTmp, { error() {} });
    assert(!hints.some((h) => /维护约定/.test(h)), "0.7.40 warnManualReplaceGaps silent after append");
  } finally {
    fs.rmSync(dbTmp, { recursive: true, force: true });
  }

  const mcpTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-040-mcp-"));
  try {
    fs.mkdirSync(path.join(mcpTmp, ".cursor"), { recursive: true });
    fs.mkdirSync(path.join(mcpTmp, "docs", "harness-eng"), { recursive: true });
    fs.writeFileSync(
      path.join(mcpTmp, ".cursor", "mcp.json.example"),
      JSON.stringify({ mcpServers: { "mysql-test-example": { command: "npx" } } }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(mcpTmp, ".cursor", "mcp.json"),
      JSON.stringify({ mcpServers: { "mysql-dev": { command: "npx" } } }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(mcpTmp, "docs", "harness-eng", "harness-meta.yaml"),
      "fill_mcp_profile: test\n",
      "utf8"
    );
    const w = warnMcpExampleProfile(mcpTmp, { error() {} });
    assert(w.warned, `0.7.40 MCP example vs live warn (got ${JSON.stringify(w)})`);
  } finally {
    fs.rmSync(mcpTmp, { recursive: true, force: true });
  }

  const harnessSrc40 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /ensureDbMdMaintenance/.test(harnessSrc40) && /warnMcpExampleProfile/.test(harnessSrc40),
    "0.7.40 harness wires db.md + mcp warn"
  );
}

// --- 0.7.41 e2e-15 P0: upgrade-diff skill_version SSOT · doc_todos handoff ---
{
  const upDiff41 = fs.readFileSync(path.join(skillRoot, "scripts/lib/upgrade-diff.mjs"), "utf8");
  assert(/readSkillVersion/.test(upDiff41), "0.7.41 upgrade-diff uses readSkillVersion");
  assert(
    !/skill_version:\s*"0\.7\.38"/.test(upDiff41),
    "0.7.41 upgrade-diff no hardcoded skill_version 0.7.38"
  );
  assert(/buildDocTodos/.test(upDiff41) && /doc_todos/.test(upDiff41), "0.7.41 upgrade-diff doc_todos");

  const todos = buildDocTodos([
    "coverage_ready",
    "inventory_undercount:covered_gt_code",
    "doc_task_drift:foo",
    "doc_path_drift:/x",
    "doc_field_drift:orders:priority",
    "weird_new_blocker",
  ]);
  assert(todos.length >= 3, `0.7.41 buildDocTodos non-empty (got ${todos.length})`);
  assert(todos.some((t) => /coverage|covered_gt/.test(t)), "0.7.41 buildDocTodos coverage hint");
  assert(todos.some((t) => /jobs|doc_task/.test(t)), "0.7.41 buildDocTodos jobs hint");
  assert(todos.some((t) => /weird_new_blocker/.test(t)), "0.7.41 buildDocTodos unknown fallback");

  const dryTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-041-updiff-"));
  try {
    fs.mkdirSync(path.join(dryTmp, "docs", "harness-eng"), { recursive: true });
    const dry = emitUpgradeStrictnessDiff(dryTmp, { dryRun: true });
    assert(dry.skill_version === EXPECTED, `0.7.41 dry-run skill_version === ${EXPECTED} (got ${dry.skill_version})`);
  } finally {
    fs.rmSync(dryTmp, { recursive: true, force: true });
  }

  const upMd41 = upgradeCorpus();
  assert(
    /## 0\.7\.40 → 0\.7\.41/.test(upMd41) && /doc_todos/.test(upMd41),
    "0.7.41 upgrade.md migration section"
  );
  assert(logExists("0.7.41"), "0.7.41 _log note exists");
}

// --- 0.7.42 e2e-15 P1: portable skill_root sentinel · DDL type-width normalize ---
{
  const absTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-042-abs-"));
  try {
    const md = path.join(absTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    const metaPath = path.join(md, "harness-meta.yaml");
    fs.writeFileSync(metaPath, 'skill: harness-eng\nskill_version: "0.7.42"\n', "utf8");
    writeSkillRoot(absTmp, skillRoot);
    assert(
      readSkillRoot(absTmp) === SKILL_ROOT_ENV_SENTINEL,
      `0.7.42 out-of-repo skill_root sentinel (got ${readSkillRoot(absTmp)})`
    );
    const before = fs.readFileSync(metaPath, "utf8");
    const mtime1 = fs.statSync(metaPath).mtimeMs;
    writeSkillRoot(absTmp, skillRoot);
    assert(fs.readFileSync(metaPath, "utf8") === before, "0.7.42 writeSkillRoot noop when unchanged");
    assert(fs.statSync(metaPath).mtimeMs === mtime1, "0.7.42 writeSkillRoot skips disk when unchanged");

    const prev = process.env.HARNESS_ENG_ROOT;
    delete process.env.HARNESS_ENG_ROOT;
    try {
      assert(resolveSkillRoot(absTmp) == null, "0.7.42 sentinel alone → resolve null");
      process.env.HARNESS_ENG_ROOT = skillRoot;
      assert(
        resolveSkillRoot(absTmp) === path.resolve(skillRoot),
        "0.7.42 resolveSkillRoot via HARNESS_ENG_ROOT"
      );
    } finally {
      if (prev == null) delete process.env.HARNESS_ENG_ROOT;
      else process.env.HARNESS_ENG_ROOT = prev;
    }
  } finally {
    fs.rmSync(absTmp, { recursive: true, force: true });
  }

  assert(
    normalizeDdlForCompare("CREATE TABLE t(id int(11), name varchar(64))") ===
      normalizeDdlForCompare("CREATE TABLE t(id int, name varchar(255))"),
    "0.7.42 normalize strips int/varchar widths"
  );
  assert(
    normalizeDdlForCompare("CREATE TABLE t(id int, name varchar(64))") !==
      normalizeDdlForCompare("CREATE TABLE t(id int, other varchar(64))"),
    "0.7.42 normalize still detects column rename"
  );

  const rsTmpl42 = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/refresh-score.mjs.tmpl"),
    "utf8"
  );
  assert(/env:HARNESS_ENG_ROOT/.test(rsTmpl42), "0.7.42 refresh-score skips env sentinel");

  const upMd42 = upgradeCorpus();
  assert(/## 0\.7\.41 → 0\.7\.42/.test(upMd42), "0.7.42 upgrade.md migration section");
  assert(logExists("0.7.42"), "0.7.42 _log note exists");
}

// --- 0.7.43 e2e-15 P2: last_mode×3 · wrappers warn · multi-batch score→re→up ---
{
  const wrapSrc43 = fs.readFileSync(path.join(skillRoot, "scripts/lib/obsolete-wrappers.mjs"), "utf8");
  assert(/【旧仓升级】/.test(wrapSrc43), "0.7.43 obsolete-wrappers 【旧仓升级】 warn");
  assert(/标准入口仍是 refresh-score/.test(wrapSrc43) || /是标准入口，勿删/.test(wrapSrc43), "0.7.43 refresh-score standard entry");

  const wrapTmp43 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-043-wrap-"));
  try {
    const kb = path.join(wrapTmp43, "scripts", "agent-kb");
    fs.mkdirSync(kb, { recursive: true });
    fs.writeFileSync(path.join(kb, "fill-score-ready.mjs"), "export {}\n", "utf8");
    const errs = [];
    const prevErr = console.error;
    console.error = (...a) => errs.push(a.join(" "));
    try {
      warnObsoleteWrappers(wrapTmp43);
    } finally {
      console.error = prevErr;
    }
    assert(errs.some((e) => /【旧仓升级】/.test(e)), `0.7.43 warn stderr 【旧仓升级】 (got ${JSON.stringify(errs)})`);
  } finally {
    fs.rmSync(wrapTmp43, { recursive: true, force: true });
  }

  const baseMeta43 = [
    "skill: harness-eng",
    'skill_version: "0.7.43"',
    "last_mode: land",
    "ladder: L2",
    "",
  ].join("\n");
  const incomingUp43 = [
    "skill: harness-eng",
    'skill_version: "0.7.43"',
    "last_mode: upgrade",
    "ladder: L2",
    "",
  ].join("\n");
  const once43 = mergeYamlMaps(baseMeta43, incomingUp43);
  let thrice43 = once43;
  thrice43 = mergeYamlMaps(thrice43, incomingUp43);
  thrice43 = mergeYamlMaps(thrice43, incomingUp43);
  assert(once43 === thrice43, "0.7.43 upgrade×3 meta byte-identical");

  const incomingRe43 = incomingUp43.replace("last_mode: upgrade", "last_mode: resume");
  const batchTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-043-batch-"));
  try {
    fs.mkdirSync(path.join(batchTmp, "docs", "harness-eng"), { recursive: true });
    const runBatch = (metaIn) => {
      let meta = metaIn;
      const rf = spawnSync(
        process.execPath,
        [path.join(skillRoot, "scripts/fill-score.mjs"), "--root", batchTmp, "--json", "--no-write"],
        { encoding: "utf8", cwd: skillRoot, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }
      );
      assert(rf.status === 0, `0.7.43 score --no-write (status=${rf.status})`);
      meta = mergeYamlMaps(meta, incomingRe43);
      meta = mergeYamlMaps(meta, incomingUp43);
      return meta;
    };
    const m1 = runBatch(baseMeta43);
    const h1 = hashHarnessMetaText(m1);
    const m2 = runBatch(m1);
    assert(
      compareHarnessMetaStable(m1, m2).equal,
      "0.7.43 (score→re→up)×2 strip-last_mode hash stable"
    );
    assert(hashHarnessMetaText(m2) === h1, "0.7.43 meta-stable hash helper matches");
    assert(/last_mode:\s*upgrade/.test(m2), "0.7.43 batch ends with last_mode upgrade");
  } finally {
    fs.rmSync(batchTmp, { recursive: true, force: true });
  }

  const upMd43 = upgradeCorpus();
  assert(/## 0\.7\.42 → 0\.7\.43/.test(upMd43), "0.7.43 upgrade.md migration section");
  assert(/【旧仓升级】/.test(upMd43) && /CI 可忽略/.test(upMd43), "0.7.43 upgrade.md last_mode + wrappers notes");
  assert(logExists("0.7.43"), "0.7.43 _log note exists");
}

// --- 0.7.44 e2e-16 P1: default migrate-docs · structural patches · opt-out ---
{
  assert(resolveMigrateDocsMode({}) === "auto", "0.7.44 default migrateDocs mode auto");
  assert(resolveMigrateDocsMode({ migrateDocs: "off" }) === "off", "0.7.44 migrateDocs off");
  assert(resolveMigrateDocsMode({ migrateDocs: "dry-run" }) === "dry-run", "0.7.44 migrateDocs dry-run");

  const harnessSrc44 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /--no-migrate-docs/.test(harnessSrc44) && /migrateDocs/.test(harnessSrc44),
    "0.7.44 harness wires --no-migrate-docs"
  );
  assert(/--migrate-docs/.test(harnessSrc44), "0.7.44 harness help migrate-docs");

  // api path rewrite
  const pathMig = fs.mkdtempSync(path.join(os.tmpdir(), "harness-044-path-"));
  try {
    fs.mkdirSync(path.join(pathMig, "docs", "api", "modules"), { recursive: true });
    fs.writeFileSync(
      path.join(pathMig, "docs", "api", "modules", "01-demo.md"),
      "## 1. list\n\n**接口地址：** /api/old\n**请求方式：** GET\n",
      "utf8"
    );
    const inv = { endpoints: [{ method: "GET", path: "/api/renamed", http: "GET", requestFields: [] }] };
    const before = detectApiFieldDrift(pathMig, inv);
    assert(
      !before.ok && before.blockers.some((b) => /doc_path_drift/.test(b)),
      `0.7.44 pre-migrate path drift (got ${JSON.stringify(before.blockers)})`
    );
    const plan = planMigrateDocs(pathMig, {
      blockers: before.blockers,
      inventories: { api: inv },
    });
    assert(plan.ops.some((o) => o.kind === "api_rewrite_path"), "0.7.44 plan api_rewrite_path");
    const applied = applyMigrateDocs(pathMig, plan, { dryRun: false });
    assert(applied.applied.length >= 1, "0.7.44 apply path migrate");
    const after = detectApiFieldDrift(pathMig, inv);
    assert(
      !after.blockers.some((b) => /doc_path_drift/.test(b)),
      `0.7.44 post-migrate no path drift (got ${JSON.stringify(after.blockers)})`
    );
  } finally {
    fs.rmSync(pathMig, { recursive: true, force: true });
  }

  // db field append
  const dbMig = fs.mkdtempSync(path.join(os.tmpdir(), "harness-044-db-"));
  try {
    const tableDir = path.join(dbMig, "docs", "db", "table");
    fs.mkdirSync(tableDir, { recursive: true });
    fs.writeFileSync(
      path.join(tableDir, "01-t_foo.md"),
      ["表名：`t_foo`", "", "## 字段", "", "| 字段名 | 类型 |", "|---|---|", "| id | bigint |", ""].join("\n"),
      "utf8"
    );
    const live = { tables: [{ name: "t_foo", columns: [{ name: "id" }, { name: "new_col" }] }] };
    const d0 = detectDbFieldDrift(dbMig, live);
    assert(d0.blockers.some((b) => /new_col/.test(b)), "0.7.44 pre-migrate db field drift");
    const r = runMigrateDocs(dbMig, {
      mode: "auto",
      blockers: d0.blockers,
      inventories: { db: live },
    });
    assert(r.applied.some((a) => a.kind === "db_append_fields"), "0.7.44 db_append_fields applied");
    const d1 = detectDbFieldDrift(dbMig, live);
    assert(d1.ok, `0.7.44 post-migrate db drift cleared (got ${JSON.stringify(d1.blockers)})`);
  } finally {
    fs.rmSync(dbMig, { recursive: true, force: true });
  }

  // jobs schedule append
  const jobMig = fs.mkdtempSync(path.join(os.tmpdir(), "harness-044-job-"));
  try {
    fs.mkdirSync(path.join(jobMig, "docs", "jobs", "tasks"), { recursive: true });
    fs.writeFileSync(
      path.join(jobMig, "docs", "jobs", "tasks", "01-close.md"),
      "# close-stale\n\ntask_code: close-stale-resolved\ncron: 0 0 * * *\n",
      "utf8"
    );
    const jinv = {
      tasks: [
        {
          task_code: "close-stale-resolved",
          scheduler: { method: "run", fixedRate: "86400000" },
        },
      ],
    };
    const s0 = detectJobsTaskDrift(jobMig, jinv);
    assert(s0.blockers.some((b) => /doc_schedule_drift/.test(b)), "0.7.44 pre-migrate schedule drift");
    runMigrateDocs(jobMig, { mode: "auto", blockers: s0.blockers, inventories: { jobs: jinv } });
    const s1 = detectJobsTaskDrift(jobMig, jinv);
    assert(
      !s1.blockers.some((b) => /doc_schedule_drift/.test(b)),
      `0.7.44 post-migrate schedule cleared (got ${JSON.stringify(s1.blockers)})`
    );
  } finally {
    fs.rmSync(jobMig, { recursive: true, force: true });
  }

  // covered_gt never deletes docs
  const covMig = fs.mkdtempSync(path.join(os.tmpdir(), "harness-044-cov-"));
  try {
    const apiDir = path.join(covMig, "docs", "api", "modules");
    fs.mkdirSync(apiDir, { recursive: true });
    const keep = path.join(apiDir, "01-keep.md");
    fs.writeFileSync(keep, "## 1. keep\n\n**接口地址：** /api/keep\n", "utf8");
    const mtime1 = fs.statSync(keep).mtimeMs;
    const plan = planMigrateDocs(covMig, {
      blockers: ["coverage_ready", "inventory_undercount:covered_gt_code"],
      inventories: { api: { endpoints: [] } },
    });
    assert(plan.ops.length === 0, "0.7.44 coverage blockers produce no structural ops");
    assert(plan.skipped.length >= 1, "0.7.44 coverage skipped handoff");
    applyMigrateDocs(covMig, plan, { dryRun: false });
    assert(fs.existsSync(keep), "0.7.44 covered_gt must not delete docs");
    assert(fs.statSync(keep).mtimeMs === mtime1, "0.7.44 covered_gt must not rewrite docs");
  } finally {
    fs.rmSync(covMig, { recursive: true, force: true });
  }

  const upMd44 = upgradeCorpus();
  assert(/## 0\.7\.43 → 0\.7\.44/.test(upMd44), "0.7.44 upgrade.md migration section");
  assert(/migrate-docs|migrate_docs|--no-migrate-docs/.test(upMd44), "0.7.44 upgrade.md migrate-docs notes");
  assert(/migrate-policy/.test(upMd44) && /真相文档/.test(upMd44), "0.7.44 distinguishes migrate-policy vs migrate-docs");
  assert(logExists("0.7.44"), "0.7.44 _log note exists");
  const verify44 = verifyCorpus();
  assert(/## 0\.7\.44 增量验收/.test(verify44), "0.7.44 VERIFY section");
}

// --- 0.7.45 e2e-17 P2: meta-stable CI · wrappers UX · calibrate style warn ---
{
  const resumeMeta = [
    "skill: harness-eng",
    `skill_version: "${EXPECTED}"`,
    "last_mode: resume",
    "ladder: L2",
    "",
  ].join("\n");
  const upgradeMeta = resumeMeta.replace("last_mode: resume", "last_mode: upgrade");
  assert(
    compareHarnessMetaStable(resumeMeta, upgradeMeta).equal,
    "0.7.45 resume↔upgrade only last_mode → stable equal"
  );
  assert(
    stripYamlKeys(resumeMeta).includes("ladder") && !/last_mode/.test(stripYamlKeys(resumeMeta)),
    "0.7.45 stripYamlKeys drops last_mode"
  );

  const metaCliTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-045-meta-"));
  try {
    const md = path.join(metaCliTmp, "docs", "harness-eng");
    fs.mkdirSync(md, { recursive: true });
    const metaPath = path.join(md, "harness-meta.yaml");
    fs.writeFileSync(metaPath, upgradeMeta, "utf8");
    const basePath = path.join(metaCliTmp, "baseline.yaml");
    fs.writeFileSync(basePath, resumeMeta, "utf8");
    const chk = runMetaStableCheck(metaCliTmp, { baseline: basePath });
    assert(chk.status === 0 && chk.report.equal === true, "0.7.45 runMetaStableCheck baseline OK");
    const cli = spawnSync(
      process.execPath,
      [
        path.join(skillRoot, "scripts/harness.mjs"),
        "--check-meta-stable",
        "--root",
        metaCliTmp,
        "--baseline",
        basePath,
      ],
      { encoding: "utf8", windowsHide: true }
    );
    assert(cli.status === 0, `0.7.45 harness --check-meta-stable exit 0 (got ${cli.status})`);
    const broken = resumeMeta.replace("ladder: L2", "ladder: L3");
    fs.writeFileSync(basePath, broken, "utf8");
    const chkFail = runMetaStableCheck(metaCliTmp, { baseline: basePath });
    assert(chkFail.status === 1, "0.7.45 meta-stable fails on ladder drift");
  } finally {
    fs.rmSync(metaCliTmp, { recursive: true, force: true });
  }

  const wrapTmp45 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-045-wrap-"));
  try {
    const kb = path.join(wrapTmp45, "scripts", "agent-kb");
    fs.mkdirSync(kb, { recursive: true });
    fs.writeFileSync(path.join(kb, "fill-score-ready.mjs"), "export {}\n", "utf8");
    fs.writeFileSync(path.join(kb, "refresh-score.mjs"), "export {}\n", "utf8");
    const errs = [];
    const prevErr = console.error;
    console.error = (...a) => errs.push(a.join(" "));
    try {
      warnObsoleteWrappers(wrapTmp45);
    } finally {
      console.error = prevErr;
    }
    assert(
      errs.some((e) => /退役命令（可复制）/.test(e) && /--retire-wrappers/.test(e)),
      `0.7.45 wrappers warn copyable retire cmd (got ${JSON.stringify(errs)})`
    );
    assert(errs.some((e) => /HARNESS_RETIRE_WRAPPERS/.test(e)), "0.7.45 wrappers warn mentions env");
    const prevEnv = process.env.HARNESS_RETIRE_WRAPPERS;
    process.env.HARNESS_RETIRE_WRAPPERS = "1";
    try {
      // harness helper path: retire via env when calling maybe through retireObsoleteWrappers directly
      const moved = retireObsoleteWrappers(wrapTmp45);
      assert(moved.moved.length >= 1, "0.7.45 retire wrappers moves files");
      assert(
        fs.existsSync(path.join(kb, "refresh-score.mjs")),
        "0.7.45 refresh-score never retired"
      );
      assert(
        !fs.existsSync(path.join(kb, "fill-score-ready.mjs")),
        "0.7.45 fill-score-ready retired"
      );
    } finally {
      if (prevEnv == null) delete process.env.HARNESS_RETIRE_WRAPPERS;
      else process.env.HARNESS_RETIRE_WRAPPERS = prevEnv;
    }
  } finally {
    fs.rmSync(wrapTmp45, { recursive: true, force: true });
  }

  // also assert harness wires env retire
  const harnessSrc45 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /HARNESS_RETIRE_WRAPPERS/.test(harnessSrc45) && /check-meta-stable|checkMetaStable/.test(harnessSrc45),
    "0.7.45 harness wires env retire + check-meta-stable"
  );

  assert(
    classifyDdlDiff(
      "CREATE TABLE t(id int(11) unsigned) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
      "CREATE TABLE t(id int) CHARACTER SET utf8"
    ) === "equal" ||
      classifyDdlDiff(
        "CREATE TABLE t(id int(11) unsigned) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE t(id int) CHARACTER SET utf8"
      ) === "style",
    "0.7.45 width+charset(+unsigned) is equal or style"
  );
  // After normalize, unsigned stripped and widths stripped — should be equal
  assert(
    normalizeDdlForCompare(
      "CREATE TABLE t(id int(11) unsigned) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ) === normalizeDdlForCompare("CREATE TABLE t(id int) CHARACTER SET utf8"),
    "0.7.45 normalize strips charset/unsigned/width"
  );
  assert(
    classifyDdlDiff(
      "CREATE TABLE t(id int, name varchar(64))",
      "CREATE TABLE t(id int, name varchar(255) CHARACTER SET utf8mb4)"
    ) === "equal" ||
      classifyDdlDiff(
        "CREATE TABLE t(id int, name varchar(64))",
        "CREATE TABLE t(id int, name varchar(255) CHARACTER SET utf8mb4)"
      ) === "style",
    "0.7.45 varchar width+charset not structural"
  );
  assert(
    classifyDdlDiff(
      "CREATE TABLE t(id int, name varchar(64))",
      "CREATE TABLE t(id int, other varchar(64))"
    ) === "structural",
    "0.7.45 column rename is structural"
  );
  assert(
    structuralDdlFingerprint("CREATE TABLE t(id int, name varchar(64))") ===
      structuralDdlFingerprint("CREATE TABLE t(id int(11), name varchar(255))"),
    "0.7.45 structural fingerprint ignores widths"
  );

  const upMd45 = upgradeCorpus();
  assert(/## 0\.7\.44 → 0\.7\.45/.test(upMd45), "0.7.45 upgrade.md migration section");
  assert(/check-meta-stable/.test(upMd45), "0.7.45 upgrade.md meta-stable");
  assert(/HARNESS_RETIRE_WRAPPERS|refresh-score/.test(upMd45), "0.7.45 upgrade.md wrappers UX");
  assert(logExists("0.7.45"), "0.7.45 _log note exists");
  const verify45 = verifyCorpus();
  assert(/## 0\.7\.45 增量验收/.test(verify45), "0.7.45 VERIFY section");
}

// --- 0.7.46 e2e-18 P3: docs DX · flag disambiguation · historical handoff note ---
{
  const upMd46 = upgradeCorpus();
  assert(/## 旗标消歧/.test(upMd46), "0.7.46 upgrade.md 旗标消歧 section");
  assert(
    /migrate-docs/.test(upMd46) && /migrate-policy/.test(upMd46) && /check-meta-stable/.test(upMd46),
    "0.7.46 upgrade disambiguates three flags"
  );
  assert(
    /## 0\.7\.40 → 0\.7\.41/.test(upMd46) &&
      /0\.7\.44\+/.test(upMd46) &&
      /历史口径|当时行为/.test(upMd46),
    "0.7.46 upgrade 0.7.41 section marks historical handoff"
  );
  assert(/accepted residual/.test(upMd46), "0.7.46 upgrade marks last_mode accepted residual");
  assert(/## 0\.7\.45 → 0\.7\.46/.test(upMd46), "0.7.46 upgrade.md migration section");

  const gloss46 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/migrate-docs/.test(gloss46) && /migrate-policy/.test(gloss46), "0.7.46 glossary migrate flags");
  assert(/accepted residual/.test(gloss46) && /last_mode/.test(gloss46), "0.7.46 glossary last_mode residual");
  assert(/check-meta-stable/.test(gloss46), "0.7.46 glossary check-meta-stable");

  const idx46 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(
    /migrate-docs/.test(idx46) && /migrate-policy|check-meta-stable/.test(idx46),
    "0.7.46 AGENT-INDEX upgrade flags"
  );

  const qs46 = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  assert(
    /check-meta-stable/.test(qs46) && /migrate-docs/.test(qs46) && /migrate-policy/.test(qs46),
    "0.7.46 QUICKSTART CLI disambiguation"
  );

  const fillScore46 = fs.readFileSync(path.join(skillRoot, "fill/fill-score.md"), "utf8");
  assert(
    /migrate-policy/.test(fillScore46) && /migrate-docs/.test(fillScore46),
    "0.7.46 fill-score cross-links migrate-docs"
  );

  const verify46 = verifyCorpus();
  assert(/## 0\.7\.46 增量验收/.test(verify46), "0.7.46 VERIFY section");
  assert(
    /## 0\.7\.41 增量验收[\s\S]*?历史/.test(verify46),
    "0.7.46 VERIFY 0.7.41 row notes historical"
  );
  assert(logExists("0.7.46"), "0.7.46 _log note exists");
}

// --- 0.7.47 e2e-19: coverage append-only · longjump / cold fixtures ---
{
  assert(normalizeCoverageMode(undefined) === "off", "0.7.47 coverageMode default off");
  assert(normalizeCoverageMode("append") === "append", "0.7.47 coverageMode append");
  assert(normalizeCoverageMode("dry-run") === "dry-run", "0.7.47 coverageMode dry-run");
  assert(resolveCoverageMode({}) === "off", "0.7.47 resolveCoverageMode default off");
  assert(
    resolveCoverageMode({ dryRun: true }) === "off",
    "0.7.47 dry-run without coverage flag stays off"
  );

  const harnessSrc47 = fs.readFileSync(path.join(skillRoot, "scripts/harness.mjs"), "utf8");
  assert(
    /migrateCoverage:\s*"off"/.test(harnessSrc47) && /--migrate-coverage/.test(harnessSrc47),
    "0.7.47 harness defaults --migrate-coverage off"
  );

  const offRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cov-off-"));
  try {
    const inv = { api: { endpoints: [{ method: "GET", path: "/api/demo", http: "GET" }] } };
    const off = runMigrateDocs(offRoot, {
      mode: "off",
      coverageMode: "off",
      blockers: ["coverage_ready"],
      inventories: inv,
    });
    assert(
      (off.coverage_ops || []).length === 0 &&
        (off.coverage_skipped || []).some((s) => /migrate-coverage off/.test(s.reason)),
      "0.7.47 coverage_ready skipped when coverageMode=off"
    );
    assert(
      !fs.existsSync(path.join(offRoot, "docs", "api", "modules")),
      "0.7.47 default off does not create api page"
    );
  } finally {
    fs.rmSync(offRoot, { recursive: true, force: true });
  }

  const pageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cov-page-"));
  try {
    const inv = { api: { endpoints: [{ method: "GET", path: "/api/demo", http: "GET" }] } };
    const planned = planCoverageAppend({
      blockers: ["coverage_ready"],
      inventories: inv,
      docsRoot: pageRoot,
    });
    assert(
      planned.ops.length === 1 && planned.ops[0].kind === "coverage_append_page",
      `0.7.47 missing api page → one coverage_append_page (got ${JSON.stringify(planned.ops.map((o) => o.kind))})`
    );
    assert(
      /TODO\(harness-eng\) migrate-coverage/.test(planned.ops[0].content || ""),
      "0.7.47 coverage skeleton tagged migrate-coverage"
    );
    const applied = runMigrateDocs(pageRoot, {
      mode: "off",
      coverageMode: "append",
      blockers: ["coverage_ready"],
      inventories: inv,
    });
    assert(
      (applied.coverage_applied || []).some((a) => a.action === "created"),
      "0.7.47 append writes missing page"
    );
    const pages = fs.readdirSync(path.join(pageRoot, "docs", "api", "modules")).filter((n) => n.endsWith(".md"));
    assert(pages.length === 1, "0.7.47 exactly one api coverage page");
  } finally {
    fs.rmSync(pageRoot, { recursive: true, force: true });
  }

  const gtRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cov-gt-"));
  try {
    const apiDir = path.join(gtRoot, "docs", "api", "modules");
    fs.mkdirSync(apiDir, { recursive: true });
    const keep = path.join(apiDir, "01-keep.md");
    fs.writeFileSync(keep, "## 1. keep\n\n**接口地址：** /api/keep\n这是业务说明，不要删。\n", "utf8");
    const mtime1 = fs.statSync(keep).mtimeMs;
    const gt = planCoverageAppend({
      blockers: ["inventory_undercount:covered_gt_code"],
      inventories: { api: { endpoints: [{ method: "GET", path: "/api/extra", http: "GET" }] } },
      docsRoot: gtRoot,
    });
    assert(gt.ops.length === 0, "0.7.47 covered_gt produces zero ops");
    assert(gt.skipped.length >= 1, "0.7.47 covered_gt skipped");
    assert(
      !gt.ops.some((o) => /delete|trim|unlink/i.test(o.kind)),
      "0.7.47 covered_gt never produces delete ops"
    );
    const both = planCoverageAppend({
      blockers: ["coverage_ready", "inventory_undercount:covered_gt_code"],
      inventories: { api: { endpoints: [{ method: "GET", path: "/api/extra", http: "GET" }] } },
      docsRoot: gtRoot,
    });
    assert(
      !both.ops.some((o) => /delete|trim|unlink/i.test(String(o.kind))),
      "0.7.47 coverage plan has no delete kind"
    );
    assert(
      both.skipped.some((s) => /user content present/.test(s.reason)),
      "0.7.47 user content present skips append"
    );
    assert(
      both.skipped.some((s) => /never delete/.test(s.reason)),
      "0.7.47 covered_gt still skipped beside coverage_ready"
    );
    applyMigrateDocs(gtRoot, { ops: both.ops, skipped: both.skipped }, { dryRun: false });
    assert(fs.existsSync(keep), "0.7.47 covered_gt must not delete docs");
    assert(fs.statSync(keep).mtimeMs === mtime1, "0.7.47 user doc not rewritten");
  } finally {
    fs.rmSync(gtRoot, { recursive: true, force: true });
  }

  const dryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cov-dry-"));
  try {
    const inv = { api: { endpoints: [{ method: "GET", path: "/api/demo", http: "GET" }] } };
    const dry = runMigrateDocs(dryRoot, {
      mode: "dry-run",
      coverageMode: "dry-run",
      blockers: ["coverage_ready"],
      inventories: inv,
    });
    assert((dry.coverage_ops || []).length >= 1, "0.7.47 dry-run lists coverage_ops");
    const reportPath = path.join(dryRoot, "docs", "harness-eng", "migrate-docs-report.json");
    assert(fs.existsSync(reportPath), "0.7.47 dry-run writes migrate-docs-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert(
      Array.isArray(report.coverage_ops) && report.coverage_ops.length >= 1,
      "0.7.47 report.coverage_ops"
    );
    assert(
      Array.isArray(report.coverage_skipped),
      "0.7.47 report.coverage_skipped"
    );
    const dryMods = path.join(dryRoot, "docs", "api", "modules");
    const dryMds = fs.existsSync(dryMods)
      ? fs.readdirSync(dryMods).filter((n) => n.endsWith(".md"))
      : [];
    assert(dryMds.length === 0, "0.7.47 dry-run does not write api page");
  } finally {
    fs.rmSync(dryRoot, { recursive: true, force: true });
  }

  const stubRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cov-stub-"));
  try {
    const stubDir = path.join(stubRoot, "docs", "api", "modules");
    fs.mkdirSync(stubDir, { recursive: true });
    fs.writeFileSync(
      path.join(stubDir, "01-stub.md"),
      "# stub\n\nTODO(harness-eng)\n",
      "utf8"
    );
    const stubPlan = planCoverageAppend({
      blockers: ["coverage_ready"],
      inventories: { api: { endpoints: [{ method: "POST", path: "/api/stub", http: "POST" }] } },
      docsRoot: stubRoot,
    });
    assert(
      stubPlan.ops.length === 1 && stubPlan.ops[0].kind === "coverage_append_section",
      `0.7.47 stub → coverage_append_section (got ${JSON.stringify(stubPlan.ops.map((o) => o.kind))})`
    );
  } finally {
    fs.rmSync(stubRoot, { recursive: true, force: true });
  }

  const upMd47 = upgradeCorpus();
  assert(/## 0\.7\.46 → 0\.7\.47/.test(upMd47), "0.7.47 upgrade.md migration section");
  assert(/--migrate-coverage/.test(upMd47), "0.7.47 upgrade.md migrate-coverage row");
  const gloss47 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/migrate-coverage/.test(gloss47) && /默认 off/.test(gloss47), "0.7.47 glossary migrate-coverage");
  assert(
    /migrate-coverage/.test(fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8")),
    "0.7.47 AGENT-INDEX migrate-coverage"
  );
  assert(
    /migrate-coverage/.test(fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8")),
    "0.7.47 QUICKSTART migrate-coverage"
  );
  assert(
    /migrate-coverage/.test(fs.readFileSync(path.join(skillRoot, "fill/fill-score.md"), "utf8")),
    "0.7.47 fill-score cross-links migrate-coverage"
  );
  assert(logExists("0.7.47"), "0.7.47 _log note exists");
  assert(
    /## 0\.7\.47 增量验收/.test(verifyCorpus()),
    "0.7.47 VERIFY section"
  );
  assert(
    !hasLogRoot ||
      fs.existsSync(path.resolve(skillRoot, "../_log/harness-eng/docs/e2e-19-verify.md")),
    "0.7.47 e2e-19-verify record exists"
  );

  function hasFillWork(root) {
    const docs = path.join(root, "docs");
    if (!fs.existsSync(docs)) return false;
    const stack = [docs];
    while (stack.length) {
      const d = stack.pop();
      for (const n of fs.readdirSync(d)) {
        const p = path.join(d, n);
        if (n === ".fill-work") return true;
        let st;
        try {
          st = fs.statSync(p);
        } catch {
          continue;
        }
        if (st.isDirectory()) stack.push(p);
      }
    }
    return false;
  }

  const longSrc = path.join(skillRoot, "scripts/fixtures/e2e-19-longjump");
  const longTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-long-"));
  const longParams = path.join(os.tmpdir(), `harness-047-long-params-${process.pid}.json`);
  try {
    fs.cpSync(longSrc, longTmp, { recursive: true });
    fs.writeFileSync(
      longParams,
      JSON.stringify({
        on_exists: "skip",
        placeholders: {},
        files: [
          {
            id: "noop",
            target: "docs/harness-eng/harness-meta.yaml",
            action: "skip",
          },
        ],
      }),
      "utf8"
    );
    const up = spawnSync(
      process.execPath,
      [
        path.join(skillRoot, "scripts/harness.mjs"),
        "--mode",
        "upgrade",
        "--root",
        longTmp,
        "--params",
        longParams,
        "--migrate-docs=auto",
      ],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, windowsHide: true }
    );
    assert(
      up.status === 0,
      `0.7.47 longjump migrate-docs upgrade exit 0 (got ${up.status}): ${(up.stderr || "").slice(-500)}`
    );
    const migReportPath = path.join(longTmp, "docs", "harness-eng", "migrate-docs-report.json");
    const diffPath = path.join(longTmp, "docs", "harness-eng", "upgrade-diff.json");
    assert(fs.existsSync(migReportPath), "0.7.47 longjump migrate-docs-report.json");
    assert(fs.existsSync(diffPath), "0.7.47 longjump upgrade-diff.json");
    const migReport = JSON.parse(fs.readFileSync(migReportPath, "utf8"));
    const opsN = (migReport.ops || migReport.plan?.ops || []).length;
    assert(opsN >= 1, `0.7.47 longjump migrate-docs ops >= 1 (got ${opsN})`);
    const diff = JSON.parse(fs.readFileSync(diffPath, "utf8"));
    assert(
      diff.skill_version === EXPECTED,
      `0.7.47 longjump skill_version === manifest (got ${diff.skill_version})`
    );
    assert(
      !diff.migrate_coverage || diff.migrate_coverage.mode === "off",
      "0.7.47 longjump default migrate-coverage off"
    );
    const demo = fs.readFileSync(path.join(longTmp, "docs", "api", "modules", "01-demo.md"), "utf8");
    assert(/\/api\/renamed/.test(demo), "0.7.47 longjump rewrote drifted api path");
  } finally {
    fs.rmSync(longTmp, { recursive: true, force: true });
    fs.rmSync(longParams, { force: true });
  }

  const coldSrc = path.join(skillRoot, "scripts/fixtures/e2e-19-cold");
  const coldTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-047-cold-"));
  try {
    fs.cpSync(coldSrc, coldTmp, { recursive: true });
    assert(!hasFillWork(coldTmp), "0.7.47 cold fixture has no fill-work");
    const git = (args) =>
      spawnSync("git", args, { cwd: coldTmp, encoding: "utf8", windowsHide: true });
    assert(git(["init"]).status === 0, "0.7.47 cold git init");
    git(["add", "-A"]);
    const commit = git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-m", "cold"]);
    assert(commit.status === 0, `0.7.47 cold git commit: ${commit.stderr}`);
    const mem = scanApiInventoryMemory(coldTmp);
    const head = readGitHead(coldTmp);
    assert(mem && mem.git_head && mem.git_head === head, "0.7.47 cold memory inventory git_head");
    assert((mem.endpoints || []).length >= 1, "0.7.47 cold memory inventory has endpoints");
    const scored = spawnSync(
      process.execPath,
      [path.join(skillRoot, "scripts/fill-score.mjs"), "--root", coldTmp, "--json"],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, windowsHide: true }
    );
    assert(scored.status === 0 || scored.status === 2, `0.7.47 cold fill-score exit (got ${scored.status}) ${(scored.stderr || "").slice(-300)}`);
    const raw = String(scored.stdout || "");
    const i = raw.indexOf("{");
    const j = raw.lastIndexOf("}");
    const report = JSON.parse(raw.slice(i, j + 1));
    const stale = report.inventory_stale || [];
    const ready = report.ready?.ok === true || report.ai_coding_ready?.ok === true;
    assert(
      ready || !stale.includes("api"),
      `0.7.47 cold stock ready or inventory_stale excludes api (stale=${JSON.stringify(stale)} ready=${ready})`
    );
    assert(!hasFillWork(coldTmp), "0.7.47 cold stock fill-score does not create fill-work");
  } finally {
    fs.rmSync(coldTmp, { recursive: true, force: true });
  }
}

// --- 0.7.48 thick-repo harden: migrate-docs dry-run · CREATE fields · fence | · mature_compat ---
{
  assert(
    resolveMigrateDocsMode({ thickTruths: true }) === "dry-run",
    "0.7.48 thickTruths default migrateDocs dry-run"
  );
  assert(
    resolveMigrateDocsMode({ thickTruths: true, migrateDocs: "auto" }) === "auto",
    "0.7.48 explicit auto overrides thickTruths"
  );
  assert(resolveMigrateDocsMode({}) === "auto", "0.7.48 thin/unset still auto");

  // ## 字段说明 must not steal; CREATE TABLE fallback
  const mdField说明 = [
    "## 字段说明",
    "",
    "业务备注一堆文字",
    "",
    "## 建表语句",
    "",
    "```sql",
    "CREATE TABLE t_foo (",
    "  id bigint NOT NULL,",
    "  name varchar(64),",
    "  PRIMARY KEY (id),",
    "  KEY idx_name (name)",
    ");",
    "```",
    "",
  ].join("\n");
  const fromCreate = parseDocFieldNames(mdField说明);
  assert(
    fromCreate.map((x) => x.toLowerCase()).includes("id") &&
      fromCreate.map((x) => x.toLowerCase()).includes("name") &&
      !fromCreate.some((x) => /primary|idx_/i.test(x)),
    `0.7.48 CREATE fallback fields (got ${JSON.stringify(fromCreate)})`
  );
  assert(
    parseDocCreateFieldNames(mdField说明).length >= 2,
    "0.7.48 parseDocCreateFieldNames"
  );
  assert(docCreateCoversColumns(mdField说明, ["id", "name"]), "0.7.48 docCreateCoversColumns");

  assert(normalizeScheduleToken("${app.cron:0 0 * * *}") === "0 0 * * *", "0.7.48 cron placeholder normalize");
  assert(isNoisePattern("会话不存在或已过期"), "0.7.48 redis CJK noise");
  assert(isNoisePattern("script/rate_limit.lua"), "0.7.48 redis lua noise");
  assert(!isNoisePattern("SMS:login:token:"), "0.7.48 real redis key kept");

  // schedule drift: docs with resolved cron match ${prop:default}
  const jobsSched = fs.mkdtempSync(path.join(os.tmpdir(), "harness-048-sched-"));
  try {
    fs.mkdirSync(path.join(jobsSched, "docs", "jobs"), { recursive: true });
    fs.writeFileSync(
      path.join(jobsSched, "docs", "jobs", "01-task.md"),
      "task_code: clean-job\n\ncron: `0 0 * * *`\n",
      "utf8"
    );
    const inv = {
      tasks: [
        {
          task_code: "clean-job",
          scheduler: { cron: "${jobs.clean:0 0 * * *}" },
        },
      ],
    };
    const drift = detectJobsTaskDrift(jobsSched, inv);
    assert(
      drift.ok || !drift.blockers.some((b) => /doc_schedule_drift/.test(b)),
      `0.7.48 schedule normalize no false drift (blockers=${JSON.stringify(drift.blockers)})`
    );
  } finally {
    fs.rmSync(jobsSched, { recursive: true, force: true });
  }

  // acceptance: fenced JSON with `|` must not poison a real param table
  const accFence = fs.mkdtempSync(path.join(os.tmpdir(), "harness-048-acc-"));
  try {
    fs.mkdirSync(path.join(accFence, "docs", "api", "modules"), { recursive: true });
    fs.writeFileSync(
      path.join(accFence, "docs", "api", "modules", "01-demo.md"),
      [
        "## 1. demo",
        "",
        "**接口地址：** `/api/demo`",
        "**请求方式：** POST",
        "**功能描述：** demo",
        "**evidence：** FooController#demo",
        "",
        "### 功能逻辑",
        "",
        "- 校验入参",
        "- 调用 Service 返回",
        "",
        "### 请求参数",
        "",
        "| 参数名 | 类型 | 必填 | 说明 | 示例值 |",
        "|---|---|---|---|---|",
        "| id | long | 是 | 主键 | `1` |",
        "",
        "```json",
        '{ "pipe": "a|b|c", "note": "|not|a|table|" }',
        "```",
        "",
        "### 响应参数",
        "",
        "无参数",
        "",
      ].join("\n"),
      "utf8"
    );
    const acc = spawnSync(
      process.execPath,
      [path.join(skillRoot, "scripts/acceptance-check.mjs"), "--root", accFence],
      { encoding: "utf8", windowsHide: true }
    );
    const out = `${acc.stdout || ""}\n${acc.stderr || ""}`;
    assert(
      !/api-empty-examples/.test(out),
      `0.7.48 fence | not api-empty-examples (out=${out.slice(0, 500)})`
    );
  } finally {
    fs.rmSync(accFence, { recursive: true, force: true });
  }

  // mature_compat: gate active, no gold coverage force, drift not in profile defaults
  const mc = { gate: {}, coverage_targets: { api: 0.8 } };
  reapplyGateProfile(mc, "mature_compat", {});
  assert(mc.gate_profile === "mature_compat", "0.7.48 mature_compat profile set");
  assert(mc.gate.morph_floor === 75, "0.7.48 mature_compat morph_floor 75");
  assert(mc.gate.acceptance_warnings_max === 0, "0.7.48 mature_compat warnings_max 0");
  assert(mc.coverage_targets.api === 0.8, "0.7.48 mature_compat keeps coverage target");
  assert(
    applyMatureCompatGateDefaults({}).morph_floor === 75,
    "0.7.48 applyMatureCompatGateDefaults"
  );

  // pickApiDocForPath prefers path prefix over first file
  const indexed = [
    { file: "/a/01-auth.md", paths: new Set(["/api/auth/login"]), slug: "auth" },
    { file: "/a/02-neo4j.md", paths: new Set(["/api/graph/node"]), slug: "neo4j" },
  ];
  assert(
    pickApiDocForPath("/api/graph/edge", indexed) === "/a/02-neo4j.md",
    "0.7.48 pickApiDocForPath prefix"
  );
  assert(pickApiDocForPath("/api/unknown/x", indexed) == null, "0.7.48 pickApiDoc unmatched null");

  // thick truths detect
  const thickTmp = fs.mkdtempSync(path.join(os.tmpdir(), "harness-048-thick-"));
  try {
    fs.mkdirSync(path.join(thickTmp, "docs", "db", "table"), { recursive: true });
    fs.writeFileSync(
      path.join(thickTmp, "docs", "db", "table", "01-t_foo.md"),
      "## 建表语句\n\n```sql\nCREATE TABLE t_foo (id int);\n```\n",
      "utf8"
    );
    assert(detectThickTruths(thickTmp) === true, "0.7.48 detectThickTruths");
  } finally {
    fs.rmSync(thickTmp, { recursive: true, force: true });
  }

  // manual_sql maintenance block
  const dbMaint = fs.mkdtempSync(path.join(os.tmpdir(), "harness-048-dbm-"));
  try {
    fs.mkdirSync(path.join(dbMaint, "docs", "db"), { recursive: true });
    fs.writeFileSync(
      path.join(dbMaint, "docs", "db", "db.md"),
      "# 索引\n\n| 表名 | 路径 |\n|---|---|\n| t | table/01.md |\n",
      "utf8"
    );
    assert(detectDbMigrationMode(dbMaint) === "manual_sql", "0.7.48 detectDbMigrationMode default");
    const r = ensureDbMdMaintenance(dbMaint, skillRoot);
    assert(r.appended && r.mode === "manual_sql", "0.7.48 ensureDbMdMaintenance manual_sql");
    const body = fs.readFileSync(path.join(dbMaint, "docs", "db", "db.md"), "utf8");
    assert(/manual_sql/.test(body) && !/\bnone\b/.test(body.split("维护约定")[1] || ""), "0.7.48 maint no literal none");
    assert(/DDL|人工按序/.test(body), "0.7.48 maint mentions DDL or 人工");
  } finally {
    fs.rmSync(dbMaint, { recursive: true, force: true });
  }

  const scoreSrc48 = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(/inventory-mode|inventoryMode/.test(scoreSrc48), "0.7.48 fill-score inventory-mode");
  assert(/score-latest\.prev\.json/.test(scoreSrc48), "0.7.48 score-latest.prev backup");
  assert(/mature_compat/.test(scoreSrc48), "0.7.48 fill-score mature_compat");

  const upMd48 = upgradeCorpus();
  assert(/0\.7\.48|厚仓|dry-run/.test(upMd48), "0.7.48 upgrade.md notes");
  assert(logExists("0.7.48"), "0.7.48 _log note exists");
}

// --- 0.7.52: full fix train pins ---
{
  assert(/isCliMain/.test(fs.readFileSync(path.join(skillRoot, "scripts/questions-next.mjs"), "utf8")), "0.7.52 questions-next isCliMain");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/_meta/RENDER-REGISTRIES.md")),
    "0.7.52 RENDER-REGISTRIES.md"
  );
  assert(!fs.existsSync(path.join(skillRoot, "scripts/lib/merge-truth.mjs")), "0.7.52 merge-truth orphan gone");
  assert(!fs.existsSync(path.join(skillRoot, "docs/harness-eng/score-latest.json")), "0.7.52 no packaged score-latest");
  const fillScoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
  assert(!/skill_patch:\s*"0\.2\.16"/.test(fillScoreSrc), "0.7.52 dropped skill_patch 0.2.16");
  assert(/mature_compat/.test(fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8")), "0.7.52 mature_compat in questions");
  assert(/pipeline-awaits-confirm/.test(fs.readFileSync(path.join(skillRoot, "evals/eval.yaml"), "utf8")), "0.7.52 eval pipeline case");
  assert(/session-live-no-pretend/.test(fs.readFileSync(path.join(skillRoot, "evals/eval.yaml"), "utf8")), "0.7.52 eval session-live case");
  assert(/confirm-then-write-intent/.test(fs.readFileSync(path.join(skillRoot, "evals/eval.yaml"), "utf8")), "0.7.52 eval confirm-write case");
  assert(/## 0\.7\.51 → 0\.7\.52/.test(upgradeCorpus()), "0.7.52 upgrade migration section");
  assert(logExists("0.7.52"), "0.7.52 _log note exists");
}

// --- 0.7.51: SQL migration naming dual-track (sms-ai §4.7 v3.54 reflux) ---
{
  const softGate50 = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(
    /MIGRATION_OLD_NAME_RE_SRC = \{\{MIGRATION_OLD_NAME_RE\}\}/.test(softGate50),
    "0.7.51 soft-gate has MIGRATION_OLD_NAME_RE placeholder"
  );
  assert(
    /MIGRATION_OLD_NAME_RE_SRC == null \? null : new RegExp/.test(softGate50),
    "0.7.51 soft-gate old-RE null fallback (single-track)"
  );
  assert(
    /status !== "A" && status !== "R"/.test(softGate50) && /存量旧格式/.test(softGate50),
    "0.7.51 soft-gate naming checks A/R with old-format branch"
  );
  const hooksChecks50 = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/hooks-checks.mjs"),
    "utf8"
  );
  assert(
    /migration_old_name_re/.test(hooksChecks50) && /hook_old_name_re/.test(hooksChecks50),
    "0.7.51 hooks-checks injects migration_old_name_re"
  );
  const domains50 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/hook_old_name_re: ""/.test(domains50), "0.7.51 domains.yaml db.hook_old_name_re");
  const manifest50 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/manifest.yaml"),
    "utf8"
  );
  assert(
    /MIGRATION_OLD_NAME_RE/.test(manifest50) &&
      /MIGRATION_DIR_REL/.test(manifest50) &&
      /MIGRATION_TZ/.test(manifest50),
    "0.7.51 manifest placeholders OLD_NAME_RE / DIR_REL / TZ"
  );
  assert(
    /id: migration-naming-lib/.test(manifest50) && /id: new-migration-py/.test(manifest50),
    "0.7.51 manifest packs migration-naming-lib + new-migration-py"
  );
  const rule13 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/13-db-doc-sync.mdc.tmpl"),
    "utf8"
  );
  assert(
    /当前最高号 \/ 最新时间戳/.test(rule13) && /migration_old_name_re/.test(rule13),
    "0.7.51 rule 13 max-version ban + dual-track note"
  );
  const dbMd50 = fs.readFileSync(
    path.join(skillRoot, "templates/docs/db/db.md.tmpl"),
    "utf8"
  );
  assert(
    /版本号账本纪律/.test(dbMd50) && /migration_old_name_re/.test(dbMd50),
    "0.7.51 db.md.tmpl version-ledger discipline"
  );
  const migNaming = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/migration_naming.py.tmpl"),
    "utf8"
  );
  assert(
    /\{\{MIGRATION_DIR_REL\}\}/.test(migNaming) && /\{\{MIGRATION_TZ\}\}/.test(migNaming),
    "0.7.51 migration_naming.py.tmpl placeholders"
  );
  assert(/bool\(OLD_RE and/.test(migNaming), "0.7.51 migration_naming.py.tmpl OLD_RE None-safe");
  const newMig = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/new_migration.py.tmpl"),
    "utf8"
  );
  assert(/--pair/.test(newMig) && /from migration_naming import/.test(newMig), "0.7.51 new_migration.py.tmpl CLI");
  const render50 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(
    /MIGRATION_DIR_REL/.test(render50) && /MIGRATION_TZ/.test(render50),
    "0.7.51 render.mjs defaults for generator pack"
  );
  const q50 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/migration_old_name_re/.test(q50), "0.7.51 questions note dual-track");
  assert(logExists("0.7.51"), "0.7.51 _log note exists");
}

// --- 0.7.50: 运行时 _log 零依赖（stub 移除 + purge 不变量 + 双态门禁） ---
{
  assert(!fs.existsSync(path.join(skillRoot, "scripts/fill-truths-auto.mjs")), "0.7.50 fill-truths-auto stub removed");
  const autoIdx750 = fs.readFileSync(path.join(skillRoot, "archive/fill-truths-auto/INDEX.md"), "utf8");
  assert(/0\.7\.50/.test(autoIdx750) && /不可运行/.test(autoIdx750), "0.7.50 archive INDEX removed + not runnable");
  assert(/对话不推荐/.test(autoIdx750), "0.7.50 archive INDEX keeps 对话不推荐");

  const skill750 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/已归档/.test(skill750) && /archive\/fill-truths-auto/.test(skill750), "0.7.50 SKILL marks archived");

  // purge 不变量：除 selfcheck 三件套外，随包树零 _log **路径形引用**（`_log/`、`_log\`）。
  // 描述性裸词提及（如「运行时 _log 零依赖」措辞）允许；路径形才构成运行时依赖。
  // generic_logic / job_log / last_login_at 无斜杠，天然不命中。
  const LOG_TOKEN_750 = /_log[\\\/]/;
  const exempt750 = new Set([
    path.join("scripts", "selfcheck.mjs"),
    path.join("scripts", "lib", "selfcheck", "checks-0.5.mjs"),
    path.join("scripts", "lib", "selfcheck", "checks-0.6.mjs"),
  ]);
  const skipDirs750 = new Set([path.join("docs", "harness-eng")]); // 本地运行态产物（gitignore，不入包）
  const binExt750 = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|zip|map)$/i;
  const offenders750 = [];
  const walk750 = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!skipDirs750.has(path.relative(skillRoot, p))) walk750(p);
      } else if (!binExt750.test(ent.name)) {
        const rel = path.relative(skillRoot, p);
        if (exempt750.has(rel)) continue;
        let text750 = "";
        try {
          text750 = fs.readFileSync(p, "utf8");
        } catch {
          continue;
        }
        if (LOG_TOKEN_750.test(text750)) offenders750.push(rel);
      }
    }
  };
  walk750(skillRoot);
  assert(
    offenders750.length === 0,
    `0.7.50 runtime tree free of _log refs (offenders: ${offenders750.slice(0, 6).join(", ")})`
  );

  // 双态门禁在位
  const selfSrc750 = fs.readFileSync(path.join(skillRoot, "scripts/selfcheck.mjs"), "utf8");
  assert(/const hasLogRoot = fs\.existsSync\(logRoot\)/.test(selfSrc750), "0.7.50 selfcheck hasLogRoot detection");
  const checks06Src750 = fs.readFileSync(path.join(skillRoot, "scripts/lib/selfcheck/checks-0.6.mjs"), "utf8");
  assert(/const hasLog = fs\.existsSync\(logRoot\)/.test(checks06Src750), "0.7.50 checks-0.6 hasLog detection");

  // 随包文档新措辞
  const changelogMd750 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/仓库级档案/.test(changelogMd750) && !/_log[\/\\]/.test(changelogMd750), "0.7.50 CHANGELOG repo-archive wording");
  assert(/^\| 0\.7\.49 \|/m.test(changelogMd750), "0.7.50 CHANGELOG plain row format");
  assert(/^\| 0\.7\.50 \|/m.test(changelogMd750), "0.7.50 CHANGELOG index row 0.7.50");
  const verifyMd750 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(!/_log[\/\\]/.test(verifyMd750), "0.7.50 VERIFY purged");
  const agentIdx750 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/仓库级版本档案/.test(agentIdx750) && /「仓库级档案与发版」/.test(agentIdx750), "0.7.50 AGENT-INDEX release step repo-archive");
  const upMd750 = upgradeCorpus();
  assert(/## 0\.7\.49 → 0\.7\.50/.test(upMd750), "0.7.50 upgrade migration section");
  assert(/hasLogRoot/.test(upMd750) && /门禁包裹/.test(upMd750), "0.7.50 upgrade gating convention note");

  assert(logExists("0.7.50"), "0.7.50 _log note exists");
}

console.log(`ok: ${ok.length}`);
for (const m of ok) console.log(`  ✓ ${m}`);
if (fail.length) {
  console.error(`fail: ${fail.length}`);
  for (const m of fail) console.error(`  ✗ ${m}`);
  process.exit(1);
}

console.log("selfcheck PASS");
