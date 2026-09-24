/**
 * 0.6.x selfcheck suite (M1–M4 · Trae 高 · dashboard · freshness).
 * Invoked from scripts/selfcheck.mjs via runChecks06(helpers).
 */
import fs from "fs";
import os from "os";
import path from "path";
import { renderSessionDashboardMarkdown } from "../session-dashboard.mjs";
import { DOC_MOVES, ROOT_STUBS, ROOT_KEEP, ROOT_MD_MAX } from "../doc-paths.mjs";
import { HOOK_DEFS, buildContractChecksJs } from "../hooks-checks.mjs";
import { scanSignals } from "../detect-signals.mjs";
import { jsonServersToCodexToml } from "../codex-mcp-toml.mjs";

export function runChecks06({ skillRoot, docPath, readDoc, assert, runNode }) {
  // Re-load hot docs so this suite does not depend on outer-scope consts from selfcheck.mjs
  const readme = fs.readFileSync(path.join(skillRoot, "README.md"), "utf8");
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const handbookMd = fs.readFileSync(path.join(skillRoot, "使用手册.md"), "utf8");
  const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  const pipeline = readDoc("pipeline.md");
  const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");

  // Pack slim + Trae T-P2 (0.6.3 P1 rest)
  {
    const qs = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
    assert(/value: trae, label: Trae（高/.test(qs), "questions Trae label marks 高");
    const rec = readDoc("recommended-profile.md");
    assert(/勿写成吓退式「中高」/.test(rec), "recommended-profile Trae not scare 中高");
    const audit = readDoc("audit-report.md");
    assert(/未生成/.test(audit) && /未实证/.test(audit) && /\.trae\/rules/.test(audit), "audit-report Trae 未生成/未实证");
    const parity = fs.readFileSync(path.join(skillRoot, "host/TRAE-PARITY.md"), "utf8");
    assert(/T-P2-2.*✅/.test(parity) && /T-P2-4.*✅/.test(parity), "TRAE-PARITY T-P2-2…4 checked");
    assert(fs.existsSync(path.join(skillRoot, "scripts/lib/selfcheck/checks-0.5.mjs")), "checks-0.5.mjs present");
  }


// --- 0.6.0-dev M1: harness CLI · ROADMAP · G6 freeze · version pin ---
{
  const roadmapPath = path.resolve(skillRoot, "../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md");
  assert(fs.existsSync(roadmapPath), "_history ROADMAP-0.6.0.md body");
  assert(!fs.existsSync(path.join(skillRoot, "ROADMAP-0.6.0.md")), "no root ROADMAP stub (0.7.1)");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  assert(/G1/.test(roadmap) && /G7/.test(roadmap), "ROADMAP has G1–G7");
  assert(/M1/.test(roadmap) && /M4/.test(roadmap), "ROADMAP has M1–M4");
  assert(/pipeline-skeleton/.test(roadmap), "ROADMAP names pipeline-skeleton");
  assert(/入口单一|统一入口/.test(roadmap), "ROADMAP theme 统一入口");
  assert(/冻结/.test(roadmap) && /P2/.test(roadmap) && /另立项/.test(roadmap), "ROADMAP G6 Codex P2 freeze");
  assert(/非目标|Non-goals|不做/.test(roadmap), "ROADMAP lists non-goals");

  assert(/CHANGELOG/.test(readme), "README points CHANGELOG (ROADMAP archived)");
  const agentIndex060 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(!/\]\(ROADMAP-0\.6\.0\.md\)/.test(agentIndex060), "AGENT-INDEX no root ROADMAP link");
  const changelog060 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(
    /## 0\.6\.0\b/.test(changelog060) && /ROADMAP-0\.6\.0/.test(changelog060),
    "CHANGELOG 0.6.0 + ROADMAP"
  );
  assert(/^## 0\.6\.0\b/m.test(changelog060), "CHANGELOG has formal 0.6.0 heading");

  assert(fs.existsSync(path.join(skillRoot, "scripts/harness.mjs")), "harness.mjs");
  const harnessHelp = runNode([path.join(skillRoot, "scripts/harness.mjs"), "--help"]);
  assert(harnessHelp.status === 0 && /--root/.test(harnessHelp.stdout), "harness.mjs --help");
  assert(
    /pipeline-skeleton/.test(harnessHelp.stdout) &&
      /land\|resume\|upgrade\|pipeline-skeleton/.test(harnessHelp.stdout),
    "harness --help lists land|resume|upgrade|pipeline-skeleton"
  );

  assert(!fs.existsSync(path.join(skillRoot, "scripts/land.mjs")), "land.mjs removed (0.7.2)");

  const skill060 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  const wp060 = readDoc("write-plan.md");
  const conflict060 = readDoc("conflict-policy.md");
  const qs060 = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  const pipeline060 = readDoc("pipeline.md");
  for (const [label, text] of [
    ["SKILL.md", skill060],
    ["AGENT-INDEX.md", agentIndex060],
    ["write-plan.md", wp060],
    ["conflict-policy.md", conflict060],
    ["QUICKSTART.md", qs060],
    ["pipeline.md", pipeline060],
  ]) {
    assert(/harness\.mjs/.test(text), `${label} names harness.mjs as write entry`);
  }
  assert(/pipeline-skeleton/.test(pipeline060), "pipeline.md names pipeline-skeleton");
  assert(/pipeline-skeleton/.test(skill060) || /harness\.mjs/.test(skill060), "SKILL points harness CLI");

  const renderHelp = runNode([path.join(skillRoot, "scripts/render.mjs"), "--help"]);
  assert(renderHelp.status === 0, "render.mjs --help exits 0");
  assert(/harness\.mjs/.test(renderHelp.stdout), "render --help points to harness.mjs");

  const codex060 = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/codex.md"), "utf8");
  const aiTools060 = readDoc("ai-tools.md");
  // 0.6.9：Codex → 高；纪律 B；不做 .mdc 镜像
  assert(/\*\*高\*\*|对齐程度：\*\*高\*\*/.test(codex060), "adapters/codex.md is 高");
  assert(/不做/.test(codex060) && /mdc/.test(codex060), "adapters/codex.md no .mdc mirror");
  assert(!/0\.6\.x 冻结 P2/.test(codex060) && !/整列冻结/.test(codex060), "adapters/codex.md no blanket freeze claim");
  assert(/CODEX-PARITY/.test(aiTools060) && /\|\s*`codex`\s*\|\s*\*\*高\*\*/.test(aiTools060), "ai-tools.md Codex 高 + PARITY");
  assert(!/0\.6\.x 冻结 P2/.test(aiTools060), "ai-tools.md no blanket 0.6.x freeze P2");

  const rBadMode = runNode([
    path.join(skillRoot, "scripts/harness.mjs"),
    "--root",
    skillRoot,
    "--params",
    path.join(skillRoot, "scripts/selfcheck.mjs"),
    "--mode",
    "fill-all",
  ]);
  assert(rBadMode.status !== 0, "harness unknown --mode exits non-zero");
  assert(/land\|resume\|upgrade\|pipeline-skeleton/.test(rBadMode.stderr + rBadMode.stdout), "unknown mode lists legal modes");

  const tmpSkel = fs.mkdtempSync(path.join(os.tmpdir(), "harness-060-skel-"));
  try {
    const ph = {
      REPO_NAME: "demo",
      REPO_DESC: "demo",
      DATE: "2026-09-12",
      AGENTS_VARIANT: "solo",
      LADDER_TARGET: "L4",
      GLOB_PROFILE: "wide",
      LAST_MODE: "pipeline-skeleton",
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
    const pSkel = path.join(tmpSkel, "params.json");
    fs.writeFileSync(
      pSkel,
      JSON.stringify({
        ladder: "L4",
        domains: ["api"],
        ai_tools: ["cursor"],
        agents_variant: "solo",
        hooks_family: ["commit-gate"],
        expandFromManifest: true,
        placeholders: ph,
      }),
      "utf8"
    );
    const rSkel = runNode([
      path.join(skillRoot, "scripts/harness.mjs"),
      "--root",
      tmpSkel,
      "--params",
      pSkel,
      "--mode",
      "pipeline-skeleton",
      "--dry-run",
    ]);
    assert(rSkel.status === 0, "harness --mode pipeline-skeleton --dry-run exits 0");
    assert(
      /骨架/.test(rSkel.stderr + rSkel.stdout) && /fill/.test(rSkel.stderr + rSkel.stdout),
      "pipeline-skeleton banner says skeleton-only / no fill"
    );
    assert(
      !fs.existsSync(path.join(tmpSkel, "docs/harness-eng/fill-plan.yaml")),
      "pipeline-skeleton does not write fill-plan"
    );

    const pRefuse = path.join(tmpSkel, "params-refuse.json");
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
        placeholders: { ...ph, LADDER_TARGET: "L5" },
      }),
      "utf8"
    );
    const rRefuse = runNode([
      path.join(skillRoot, "scripts/harness.mjs"),
      "--root",
      tmpSkel,
      "--params",
      pRefuse,
      "--no-sync",
    ]);
    assert(rRefuse.status !== 0, "harness L5 refuses explicit .cursor/rules file");
  } finally {
    fs.rmSync(tmpSkel, { recursive: true, force: true });
  }
}

