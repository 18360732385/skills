#!/usr/bin/env node
/**
 * feature-eng selfcheck (0.2.5-dev)：静态断言 + 夹具行为断言。
 * 覆盖：manifest · 模式文件 · 11 绑定键非空 · example 对齐 · 模板 ·
 * SKILL 边界 · 禁根 CONTEXT · AGENT-INDEX · QUICKSTART · truncate-contracts ·
 * status-scan · close_pitfalls · CHANGELOG · fixtures（init 骨架 / progress 形状）。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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

const PIN = "0.2.5-dev";

const MODES = [
  "init.md",
  "rebind.md",
  "start.md",
  "resume.md",
  "status.md",
  "advance.md",
  "close.md",
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
  manifest != null && /version:\s*"0\.2\.5-dev"/.test(manifest),
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

// --- mode files ---
for (const f of MODES) {
  assert(exists(f), `mode file ${f}`);
}

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
  skill != null && /0\.2\.5-dev/.test(skill),
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
const binding = read("binding.md") || "";
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
const start = read("start.md") || "";
assert(
  /绑定 skill 可调起|预检/.test(start),
  "start.md references 预检/可调起"
);
const advance = read("advance.md") || "";
assert(
  /绑定 skill 可调起|预检 A/.test(advance),
  "advance.md references 预检"
);

// --- no root CONTEXT rule ---
const stages = read("stages.md") || "";
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
assert(/0\.2\.5-dev/.test(index), `AGENT-INDEX mentions ${PIN}`);

// --- status-scan ---
assert(exists("scripts/status-scan.mjs"), "status-scan.mjs exists");
const statusScan = read("scripts/status-scan.mjs") || "";
assert(
  /docs\/runs\/active/.test(statusScan),
  "status-scan looks at docs/runs/active"
);
assert(/slug/.test(statusScan) && /stage/.test(statusScan), "status-scan prints slug/stage");
const statusMd = read("status.md") || "";
assert(
  /status-scan\.mjs/.test(statusMd),
  "status.md links status-scan.mjs"
);

// --- close_pitfalls docs ---
const close = read("close.md") || "";
assert(/close_pitfalls/.test(close), "close.md documents close_pitfalls");
assert(
  /\boff\b/.test(close) && /\boptional\b/.test(close) && /\bon\b/.test(close),
  "close.md has off|optional|on"
);

// --- CHANGELOG formal heading ---
const changelog = read("CHANGELOG.md");
assert(changelog != null, "CHANGELOG.md exists");
assert(
  changelog != null && /^##\s+0\.2\.5-dev\b/m.test(changelog),
  "CHANGELOG has ## 0.2.5-dev heading"
);
assert(
  changelog != null && /^##\s+0\.2\.4\b/m.test(changelog),
  "CHANGELOG retains ## 0.2.4 heading"
);
assert(
  changelog != null && changelog.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);

// --- VERIFY / README smoke pointers ---
assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
assert(verify.includes(PIN), `VERIFY pins ${PIN}`);
assert(/fixture|夹具|行为/.test(verify), "VERIFY mentions fixtures/behavioral checks");
assert(/QUICKSTART|truncate-contracts|close_pitfalls|status-scan/.test(verify), "VERIFY covers P1/P2 items");
const readme = read("README.md") || "";
assert(/VERIFY\.md/.test(readme), "README mentions VERIFY");
assert(/selfcheck\.mjs/.test(readme), "README mentions selfcheck.mjs");
assert(/0\.2\.5-dev/.test(readme), `README pins ${PIN}`);
assert(/QUICKSTART\.md/.test(readme), "README links QUICKSTART");


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
  "stage",
  "domain",
  "proto",
  "artifacts",
  "tasks",
  "gates",
  "env_verified",
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
const artifactsMd = read("artifacts.md") || "";
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
const startMd = read("start.md") || "";
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


// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (feature-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
