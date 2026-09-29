#!/usr/bin/env node
/**
 * feature-eng selfcheck：静态断言 + 夹具行为断言。版本 PIN 读自 `_meta/manifest.yaml`。
 * 覆盖：manifest · modes/ 入口 · modes/specs/ · feature.mjs · 绑定 · 模板 · lib ·
 * status-scan --cwd · gate-evidence · fixtures · CHANGELOG/_log · sync-skill-version --check。
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import {
  isFakeChatTranscriptPlaceholder,
  isLegalAuthorizedBy,
} from "./lib/auth.mjs";
import {
  RUN_MODE_ENUM,
  validateProgressEnums,
  validateMonorepoPackages,
} from "./lib/progress-shape.mjs";
import { readSkillVersion, escapeSemverRe } from "./lib/skill-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

function read(rel) {
  const p = path.join(skillRoot, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(skillRoot, rel));
}

const PIN = readSkillVersion(skillRoot);
const VER_RE = escapeSemverRe(PIN);

const MODES = [
  "modes/init.md",
  "modes/rebind.md",
  "modes/start.md",
  "modes/resume.md",
  "modes/status.md",
  "modes/advance.md",
  "modes/close.md",
];

const MODE_EXTRAS = [
  "modes/specs/flow.md",
  "modes/specs/gates.md",
  "modes/specs/bridges.md",
  "modes/specs/handoff.md",
  "modes/README.md",
];

const FLAT_SPEC_LEAKS = [
  "modes/binding.md",
  "modes/stages.md",
  "modes/artifacts.md",
  "modes/gates-common.md",
  "modes/gates-review.md",
  "modes/domain-bridge.md",
  "modes/proto-bridge.md",
  "modes/handoff.md",
];

const ROOT_MODE_LEAKS = [
  "init.md",
  "rebind.md",
  "start.md",
  "resume.md",
  "status.md",
  "advance.md",
  "close.md",
  "binding.md",
  "stages.md",
  "artifacts.md",
  "gates-common.md",
  "gates-review.md",
  "domain-bridge.md",
  "proto-bridge.md",
  "handoff.md",
];

const BINDING_KEYS = [
  "grill",
  "design",
  "domain",
  "spec",
  "plan",
  "proto",
  "testdesign",
  "implement",
  "review",
  "verify",
  "diagnose",
];

const TEMPLATES = [
  "templates/progress.yaml.tmpl",
  "templates/回链.md.tmpl",
  "templates/测试用例.md.tmpl",
  "templates/测试报告.md.tmpl",
  "templates/runs-README.md.tmpl",
  "templates/交接.md.tmpl",
  "templates/术语增量.md.tmpl",
  "templates/设计笔记.md.tmpl",
  "templates/审核-stage.md.tmpl",
];

function stageSkillMap(yamlText) {
  const map = {};
  if (!yamlText) return map;
  // stages: block — match "key: { skill: name }" or "key: { skill: null }"
  for (const k of BINDING_KEYS) {
    const re = new RegExp(
      `^\\s*${k}\\s*:\\s*\\{[^}]*skill:\\s*([^}\\s,]+)`,
      "m"
    );
    const m = yamlText.match(re);
    if (m) map[k] = m[1].replace(/^["']|["']$/g, "");
  }
  return map;
}

// --- manifest ---
const manifest = read("_meta/manifest.yaml");
assert(manifest != null, "manifest.yaml exists");
assert(
  manifest != null && manifest.includes(`version: "${PIN}"`),
  `manifest version == ${PIN}`
);
for (const m of [
  "init",
  "rebind",
  "start",
  "resume",
  "status",
  "advance",
  "close",
]) {
  assert(
    manifest != null && new RegExp(`-\\s+${m}\\b`).test(manifest),
    `manifest modes includes ${m}`
  );
}
assert(
  manifest != null && /truncate-contracts\.yaml/.test(manifest),
  "manifest lists truncate-contracts.yaml"
);

// --- mode files (under modes/) ---
for (const f of MODES) {
  assert(exists(f), `mode file ${f}`);
}
for (const f of MODE_EXTRAS) {
  assert(exists(f), `mode extra ${f}`);
}
for (const f of ROOT_MODE_LEAKS) {
  assert(!exists(f), `root must not keep mode leak ${f}`);
}
for (const f of FLAT_SPEC_LEAKS) {
  assert(!exists(f), `modes/ must not keep flat spec leak ${f}`);
}
assert(
  manifest != null && /modes_dir:\s*modes\//.test(manifest),
  "manifest modes_dir == modes/"
);
assert(
  manifest != null && /specs_dir:\s*modes\/specs\//.test(manifest),
  "manifest specs_dir == modes/specs/"
);
assert(
  /specs:\s*\n(?:\s*-\s*(flow|gates|bridges|handoff)\s*\n){4}/.test(manifest || "") ||
    (/flow/.test(manifest || "") &&
      /gates/.test(manifest || "") &&
      /bridges/.test(manifest || "") &&
      /handoff/.test(manifest || "") &&
      /specs:/.test(manifest || "")),
  "manifest lists specs flow/gates/bridges/handoff"
);

// --- 11 binding keys + non-null skills ---
const bindings = read("config/stage-bindings.yaml");
assert(bindings != null, "stage-bindings.yaml exists");
assert(BINDING_KEYS.length === 11, "binding key list length == 11");
const bindMap = stageSkillMap(bindings);
for (const k of BINDING_KEYS) {
  assert(
    bindings != null && new RegExp(`^\\s*${k}\\s*:`, "m").test(bindings),
    `binding key ${k}`
  );
  const skill = bindMap[k];
  assert(
    skill != null && skill !== "null" && skill.length > 0,
    `binding ${k}.skill non-null (${skill || "missing"})`
  );
}
assert(
  /close_pitfalls:\s*optional/.test(bindings || ""),
  "bindings defaults.close_pitfalls == optional"
);

// --- example yaml keys match ---
const example = read("config/stage-bindings.example.yaml");
assert(example != null, "stage-bindings.example.yaml exists");
const exMap = stageSkillMap(example);
for (const k of BINDING_KEYS) {
  assert(
    example != null && new RegExp(`^\\s*${k}\\s*:`, "m").test(example),
    `example binding key ${k}`
  );
  assert(
    exMap[k] != null && exMap[k] !== "null",
    `example ${k}.skill non-null`
  );
  assert(
    bindMap[k] === exMap[k],
    `example ${k}.skill matches bindings (${bindMap[k]})`
  );
}
assert(
  /close_pitfalls:\s*optional/.test(example || ""),
  "example defaults.close_pitfalls == optional"
);

// --- truncate contracts ---
const trunc = read("config/truncate-contracts.yaml");
assert(trunc != null, "truncate-contracts.yaml exists");
assert(/stages:/.test(trunc || ""), "truncate-contracts has stages");
assert(
  /^\s*design\s*:/m.test(trunc || ""),
  "truncate-contracts has design"
);
assert(/^\s*spec\s*:/m.test(trunc || ""), "truncate-contracts has spec");
assert(/allow:/.test(trunc || ""), "truncate-contracts has allow");
assert(/forbid:/.test(trunc || ""), "truncate-contracts has forbid");
assert(
  /brainstorming/.test(trunc || ""),
  "truncate-contracts mentions brainstorming"
);

// design+spec both brainstorming in bindings
assert(
  bindMap.design === "brainstorming" && bindMap.spec === "brainstorming",
  "design+spec both brainstorming in bindings"
);

// --- templates ---
for (const t of TEMPLATES) {
  assert(exists(t), `template ${t}`);
}

// --- SKILL boundary text ---
const skill = read("SKILL.md");
assert(skill != null, "SKILL.md exists");
assert(
  skill != null && skill.includes("调度员不进厨房"),
  "SKILL boundary: 调度员不进厨房"
);
assert(skill != null && /写盘权责/.test(skill), "SKILL 写盘权责");
assert(skill != null && /控制器边界/.test(skill), "SKILL 控制器边界");
assert(
  skill != null && skill.includes(PIN),
  `SKILL pins ${PIN}`
);
assert(
  skill != null && /truncate-contracts\.yaml/.test(skill),
  "SKILL links truncate-contracts"
);
assert(
  skill != null && /QUICKSTART\.md/.test(skill),
  "SKILL links QUICKSTART"
);

// --- binding precheck + truncate wire ---
const binding = read("modes/specs/flow.md") || "";
assert(/绑定 skill 可调起/.test(binding), "binding has 绑定 skill 可调起");
assert(/未绑定 skill/.test(binding), "binding failure copy: 未绑定 skill");
assert(
  /当前不可调起|不可调起/.test(binding),
  "binding failure copy: 不可调起"
);
assert(
  /truncate-contracts\.yaml/.test(binding),
  "binding links truncate-contracts"
);
assert(/同 skill 多环/.test(binding), "binding has 同 skill 多环");

// start/advance reference precheck
const start = read("modes/start.md") || "";
assert(
  /绑定 skill 可调起|预检/.test(start),
  "start.md references 预检/可调起"
);
const advance = read("modes/advance.md") || "";
assert(
  /绑定 skill 可调起|预检 A/.test(advance),
  "advance.md references 预检"
);

// --- no root CONTEXT rule ---
const stages = read("modes/specs/flow.md") || "";
const hasContextBan =
  (skill != null && /CONTEXT\.md/.test(skill) && /禁止|不可写/.test(skill)) ||
  /禁止[^。\n]*CONTEXT\.md/.test(stages) ||
  /禁止[^。\n]*CONTEXT\.md/.test(binding) ||
  (skill != null && /仓库根\s*`?CONTEXT\.md`?/.test(skill));
assert(hasContextBan, "no-root-CONTEXT rule present");
assert(
  skill != null && /仓库根\s*`CONTEXT\.md`|根\s*`CONTEXT\.md`/.test(skill),
  "SKILL mentions 根 CONTEXT.md ban"
);

// --- AGENT-INDEX / QUICKSTART ---
assert(exists("AGENT-INDEX.md"), "AGENT-INDEX.md exists");
const index = read("AGENT-INDEX.md") || "";
assert(/必读/.test(index), "AGENT-INDEX has 必读");
assert(/≤[68]\s*文件|≤[68] 文件/.test(index), "AGENT-INDEX caps ≤6/≤8 files");
assert(/specs\/flow|modes\/specs\/flow/.test(index), "AGENT-INDEX links specs/flow");
assert(/specs\/gates|modes\/specs\/gates/.test(index), "AGENT-INDEX links specs/gates");
assert(
  !/CHANGELOG\.md.*VERIFY\.md.*selfcheck/.test(index.split("## 必读")[1]?.split("## 按需")[0] || ""),
  "AGENT-INDEX 必读 demotes CHANGELOG/VERIFY/selfcheck"
);
assert(/本回合模式/.test(index), "AGENT-INDEX has 本回合模式 row");
assert(/按需/.test(index), "AGENT-INDEX has 按需");
assert(
  skill != null && /AGENT-INDEX\.md/.test(skill),
  "SKILL.md links AGENT-INDEX"
);
assert(exists("QUICKSTART.md"), "QUICKSTART.md exists");
const quick = read("QUICKSTART.md") || "";
assert(/AGENT-INDEX\.md/.test(quick), "QUICKSTART links AGENT-INDEX");
assert(/init/.test(quick) && /start/.test(quick), "QUICKSTART has init/start");
assert(
  /advance/.test(quick) && /close/.test(quick),
  "QUICKSTART has advance/close"
);
assert(/\bS\b/.test(quick) && /\bB\b/.test(quick) && /\bF\b/.test(quick), "QUICKSTART has S/B/F");
assert(index.includes(PIN), `AGENT-INDEX mentions ${PIN}`);

// --- status-scan ---
assert(exists("scripts/status-scan.mjs"), "status-scan.mjs exists");
const statusScan = read("scripts/status-scan.mjs") || "";
assert(
  /docs\/runs\/active/.test(statusScan),
  "status-scan looks at docs/runs/active"
);
assert(/slug/.test(statusScan) && /stage/.test(statusScan), "status-scan prints slug/stage");
const statusMd = read("modes/status.md") || "";
assert(
  /status-scan\.mjs/.test(statusMd),
  "status.md links status-scan.mjs"
);

// --- close_pitfalls docs ---
const close = read("modes/close.md") || "";
assert(/close_pitfalls/.test(close), "close.md documents close_pitfalls");
assert(
  /\boff\b/.test(close) && /\boptional\b/.test(close) && /\bon\b/.test(close),
  "close.md has off|optional|on"
);
assert(
  /视为\s*`?on`?|视为 on/.test(close),
  "close.md resolution: lint script → effective on"
);
assert(
  /lint-pitfalls\.mjs/.test(close) && /解析顺序/.test(close),
  "close.md has close_pitfalls resolution order"
);

// --- CHANGELOG index + _log/feature-eng/<ver>.md ---
const logRoot = path.resolve(skillRoot, "..", "_log", "feature-eng");
function logExists(ver) {
  return fs.existsSync(path.join(logRoot, `${ver}.md`));
}
function readLog(ver) {
  const p = path.join(logRoot, `${ver}.md`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}
const changelogIndex = read("CHANGELOG.md");
const changelog = fs.existsSync(logRoot)
  ? fs
      .readdirSync(logRoot)
      .filter((f) => f.endsWith(".md"))
      .map((f) => fs.readFileSync(path.join(logRoot, f), "utf8"))
      .join("\n")
  : "";
assert(changelogIndex != null, "CHANGELOG.md exists");
assert(
  /_log\/feature-eng\//.test(changelogIndex || ""),
  "CHANGELOG points to _log/feature-eng/"
);
assert(
  changelogIndex != null && changelogIndex.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);
assert(logExists(PIN), `_log/feature-eng/${PIN}.md exists`);
for (const ver of [
  "0.2.12-dev",
  "0.2.11-dev",
  "0.2.10-dev",
  "0.2.9-dev",
  "0.2.8-dev",
  "0.2.7-dev",
  "0.2.6-dev",
  "0.2.5-dev",
  "0.2.4",
]) {
  assert(logExists(ver), `_log/feature-eng/${ver}.md exists`);
  assert(
    changelogIndex != null && changelogIndex.includes(`${ver}.md`),
    `CHANGELOG index links ${ver}`
  );
}

// --- VERIFY / README smoke pointers ---
assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
assert(verify.includes(PIN), `VERIFY pins ${PIN}`);
assert(/fixture|夹具|行为/.test(verify), "VERIFY mentions fixtures/behavioral checks");
assert(/QUICKSTART|truncate-contracts|close_pitfalls|status-scan/.test(verify), "VERIFY covers P1/P2 items");
const readme = read("README.md") || "";
assert(/VERIFY\.md/.test(readme), "README mentions VERIFY");
assert(/selfcheck\.mjs/.test(readme), "README mentions selfcheck.mjs");
assert(readme.includes(PIN), `README pins ${PIN}`);
assert(/QUICKSTART\.md/.test(readme), "README links QUICKSTART");

// P0：仓根 README 钉号 + VERIFY 继承不冒充现行钉 + sync 条件化
const repoRootReadmePath = path.join(skillRoot, "..", "README.md");
const repoRootReadme = fs.existsSync(repoRootReadmePath)
  ? fs.readFileSync(repoRootReadmePath, "utf8")
  : null;
assert(repoRootReadme != null, "repo root README.md exists (../README.md)");
assert(
  new RegExp(
    String.raw`feature-eng/README\.md[^\n]*` + PIN.replace(/\./g, "\\.")
  ).test(repoRootReadme || ""),
  `repo root README feature-eng row pins ${PIN}`
);
assert(
  !/钉\s*\*\*0\.2\.8-dev\*\*/.test(verify),
  "VERIFY must not claim current pin is 0.2.8-dev"
);
assert(
  /继承\s*[·•]\s*as-of|as-of\s*0\.2\./i.test(verify),
  "VERIFY inheritance sections use as-of wording"
);
assert(
  /现行权威钉/.test(verify),
  "VERIFY inheritance sections point to current pin"
);
const initMdEarly = read("modes/init.md") || "";
const rebindMdEarly = read("modes/rebind.md") || "";
const bindingMdEarly = read("modes/specs/flow.md") || "";
assert(
  !/默认代跑\s*`?node scripts\/agent-config\/sync\.mjs/.test(initMdEarly),
  "init.md must not unconditionally 默认代跑 sync.mjs"
);
assert(
  /禁止.*sync|不.*代跑.*sync|禁止代跑/.test(initMdEarly),
  "init.md forbids harness sync.mjs"
);
assert(
  /docs\/runs\/stage-bindings\.yaml/.test(initMdEarly),
  "init.md writes docs/runs/stage-bindings.yaml"
);
assert(
  /禁止.*sync|不.*代跑.*sync|禁止代跑/.test(rebindMdEarly),
  "rebind.md forbids harness sync.mjs"
);
assert(
  /docs\/runs\/stage-bindings\.yaml/.test(rebindMdEarly + bindingMdEarly + readme),
  "rebind/flow/README document target-repo bindings SSOT"
);
const bindingsYamlHdr = (read("config/stage-bindings.yaml") || "").slice(0, 400);
assert(
  /种子|回退/.test(bindingsYamlHdr) && /禁止.*sync|sync\.mjs/.test(bindingsYamlHdr),
  "stage-bindings.yaml header: seed/fallback + no sync"
);

// =====================================================================
// 0.2.5-dev：fixtures + 行为断言（超出「文件存在」）
// =====================================================================
const FIX_GOOD = "scripts/fixtures/init-skeleton";
const FIX_BAD = "scripts/fixtures/progress-bad";
const FIX_SLUG = "2026-09-19-fixture-demo";
const fixProgressRel = `${FIX_GOOD}/docs/runs/active/${FIX_SLUG}/progress.yaml`;
const fixHuilianRel = `${FIX_GOOD}/docs/runs/active/${FIX_SLUG}/回链.md`;
const fixRunsReadmeRel = `${FIX_GOOD}/docs/runs/README.md`;
const fixBadProgressRel = `${FIX_BAD}/docs/runs/active/bad-missing-fields/progress.yaml`;

const PROGRESS_TOP_KEYS = [
  "slug",
  "title",
  "created_at",
  "updated_at",
  "path",
  "run_mode",
  "invoke",
  "handoff_policy",
  "review_policy",
  "chef_mode",
  "stage",
  "domain",
  "proto",
  "artifacts",
  "tasks",
  "gates",
  "env_verified",
  "env_notes",
  "layout",
  "packages",
  "docs_root",
  "sibling_repos",
  "accepted_residual",
];
const ARTIFACT_KEYS = [
  "adr",
  "spec",
  "plan",
  "proto",
  "context_delta",
  "testcases",
  "test_report",
  "qa_report",
];
const GATE_KEYS = [
  "triage",
  "shared_understanding",
  "design_confirmed",
  "go",
  "pre_impl",
  "gate",
  "verify",
  "close",
];
const ENUMS = {
  path: ["spike", "bounded", "full"],
  run_mode: ["guided", "express"],
  invoke: ["strict", "inline"],
  handoff_policy: ["auto", "confirm"],
  review_policy: ["subagent", "inline"],
  chef_mode: ["bound", "controller_proxy"],
};

function readScalar(text, key) {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const m = text.match(re);
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}

function hasNestedKey(text, parentKey, childKey) {
  const start = text.search(new RegExp(`^${parentKey}:\\s*$`, "m"));
  if (start < 0) return false;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  return new RegExp(`^\\s+${childKey}\\s*:`, "m").test(block);
}

function validateProgressShape(text, label, { allowNullPath = false } = {}) {
  const issues = [];
  if (!text) {
    issues.push(`${label}: missing text`);
    return issues;
  }
  for (const k of PROGRESS_TOP_KEYS) {
    if (!new RegExp(`^${k}\\s*:`, "m").test(text)) {
      issues.push(`${label}: missing top key ${k}`);
    }
  }
  for (const k of ARTIFACT_KEYS) {
    if (!hasNestedKey(text, "artifacts", k)) {
      issues.push(`${label}: artifacts missing ${k}`);
    }
  }
  for (const k of GATE_KEYS) {
    if (!hasNestedKey(text, "gates", k)) {
      issues.push(`${label}: gates missing ${k}`);
    }
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = readScalar(text, field);
    if (v === undefined) {
      issues.push(`${label}: cannot read ${field}`);
      continue;
    }
    if (v === null) {
      if (field === "path" && allowNullPath) continue;
      issues.push(
        `${label}: ${field} is null (need one of ${allowed.join("|")})`
      );
      continue;
    }
    if (!allowed.includes(v)) {
      issues.push(`${label}: ${field}=${v} not in ${allowed.join("|")}`);
    }
  }
  if (!readScalar(text, "stage")) issues.push(`${label}: stage empty`);
  if (!readScalar(text, "slug")) issues.push(`${label}: slug empty`);
  return issues;
}

assert(exists("scripts/fixtures/README.md"), "fixtures README exists");
assert(exists(fixProgressRel), "fixture progress.yaml exists");
assert(exists(fixHuilianRel), "fixture 回链.md exists");
assert(exists(fixRunsReadmeRel), "fixture docs/runs/README.md exists");
assert(exists(fixBadProgressRel), "bad fixture progress.yaml exists");

const progressTmpl = read("templates/progress.yaml.tmpl") || "";
const tmplShapeIssues = validateProgressShape(progressTmpl, "progress.tmpl", {
  allowNullPath: true,
});
assert(
  tmplShapeIssues.length === 0,
  tmplShapeIssues.length === 0
    ? "progress.tmpl shape OK (top/artifacts/gates/enums-or-null-path)"
    : `progress.tmpl shape: ${tmplShapeIssues[0]}`
);
assert(
  /\{\{slug\}\}/.test(progressTmpl) &&
    /\{\{title\}\}/.test(progressTmpl) &&
    /\{\{date\}\}/.test(progressTmpl),
  "progress.tmpl has {{slug}}/{{title}}/{{date}}"
);
assert(/^stage:\s*triage\b/m.test(progressTmpl), "progress.tmpl default stage=triage");
assert(/^run_mode:\s*guided\b/m.test(progressTmpl), "progress.tmpl default run_mode=guided");
assert(/^invoke:\s*strict\b/m.test(progressTmpl), "progress.tmpl default invoke=strict");
assert(
  /^handoff_policy:\s*confirm\b/m.test(progressTmpl),
  "progress.tmpl default handoff_policy=confirm"
);
assert(
  /^review_policy:\s*subagent\b/m.test(progressTmpl),
  "progress.tmpl default review_policy=subagent"
);
assert(
  /^chef_mode:\s*bound\b/m.test(progressTmpl),
  "progress.tmpl default chef_mode=bound"
);
assert(
  /^env_notes:\s*null\b/m.test(progressTmpl),
  "progress.tmpl has env_notes: null"
);
assert(
  /^layout:\s*null\b/m.test(progressTmpl),
  "progress.tmpl has layout: null"
);
assert(
  /^packages:\s*null\b/m.test(progressTmpl),
  "progress.tmpl has packages: null"
);
assert(
  /^docs_root:\s*"docs\/"/m.test(progressTmpl),
  'progress.tmpl has docs_root: "docs/"'
);

const fixProgress = read(fixProgressRel) || "";
const fixIssues = validateProgressShape(fixProgress, "fixture progress");
assert(
  fixIssues.length === 0,
  fixIssues.length === 0
    ? "fixture progress shape OK (keys/enums/gates/artifacts)"
    : `fixture progress shape: ${fixIssues[0]}`
);
assert(
  readScalar(fixProgress, "slug") === FIX_SLUG,
  "fixture progress.slug matches dir"
);
assert(
  readScalar(fixProgress, "stage") === "triage",
  "fixture progress.stage == triage"
);
assert(
  readScalar(fixProgress, "path") === "bounded",
  "fixture progress.path == bounded"
);
assert(
  readScalar(fixProgress, "run_mode") === "guided",
  "fixture progress.run_mode == guided"
);

// 模板 ↔ 夹具顶层键契约
assert(
  PROGRESS_TOP_KEYS.every(
    (k) =>
      new RegExp(`^${k}\\s*:`, "m").test(progressTmpl) &&
      new RegExp(`^${k}\\s*:`, "m").test(fixProgress)
  ),
  "template↔fixture progress top-key contract aligned"
);

const fixHuilian = read(fixHuilianRel) || "";
assert(fixHuilian.includes(FIX_SLUG), "fixture 回链 mentions slug");
assert(/## 决策与术语/.test(fixHuilian), "fixture 回链 has ## 决策与术语");
assert(/## 规划/.test(fixHuilian), "fixture 回链 has ## 规划");
assert(
  /CONTEXT\.md/.test(fixHuilian) && /禁止/.test(fixHuilian),
  "fixture 回链 bans root CONTEXT.md"
);

const huilianTmpl = read("templates/回链.md.tmpl") || "";
assert(/## 决策与术语/.test(huilianTmpl), "回链.tmpl has ## 决策与术语");
assert(/## 规划/.test(huilianTmpl), "回链.tmpl has ## 规划");
assert(/## 原型/.test(huilianTmpl), "回链.tmpl has ## 原型");
assert(/## 测试/.test(huilianTmpl), "回链.tmpl has ## 测试");
assert(
  /CONTEXT\.md/.test(huilianTmpl) && /禁止/.test(huilianTmpl),
  "回链.tmpl bans root CONTEXT.md"
);

const fixRunsReadme = read(fixRunsReadmeRel) || "";
assert(fixRunsReadme.includes(FIX_SLUG), "fixture runs README lists slug");

// artifacts.md triage 契约字段
const artifactsMd = read("modes/specs/gates.md") || "";
assert(/##\s*triage/.test(artifactsMd), "artifacts.md has ## triage");
assert(
  /`path`/.test(artifactsMd) &&
    /`run_mode`/.test(artifactsMd) &&
    /`invoke`/.test(artifactsMd) &&
    /`handoff_policy`/.test(artifactsMd) &&
    /`review_policy`/.test(artifactsMd) &&
    /`stage`/.test(artifactsMd),
  "artifacts triage lists path/run_mode/invoke/handoff/review/stage"
);

// start.md 建盘契约
const startMd = read("modes/start.md") || "";
assert(
  /progress\.yaml/.test(startMd) && /回链\.md/.test(startMd),
  "start.md creates progress.yaml + 回链.md"
);

// 负例
const badProgress = read(fixBadProgressRel) || "";
const badIssues = validateProgressShape(badProgress, "bad fixture");
assert(
  badIssues.length >= 3,
  `bad fixture rejects incomplete shape (${badIssues.length} issues)`
);
assert(
  badIssues.some((i) => /stage/.test(i)),
  "bad fixture flags missing stage"
);
assert(
  badIssues.some(
    (i) => /gates/.test(i) || /run_mode/.test(i) || /artifacts/.test(i)
  ),
  "bad fixture flags missing gates/run_mode/artifacts"
);

// status-scan 对夹具根可跑通
const scanBin = path.join(skillRoot, "scripts/status-scan.mjs");
const scan = spawnSync(
  process.execPath,
  [scanBin],
  {
    cwd: path.join(skillRoot, FIX_GOOD),
    encoding: "utf8",
  }
);
assert(scan.status === 0, "status-scan on fixture exit 0");
const scanOut = `${scan.stdout || ""}${scan.stderr || ""}`;
assert(scanOut.includes(FIX_SLUG), "status-scan prints fixture slug");
assert(/\btriage\b/.test(scanOut), "status-scan prints fixture stage=triage");
assert(/\bbounded\b/.test(scanOut), "status-scan prints fixture path=bounded");


// --- feature.mjs thin CLI (自 0.2.6-dev；本版只加厚夹具) ---
assert(exists("scripts/feature.mjs"), "feature.mjs exists");
const featureCli = read("scripts/feature.mjs") || "";
assert(/调度员不进厨房/.test(featureCli), "feature.mjs mentions 调度员不进厨房");
assert(/status-scan\.mjs/.test(featureCli), "feature.mjs wraps status-scan");
assert(/modes/.test(featureCli), "feature.mjs has modes subcommand");
const featHelp = spawnSync(process.execPath, [path.join(skillRoot, "scripts/feature.mjs"), "--help"], {
  cwd: skillRoot,
  encoding: "utf8",
});
assert(featHelp.status === 0, "feature.mjs --help exit 0");
const helpOut = `${featHelp.stdout || ""}${featHelp.stderr || ""}`;
assert(/modes/.test(helpOut) && /status/.test(helpOut), "feature.mjs --help lists modes/status");
assert(
  /gate-evidence/.test(helpOut) && /close-check/.test(helpOut),
  "feature.mjs --help lists gate-evidence/close-check"
);
assert(/调度员不进厨房/.test(helpOut), "feature.mjs --help keeps 调度员不进厨房");
const featModes = spawnSync(process.execPath, [path.join(skillRoot, "scripts/feature.mjs"), "modes"], {
  cwd: skillRoot,
  encoding: "utf8",
});
assert(featModes.status === 0, "feature.mjs modes exit 0");
const modesOut = `${featModes.stdout || ""}`;
assert(/modes\/init\.md/.test(modesOut), "feature.mjs modes lists modes/init.md");
assert(/advance/.test(modesOut) && /close/.test(modesOut), "feature.mjs modes lists advance/close");
assert(/modes\/specs\/flow\.md/.test(modesOut), "feature.mjs modes lists specs/flow");
assert(/specs\//.test(modesOut) && /gates/.test(modesOut), "feature.mjs modes lists specs section");
const featStatus = spawnSync(
  process.execPath,
  [path.join(skillRoot, "scripts/feature.mjs"), "status", "--cwd", path.join(skillRoot, FIX_GOOD)],
  { cwd: skillRoot, encoding: "utf8" }
);
assert(featStatus.status === 0, "feature.mjs status on fixture exit 0");
const featStatusOut = `${featStatus.stdout || ""}${featStatus.stderr || ""}`;
assert(featStatusOut.includes(FIX_SLUG), "feature.mjs status prints fixture slug");

// SKILL/INDEX link into modes/
assert(
  skill != null && /modes\/init\.md/.test(skill),
  "SKILL links modes/init.md"
);
assert(/modes\//.test(index), "AGENT-INDEX links modes/");
assert(/modes\//.test(quick), "QUICKSTART links modes/");
assert(/feature\.mjs/.test(skill || ""), "SKILL mentions feature.mjs");
assert(/feature\.mjs/.test(index), "AGENT-INDEX mentions feature.mjs");


// =====================================================================
// 0.2.6-dev：加厚夹具（原 0.2.6-dev 切片并入） — advance-gate / bindings-bad / close-ready
// =====================================================================
const FIX_ADV = "scripts/fixtures/advance-gate";
const FIX_BIND_BAD = "scripts/fixtures/bindings-bad";
const FIX_CLOSE = "scripts/fixtures/close-ready";
const ADV_SLUG = "2026-09-19-advance-gate-demo";
const CLOSE_SLUG = "2026-09-19-close-ready-demo";
const advProgressRel = `${FIX_ADV}/docs/runs/active/${ADV_SLUG}/progress.yaml`;
const advHuilianRel = `${FIX_ADV}/docs/runs/active/${ADV_SLUG}/回链.md`;
const bindNullRel = `${FIX_BIND_BAD}/stage-bindings.null-skill.yaml`;
const bindMissingRel = `${FIX_BIND_BAD}/stage-bindings.missing-key.yaml`;
const closeProgressRel = `${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/progress.yaml`;
const closeHuilianRel = `${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/回链.md`;

function nestedScalar(text, parentKey, childKey) {
  const start = text.search(new RegExp(`^${parentKey}:\\s*$`, "m"));
  if (start < 0) return undefined;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  const m = block.match(new RegExp(`^\\s+${childKey}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}

function isIsoTimestamp(v) {
  if (v == null || typeof v !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v);
}

function validateBindingsIntegrity(yamlText, label) {
  const issues = [];
  if (!yamlText) {
    issues.push(`${label}: missing text`);
    return issues;
  }
  const map = stageSkillMap(yamlText);
  for (const k of BINDING_KEYS) {
    if (!new RegExp(`^\\s*${k}\\s*:`, "m").test(yamlText)) {
      issues.push(`${label}: missing key ${k}`);
      continue;
    }
    const skill = map[k];
    if (skill == null || skill === "null" || skill.length === 0) {
      issues.push(`${label}: ${k}.skill null/empty`);
    }
  }
  return issues;
}

assert(exists(advProgressRel), "advance-gate fixture progress.yaml exists");
assert(exists(advHuilianRel), "advance-gate fixture 回链.md exists");
assert(exists(bindNullRel), "bindings-bad null-skill sample exists");
assert(exists(bindMissingRel), "bindings-bad missing-key sample exists");
assert(exists(closeProgressRel), "close-ready fixture progress.yaml exists");
assert(exists(closeHuilianRel), "close-ready fixture 回链.md exists");
assert(
  !exists(`${FIX_CLOSE}/docs/runs/active/${CLOSE_SLUG}/progress.yaml`),
  "close-ready must live under archive not active"
);

const advProgress = read(advProgressRel) || "";
const advIssues = validateProgressShape(advProgress, "advance-gate progress");
assert(
  advIssues.length === 0,
  advIssues.length === 0
    ? "advance-gate progress shape OK"
    : `advance-gate progress shape: ${advIssues[0]}`
);
assert(
  readScalar(advProgress, "slug") === ADV_SLUG,
  "advance-gate progress.slug matches dir"
);
assert(
  readScalar(advProgress, "stage") === "plan",
  "advance-gate progress.stage == plan"
);
assert(
  readScalar(advProgress, "path") === "bounded",
  "advance-gate progress.path == bounded"
);
assert(
  readScalar(advProgress, "domain") === "skipped",
  "advance-gate progress.domain == skipped"
);
assert(
  nestedScalar(advProgress, "artifacts", "spec") != null &&
    /specs\//.test(nestedScalar(advProgress, "artifacts", "spec")),
  "advance-gate artifacts.spec filled"
);
assert(
  nestedScalar(advProgress, "artifacts", "plan") != null &&
    /plans\//.test(nestedScalar(advProgress, "artifacts", "plan")),
  "advance-gate artifacts.plan filled"
);
assert(
  isIsoTimestamp(nestedScalar(advProgress, "gates", "triage")),
  "advance-gate gates.triage is ISO timestamp"
);
assert(
  isIsoTimestamp(nestedScalar(advProgress, "gates", "shared_understanding")),
  "advance-gate gates.shared_understanding is ISO timestamp"
);
assert(
  isIsoTimestamp(nestedScalar(advProgress, "gates", "design_confirmed")),
  "advance-gate gates.design_confirmed is ISO timestamp"
);
assert(
  nestedScalar(advProgress, "gates", "go") === null,
  "advance-gate gates.go still null (ready for advance)"
);
assert(
  nestedScalar(advProgress, "gates", "close") === null,
  "advance-gate gates.close still null"
);
const advHuilian = read(advHuilianRel) || "";
assert(advHuilian.includes(ADV_SLUG), "advance-gate 回链 mentions slug");
assert(/## 规划/.test(advHuilian), "advance-gate 回链 has ## 规划");
assert(
  /CONTEXT\.md/.test(advHuilian) && /禁止/.test(advHuilian),
  "advance-gate 回链 bans root CONTEXT.md"
);
assert(/## 硬闸授权/.test(advHuilian), "advance-gate 回链 has 硬闸授权");
assert(
  /authorized_by/.test(advHuilian) && /user_chat/.test(advHuilian),
  "advance-gate 回链 has legal authorized_by"
);
assert(
  !/可不落盘/.test(advHuilian),
  "advance-gate 回链 no longer allows missing L2 files"
);
assert(
  exists(`${FIX_ADV}/docs/runs/active/${ADV_SLUG}/审核-grill.md`),
  "advance-gate has 审核-grill.md"
);
assert(
  exists(`${FIX_ADV}/docs/runs/active/${ADV_SLUG}/审核-design.md`),
  "advance-gate has 审核-design.md"
);
assert(
  /result:\s*pass/i.test(
    read(`${FIX_ADV}/docs/runs/active/${ADV_SLUG}/审核-design.md`) || ""
  ),
  "advance-gate 审核-design.md has result: pass"
);

const scanAdv = spawnSync(process.execPath, [scanBin], {
  cwd: path.join(skillRoot, FIX_ADV),
  encoding: "utf8",
});
assert(scanAdv.status === 0, "status-scan on advance-gate exit 0");
const scanAdvOut = `${scanAdv.stdout || ""}${scanAdv.stderr || ""}`;
assert(scanAdvOut.includes(ADV_SLUG), "status-scan prints advance-gate slug");
assert(/\bplan\b/.test(scanAdvOut), "status-scan prints advance-gate stage=plan");

const liveBindIssues = validateBindingsIntegrity(bindings, "live bindings");
assert(
  liveBindIssues.length === 0,
  liveBindIssues.length === 0
    ? "live stage-bindings integrity OK"
    : `live bindings: ${liveBindIssues[0]}`
);
const nullSkillYaml = read(bindNullRel) || "";
const nullIssues = validateBindingsIntegrity(nullSkillYaml, "null-skill");
assert(
  nullIssues.some((i) => /implement\.skill/.test(i)),
  "bindings-bad null-skill rejects implement.skill null"
);
assert(
  nullIssues.length >= 1,
  `bindings-bad null-skill has issues (${nullIssues.length})`
);
const missingYaml = read(bindMissingRel) || "";
const missingIssues = validateBindingsIntegrity(missingYaml, "missing-key");
assert(
  missingIssues.some((i) => /missing key diagnose/.test(i)),
  "bindings-bad missing-key rejects absent diagnose"
);
assert(
  missingIssues.length >= 1,
  `bindings-bad missing-key has issues (${missingIssues.length})`
);
assert(
  nullIssues.length > 0 && missingIssues.length > 0,
  "bindings-bad samples are rejected by integrity validator"
);

const closeProgress = read(closeProgressRel) || "";
const closeIssues = validateProgressShape(closeProgress, "close-ready progress");
assert(
  closeIssues.length === 0,
  closeIssues.length === 0
    ? "close-ready progress shape OK"
    : `close-ready progress shape: ${closeIssues[0]}`
);
assert(
  readScalar(closeProgress, "slug") === CLOSE_SLUG,
  "close-ready progress.slug matches dir"
);
assert(
  readScalar(closeProgress, "stage") === "done",
  "close-ready progress.stage == done"
);
assert(
  readScalar(closeProgress, "path") === "bounded",
  "close-ready progress.path == bounded"
);
assert(
  readScalar(closeProgress, "domain") === "skipped",
  "close-ready progress.domain == skipped"
);
assert(
  readScalar(closeProgress, "proto") === "skipped",
  "close-ready progress.proto == skipped"
);
assert(
  isIsoTimestamp(nestedScalar(closeProgress, "gates", "close")),
  "close-ready gates.close is ISO timestamp"
);
assert(
  isIsoTimestamp(nestedScalar(closeProgress, "gates", "triage")),
  "close-ready gates.triage is ISO timestamp"
);
assert(
  isIsoTimestamp(nestedScalar(closeProgress, "gates", "go")),
  "close-ready gates.go is ISO timestamp"
);
assert(
  isIsoTimestamp(nestedScalar(closeProgress, "gates", "gate")),
  "close-ready gates.gate is ISO timestamp"
);
assert(
  nestedScalar(closeProgress, "artifacts", "spec") != null,
  "close-ready artifacts.spec filled"
);
assert(
  nestedScalar(closeProgress, "artifacts", "plan") != null,
  "close-ready artifacts.plan filled"
);
const closeHuilian = read(closeHuilianRel) || "";
assert(closeHuilian.includes(CLOSE_SLUG), "close-ready 回链 mentions slug");
assert(/archive/.test(closeHuilian), "close-ready 回链 mentions archive");
assert(
  /CONTEXT\.md/.test(closeHuilian) && /禁止/.test(closeHuilian),
  "close-ready 回链 bans root CONTEXT.md"
);

const fixReadme = read("scripts/fixtures/README.md") || "";
assert(/advance-gate/.test(fixReadme), "fixtures README lists advance-gate");
assert(/bindings-bad/.test(fixReadme), "fixtures README lists bindings-bad");
assert(/close-ready/.test(fixReadme), "fixtures README lists close-ready");

const featStatusAdv = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/feature.mjs"),
    "status",
    "--cwd",
    path.join(skillRoot, FIX_ADV),
  ],
  { cwd: skillRoot, encoding: "utf8" }
);
assert(featStatusAdv.status === 0, "feature.mjs status on advance-gate exit 0");
assert(
  `${featStatusAdv.stdout || ""}`.includes(ADV_SLUG),
  "feature.mjs status prints advance-gate slug"
);

assert(
  /不写 progress|不进厨房/.test(featureCli),
  "feature.mjs still declares no-write / 调度员不进厨房"
);


// =====================================================================
// 0.2.7-dev：O1–O7 摩擦优化断言（继承）
// =====================================================================
process.env.LC_ALL = process.env.LC_ALL || "C.UTF-8";
process.env.LANG = process.env.LANG || "C.UTF-8";

// O1 chef_mode
assert(/chef_mode/.test(progressTmpl), "O1 progress.tmpl has chef_mode");
assert(/controller_proxy/.test(progressTmpl), "O1 progress.tmpl mentions controller_proxy");
assert(/chef_mode/.test(huilianTmpl), "O1 回链.tmpl has chef_mode");
assert(/chef_mode/.test(startMd), "O1 start.md has chef_mode");
assert(/controller_proxy/.test(startMd), "O1 start.md forces controller_proxy");
assert(/chef_mode/.test(binding), "O1 binding.md documents chef_mode");
assert(/无厨师也能跑完 Full/.test(quick), "O1 QUICKSTART has 无厨师也能跑完 Full");
assert(
  readScalar(fixProgress, "chef_mode") === "bound" ||
    readScalar(fixProgress, "chef_mode") === "controller_proxy",
  "O1 fixture progress.chef_mode enum"
);
assert(
  readScalar(advProgress, "chef_mode") === "bound" ||
    readScalar(advProgress, "chef_mode") === "controller_proxy",
  "O1 advance-gate chef_mode enum"
);
assert(
  readScalar(closeProgress, "chef_mode") === "bound" ||
    readScalar(closeProgress, "chef_mode") === "controller_proxy",
  "O1 close-ready chef_mode enum"
);

// O2 repo_bootstrap
assert(/repo_bootstrap/.test(startMd), "O2 start.md has repo_bootstrap");
const initMd = read("modes/init.md") || "";
assert(/repo_bootstrap|empty-ish|模板文件/.test(initMd + startMd), "O2 init/start empty-ish / template rule");
assert(/LICENSE|\.gitignore/.test(startMd), "O2 start mentions LICENSE/.gitignore");

// O3 authorized_by
const gatesCommon = read("modes/specs/gates.md") || "";
assert(/authorized_by/.test(gatesCommon), "O3 gates-common has authorized_by");
assert(/user_chat/.test(gatesCommon), "O3 gates-common user_chat");
assert(/user_task_/.test(gatesCommon), "O3 gates-common user_task_");
assert(/policy_exception/.test(gatesCommon), "O3 gates-common policy_exception");
assert(/禁止伪造|伪造聊天/.test(gatesCommon + huilianTmpl), "O3 forbids forging chat");
assert(/authorized_by|硬闸授权/.test(huilianTmpl), "O3 回链.tmpl has 硬闸授权");

const legal = (v) => isLegalAuthorizedBy(v, { allowEmpty: true });
const fakeSamples = [
  "用户：确认\n助手：好的",
  "User: LGTM\nAssistant: proceeding",
  "[chat-transcript] user said yes",
  "伪造笔录：用户确认",
];
for (const s of fakeSamples) {
  assert(
    isFakeChatTranscriptPlaceholder(s) || !legal(s),
    `O3 rejects fake chat placeholder: ${s.slice(0, 24)}`
  );
}
assert(legal("user_chat"), "O3 accepts user_chat");
assert(legal("user_task_2026-09-21"), "O3 accepts user_task_<id>");
assert(legal("policy_exception"), "O3 accepts policy_exception");
assert(legal("—"), "O3 allowEmpty accepts —");
assert(!legal("用户：确认"), "O3 rejects bare 用户：确认");
assert(!isLegalAuthorizedBy("user_task_fixture"), "O3 rejects user_task_fixture");
assert(!isLegalAuthorizedBy("user_task_auto"), "O3 rejects user_task_auto");
assert(!isLegalAuthorizedBy("user_task_todo"), "O3 rejects user_task_todo");
assert(exists("scripts/lib/auth.mjs"), "scripts/lib/auth.mjs exists");
assert(
  /lib\/auth\.mjs/.test(read("scripts/gate-evidence.mjs") || ""),
  "gate-evidence imports lib/auth.mjs"
);

// O4 env_notes
assert(/env_notes/.test(progressTmpl), "O4 progress.tmpl has env_notes");
assert(/runtime/.test(progressTmpl) && /target/.test(progressTmpl), "O4 progress.tmpl documents runtime/target");
assert(/mismatch_reason/.test(progressTmpl), "O4 progress.tmpl has mismatch_reason");
assert(/env_notes/.test(huilianTmpl), "O4 回链.tmpl has env_notes");
assert(new RegExp("^env_notes\\s*:", "m").test(fixProgress), "O4 fixture has env_notes");
assert(new RegExp("^env_notes\\s*:", "m").test(advProgress), "O4 advance-gate has env_notes");
assert(new RegExp("^env_notes\\s*:", "m").test(closeProgress), "O4 close-ready has env_notes");
assert(/env_notes/.test(artifactsMd), "O4 artifacts.md documents env_notes");

// O5 review_policy probe
assert(/review_policy/.test(startMd) && (/无 Task|降级/.test(startMd)), "O5 start.md review_policy downgrade");
assert(/禁止静默/.test(startMd + gatesCommon), "O5 forbids silent review_policy change");
assert(/subagent.*inline|inline/.test(startMd), "O5 start mentions subagent→inline");
const gatesReview = read("modes/specs/gates.md") || "";
assert(/降级|无 Task/.test(gatesReview), "O5 gates-review documents Task downgrade");

// O6 Chinese filenames contract
const readmeMd = read("README.md") || "";
assert(/中文文件名是契约|中文过程态文件名/.test(readmeMd), "O6 README declares Chinese filename contract");
const zhTemplates = [
  "templates/回链.md.tmpl",
  "templates/测试用例.md.tmpl",
  "templates/测试报告.md.tmpl",
];
for (const zt of zhTemplates) {
  assert(exists(zt), `O6 Chinese template exists: ${zt}`);
}
assert(exists(fixHuilianRel), "O6 fixture 回链.md exists (UTF-8 path)");
assert(exists(advHuilianRel), "O6 advance-gate 回链.md exists");
assert(exists(closeHuilianRel), "O6 close-ready 回链.md exists");
// Ensure we can read Chinese path round-trip
assert(
  Buffer.from("回链.md", "utf8").toString("utf8") === "回链.md",
  "O6 UTF-8 round-trip 回链.md"
);

// O7 close dual-archive + close-check
assert(/双归档 L1 检查单|双归档/.test(close), "O7 close.md has dual-archive checklist");
assert(/superpowers\/archive/.test(close), "O7 close.md mentions superpowers/archive");
assert(/active.*archive|archive/.test(close), "O7 close.md active→archive");
assert(/未跟踪|普通 `mv`|普通 mv/.test(close), "O7 close.md mv fallback for untracked");
assert(exists("scripts/close-check.mjs"), "O7 close-check.mjs exists");
const closeCheckBin = path.join(skillRoot, "scripts/close-check.mjs");
const closeCheck = spawnSync(
  process.execPath,
  [
    closeCheckBin,
    "--cwd",
    path.join(skillRoot, FIX_CLOSE),
    "--slug",
    CLOSE_SLUG,
  ],
  { cwd: skillRoot, encoding: "utf8" }
);
assert(closeCheck.status === 0, "O7 close-check on close-ready exit 0");
assert(
  /PASS/.test(`${closeCheck.stdout || ""}${closeCheck.stderr || ""}`),
  "O7 close-check prints PASS"
);

assert(/O1|chef_mode/.test(changelog || ""), "_log mentions O1/chef_mode");


// =====================================================================
// 0.2.8-dev：O8–O14 摩擦优化断言
// =====================================================================

// O8 sibling_repos
assert(/sibling_repos/.test(progressTmpl), "O8 progress.tmpl has sibling_repos");
assert(/role:\s*api/.test(progressTmpl) || /api\|web/.test(progressTmpl), "O8 progress.tmpl documents role api|web");
assert(/跨仓/.test(huilianTmpl), "O8 回链.tmpl has 跨仓 section");
assert(/sibling_repos/.test(startMd), "O8 start.md has sibling_repos");
assert(/消费契约/.test(gatesCommon), "O8 gates-common has 消费契约");
assert(/sibling_repos/.test(artifactsMd), "O8 artifacts.md has sibling_repos");
assert(new RegExp("^sibling_repos\\s*:", "m").test(fixProgress), "O8 fixture has sibling_repos");
assert(new RegExp("^sibling_repos\\s*:", "m").test(advProgress), "O8 advance-gate has sibling_repos");
assert(new RegExp("^sibling_repos\\s*:", "m").test(closeProgress), "O8 close-ready has sibling_repos");

const sibSampleRel = "scripts/fixtures/sibling-repos-shape/sibling_repos.sample.yaml";
assert(exists(sibSampleRel), "O8 sibling-repos-shape sample exists");
const sibSample = read(sibSampleRel) || "";
assert(/sibling_repos:/.test(sibSample), "O8 sample has sibling_repos key");
assert(/role:\s*api/.test(sibSample) && /role:\s*web/.test(sibSample), "O8 sample has api and web roles");
assert(/spec_path:/.test(sibSample), "O8 sample has spec_path");
assert(/url:/.test(sibSample), "O8 sample has url");
function validateSiblingRepos(yamlText) {
  const issues = [];
  if (!/sibling_repos:/.test(yamlText)) {
    issues.push("missing sibling_repos");
    return issues;
  }
  const roles = [...yamlText.matchAll(/role:\s*(\S+)/g)].map((m) => m[1]);
  for (const r of roles) {
    if (r !== "api" && r !== "web") issues.push(`bad role ${r}`);
  }
  if (!/url:\s*\S+/.test(yamlText)) issues.push("missing url");
  if (!/spec_path:\s*\S+/.test(yamlText)) issues.push("missing spec_path");
  return issues;
}
const sibIssues = validateSiblingRepos(sibSample);
assert(
  sibIssues.length === 0,
  sibIssues.length === 0 ? "O8 sibling_repos sample shape OK" : `O8 sibling shape: ${sibIssues[0]}`
);
assert(
  validateSiblingRepos("sibling_repos:\n  - url: x\n    role: db\n    spec_path: y").some((i) => /bad role/.test(i)),
  "O8 rejects role outside api|web"
);

// O9 CORS / proxy
assert(/cors_ready|proxy_ready|accepted_blocked/.test(gatesCommon), "O9 gates-common integration matrix");
assert(/server\.proxy|CorsConfigurationSource|vite\.config/.test(quick), "O9 QUICKSTART has Vite/Spring snippets");
assert(/integration_ready|cors_ready/.test(artifactsMd + gatesCommon + huilianTmpl), "O9 docs mention integration_ready/cors");

// O10 frontend scaffold
assert(/mktemp|create vite|create-vite|cp -a/.test(quick), "O10 QUICKSTART mktemp scaffold recipe");
assert(/package\.json/.test(startMd + initMd) && /mktemp|临时目录|配方/.test(startMd + initMd + quick), "O10 init/start tip non-empty dir recipe");

// O11 pinned_deps
assert(/pinned_deps/.test(progressTmpl), "O11 progress.tmpl has pinned_deps");
assert(/pinned_deps/.test(artifactsMd), "O11 artifacts.md has pinned_deps");
assert(/jsdom|Node×jsdom|webidl/.test(verify), "O11 VERIFY mentions Node×jsdom");
const envSampleRel = "scripts/fixtures/env-notes-shape/env_notes.sample.yaml";
assert(exists(envSampleRel), "O11/O14 env-notes-shape sample exists");
const envSample = read(envSampleRel) || "";
assert(/pinned_deps:/.test(envSample), "O11 env sample has pinned_deps");
assert(/name:\s*jsdom/.test(envSample), "O11 env sample pins jsdom");
assert(/version:/.test(envSample) && /reason:/.test(envSample), "O11 env sample has version+reason");

// O12 proto light sketch
assert(/轻量降级|设计笔记/.test(binding) && /草图|主路径/.test(binding + gatesCommon), "O12 binding/gates light sketch");
const protoBridge = read("modes/specs/bridges.md") || "";
assert(/O12|轻量/.test(protoBridge), "O12 proto-bridge documents light sketch");
assert(/不要求.*可点击|草图\+状态机|可点击 HTML/.test(gatesCommon + artifactsMd), "O12 no clickable HTML required in proxy mode");

// O13 session storage
assert(/sessionStorage|localStorage|memory/.test(artifactsMd + huilianTmpl), "O13 session storage enum");
assert(/web\+auth|会话存储/.test(artifactsMd + huilianTmpl), "O13 web+auth session guidance");

// O14 api_base_mode
assert(/api_base_mode/.test(progressTmpl), "O14 progress.tmpl has api_base_mode");
assert(/api_base_mode/.test(artifactsMd), "O14 artifacts.md has api_base_mode");
assert(/proxy\|absolute|proxy.*absolute/.test(progressTmpl + artifactsMd + verify), "O14 proxy|absolute mode");
assert(/api_base_mode:\s*proxy/.test(envSample), "O14 env sample has api_base_mode proxy");

assert(/O8|sibling_repos/.test(changelog || ""), "_log mentions O8/sibling_repos");
assert(logExists("0.2.7-dev"), "_log retains 0.2.7-dev");
assert(/sibling-repos-shape/.test(fixReadme), "fixtures README lists sibling-repos-shape");
assert(/env-notes-shape/.test(fixReadme), "fixtures README lists env-notes-shape");

// =====================================================================
// 0.2.9-dev：M1–M6 monorepo 摩擦优化断言
// =====================================================================

// M1 layout / packages / docs_root
assert(/layout:\s*null|layout: monorepo|layout\|multi_repo|monorepo \| multi_repo/.test(progressTmpl), "M1 progress.tmpl has layout");
assert(/packages:\s*null|packages:/.test(progressTmpl), "M1 progress.tmpl has packages");
assert(/docs_root/.test(progressTmpl), "M1 progress.tmpl has docs_root");
assert(/role:\s*api|api\|web\|other/.test(progressTmpl), "M1 progress.tmpl documents role api|web|other");
assert(/同仓布局|layout \/ packages/.test(huilianTmpl), "M1 回链.tmpl has 同仓布局 section");
assert(/layout|packages|docs_root/.test(startMd), "M1 start.md has layout/packages");
assert(/layout|packages|docs_root/.test(artifactsMd), "M1 artifacts.md has layout/packages");
assert(new RegExp("^layout\\s*:", "m").test(fixProgress), "M1 fixture has layout");
assert(new RegExp("^packages\\s*:", "m").test(fixProgress), "M1 fixture has packages");
assert(new RegExp("^docs_root\\s*:", "m").test(fixProgress), "M1 fixture has docs_root");
assert(new RegExp("^layout\\s*:", "m").test(advProgress), "M1 advance-gate has layout");
assert(new RegExp("^layout\\s*:", "m").test(closeProgress), "M1 close-ready has layout");

const monoSampleRel = "scripts/fixtures/monorepo-layout-shape/layout.sample.yaml";
const monoBadRel = "scripts/fixtures/monorepo-layout-shape/layout-conflict.bad.yaml";
assert(exists(monoSampleRel), "M1 monorepo-layout-shape sample exists");
assert(exists(monoBadRel), "M1 monorepo conflict bad sample exists");
const monoSample = read(monoSampleRel) || "";
const monoBad = read(monoBadRel) || "";
assert(/layout:\s*monorepo/.test(monoSample), "M1 sample layout=monorepo");
assert(/path:\s*backend/.test(monoSample) && /path:\s*frontend/.test(monoSample), "M1 sample has backend+frontend paths");
assert(/role:\s*api/.test(monoSample) && /role:\s*web/.test(monoSample), "M1 sample has api+web roles");
assert(/docs_root:/.test(monoSample), "M1 sample has docs_root");

function extractPackagePaths(yamlText) {
  return [...yamlText.matchAll(/path:\s*["']?([^"'\n]+)/g)].map((m) => m[1].trim());
}
function extractSiblingHints(yamlText) {
  // url + spec_path values as strings that might collide with package paths
  const vals = [];
  for (const m of yamlText.matchAll(/(?:url|spec_path):\s*["']?([^"'\n]+)/g)) {
    vals.push(m[1].trim());
  }
  return vals;
}
function monorepoSiblingConflict(yamlText) {
  if (!/layout:\s*monorepo/.test(yamlText)) return [];
  if (!/sibling_repos:\s*\n\s*-/.test(yamlText) && !/sibling_repos:\s*\[/.test(yamlText)) {
    // null or empty — OK
    if (/sibling_repos:\s*null/.test(yamlText) || !/sibling_repos:/.test(yamlText)) return [];
  }
  const pkgs = extractPackagePaths(yamlText);
  const hints = extractSiblingHints(yamlText.split(/sibling_repos:/)[1] || "");
  const issues = [];
  for (const h of hints) {
    for (const pk of pkgs) {
      // same-remote / same-path collision: hint contains package path as path segment
      if (h === pk || h.endsWith("/" + pk) || h.includes("/" + pk + "/") || h.startsWith("./" + pk) || h === "./" + pk) {
        issues.push(`sibling points at package path ${pk} via ${h}`);
      }
    }
  }
  return issues;
}
assert(
  monorepoSiblingConflict(monoSample).length === 0,
  "M1 good sample has no sibling↔package conflict"
);
assert(
  monorepoSiblingConflict(monoBad).length > 0,
  "M1 bad sample detected sibling↔package conflict"
);
assert(/禁止.*sibling_repos|sibling_repos.*禁止|同仓同路径/.test(progressTmpl + startMd + artifactsMd + gatesCommon), "M1 docs forbid sibling→same-repo packages");

// M2 verify_commands
assert(/verify_commands/.test(progressTmpl), "M2 progress.tmpl has verify_commands");
assert(/verify_commands/.test(artifactsMd), "M2 artifacts.md has verify_commands");
assert(/verify_commands/.test(gatesCommon), "M2 gates-common has verify_commands");
assert(/mvn -f backend|npm --prefix frontend/.test(quick), "M2 QUICKSTART monorepo dual verify example");
assert(/verify_commands:/.test(envSample), "M2 env sample has verify_commands");
assert(/exit 0/.test(artifactsMd + gatesCommon), "M2 L1 requires exit 0 before gates.verify");

// M3 Spec chapters
assert(/## API/.test(artifactsMd) && /## UI/.test(artifactsMd) && /测试矩阵/.test(artifactsMd), "M3 artifacts Spec API/UI/测试矩阵");
assert(/monorepo profile|同仓 monorepo|M3/.test(artifactsMd + gatesCommon), "M3 monorepo profile documented");

// M4 root README SSOT
assert(/根 README|README.*SSOT|backend.*frontend.*启动/.test(close), "M4 close.md root README SSOT L1");
assert(/短链/.test(close + artifactsMd), "M4 short-link rule for package READMEs");

// M5 workdir_policy
assert(/workdir_policy/.test(progressTmpl), "M5 progress.tmpl has workdir_policy");
assert(/workdir_policy/.test(artifactsMd), "M5 artifacts.md has workdir_policy");
assert(/repo_root/.test(progressTmpl + artifactsMd + quick + envSample), "M5 repo_root default");
assert(/workdir_policy:\s*repo_root/.test(envSample), "M5 env sample workdir_policy=repo_root");

// M6 monorepo_bootstrap
assert(/monorepo_bootstrap|剥离/.test(startMd + initMd), "M6 start/init monorepo_bootstrap");
assert(/docs\/runs|superpowers/.test(startMd + initMd) && /剥离|子包/.test(startMd + initMd), "M6 strip package-level docs/runs|superpowers");
assert(/HISTORY-split-repos/.test(startMd + initMd + changelog), "M6 HISTORY-split-repos pointer");

assert(/M1|layout/.test(changelog || ""), "_log mentions M1/layout");
assert(logExists("0.2.8-dev"), "_log retains 0.2.8-dev");
assert(/monorepo-layout-shape/.test(fixReadme), "fixtures README lists monorepo-layout-shape");
assert(/verify_commands|workdir_policy/.test(fixReadme), "fixtures README mentions M2/M5 fields");

// 0.2.10-dev：闸门证据
assert(exists("scripts/gate-evidence.mjs"), "0.2.10 gate-evidence.mjs exists");
const gateEvBin = path.join(skillRoot, "scripts/gate-evidence.mjs");
const FIX_THEATER = "scripts/fixtures/gate-theater-bad";
const THEATER_SLUG = "2026-09-27-gate-theater-bad";
assert(exists(FIX_THEATER), "gate-theater-bad fixture dir exists");
assert(
  exists(`${FIX_THEATER}/docs/runs/active/${THEATER_SLUG}/progress.yaml`),
  "gate-theater-bad progress exists"
);
assert(
  exists(`${FIX_THEATER}/docs/runs/active/${THEATER_SLUG}/回链.md`),
  "gate-theater-bad 回链 exists"
);
assert(/gate-theater-bad/.test(fixReadme), "fixtures README lists gate-theater-bad");
assert(/gate-evidence/.test(verify + readme + skill), "VERIFY/README/SKILL mention gate-evidence");
assert(/证据条|红旗|合理化表/.test(skill || ""), "SKILL has 证据条/红旗/合理化表");
assert(
  /controller_proxy/.test(skill || "") && /不豁免/.test(skill || ""),
  "SKILL: controller_proxy 不豁免证据条"
);
assert(/证据条|gate-evidence/.test(advance || ""), "advance.md mentions 证据条");
assert(/gate-evidence|证据机检/.test(gatesCommon || ""), "gates-common mentions gate-evidence");
assert(/证据条|gate-evidence/.test(quick || ""), "QUICKSTART mentions 证据条");

const fmMatch = (skill || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fm = fmMatch ? fmMatch[1] : "";
assert(
  /Use when/i.test(fm) && !/分诊 S\/B\/F/.test(fm),
  "SKILL description is trigger-only (SDO)"
);
const geAdv = spawnSync(
  process.execPath,
  [gateEvBin, "--cwd", path.join(skillRoot, FIX_ADV), "--slug", ADV_SLUG],
  { encoding: "utf8" }
);
assert(geAdv.status === 0, "gate-evidence on advance-gate exit 0");
assert(/PASS/.test(`${geAdv.stdout || ""}`), "gate-evidence advance-gate prints PASS");

const geClose = spawnSync(
  process.execPath,
  [
    gateEvBin,
    "--cwd",
    path.join(skillRoot, FIX_CLOSE),
    "--slug",
    CLOSE_SLUG,
  ],
  { encoding: "utf8" }
);
assert(geClose.status === 0, "gate-evidence on close-ready exit 0");

const geTheaterFail = spawnSync(
  process.execPath,
  [
    gateEvBin,
    "--cwd",
    path.join(skillRoot, FIX_THEATER),
    "--slug",
    THEATER_SLUG,
  ],
  { encoding: "utf8" }
);
assert(
  geTheaterFail.status !== 0,
  "gate-evidence on gate-theater-bad exits non-zero"
);
const geTheaterExpect = spawnSync(
  process.execPath,
  [
    gateEvBin,
    "--cwd",
    path.join(skillRoot, FIX_THEATER),
    "--slug",
    THEATER_SLUG,
    "--expect-fail",
  ],
  { encoding: "utf8" }
);
assert(
  geTheaterExpect.status === 0,
  "gate-evidence --expect-fail on gate-theater-bad exit 0"
);
assert(
  /EXPECT-FAIL OK|fake transcript|missing.*审核/.test(
    `${geTheaterExpect.stdout || ""}${geTheaterExpect.stderr || ""}`
  ),
  "gate-theater-bad reports fake transcript or missing review"
);
assert(logExists("0.2.10-dev"), "_log has 0.2.10-dev");
assert(/gate-evidence|闸门证据/.test(changelog || ""), "_log mentions gate-evidence");

// 0.2.11-dev：P1
assert(logExists("0.2.11-dev"), "_log has 0.2.11-dev");
assert(/result:\s*pass|result: pass/.test(gatesCommon + skill), "0.2.11 gates require result: pass");
assert(
  /fixture\|auto|user_task_fixture|占位/.test(gatesCommon + skill + (read("templates/回链.md.tmpl") || "")),
  "0.2.11 documents user_task placeholder ban"
);
assert(exists("config/stage-bindings.minimal.yaml"), "stage-bindings.minimal.yaml exists");
assert(
  /minimal/.test(initMdEarly + quick + (manifest || "")),
  "init/QUICKSTART/manifest mention minimal"
);
assert(/点名|不自动加载/.test(quick + readme), "QUICKSTART/README say name-gated");
assert(/status/.test(skill || "") && /advance/.test(skill || ""), "SKILL 模式分流 has status/advance");
assert(
  /勿在本页维护第二份|truncate-contracts\.yaml.*SSOT|机读契约（SSOT）/.test(
    read("modes/specs/flow.md") || ""
  ),
  "binding.md truncate table deferred to yaml SSOT"
);

const FIX_L2FAIL = "scripts/fixtures/gate-l2-fail-bad";
const L2FAIL_SLUG = "2026-09-27-gate-l2-fail-bad";
assert(exists(FIX_L2FAIL), "gate-l2-fail-bad fixture dir exists");
assert(
  exists(`${FIX_L2FAIL}/docs/runs/active/${L2FAIL_SLUG}/审核-design.md`),
  "gate-l2-fail-bad 审核-design exists"
);
assert(/gate-l2-fail-bad/.test(fixReadme), "fixtures README lists gate-l2-fail-bad");

const advProgText = read(`${FIX_ADV}/docs/runs/active/${ADV_SLUG}/progress.yaml`) || "";
const advSpec = nestedScalar(advProgText, "artifacts", "spec");
const advPlan = nestedScalar(advProgText, "artifacts", "plan");
assert(
  advSpec && fs.existsSync(path.join(skillRoot, FIX_ADV, advSpec)),
  "advance-gate artifacts.spec stub exists"
);
assert(
  advPlan && fs.existsSync(path.join(skillRoot, FIX_ADV, advPlan)),
  "advance-gate artifacts.plan stub exists"
);
const closeProg = read(`${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/progress.yaml`) || "";
const closeSpec = nestedScalar(closeProg, "artifacts", "spec");
const closePlan = nestedScalar(closeProg, "artifacts", "plan");
assert(
  closeSpec && fs.existsSync(path.join(skillRoot, FIX_CLOSE, closeSpec)),
  "close-ready artifacts.spec stub exists"
);
assert(
  closePlan && fs.existsSync(path.join(skillRoot, FIX_CLOSE, closePlan)),
  "close-ready artifacts.plan stub exists"
);
assert(
  !/user_task_fixture/.test(read(`${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/回链.md`) || ""),
  "close-ready 回链 no longer uses user_task_fixture"
);
assert(
  /user_task_2026-09-19/.test(read(`${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/回链.md`) || ""),
  "close-ready uses user_task_2026-09-19"
);

const geL2Fail = spawnSync(
  process.execPath,
  [gateEvBin, "--cwd", path.join(skillRoot, FIX_L2FAIL), "--slug", L2FAIL_SLUG],
  { encoding: "utf8" }
);
assert(geL2Fail.status !== 0, "gate-evidence on gate-l2-fail-bad exits non-zero");
assert(
  /result:\s*fail|requires result:\s*pass/i.test(
    `${geL2Fail.stdout || ""}${geL2Fail.stderr || ""}`
  ),
  "gate-l2-fail-bad reports result:fail"
);
const geL2Expect = spawnSync(
  process.execPath,
  [
    gateEvBin,
    "--cwd",
    path.join(skillRoot, FIX_L2FAIL),
    "--slug",
    L2FAIL_SLUG,
    "--expect-fail",
  ],
  { encoding: "utf8" }
);
assert(geL2Expect.status === 0, "gate-evidence --expect-fail on gate-l2-fail-bad exit 0");

const featBin = path.join(skillRoot, "scripts/feature.mjs");
const featGe = spawnSync(
  process.execPath,
  [
    featBin,
    "gate-evidence",
    "--cwd",
    path.join(skillRoot, FIX_ADV),
    "--slug",
    ADV_SLUG,
  ],
  { encoding: "utf8" }
);
assert(featGe.status === 0, "feature.mjs gate-evidence on advance-gate exit 0");
const featClose = spawnSync(
  process.execPath,
  [
    featBin,
    "close-check",
    "--cwd",
    path.join(skillRoot, FIX_CLOSE),
    "--slug",
    CLOSE_SLUG,
  ],
  { encoding: "utf8" }
);
assert(featClose.status === 0, "feature.mjs close-check on close-ready exit 0");
assert(
  /gate-evidence PASS|close-check PASS/.test(`${featClose.stdout || ""}`),
  "close-check output mentions PASS / gate-evidence"
);

const quickPin = read("QUICKSTART.md") || "";
assert(quickPin.includes(PIN), `QUICKSTART pins ${PIN}`);

assert(/stage-bindings\.minimal\.yaml/.test(manifest || ""), "manifest lists stage-bindings.minimal.yaml");

// 0.2.12-dev：P2
assert(logExists("0.2.12-dev"), "_log has 0.2.12-dev");
assert(exists("scripts/lib/progress-shape.mjs"), "scripts/lib/progress-shape.mjs exists");
assert(
  /--cwd/.test(read("scripts/status-scan.mjs") || ""),
  "status-scan.mjs documents --cwd"
);
const scanCwd = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/status-scan.mjs"),
    "--cwd",
    path.join(skillRoot, FIX_GOOD),
  ],
  { encoding: "utf8", cwd: path.join(skillRoot, "scripts") }
);
assert(scanCwd.status === 0, "status-scan --cwd fixture exit 0");
assert(
  (scanCwd.stdout || "").includes(FIX_SLUG),
  "status-scan --cwd prints fixture slug"
);

const tmplEnumIssues = validateProgressEnums(progressTmpl);
assert(
  tmplEnumIssues.length === 0,
  `progress.tmpl enums OK (${tmplEnumIssues.join("; ") || "none"})`
);
assert(
  /pre-impl|pre_impl|命名别名/.test(progressTmpl),
  "progress.tmpl has pre-impl/pre_impl alias note"
);
assert(
  /context_delta|术语增量/.test(progressTmpl + (read("modes/specs/gates.md") || "")),
  "context_delta → 术语增量 documented"
);
assert(
  /术语增量\.md/.test(readLog("0.2.1") || "") && /context-delta/.test(readLog("0.2.1") || ""),
  "_log 0.2.1 footnote 术语增量"
);

const advEnumIssues = validateProgressEnums(advProgText);
assert(
  advEnumIssues.length === 0,
  `advance-gate progress enums OK (${advEnumIssues.join("; ") || "none"})`
);

const monoShapeIssues = validateMonorepoPackages(monoSample);
assert(
  monoShapeIssues.length === 0,
  `monorepo sample packages OK (${monoShapeIssues.join("; ") || "none"})`
);
const monoNullReject = validateMonorepoPackages("layout: monorepo\npackages: null\n");
assert(monoNullReject.length > 0, "monorepo + null packages rejected");

assert(
  /express|Pre-Impl/.test(skill || "") &&
    /inline/.test(skill || "") &&
    /Bounded|B 路径/.test(skill || ""),
  "SKILL rationalization covers express/inline/B"
);
assert(
  !/\bO1[5-9]\b/.test(quick + verify + skill + readme + (changelog || "")),
  "docs must not mention retired cross-repo backlog ids"
);
assert(/specs:/.test(manifest || ""), "manifest has specs:");
assert(
  /交接\.md\.tmpl|术语增量\.md\.tmpl|设计笔记\.md\.tmpl|审核-stage\.md\.tmpl/.test(
    manifest || ""
  ),
  "manifest lists P2 templates"
);
assert(/交接\.md\.tmpl/.test(read("modes/specs/handoff.md") || ""), "handoff.md links 交接 tmpl");
assert(
  /设计笔记\.md\.tmpl/.test(read("modes/specs/flow.md") || ""),
  "binding.md links 设计笔记 tmpl"
);

// 0.2.22+：版本 SSOT；其上 0.2.21 P3/P4 · 0.2.20-dev P0/P1/P2 · 0.2.18 批 E
assert(logExists(PIN), `_log has ${PIN}`);
assert(
  changelogIndex != null && changelogIndex.includes(`${PIN}.md`),
  `CHANGELOG index links ${PIN}`
);

{
  const syncCheck = spawnSync(
    process.execPath,
    [path.join(skillRoot, "scripts/sync-skill-version.mjs"), "--check"],
    { encoding: "utf8" }
  );
  assert(syncCheck.status === 0, "sync-skill-version --check exit 0");
}
for (const ver of [
  "0.2.20-dev",
  "0.2.18-dev",
  "0.2.17-dev",
  "0.2.16-dev",
  "0.2.15-dev",
  "0.2.14-dev",
  "0.2.21",
]) {
  assert(logExists(ver), `_log has ${ver}`);
  assert(
    changelogIndex != null && changelogIndex.includes(`${ver}.md`),
    `CHANGELOG index links ${ver}`
  );
}
assert(/P3\/P4|topic-run\/1|eng_probe/.test(changelog || ""), "_log mentions P3/P4");
assert(/可选接力（工程化仓）|P0\/P1\/P2|协议解耦/.test(changelog || ""), "_log mentions protocol decouple");
assert(/破坏性变更|新限界上下文|默认 skipped/.test(changelog || ""), "_log mentions batch E bridges");
assert(/死链|active\/|merge commit SHA|pr:<n>/.test(changelog || ""), "_log mentions batch E close");
assert(/delivery-checklist|harness refresh|harness_snapshot|refresh-score|eng_snapshot/.test(changelog || ""), "_log mentions batch D / P2 refresh");
assert(/unattended|docs\/runs\/stage-bindings/.test(changelog || ""), "_log mentions batch C");
assert(!/conventions\/repo-layout|_contracts\/repo-layout/.test(changelog || ""), "_log has no P5 repo-layout");
assert(!exists("conventions/repo-layout.md"), "no conventions/repo-layout.md (P5 rolled back)");
assert(/schema:\s*topic-run\/1/.test(progressTmpl), "progress.tmpl has schema topic-run/1");
assert(/eng_land:\s*false/.test(manifest || ""), "manifest eng_land false");
assert(!/harness_land:/.test(manifest || ""), "manifest dropped harness_land key");
const closeMd = read("modes/close.md") || "";
assert(/delivery-checklist\.md/.test(closeMd), "close.md prefers delivery-checklist");
assert(/refresh-score\.mjs/.test(closeMd), "close.md prefers refresh-score.mjs");
assert(/--mode refresh|mode refresh/.test(closeMd), "close.md falls back to harness refresh");
assert(/eng_snapshot/.test(closeMd), "close.md records eng_snapshot");
assert(/回链只写 `eng_snapshot|只写 `eng_snapshot/.test(closeMd), "close.md writes only eng_snapshot");
assert(!/双写.*eng_snapshot|eng_snapshot.*双写|强制双写/.test(closeMd), "close.md no forced dual-write of snapshots");
assert(/harness_snapshot/.test(closeMd), "close.md documents read-compat harness_snapshot");
assert(/verify 之后|不是.*每次.*commit/.test(closeMd), "close.md timing after verify");
assert(/死链改写|runs\/active\//.test(closeMd), "E11 close.md dead-link rewrite");
assert(/merge commit SHA|pr:<n>|squash/.test(closeMd), "E13 close.md ARCHIVE 提交钉死");
assert(!/harness 渲染/.test(closeMd), "close.md no hard harness-render brand");
const bridgesMd = read("modes/specs/bridges.md") || "";
assert(
  /破坏性变更/.test(bridgesMd) && /新限界上下文/.test(bridgesMd) && /默认 skipped/.test(bridgesMd),
  "E9 bridges.md narrow domain-bridge criteria"
);
assert(/docs\/api|契约同步/.test(bridgesMd), "E9 bridges.md REST+docs/api → skipped");
assert(!/harness_meta/.test(bridgesMd), "bridges.md dropped harness_meta literal");
assert(
  /scripts\/agent-config\/sync\.mjs/.test(initMdEarly) && /若存在/.test(initMdEarly),
  "init.md forbids target-repo sync.mjs by path"
);
assert(
  /scripts\/agent-config\/sync\.mjs/.test(rebindMdEarly),
  "rebind.md forbids target-repo sync.mjs by path"
);
{
  const deadDir = fs.mkdtempSync(path.join(os.tmpdir(), "feature-e11-dead-"));
  try {
    const slugDead = CLOSE_SLUG;
    const archRel = path.join("docs", "runs", "archive", slugDead);
    fs.mkdirSync(path.join(deadDir, archRel), { recursive: true });
    fs.cpSync(
      path.join(skillRoot, FIX_CLOSE, "docs", "runs", "archive", slugDead),
      path.join(deadDir, archRel),
      { recursive: true }
    );
    fs.cpSync(
      path.join(skillRoot, FIX_CLOSE, "docs", "superpowers"),
      path.join(deadDir, "docs", "superpowers"),
      { recursive: true }
    );
    const poison = path.join(deadDir, archRel, "回链.md");
    fs.appendFileSync(
      poison,
      `\n- 死链样例：\`docs/runs/active/${slugDead}/progress.yaml\`\n`,
      "utf8"
    );
    const deadRun = spawnSync(
      process.execPath,
      [closeCheckBin, "--cwd", deadDir, "--slug", slugDead],
      { cwd: skillRoot, encoding: "utf8" }
    );
    assert(deadRun.status !== 0, "E11 close-check FAIL on active dead link");
    assert(
      /dead active path/.test(`${deadRun.stdout || ""}${deadRun.stderr || ""}`),
      "E11 close-check reports dead active path"
    );
  } finally {
    fs.rmSync(deadDir, { recursive: true, force: true });
  }
}
{
  const warnDir = fs.mkdtempSync(path.join(os.tmpdir(), "feature-e13-warn-"));
  try {
    const slugW = CLOSE_SLUG;
    fs.cpSync(path.join(skillRoot, FIX_CLOSE), warnDir, { recursive: true });
    fs.mkdirSync(path.join(warnDir, "docs", "superpowers"), { recursive: true });
    fs.writeFileSync(
      path.join(warnDir, "docs", "superpowers", "ARCHIVE.md"),
      `# ARCHIVE\n\n## 已交付主题\n\n| 日期 | 主题 | Spec | Plan | 提交 |\n|---|---|---|---|---|\n| 2026-09-19 | ${slugW} | a | b | feature/branch-tip-only |\n`,
      "utf8"
    );
    const warnRun = spawnSync(
      process.execPath,
      [closeCheckBin, "--cwd", warnDir, "--slug", slugW],
      { cwd: skillRoot, encoding: "utf8" }
    );
    assert(warnRun.status === 0, "E13 branch-tip ARCHIVE warn does not FAIL");
    assert(
      /WARNING|branch tip|提交 column/.test(`${warnRun.stdout || ""}${warnRun.stderr || ""}`),
      "E13 close-check WARNING for non-PR/SHA 提交"
    );
  } finally {
    fs.rmSync(warnDir, { recursive: true, force: true });
  }
}
assert(/可选接力（工程化仓）/.test(skill || ""), "SKILL has optional handoff section");
assert(
  !/与 harness-eng 的配合与互斥/.test(skill || ""),
  "SKILL dropped hard couple heading"
);
assert(/软探测|从不.*land|不阻断/.test(skill || ""), "SKILL soft probe never requires land");
assert(/docs\/runs\/stage-bindings\.yaml/.test(skill || ""), "SKILL mentions target bindings SSOT");
assert(/modes\/specs\/flow/.test(skill || ""), "SKILL links modes/specs/flow");
assert(/modes\/specs\/gates/.test(skill || ""), "SKILL links modes/specs/gates");
assert(/≤6/.test(index) || /≤6 文件/.test(index), "AGENT-INDEX says ≤6");
assert(/eng_probe/.test(startMd), "start.md has eng_probe");
assert(/schema:\s*topic-run\/1/.test(startMd), "start.md writes schema topic-run/1");
assert(/软·不阻断|不阻断/.test(startMd) && /ai_coding_ready/.test(startMd), "start probe soft + ai_coding_ready");
assert(/静默跳过/.test(startMd), "start probe silent without meta");
assert(/unattended/.test(startMd), "start.md has unattended run_mode");
assert(
  /invoke.*inline|inline.*invoke/.test(startMd) && /handoff_policy.*auto|auto/.test(startMd),
  "start unattended central downgrade documented"
);
assert(
  /unattended/.test(progressTmpl),
  "progress.tmpl mentions unattended"
);
assert(
  RUN_MODE_ENUM.has("unattended"),
  "progress-shape RUN_MODE_ENUM includes unattended"
);
assert(
  /lint-pitfalls\.mjs/.test(startMd) && /close_pitfalls:\s*on|close_pitfalls.*on/.test(startMd),
  "start tightens close_pitfalls to on when lint exists"
);
assert(
  /lint-pitfalls\.mjs/.test(bindings || "") || /本主题写 on/.test(bindings || ""),
  "bindings comment documents start tighten to on"
);
assert(/eng_probe/.test(read("modes/resume.md") || ""), "resume.md optional eng_probe top-up");
assert(/eng_probe/.test(read("templates/回链.md.tmpl") || ""), "回链 tmpl uses eng_probe");
assert(/ai_coding_ready/.test(read("QUICKSTART.md") || ""), "QUICKSTART mentions ai_coding_ready soft tip");
assert(/eng_land/.test(skill || ""), "SKILL mentions eng_land");

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (feature-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