// --- 0.6.0-dev M2: document topology (modes / fill / host) ---
{
  const rootMds = fs
    .readdirSync(skillRoot)
    .filter((f) => f.endsWith(".md") && fs.statSync(path.join(skillRoot, f)).isFile());
  assert(rootMds.length <= ROOT_MD_MAX, `root harness-eng/*.md count ${rootMds.length} ≤ ${ROOT_MD_MAX}`);
  assert(rootMds.length <= 15, `root harness-eng/*.md ideally ≤15 (got ${rootMds.length})`);

  for (const keep of ROOT_KEEP) {
    assert(rootMds.includes(keep), `root keeps ${keep}`);
  }
  assert(Array.isArray(ROOT_STUBS) && ROOT_STUBS.length === 0, "ROOT_STUBS empty (0.7.1)");
  const unexpected = rootMds.filter((name) => !ROOT_KEEP.includes(name));
  assert(unexpected.length === 0, `no unexpected root md (${unexpected.join(", ") || "none"})`);

  for (const [from, to] of Object.entries(DOC_MOVES)) {
    assert(fs.existsSync(path.join(skillRoot, to)), `canonical ${to}`);
    assert(readDoc(from).length > 200, `readDoc(${from}) hits canonical`);
    const body = fs.readFileSync(path.join(skillRoot, to), "utf8");
    assert(body.length > 200 && !/^# .+\n\n正文已迁到/.test(body), `${to} is not a stub`);
  }

  assert(!fs.existsSync(path.join(skillRoot, "fill-truths-auto.md")), "no root fill-truths-auto stub");
  assert(fs.existsSync(path.join(skillRoot, "archive/fill-truths-auto/INDEX.md")), "archive fill-truths-auto INDEX");

  assert(fs.existsSync(path.join(skillRoot, "modes/README.md")), "modes/README.md");
  assert(fs.existsSync(path.join(skillRoot, "host/README.md")), "host/README.md");
  assert(fs.existsSync(path.join(skillRoot, "fill/README.md")), "fill/README.md");

  const agentIndexM2 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  const mustReadBlock = agentIndexM2.split("## 按需")[0];
  const mustReadRows = (mustReadBlock.match(/^\|/gm) || []).length - 2; // drop header + sep
  assert(mustReadRows > 0 && mustReadRows <= 8, `AGENT-INDEX 必读 rows ${mustReadRows} ≤8`);
  assert(/modes\/write-plan\.md/.test(agentIndexM2), "AGENT-INDEX points modes/write-plan.md");
  assert(/fill\/README\.md/.test(agentIndexM2), "AGENT-INDEX points fill/README");
  assert(/host\/ai-tools\.md/.test(agentIndexM2), "AGENT-INDEX points host/ai-tools.md");
  assert(/拓扑|modes\//.test(agentIndexM2), "AGENT-INDEX mentions new topology");

  const skillM2 = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert(/modes\/write-plan\.md/.test(skillM2), "SKILL points modes/write-plan.md");
  assert(/fill\/fill-score\.md/.test(skillM2), "SKILL points fill/fill-score.md");
  assert(/host\/ai-tools\.md/.test(skillM2), "SKILL points host/ai-tools.md");

  const roadmapM2 = fs.readFileSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md"), "utf8");
  assert(/\[x\].*T2\.1/.test(roadmapM2) && /\[x\].*T2\.5/.test(roadmapM2), "ROADMAP G2 T2.1–T2.5 checked");

  const changelogM2 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/G2|文档拓扑/.test(changelogM2), "CHANGELOG notes M2 / G2 文档拓扑");
  assert(/## 0\.6\.0\b/.test(changelogM2), "CHANGELOG has formal 0.6.0");

  const verifyM2 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/M2/.test(verifyM2) && /根目录/.test(verifyM2), "VERIFY has M2 section");

  function collectRelTargets(text) {
    const urls = [];
    const reMd = /\]\(([^)\s]+)\)/g;
    const reHref = /href="([^"]+)"/g;
    let m;
    while ((m = reMd.exec(text))) urls.push(m[1]);
    while ((m = reHref.exec(text))) urls.push(m[1]);
    return urls;
  }

  function danglingFrom(relFile) {
    const abs = path.join(skillRoot, relFile);
    if (!fs.existsSync(abs)) return [`missing source ${relFile}`];
    const text = fs.readFileSync(abs, "utf8");
    const dir = path.posix.dirname(relFile);
    const bad = [];
    for (const url of collectRelTargets(text)) {
      if (!url || /^(https?:|mailto:|data:|#|\/)/i.test(url)) continue;
      const pathname = url.split("#")[0];
      if (!pathname) continue;
      if (!/\.(md|html|yaml|yml|mjs)$/.test(pathname)) continue;
      const target = path.normalize(
        path.join(skillRoot, dir === "." ? pathname : path.join(dir, pathname))
      );
      if (!fs.existsSync(target)) bad.push(`${relFile} → ${url}`);
    }
    return bad;
  }

  const sweepFiles = [
    "SKILL.md",
    "AGENT-INDEX.md",
    "QUICKSTART.md",
    "fill/README.md",
    "modes/README.md",
    "host/README.md",
    ...fs.readdirSync(path.join(skillRoot, "modes")).filter((f) => f.endsWith(".md")).map((f) => `modes/${f}`),
    ...fs.readdirSync(path.join(skillRoot, "fill")).filter((f) => f.endsWith(".md")).map((f) => `fill/${f}`),
    ...fs.readdirSync(path.join(skillRoot, "host")).filter((f) => f.endsWith(".md")).map((f) => `host/${f}`),
  ];
  const dangling = sweepFiles.flatMap(danglingFrom);
  assert(dangling.length === 0, `no dangling relative links (${dangling.slice(0, 8).join(" ; ") || "none"})`);
}

// --- 0.6.0-dev M3: G3 fill engine convergence + G4 golden fixtures ---
{
  const domains = ["api", "func", "db", "redis", "jobs"];
  function readRel(rel) {
    return fs.readFileSync(path.join(skillRoot, rel), "utf8");
  }

  const invUni060 = readRel("scripts/fill-inventory.mjs");
  assert(/lib\/inventory-/.test(invUni060), "fill-inventory.mjs loads lib/inventory-*");
  assert(
    !/fill-inventory-\$\{domain\}/.test(invUni060) && !/fill-inventory-\$\{/.test(invUni060),
    "fill-inventory.mjs does not spawn domain scripts"
  );

  for (const id of domains) {
    assert(
      !fs.existsSync(path.join(skillRoot, `scripts/fill-inventory-${id}.mjs`)),
      `fill-inventory-${id}.mjs removed (0.7.2)`
    );
    assert(fs.existsSync(path.join(skillRoot, `scripts/lib/inventory-${id}.mjs`)), `lib/inventory-${id}.mjs`);
  }

  const mergeUni060 = readRel("scripts/fill-merge.mjs");
  assert(/--enrich-dto/.test(mergeUni060), "fill-merge.mjs accepts --enrich-dto");
  assert(/--auto-fill/.test(mergeUni060) && /--module/.test(mergeUni060), "fill-merge.mjs accepts api extras");
  assert(/mergeApi/.test(mergeUni060) && /lib\/merge-api\.mjs/.test(mergeUni060), "fill-merge.mjs uses lib/merge-api");

  for (const id of domains) {
    assert(
      !fs.existsSync(path.join(skillRoot, `scripts/fill-merge-${id}.mjs`)),
      `fill-merge-${id}.mjs removed (0.7.2)`
    );
  }

  const invHelpM3 = runNode([path.join(skillRoot, "scripts/fill-inventory.mjs"), "--help"]);
  assert(invHelpM3.status === 0 && /--domain/.test(invHelpM3.stdout), "M3 fill-inventory.mjs --help");
  for (const id of ["api", "db"]) {
    const h = runNode([path.join(skillRoot, "scripts/fill-inventory.mjs"), "--domain", id, "--help"]);
    assert(h.status === 0 && /--root/.test(h.stdout + h.stderr), `fill-inventory --domain ${id} --help`);
  }
  const mergeHelpM3 = runNode([path.join(skillRoot, "scripts/fill-merge.mjs"), "--help"]);
  assert(
    mergeHelpM3.status === 0 && /--domain/.test(mergeHelpM3.stdout) && /--enrich-dto/.test(mergeHelpM3.stdout),
    "M3 fill-merge.mjs --help lists --domain and --enrich-dto"
  );

  const fillIdxM3 = readRel("fill/README.md");
  assert(!/弃用.*shim|deprecated shim|域脚本是/i.test(fillIdxM3), "fill/README has no domain shim rows");
  assert(/只认统一 CLI|fill-inventory\.mjs --domain/.test(fillIdxM3), "fill/README documents unified CLI only");
  assert(/--enrich-dto/.test(fillIdxM3), "fill/README documents api enrich flags on unified merge");
  const fillMdM3 = readDoc("fill.md");
  assert(/--enrich-dto/.test(fillMdM3) && /fill-merge\.mjs --domain api/.test(fillMdM3), "fill.md api enrich on unified CLI");

  const golden = path.join(skillRoot, "scripts/fixtures/l5-sync-golden");
  assert(fs.existsSync(path.join(golden, "docs/agent-config/rules/00-overview.mdc")), "l5-sync-golden SSOT rule");
  assert(fs.existsSync(path.join(golden, "scripts/agent-config/sync.mjs")), "l5-sync-golden sync.mjs");
  const goldenSync = fs.readFileSync(path.join(golden, "scripts/agent-config/sync.mjs"), "utf8");
  assert(!/\{\{[A-Z]/.test(goldenSync), "l5-sync-golden sync.mjs has no template placeholders");
  assert(/\["cursor",\s*"claude"\]/.test(goldenSync), "l5-sync-golden AI_TOOLS cursor+claude");
  const goldenCheck = runNode([path.join(golden, "scripts/agent-config/sync.mjs"), "--check"], {
    cwd: golden,
  });
  assert(goldenCheck.status === 0, "l5-sync-golden sync --check exit 0");

  const tmpGold = fs.mkdtempSync(path.join(os.tmpdir(), "harness-060-l5-gold-"));
  try {
    fs.cpSync(golden, tmpGold, { recursive: true });
    const tmpl = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
    const rerendered = tmpl.replaceAll("{{AI_TOOLS_JSON}}", JSON.stringify(["cursor", "claude"]));
    fs.writeFileSync(path.join(tmpGold, "scripts/agent-config/sync.mjs"), rerendered, "utf8");
    const rerenderCheck = runNode([path.join(tmpGold, "scripts/agent-config/sync.mjs"), "--check"], {
      cwd: tmpGold,
    });
    assert(rerenderCheck.status === 0, "l5-sync-golden --check still green with re-rendered sync.mjs");
  } finally {
    fs.rmSync(tmpGold, { recursive: true, force: true });
  }

  const multi = path.join(skillRoot, "scripts/fixtures/multi-host-hooks");
  assert(fs.existsSync(path.join(multi, ".cursor/hooks.json")), "multi-host-hooks cursor hooks.json");
  assert(fs.existsSync(path.join(multi, ".claude/settings.json")), "multi-host-hooks claude settings");
  assert(fs.existsSync(path.join(multi, ".qoder/settings.json")), "multi-host-hooks qoder settings");
  assert(fs.existsSync(path.join(multi, ".trae/hooks.json")), "multi-host-hooks trae hooks.json");
  assert(fs.existsSync(path.join(multi, ".codebuddy/settings.json")), "multi-host-hooks workbuddy settings");
  const multiTrae = JSON.parse(fs.readFileSync(path.join(multi, ".trae/hooks.json"), "utf8"));
  const multiClaude = JSON.parse(fs.readFileSync(path.join(multi, ".claude/settings.json"), "utf8"));
  assert(
    JSON.stringify(multiTrae).includes("RunCommand"),
    "multi-host-hooks Trae matcher includes RunCommand"
  );
  assert(
    JSON.stringify(multiClaude).includes("Bash") && !JSON.stringify(multiClaude).includes("RunCommand"),
    "multi-host-hooks Claude matcher stays Bash"
  );
  const multiSig = scanSignals(multi);
  assert(multiSig.S_HOOKS, "multi-host-hooks S_HOOKS");

  const matureFixM3 = path.join(skillRoot, "scripts/fixtures/mature-claude");
  const matureTraeFixM3 = path.join(skillRoot, "scripts/fixtures/mature-trae");
  const qoderFixM3 = path.join(skillRoot, "scripts/fixtures/qoder-hooks");
  const stackFixM3 = path.join(skillRoot, "scripts/fixtures/stack-node");
  const matureSigM3 = scanSignals(matureFixM3);
  assert(matureSigM3.MATURE && !matureSigM3.S_CURSOR_RULES, "mature-claude still MATURE without cursor");
  const matureTraeSigM3 = scanSignals(matureTraeFixM3);
  assert(matureTraeSigM3.MATURE && !matureTraeSigM3.S_CURSOR_RULES, "mature-trae still MATURE without cursor");
  assert(scanSignals(qoderFixM3).S_HOOKS, "qoder-hooks still S_HOOKS");
  assert(scanSignals(stackFixM3).S_STACK && !scanSignals(stackFixM3).MATURE, "stack-node still S_STACK only");

  const roadmapM3 = fs.readFileSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md"), "utf8");
  assert(/\[x\].*T3\.1/.test(roadmapM3) && /\[x\].*T3\.3/.test(roadmapM3), "ROADMAP G3 T3.1–T3.3 checked");
  assert(/\[x\].*T4\.1/.test(roadmapM3) && /\[x\].*T4\.3/.test(roadmapM3), "ROADMAP G4 T4.1–T4.3 checked");

  const changelogM3 = readRel("CHANGELOG.md");
  assert(/G3|fill 引擎|内聚/.test(changelogM3) && /G4|黄金集|fixture/.test(changelogM3), "CHANGELOG notes M3 G3/G4");
  assert(/## 0\.6\.0\b/.test(changelogM3), "CHANGELOG has formal 0.6.0");

  const verifyM3 = readRel("VERIFY.md");
  assert(/M3/.test(verifyM3) && /l5-sync-golden|黄金/.test(verifyM3), "VERIFY has M3 section");
}

// --- 0.6.0 M4: G5 slim pack + G6 freeze verify + G7 formal pin ---
{
  function readRel(rel) {
    return fs.readFileSync(path.join(skillRoot, rel), "utf8");
  }

  const skillIgnorePath = path.join(skillRoot, ".skillignore");
  assert(fs.existsSync(skillIgnorePath), ".skillignore exists");
  const skillIgnore = fs.existsSync(skillIgnorePath) ? readRel(".skillignore") : "";
  assert(/archive\/selfcheck\/legacy/.test(skillIgnore), ".skillignore excludes archive/selfcheck/legacy");

  const archReadmeM4 = readRel("archive/README.md");
  assert(/安装\s*≠\s*全仓|安装不等于全仓|发包/.test(archReadmeM4), "archive README packaging policy");
  assert(/legacy/.test(archReadmeM4) && /git|历史|_history/.test(archReadmeM4), "archive README points where legacy lives");

  const selfcheckReadmeM4 = readRel("archive/selfcheck/README.md");
  assert(/INDEX|git|历史|_history/.test(selfcheckReadmeM4), "archive/selfcheck README points history");

  const legacyDirM4 = path.join(skillRoot, "archive/selfcheck/legacy");
  const legacyIdxPath = path.join(legacyDirM4, "INDEX.md");
  assert(fs.existsSync(legacyIdxPath), "legacy INDEX remains in skill tree");
  const legacyIdxM4 = fs.existsSync(legacyIdxPath) ? readRel("archive/selfcheck/legacy/INDEX.md") : "";
  assert(/git|_history|历史/.test(legacyIdxM4), "legacy INDEX explains history location");
  const legacyMjsM4 = fs.existsSync(legacyDirM4)
    ? fs.readdirSync(legacyDirM4).filter((n) => n.endsWith(".mjs"))
    : ["missing-dir"];
  assert(legacyMjsM4.length === 0, "hot package has no legacy selfcheck .mjs bulk");

  assert(
    fs.existsSync(path.join(skillRoot, "archive/selfcheck/INDEX.md")),
    "archive/selfcheck INDEX after pack slim"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.4.0.mjs")),
    "hot package no longer keeps 0.4 archived selfcheck bulk"
  );
  assert(
    !fs.existsSync(path.join(skillRoot, "archive/selfcheck/selfcheck-0.5.1.mjs")),
    "hot package no longer keeps 0.5 archived selfcheck bulk"
  );
  assert(
    fs.existsSync(path.join(skillRoot, "archive/fill-truths-auto/INDEX.md")),
    "fill-truths-auto remains archived"
  );

  const historyDir = path.resolve(skillRoot, "../_history/harness-eng-selfcheck-legacy");
  assert(fs.existsSync(path.join(historyDir, "INDEX.md")), "_history/harness-eng-selfcheck-legacy/INDEX.md");
  assert(
    fs.existsSync(path.join(historyDir, "selfcheck-0.3.10.mjs")),
    "legacy bulk lives in _history (0.3.10)"
  );
  assert(
    fs.existsSync(path.join(historyDir, "selfcheck-0.2.10.mjs")),
    "legacy bulk lives in _history (0.2.10)"
  );
  assert(
    fs.existsSync(path.join(historyDir, "selfcheck-0.5.1.mjs")),
    "0.5.1 bulk lives in _history after pack slim"
  );
  assert(
    fs.existsSync(path.join(historyDir, "selfcheck-0.4.0.mjs")),
    "0.4.0 bulk lives in _history after pack slim"
  );

  const manifestM4 = readRel("templates/_meta/manifest.yaml");
  const verLine = manifestM4.match(/^version:\s*"([^"]+)"/m);
  assert(verLine && verLine[1] === "0.7.2", "manifest version exactly 0.7.1");

  const roadmapM4 = fs.readFileSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md"), "utf8");
  assert(/\[x\].*T5\.1/.test(roadmapM4) && /\[x\].*T5\.3/.test(roadmapM4), "ROADMAP G5 T5.1–T5.3 checked");
  assert(/\[x\].*T7\.1/.test(roadmapM4) && /\[x\].*T7\.3/.test(roadmapM4), "ROADMAP G7 T7.1–T7.3 checked");
  assert(/列车已收口|列车完成|正式 0\.6\.0.*收口/.test(roadmapM4), "ROADMAP notes train complete");
  assert(/M1–M4 已|M1-M4 已|M4.*已完成|已完成（M1–M4）/.test(roadmapM4), "ROADMAP marks M1–M4 done");

  const changelogM4 = readRel("CHANGELOG.md");
  assert(/^## 0\.6\.0\b/m.test(changelogM4), "CHANGELOG formal 0.6.0 section");
  assert(!/^## Unreleased/m.test(changelogM4), "CHANGELOG no Unreleased heading");
  assert(/G5/.test(changelogM4) && /发包|legacy/.test(changelogM4), "CHANGELOG notes G5 slim pack");
  assert(/M1/.test(changelogM4) && /M2/.test(changelogM4) && /M3/.test(changelogM4) && /M4/.test(changelogM4), "CHANGELOG summarizes M1–M4");

  const verifyM4 = readRel("VERIFY.md");
  assert(/M4/.test(verifyM4) && /legacy|发包/.test(verifyM4), "VERIFY has M4 packaging section");

  const upgradeM4 = readDoc("upgrade.md");
  assert(/0\.5\.10 → 0\.6\.0/.test(upgradeM4), "upgrade has 0.5.10 → 0.6.0");
  assert(/skill_version.*`?0\.6\.0`?/.test(upgradeM4), "upgrade pins skill_version 0.6.0");
  assert(!/进行中 · 0\.6\.0-dev/.test(upgradeM4), "upgrade checklist no longer in-progress -dev");

  const codexM4 = readRel("templates/ai-tools/adapters/codex.md");
  const aiToolsM4 = readDoc("ai-tools.md");
  assert(/\*\*高\*\*/.test(codexM4), "G6 updated: adapters/codex.md is 高");
  assert(/不做/.test(codexM4) && /mdc/.test(codexM4), "G6 spirit: no .mdc full mirror");
  assert(/不做/.test(codexM4 + aiToolsM4) && /mdc/.test(codexM4 + aiToolsM4), "G6 spirit: no .mdc mirror");
  assert(!/全家桶对等已落地|全量 sync 已/.test(codexM4 + aiToolsM4), "G6 no false full-parity claim");
}

// --- 0.6.1: Trae 高 formal pin (evidence · MCP panel PASS · matrix 高) ---
{
  const evidencePath = path.resolve(skillRoot, "../_history/harness-eng-docs-archive/TRAE-P0-EVIDENCE.md");
  assert(fs.existsSync(evidencePath), "_history TRAE-P0-EVIDENCE.md");
  assert(!fs.existsSync(path.join(skillRoot, "host/TRAE-P0-EVIDENCE.md")), "no host TRAE-P0-EVIDENCE stub");
  const evidence = fs.readFileSync(evidencePath, "utf8");
  assert(/T-P0-1/.test(evidence) && /T-P0-4/.test(evidence), "TRAE-P0-EVIDENCE has T-P0-1…4");
  assert(/docs PASS/.test(evidence) && /partial/.test(evidence), "TRAE-P0-EVIDENCE statuses");
  assert(/RunCommand/.test(evidence) && /alwaysApply/.test(evidence), "TRAE-P0-EVIDENCE cites FM + RunCommand");
  assert(/docs\.trae\.ai\/ide\/rules/.test(evidence), "TRAE-P0-EVIDENCE cites official rules URL");
  assert(fs.existsSync(path.join(skillRoot, "host/TRAE-P0-MANUAL.md")), "TRAE-P0-MANUAL.md");
  const manual = fs.readFileSync(path.join(skillRoot, "host/TRAE-P0-MANUAL.md"), "utf8");
  assert(/RunCommand/.test(manual) && /MCP/.test(manual) && /Specific Files|globs/.test(manual), "MANUAL covers hooks/MCP/rules");

  const traeAd = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/trae.md"), "utf8");
  assert(!/若宿主支持/.test(traeAd), "trae adapter dropped 若宿主支持");
  assert(/一等公民/.test(traeAd), "trae adapter skills first-class");
  assert(/alwaysApply/.test(traeAd) && /globs/.test(traeAd), "trae adapter documents native FM");
  assert(/RunCommand/.test(traeAd), "trae adapter notes RunCommand matcher risk");
  assert(/TRAE-P0-EVIDENCE/.test(traeAd), "trae adapter links evidence");
  assert(/刷新/.test(traeAd) && /sync\.mjs/.test(traeAd), "trae adapter notes consumer sync.mjs refresh");

  const parity061 = fs.readFileSync(path.join(skillRoot, "host/TRAE-PARITY.md"), "utf8");
  assert(/TRAE-P0-EVIDENCE/.test(parity061) && /0\.6\.1/.test(parity061), "TRAE-PARITY links evidence + 0.6.1");
  assert(/0\.6\.1-dev/.test(parity061), "TRAE-PARITY still records 0.6.1-dev spike lineage");
  assert(/消费仓/.test(parity061) && /刷新/.test(parity061), "TRAE-PARITY T-P0-1 consumer refresh required");
  assert(/IDE 已消费|已消费/.test(parity061), "TRAE-PARITY T-P0-2 IDE consumes file");
  assert(/新会话/.test(parity061), "TRAE-PARITY still records 新会话 recipe caveat");
  assert(/Hooks 复测 PASS|live PASS/.test(parity061), "TRAE-PARITY records hooks live PASS");
  assert(/单独不授权/.test(parity061), "TRAE-PARITY: hooks PASS alone does not authorize 高");
  assert(/不假装/.test(parity061) && /Cursor 协议/.test(parity061), "TRAE-PARITY keeps 不假装 Cursor 协议");
  assert(/^- \[x\] T-P0-2/m.test(parity061), "TRAE-PARITY checks T-P0-2");
  assert(/^- \[x\] T-P0-3/m.test(parity061), "TRAE-PARITY checks T-P0-3");
  assert(/^- \[x\] T-P1-2/m.test(parity061), "TRAE-PARITY checks T-P1-2");
  assert(/^- \[x\] T-P1-3/m.test(parity061), "TRAE-PARITY checks T-P1-3");
  assert(/^- \[x\] T-P1-4/m.test(parity061), "TRAE-PARITY checks T-P1-4");
  assert(/^- \[x\] T-P1-5/m.test(parity061), "TRAE-PARITY checks T-P1-5");
  const aiTools061 = readDoc("ai-tools.md");
  assert(/\|\s*`trae`\s*\|\s*\*\*高\*\*/.test(aiTools061), "ai-tools.md marks Trae as 高");
  assert(/Settings/.test(aiTools061) && /\.trae\/mcp\.json/.test(aiTools061), "ai-tools.md Trae MCP + Settings enable");
  assert(!/\|\s*`trae`\s*\|\s*\*\*中高\*\*/.test(aiTools061), "matrix Trae no longer 中高");

  const render061 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/preserveFrontmatter/.test(render061), "render.mjs Trae preserveFrontmatter branch");
  const syncTmpl061 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/function toHostMd\s*\(\s*rule\s*,\s*host\s*\)/.test(syncTmpl061), "toHostMd takes (rule, host)");
  assert(/host === "trae"/.test(syncTmpl061), "sync.mjs.tmpl toHostMd branches by trae");
  assert(/host === "trae"[\s\S]{0,200}rule\.raw/.test(syncTmpl061), "trae toHostMd preserve uses rule.raw");

  assert(/实机回传 2026-09-12 Trae CN/.test(evidence), "EVIDENCE has 2026-09-12 Trae CN session section");
  assert(/实例化/.test(evidence) && /sync\.mjs/.test(evidence), "EVIDENCE records T-P0-1 consumer sync.mjs drift");
  assert(/mcp_gitlab/.test(evidence) && /mcp_Apifox_Dao_Ru/.test(evidence), "EVIDENCE records IDE-consumed MCP names");
  assert(/disable-model-invocation/.test(evidence), "EVIDENCE records T-P0-4 SKILL.md FM honor");

  assert(/sync\.mjs/.test(manual) && /刷新|重写|落地/.test(manual), "MANUAL has consumer sync.mjs refresh recipe");
  assert(/新.*会话/.test(manual) && /git commit/.test(manual), "MANUAL hooks probe in new session");
  assert(/dry-run/.test(manual), "MANUAL keeps git commit --dry-run probe");

  const changelog061 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.1\b/m.test(changelog061), "CHANGELOG formal 0.6.1 section");
  assert(/0\.6\.1-dev/.test(changelog061), "CHANGELOG folds 0.6.1-dev notes");
  assert(/刷新/.test(changelog061) && /sync\.mjs/.test(changelog061), "CHANGELOG notes consumer sync.mjs refresh");
  assert(/00-harness-ssot/.test(changelog061), "CHANGELOG 0.6.1 notes L5 SSOT 00");
  const roadmap061 = fs.readFileSync(path.resolve(skillRoot, "../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md"), "utf8");
  assert(/0\.6\.1-dev/.test(roadmap061) && /spike|开工/.test(roadmap061), "ROADMAP notes 0.6.1 Trae spike started");
  assert(/0\.6\.1/.test(roadmap061) && /高/.test(roadmap061), "ROADMAP notes 0.6.1 Trae 高 pin");
  const verify061 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/0\.6\.1/.test(verify061) && /mature-trae|Trae P0/.test(verify061), "VERIFY has 0.6.1 Trae P0 section");

  assert(/2026-09-12/.test(evidence) && /stale|过期/.test(evidence), "EVIDENCE records 2026-09-12 sync stale cleanup");
  assert(/git restore|从 git 恢复/.test(evidence) && /❌/.test(evidence), "EVIDENCE marks git-restore orphans as wrong");
  assert(/00-harness-ssot\.mdc/.test(evidence), "EVIDENCE points 00 at SSOT");
  assert(/不要|勿|不要\s*`?git/.test(manual) && /00-harness-ssot/.test(manual), "MANUAL says do not git-restore host 00");
  assert(/1x-contract-sync/.test(manual) && /消失|gone|不要从 git/.test(manual), "MANUAL expects 1x gone after sync");
  assert(/00-harness-ssot/.test(parity061) && /SSOT/.test(parity061), "TRAE-PARITY notes L5 00 via SSOT");
  assert(/00-harness-ssot\.mdc/.test(traeAd), "trae adapter points L5 00 at SSOT");
  assert(/L5_SSOT_HARNESS_TARGET|00-harness-ssot\.mdc/.test(render061), "render.mjs L5 SSOT 00 constant or target");
  assert(/1x-contract-sync/.test(syncTmpl061) && /00-harness-ssot/.test(syncTmpl061), "sync.mjs.tmpl header documents 1x/00 prune");

  assert(/Round A/.test(evidence) && /c-be-sms-ai/.test(evidence), "EVIDENCE Round A names c-be-sms-ai");
  assert(/磁盘 \+ 行为 PASS|磁盘\+行为 PASS/.test(evidence), "EVIDENCE Round A T-P0-1 disk+behavior PASS");
  assert(/1x-contract-sync/.test(evidence) && /#17/.test(evidence), "EVIDENCE Round A confirms no 1x (#17)");
  assert(/17-frontend-web/.test(evidence) && /globs/.test(evidence), "EVIDENCE Round A selective globs injection");
  assert(/Round C/.test(evidence) && /本机行为 FAIL/.test(evidence), "EVIDENCE Round C T-P0-3 local FAIL");
  assert(/误诊/.test(evidence) && /RunCommand/.test(evidence), "EVIDENCE reclassifies Round C as matcher misdiagnosis");
  assert(/Settings/.test(evidence) && /Hooks/.test(evidence) && /新会话/.test(evidence), "EVIDENCE requires Settings→Hooks + new session retest");
  assert(/Hooks 复测 PASS/.test(evidence), "EVIDENCE has dated Hooks 复测 PASS section");
  assert(/2026-09-14/.test(evidence) && /additionalContext|additional_context/.test(evidence), "EVIDENCE 2026-09-14 additionalContext injection");
  assert(/软/.test(evidence) && /allow|放行|不阻断/.test(evidence), "EVIDENCE hooks retest soft allow");
  assert(/单独不授权/.test(evidence), "EVIDENCE: hooks PASS alone does not authorize 高");
  assert(/beforeShellExecution/.test(evidence) && /\.cursor\/hooks\.json/.test(evidence), "EVIDENCE Round B invalid Cursor channel");
  assert(/永远不要|勿/.test(manual) && /\.cursor\/hooks\.json/.test(manual) && /beforeShellExecution/.test(manual), "MANUAL forbids Cursor channel as Trae hooks evidence");
  assert(/RunCommand/.test(manual) && /Settings/.test(manual) && /Hooks/.test(manual), "MANUAL probe uses RunCommand + Settings→Hooks");
  assert(/additionalContext|systemMessage/.test(manual), "MANUAL expects systemMessage/additionalContext");
  assert(/\.githooks/.test(manual), "MANUAL keeps .githooks as fallback");
  assert(/Hooks 复测 PASS|Hooks 探测 PASS/.test(manual), "MANUAL marks Hooks probe PASS");
  assert(/CRLF/.test(manual), "MANUAL notes CRLF staging pitfall");
  assert(/本机行为 FAIL/.test(parity061) && /误诊/.test(parity061), "TRAE-PARITY T-P0-3 FAIL reclassified as matcher misdiagnosis");
  assert(/Round A/.test(parity061) && /PASS/.test(parity061), "TRAE-PARITY T-P0-1 Round A PASS");
  assert(/RunCommand/.test(traeAd) && /beforeShellExecution/.test(traeAd), "trae adapter documents RunCommand + forbids Cursor channel");
  assert(/Round C/.test(changelog061) && /本机行为 FAIL/.test(changelog061), "CHANGELOG notes Round C FAIL");
  assert(
    /误诊/.test(changelog061) && /RunCommand/.test(changelog061),
    "CHANGELOG reclassifies Round C as matcher misdiagnosis + RunCommand fix"
  );
  assert(/Settings/.test(changelog061) && /Hooks/.test(changelog061), "CHANGELOG requires Settings→Hooks enable project");
  assert(
    /中高\s*→\s*高|中高 → 高/.test(changelog061) && /MCP 面板 PASS|T-P0-2 PASS/.test(changelog061),
    "CHANGELOG 0.6.1 records Trae 高 + MCP panel PASS"
  );
  assert(/Hooks 复测 PASS/.test(changelog061) && /2026-09-14/.test(changelog061), "CHANGELOG notes Hooks live PASS after T-P1-2");
  assert(/单独不授权/.test(changelog061), "CHANGELOG: hooks PASS alone does not authorize 高");
  assert(/live PASS|Hooks live PASS|Hooks 复测 PASS/.test(traeAd), "trae adapter notes Hooks live PASS");
  assert(/单独不授权/.test(traeAd), "trae adapter: hooks PASS alone does not authorize 高");
  assert(/\*\*高\*\*/.test(traeAd) && !/\*\*中高\*\*/.test(traeAd), "trae adapter alignment 高");
  assert(/Settings/.test(traeAd) && /开关|toggle/.test(traeAd), "trae adapter MCP Settings toggles");

  assert(/MCP 面板 PASS|Settings MCP/.test(evidence) && /\b12\b/.test(evidence), "EVIDENCE MCP panel 12 servers");
  assert(/gitlab/.test(evidence) && /chrome-devtools/.test(evidence) && /Apifox/.test(evidence), "EVIDENCE MCP ON trio");
  assert(/sonarqube/.test(evidence) && /redis/.test(evidence) && /mysql/.test(evidence), "EVIDENCE MCP OFF via toggle");
  assert(/T-P0-2/.test(evidence) && /\*\*PASS\*\*/.test(evidence), "EVIDENCE marks T-P0-2 PASS");
  assert(/开关|toggle/.test(evidence) && /误读|toggled off/.test(evidence), "EVIDENCE explains earlier 缺 7 台 misread");

  const fillMcp061 = readDoc("fill-mcp.md");
  assert(/\.trae\/mcp\.json/.test(fillMcp061) && /Settings/.test(fillMcp061), "fill-mcp.md Trae path + Settings enable");
  const mcpPaths061 = fs.readFileSync(path.join(skillRoot, "scripts/lib/mcp-paths.mjs"), "utf8");
  assert(/\.trae\/mcp\.json/.test(mcpPaths061) && /Settings/.test(mcpPaths061), "mcp-paths.mjs documents Settings enable");
  const syncHosts061 = readDoc("sync-hosts.md");
  assert(/trae[\s\S]{0,80}\*\*高\*\*/.test(syncHosts061) || /\|\s*trae\s*\|[^\n]*\*\*高\*\*/.test(syncHosts061), "sync-hosts.md Trae 高");
  const qs061 = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  assert(/Trae \*\*高\*\*/.test(qs061) || /\*\*Trae 高\*\*/.test(qs061), "QUICKSTART Trae 高");
  assert(/Trae[\s\S]{0,40}\*\*高\*\*/.test(handbookMd), "手册 Trae 高");

  // T-P1-4: thin Trae L5 sync path nails (no huge golden tree)
  assert(/\.trae\/rules\/\$\{rule\.name/.test(syncTmpl061), "sync.mjs.tmpl distributes Trae L5 rules");
  assert(/\.trae\/hooks\.json/.test(syncTmpl061), "sync.mjs.tmpl L5 Trae hooks path");
  assert(/\.trae\/mcp\.json/.test(syncTmpl061), "sync.mjs.tmpl L5 Trae MCP path");
  const renderSelfcheck061 = fs.readFileSync(path.join(skillRoot, "scripts/selfcheck-render.mjs"), "utf8");
  assert(/l5-trae-ssot-00-harness/.test(renderSelfcheck061), "selfcheck-render nails L5 Trae SSOT 00");
  const matureTraeReadme061 = fs.readFileSync(
    path.join(skillRoot, "scripts/fixtures/mature-trae/README.fixture.md"),
    "utf8"
  );
  assert(/L5|sync/.test(matureTraeReadme061) && /\.trae\/rules/.test(matureTraeReadme061), "mature-trae README nails L5 sync paths");

  // T-P1-2: adapter soft-allow must emit Trae hookSpecificOutput.additionalContext
  {
    const tmpAd = fs.mkdtempSync(path.join(os.tmpdir(), "harness-adapter-soft-"));
    try {
      const adapterSrc = fs.readFileSync(
        path.join(skillRoot, "templates/hooks/claude-adapter.js"),
        "utf8"
      );
      fs.writeFileSync(path.join(tmpAd, "claude-adapter.js"), adapterSrc, "utf8");
      fs.writeFileSync(
        path.join(tmpAd, "soft-allow.js"),
        [
          "#!/usr/bin/env node",
          "process.stdout.write(JSON.stringify({",
          '  permission: "allow",',
          '  agent_message: "soft reminder for commit",',
          "}));",
          "",
        ].join("\n"),
        "utf8"
      );
      const soft = runNode(
        [path.join(tmpAd, "claude-adapter.js"), "shell-gate", "soft-allow.js"],
        {
          cwd: tmpAd,
          input: JSON.stringify({
            hook_event_name: "PreToolUse",
            tool_name: "RunCommand",
            tool_input: { command: "git commit --dry-run" },
          }),
        }
      );
      assert(soft.status === 0, "adapter soft-allow exits 0");
      let softOut = {};
      try {
        softOut = JSON.parse(String(soft.stdout || "").trim());
      } catch {
        softOut = {};
      }
      assert(
        softOut.systemMessage === "soft reminder for commit",
        "adapter soft-allow keeps Claude systemMessage"
      );
      assert(
        softOut.hookSpecificOutput &&
          softOut.hookSpecificOutput.hookEventName === "PreToolUse" &&
          softOut.hookSpecificOutput.permissionDecision === "allow" &&
          softOut.hookSpecificOutput.additionalContext === "soft reminder for commit",
        "adapter soft-allow emits Trae additionalContext"
      );

      fs.writeFileSync(
        path.join(tmpAd, "soft-deny.js"),
        [
          "#!/usr/bin/env node",
          "process.stdout.write(JSON.stringify({",
          '  permission: "deny",',
          '  agent_message: "blocked",',
          "}));",
          "",
        ].join("\n"),
        "utf8"
      );
      const deny = runNode(
        [path.join(tmpAd, "claude-adapter.js"), "shell-gate", "soft-deny.js"],
        {
          cwd: tmpAd,
          input: JSON.stringify({
            hook_event_name: "PreToolUse",
            tool_name: "RunCommand",
            tool_input: { command: "rm -rf /" },
          }),
        }
      );
      let denyOut = {};
      try {
        denyOut = JSON.parse(String(deny.stdout || "").trim());
      } catch {
        denyOut = {};
      }
      assert(
        denyOut.hookSpecificOutput &&
          denyOut.hookSpecificOutput.permissionDecision === "deny" &&
          denyOut.hookSpecificOutput.permissionDecisionReason === "blocked",
        "adapter deny path still uses hookSpecificOutput"
      );

      // stop-check must never force Claude-family session continuation
      fs.writeFileSync(
        path.join(tmpAd, "stop-followup.js"),
        [
          "#!/usr/bin/env node",
          "process.stdout.write(JSON.stringify({",
          '  permission: "allow",',
          '  followup_message: "【交付收口】未提交改动 — should not resume",',
          "}));",
          "",
        ].join("\n"),
        "utf8"
      );
      const stopOut = runNode(
        [path.join(tmpAd, "claude-adapter.js"), "stop-check", "stop-followup.js"],
        {
          cwd: tmpAd,
          input: JSON.stringify({
            hook_event_name: "Stop",
            stop_hook_active: false,
          }),
        }
      );
      assert(stopOut.status === 0, "adapter stop-check exits 0");
      let stopJson = {};
      try {
        stopJson = JSON.parse(String(stopOut.stdout || "").trim() || "{}");
      } catch {
        stopJson = { __parse_error: true };
      }
      assert(!stopJson.__parse_error, "adapter stop-check emits JSON");
      assert(
        stopJson.decision !== "block" &&
          !stopJson.reason &&
          !(stopJson.hookSpecificOutput && stopJson.hookSpecificOutput.additionalContext),
        "adapter stop-check must not block or inject Stop additionalContext"
      );
      assert(
        Object.keys(stopJson).length === 0,
        "adapter stop-check returns empty object (observe-only)"
      );
    } finally {
      fs.rmSync(tmpAd, { recursive: true, force: true });
    }
  }
}

// --- 0.6.2: session dashboard drops mermaid (Trae Syntax Error) ---
{
  const changelog062 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.2\b/m.test(changelog062), "CHANGELOG formal 0.6.2 section");
  assert(/quadrantChart|mermaid/.test(changelog062) && /施工态势/.test(changelog062), "CHANGELOG 0.6.2 notes mermaid drop + 施工态势");
  const libDash062 = fs.readFileSync(path.join(skillRoot, "scripts/lib/session-dashboard.mjs"), "utf8");
  assert(!/quadrantChart/.test(libDash062) && !/```mermaid/.test(libDash062), "session-dashboard.mjs emits no mermaid");
  assert(/施工态势/.test(libDash062) && /stanceQuadrant/.test(libDash062), "session-dashboard.mjs plain-text stanceQuadrant");
  const upgrade062 = readDoc("upgrade.md");
  assert(/0\.6\.1 → 0\.6\.2/.test(upgrade062), "upgrade has 0.6.1 → 0.6.2");

  const dashSkeleton = {
    root: "/tmp/he-stance",
    sessionMode: "audit",
    sessionPhase: "—",
    preauth: "—",
    decision: { ai_coding_ready: false, label: "建议暂缓", blockers: [] },
    diagnose: { ladder: "L3", domains: "api" },
    task: { line: "—" },
    reportPath: null,
    reportExpectedRel: null,
    reportExists: false,
    scorePath: null,
    handbookPath: "使用手册.md",
    handbookUrl: null,
  };
  const stanceMd = (coverage, morph) =>
    renderSessionDashboardMarkdown({
      ...dashSkeleton,
      trend: { coverage, morph, composite: null, overall: morph == null ? null : morph * 100 },
    });
  assert(
    /施工态势：覆盖 80% × 形态 40%（Q1 补形态）/.test(stanceMd(0.8, 0.4)),
    "stance Q1 补形态 (high coverage, low morph)"
  );
  assert(
    /施工态势：覆盖 50% × 形态 50%（Q2 理想区）/.test(stanceMd(0.5, 0.5)),
    "stance Q2 理想区 at 0.5 boundary"
  );
  assert(
    /施工态势：覆盖 0% × 形态 0%（Q3 起步）/.test(stanceMd(0, 0)),
    "stance Q3 起步 (low coverage, low morph)"
  );
  assert(
    /施工态势：覆盖 49% × 形态 50%（Q4 补覆盖）/.test(stanceMd(0.49, 0.5)),
    "stance Q4 补覆盖 (low coverage, high morph)"
  );
  const omitCoverage = stanceMd(null, 0.8);
  const omitMorph = stanceMd(0.8, null);
  const omitBoth = stanceMd(null, null);
  assert(!/施工态势/.test(omitCoverage), "stance omitted when coverage missing");
  assert(!/施工态势/.test(omitMorph), "stance omitted when morph missing");
  assert(!/施工态势/.test(omitBoth), "stance omitted when no score axes");
  assert(!/```\s*mermaid/.test(omitBoth) && !/quadrantChart/.test(omitBoth), "no-score footer still has no mermaid");
}

// --- 0.6.3 formal: freshness · report_schema narrative · upgrade three-step ---
// (historical docs stay; current skill pin moved to 0.6.7 — freshness still asserted with current id)
{
  const man063 = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  const manVer063 = (man063.match(/^version:\s*"([^"]+)"/m) || [])[1];
  assert(manVer063 === "0.7.2", "current manifest pin 0.7.1");

  const syncTmpl063 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/HARNESS_SYNC_TMPL_ID:\s*0\.7\.2/.test(syncTmpl063), "sync.mjs.tmpl has HARNESS_SYNC_TMPL_ID");
  assert(/HARNESS_ENG_VERSION:\s*0\.7\.2/.test(syncTmpl063), "sync.mjs.tmpl has HARNESS_ENG_VERSION");
  const tmplId = (syncTmpl063.match(/HARNESS_SYNC_TMPL_ID:\s*(\S+)/) || [])[1];
  assert(tmplId === manVer063, "tmpl marker matches manifest version");

  const golden063 = path.join(skillRoot, "scripts/fixtures/l5-sync-golden");
  const goldenSync063 = fs.readFileSync(path.join(golden063, "scripts/agent-config/sync.mjs"), "utf8");
  assert(/HARNESS_SYNC_TMPL_ID:\s*0\.7\.2/.test(goldenSync063), "l5-sync-golden instantiated sync has marker");
  const goldFresh = runNode(
    [path.join(skillRoot, "scripts/harness.mjs"), "--check-freshness", "--root", golden063],
    { cwd: skillRoot }
  );
  assert(goldFresh.status === 0, "check-freshness passes on golden");
  assert(/freshness OK|HARNESS_SYNC_TMPL_ID=0\.7\.2/.test(goldFresh.stderr + goldFresh.stdout), "golden freshness message");

  const stale063 = path.join(skillRoot, "scripts/fixtures/l5-sync-stale");
  assert(fs.existsSync(path.join(stale063, "scripts/agent-config/sync.mjs")), "l5-sync-stale stub");
  const staleFresh = runNode(
    [path.join(skillRoot, "scripts/harness.mjs"), "--check-freshness", "--root", stale063],
    { cwd: skillRoot }
  );
  assert(staleFresh.status !== 0, "check-freshness fails on stale fixture");
  const staleOut = staleFresh.stderr + staleFresh.stdout;
  assert(/落后|过期|stale|HARNESS_SYNC_TMPL_ID/.test(staleOut), "stale freshness names marker");
  assert(/agent-config-sync|sync\.mjs\.tmpl/.test(staleOut), "stale freshness names refresh via tmpl / agent-config-sync");
  assert(/node scripts\/agent-config\/sync\.mjs/.test(staleOut), "stale freshness tells to run sync.mjs");
  assert(/--check-freshness/.test(staleOut), "stale freshness re-check command");

  const empty063 = path.join(skillRoot, "scripts/fixtures/new-empty");
  const skipFresh = runNode(
    [path.join(skillRoot, "scripts/harness.mjs"), "--check-freshness", "--root", empty063],
    { cwd: skillRoot }
  );
  assert(skipFresh.status === 0, "check-freshness skip (no consumer sync) exits 0");

  const harnessHelp063 = runNode([path.join(skillRoot, "scripts/harness.mjs"), "--help"]);
  assert(harnessHelp063.status === 0 && /--check-freshness/.test(harnessHelp063.stdout), "harness --help lists --check-freshness");

  const changelog063 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.3\b/m.test(changelog063), "CHANGELOG 0.6.3 heading");
  assert(/freshness|HARNESS_SYNC_TMPL_ID/.test(changelog063), "CHANGELOG notes freshness");
  assert(/tree\/main\/harness-eng/.test(changelog063), "CHANGELOG production install URL main");
  assert(/V0\.6\.X/.test(changelog063) && /合并进/.test(changelog063), "CHANGELOG notes V0.6.X is dev train then merge to main");

  const upgrade063 = readDoc("upgrade.md");
  assert(/0\.6\.2 → 0\.6\.3/.test(upgrade063), "upgrade has 0.6.2 → 0.6.3");
  assert(/刷新/.test(upgrade063) && /sync\.mjs/.test(upgrade063) && /check-freshness/.test(upgrade063), "upgrade L5 must refresh sync.mjs");

  assert(/^## 0\.6\.3\b/m.test(changelog063) && !((changelog063.match(/^## 0\.6\.3[^\n]*/m)||[""])[0].includes("-dev")), "CHANGELOG formal 0.6.3 no -dev heading");
  assert(/兼容别名/.test(changelog063) && /report_schema/.test(changelog063), "CHANGELOG notes report_schema / ui.version alias");
  assert(/升级三步/.test(upgrade063) && /check-freshness/.test(upgrade063), "upgrade 0.6.3 has three-step playbook");
  const gloss063 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/report_schema/.test(gloss063) && /兼容别名/.test(gloss063), "glossary report_schema primary; ui.version alias");
  assert(!/\| `ui\.version` \|/.test(gloss063), "glossary dropped standalone ui.version row");


  const agentIdx063 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/check-freshness/.test(agentIdx063) && /sync\.mjs/.test(agentIdx063), "AGENT-INDEX notes L5 sync.mjs refresh");

  const manual063 = fs.readFileSync(path.join(skillRoot, "host/TRAE-P0-MANUAL.md"), "utf8");
  assert(/--check-freshness/.test(manual063), "TRAE-P0-MANUAL §0 has --check-freshness");
  assert(/agent-config-sync|replace/.test(manual063), "MANUAL names land/upgrade replace path");

  const conflict063 = readDoc("conflict-policy.md");
  assert(/HARNESS_SYNC_TMPL_ID/.test(conflict063) && /check-freshness/.test(conflict063), "conflict-policy stale sync.mjs row");

  const qs063b = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
  assert(/check-freshness/.test(qs063b), "QUICKSTART one-liner check-freshness");

  const render063 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(/agent-config-sync/.test(render063) && /replace/.test(render063), "render.mjs replace agent-config-sync when exists");

  const libFresh = fs.readFileSync(path.join(skillRoot, "scripts/lib/sync-freshness.mjs"), "utf8");
  assert(/HARNESS_SYNC_TMPL_ID/.test(libFresh) && /runFreshnessCheck/.test(libFresh), "lib/sync-freshness.mjs");
}

// --- 0.6.4: CodeBuddy/WorkBuddy official alignment ---
{
  const syncTmpl064 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/host === "trae" \|\| host === "workbuddy"/.test(syncTmpl064), "sync toHostMd preserves FM for workbuddy");
  assert(
    syncTmpl064.includes('.codebuddy/rules/${rule.name.replace(/\\.mdc$/, ".md")}') ||
      syncTmpl064.includes(".codebuddy/rules/${rule.name.replace(/\\.mdc$/, \".md\")}"),
    "sync emits flat .codebuddy/rules/<stem>.md"
  );
  assert(!/codebuddy\/rules\/\$\{rule\.name\.replace\([^)]*\)\}\/RULE\.mdc/.test(syncTmpl064), "sync workbuddy path no longer RULE.mdc");
  assert(/RULE\.mdc/.test(syncTmpl064) && /prune|清理|扁平/.test(syncTmpl064), "sync header notes RULE.mdc prune migration");
  assert(/permissions/.test(syncTmpl064) && /settings\.local/.test(syncTmpl064), "sync documents permissions / no settings.local");
  assert(/\/hooks/.test(syncTmpl064) || /hooks 面板/.test(syncTmpl064), "sync header notes /hooks panel");
  assert(/defaultMode/.test(syncTmpl064) && /Read\(\.\/\.env\)/.test(syncTmpl064), "sync merges minimal permissions defaults");

  const render064 = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
  assert(
    render064.includes(".codebuddy/rules/${stem}.md") || render064.includes('.codebuddy/rules/${stem}.md'),
    "render mirrors workbuddy to flat .md"
  );
  assert(
    /preserveFrontmatter:[\s\S]*codebuddy\/rules\//.test(render064) ||
      /codebuddy\/rules\//.test(render064) && /preserveFrontmatter/.test(render064),
    "render preserveFrontmatter covers codebuddy"
  );
  assert(/rel\.startsWith\("\.codebuddy\/rules\/"\)/.test(render064), "render preserveFrontmatter branch includes .codebuddy/rules");

  const wbAd = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/workbuddy.md"), "utf8");
  assert(/\.codebuddy\/rules\/<stem>\.md/.test(wbAd), "workbuddy adapter flat .md");
  assert(/alwaysApply/.test(wbAd) && /globs/.test(wbAd), "workbuddy adapter documents FM");
  assert(/\/hooks/.test(wbAd) && /Bash/.test(wbAd), "workbuddy adapter /hooks + Bash");
  assert(/\$CODEBUDDY_PROJECT_DIR/.test(wbAd), "workbuddy adapter CODEBUDDY_PROJECT_DIR");
  assert(/settings\.local\.json/.test(wbAd) && /\*\*不\*\*生成/.test(wbAd), "workbuddy adapter no settings.local generation");
  assert(/agents\//.test(wbAd) && /非目标/.test(wbAd), "workbuddy adapter agents non-goal");
  assert(/\.mcp\.json/.test(wbAd) && /local > project > user/.test(wbAd), "workbuddy adapter MCP priority");

  assert(fs.existsSync(path.join(skillRoot, "host/CODEBUDDY-PARITY.md")), "CODEBUDDY-PARITY.md");
  assert(fs.existsSync(path.join(skillRoot, "host/CODEBUDDY-P0-MANUAL.md")), "CODEBUDDY-P0-MANUAL.md");
  const parity064 = fs.readFileSync(path.join(skillRoot, "host/CODEBUDDY-PARITY.md"), "utf8");
  const manual064 = fs.readFileSync(path.join(skillRoot, "host/CODEBUDDY-P0-MANUAL.md"), "utf8");
  assert(/扁平/.test(parity064) && /RULE\.mdc/.test(parity064), "PARITY covers flat vs RULE.mdc");
  assert(/\/hooks/.test(manual064) && /Bash/.test(manual064), "MANUAL covers /hooks + Bash");
  assert(/check-freshness/.test(manual064), "MANUAL has freshness");
  assert(/permissions/.test(manual064) && /settings\.local/.test(manual064), "MANUAL permissions priority");

  const agentIdx064 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/CODEBUDDY-PARITY/.test(agentIdx064), "AGENT-INDEX links CODEBUDDY-PARITY");
  const hostReadme064 = fs.readFileSync(path.join(skillRoot, "host/README.md"), "utf8");
  assert(/CODEBUDDY-PARITY/.test(hostReadme064) && /CODEBUDDY-P0-MANUAL/.test(hostReadme064), "host README links CodeBuddy docs");
  const aiTools064 = readDoc("ai-tools.md");
  assert(/CODEBUDDY-PARITY/.test(aiTools064), "ai-tools links CODEBUDDY-PARITY");
  const syncHosts064 = fs.readFileSync(path.join(skillRoot, "host/sync-hosts.md"), "utf8");
  assert(/CODEBUDDY-PARITY/.test(syncHosts064), "sync-hosts links CODEBUDDY-PARITY");

  const changelog064 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.4\b/m.test(changelog064), "CHANGELOG 0.6.4 heading");
  assert(/^## 0\.6\.4\b/m.test(changelog064) && !((changelog064.match(/^## 0\.6\.4[^\n]*/m)||[""])[0].includes("-dev")), "CHANGELOG formal 0.6.4 no -dev heading");
  assert(/正式钉号：CodeBuddy\/WorkBuddy/.test(changelog064), "CHANGELOG 0.6.4 formal pin subtitle");
  assert(/由 \*\*0\.6\.4-dev\*\* 钉号/.test(changelog064), "CHANGELOG notes promoted from 0.6.4-dev");
  assert(/（无 `-dev`）/.test(changelog064), "CHANGELOG pins without -dev");
  const upgrade064 = readDoc("upgrade.md");
  assert(/0\.6\.3 → 0\.6\.4/.test(upgrade064), "upgrade has 0.6.3 → 0.6.4");
  assert(/升级三步/.test(upgrade064) && /check-freshness/.test(upgrade064) && /\*\*`main`\*\*|\*\*main\*\*/.test(upgrade064), "upgrade 0.6.4 L5 three-step (main · check-freshness · refresh sync)");
  const verify064 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/正式钉号/.test(verify064) && /0\.6\.3 → 0\.6\.4/.test(verify064), "VERIFY formal pin acceptance rows");
  const summary064 = fs.readFileSync(path.join(skillRoot, "使用手册-摘要.md"), "utf8");
  assert(/WorkBuddy\/CodeBuddy（\*\*0\.6\.4\*\*）/.test(summary064), "使用手册-摘要 keeps CodeBuddy 0.6.4 baseline note");

  const hooksChecks064 = fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8");
  assert(/workbuddy:\s*CLAUDE_STYLE\["commit-gate"\]/.test(hooksChecks064), "hooks-checks workbuddy stays CLAUDE_STYLE");
  assert(/matcher:\s*"Bash"/.test(hooksChecks064), "CLAUDE_STYLE Bash retained");

  assert(/\|\s*`trae`\s*\|\s*\*\*高\*\*/.test(aiTools064), "Trae matrix still 高");
  assert(/推荐纪律 B|探测/.test(aiTools064) && /Codex|codex/.test(aiTools064), "Codex 纪律 B");
  assert(!/0\.6\.x 冻结 P2/.test(aiTools064), "no blanket freeze after P0 thaw");
}

// --- 0.6.5: API field-table 7-col + sync EOL-agnostic (historical pin retained) ---
{
  const apiDoc = fs.readFileSync(
    path.join(skillRoot, "templates/docs/api/templates/api-doc-template.md"),
    "utf8"
  );
  assert(/枚举 \| 备注 \| 示例值/.test(apiDoc), "api-doc-template 7-col baseline");
  assert(/字段表硬约束/.test(apiDoc) && /说明必填/.test(apiDoc), "api-doc-template hard constraints");
  assert(/###\s*请求参数/.test(apiDoc) && /###\s*响应参数/.test(apiDoc), "api-doc-template ### 请求/响应参数");

  const apiIdx = fs.readFileSync(
    path.join(skillRoot, "templates/docs/api/templates/api-index-template.md"),
    "utf8"
  );
  assert(/字段表约定/.test(apiIdx), "api-index-template field-table convention");

  const acceptSrc065 = fs.readFileSync(path.join(skillRoot, "scripts/acceptance-check.mjs"), "utf8");
  assert(/api-empty-desc/.test(acceptSrc065) && /api-empty-enum-remark/.test(acceptSrc065), "acceptance 0.6.5 field rules");
  assert(/checkParamFieldTable/.test(acceptSrc065), "acceptance checkParamFieldTable");

  const syncTmpl065 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/function sameText/.test(syncTmpl065), "sync.mjs.tmpl sameText EOL-agnostic");

  const changelog065 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.5\b/m.test(changelog065), "CHANGELOG keeps 0.6.5 heading");
  assert(/正式钉号：API 字段表/.test(changelog065), "CHANGELOG 0.6.5 formal pin subtitle");
  assert(/sameText|EOL/.test(changelog065), "CHANGELOG notes sync EOL fix");

  const upgrade065 = readDoc("upgrade.md");
  assert(/0\.6\.4 → 0\.6\.5/.test(upgrade065), "upgrade has 0.6.4 → 0.6.5");

  const verify065 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/0\.6\.5 增量验收/.test(verify065) && /0\.6\.4 → 0\.6\.5/.test(verify065), "VERIFY keeps 0.6.5 acceptance rows");
}

// --- 0.6.6: OpenAPI bridge + thick module AGENTS (historical pin retained) ---
{
  const changelog066 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.6\b/m.test(changelog066), "CHANGELOG keeps 0.6.6 heading");
  assert(/OpenAPI|分册厚/.test(changelog066), "CHANGELOG 0.6.6 OpenAPI + thick AGENTS");

  const upgrade066 = readDoc("upgrade.md");
  assert(/0\.6\.5 → 0\.6\.6/.test(upgrade066), "upgrade has 0.6.5 → 0.6.6");
  assert(/Q_APIFOX|OpenAPI/.test(upgrade066), "upgrade 0.6.6 notes OpenAPI bridge");
  assert(/on_exists=skip/.test(upgrade066), "upgrade 0.6.6 notes skip existing module AGENTS");

  const verify066 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/0\.6\.6 增量验收/.test(verify066) && /0\.6\.5 → 0\.6\.6/.test(verify066), "VERIFY keeps 0.6.6 acceptance rows");

  const q066 = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
  assert(/Q_APIFOX/.test(q066), "questions has Q_APIFOX");
  assert(/value:\s*frontend/.test(q066), "questions Q_MODULE_AGENTS has frontend");

  const man066 = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  assert(/id:\s*openapi-md-to-openapi/.test(man066), "manifest openapi pack");
  assert(/OPENAPI_BRIDGE_TIP/.test(man066), "manifest OPENAPI_BRIDGE_TIP placeholder");

  for (const f of [
    "templates/scripts/apifox/md-to-openapi.mjs",
    "templates/scripts/apifox/sync-to-apifox.mjs",
    "templates/scripts/apifox/import-openapi-overwrite.mjs",
    "templates/scripts/apifox/README.md",
    "templates/scripts/apifox/.apifox.env.example",
    "templates/docs/api/generated/README.md",
    "templates/agents/AGENTS.module.frontend.md.tmpl",
  ]) {
    assert(fs.existsSync(path.join(skillRoot, f)), `0.6.6 file exists: ${f}`);
  }

  const mdOpen = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/apifox/md-to-openapi.mjs"),
    "utf8"
  );
  assert(!/sms-ai|8705117|todo-recommend|juneyao/i.test(mdOpen), "md-to-openapi de-domainized");
  assert(/OPENAPI_TITLE/.test(mdOpen), "md-to-openapi uses OPENAPI_TITLE");

  const syncApifox = fs.readFileSync(
    path.join(skillRoot, "templates/scripts/apifox/sync-to-apifox.mjs"),
    "utf8"
  );
  assert(!/8705117/.test(syncApifox), "sync-to-apifox no default project id");
  assert(/APIFOX_PROJECT_ID/.test(syncApifox), "sync-to-apifox requires APIFOX_PROJECT_ID");

  const modTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/agents/AGENTS.module.md.tmpl"),
    "utf8"
  );
  assert(/改动路径速查/.test(modTmpl) && /模块定位/.test(modTmpl), "module AGENTS thick sections");
  assert(
    /分册真相/.test(fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"), "utf8")),
    "root AGENTS 分册真相 block"
  );
  assert(
    /solo 厚节|改动路径速查/.test(
      fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.solo.md.tmpl"), "utf8")
    ),
    "solo root has thick sections"
  );

  assert(
    /AGENTS\.module\.frontend\.md\.tmpl/.test(
      fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8")
    ),
    "render supports frontend module template"
  );
  assert(
    /OPENAPI_BRIDGE_TIP/.test(fs.readFileSync(path.join(skillRoot, "scripts/lib/hooks-checks.mjs"), "utf8")),
    "hooks-checks fills OPENAPI_BRIDGE_TIP"
  );

  assert(/精填分册 AGENTS/.test(readDoc("prefill.md")), "prefill P1 thick module AGENTS handoff");
  assert(/分册 AGENTS 空壳|改动路径速查/.test(readDoc("audit-report.md")), "audit heuristic for thin module AGENTS");
  assert(/Q_APIFOX|OpenAPI/.test(readDoc("ladder.md")), "ladder notes OpenAPI optional companion");
  const gloss066 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/OpenAPI 桥/.test(gloss066) && /根薄分册厚/.test(gloss066), "glossary OpenAPI + thick AGENTS");

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-openapi-"));
  try {
    const modDir = path.join(tmpRoot, "docs/api/modules");
    fs.mkdirSync(modDir, { recursive: true });
    fs.copyFileSync(
      path.join(skillRoot, "scripts/fixtures/acceptance-api-good.md"),
      path.join(modDir, "01-demo.md")
    );
    const destScriptDir = path.join(tmpRoot, "scripts/apifox");
    fs.mkdirSync(destScriptDir, { recursive: true });
    fs.copyFileSync(
      path.join(skillRoot, "templates/scripts/apifox/md-to-openapi.mjs"),
      path.join(destScriptDir, "md-to-openapi.mjs")
    );
    const r = runNode([path.join(destScriptDir, "md-to-openapi.mjs")], {
      cwd: tmpRoot,
      env: { ...process.env, OPENAPI_TITLE: "Harness Demo API" },
    });
    assert(r.status === 0, `md-to-openapi smoke exit 0: ${r.stderr || r.stdout}`);
    const outJson = path.join(tmpRoot, "docs/api/generated/openapi.json");
    assert(fs.existsSync(outJson), "md-to-openapi wrote openapi.json");
    const oas = JSON.parse(fs.readFileSync(outJson, "utf8"));
    assert(oas.paths && Object.keys(oas.paths).length > 0, "openapi smoke has paths");
    assert(oas.info?.title === "Harness Demo API", "openapi title from env");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

// --- 0.6.7: Pn reflux ops + FE/BE contract gate profile ---
{
  const changelog067 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.7\b/m.test(changelog067), "CHANGELOG 0.6.7 heading");
  assert(
    /^## 0\.6\.7\b/m.test(changelog067) &&
      !((changelog067.match(/^## 0\.6\.7[^\n]*/m) || [""])[0].includes("-dev")),
    "CHANGELOG formal 0.6.7 no -dev heading"
  );
  assert(/Pn 回流|前后端契约/.test(changelog067), "CHANGELOG 0.6.7 Pn + FE gate");

  const upgrade067 = readDoc("upgrade.md");
  assert(/0\.6\.6 → 0\.6\.7/.test(upgrade067), "upgrade has 0.6.6 → 0.6.7");
  assert(/hook_code|GLOB_API|路径速查/.test(upgrade067), "upgrade 0.6.7 notes gate + Pn");

  const verify067 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/0\.6\.7 增量验收/.test(verify067) && /0\.6\.6 → 0\.6\.7/.test(verify067), "VERIFY 0.6.7 formal pin acceptance rows");

  const domYaml = fs.readFileSync(path.join(skillRoot, "templates/_meta/domains.yaml"), "utf8");
  assert(/packages\\\/api-client/.test(domYaml), "domains api hook_code has packages/api-client regex");

  const checksJs = buildContractChecksJs(["api"]);
  assert(/new RegExp/.test(checksJs), "buildContractChecksJs emits RegExp for api packages");
  const fn = new Function(`const CONTRACT_CHECKS = ${checksJs}; return CONTRACT_CHECKS;`);
  const arr = fn();
  assert(Array.isArray(arr) && arr[0]?.id === "api", "CONTRACT_CHECKS api block");
  assert(
    arr[0].code("web/packages/api-client/client.ts") === true,
    "nested packages/api-client hits CONTRACT_CHECKS"
  );
  assert(
    arr[0].code("sms-ai-web/packages/types/index.ts") === true,
    "nested packages/types hits CONTRACT_CHECKS"
  );
  assert(arr[0].code("README.md") === false, "unrelated path misses CONTRACT_CHECKS");
  assert(/前端契约包|api-client/.test(arr[0].tip), "api tip mentions frontend packages");

  assert(/packages\/api-client/.test(readDoc("detect.md")), "detect GLOB_API frontend profile");
  assert(/GLOB_API/.test(readDoc("recommended-profile.md")) && /api-client/.test(readDoc("recommended-profile.md")), "recommended-profile GLOB_API row");

  const rule12 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/12-api-doc-sync.mdc.tmpl"),
    "utf8"
  );
  assert(/前端消费层|api-client/.test(rule12), "rule12 frontend consumer gate");
  assert(/判定清单/.test(rule12) && /与功能资产/.test(rule12), "rule12 gold discipline checklist");
  assert(!/sms-ai|juneyao/i.test(rule12), "rule12 stays de-domainized");

  const rule13 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/13-db-doc-sync.mdc.tmpl"),
    "utf8"
  );
  assert(/判定清单/.test(rule13) && /同步操作/.test(rule13), "rule13 gold discipline checklist");
  assert(/V\[0-9\]\{4\}__\(DDL\|DML\)/.test(rule13), "rule13 flyway name hint");
  assert(!/sms-ai|juneyao/i.test(rule13), "rule13 stays de-domainized");

  const jobsIdx = fs.readFileSync(
    path.join(skillRoot, "templates/docs/jobs/templates/jobs-index-template.md"),
    "utf8"
  );
  assert(/纪律（Never do）/.test(jobsIdx), "jobs-index Never do");
  assert(/调度契约/.test(jobsIdx) && /独立开关/.test(jobsIdx), "jobs-index conflict + independent switch");
  assert(!/sms-ai|SyncTaskExecutor|juneyao/i.test(jobsIdx), "jobs-index stays de-domainized");

  const jobTruth = fs.readFileSync(
    path.join(skillRoot, "templates/docs/jobs/templates/job-template.md"),
    "utf8"
  );
  assert(/Never do/.test(jobTruth), "job-template Never do");

  const rule20 = fs.readFileSync(
    path.join(skillRoot, "templates/rules/20-jobs-doc-sync.mdc.tmpl"),
    "utf8"
  );
  assert(/纪律（Never do）/.test(rule20) && /独立开关/.test(rule20), "rule20 Never do");

  assert(
    /踩坑回流/.test(fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.md.tmpl"), "utf8")),
    "root AGENTS 踩坑回流 section"
  );
  assert(
    /踩坑回流/.test(fs.readFileSync(path.join(skillRoot, "templates/agents/AGENTS.root.solo.md.tmpl"), "utf8")),
    "solo AGENTS 踩坑回流 section"
  );

  const pitTmpl = fs.readFileSync(
    path.join(skillRoot, "templates/docs/agent-kb/pitfalls.md"),
    "utf8"
  );
  assert(/docs\/api/.test(pitTmpl) && /待补/.test(pitTmpl), "pitfalls path index skeleton");
  assert(/Never do.*→ Pn|→ Pn/.test(pitTmpl), "pitfalls Never do↔Pn writing rule");

  assert(
    /warnNeverDoPnBacklinks/.test(
      fs.readFileSync(path.join(skillRoot, "templates/scripts/lint-pitfalls.mjs.tmpl"), "utf8")
    ),
    "lint-pitfalls has warnNeverDoPnBacklinks"
  );

  assert(/Pn 回流|路径速查/.test(readDoc("prefill.md")), "prefill P1 Pn reflux");
  assert(/Never do 无 Pn|路径速查空壳/.test(readDoc("audit-report.md")), "audit Never do / path-index heuristics");

  const gloss067 = fs.readFileSync(path.join(skillRoot, "glossary.md"), "utf8");
  assert(/Pn 回流/.test(gloss067) && /前后端契约剖面/.test(gloss067), "glossary Pn + FE profile");

  assert(
    /版本：\*\*0\.7\.2\*\*/.test(fs.readFileSync(path.join(skillRoot, "使用手册-摘要.md"), "utf8")),
    "使用手册-摘要 version 0.7.0"
  );
  assert(/Pn 回流|前后端契约/.test(fs.readFileSync(path.join(skillRoot, "README.md"), "utf8")), "README blurb 0.6.7 Pn/FE");
}

// --- 0.6.8-dev: Codex P0 parity thaw ---
{
  assert(fs.existsSync(path.join(skillRoot, "host/CODEX-PARITY.md")), "CODEX-PARITY.md");
  assert(fs.existsSync(path.join(skillRoot, "host/CODEX-MANUAL.md")), "CODEX-MANUAL.md");
  const parity068 = fs.readFileSync(path.join(skillRoot, "host/CODEX-PARITY.md"), "utf8");
  const manual068 = fs.readFileSync(path.join(skillRoot, "host/CODEX-MANUAL.md"), "utf8");
  assert(/PASS|PARTIAL|FAIL/.test(parity068), "CODEX-PARITY has PASS/PARTIAL/FAIL");
  assert(/不做/.test(parity068) && /mdc/.test(parity068), "CODEX-PARITY explicit no .mdc mirror");
  assert(/developers\.openai\.com\/codex/.test(parity068), "CODEX-PARITY links official docs");
  assert(/trust|信任/.test(manual068) && /\/hooks/.test(manual068) && /\/mcp/.test(manual068), "CODEX-P0-MANUAL checklist");
  assert(/\.agents\/skills/.test(manual068 + parity068), "Codex skills path documented");

  assert(fs.existsSync(path.join(skillRoot, "templates/ai-tools/codex-config.toml.tmpl")), "codex-config.toml.tmpl");
  const cfgTmpl = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/codex-config.toml.tmpl"), "utf8");
  assert(/mcp_servers/.test(cfgTmpl) && /command/.test(cfgTmpl) && /url/.test(cfgTmpl), "config tmpl stdio+http examples");
  assert(/trusted|信任/.test(cfgTmpl) && /密钥|secret|token/i.test(cfgTmpl), "config tmpl trusted + no-secrets note");

  const man068 = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  assert(/mcp-codex-config/.test(man068) && /config\.toml\.example/.test(man068), "manifest lands codex config example");

  const hooks068 = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-hooks.json"), "utf8");
  assert(/"matcher"\s*:\s*"\^Bash\$"/.test(hooks068), "codex-hooks matcher ^Bash$");
  assert(!/"matcher"\s*:\s*"Bash"/.test(hooks068), "codex-hooks not bare Bash string");

  const adapter068 = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/adapters/codex.md"), "utf8");
  assert(/\*\*高\*\*|对齐程度：\*\*高\*\*/.test(adapter068), "adapter is 高");
  assert(!/0\.6\.x 冻结 P2/.test(adapter068) && !/本列车不再扩展/.test(adapter068), "adapter no total freeze claim");
  assert(/\^Bash\$/.test(adapter068) && /\/hooks/.test(adapter068), "adapter documents regex + /hooks trust");

  const aiTools068 = readDoc("ai-tools.md");
  assert(/CODEX-PARITY/.test(aiTools068) && (/0\.6\.9/.test(aiTools068) || /\*\*高\*\*/.test(aiTools068)), "ai-tools 高 + PARITY link");
  assert(/config\.toml\.example/.test(aiTools068), "ai-tools MCP table has codex config.toml");

  const hostReadme068 = fs.readFileSync(path.join(skillRoot, "host/README.md"), "utf8");
  assert(/CODEX-PARITY/.test(hostReadme068) && /CODEX-MANUAL/.test(hostReadme068), "host README links Codex docs");
  const agentIdx068 = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/CODEX-PARITY/.test(agentIdx068), "AGENT-INDEX links CODEX-PARITY");
  assert(/CODEX-PARITY/.test(agentIdx068), "AGENT-INDEX links CODEX-PARITY (ROADMAP stub removed)");

  const changelog068 = fs.readFileSync(path.join(skillRoot, "CHANGELOG.md"), "utf8");
  assert(/^## 0\.6\.9\b/m.test(changelog068), "CHANGELOG 0.6.9 heading");
  assert(/^## 0\.7\.0\b/m.test(changelog068), "CHANGELOG 0.7.0 heading");
  assert(/^## 0\.7\.2\b/m.test(changelog068), "CHANGELOG 0.7.1 heading");
  assert(/^## 0\.6\.8-dev\b/m.test(changelog068), "CHANGELOG keeps 0.6.8-dev");
  assert(/Codex P0|增量解冻/.test(changelog068), "CHANGELOG Chinese Codex P0 entry");
  assert(/\*\*`main`\*\*|\*\*main\*\*/.test(changelog068), "CHANGELOG keeps main install URL");

  const upgrade068 = readDoc("upgrade.md");
  assert(/0\.6\.8-dev → 0\.6\.9/.test(upgrade068), "upgrade has 0.6.8-dev → 0.6.9");
  assert(/0\.6\.9 → 0\.7\.0/.test(upgrade068), "upgrade has 0.6.9 → 0.7.0");
  assert(/0\.7\.1 → 0\.7\.2/.test(upgrade068), "upgrade has 0.7.1 → 0.7.2");
  assert(/0\.7\.0 → 0\.7\.1/.test(upgrade068), "upgrade keeps 0.7.0 → 0.7.1");
  assert(/0\.6\.7 → 0\.6\.8-dev/.test(upgrade068), "upgrade keeps 0.6.7 → 0.6.8-dev");

  const verify068 = fs.readFileSync(path.join(skillRoot, "VERIFY.md"), "utf8");
  assert(/0\.6\.9 增量验收/.test(verify068), "VERIFY 0.6.9 section");
  assert(/0\.7\.0 增量验收/.test(verify068), "VERIFY 0.7.0 section");
  assert(/0\.7\.2 增量验收/.test(verify068), "VERIFY 0.7.1 section");

  const syncTmpl068 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/0\.7\.2/.test(syncTmpl068), "sync tmpl id 0.7.1");
  assert(/\.agents\/skills/.test(syncTmpl068), "sync writes Codex skills path");

  assert(/\|\s*`trae`\s*\|\s*\*\*高\*\*/.test(aiTools068), "Trae matrix still 高 after Codex P0");
  assert(/CODEBUDDY-PARITY/.test(aiTools068) || /WorkBuddy/.test(aiTools068), "CodeBuddy still referenced");
}

// --- 0.6.9: Codex → 高 (incremental; more nails in later tasks) ---
{
  const toml = jsonServersToCodexToml({
    mcpServers: {
      mysql_dev: {
        command: "npx",
        args: ["-y", "@benborla29/mcp-server-mysql"],
        env: { MYSQL_PASS: "s3cret", MYSQL_HOST: "127.0.0.1" },
      },
      context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
    },
  });
  assert(/\[mcp_servers\.mysql_dev\]/.test(toml), "toml has mysql_dev table");
  assert(/env_vars\s*=\s*\[/.test(toml) && /MYSQL_PASS/.test(toml), "env var names exported");
  assert(!/s3cret/.test(toml), "secret values never in toml");
  assert(/enabled\s*=\s*false/.test(toml), "servers disabled by default");

  assert(
    fs.existsSync(path.join(skillRoot, "templates/ai-tools/codex/rules/repository.rules")),
    "codex repository.rules seed"
  );
  const rulesSeed = fs.readFileSync(
    path.join(skillRoot, "templates/ai-tools/codex/rules/repository.rules"),
    "utf8"
  );
  assert(/prefix_rule/.test(rulesSeed) && /git/.test(rulesSeed) && /push/.test(rulesSeed), "rules seed has git push policy");
  assert(/reset/.test(rulesSeed) && /forbidden|prompt/.test(rulesSeed), "rules seed has destructive git policy");
  const hooks069 = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-hooks.json"), "utf8");
  assert(/"Stop"/.test(hooks069), "codex-hooks includes Stop");
  assert(/"matcher"\s*:\s*"\^Bash\$"/.test(hooks069), "PreToolUse still ^Bash$");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/codex-stop-checklist.js.tmpl")),
    "codex-stop-checklist tmpl"
  );
  assert(/hooks-codex-stop|codex-rules-repository/.test(manifest), "manifest wires codex stop + rules");
  assert(
    fs.existsSync(path.join(skillRoot, "templates/hooks/codex-adapter.js")),
    "codex-adapter.js"
  );
  const ad069 = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-adapter.js"), "utf8");
  assert(/fail-open|exit\(0\)/.test(ad069), "adapter fail-open");
  assert(/stdin|process\.stdin/.test(ad069), "adapter reads stdin");

  const syncTmpl069 = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
  assert(/planCodexRules|codex\/rules/.test(syncTmpl069), "sync plans codex rules");
  assert(
    /config\.toml\.example/.test(syncTmpl069) && /env_vars|jsonServersToCodexToml/.test(syncTmpl069),
    "sync emits codex toml from mcp"
  );
  assert(/\.agents\/skills/.test(syncTmpl069) && !/P0 \*\*不\*\*从/.test(syncTmpl069), "skills full distribute, not P0 pointer-only prose");
  assert(/MANAGED_DIRS[\s\S]*\.codex\/rules/.test(syncTmpl069), "managed .codex/rules");

  const codexFx = path.join(skillRoot, "scripts/fixtures/l5-sync-codex");
  assert(fs.existsSync(path.join(codexFx, "scripts/agent-config/sync.mjs")), "l5-sync-codex sync.mjs");
  assert(fs.existsSync(path.join(codexFx, ".codex/config.toml.example")), "l5-sync-codex config.toml.example");
  assert(fs.existsSync(path.join(codexFx, ".codex/rules/repository.rules")), "l5-sync-codex rules");
  const codexCheck = runNode([path.join(codexFx, "scripts/agent-config/sync.mjs"), "--check"], {
    cwd: codexFx,
  });
  assert(codexCheck.status === 0, "l5-sync-codex sync --check exit 0");
}

// --- root _meta dual-write (skill-package ↔ templates) ---
{
  const rootMetaPath = path.join(skillRoot, "_meta/manifest.yaml");
  assert(fs.existsSync(rootMetaPath), "root _meta/manifest.yaml exists");
  const rootMeta = fs.readFileSync(rootMetaPath, "utf8");
  const tmplMeta = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
  const rootVer = (rootMeta.match(/^version:\s*"([^"]+)"/m) || [])[1];
  const tmplVer = (tmplMeta.match(/^version:\s*"([^"]+)"/m) || [])[1];
  assert(!!rootVer, "root _meta has version");
  assert(!!tmplVer, "templates _meta has version");
  assert(rootVer === tmplVer, `root/templates _meta version match (${rootVer} === ${tmplVer})`);
  assert(/description\s*:/.test(rootMeta), "root _meta has description");
  assert(/description\s*:/.test(tmplMeta), "templates _meta has description");
  const agentIndexMeta = fs.readFileSync(path.join(skillRoot, "AGENT-INDEX.md"), "utf8");
  assert(/manifest 双写|技能包权威/.test(agentIndexMeta), "AGENT-INDEX documents manifest dual-write");
  assert(/_meta\/manifest\.yaml/.test(agentIndexMeta), "AGENT-INDEX links root _meta/manifest.yaml");
}
}

