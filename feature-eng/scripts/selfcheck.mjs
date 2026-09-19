#!/usr/bin/env node
/**
 * feature-eng selfcheck (0.2.6-dev)：静态断言 + 夹具行为断言。
 * 覆盖：manifest · modes/ 模式文件 · feature.mjs 薄 CLI · 11 绑定键非空 · example 对齐 · 模板 ·
 * SKILL 边界 · 禁根 CONTEXT · AGENT-INDEX · QUICKSTART · truncate-contracts ·
 * status-scan · close_pitfalls · CHANGELOG · fixtures（init / progress-bad / advance-gate /
 * bindings-bad / close-ready）。
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

const PIN = "0.2.6-dev";

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
  "modes/binding.md",
  "modes/stages.md",
  "modes/artifacts.md",
  "modes/gates-common.md",
  "modes/gates-review.md",
  "modes/domain-bridge.md",
  "modes/proto-bridge.md",
  "modes/handoff.md",
  "modes/README.md",
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
  manifest != null && /version:\s*"0\.2\.6-dev"/.test(manifest),
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
assert(
  manifest != null && /modes_dir:\s*modes\//.test(manifest),
  "manifest modes_dir == modes/"
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
  skill != null && /0\.2\.6-dev/.test(skill),
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
const binding = read("modes/binding.md") || "";
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
const stages = read("modes/stages.md") || "";
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
assert(/0\.2\.6-dev/.test(index), `AGENT-INDEX mentions ${PIN}`);

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

// --- CHANGELOG formal heading ---
const changelog = read("CHANGELOG.md");
assert(changelog != null, "CHANGELOG.md exists");
assert(
  changelog != null && /^##\s+0\.2\.6-dev\b/m.test(changelog),
  "CHANGELOG has ## 0.2.6-dev heading"
);
assert(
  changelog != null && /^##\s+0\.2\.5-dev\b/m.test(changelog),
  "CHANGELOG retains ## 0.2.5-dev heading"
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
assert(/0\.2\.6-dev/.test(readme), `README pins ${PIN}`);
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
const artifactsMd = read("modes/artifacts.md") || "";
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
assert(/调度员不进厨房/.test(helpOut), "feature.mjs --help keeps 调度员不进厨房");
const featModes = spawnSync(process.execPath, [path.join(skillRoot, "scripts/feature.mjs"), "modes"], {
  cwd: skillRoot,
  encoding: "utf8",
});
assert(featModes.status === 0, "feature.mjs modes exit 0");
const modesOut = `${featModes.stdout || ""}`;
assert(/modes\/init\.md/.test(modesOut), "feature.mjs modes lists modes/init.md");
assert(/advance/.test(modesOut) && /close/.test(modesOut), "feature.mjs modes lists advance/close");
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

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (feature-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
