/**
 * 0.5.x selfcheck suite (0.5.2–0.5.10).
 * Invoked from scripts/selfcheck.mjs via runChecks05(helpers).
 */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { buildReportUi } from "../report-ui.mjs";
import {
  applyStrictGateDefaults,
  applyGoldGateDefaults,
  applyGoldCoverageDefaults,
  evaluateAiCodingGate,
  countHarnessTodos,
} from "../ai-coding-gate.mjs";
import { parseDomainsYaml, resolveScoreDomains, expandDomainPackEntries, parseDomainPacksYaml, defaultContractDomains, knownContractDomainIds } from "../domains.mjs";
import {
  HARNESS_META_CANONICAL,
  MCP_USAGE_GUIDE_CANONICAL,
  findHarnessMetaFile,
  harnessMetaExists,
  migrateHarnessMetaIfNeeded,
  findMcpUsageGuideFile,
  migrateMcpUsageGuideIfNeeded,
} from "../harness-meta.mjs";
import { scanSignals } from "../detect-signals.mjs";
import { HOOK_DEFS } from "../hooks-checks.mjs";
import { isGeneratedHostPath, resolveLandAgentConfig } from "../../harness.mjs";

export function runChecks05({ skillRoot, docPath, readDoc, assert, runNode }) {
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const handbookMd = fs.readFileSync(path.join(skillRoot, "guide", "使用手册.md"), "utf8");
  const quickstartMd = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  const glossary = readDoc("glossary.md");
  const ladderMd = readDoc("ladder.md");
  const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
// --- 0.5.2 static: L5 配置 SSOT 管线 / hooks 家族 / pitfalls 工程化 ---
{
  // L5 模板包存在性 + 去域化
  for (const rel of [
    "templates/agent-config/README.md.tmpl",
    "templates/agent-config/sync.mjs.tmpl",
    "templates/agent-config/hooks/hooks.config.json.tmpl",
    "templates/agent-config/mcp/servers.example.json",
    "templates/agent-config/settings.json.tmpl",
  ]) {
    assert(fs.existsSync(path.join(skillRoot, rel)), `L5 template exists: ${rel}`);
  }
  const syncTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"),
    "utf8"
  );
  assert(/\{\{AI_TOOLS_JSON\}\}/.test(syncTmpl), "sync.mjs.tmpl driven by AI_TOOLS_JSON");
  assert(/--check/.test(syncTmpl), "sync.mjs.tmpl has --check drift mode");
  assert(!/sms-ai|juneyaoair/.test(syncTmpl), "sync.mjs.tmpl de-domainized");

  // hooks 家族模板存在性 + 去域化 + 占位
  const gateTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/git-commit-soft-gate.js.tmpl"),
    "utf8"
  );
  assert(/\{\{CONTRACT_CHECKS_JS\}\}/.test(gateTmpl), "extended gate has CONTRACT_CHECKS_JS");
  assert(/\{\{DB_MIGRATION_DIR\}\}/.test(gateTmpl), "extended gate has DB_MIGRATION_DIR");
  assert(/\{\{OPENAPI_BRIDGE_TIP\}\}/.test(gateTmpl), "extended gate has OPENAPI_BRIDGE_TIP");
  assert(!/sms-ai|juneyao/i.test(gateTmpl), "extended gate de-domainized (no sms-ai/juneyao)");
  assert(/--git/.test(gateTmpl), "extended gate supports --git mode");
  const guardTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/mcp-mysql-guard.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MYSQL_GUARD_SERVERS\}\}/.test(guardTmpl), "mysql-guard has MYSQL_GUARD_SERVERS");
  assert(!/sms-ai|P21/.test(guardTmpl), "mysql-guard de-domainized");
  const afterEditTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/after-edit-reminder.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MIGRATION_NAME_RE\}\}/.test(afterEditTmpl), "after-edit has MIGRATION_NAME_RE");
  const stopTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/stop-delivery-checklist.js.tmpl"),
    "utf8"
  );
  assert(/\{\{MIGRATION_ENVS\}\}/.test(stopTmpl), "stop-checklist has MIGRATION_ENVS");
  assert(
    !/\bfollowup_message\s*:/.test(stopTmpl),
    "stop-checklist must not emit followup_message (no auto-continue)"
  );
  assert(
    /stderr\.write|process\.stderr/.test(stopTmpl),
    "stop-checklist observe-only via stderr"
  );
  assert(
    /不要 git commit/.test(stopTmpl),
    "stop-checklist reminds not to commit without user confirm"
  );
  const adapterTmpl050 = fs.readFileSync(
    path.join(skillRoot, "templates/hooks/claude-adapter.js"),
    "utf8"
  );
  assert(
    /"stop-check"[\s\S]*?fromReply:\s*\(\)\s*=>\s*\(\{\}\)/.test(adapterTmpl050),
    "claude-adapter stop-check always returns {}"
  );
  assert(
    !/"stop-check"[\s\S]*?decision:\s*"block"/.test(adapterTmpl050),
    "claude-adapter stop-check must not decision:block"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/claude-adapter.js")),
    "claude-adapter.js template"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/hooks.json.tmpl")),
    "hooks.json.tmpl (dynamic events)"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "templates/hooks/hooks.json")),
    "static hooks.json removed"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/claude-settings.hooks.json.tmpl")),
    "claude-settings.hooks.json.tmpl"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "templates/hooks/claude-settings.hooks.json")),
    "static claude-settings.hooks.json removed"
  );

  // 机制层
  const render050 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/L5:\s*5/.test(render050), "render LADDER_ORD has L5");
  assert(/when_agent_config/.test(render050), "render supports when_agent_config");
  assert(/buildHookPlaceholders/.test(render050), "render computes hook placeholders");
  assert(/"agent_config"/.test(render050), "harness-meta managed key agent_config");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs")),
    "lib/hooks-checks.mjs"
  );
  const hooksLib = fs.readFileSync(
    path.join(skillRoot, "scripts/lib/hooks-checks.mjs"),
    "utf8"
  );
  assert(/HOOK_DEFS/.test(hooksLib) && /commit-gate-extended/.test(hooksLib), "hooks lib registry");
  assert(/TRAE_STYLE/.test(hooksLib), "hooks lib has TRAE_STYLE distinct from CLAUDE_STYLE");
  assert(
    HOOK_DEFS["commit-gate"].events.trae.matcher.includes("RunCommand"),
    "HOOK_DEFS trae commit-gate matcher includes RunCommand"
  );
  assert(
    HOOK_DEFS["commit-gate-extended"].events.trae.matcher.includes("RunCommand"),
    "HOOK_DEFS trae commit-gate-extended matcher includes RunCommand"
  );
  assert(
    HOOK_DEFS["commit-gate"].events.claude.matcher === "Bash" &&
      HOOK_DEFS["commit-gate"].events.qoder.matcher === "Bash" &&
      HOOK_DEFS["commit-gate"].events.workbuddy.matcher === "Bash",
    "Claude/Qoder/WorkBuddy commit-gate matcher stays Bash"
  );
  assert(
    HOOK_DEFS["commit-gate-extended"].events.claude.matcher === "Bash" &&
      HOOK_DEFS["commit-gate-extended"].events.qoder.matcher === "Bash",
    "Claude/Qoder extended gate matcher stays Bash"
  );
  const domYaml050 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/hook_code:/.test(domYaml050) && /hook_docs:/.test(domYaml050), "domains.yaml hook sections");
  assert(!/sms-ai/.test(domYaml050), "domains.yaml hook sections de-domainized");
  const man050 = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/manifest.yaml"),
    "utf8"
  );
  assert(/id:\s*agent-config-sync/.test(man050), "manifest has agent-config-sync");
  assert(/id:\s*agent-config-hooks-config/.test(man050), "manifest has agent-config-hooks-config");
  assert(/id:\s*pitfalls-lint/.test(man050), "manifest has pitfalls-lint");
  assert(/when_agent_config:\s*false/.test(man050), "manifest direct-wiring entries L5-exclusive");
  const q050 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_AGENT_CONFIG/.test(q050), "questions has Q_AGENT_CONFIG");
  assert(/Q_HOOKS_FAMILY/.test(q050), "questions has Q_HOOKS_FAMILY");
  assert(/value:\s*L5/.test(q050), "Q_LADDER has L5 option");
  const metaTmpl050 = fs.readFileSync(
    path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"),
    "utf8"
  );
  assert(/agent_config:\s*\{\{AGENT_CONFIG\}\}/.test(metaTmpl050), "meta tmpl agent_config field");
  const ladder050 = readDoc("ladder.md");
  assert(/L5/.test(ladder050) && /配置 SSOT 管线/.test(ladder050), "ladder has L5 row");
  const gloss050 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/配置 SSOT 管线/.test(gloss050), "glossary L5");
  assert(/hooks 家族/.test(gloss050), "glossary hooks family");
  assert(/pitfalls lint/.test(gloss050), "glossary pitfalls lint");
  const det050 = readDoc("detect.md");
  assert(/S_AGENT_CONFIG/.test(det050) && /S_MULTI_TOOL/.test(det050), "detect L5 signals");
  const rp050 = readDoc("recommended-profile.md");
  assert(/agent_config/.test(rp050) && /hooks_family/.test(rp050), "recommended-profile L5 rows");

  // pitfalls 工程化
  const pitTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/agent-kb/pitfalls.md"),
    "utf8"
  );
  assert(/触发路径\/关键词/.test(pitTmpl), "pitfalls tmpl 7-col header");
  assert(/## 路径速查/.test(pitTmpl) && /## 已根治留档/.test(pitTmpl), "pitfalls tmpl sections");
  assert(/\{\{PITFALL_DOMAINS\}\}/.test(pitTmpl), "pitfalls tmpl domains placeholder");
  const lintTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/lint-pitfalls.mjs.tmpl"),
    "utf8"
  );
  assert(/\{\{PITFALL_DOMAINS\}\}/.test(lintTmpl), "lint tmpl domains placeholder");
  assert(!/"Maven"/.test(lintTmpl), "lint tmpl default vocab de-domainized");
  const r19 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/19-agent-kb.mdc.tmpl"),
    "utf8"
  );
  assert(/lint-pitfalls\.mjs/.test(r19), "rule19 requires lint run");
  assert(/三问/.test(r19), "rule19 has 三问 timing");
  const r00050 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/00-project-docs-overview.mdc.tmpl"),
    "utf8"
  );
  assert(/路径速查/.test(r00050), "rule00 pitfalls query protocol");
  assert(/sync\.mjs/.test(r00050), "rule00 agent-config commit gate line");
  assert(/生成物勿手改/.test(r00050), "rule00 generated-artifacts rule");
  const conflict050 = readDoc("conflict-policy.md");
  assert(/agent_config/.test(conflict050), "conflict-policy L5 rows");
  const upg050 = readDoc("upgrade.md");
  assert(/0\.4\.0 → 0\.5\.0/.test(upg050), "upgrade has 0.4.0 → 0.5.0 path");
  assert(/0\.5\.0 → 0\.5\.1/.test(upg050), "upgrade has 0.5.0 → 0.5.1 path");
  assert(/0\.5\.1 → 0\.5\.2/.test(upg050), "upgrade has 0.5.1 → 0.5.2 path");
  assert(/0\.5\.2 → 0\.5\.3/.test(upg050), "upgrade has 0.5.2 → 0.5.3 path");
  assert(/0\.5\.3 → 0\.5\.4/.test(upg050), "upgrade has 0.5.3 → 0.5.4 path");
  assert(/0\.5\.4 → 0\.5\.5/.test(upg050), "upgrade has 0.5.4 → 0.5.5 path");
  assert(/0\.5\.5 → 0\.5\.6/.test(upg050), "upgrade has 0.5.5 → 0.5.6 path");
  assert(/0\.5\.6 → 0\.5\.7/.test(upg050), "upgrade has 0.5.6 → 0.5.7 path");
  assert(/0\.5\.7 → 0\.5\.8/.test(upg050), "upgrade has 0.5.7 → 0.5.8 path");
  assert(/0\.5\.8 → 0\.5\.9/.test(upg050), "upgrade has 0.5.8 → 0.5.9 path");
  assert(/0\.5\.9 → 0\.5\.10/.test(upg050), "upgrade has 0.5.9 → 0.5.10 path");
  assert(/0\.5\.10 → 0\.6\.0/.test(upg050), "upgrade has 0.5.10 → 0.6.0 path");
  assert(/反向拷贝/.test(upg050), "upgrade MATURE adopt L5 reverse-copy");
  const audit050 = readDoc("audit-report.md");
  assert(/sync\.mjs --check/.test(audit050), "audit drift anti-pattern");
  assert(/pitfalls 未过 lint/.test(audit050), "audit pitfalls-lint anti-pattern");
  const aiTools050 = readDoc("ai-tools.md");
  assert(/hooks 家族/.test(aiTools050), "ai-tools hooks family section");
  assert(/配置 SSOT 管线/.test(aiTools050), "ai-tools L5 section");
  assert(/协议族/.test(aiTools050), "ai-tools protocol family section");
  assert(/\.qoder\/settings\.json/.test(aiTools050), "ai-tools qoder settings hooks");
  assert(/\.trae\/hooks\.json/.test(aiTools050), "ai-tools trae hooks.json");
  assert(/workbuddy/.test(aiTools050) && /全家桶|settings\.json/.test(aiTools050), "ai-tools workbuddy family");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/qoder-settings.hooks.json.tmpl")),
    "qoder-settings.hooks.json.tmpl"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/trae-hooks.json.tmpl")),
    "trae-hooks.json.tmpl"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/codebuddy-settings.hooks.json.tmpl")),
    "codebuddy-settings.hooks.json.tmpl"
  );
  assert(/HOOKS_QODER_GROUPS/.test(manifest), "manifest HOOKS_QODER_GROUPS");
  assert(/HOOKS_TRAE_GROUPS/.test(manifest), "manifest HOOKS_TRAE_GROUPS");
  assert(/HOOKS_CODEBUDDY_GROUPS/.test(manifest), "manifest HOOKS_CODEBUDDY_GROUPS");
  assert(
    fs.existsSync(path.join(skillRoot, "scripts/lib/mcp-paths.mjs")),
    "mcp-paths.mjs"
  );
  assert(fs.existsSync(docPath("sync-hosts.md")), "sync-hosts.md");
  for (const a of ["cursor", "claude", "qoder", "trae", "workbuddy", "codex"]) {
    assert(
      fs.existsSync(path.join(skillRoot, `templates/ai-tools/adapters/${a}.md`)),
      `adapter ${a}.md`
    );
  }
}

