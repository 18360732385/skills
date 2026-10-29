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
  const advProgText = ctx.advProgText;
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
  const gateEvBin = path.join(skillRoot, "scripts/gate-evidence.mjs");
  const closeCheckBin = path.join(skillRoot, "scripts/close-check.mjs");

// =====================================================================
// 0.2.26：断言同步（死链清零 · lib 单源 · gate-evidence 加固 · close-check ·
// midstage-l2-bad 夹具 · 门禁清单模板 · 文档口径）
// =====================================================================

// 26-1 死链零引用：根/modes/templates/config/scripts/lib 的 md|yaml|tmpl
// 不得残留「见 … binding.md / gates-common.md / gates-review.md」旧名指引
// （CHANGELOG.md 历史索引、scripts/fixtures/**、selfcheck 自身不在扫描范围）
{
  const DEAD_LINK_RE = /见[^。\n]{0,10}(binding|gates-common|gates-review)(\.md|\b)/;
  const deadHits = [];
  function scanDeadLinks(absDir, relDir, recursive) {
    let ents = [];
    try {
      ents = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      const abs = path.join(absDir, ent.name);
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        if (recursive) scanDeadLinks(abs, rel, recursive);
        continue;
      }
      if (!/\.(md|ya?ml|tmpl)$/i.test(ent.name)) continue;
      if (rel === "CHANGELOG.md") continue; // 历史索引保留旧版描述
      if (abs.endsWith("selfcheck.mjs")) continue; // 自身排除（扩展名已滤，双保险）
      let text = "";
      try {
        text = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      const m = text.match(DEAD_LINK_RE);
      if (m) deadHits.push(`${rel}: ${m[0]}`);
    }
  }
  for (const [relDir, recursive] of [
    ["", false], // 根：仅顶层文件
    ["modes", true],
    ["templates", true],
    ["config", true],
    ["scripts/lib", true],
  ]) {
    scanDeadLinks(path.join(skillRoot, relDir), relDir, recursive);
  }
  assert(
    deadHits.length === 0,
    deadHits.length === 0
      ? "0.2.26 死链零引用（binding/gates-common/gates-review 旧名无残留）"
      : `0.2.26 死链残留 ${deadHits.length} 处: ${deadHits[0]}`
  );
}

// 26-2 lib 单源：progress-shape.mjs 四键导出；两脚本与 selfcheck 均 import lib
{
  const shapeLibSrc = read("scripts/lib/progress-shape.mjs") || "";
  for (const name of [
    "GATE_KEYS",
    "L2_FOR_GATE",
    "PROGRESS_TOP_KEYS",
    "ARTIFACT_KEYS",
  ]) {
    assert(
      shapeLibSrc.includes(`export const ${name}`),
      `0.2.26 lib 单源导出 ${name}`
    );
  }
  const geSrc = read("scripts/gate-evidence.mjs") || "";
  assert(
    /from\s+"\.\/lib\/progress-shape\.mjs"/.test(geSrc) &&
      /GATE_KEYS/.test(geSrc) &&
      /L2_FOR_GATE/.test(geSrc),
    "0.2.26 gate-evidence import lib（GATE_KEYS/L2_FOR_GATE）"
  );
  const ccSrc = read("scripts/close-check.mjs") || "";
  assert(
    /from\s+"\.\/lib\/progress-shape\.mjs"/.test(ccSrc) && /ARTIFACT_KEYS/.test(ccSrc),
    "0.2.26 close-check import lib（ARTIFACT_KEYS）"
  );
  const harnessSrc = read("scripts/selfcheck/harness.mjs") || "";
  assert(
    /from\s+"\.\.\/lib\/progress-shape\.mjs"/.test(harnessSrc) &&
      /GATE_KEYS/.test(harnessSrc) &&
      /ARTIFACT_KEYS/.test(harnessSrc) &&
      /PROGRESS_TOP_KEYS/.test(harnessSrc),
    "0.2.26 selfcheck 自身 import lib（GATE_KEYS/ARTIFACT_KEYS/PROGRESS_TOP_KEYS）"
  );
}

// 26-3/26-4 gate-evidence 中途环机检 + 内联防御
{
  const geSrc = read("scripts/gate-evidence.mjs") || "";
  assert(/STAGE_ORDER/.test(geSrc), "0.2.26 gate-evidence has STAGE_ORDER");
  assert(/passedStage/.test(geSrc), "0.2.26 gate-evidence has passedStage");
  for (const f of [
    "审核-spec.md",
    "审核-testdesign.md",
    "审核-implement.md",
    "审核-domain.md",
  ]) {
    assert(
      geSrc.includes(f),
      `0.2.26 gate-evidence 中途环 L2 字面 ${f}`
    );
  }
  assert(
    geSrc.includes("inline gates mapping not supported"),
    "0.2.26 gate-evidence 内联 gates 防御提示"
  );
}

// 26-5 auth 加固：user_task id 须含数字
assert(
  isLegalAuthorizedBy("user_task_whatever") === false,
  "0.2.26 auth 拒绝无数字 user_task（user_task_whatever）"
);
assert(
  isLegalAuthorizedBy("user_task_2026-09-21") === true,
  "0.2.26 auth 接受含数字 user_task（user_task_2026-09-21）"
);

