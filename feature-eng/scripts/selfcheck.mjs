#!/usr/bin/env node
/**
 * feature-eng selfcheck (0.2.4)：静态断言。
 * 覆盖：manifest · 模式文件 · 11 绑定键非空 · example 对齐 · 模板 ·
 * SKILL 边界 · 禁根 CONTEXT · AGENT-INDEX · QUICKSTART · truncate-contracts ·
 * status-scan · close_pitfalls · CHANGELOG 正式标题。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const PIN = "0.2.4";

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
  manifest != null && /version:\s*"0\.2\.4"/.test(manifest),
  `manifest version == ${PIN}`
);
assert(
  manifest != null && !/0\.2\.4-dev/.test(manifest),
  "manifest has no 0.2.4-dev"
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
  skill != null && /0\.2\.4/.test(skill) && !/0\.2\.4-dev/.test(skill),
  "SKILL pins 0.2.4"
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
assert(/0\.2\.4/.test(index), "AGENT-INDEX mentions 0.2.4");

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
  changelog != null && /^##\s+0\.2\.4\b/m.test(changelog),
  "CHANGELOG has formal ## 0.2.4 heading"
);
assert(
  changelog != null && changelog.includes(PIN) && !/0\.2\.4-dev/.test(changelog),
  `CHANGELOG pins ${PIN} (no -dev)`
);

// --- VERIFY / README smoke pointers ---
assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
assert(verify.includes(PIN) && !/0\.2\.4-dev/.test(verify), `VERIFY pins ${PIN}`);
assert(/QUICKSTART|truncate-contracts|close_pitfalls|status-scan/.test(verify), "VERIFY covers P1/P2 items");
const readme = read("README.md") || "";
assert(/VERIFY\.md/.test(readme), "README mentions VERIFY");
assert(/selfcheck\.mjs/.test(readme), "README mentions selfcheck.mjs");
assert(/0\.2\.4/.test(readme) && !/0\.2\.4-dev/.test(readme), "README pins 0.2.4");
assert(/QUICKSTART\.md/.test(readme), "README links QUICKSTART");

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (feature-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