// --- 0.5.2 runtime: L4 hooks 家族直渲 + L5 render→sync --check + lint-pitfalls 好坏例 ---
{
  const basePlaceholders = {
    REPO_NAME: "demo",
    REPO_DESC: "demo",
    DATE: "2026-08-31",
    AGENTS_VARIANT: "solo",
    LADDER_TARGET: "L4",
    GLOB_PROFILE: "wide",
    LAST_MODE: "land",
    MODULE_DIRS: "",
    CODE_PREFIXES: "src/,apps/",
    COMMAND_TEST: "echo test",
    COMMAND_BUILD: "echo build",
    GLOB_API: "**/controller/**,docs/api/**",
    GLOB_FUNC: "**/src/**,docs/func/**",
    GLOB_DB: "**/db/**,docs/db/**",
    GLOB_JOBS: "docs/jobs/**",
    GLOB_KB: "docs/agent-kb/**",
    GLOB_SUPERPOWERS: "docs/superpowers/**",
    GLOB_AI_TOOLS: ".cursor/**",
    GLOB_OBSERVABILITY: "**/src/**",
    GLOB_FRONTEND: "apps/**",
    STACK_BADGES: "Java",
    PROJECT_NAME: "demo",
    PROJECT_DESC: "demo",
  };
  const family = ["commit-gate-extended", "mysql-guard", "after-edit", "stop-checklist"];

  // A) 非 L5：hooks 家族直渲
  const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), "harness-050-l4-"));
  try {
    const pA = path.join(tmpA, "params.json");
    fs.writeFileSync(
      pA,
      JSON.stringify({
        ladder: "L4",
        domains: ["func", "api", "db"],
        ai_tools: ["cursor", "claude", "qoder", "trae", "workbuddy"],
        agents_variant: "solo",
        hooks_family: family,
        expandFromManifest: true,
        placeholders: basePlaceholders,
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpA,
      "--params",
      pA,
    ]);
    assert(r.status === 0, "0.5.2 L4 render exits 0");
    const hooksJson = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".cursor/hooks.json"), "utf8")
    );
    assert(
      JSON.stringify(hooksJson).includes("git-commit-soft-gate.js"),
      "L4 hooks.json wires extended gate"
    );
    assert(
      hooksJson.hooks.beforeMCPExecution && hooksJson.hooks.afterFileEdit && hooksJson.hooks.stop,
      "L4 hooks.json wires family events"
    );
    const gateJs = fs.readFileSync(
      path.join(tmpA, ".cursor/hooks/git-commit-soft-gate.js"),
      "utf8"
    );
    assert(/id: "api"/.test(gateJs) && /id: "db"/.test(gateJs), "CONTRACT_CHECKS has selected domains");
    assert(!/\{\{[A-Z]/.test(gateJs), "extended gate no unresolved placeholders");
    for (const f of [
      ".cursor/hooks/git-commit-soft-gate.js",
      ".cursor/hooks/mcp-mysql-guard.js",
      ".cursor/hooks/after-edit-reminder.js",
      ".cursor/hooks/stop-delivery-checklist.js",
      ".claude/hooks/claude-adapter.js",
      ".qoder/hooks/claude-adapter.js",
      ".trae/hooks/claude-adapter.js",
      ".codebuddy/hooks/claude-adapter.js",
    ]) {
      assert(fs.existsSync(path.join(tmpA, f)), `L4 rendered ${f}`);
      const c = runNode(["--check", path.join(tmpA, f)]);
      assert(c.status === 0, `node --check ${f}`);
    }
    assert(
      !fs.existsSync(path.join(tmpA, ".cursor/hooks/superpowers-commit-gate.js")),
      "basic gate skipped when extended selected"
    );
    assert(
      !fs.existsSync(path.join(tmpA, "docs/agent-config")),
      "L4 without agent_config has no SSOT dir"
    );
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".claude/settings.json"), "utf8")
    );
    assert(
      JSON.stringify(settings).includes("claude-adapter.js"),
      "claude settings wired via adapter"
    );
    const qoderSettings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".qoder/settings.json"), "utf8")
    );
    assert(
      qoderSettings.hooks && qoderSettings.hooks.PreToolUse,
      "qoder settings uses Claude-style PreToolUse"
    );
    assert(
      !fs.existsSync(path.join(tmpA, ".qoder/hooks.json")),
      "qoder must not get Cursor-style hooks.json"
    );
    const traeHooks = JSON.parse(fs.readFileSync(path.join(tmpA, ".trae/hooks.json"), "utf8"));
    assert(traeHooks.hooks && traeHooks.hooks.PreToolUse, "trae hooks.json Claude-style");
    const traeL4Gate = (traeHooks.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    assert(
      traeL4Gate && String(traeL4Gate.matcher || "").includes("RunCommand"),
      "L4 Trae commit-gate matcher includes RunCommand"
    );
    const claudeL4Gate = (settings.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    const qoderL4Gate = (qoderSettings.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    assert(
      claudeL4Gate && claudeL4Gate.matcher === "Bash",
      "L4 Claude commit-gate matcher stays Bash"
    );
    assert(
      qoderL4Gate && qoderL4Gate.matcher === "Bash",
      "L4 Qoder commit-gate matcher stays Bash"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".qoder/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to qoder .md"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".trae/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to trae .md"
    );
    const traeL4Rule = fs.readFileSync(
      path.join(tmpA, ".trae/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(
      /^---\r?\n[\s\S]*?alwaysApply:\s*true[\s\S]*?\r?\n---/.test(traeL4Rule),
      "L4 Trae mirrored rule keeps alwaysApply frontmatter"
    );
    const traeL4ApiPath = path.join(tmpA, ".trae/rules/12-api-doc-sync-rules.md");
    assert(fs.existsSync(traeL4ApiPath), "L4 mirrors api-doc-sync to trae .md");
    const traeL4Api = fs.existsSync(traeL4ApiPath)
      ? fs.readFileSync(traeL4ApiPath, "utf8")
      : "";
    assert(
      /^---\r?\n[\s\S]*?globs:\s*.+[\s\S]*?\r?\n---/.test(traeL4Api),
      "L4 Trae mirrored rule keeps globs frontmatter"
    );
    const qoderL4Rule = fs.readFileSync(
      path.join(tmpA, ".qoder/rules/00-project-docs-overview.md"),
      "utf8"
    );
    const claudeL4Rule = fs.readFileSync(
      path.join(tmpA, ".claude/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(!/^---/.test(qoderL4Rule), "L4 Qoder still strips frontmatter");
    assert(!/^---/.test(claudeL4Rule), "L4 Claude still strips frontmatter");
    assert(
      fs.existsSync(path.join(tmpA, ".claude/rules/00-project-docs-overview.md")),
      "L4 mirrors cursor rules to claude .md"
    );
    const cbSettings = JSON.parse(
      fs.readFileSync(path.join(tmpA, ".codebuddy/settings.json"), "utf8")
    );
    assert(
      cbSettings.hooks && cbSettings.hooks.PreToolUse,
      "codebuddy settings Claude-style family hooks"
    );
    assert(
      fs.existsSync(path.join(tmpA, ".codebuddy/rules/00-project-docs-overview.md")),
      "L4 mirrors rules to codebuddy flat .md"
    );
    const cbL4Rule = fs.readFileSync(
      path.join(tmpA, ".codebuddy/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(/^---/.test(cbL4Rule), "L4 codebuddy preserves frontmatter");
    assert(fs.existsSync(path.join(tmpA, ".mcp.json.example")), "L4 root mcp example for qoder/claude");
    assert(fs.existsSync(path.join(tmpA, ".trae/mcp.json.example")), "L4 trae mcp example");
    const preCommit = fs.readFileSync(path.join(tmpA, ".githooks/pre-commit"), "utf8");
    assert(/git-commit-soft-gate\.js/.test(preCommit), "githooks pre-commit uses extended gate");
    assert(
      fs.existsSync(path.join(tmpA, ".githooks/git-commit-soft-gate.js")),
      "githooks gate copy rendered"
    );

    // lint-pitfalls：好例过、坏例拦
    const lint = runNode([path.join(tmpA, "scripts/agent-kb/lint-pitfalls.mjs")], {
      cwd: tmpA,
    });
    assert(lint.status === 0, "lint-pitfalls passes rendered template");
    fs.writeFileSync(
      path.join(tmpA, "docs/agent-kb/pitfalls.md"),
      [
        "# pitfalls",
        "",
        "## 路径速查",
        "",
        "| 路径 | 坑 |",
        "|---|---|",
        "| x | P1 |",
        "",
        "## 域速查",
        "",
        "| 域 | 坑 |",
        "|---|---|",
        "| NotADomain | P1 |",
        "",
        "## 台账（活跃）",
        "",
        "| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |",
        "|---|---|---|---|---|---|---|",
        "| P1 | 活跃 | NotADomain | x | y | z | w |",
        "",
        "## 已根治留档",
        "",
        "| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |",
        "|---|---|---|---|---|---|---|",
        "",
      ].join("\n"),
      "utf8"
    );
    const lintBad = runNode([path.join(tmpA, "scripts/agent-kb/lint-pitfalls.mjs")], {
      cwd: tmpA,
    });
    assert(lintBad.status === 1, "lint-pitfalls rejects bad domain");
  } finally {
    fs.rmSync(tmpA, { recursive: true, force: true });
  }

  // B) L5：render → sync → --check 无漂移
  const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), "harness-050-l5-"));
  try {
    const pB = path.join(tmpB, "params.json");
    fs.writeFileSync(
      pB,
      JSON.stringify({
        ladder: "L5",
        domains: ["func", "api", "db"],
        ai_tools: ["cursor", "claude", "qoder", "trae", "workbuddy"],
        agents_variant: "solo",
        hooks_family: family,
        expandFromManifest: true,
        placeholders: { ...basePlaceholders, LADDER_TARGET: "L5" },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpB,
      "--params",
      pB,
    ]);
    assert(r.status === 0, "0.5.2 L5 render exits 0");
    assert(
      fs.existsSync(path.join(tmpB, "docs/agent-config/README.md")) &&
        fs.existsSync(path.join(tmpB, "scripts/agent-config/sync.mjs")) &&
        fs.existsSync(path.join(tmpB, "docs/agent-config/hooks/hooks.config.json")),
      "L5 pack rendered"
    );
    assert(
      fs.existsSync(path.join(tmpB, "docs/agent-config/rules/00-project-docs-overview.mdc")),
      "L5 rules rendered to SSOT side"
    );
    assert(
      fs.existsSync(path.join(tmpB, "docs/agent-config/rules/00-harness-ssot.mdc")),
      "L5 render writes SSOT 00-harness-ssot"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc")),
      "L5 does not direct-render .cursor/rules"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".cursor/hooks.json")),
      "L5 skips direct hooks.json (sync owns it)"
    );
    assert(
      !fs.existsSync(path.join(tmpB, "CLAUDE.md")),
      "L5 skips template CLAUDE.md (sync owns it)"
    );
    const syncSrc = fs.readFileSync(path.join(tmpB, "scripts/agent-config/sync.mjs"), "utf8");
    assert(!/\{\{[A-Z]/.test(syncSrc), "rendered sync.mjs no unresolved placeholders");
    const check0 = runNode(["--check", path.join(tmpB, "scripts/agent-config/sync.mjs")]);
    assert(check0.status === 0, "rendered sync.mjs syntax");
    const meta = fs.readFileSync(path.join(tmpB, "docs/harness-eng/harness-meta.yaml"), "utf8");
    assert(/agent_config:\s*true/.test(meta), "harness-meta agent_config true");

    const sync1 = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs")], { cwd: tmpB });
    assert(sync1.status === 0, "sync.mjs runs");
    const syncCheck = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpB,
    });
    assert(syncCheck.status === 0, "sync --check no drift after sync");
    assert(
      fs.existsSync(path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc")),
      "sync generated .cursor/rules"
    );
    const genHooks = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".cursor/hooks.json"), "utf8")
    );
    assert(
      JSON.stringify(genHooks).includes("git-commit-soft-gate.js") &&
        genHooks.hooks.beforeMCPExecution,
      "sync generated hooks.json with family"
    );
    const qoderSyncSettings = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".qoder/settings.json"), "utf8")
    );
    assert(
      qoderSyncSettings.hooks && qoderSyncSettings.hooks.PreToolUse,
      "L5 sync qoder settings Claude-style hooks"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".qoder/hooks.json")),
      "L5 sync must not emit .qoder/hooks.json"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".qoder/rules/00-project-docs-overview.md")),
      "L5 sync qoder rules as .md"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".claude/rules/00-project-docs-overview.md")),
      "L5 sync claude rules as .md"
    );
    assert(fs.existsSync(path.join(tmpB, ".mcp.json.example")), "L5 sync root mcp example");
    const traeSyncHooks = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".trae/hooks.json"), "utf8")
    );
    assert(traeSyncHooks.hooks && traeSyncHooks.hooks.PreToolUse, "L5 sync trae hooks.json");
    const traeL5Gate = (traeSyncHooks.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    assert(
      traeL5Gate && String(traeL5Gate.matcher || "").includes("RunCommand"),
      "L5 sync Trae commit-gate matcher includes RunCommand"
    );
    const claudeSyncSettings = JSON.parse(
      fs.readFileSync(path.join(tmpB, ".claude/settings.json"), "utf8")
    );
    const claudeL5Gate = (claudeSyncSettings.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    const qoderL5Gate = (qoderSyncSettings.hooks.PreToolUse || []).find((g) =>
      JSON.stringify(g).includes("git-commit-soft-gate")
    );
    assert(
      claudeL5Gate && claudeL5Gate.matcher === "Bash",
      "L5 sync Claude commit-gate matcher stays Bash"
    );
    assert(
      qoderL5Gate && qoderL5Gate.matcher === "Bash",
      "L5 sync Qoder commit-gate matcher stays Bash"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".trae/rules/00-project-docs-overview.md")),
      "L5 sync trae rules as .md"
    );
    assert(
      fs.existsSync(path.join(tmpB, ".trae/rules/00-harness-ssot.md")),
      "L5 sync distributes 00-harness-ssot to trae"
    );
    assert(
      !fs.existsSync(path.join(tmpB, ".trae/rules/1x-contract-sync.md")),
      "L5 sync does not emit trae 1x-contract-sync"
    );
    const traeL5Rule = fs.readFileSync(
      path.join(tmpB, ".trae/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(
      /^---\r?\n[\s\S]*?alwaysApply:\s*true[\s\S]*?\r?\n---/.test(traeL5Rule),
      "L5 Trae synced rule keeps alwaysApply frontmatter"
    );
    const traeL5ApiPath = path.join(tmpB, ".trae/rules/12-api-doc-sync-rules.md");
    assert(fs.existsSync(traeL5ApiPath), "L5 sync api-doc-sync to trae .md");
    const traeL5Api = fs.existsSync(traeL5ApiPath)
      ? fs.readFileSync(traeL5ApiPath, "utf8")
      : "";
    assert(
      /^---\r?\n[\s\S]*?globs:\s*.+[\s\S]*?\r?\n---/.test(traeL5Api),
      "L5 Trae synced rule keeps globs frontmatter"
    );
    const claudeL5Rule = fs.readFileSync(
      path.join(tmpB, ".claude/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(!/^---/.test(claudeL5Rule), "L5 Claude still strips frontmatter");
    assert(fs.existsSync(path.join(tmpB, ".trae/mcp.json.example")), "L5 sync trae mcp example");
    const cbSync = JSON.parse(fs.readFileSync(path.join(tmpB, ".codebuddy/settings.json"), "utf8"));
    assert(cbSync.hooks && cbSync.hooks.PreToolUse, "L5 sync codebuddy settings hooks");
    assert(
      fs.existsSync(path.join(tmpB, ".codebuddy/rules/00-project-docs-overview.md")),
      "L5 sync codebuddy flat .md rules"
    );
    const cbL5Rule = fs.readFileSync(
      path.join(tmpB, ".codebuddy/rules/00-project-docs-overview.md"),
      "utf8"
    );
    assert(/^---/.test(cbL5Rule), "L5 sync codebuddy preserves frontmatter");
    const preCommitB = fs.readFileSync(path.join(tmpB, ".githooks/pre-commit"), "utf8");
    assert(
      /\.\.\/docs\/agent-config\/hooks\/git-commit-soft-gate\.js/.test(preCommitB),
      "L5 githooks references SSOT script"
    );

    // 漂移检测：手改生成物后 --check 必须非 0
    fs.appendFileSync(
      path.join(tmpB, ".cursor/rules/00-project-docs-overview.mdc"),
      "\nhand edit\n",
      "utf8"
    );
    const drift = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpB,
    });
    assert(drift.status === 1, "sync --check detects drift");

    // 功能：extended 门禁对契约漏同步出提醒（有 git 才跑）
    const gitOk = spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0;
    if (gitOk) {
      const sync2 = runNode([path.join(tmpB, "scripts/agent-config/sync.mjs")], { cwd: tmpB });
      assert(sync2.status === 0, "sync re-applied after drift");
      const g = (args) =>
        spawnSync("git", args, { cwd: tmpB, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      g(["init", "-q"]);
      g(["config", "user.email", "t@t.com"]);
      g(["config", "user.name", "t"]);
      fs.mkdirSync(path.join(tmpB, "src/controller"), { recursive: true });
      fs.writeFileSync(path.join(tmpB, "src/controller/Foo.java"), "class Foo {}\n", "utf8");
      g(["add", "src/controller/Foo.java"]);
      const gateRun = spawnSync(
        "node",
        [".cursor/hooks/git-commit-soft-gate.js"],
        {
          cwd: tmpB,
          input: JSON.stringify({ command: "git " + "commit -m x" }),
          encoding: "utf8",
          timeout: 15000,
        }
      );
      let reply = null;
      try {
        reply = JSON.parse(gateRun.stdout.trim().split(/\r?\n/).pop());
      } catch (_) {
        reply = null;
      }
      assert(reply && reply.permission === "allow", "gate fail-open allow");
      assert(
        reply && /\[api\]/.test(reply.agent_message || ""),
        "gate reminds api contract sync"
      );
    }
  } finally {
    fs.rmSync(tmpB, { recursive: true, force: true });
  }
}

// --- 0.5.6 harness-meta / mcp-usage-guide under docs/harness-eng ---
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/harness-meta.mjs")),
  "lib/harness-meta.mjs"
);
assert(
  /target:\s*docs\/harness-eng\/harness-meta\.yaml/.test(manifest),
  "manifest harness-meta target is docs/harness-eng/"
);
assert(
  /target:\s*docs\/harness-eng\/mcp-usage-guide\.md/.test(manifest),
  "manifest mcp-usage-guide target is docs/harness-eng/"
);
assert(
  !/target:\s*\.cursor\/harness-meta\.yaml/.test(manifest),
  "manifest harness-meta target is no longer .cursor/"
);
assert(
  !/target:\s*\.cursor\/mcp-usage-guide\.md/.test(manifest),
  "manifest mcp-usage-guide target is no longer .cursor/"
);
{
  const detect056 = readDoc("detect.md");
  assert(
    /docs\/harness-eng\/harness-meta\.yaml/.test(detect056) && /S_HARNESS_META/.test(detect056),
    "detect S_HARNESS_META prefers docs/harness-eng/"
  );
  assert(/回退|\.cursor\/harness-meta/.test(detect056), "detect S_HARNESS_META documents legacy fallback");
}
assert(
  /docs\/harness-eng\/harness-meta\.yaml/.test(ladderMd),
  "ladder L0 checklist prefers docs/harness-eng/harness-meta.yaml"
);
assert(
  !/^- \[ \] `\.cursor\/harness-meta\.yaml` 存在/.test(ladderMd),
  "L0 checklist is not .cursor-only for meta"
);
assert(/回退/.test(ladderMd), "ladder documents legacy meta fallback");
assert(
  /docs\/harness-eng\/mcp-usage-guide\.md/.test(ladderMd),
  "ladder L4 prefers docs/harness-eng/mcp-usage-guide.md"
);
assert(/含「勿提交」/.test(ladderMd) || /勿提交」真密/.test(ladderMd), "ladder L4 guide checks 勿提交 not lecture-dont-fill");
assert(!/含「勿提交真密」/.test(ladderMd), "ladder dropped exact 勿提交真密 checklist pin");
assert(/docs\/harness-eng\/harness-meta\.yaml/.test(skill), "SKILL Done prefers new meta path");
{
  const conflict056 = readDoc("conflict-policy.md");
  assert(/docs\/harness-eng\/harness-meta\.yaml/.test(conflict056), "conflict-policy writes new meta path");
  assert(/不自动删除/.test(conflict056), "conflict-policy leaves legacy meta in place");
}
assert(
  /宿主的 MCP 设置|当前 Agent 宿主/.test(
    fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp-usage-guide.md.tmpl"), "utf8")
  ),
  "mcp-usage-guide enable steps are host-agnostic"
);
{
  const mcpGuide = fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp-usage-guide.md.tmpl"), "utf8");
  assert(/本地可填/.test(mcpGuide) && /勿提交/.test(mcpGuide), "mcp-usage-guide local-fill + no-commit");
  assert(!/不要填写密码|别填密码|主动.*不要填/.test(mcpGuide), "mcp-usage-guide no proactive dont-fill-password");
}
assert(
  !/Cursor → Settings → MCP/.test(
    fs.readFileSync(path.join(skillRoot, "templates/mcp/mcp-usage-guide.md.tmpl"), "utf8")
  ),
  "mcp-usage-guide dropped Cursor-only Settings → MCP"
);
{
  const libDash = fs.readFileSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs"), "utf8");
  const reportSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-report-html.mjs"), "utf8");
  assert(/findHarnessMetaFile|HARNESS_META_READ_CANDIDATES/.test(libDash), "session-dash reads via harness-meta helper");
  assert(/HARNESS_META_READ_CANDIDATES/.test(reportSrc), "fill-report-html reads via harness-meta candidates");
  const render056 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/migrateHarnessMetaIfNeeded/.test(render056), "render migrates legacy meta to new path");
}
{
  const tmpMeta = fs.mkdtempSync(path.join(os.tmpdir(), "he-meta-ladder-"));
  try {
    fs.mkdirSync(path.join(tmpMeta, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpMeta, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L2\ncustom_user_key: keep-me\n',
      "utf8"
    );
    assert(harnessMetaExists(tmpMeta), "helper sees legacy .cursor meta");
    const foundLegacy = findHarnessMetaFile(tmpMeta);
    assert(foundLegacy && foundLegacy.rel === ".cursor/harness-meta.yaml", "helper falls back to .cursor yaml");
    const newDir = path.join(tmpMeta, "docs/harness-eng");
    fs.mkdirSync(newDir, { recursive: true });
    fs.writeFileSync(path.join(newDir, "harness-meta.yaml"), "ladder: L4\n", "utf8");
    const foundNew = findHarnessMetaFile(tmpMeta);
    assert(foundNew && foundNew.rel === HARNESS_META_CANONICAL, "helper prefers docs/harness-eng/ meta");
    fs.rmSync(path.join(newDir, "harness-meta.yaml"));
    const mig = migrateHarnessMetaIfNeeded(tmpMeta);
    assert(mig.migrated === true && fs.existsSync(path.join(tmpMeta, HARNESS_META_CANONICAL)), "migrate copies old meta to new path");
    assert(fs.existsSync(path.join(tmpMeta, ".cursor/harness-meta.yaml")), "migrate leaves legacy meta in place");
    fs.writeFileSync(path.join(tmpMeta, ".cursor/mcp-usage-guide.md"), "# old guide\n勿提交真密\n", "utf8");
    assert(findMcpUsageGuideFile(tmpMeta)?.rel === ".cursor/mcp-usage-guide.md", "guide helper falls back to .cursor");
    const migG = migrateMcpUsageGuideIfNeeded(tmpMeta);
    assert(migG.migrated === true && fs.existsSync(path.join(tmpMeta, MCP_USAGE_GUIDE_CANONICAL)), "migrate copies old guide to new path");
    assert(fs.existsSync(path.join(tmpMeta, ".cursor/mcp-usage-guide.md")), "migrate leaves legacy guide in place");
  } finally {
    fs.rmSync(tmpMeta, { recursive: true, force: true });
  }
}
{
  const skelNew = fs.mkdtempSync(path.join(os.tmpdir(), "he-skel-new-"));
  const skelOld = fs.mkdtempSync(path.join(os.tmpdir(), "he-skel-old-"));
  try {
    const seed = (root, metaRel) => {
      fs.mkdirSync(path.join(root, "docs/api"), { recursive: true });
      fs.mkdirSync(path.join(root, "docs/func"), { recursive: true });
      fs.mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
      fs.writeFileSync(path.join(root, "AGENTS.md"), "# agents\n", "utf8");
      fs.writeFileSync(path.join(root, "docs/api/api.md"), "# api\n", "utf8");
      fs.writeFileSync(path.join(root, "docs/func/func.md"), "# func\n", "utf8");
      fs.writeFileSync(
        path.join(root, metaRel),
        'skill: harness-eng\nladder: L4\nskill_version: "0.5.6"\n',
        "utf8"
      );
      fs.mkdirSync(path.join(root, ".cursor"), { recursive: true });
      fs.writeFileSync(path.join(root, ".cursor/mcp.json.example"), "{}\n", "utf8");
      const guideRel =
        metaRel.startsWith("docs/")
          ? "docs/harness-eng/mcp-usage-guide.md"
          : ".cursor/mcp-usage-guide.md";
      fs.mkdirSync(path.dirname(path.join(root, guideRel)), { recursive: true });
      fs.writeFileSync(path.join(root, guideRel), "# guide\n勿提交真密\n", "utf8");
    };
    seed(skelNew, HARNESS_META_CANONICAL);
    seed(skelOld, ".cursor/harness-meta.yaml");
    const runScore = (root) => {
      const r = runNode([
        path.join(skillRoot, "scripts/fill-score.mjs"),
        "--root",
        root,
        "--json",
      ]);
      assert(r.status === 0, `fill-score exits 0 for ${root}`);
      let json = null;
      try {
        json = JSON.parse(r.stdout.trim());
      } catch {
        json = null;
      }
      return json;
    };
    const newScore = runScore(skelNew);
    const oldScore = runScore(skelOld);
    assert(newScore?.skeleton_ready?.ok === true, "fill-score L0/L4 skeleton accepts new meta path only");
    assert(oldScore?.skeleton_ready?.ok === true, "fill-score L0/L4 skeleton accepts legacy .cursor meta");
    assert(newScore?.skeleton_ready?.files_ok >= 4, "new-path skeleton counts meta file");
    assert(oldScore?.skeleton_ready?.files_ok >= 4, "legacy-path skeleton counts meta file");
  } finally {
    fs.rmSync(skelNew, { recursive: true, force: true });
    fs.rmSync(skelOld, { recursive: true, force: true });
  }
}
{
  const tmpR = fs.mkdtempSync(path.join(os.tmpdir(), "he-meta-render-"));
  const pR = path.join(tmpR, "params.json");
  try {
    fs.mkdirSync(path.join(tmpR, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpR, ".cursor/harness-meta.yaml"),
      [
        "skill: harness-eng",
        'skill_version: "0.5.5"',
        "ladder: L0",
        "custom_user_key: keep-me",
        "domains: []",
        "",
      ].join("\n"),
      "utf8"
    );
    fs.writeFileSync(
      pR,
      JSON.stringify({
        ladder: "L0",
        domains: [],
        agents_variant: "solo",
        on_exists: "skip",
        expandFromManifest: true,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          DATE: "2026-09-12",
          AGENTS_VARIANT: "solo",
          LADDER_TARGET: "L0",
          DOMAINS_YAML: "[]",
          GLOB_PROFILE: "wide",
          LAST_MODE: "resume",
          AI_TOOLS_YAML: "[cursor]",
        },
      }),
      "utf8"
    );
    const r = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpR,
      "--params",
      pR,
    ]);
    assert(r.status === 0, "render resume migrates/writes new meta path");
    assert(
      fs.existsSync(path.join(tmpR, "docs/harness-eng/harness-meta.yaml")),
      "render wrote docs/harness-eng/harness-meta.yaml"
    );
    const migrated = fs.readFileSync(path.join(tmpR, "docs/harness-eng/harness-meta.yaml"), "utf8");
    assert(/custom_user_key:\s*keep-me/.test(migrated), "render migrate+merge keeps user keys");
    assert(/^skill_version:\s*"?0\.7\.14"?\s*$/m.test(migrated), "render migrate+merge updates skill_version");
    assert(
      fs.existsSync(path.join(tmpR, ".cursor/harness-meta.yaml")),
      "render leaves legacy meta file"
    );
  } finally {
    fs.rmSync(tmpR, { recursive: true, force: true });
  }
}

