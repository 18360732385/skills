#!/usr/bin/env node
/**
 * feature-eng selfcheck (0.2.4-dev)：最小静态断言。
 * 覆盖：manifest · 模式文件 · 11 绑定键 · 模板 · SKILL 边界 · 禁根 CONTEXT · AGENT-INDEX 链接 · CHANGELOG。
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

const PIN = "0.2.4-dev";

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

// --- manifest ---
const manifest = read("_meta/manifest.yaml");
assert(manifest != null, "manifest.yaml exists");
assert(
  manifest != null && /version:\s*"0\.2\.4-dev"/.test(manifest),
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

// --- mode files ---
for (const f of MODES) {
  assert(exists(f), `mode file ${f}`);
}

// --- 11 binding keys ---
const bindings = read("config/stage-bindings.yaml");
assert(bindings != null, "stage-bindings.yaml exists");
assert(BINDING_KEYS.length === 11, "binding key list length == 11");
for (const k of BINDING_KEYS) {
  assert(
    bindings != null && new RegExp(`^\\s*${k}\\s*:`, "m").test(bindings),
    `binding key ${k}`
  );
}

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
assert(
  skill != null && /写盘权责/.test(skill),
  "SKILL 写盘权责"
);
assert(
  skill != null && /控制器边界/.test(skill),
  "SKILL 控制器边界"
);

// --- no root CONTEXT rule ---
const stages = read("stages.md") || "";
const binding = read("binding.md") || "";
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

// --- AGENT-INDEX linked ---
assert(exists("AGENT-INDEX.md"), "AGENT-INDEX.md exists");
const index = read("AGENT-INDEX.md") || "";
assert(/必读/.test(index), "AGENT-INDEX has 必读");
assert(/按需/.test(index), "AGENT-INDEX has 按需");
assert(
  skill != null && /AGENT-INDEX\.md/.test(skill),
  "SKILL.md links AGENT-INDEX"
);

// --- CHANGELOG ---
const changelog = read("CHANGELOG.md");
assert(changelog != null, "CHANGELOG.md exists");
assert(
  changelog != null && changelog.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);

// --- VERIFY / README smoke pointers ---
assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
assert(verify.includes(PIN), `VERIFY mentions ${PIN}`);
const readme = read("README.md") || "";
assert(/VERIFY\.md/.test(readme), "README mentions VERIFY");
assert(
  /selfcheck\.mjs/.test(readme),
  "README mentions selfcheck.mjs"
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
