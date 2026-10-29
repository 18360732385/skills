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

  const skill = ctx.skill;
  const quick = ctx.quick;
  const verify = ctx.verify;
  const readme = ctx.readme;
  const close = ctx.close;
  const start = ctx.start;
  const advance = ctx.advance;
  const index = ctx.index;
  const initMdEarly = ctx.initMdEarly;
  const rebindMdEarly = ctx.rebindMdEarly;
  const bindingMdEarly = ctx.bindingMdEarly;
  const manifest = ctx.manifest;
  const bindings = ctx.bindings;
  const bindMap = ctx.bindMap;
  const binding = ctx.binding;

// =====================================================================
// 0.2.5-dev：fixtures + 行为断言（超出「文件存在」）
// =====================================================================
const fixProgressRel = `${FIX_GOOD}/docs/runs/active/${FIX_SLUG}/progress.yaml`;
const fixHuilianRel = `${FIX_GOOD}/docs/runs/active/${FIX_SLUG}/回链.md`;
const fixRunsReadmeRel = `${FIX_GOOD}/docs/runs/README.md`;
const fixBadProgressRel = `${FIX_BAD}/docs/runs/active/bad-missing-fields/progress.yaml`;

// 0.2.26 单源收敛：PROGRESS_TOP_KEYS / ARTIFACT_KEYS / GATE_KEYS / 枚举 Set 改自 lib import（勿在此复制第二份）。
// 枚举校验改用 lib 的 Set（Set 含 null）；空值语义钉住与旧 ENUMS 等价 ——
// null 一律 issue，仅 path + allowNullPath 放行；非空值须命中 Set 的非 null 成员。
const ENUM_SETS = [
  ["path", PATH_ENUM],
  ["run_mode", RUN_MODE_ENUM],
  ["invoke", INVOKE_ENUM],
  ["handoff_policy", HANDOFF_ENUM],
  ["review_policy", REVIEW_ENUM],
  ["chef_mode", CHEF_ENUM],
];

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
  for (const [field, set] of ENUM_SETS) {
    const v = readScalar(text, field);
    if (v === undefined) {
      issues.push(`${label}: cannot read ${field}`);
      continue;
    }
    if (v === null) {
      if (field === "path" && allowNullPath) continue;
      const allowed = [...set].filter((x) => x !== null).join("|");
      issues.push(
        `${label}: ${field} is null (need one of ${allowed})`
      );
      continue;
    }
    if (!set.has(v)) {
      const allowed = [...set].filter((x) => x !== null).join("|");
      issues.push(`${label}: ${field}=${v} not in ${allowed}`);
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
ctx.progressTmpl = progressTmpl;
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
ctx.artifactsMd = artifactsMd;
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
ctx.startMd = startMd;
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
const FIX_BIND_BAD = "scripts/fixtures/bindings-bad";
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
ctx.fixReadme = fixReadme;
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
ctx.initMd = initMd;
assert(/repo_bootstrap|empty-ish|模板文件/.test(initMd + startMd), "O2 init/start empty-ish / template rule");
assert(/LICENSE|\.gitignore/.test(startMd), "O2 start mentions LICENSE/.gitignore");

// O3 authorized_by
const gatesCommon = read("modes/specs/gates.md") || "";
ctx.gatesCommon = gatesCommon;
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
ctx.gatesReview = gatesReview;
assert(/降级|无 Task/.test(gatesReview), "O5 gates-review documents Task downgrade");

// O5b invoke host probe (F-01)
const flowMd = read("modes/specs/flow.md") || "";
assert(/O5b|invoke 宿主探测/.test(startMd), "O5b start.md documents invoke probe");
assert(/strict→inline|strict.*inline/.test(startMd) && /CloudAgent|executor/.test(startMd), "O5b start.md strict→inline CloudAgent/executor");
assert(/禁止静默/.test(startMd) && /invoke/.test(startMd), "O5b forbids silent invoke keep-strict");
assert(/invoke_effective/.test(flowMd), "O5b flow.md pointer has invoke_effective");
assert(/CloudAgent|executor/.test(flowMd), "O5b flow.md documents CloudAgent/executor downgrade");
assert(/invoke：/.test(huilianTmpl) && /O5b/.test(huilianTmpl), "O5b 回链.tmpl has invoke ritual line");
assert(/O5b|CloudAgent|invoke/.test(quick) && /inline/.test(quick), "O5b QUICKSTART mentions invoke downgrade");

// Gate mech_track evidence enum (F-02)
assert(/mech_track/.test(gatesReview) && /local_self_attest/.test(gatesReview), "F-02 gates.md has mech_track local_self_attest");
assert(/无 CI/.test(gatesReview + quick), "F-02 gates/QUICKSTART mention 无 CI");
assert(/local_self_attest/.test(quick), "F-02 QUICKSTART has local_self_attest");
assert(/测试已跑过/.test(gatesReview + quick), "F-02 forbids empty 测试已跑过 self-report");

// F-03 design/spec forbid paste
assert(/粘贴.*forbid|forbid:.*原文/.test(flowMd), "F-03 flow requires paste forbid list");
assert(/未粘贴 forbid|不算过/.test(flowMd), "F-03 flow D fails without forbid paste");

// F-04 gates.proto_confirmed
assert(/proto_confirmed/.test(progressTmpl), "F-04 progress.tmpl has proto_confirmed");
assert(/proto_confirmed/.test(huilianTmpl), "F-04 回链.tmpl has proto_confirmed");
assert(/proto_confirmed/.test(gatesReview), "F-04 gates.md documents proto_confirmed");
assert(
  /proto=entered.*proto_confirmed|proto_confirmed.*entered/.test(
    read("scripts/gate-evidence.mjs") || ""
  ),
  "F-04 gate-evidence requires proto_confirmed when entered"
);

// F-05 B no plan → Go → proto-bridge
assert(/Go 等价|无独立 plan/.test(flowMd + (read("modes/specs/bridges.md") || "")), "F-05 B no-plan Go path documented");
assert(/立即进|禁止空等/.test(flowMd + (read("modes/specs/bridges.md") || "") + gatesReview), "F-05 forbids waiting for ring 5 end");

// F-06 artifacts.implement / pr_url
assert(/implement:\s*null/.test(progressTmpl) && /pr_url:\s*null/.test(progressTmpl), "F-06 progress.tmpl has implement/pr_url");
assert(ARTIFACT_KEYS.includes("implement") && ARTIFACT_KEYS.includes("pr_url"), "F-06 ARTIFACT_KEYS include implement/pr_url");

// F-07 review_effective / same-session L2
assert(/review_effective/.test(startMd + gatesReview + huilianTmpl), "F-07 documents review_effective");
assert(/同会话审核帽|不强制开 Task/.test(startMd + gatesReview), "F-07 accepts same-session L2 without forcing Task");

// F-08 close PR branch / merge refresh
const closeMdP2 = read("modes/close.md") || "";
assert(/pr_branch|契约同步:\s*pr_branch/.test(closeMdP2), "F-08 close.md has 契约同步 pr_branch");
assert(/merge 后再|PR 未合入/.test(closeMdP2), "F-08 close.md merge-then-refresh");

// F-09 pitfalls hygiene is target-repo
assert(/→ Pn|目标仓.*卫生|不是.*feature-eng/.test(closeMdP2), "F-09 pitfalls → Pn is target-repo hygiene");

// F-10 express same ISO stamp accepted
assert(/相同 ISO|同戳/.test(startMd + gatesReview), "F-10 express same ISO / 同戳 accepted");

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

if (logCorpusAvailable) {
  assert(/O1|chef_mode/.test(changelog || ""), "_log mentions O1/chef_mode");
}

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
ctx.envSample = envSample;
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

if (logCorpusAvailable) {
  assert(/O8|sibling_repos/.test(changelog || ""), "_log mentions O8/sibling_repos");
}
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
ctx.monoSample = monoSample;
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

if (logCorpusAvailable) {
  assert(/M1|layout/.test(changelog || ""), "_log mentions M1/layout");
}
assert(/monorepo-layout-shape/.test(fixReadme), "fixtures README lists monorepo-layout-shape");
assert(/verify_commands|workdir_policy/.test(fixReadme), "fixtures README mentions M2/M5 fields");
// 0.2.10-dev：闸门证据
assert(exists("scripts/gate-evidence.mjs"), "0.2.10 gate-evidence.mjs exists");
const gateEvBin = path.join(skillRoot, "scripts/gate-evidence.mjs");
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
if (logCorpusAvailable) {
  assert(/gate-evidence|闸门证据/.test(changelog || ""), "_log mentions gate-evidence");
}
  Object.assign(ctx, {
    readScalar,
    hasNestedKey,
    validateProgressShape,
    nestedScalar,
    isIsoTimestamp,
    validateBindingsIntegrity,
    huilianTmpl,
    fixProgress,
    advProgress,
    closeProgress,
    fixProgressRel,
    fixHuilianRel,
    fixRunsReadmeRel,
    fixBadProgressRel,
    advProgressRel,
    advHuilianRel,
    closeProgressRel,
    closeHuilianRel,
    fixHuilian,
    advHuilian,
    closeHuilian,
    featureCli,
    scanBin,
  });
}