// --- 0.5.3 / 0.5.4 session dashboard ---
assert(
  fs.existsSync(docPath("session-dashboard.md")),
  "session-dashboard.md"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/session-dash.mjs")),
  "session-dash.mjs"
);
assert(
  fs.existsSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs")),
  "lib/session-dashboard.mjs"
);
assert(/会话仪表盘/.test(skill), "SKILL mandates session dashboard footer");
assert(/session-dashboard\.md/.test(skill), "SKILL points session-dashboard.md");
assert(/实质施工产出/.test(skill) && /闸门决策/.test(skill), "SKILL gates dashboard to milestone SHOW");
assert(/密文对用户话术/.test(skill) && /不主动要求用户/.test(skill), "SKILL secrets UX: no proactive dont-fill");
assert(/仅.*local 真密配置/.test(skill) || /仅\*\*本轮在创建/.test(skill), "SKILL secrets UX: remind only on local secret files");
assert(/不按「会话曾点名」/.test(skill), "SKILL dashboard not gated by session history");
assert(!/\*\*每轮回复末尾\*\*/.test(skill), "SKILL no unconditional every-turn dashboard");
const sessionDashMd = readDoc("session-dashboard.md");
assert(/决策台/.test(sessionDashMd) && /趋势台/.test(sessionDashMd), "session-dashboard four panels");
assert(/详情请查询仪表盘/.test(sessionDashMd), "session-dashboard detail link copy");
assert(/会话仪表盘（精简） · 未打分/.test(sessionDashMd), "session-dashboard documents compact B format");
assert(
  /使用手册\.(html|md)/.test(sessionDashMd) && /第6章|#s6|60-对话内会话仪表盘/.test(sessionDashMd),
  "session-dashboard handbook anchor"
);
assert(/\*\*SHOW\*\*/.test(sessionDashMd) && /\*\*HIDE\*\*/.test(sessionDashMd), "session-dashboard SHOW/HIDE");
assert(/当前版本号多少/.test(sessionDashMd), "session-dashboard version-question hide example");
assert(/里程碑 SHOW/.test(sessionDashMd) && /\*\*实质产出\*\*/.test(sessionDashMd), "session-dashboard milestone SHOW policy");
assert(/\*\*闸门决策点\*\*/.test(sessionDashMd) && /出示 WritePlan/.test(sessionDashMd), "session-dashboard WritePlan gate is SHOW");
assert(/提问批次/.test(sessionDashMd) && /尚无目标根 → 一律 HIDE/.test(sessionDashMd), "session-dashboard Q&A and no-root are HIDE");
assert(
  /正等 WritePlan 确认，用户本轮无确认/.test(sessionDashMd),
  "session-dashboard waiting WritePlan without confirm is HIDE"
);
assert(!/\*\*模式步进\*\*/.test(sessionDashMd), "session-dashboard no longer uses broad 模式步进 SHOW");
assert(!/\*\*改盘意图\*\*/.test(sessionDashMd), "session-dashboard no longer uses soft 改盘意图 SHOW");
assert(/判定粒度 = 本轮/.test(sessionDashMd), "session-dashboard gates on this-turn not session history");
assert(/显式读数/.test(sessionDashMd), "session-dashboard SHOW includes explicit readout request");
assert(/含糊/.test(sessionDashMd), "session-dashboard ambiguous defaults HIDE");
assert(!/工程上下文未结束/.test(sessionDashMd), "session-dashboard no longer keeps SHOW for unfinished engineering context");
assert(!/仅\*\*本轮正在 detect/.test(sessionDashMd), "session-dashboard no no-root compact exception");

