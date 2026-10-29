export function run(ctx) {
  const {
    assert, read, exists, skillRoot, PIN, VER_RE,
    path, fs, os, spawnSync,
    isFakeChatTranscriptPlaceholder, isLegalAuthorizedBy,
    RUN_MODE_ENUM, PATH_ENUM, INVOKE_ENUM, HANDOFF_ENUM, REVIEW_ENUM, CHEF_ENUM,
    PROGRESS_TOP_KEYS, ARTIFACT_KEYS, GATE_KEYS,
    validateProgressEnums, validateMonorepoPackages,
    MODES, MODE_EXTRAS, FLAT_SPEC_LEAKS, ROOT_MODE_LEAKS, BINDING_KEYS, TEMPLATES, stageSkillMap,
    FIX_GOOD, FIX_BAD, FIX_SLUG, FIX_ADV, ADV_SLUG, FIX_CLOSE, CLOSE_SLUG,
    FIX_THEATER, THEATER_SLUG, FIX_L2FAIL, L2FAIL_SLUG, FIX_MID, MID_SLUG,
    logCorpusAvailable, changelog, changelogIndex, CHANGELOG_INDEXED, RETAINED_LOGS,
    checkLogs, logRootPresent, logExists, readLog,
  } = ctx;

// --- manifest ---
const manifest = read("_meta/manifest.yaml");
ctx.manifest = manifest;
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
ctx.bindings = bindings;
assert(bindings != null, "stage-bindings.yaml exists");
assert(BINDING_KEYS.length === 11, "binding key list length == 11");
const bindMap = stageSkillMap(bindings);
ctx.bindMap = bindMap;
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
ctx.skill = skill;
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
ctx.binding = binding;
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
ctx.start = start;
assert(
  /绑定 skill 可调起|预检/.test(start),
  "start.md references 预检/可调起"
);
const advance = read("modes/advance.md") || "";
ctx.advance = advance;
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
ctx.index = index;
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
ctx.quick = quick;
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
ctx.close = close;
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
// --- VERIFY / README smoke pointers ---
assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
ctx.verify = verify;
assert(verify.includes(PIN), `VERIFY pins ${PIN}`);
assert(/fixture|夹具|行为/.test(verify), "VERIFY mentions fixtures/behavioral checks");
assert(/QUICKSTART|truncate-contracts|close_pitfalls|status-scan/.test(verify), "VERIFY covers P1/P2 items");
const readme = read("README.md") || "";
ctx.readme = readme;
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
ctx.initMdEarly = initMdEarly;
const rebindMdEarly = read("modes/rebind.md") || "";
ctx.rebindMdEarly = rebindMdEarly;
const bindingMdEarly = read("modes/specs/flow.md") || "";
ctx.bindingMdEarly = bindingMdEarly;
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
}