// 26-6 midstage-l2-bad 负例夹具：形状合法但缺中途环审核文件 → gate-evidence FAIL
{
  const FIX_MIDL2 = "scripts/fixtures/midstage-l2-bad";
  const MIDL2_SLUG = "2026-09-29-midstage-l2-bad";
  assert(exists(FIX_MIDL2), "0.2.26 midstage-l2-bad 夹具目录存在");
  assert(
    exists(`${FIX_MIDL2}/docs/runs/active/${MIDL2_SLUG}/progress.yaml`),
    "0.2.26 midstage-l2-bad progress.yaml 存在"
  );
  assert(
    exists(`${FIX_MIDL2}/docs/runs/active/${MIDL2_SLUG}/回链.md`),
    "0.2.26 midstage-l2-bad 回链.md 存在"
  );
  const midProgress =
    read(`${FIX_MIDL2}/docs/runs/active/${MIDL2_SLUG}/progress.yaml`) || "";
  const midShapeIssues = validateProgressShape(midProgress, "midstage-l2-bad");
  assert(
    midShapeIssues.length === 0,
    midShapeIssues.length === 0
      ? "0.2.26 midstage-l2-bad progress 形状 OK（形状合法的负例）"
      : `0.2.26 midstage-l2-bad shape: ${midShapeIssues[0]}`
  );
  const geMidFail = spawnSync(
    process.execPath,
    [gateEvBin, "--cwd", path.join(skillRoot, FIX_MIDL2), "--slug", MIDL2_SLUG],
    { encoding: "utf8" }
  );
  assert(
    geMidFail.status !== 0,
    "0.2.26 gate-evidence midstage-l2-bad 正向 exit 非 0"
  );
  const geMidOut = `${geMidFail.stdout || ""}${geMidFail.stderr || ""}`;
  assert(/审核-spec/.test(geMidOut), "0.2.26 midstage-l2-bad 报缺 审核-spec");
  assert(
    /审核-testdesign/.test(geMidOut),
    "0.2.26 midstage-l2-bad 报缺 审核-testdesign"
  );
  const geMidExpect = spawnSync(
    process.execPath,
    [
      gateEvBin,
      "--cwd",
      path.join(skillRoot, FIX_MIDL2),
      "--slug",
      MIDL2_SLUG,
      "--expect-fail",
    ],
    { encoding: "utf8" }
  );
  assert(
    geMidExpect.status === 0,
    "0.2.26 gate-evidence --expect-fail midstage-l2-bad exit 0"
  );
}

// 26-7 close-ready：补 审核-implement.md 后中途环机检仍 PASS
{
  const closeImplRel = `${FIX_CLOSE}/docs/runs/archive/${CLOSE_SLUG}/审核-implement.md`;
  assert(exists(closeImplRel), "0.2.26 close-ready 审核-implement.md 存在");
  assert(
    /result:\s*pass/i.test(read(closeImplRel) || ""),
    "0.2.26 close-ready 审核-implement.md result: pass"
  );
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
  assert(geClose.status === 0, "0.2.26 gate-evidence close-ready 正向 exit 0");
}

// 26-8 status-scan needs-close
assert(
  /needs-close/.test(read("scripts/status-scan.mjs") || ""),
  "0.2.26 status-scan has needs-close"
);

// 26-9 门禁清单模板（TEMPLATES 登记见顶部数组）
{
  const gateTmpl = read("templates/门禁清单.md.tmpl");
  assert(gateTmpl != null, "0.2.26 门禁清单.md.tmpl 存在");
  assert(
    gateTmpl != null && gateTmpl.trim().length > 0,
    "0.2.26 门禁清单.md.tmpl 非空"
  );
  assert(
    gateTmpl != null && gateTmpl.includes("{{slug}}"),
    "0.2.26 门禁清单.md.tmpl 含 {{slug}}"
  );
  assert(
    gateTmpl != null && /mech_track/.test(gateTmpl),
    "0.2.26 门禁清单.md.tmpl 含 mech_track"
  );
  assert(
    TEMPLATES.includes("templates/门禁清单.md.tmpl"),
    "0.2.26 TEMPLATES 数组登记 门禁清单.md.tmpl"
  );
}

// 26-10 manifest templates 列表
assert(
  /门禁清单\.md\.tmpl/.test(manifest || ""),
  "0.2.26 manifest templates 含 门禁清单.md.tmpl"
);

// 26-11 handoff 缺省推导序 + status/resume needs-close 口径
assert(
  /缺省推导序/.test(read("modes/specs/flow.md") || ""),
  "0.2.26 flow.md 含 缺省推导序"
);
assert(
  /needs-close/.test(read("modes/status.md") || ""),
  "0.2.26 status.md 含 needs-close"
);
assert(
  /needs-close/.test(read("modes/resume.md") || ""),
  "0.2.26 resume.md 含 needs-close"
);

// 26-12 SKILL description 枚举含 status/rebind（与 SDO 断言兼容）
{
  const fmMatch = (skill || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = fmMatch ? fmMatch[1] : "";
  assert(
    /status/.test(fm) && /rebind/.test(fm),
    "0.2.26 SKILL description 含 status/rebind"
  );
}

// 26-13 reviewer 字段显性化
assert(
  /reviewer:/.test(read("templates/审核-stage.md.tmpl") || ""),
  "0.2.26 审核-stage.md.tmpl 含 reviewer:"
);
assert(
  /reviewer:\s*bound_subagent/.test(read("modes/specs/gates.md") || ""),
  "0.2.26 gates.md Part B 含 reviewer: bound_subagent"
);

// 26-14 QUICKSTART PowerShell 配方（mktemp 既有配方不丢）
assert(
  /New-Item|env:TEMP/.test(quick || ""),
  "0.2.26 QUICKSTART 含 PowerShell 配方（New-Item/env:TEMP）"
);
assert(/mktemp/.test(quick || ""), "0.2.26 QUICKSTART 保留 mktemp 配方");

// 26-15 fixtures README 登记新负例
assert(
  /midstage-l2-bad/.test(fixReadme || ""),
  "0.2.26 fixtures README 登记 midstage-l2-bad"
);
}