assert(!/确认后 render"/.test(sessionDashMd), "session-dashboard next tip uses harness not render");
assert(/确认后 harness\.mjs/.test(sessionDashMd), "session-dashboard next tip harness.mjs");
const aiTools063 = fs.readFileSync(path.join(skillRoot, "host/ai-tools.md"), "utf8");
assert(/对齐矩阵（0\.7\.0|0\.6\.9|0\.6\.x）/.test(aiTools063), "ai-tools matrix title 0.6.9");
assert(!/对齐矩阵（0\.5\.7）/.test(aiTools063), "ai-tools matrix title not stuck at 0.5.7");

{
  const dashHelp = runNode([path.join(skillRoot, "scripts/session-dash.mjs"), "--help"]);
  assert(dashHelp.status === 0, "session-dash --help exits 0");
  assert(/--intent/.test(dashHelp.stdout || ""), "session-dash --help lists --intent");
  const emptyDash = runNode([
    path.join(skillRoot, "scripts/session-dash.mjs"),
    "--root",
    path.join(os.tmpdir(), "harness-eng-no-score-" + process.pid),
    "--mode",
    "audit",
  ]);
  assert(emptyDash.status === 0, "session-dash empty root exits 0");
  const emptyOut = emptyDash.stdout || "";
  assert(/精简/.test(emptyOut), "session-dash empty uses compact footer");
  assert(/未打分/.test(emptyOut), "session-dash compact titles 未打分");
  assert(/下一动作：/.test(emptyOut), "session-dash compact has 下一动作");
  assert(/详情请查询仪表盘/.test(emptyOut), "session-dash compact has report footer");
  assert(!/\| \*\*决策台\*\*/.test(emptyOut), "session-dash empty omits four-panel table");
}


assert(/--intent engineering\|meta/.test(sessionDashMd), "session-dashboard documents --intent");
assert(!/会话内\*\*每一轮\*\*/.test(sessionDashMd), "session-dashboard SSOT no longer every-turn");
assert(!/quadrantChart|```mermaid/.test(sessionDashMd), "session-dashboard.md no mermaid");
assert(/施工态势/.test(sessionDashMd), "session-dashboard.md documents 施工态势");
assert(!/四台 \+ mermaid/.test(skill), "SKILL dashboard is 四台摘要 not mermaid");
assert(/本轮/.test(handbookMd) && /会话仪表盘/.test(handbookMd), "使用手册.md dashboard is this-turn gated");
assert(/里程碑 SHOW/.test(handbookMd) && /提问批次/.test(handbookMd), "使用手册.md milestone SHOW and Q&A HIDE");
assert(!/Agent \*\*每一轮\*\*/.test(handbookMd), "使用手册.md no unconditional every-turn dashboard");
assert(/纯文本施工态势/.test(handbookMd) && !/mermaid 象限图/.test(handbookMd), "使用手册.md dashboard no mermaid chart");
assert(/实质产出|闸门决策|显式读数/.test(quickstartMd), "QUICKSTART dashboard is milestone gated");
assert(!/四台摘要 \+ mermaid/.test(quickstartMd) && !/四台 \+ mermaid/.test(quickstartMd), "QUICKSTART dashboard no mermaid");
{
    const dashRoot = fs.mkdtempSync(path.join(os.tmpdir(), "he-session-dash-"));
  try {
    const scoreDir = path.join(dashRoot, "docs/harness-eng");
    fs.mkdirSync(scoreDir, { recursive: true });
    fs.copyFileSync(
      path.join(skillRoot, "scripts/fixtures/score-sample.json"),
      path.join(scoreDir, "score-latest.json")
    );
    fs.mkdirSync(path.join(dashRoot, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(dashRoot, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L3\ndomains: [api]\nlast_mode: audit\n',
      "utf8"
    );
    const dashRun = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--mode",
      "fill-score",
      "--json",
    ]);
    assert(dashRun.status === 0, "session-dash exits 0");
    let dashJson = null;
    try {
      dashJson = JSON.parse(dashRun.stdout.trim());
    } catch {
      dashJson = null;
    }
    assert(
      dashJson && dashJson.decision?.ai_coding_ready === false,
      "session-dash reads score ai_coding_ready"
    );
    assert(dashJson && dashJson.diagnose?.ladder === "L3", "session-dash reads legacy .cursor meta");
    assert(dashJson && dashJson.sessionMode === "fill-score", "session-dash --mode wins over meta.last_mode");
    assert(dashJson && dashJson.metaLastMode === "audit", "session-dash keeps meta.last_mode as footnote field");
    const dashMd = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--mode",
      "fill-score",
    ]);
    assert(dashMd.status === 0, "session-dash markdown exits 0");
    assert(
      /\*\*模式\*\* fill-score/.test(dashMd.stdout || "") && /meta\.last_mode=audit/.test(dashMd.stdout || ""),
      "session-dash markdown footnotes meta.last_mode"
    );
    assert(
      !/```\s*mermaid/.test(dashMd.stdout || "") && !/quadrantChart/.test(dashMd.stdout || ""),
      "session-dash stdout has no mermaid fence"
    );
    assert(
      /施工态势：覆盖 80% × 形态 88%（Q2 理想区）/.test(dashMd.stdout || ""),
      "session-dash plain-text stance"
    );
    assert(/详情请查询仪表盘/.test(dashMd.stdout || ""), "session-dash detail link line");
    assert(
      /使用手册/.test(dashMd.stdout || "") &&
        (/使用手册\.(html|md)/.test(dashMd.stdout || "") ||
          /%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C\.html/.test(dashMd.stdout || "") ||
          /#s6|#60-对话内会话仪表盘/.test(dashMd.stdout || "")),
      "session-dash handbook link"
    );
    const dashEng = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--intent",
      "engineering",
    ]);
    assert(
      dashEng.status === 0 && /## harness-eng 会话仪表盘/.test(dashEng.stdout || ""),
      "session-dash --intent engineering renders"
    );
    const dashMeta = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--root",
      dashRoot,
      "--intent",
      "meta",
    ]);
    assert(dashMeta.status === 0, "session-dash --intent meta exits 0");
    assert(
      !/会话仪表盘/.test(dashMeta.stdout || ""),
      "session-dash --intent meta omits markdown"
    );
    const dashMetaJson = runNode([
      path.join(skillRoot, "scripts/session-dash.mjs"),
      "--intent",
      "meta",
      "--json",
    ]);
    let metaJson = null;
    try {
      metaJson = JSON.parse((dashMetaJson.stdout || "").trim());
    } catch {
      metaJson = null;
    }
    assert(
      dashMetaJson.status === 0 && metaJson && metaJson.omitted === true && metaJson.reason === "meta",
      "session-dash --intent meta --json omitted"
    );
  } finally {
    fs.rmSync(dashRoot, { recursive: true, force: true });
  }
}

