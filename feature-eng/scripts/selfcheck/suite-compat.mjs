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
  const fixReadme = ctx.fixReadme;
  const progressTmpl = ctx.progressTmpl;
  const artifactsMd = ctx.artifactsMd;
  const gatesCommon = ctx.gatesCommon;
  const gatesReview = ctx.gatesReview;
  const startMd = ctx.startMd;
  const initMd = ctx.initMd;
  const envSample = ctx.envSample;
  const monoSample = ctx.monoSample;
  const manifest = ctx.manifest;
  const bindings = ctx.bindings;
  const bindMap = ctx.bindMap;
  const binding = ctx.binding;
  const huilianTmpl = ctx.huilianTmpl;
  const fixProgress = ctx.fixProgress;
  const advProgress = ctx.advProgress;
  const closeProgress = ctx.closeProgress;
  const readScalar = ctx.readScalar;
  const hasNestedKey = ctx.hasNestedKey;
  const validateProgressShape = ctx.validateProgressShape;
  const nestedScalar = ctx.nestedScalar;
  const isIsoTimestamp = ctx.isIsoTimestamp;
  const validateBindingsIntegrity = ctx.validateBindingsIntegrity;

// 0.2.11-dev：P1
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

assert(exists(FIX_L2FAIL), "gate-l2-fail-bad fixture dir exists");
assert(
  exists(`${FIX_L2FAIL}/docs/runs/active/${L2FAIL_SLUG}/审核-design.md`),
  "gate-l2-fail-bad 审核-design exists"
);
assert(/gate-l2-fail-bad/.test(fixReadme), "fixtures README lists gate-l2-fail-bad");

const gateEvBin = path.join(skillRoot, "scripts/gate-evidence.mjs");
const closeCheckBin = path.join(skillRoot, "scripts/close-check.mjs");
const advProgText = read(`${FIX_ADV}/docs/runs/active/${ADV_SLUG}/progress.yaml`) || "";
ctx.advProgText = advProgText;
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
if (logCorpusAvailable) {
  assert(
    /术语增量\.md/.test(readLog("0.2.1") || "") && /context-delta/.test(readLog("0.2.1") || ""),
    "_log 0.2.1 footnote 术语增量"
  );
}

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
{
  const syncCheck = spawnSync(
    process.execPath,
    [path.join(skillRoot, "scripts/sync-skill-version.mjs"), "--check"],
    { encoding: "utf8" }
  );
  assert(syncCheck.status === 0, "sync-skill-version --check exit 0");
}
if (logCorpusAvailable) {
  assert(/P3\/P4|topic-run\/1|eng_probe/.test(changelog || ""), "_log mentions P3/P4");
  assert(/可选接力（工程化仓）|P0\/P1\/P2|协议解耦/.test(changelog || ""), "_log mentions protocol decouple");
  assert(/破坏性变更|新限界上下文|默认 skipped/.test(changelog || ""), "_log mentions batch E bridges");
  assert(/死链|active\/|merge commit SHA|pr:<n>/.test(changelog || ""), "_log mentions batch E close");
  assert(/delivery-checklist|harness refresh|harness_snapshot|refresh-score|eng_snapshot/.test(changelog || ""), "_log mentions batch D / P2 refresh");
  assert(/unattended|docs\/runs\/stage-bindings/.test(changelog || ""), "_log mentions batch C");
  assert(!/conventions\/repo-layout|_contracts\/repo-layout/.test(changelog || ""), "_log has no P5 repo-layout");
}
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
    fs.mkdirSync(path.join(warnDir, "docs", "superpowers", "archive"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(warnDir, "docs", "superpowers", "archive", "ARCHIVE.md"),
      `# ARCHIVE\n\n## 已交付\n\n| 日期 | 用户 | 主题 | Spec | Plan | Commit |\n|---|---|---|---|---|---|\n| 2026-09-19 | fixture | ${slugW} | a | b | feature/branch-tip-only |\n`,
      "utf8"
    );
    const warnRun = spawnSync(
      process.execPath,
      [closeCheckBin, "--cwd", warnDir, "--slug", slugW],
      { cwd: skillRoot, encoding: "utf8" }
    );
    assert(warnRun.status === 0, "E13 branch-tip ARCHIVE warn does not FAIL");
    assert(
      /WARNING|branch tip|Commit column|提交 column/.test(
        `${warnRun.stdout || ""}${warnRun.stderr || ""}`
      ),
      "E13 close-check WARNING for non-PR/SHA Commit"
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

}