// --- 0.5.7: contract-sync 指针去 Cursor 唯权威 + 全量镜像宿主跳过冗余 1x ---
{
  const contractTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/ai-tools/contract-sync-mirror.md.tmpl"),
    "utf8"
  );
  assert(
    !/以[^\n]*\.cursor\/rules\/11\|12\|13\|16[^\n]*为准/.test(contractTmpl),
    "contract-sync tmpl no longer treats .cursor 11|12|13|16 as universal authority"
  );
  assert(/AGENTS\.md/.test(contractTmpl), "contract-sync tmpl points to root AGENTS.md");
  assert(/docs\//.test(contractTmpl), "contract-sync tmpl points to docs/** SSOT");
  assert(
    /\.claude\/rules|\.qoder\/rules|\.trae\/rules|\.codebuddy\/rules/.test(contractTmpl),
    "contract-sync tmpl mentions this-host mirrored sync rules"
  );
  assert(
    /示例|含 cursor|ai_tools/i.test(contractTmpl),
    "contract-sync tmpl treats .cursor/rules only as Cursor example"
  );

  const aiTools057 = readDoc("ai-tools.md");
  assert(/对齐矩阵/.test(aiTools057), "ai-tools.md has 对齐矩阵");
  assert(/\|\s*`codex`\s*\|\s*\*\*高\*\*/.test(aiTools057), "ai-tools.md marks Codex as 高");
  assert(/\|\s*`trae`\s*\|\s*\*\*高\*\*/.test(aiTools057), "ai-tools.md marks Trae as 高");
  assert(
    /跳过|不再强制|omit|不另写/.test(aiTools057) && /1x-contract-sync|契约 sync/.test(aiTools057),
    "ai-tools.md documents skip/omit 1x for full-mirror hosts"
  );
  assert(!/非 `cursor` 工具额外写入 \*\*契约 sync 镜像\*\*/.test(aiTools057) || /L0–L2|不全量镜像/.test(aiTools057),
    "ai-tools.md no longer implies 1x is always-on for every non-cursor host");

  const render057 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(
    /FULL_RULES_MIRROR_HOSTS|hostGetsFullRulesMirror|shouldEmitContractSync/.test(render057),
    "render encodes full-mirror / 1x emit conditions"
  );

  const handbook057 = fs.readFileSync(path.join(skillRoot, "guide", "使用手册.md"), "utf8");
  const syncHosts057 = readDoc("sync-hosts.md");
  const codexAd057 = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/codex.md"), "utf8");
  assert(/对齐矩阵|纪律 B|\*\*高\*\*/.test(handbook057) && /Codex|codex/.test(handbook057), "handbook FAQ/docs Codex 高 · 纪律 B");
  assert(/\*\*高\*\*/.test(syncHosts057) && /codex/i.test(syncHosts057), "sync-hosts.md Codex 高");
  assert(/对齐程度：\*\*高\*\*|\*\*高\*\*/.test(codexAd057), "codex adapter is 高");
  assert(/不做/.test(codexAd057) && /mdc/.test(codexAd057), "codex adapter no .mdc mirror");

  const conflict057 = readDoc("conflict-policy.md");
  assert(
    /1x-contract-sync|契约 sync/.test(conflict057) && /不自动删除|不删/.test(conflict057),
    "conflict-policy: leftover 1x skip, do not auto-delete"
  );

  function dryTargets(ladder, tools, extra = {}) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "he-057-1x-"));
    const p = path.join(tmp, "params.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        ladder,
        domains: ["func", "api", "db", "redis"],
        ai_tools: tools,
        agents_variant: "solo",
        expandFromManifest: true,
        on_exists: "skip",
        ...extra,
        placeholders: {
          REPO_NAME: "demo",
          REPO_DESC: "demo",
          DATE: "2026-09-12",
          AGENTS_VARIANT: "solo",
          LADDER_TARGET: ladder,
          GLOB_PROFILE: "wide",
          LAST_MODE: "land",
          GLOB_API: "**/controller/**,docs/api/**",
          GLOB_FUNC: "**/src/**,docs/func/**",
          GLOB_DB: "**/db/**,docs/db/**",
          GLOB_REDIS: "**/redis/**,docs/redis/**",
        },
      }),
      "utf8"
    );
    try {
      const r = runNode([
        path.join(skillRoot, "scripts/render.mjs"),
        "--root",
        tmp,
        "--params",
        p,
        "--dry-run",
      ]);
      assert(r.status === 0, `0.5.7 dry-run ${ladder} exits 0`);
      if (r.status !== 0) {
        return { tmp, targets: [] };
      }
      const json = JSON.parse(r.stdout);
      const targets = (json.results || []).map((x) => String(x.target || "").replace(/\\/g, "/"));
      return { tmp, targets };
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  const FULL_MIRROR_1X = [
    ".claude/rules/1x-contract-sync.md",
    ".qoder/rules/1x-contract-sync.md",
    ".trae/rules/1x-contract-sync.md",
    ".codebuddy/rules/1x-contract-sync.md",
  ];
  const allTools = ["cursor", "claude", "qoder", "trae", "workbuddy", "codex"];

  const l0 = dryTargets("L0", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(l0.targets.includes(t), `L0 still emits ${t} (no full rules mirror yet)`);
  }
  assert(l0.targets.includes(".codex/contract-sync.md"), "L0 Codex still gets contract-sync pointer");
  assert(!l0.targets.includes(".cursor/rules/1x-contract-sync.md"), "Cursor never gets separate 1x");

  const l3 = dryTargets("L3", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(!l3.targets.includes(t), `L3 full-mirror host skips redundant ${t}`);
  }
  assert(!l3.targets.includes(".codex/contract-sync.md"), "L3 Codex omits contract-sync (full pipeline)");
  assert(
    l3.targets.includes(".claude/rules/11-func-sync-rules.md") ||
      l3.targets.includes(".qoder/rules/11-func-sync-rules.md"),
    "L3 full-mirror hosts still receive *-sync* rules"
  );
  assert(
    l3.targets.includes(".codex/rules/repository.rules") ||
      l3.targets.includes(".codex/hooks.json"),
    "L3 Codex receives rules/hooks targets"
  );

  const l5 = dryTargets("L5", allTools);
  for (const t of FULL_MIRROR_1X) {
    assert(!l5.targets.includes(t), `L5 omits redundant ${t}`);
  }
  assert(!l5.targets.includes(".codex/contract-sync.md"), "L5 Codex omits contract-sync");
  assert(
    !l5.targets.some((t) => /1x-contract-sync/.test(t) && !t.startsWith(".codex/")),
    "L5 does not emit alwaysApply 1x alongside full mirrored sync rules"
  );
  assert(
    !l5.targets.some((t) => t === ".codex/contract-sync.md"),
    "L5 does not emit Codex contract-sync either"
  );
  assert(
    l5.targets.includes("docs/agent-config/rules/00-harness-ssot.mdc"),
    "L5 multi-host plan includes SSOT 00-harness-ssot"
  );

  const l5TraeOnly = dryTargets("L5", ["trae"]);
  assert(
    l5TraeOnly.targets.includes("docs/agent-config/rules/00-harness-ssot.mdc"),
    "L5 trae-only plan includes SSOT 00-harness-ssot"
  );
  assert(
    !l5TraeOnly.targets.includes(".trae/rules/00-harness-ssot.md"),
    "L5 trae-only does not direct-render host 00"
  );
  assert(
    !l5TraeOnly.targets.some((t) => /1x-contract-sync/.test(t)),
    "L5 trae-only still omits 1x-contract-sync"
  );
}

// --- 0.5.8 P0-1: detect / MATURE multi-host honesty ---
{
  const det058 = readDoc("detect.md");
  assert(/\.claude\/rules/.test(det058), "S_RULES includes .claude/rules");
  assert(/\.qoder\/rules/.test(det058), "S_RULES includes .qoder/rules");
  assert(/\.trae\/rules/.test(det058), "S_RULES includes .trae/rules");
  assert(/\.codebuddy\/rules/.test(det058), "S_RULES includes .codebuddy/rules");
  assert(
    !/\| `S_RULES` \| `\.cursor\/rules\/\*\.mdc` 至少一个 \|/.test(det058),
    "S_RULES is not Cursor-only"
  );
  assert(/\.claude\/settings\.json/.test(det058), "S_HOOKS includes .claude/settings.json");
  assert(/\.qoder\/settings\.json/.test(det058), "S_HOOKS includes .qoder/settings.json");
  assert(/\.codebuddy\/settings\.json/.test(det058), "S_HOOKS includes .codebuddy/settings.json");
  assert(/\.trae\/hooks\.json/.test(det058), "S_HOOKS includes .trae/hooks.json");
  assert(/\.codex\/hooks\.json/.test(det058), "S_HOOKS includes .codex/hooks.json");
  assert(/\.githooks\/pre-commit/.test(det058), "S_HOOKS includes .githooks/pre-commit");
  assert(
    !/\| `S_HOOKS` \| `\.cursor\/hooks\.json` \|/.test(det058),
    "S_HOOKS is not Cursor-only"
  );
  assert(
    /MATURE[\s\S]*S_AGENTS_ROOT[\s\S]*S_RULES[\s\S]*S_KB/.test(det058),
    "MATURE still AGENTS + rules + contract + kb"
  );
  assert(
    /任一宿主|非仅 Cursor|非仅 `\.cursor\/rules`/.test(det058),
    "MATURE host-honest wording"
  );
  const rp058 = readDoc("recommended-profile.md");
  assert(
    /S_RULES|S_HOOKS/.test(rp058) && /任一宿主|非仅 Cursor/.test(rp058),
    "recommended-profile MATURE uses host-honest detect"
  );
}

// --- 0.5.8 P0-4: Codex / L5 expectation (updated 0.6.9 → 高) ---
{
  const wp058 = readDoc("write-plan.md");
  assert(/高/.test(wp058) && /codex/i.test(wp058) && /纪律 B|不.*全部推荐/.test(wp058), "write-plan Codex 高 + 纪律 B");
  assert(
    /Starlark|rules/.test(wp058) && /hooks/.test(wp058) && /MCP|toml/i.test(wp058),
    "write-plan Codex emits native rules/hooks/MCP"
  );
  assert(/adapters\/codex/.test(wp058), "write-plan cross-links adapters/codex.md");

  const audit058 = readDoc("audit-report.md");
  assert(
    /高/.test(audit058) && /mdc/.test(audit058) && /codex/i.test(audit058),
    "audit anti-pattern Codex .mdc mirror"
  );
  assert(/adapters\/codex/.test(audit058), "audit cross-links adapters/codex.md");

  const syncHosts058 = readDoc("sync-hosts.md");
  assert(
    /## Done[\s\S]*高/.test(syncHosts058) && /codex/i.test(syncHosts058),
    "sync-hosts Done Codex 高"
  );
  assert(/adapters\/codex/.test(syncHosts058), "sync-hosts cross-links adapters/codex.md");

  const ladder058 = readDoc("ladder.md");
  assert(
    /codex/i.test(ladder058) && (/高/.test(ladder058) || /CODEX-PARITY|adapters\/codex/.test(ladder058)),
    "ladder L5 mentions Codex"
  );

  const qYaml058 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(
    /Codex（高/.test(qYaml058),
    "questions.yaml Codex option labels 高"
  );

  const qMd058 = readDoc("questions.md");
  assert(
    /adapters\/codex/.test(qMd058) && (/高/.test(qMd058) || /Codex|codex/.test(qMd058)),
    "questions.md Codex + adapter link"
  );

  const rpCodex = readDoc("recommended-profile.md");
  assert(
    /高/.test(rpCodex) && /纪律 B|探测/.test(rpCodex) && /codex/i.test(rpCodex),
    "recommended-profile Codex 高 footnote"
  );

  const heReadmeTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/README.md"),
    "utf8"
  );
  assert(
    (heReadmeTmpl.match(/\| `progress\.yaml` \|/g) || []).length === 1,
    "docs/harness-eng README tmpl has single progress.yaml row"
  );
  const domainsHead = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domains.yaml"),
    "utf8"
  );
  assert(/schema_version/.test(domainsHead), "domains.yaml notes schema_version ≠ skill_version");
  const packsHead = fs.readFileSync(
    path.join(skillRoot, "templates/_meta/domain-packs.yaml"),
    "utf8"
  );
  assert(/schema_version/.test(packsHead), "domain-packs.yaml notes schema_version ≠ skill_version");
}

// --- 0.5.9 P1: hot-path index · land entry · fill CLI · fixtures · schema_version ---
{
  assert(fs.existsSync(path.join(skillRoot, "AGENT-INDEX.md")), "AGENT-INDEX.md");
  const agentIndex = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/必读/.test(agentIndex) && /harness\.mjs/.test(agentIndex), "AGENT-INDEX has 必读 + harness.mjs");
  assert(/fill\/README\.md/.test(agentIndex), "AGENT-INDEX points fill/README");
  assert(fs.existsSync(path.join(skillRoot, "fill/README.md")), "fill/README.md");
  const fillIdx = fs.readFileSync(path.join(skillRoot, "fill/README.md"), "utf8");
  assert(/fill-inventory\.mjs --domain/.test(fillIdx), "fill index documents unified inventory");
  assert(/fill-merge\.mjs --domain/.test(fillIdx), "fill index documents unified merge");
  assert(/只认统一 CLI|fill-inventory\.mjs --domain/.test(fillIdx), "fill index unified CLI only");
  assert(!/fill-inventory-\{api/.test(fillIdx), "fill index has no domain shim rows");
  const skill059 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/AGENT-INDEX\.md/.test(skill059), "SKILL points AGENT-INDEX");
  assert(/fill\/README\.md/.test(skill059), "SKILL fill rows point at fill index");
  assert(/harness\.mjs/.test(skill059), "SKILL prefers harness.mjs");
  assert(!/land\.mjs.*薄别名|薄别名.*land\.mjs/.test(skill059), "SKILL no land.mjs alias");
  const fillMd059 = readDoc("fill.md");
  assert(/fill-inventory\.mjs --domain/.test(fillMd059), "fill.md documents unified inventory");
  const wp059 = readDoc("write-plan.md");
  assert(/harness\.mjs/.test(wp059), "write-plan prefers harness.mjs");
  const conflict059 = readDoc("conflict-policy.md");
  assert(/harness\.mjs/.test(conflict059), "conflict-policy names harness.mjs");
  const qs059 = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  assert(/harness\.mjs/.test(qs059), "QUICKSTART names harness.mjs");
  assert(!/\bland\.mjs\b/.test(qs059), "QUICKSTART does not name land.mjs");
  assert(/fill-inventory\.mjs --domain/.test(qs059), "QUICKSTART unified inventory");

  const morphHead = fs.readFileSync(path.join(skillRoot, "templates/_meta/morph-required.yaml"), "utf8");
  assert(/schema_version/.test(morphHead) && /≠ skill_version|!= skill_version/.test(morphHead), "morph-required schema_version ≠ skill_version");
  const policyHead = fs.readFileSync(
    path.join(skillRoot, "templates/docs/harness-eng/score-policy.yaml.tmpl"),
    "utf8"
  );
  assert(/schema_version/.test(policyHead) && /≠ skill_version|!= skill_version/.test(policyHead), "score-policy schema_version ≠ skill_version");

  assert(!fs.existsSync(path.join(skillRoot, "scripts/land.mjs")), "land.mjs removed");
  assert(fs.existsSync(path.join(skillRoot, "scripts/harness.mjs")), "harness.mjs");
  assert(fs.existsSync(path.join(skillRoot, "scripts/fill-inventory.mjs")), "fill-inventory.mjs");
  const invUni = fs.readFileSync(path.join(skillRoot, "scripts/fill-inventory.mjs"), "utf8");
  assert(/--domain/.test(invUni), "fill-inventory --domain");
  const landHelp = runNode([path.join(skillRoot, "scripts/harness.mjs"), "--help"]);
  assert(landHelp.status === 0 && /--root/.test(landHelp.stdout), "harness.mjs --help");
  const invHelp = runNode([path.join(skillRoot, "scripts/fill-inventory.mjs"), "--help"]);
  assert(invHelp.status === 0 && /--domain/.test(invHelp.stdout), "fill-inventory.mjs --help");
  const invDbHelp = runNode([
    path.join(skillRoot, "scripts/fill-inventory.mjs"),
    "--domain",
    "db",
    "--help",
  ]);
  assert(
    invDbHelp.status === 0 && /fill-inventory-db|--sql-root|--root/.test(invDbHelp.stdout + invDbHelp.stderr),
    "fill-inventory --domain db --help dispatches"
  );

  const matureFix = path.join(skillRoot, "scripts/fixtures/mature-claude");
  const matureTraeFix = path.join(skillRoot, "scripts/fixtures/mature-trae");
  const qoderFix = path.join(skillRoot, "scripts/fixtures/qoder-hooks");
  const stackFix = path.join(skillRoot, "scripts/fixtures/stack-node");
  assert(fs.existsSync(path.join(matureFix, "AGENTS.md")), "mature-claude AGENTS.md");
  assert(fs.existsSync(path.join(matureFix, ".claude/rules/00-overview.md")), "mature-claude .claude/rules");
  assert(fs.existsSync(path.join(matureFix, "docs/api/api.md")), "mature-claude docs/api");
  assert(fs.existsSync(path.join(matureFix, "docs/agent-kb/README.md")), "mature-claude agent-kb");
  assert(!fs.existsSync(path.join(matureFix, ".cursor/rules")), "mature-claude has no .cursor/rules");
  const matureSig = scanSignals(matureFix);
  assert(matureSig.S_AGENTS_ROOT && matureSig.S_RULES && !matureSig.S_CURSOR_RULES, "mature-claude rules without cursor");
  assert(matureSig.S_API && matureSig.S_KB && matureSig.MATURE, "mature-claude MATURE without .cursor/rules");
  assert(fs.existsSync(path.join(matureTraeFix, "AGENTS.md")), "mature-trae AGENTS.md");
  assert(fs.existsSync(path.join(matureTraeFix, ".trae/rules/00-overview.md")), "mature-trae .trae/rules");
  assert(fs.existsSync(path.join(matureTraeFix, ".trae/rules/api/12-api.md")), "mature-trae nested api rule");
  assert(fs.existsSync(path.join(matureTraeFix, "docs/api/api.md")), "mature-trae docs/api");
  assert(fs.existsSync(path.join(matureTraeFix, "docs/agent-kb/README.md")), "mature-trae agent-kb");
  assert(!fs.existsSync(path.join(matureTraeFix, ".cursor/rules")), "mature-trae has no .cursor/rules");
  const matureTrae00 = fs.readFileSync(path.join(matureTraeFix, ".trae/rules/00-overview.md"), "utf8");
  const matureTraeApi = fs.readFileSync(path.join(matureTraeFix, ".trae/rules/api/12-api.md"), "utf8");
  assert(/alwaysApply:\s*true/.test(matureTrae00), "mature-trae overview keeps alwaysApply");
  assert(/globs:/.test(matureTraeApi), "mature-trae api rule keeps globs");
  const matureTraeSig = scanSignals(matureTraeFix);
  assert(
    matureTraeSig.S_AGENTS_ROOT && matureTraeSig.S_RULES && !matureTraeSig.S_CURSOR_RULES,
    "mature-trae rules without cursor"
  );
  assert(matureTraeSig.S_API && matureTraeSig.S_KB && matureTraeSig.MATURE, "mature-trae MATURE without .cursor/rules");
  assert(fs.existsSync(path.join(qoderFix, ".qoder/settings.json")), "qoder-hooks settings.json");
  const qoderSig = scanSignals(qoderFix);
  assert(qoderSig.S_HOOKS, "qoder-hooks S_HOOKS via settings.json");
  assert(fs.existsSync(path.join(stackFix, "package.json")), "stack-node package.json");
  const stackSig = scanSignals(stackFix);
  assert(stackSig.S_STACK && !stackSig.MATURE, "stack-node S_STACK only");

  assert(isGeneratedHostPath(".cursor/rules/00-project-docs-overview.mdc"), "generated host: .cursor/rules");
  assert(isGeneratedHostPath("CLAUDE.md"), "generated host: CLAUDE.md");
  assert(!isGeneratedHostPath("docs/agent-config/rules/00.mdc"), "SSOT is not generated host");
  assert(!isGeneratedHostPath("AGENTS.md"), "AGENTS.md is not generated host");
  assert(
    resolveLandAgentConfig({ ladder: "L4" }, { agent_config: true }) === true,
    "land reads meta.agent_config"
  );
  assert(
    resolveLandAgentConfig({ ladder: "L5" }, null) === true,
    "land treats params.ladder L5 as agent_config"
  );
  assert(
    resolveLandAgentConfig({ ladder: "L4" }, { ladder: "L2" }) === false,
    "land L4 without meta flag is not agent_config"
  );

  const tmpL5 = fs.mkdtempSync(path.join(os.tmpdir(), "harness-059-l5-"));
  try {
    const ph = {
      REPO_NAME: "demo",
      REPO_DESC: "demo",
      DATE: "2026-09-12",
      AGENTS_VARIANT: "solo",
      LADDER_TARGET: "L5",
      GLOB_PROFILE: "wide",
      LAST_MODE: "land",
      MODULE_DIRS: "",
      CODE_PREFIXES: "src/",
      COMMAND_TEST: "echo test",
      COMMAND_BUILD: "echo build",
      GLOB_API: "**/controller/**,docs/api/**",
      GLOB_FUNC: "**/src/**,docs/func/**",
      GLOB_DB: "**/db/**,docs/db/**",
      GLOB_JOBS: "docs/jobs/**",
      GLOB_KB: "docs/agent-kb/**",
      GLOB_SUPERPOWERS: "docs/superpowers/**",
      GLOB_AI_TOOLS: ".cursor/**",
      GLOB_OBSERVABILITY: "**/src/**",
      GLOB_FRONTEND: "apps/**",
      STACK_BADGES: "Java",
      PROJECT_NAME: "demo",
      PROJECT_DESC: "demo",
    };
    const pRefuse = path.join(tmpL5, "params-refuse.json");
    fs.writeFileSync(
      pRefuse,
      JSON.stringify({
        ladder: "L5",
        agent_config: true,
        files: [
          {
            template: "rules/00-project-docs-overview.mdc.tmpl",
            target: ".cursor/rules/00-project-docs-overview.mdc",
            action: "create",
          },
        ],
        placeholders: ph,
      }),
      "utf8"
    );
    const rRefuse = runNode([
      path.join(skillRoot, "scripts/harness.mjs"),
      "--root",
      tmpL5,
      "--params",
      pRefuse,
      "--no-sync",
    ]);
    assert(rRefuse.status !== 0, "harness L5 refuses explicit .cursor/rules file");
    assert(
      !fs.existsSync(path.join(tmpL5, ".cursor/rules/00-project-docs-overview.mdc")),
      "L5 harness did not write .cursor/rules via render"
    );

    fs.mkdirSync(path.join(tmpL5, ".cursor"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpL5, ".cursor/harness-meta.yaml"),
      'skill: harness-eng\nladder: L5\nagent_config: true\nskill_version: "0.5.9"\n',
      "utf8"
    );
    const pMeta = path.join(tmpL5, "params-meta.json");
    fs.writeFileSync(
      pMeta,
      JSON.stringify({
        ladder: "L4",
        files: [
          {
            template: "rules/karpathy-guidelines.mdc",
            target: ".cursor/rules/karpathy-guidelines.mdc",
            action: "create",
          },
        ],
        placeholders: ph,
      }),
      "utf8"
    );
    const rMeta = runNode([
      path.join(skillRoot, "scripts/harness.mjs"),
      "--root",
      tmpL5,
      "--params",
      pMeta,
      "--no-sync",
    ]);
    assert(rMeta.status !== 0, "harness refuses generated host path when legacy meta agent_config");

    const tmpExpand = fs.mkdtempSync(path.join(os.tmpdir(), "harness-059-l5e-"));
    try {
      const pExp = path.join(tmpExpand, "params.json");
      fs.writeFileSync(
        pExp,
        JSON.stringify({
          ladder: "L5",
          domains: ["api"],
          ai_tools: ["cursor"],
          agents_variant: "solo",
          hooks_family: ["commit-gate"],
          expandFromManifest: true,
          placeholders: { ...ph, LADDER_TARGET: "L5" },
        }),
        "utf8"
      );
      const rExp = runNode([
        path.join(skillRoot, "scripts/harness.mjs"),
        "--root",
        tmpExpand,
        "--params",
        pExp,
        "--no-sync",
      ]);
      assert(rExp.status === 0, "harness L5 expand --no-sync exits 0");
      assert(
        !fs.existsSync(path.join(tmpExpand, ".cursor/rules/00-project-docs-overview.mdc")),
        "harness L5 --no-sync does not write generated .cursor/rules"
      );
      assert(
        fs.existsSync(path.join(tmpExpand, "scripts/agent-config/sync.mjs")) ||
          fs.existsSync(path.join(tmpExpand, "docs/agent-config")),
        "harness L5 still renders SSOT / sync script"
      );
    } finally {
      fs.rmSync(tmpExpand, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tmpL5, { recursive: true, force: true });
  }
}

// --- 0.5.10 P2: Codex 不默认 · ui/report_schema · 皆无探测 ≠ Cursor · CHANGELOG/auto 归档 ---
{
  const qYaml0510 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/高/.test(qYaml0510) && /codex/i.test(qYaml0510), "Q_AI_TOOL Codex labeled 高");
  assert(
    /recommended_fallback:\s*\[\s*\]/.test(qYaml0510) &&
      !/recommended_fallback:\s*\[cursor\]/.test(qYaml0510),
    "Q_AI_TOOL recommended_fallback is [] not [cursor]"
  );

  const rp0510 = readDoc("recommended-profile.md");
  assert(/纪律 B|探测/.test(rp0510) && /codex/i.test(rp0510), "recommended-profile Codex 纪律 B");
  assert(
    /皆无则\s*`?\[\]`?|皆无则 \[\]/.test(rp0510) || /皆无[\s\S]{0,40}`\[\]`/.test(rp0510),
    "recommended-profile 皆无 → [] not [cursor]"
  );
  assert(!/皆无则 `\[cursor\]`/.test(rp0510), "recommended-profile no 皆无则 [cursor]");

  const det0510 = readDoc("detect.md");
  assert(
    /ai_tools:\s*`?\[\]`?/.test(det0510) && /不.*默认/.test(det0510),
    "detect.md 无信号 ai_tools [] / 不默认 Cursor"
  );
  assert(!/无信号时推荐包默认 `ai_tools: \[cursor\]`/.test(det0510), "detect.md no cursor-only default");
  assert(/不.*默认|纪律 B|不进「全部推荐」/.test(det0510) && /codex/i.test(det0510), "detect.md Codex 纪律 B");

  const aiTools0510 = readDoc("ai-tools.md");
  assert(/\|\s*`codex`\s*\|\s*\*\*高\*\*/.test(aiTools0510) || /推荐纪律 B/.test(aiTools0510), "ai-tools.md Codex 高");
  assert(!/若无探测则默认 Cursor/.test(aiTools0510), "ai-tools.md 全部推荐 no Cursor default");

  const qMd0510 = readDoc("questions.md");
  assert(/不.*默认|纪律 B|不进「全部推荐」/.test(qMd0510) && /codex/i.test(qMd0510), "questions.md Codex 纪律 B");

  const handbook0510 = fs.readFileSync(path.join(skillRoot, "guide", "使用手册.md"), "utf8");
  assert(!/全部推荐」默认偏向 Cursor/.test(handbook0510), "handbook.md no Cursor-default 全部推荐");
  assert(/不.*默认|纪律 B|塞进默认包/.test(handbook0510) && /Codex|codex/.test(handbook0510), "handbook.md Codex 纪律 B");

  const wp0510 = readDoc("write-plan.md");
  assert(/纪律 B|不.*全部推荐/.test(wp0510) && /codex/i.test(wp0510), "write-plan Codex 纪律 B");

  const gloss0510 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/skill_version/.test(gloss0510) && /report_schema/.test(gloss0510), "glossary skill_version + report_schema");
  assert(/报告壳版本 ≠ skill|报告壳.*≠.*skill/.test(gloss0510), "glossary 报告壳 ≠ skill");

  const fillScore0510 = readDoc("fill-score.md");
  assert(
    /skill_version/.test(fillScore0510) && /report_schema|ui\.version/.test(fillScore0510),
    "fill-score pairs skill_version with report schema"
  );
  assert(/报告壳版本 ≠ skill|报告壳.*≠.*skill|≠.*skill_version/.test(fillScore0510), "fill-score 报告壳 ≠ skill");

  const reportUi0510 = fs.readFileSync(path.join(skillRoot, "scripts/lib/report-ui.mjs"), "utf8");
  assert(/report_schema/.test(reportUi0510), "report-ui.mjs names report_schema");
  const uiObj = buildReportUi({ overall: 0.5, domains: {} });
  assert(uiObj.version === "0.4.0", "ui.version 0.4.0 for consumers");
  assert(uiObj.report_schema === uiObj.version, "report_schema aliases ui.version");

  const reportTmpl0510 = fs.readFileSync(
    path.join(skillRoot, "templates/report/harness-report.html.tmpl"),
    "utf8"
  );
  assert(/skill_version/.test(reportTmpl0510), "report HTML shows skill_version");
  assert(/report_schema|报告壳 ≠ skill/.test(reportTmpl0510), "report HTML pairs report_schema / 报告壳 ≠ skill");

  const changelog0510 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  const changelog05x = fs.readFileSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/CHANGELOG-0.5.x.md"), "utf8");
  assert(/## 0\.5\.10/.test(changelog05x), "_history CHANGELOG-0.5.x has 0.5.10");
  assert(
    /CHANGELOG-0\.5\.x|_history\/harness-eng-docs-archive/.test(changelog0510),
    "hot CHANGELOG points to 0.5 archive or _history"
  );
  const archivedClPath = path.resolve(skillRoot, "../_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md");
  assert(fs.existsSync(archivedClPath), "_history CHANGELOG-through-0.4.md");
  assert(fs.existsSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/CHANGELOG-0.5.x.md")), "_history CHANGELOG-0.5.x.md");
  assert(!/^## 0\.5\.10/m.test(fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8")), "hot CHANGELOG no 0.5.10 section");
  if (fs.existsSync(archivedClPath)) {
    const archivedCl = fs.readFileSync(archivedClPath, "utf8");
    assert(/## 0\.4\.0/.test(archivedCl), "archived CHANGELOG has 0.4.0");
  }
  assert(!/^## 0\.4\.0/m.test(changelog0510), "main CHANGELOG dropped 0.4.0 body");

  const autoIdx = path.join(skillRoot, "archive/fill-truths-auto/INDEX.md");
  const histDocs = path.resolve(skillRoot, "../_history/harness-eng-docs-archive");
  const autoSpec = path.join(histDocs, "fill-truths-auto.md");
  const autoScript = path.join(histDocs, "fill-truths-auto.mjs");
  assert(fs.existsSync(autoIdx), "archive/fill-truths-auto/INDEX.md");
  assert(fs.existsSync(autoSpec), "_history fill-truths-auto spec");
  assert(fs.existsSync(autoScript), "_history fill-truths-auto script");
  assert(!fs.existsSync(path.join(skillRoot, "archive/fill-truths-auto/fill-truths-auto.mjs")), "fill-truths-auto.mjs not in archive pack");
  assert(!fs.existsSync(path.join(skillRoot, "fill-truths-auto.md")), "no root fill-truths-auto stub");
  const autoIdxText = fs.readFileSync(autoIdx, "utf8");
  assert(/对话不推荐|仅脚本/.test(autoIdxText), "fill-truths-auto INDEX 仅脚本、对话不推荐");
  const fillIdx0510 = fs.readFileSync(path.join(skillRoot, "fill/README.md"), "utf8");
  assert(/archive\/fill-truths-auto/.test(fillIdx0510), "fill/README points archive fill-truths-auto");
  const skill0510 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(
    /archive\/fill-truths-auto/.test(skill0510) && /对话不推荐|仅脚本/.test(skill0510),
    "SKILL demotes fill-truths-auto to archive / 对话不推荐"
  );

  const qnEmpty = runNode([
    path.join(skillRoot, "scripts/questions-next.mjs"),
    "--answers",
    JSON.stringify({
      type: "NEW_CODE_NO_HARNESS",
      mode: "land",
      ladder: "L4",
      answered_batches: ["batch-0-global", "batch-1-new"],
      answered: [
        "Q_RULE14",
        "Q_RULE21",
        "Q_FRONTEND_RULE",
        "Q_DB_MIGRATION",
        "Q_SEED",
        "Q_GLOB_PROFILE",
      ],
      fingerprint: { detected_ai_tools: [] },
    }),
  ]);
  assert(qnEmpty.status === 0, "questions-next 皆无探测 exits 0");
  if (qnEmpty.status === 0) {
    const qnDoc = JSON.parse(qnEmpty.stdout);
    const aiQ = (qnDoc.questions || []).find((q) => q.id === "Q_AI_TOOL");
    assert(aiQ, "questions-next surfaces Q_AI_TOOL");
    const rec = aiQ && aiQ.recommended;
    assert(
      Array.isArray(rec) && rec.length === 0,
      "皆无探测 Q_AI_TOOL recommended is [] not [cursor]"
    );
    assert(!(Array.isArray(rec) && rec.length === 1 && rec[0] === "cursor"), "皆无探测 does not force Cursor-only");
  }

  const qnCodex = runNode([
    path.join(skillRoot, "scripts/questions-next.mjs"),
    "--answers",
    JSON.stringify({
      type: "NEW_CODE_NO_HARNESS",
      mode: "land",
      ladder: "L4",
      answered_batches: ["batch-0-global", "batch-1-new"],
      answered: [
        "Q_RULE14",
        "Q_RULE21",
        "Q_FRONTEND_RULE",
        "Q_DB_MIGRATION",
        "Q_SEED",
        "Q_GLOB_PROFILE",
      ],
      fingerprint: { detected_ai_tools: ["codex"] },
    }),
  ]);
  if (qnCodex.status === 0) {
    const qnDoc2 = JSON.parse(qnCodex.stdout);
    const aiQ2 = (qnDoc2.questions || []).find((q) => q.id === "Q_AI_TOOL");
    assert(
      aiQ2 && Array.isArray(aiQ2.recommended) && aiQ2.recommended.includes("codex"),
      "detected .codex/ includes codex in recommended"
    );
    assert(
      aiQ2 && !aiQ2.recommended.includes("cursor"),
      "detected-only-codex does not also inject cursor"
    );
  }

  const tmpEmpty = fs.mkdtempSync(path.join(os.tmpdir(), "he-0510-empty-"));
  const pEmpty = path.join(tmpEmpty, "params.json");
  fs.writeFileSync(
    pEmpty,
    JSON.stringify({
      ladder: "L3",
      domains: ["func"],
      ai_tools: [],
      agents_variant: "solo",
      expandFromManifest: true,
      on_exists: "skip",
      placeholders: {
        REPO_NAME: "demo",
        REPO_DESC: "demo",
        DATE: "2026-09-12",
        AGENTS_VARIANT: "solo",
        LADDER_TARGET: "L3",
        GLOB_PROFILE: "wide",
        LAST_MODE: "land",
        GLOB_FUNC: "**/src/**,docs/func/**",
      },
    }),
    "utf8"
  );
  try {
    const rEmpty = runNode([
      path.join(skillRoot, "scripts/render.mjs"),
      "--root",
      tmpEmpty,
      "--params",
      pEmpty,
      "--dry-run",
    ]);
    assert(rEmpty.status === 0, "empty ai_tools L3 dry-run exits 0");
    if (rEmpty.status === 0) {
      const json = JSON.parse(rEmpty.stdout);
      const targets = (json.results || []).map((x) => String(x.target || "").replace(/\\/g, "/"));
      assert(targets.includes("AGENTS.md"), "empty ai_tools still writes AGENTS.md");
      assert(!targets.includes(".cursor/hooks.json"), "empty ai_tools does not emit Cursor hooks");
      assert(
        !targets.some((t) => t.includes("00-harness-ssot")),
        "empty ai_tools does not emit Cursor ssot adapter"
      );
      assert(!targets.some((t) => t.startsWith(".codex/")), "empty ai_tools does not emit Codex paths");
    }
  } finally {
    fs.rmSync(tmpEmpty, { recursive: true, force: true });
  }

  const renderSrc0510 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(
    !/aiTools\.size \? aiTools : new Set\(\["cursor"\]\)/.test(renderSrc0510),
    "render does not inject [cursor] when ai_tools empty"
  );
}


assert(fs.existsSync(path.join(skillRoot, "scripts/lib/selfcheck/checks-0.6.mjs")), "lib/selfcheck/checks-0.6.mjs exists");
assert(fs.existsSync(path.join(skillRoot, "scripts/lib/selfcheck/README.md")), "lib/selfcheck/README.md");
}
