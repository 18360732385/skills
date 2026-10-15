#!/usr/bin/env node
/**
 * release-eng selfcheck：静态断言 + 纯函数/形断言。版本 PIN 读自 `_meta/manifest.yaml`。
 * 覆盖：manifest · modes/ 模式文件 · 关键脚本 · fixtures 种子 ·
 * AGENT-INDEX / QUICKSTART / VERIFY · 钉号链 ·
 * identityFromBranch · 截断5 · shortCommitHash · artifacts.json 形 ·
 * seal-check --help · release.mjs --help/modes · sync-skill-version --check ·
 * push-gate 临时仓（never-pushed / in-sync / unpushed>0）· layerEmpty 可观测。
 *
 * 非 harness land：不对齐 harness 自动 land 流水线。
 */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { readSkillVersion, escapeSemverRe } from "./lib/skill-version.mjs";

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

const PIN = readSkillVersion(skillRoot);
const VER_RE = escapeSemverRe(PIN);

const MODES = [
  "modes/prepare.md",
  "modes/resume.md",
  "modes/audit.md",
  "modes/seal.md",
];

const MODE_SPECS = [
  "modes/freeze.md",
  "modes/write-plan.md",
  "modes/gates-common.md",
  "modes/git-gates.md",
  "modes/questions.md",
  "modes/ai-track.md",
  "modes/bootstrap.md",
  "modes/recommended.md",
  "modes/idempotency.md",
  "modes/README.md",
];

const SCRIPTS = [
  "scripts/release.mjs",
  "scripts/release-format.mjs",
  "scripts/release-push-gate.mjs",
  "scripts/release-freeze.mjs",
  "scripts/release-freeze-enrich.mjs",
  "scripts/release-ai-track.mjs",
  "scripts/release-note-merge.mjs",
  "scripts/release-seal-check.mjs",
  "scripts/selfcheck.mjs",
];

const FIXTURE_SEED = [
  "fixtures/docs/releases/releases.md",
  "fixtures/docs/releases/ARCHIVE.md",
  "fixtures/docs/releases/templates/release-note-template.md",
  "fixtures/docs/releases/notes/_example-artifacts.json",
  "fixtures/docs/releases/notes/.gitkeep",
  "fixtures/docs/releases/archive/.gitkeep",
];

// --- manifest ---
const manifest = read("_meta/manifest.yaml");
assert(manifest != null, "manifest.yaml exists");
assert(
  manifest != null && new RegExp(`version:\\s*"${VER_RE}"`).test(manifest),
  `manifest version == ${PIN}`
);
assert(
  manifest != null && /harness_land:\s*false/.test(manifest),
  "manifest harness_land == false"
);
for (const m of ["prepare", "resume", "audit", "seal"]) {
  assert(
    manifest != null && new RegExp(`-\\s+${m}\\b`).test(manifest),
    `manifest modes includes ${m}`
  );
}
assert(
  manifest != null && /scripts\/selfcheck\.mjs/.test(manifest),
  "manifest lists scripts/selfcheck.mjs"
);
assert(
  manifest != null && /fixtures\/docs\/releases\//.test(manifest),
  "manifest fixtures == fixtures/docs/releases/"
);

// --- mode files (under modes/) ---
for (const f of MODES) {
  assert(exists(f), `mode file ${f}`);
}
for (const f of MODE_SPECS) {
  assert(exists(f), `mode spec ${f}`);
}
assert(
  manifest != null && /modes_dir:\s*modes\//.test(manifest),
  "manifest modes_dir == modes/"
);

// --- key scripts ---
for (const s of SCRIPTS) {
  assert(exists(s), `script ${s}`);
}

// --- fixtures seed ---
for (const f of FIXTURE_SEED) {
  assert(exists(f), `fixture seed ${f}`);
}

// --- SKILL / AGENT-INDEX / QUICKSTART / VERIFY / README pin chain ---
const skill = read("SKILL.md");
assert(skill != null, "SKILL.md exists");
assert(
  skill != null && /AGENT-INDEX\.md/.test(skill),
  "SKILL links AGENT-INDEX"
);
assert(
  skill != null && /QUICKSTART\.md/.test(skill),
  "SKILL links QUICKSTART"
);
assert(skill != null && /VERIFY\.md/.test(skill), "SKILL links VERIFY");
assert(
  skill != null && skill.includes(PIN),
  `SKILL pins ${PIN}`
);

assert(exists("AGENT-INDEX.md"), "AGENT-INDEX.md exists");
const index = read("AGENT-INDEX.md") || "";
assert(/必读/.test(index), "AGENT-INDEX has 必读");
assert(/按需/.test(index), "AGENT-INDEX has 按需");
assert(index.includes(PIN), `AGENT-INDEX pins ${PIN}`);
assert(
  /非 harness land|harness_land:\s*false|harness land/.test(index),
  "AGENT-INDEX marks non-harness-land"
);
assert(/prepare/.test(index) && /seal/.test(index), "AGENT-INDEX mentions prepare/seal");
assert(/selfcheck\.mjs/.test(index), "AGENT-INDEX mentions selfcheck");

assert(exists("QUICKSTART.md"), "QUICKSTART.md exists");
const quick = read("QUICKSTART.md") || "";
assert(/AGENT-INDEX\.md/.test(quick), "QUICKSTART links AGENT-INDEX");
assert(/prepare/.test(quick) && /push-gate/.test(quick), "QUICKSTART has prepare/push-gate");
assert(/freeze/.test(quick) && /seal/.test(quick), "QUICKSTART has freeze/seal");
assert(/非 harness land/.test(quick), "QUICKSTART marks non-harness-land");

assert(exists("VERIFY.md"), "VERIFY.md exists");
const verify = read("VERIFY.md") || "";
assert(verify.includes(PIN), `VERIFY pins ${PIN}`);
assert(/selfcheck\.mjs/.test(verify), "VERIFY mentions selfcheck");
assert(/identityFromBranch|截断5|artifacts\.json/.test(verify), "VERIFY covers behavioral checks");

const readme = read("README.md") || "";
assert(/VERIFY\.md/.test(readme), "README mentions VERIFY");
assert(/selfcheck\.mjs/.test(readme), "README mentions selfcheck.mjs");
assert(/如何烟测/.test(readme), "README has 「如何烟测」section");
assert(readme.includes(PIN), `README pins ${PIN}`);
assert(
  !/无\s*`?VERIFY\.md`?\s*\/\s*selfcheck|无 VERIFY\/selfcheck|无 `VERIFY\.md` \/ selfcheck/.test(
    readme
  ),
  "README no longer claims missing VERIFY/selfcheck"
);

const logRoot = path.resolve(skillRoot, "..", "_log", "release-eng");
function logFile(ver) {
  const m = String(ver).match(/^(\d+\.\d+)\./);
  return m ? path.join(logRoot, m[1], `${ver}.md`) : path.join(logRoot, `${ver}.md`);
}
function logExists(ver) {
  return fs.existsSync(logFile(ver));
}
const changelogIndex = read("CHANGELOG.md");
assert(changelogIndex != null, "CHANGELOG.md exists");
assert(
  /_log\/release-eng\//.test(changelogIndex || ""),
  "CHANGELOG points to _log/release-eng/"
);
assert(
  changelogIndex != null && changelogIndex.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);
assert(logExists(PIN), `_log/release-eng/${PIN}.md exists`);
assert(
  changelogIndex != null && changelogIndex.includes(`${PIN}.md`),
  `CHANGELOG index links ${PIN}`
);
assert(logExists("0.3.18-dev"), "_log retains 0.3.18-dev");
assert(
  changelogIndex != null && changelogIndex.includes("0.3.18-dev.md"),
  "CHANGELOG index links 0.3.18-dev"
);
assert(logExists("0.3.19-dev"), "_log retains 0.3.19-dev");


{
  const syncCheck = spawnSync(
    process.execPath,
    [path.join(skillRoot, "scripts/sync-skill-version.mjs"), "--check"],
    { encoding: "utf8" }
  );
  assert(syncCheck.status === 0, "sync-skill-version --check exit 0");
}

{
  const repoRootReadmePath = path.join(skillRoot, "..", "README.md");
  const repoRootReadme = fs.existsSync(repoRootReadmePath)
    ? fs.readFileSync(repoRootReadmePath, "utf8")
    : null;
  assert(repoRootReadme != null, "repo root README.md exists (../README.md)");
  assert(
    new RegExp(
      String.raw`release-eng/README\.md[^\n]*当前 ` + VER_RE
    ).test(repoRootReadme || ""),
    `repo root README release-eng row pins ${PIN}`
  );
}

// =====================================================================
// 0.3.18-dev 继承：纯函数 / 形断言（超出「文件存在」）
// =====================================================================
const formatUrl = pathToFileURL(
  path.join(skillRoot, "scripts/release-format.mjs")
).href;
const format = await import(formatUrl);

const {
  identityFromBranch,
  shortCommitHash,
  normalizeSourceBranch,
  COMMIT_DISPLAY_MAX,
  COMMIT_DISPLAY_HEAD,
  COMMIT_DISPLAY_TAIL,
  COMMIT_HASH_DISPLAY_LEN,
  TZ_CHINA,
  enrichFirstReleaseLayerObservability,
  buildReleaseSummaryLines,
  detectRemoteHost,
  buildRemoteBrowseUrl,
  remoteHintLine,
  upsertReleasesIndexRow,
} = format;

assert(typeof identityFromBranch === "function", "export identityFromBranch");
assert(typeof shortCommitHash === "function", "export shortCommitHash");
assert(typeof normalizeSourceBranch === "function", "export normalizeSourceBranch");
assert(
  typeof enrichFirstReleaseLayerObservability === "function",
  "export enrichFirstReleaseLayerObservability"
);
assert(typeof buildReleaseSummaryLines === "function", "export buildReleaseSummaryLines");
assert(typeof detectRemoteHost === "function", "export detectRemoteHost");
assert(typeof buildRemoteBrowseUrl === "function", "export buildRemoteBrowseUrl");
assert(typeof remoteHintLine === "function", "export remoteHintLine");
assert(typeof upsertReleasesIndexRow === "function", "export upsertReleasesIndexRow");

// D3：无 mergeSources + recentFirst → 取最近业务句
{
  const commits = [
    { hash: "a1", author: "u", date: "2026-10-15", subject: "feat: ship inventory API" },
    { hash: "a0", author: "u", date: "2026-01-01", subject: "Initial commit" },
  ];
  const recent = buildReleaseSummaryLines(commits, {
    recentFirst: true,
    mergeSources: [],
  });
  assert(/inventory/i.test(recent[0] || ""), "D3 recentFirst prefers recent commit phrase");
  assert(!/^Initial\b/i.test(recent[0] || ""), "D3 recentFirst not Initial commit first");
  const oldest = buildReleaseSummaryLines(commits, {
    recentFirst: false,
    mergeSources: [],
  });
  assert(/^Initial\b/i.test(oldest[0] || ""), "D3 recentFirst=false surfaces oldest first");
}

// D4：宿主检测与 browse URL
{
  assert(detectRemoteHost("https://github.com/org/repo") === "github", "D4 detect github");
  assert(detectRemoteHost("https://gitlab.com/org/repo") === "gitlab", "D4 detect gitlab");
  const gh = buildRemoteBrowseUrl({
    web: "https://github.com/org/repo",
    host: "github",
    firstRelease: false,
    base: "main",
    head: "release/V1",
  });
  assert(
    gh === "https://github.com/org/repo/compare/main...release%2FV1",
    "D4 GitHub compare path"
  );
  const gl = buildRemoteBrowseUrl({
    web: "https://gitlab.com/org/repo",
    host: "gitlab",
    firstRelease: true,
    head: "release/V1",
  });
  assert(
    gl === "https://gitlab.com/org/repo/-/commits/release%2FV1",
    "D4 GitLab commits path"
  );
  assert(
    /GitHub/.test(remoteHintLine(gh, "github")),
    "D4 hint says GitHub"
  );
  assert(
    /GitLab/.test(remoteHintLine(gl, "gitlab")),
    "D4 hint says GitLab"
  );
}

// D5：releases.md 进行中表 upsert
{
  const skeleton = `# idx

## 进行中

| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |
|---|---|---|---|---|---|
| — | （暂无） | — | — | — | — |

## 其它
`;
  const up = upsertReleasesIndexRow(skeleton, {
    date: "2026-10-22",
    identity: "release-V251016",
    branchPair: "release/V251016 → main",
    status: "已定版",
    noteRel: "notes/release-V251016/release-V251016.md",
    owner: "alice",
  });
  assert(up.updated, "D5 upsert updated");
  assert(/release-V251016/.test(up.text), "D5 upsert inserts identity");
  assert(!/（暂无）/.test(up.text), "D5 upsert removes placeholder");
  const up2 = upsertReleasesIndexRow(up.text, {
    date: "2026-10-23",
    identity: "release-V251016",
    branchPair: "release/V251016 → main",
    status: "已定版",
    noteRel: "notes/release-V251016/release-V251016.md",
    owner: "bob",
  });
  const idHits = (up2.text.match(/release-V251016/g) || []).length;
  assert(idHits >= 1 && /bob/.test(up2.text), "D5 upsert same identity updates row");
}

// D2：首次 inventory 空层可观测
{
  const empty = enrichFirstReleaseLayerObservability(
    { policy: "first-release-layered", migrationCount: 0 },
    { configKeys: [], jobKeys: [], taskCodes: [] }
  );
  assert(
    empty.inventory.prodConfigKeyCount === 0 &&
      empty.inventory.nacosOverlayKeyCount === 0 &&
      empty.inventory.syncTaskCodeCount === 0,
    "layerObs empty counts are 0"
  );
  assert(
    JSON.stringify(empty.inventory.layerEmpty) === JSON.stringify(["config", "jobs"]),
    "layerObs empty → layerEmpty config+jobs"
  );
  assert(
    empty.warnings.some((w) => /prod 层 0 键/.test(w)) &&
      empty.warnings.some((w) => /SyncTaskCode 枚举 0/.test(w)),
    "layerObs empty → warnings"
  );
  const filled = enrichFirstReleaseLayerObservability(
    { policy: "first-release-layered" },
    {
      configKeys: [
        { key: "a", source: "application-prod" },
        { key: "b", source: "nacos-overlay" },
      ],
      jobKeys: [],
      taskCodes: ["sms:sync"],
    }
  );
  assert(
    filled.inventory.prodConfigKeyCount === 1 &&
      filled.inventory.nacosOverlayKeyCount === 1 &&
      filled.inventory.syncTaskCodeCount === 1 &&
      filled.inventory.layerEmpty.length === 0 &&
      filled.warnings.length === 0,
    "layerObs filled → no layerEmpty"
  );
}

assert(
  identityFromBranch("origin/release/V260827") === "release-V260827",
  "identityFromBranch origin/release/V260827 → release-V260827"
);
assert(
  identityFromBranch("refs/heads/release/V1") === "release-V1",
  "identityFromBranch refs/heads/… strips refs"
);
assert(
  identityFromBranch("feature/foo/bar") === "feature-foo-bar",
  "identityFromBranch / → -"
);
assert(identityFromBranch("") === "", "identityFromBranch empty → empty");

assert(COMMIT_DISPLAY_MAX === 5, "截断5：COMMIT_DISPLAY_MAX == 5");
assert(COMMIT_DISPLAY_HEAD === 3, "截断5：COMMIT_DISPLAY_HEAD == 3");
assert(COMMIT_DISPLAY_TAIL === 2, "截断5：COMMIT_DISPLAY_TAIL == 2");
assert(COMMIT_HASH_DISPLAY_LEN === 8, "hash display len == 8");
assert(TZ_CHINA === "Asia/Shanghai", "TZ_CHINA == Asia/Shanghai");

assert(
  shortCommitHash("abcdef0123456789deadbeef") === "abcdef01",
  "shortCommitHash truncates to 8"
);
assert(shortCommitHash("abc") === "abc", "shortCommitHash short passthrough");

assert(
  normalizeSourceBranch("origin/code-scaffold") === "code-scaffold",
  "normalizeSourceBranch strips origin/"
);
assert(
  normalizeSourceBranch("refs/remotes/origin/feat/x") === "feat/x",
  "normalizeSourceBranch strips refs/remotes/origin/"
);

// 截断5 形：与 freeze truncateDisplay 同规则（本地复刻，断言常量契约）
function truncateDisplay(rows, max, head, tail) {
  if (!rows || rows.length <= max) {
    return { rows: rows || [], truncated: false, omitted: 0 };
  }
  const omitted = rows.length - head - tail;
  return {
    rows: [
      ...rows.slice(0, head),
      { __omit__: true, omitted },
      ...rows.slice(-tail),
    ],
    truncated: true,
    omitted,
  };
}
const small = truncateDisplay([1, 2, 3, 4, 5], COMMIT_DISPLAY_MAX, COMMIT_DISPLAY_HEAD, COMMIT_DISPLAY_TAIL);
assert(
  small.truncated === false && small.rows.length === 5,
  "截断5：≤5 全量不截断"
);
const big = truncateDisplay(
  [1, 2, 3, 4, 5, 6, 7, 8],
  COMMIT_DISPLAY_MAX,
  COMMIT_DISPLAY_HEAD,
  COMMIT_DISPLAY_TAIL
);
assert(big.truncated === true, "截断5：>5 截断");
assert(big.omitted === 3, "截断5：8 条省略 3（前3+后2）");
assert(
  big.rows[0] === 1 &&
    big.rows[1] === 2 &&
    big.rows[2] === 3 &&
    big.rows[3]?.__omit__ === true &&
    big.rows[4] === 7 &&
    big.rows[5] === 8,
  "截断5：前3 + omit + 后2 形"
);

// artifacts.json SSOT 形（seal-check 输入）
const artRel = "fixtures/docs/releases/notes/_example-artifacts.json";
const artRaw = read(artRel);
assert(artRaw != null, "example artifacts.json readable");
let art = null;
try {
  art = JSON.parse(artRaw);
} catch (e) {
  art = null;
}
assert(art != null, "example artifacts.json parses");
assert(typeof art.identity === "string" && art.identity.length > 0, "artifacts.identity string");
assert(art.version === 1, "artifacts.version == 1");
assert(Array.isArray(art.sql), "artifacts.sql is array");
assert(Array.isArray(art.config), "artifacts.config is array");
assert(Array.isArray(art.jobs), "artifacts.jobs is array");
assert(Array.isArray(art.changeObjects), "artifacts.changeObjects is array");
assert(art.aiTrack && typeof art.aiTrack === "object", "artifacts.aiTrack object");
assert(
  art.sql[0]?.stableId && art.sql[0]?.profile === "prod",
  "artifacts.sql[0] has stableId + profile=prod"
);
assert(
  art.config[0]?.stableId && art.config[0]?.profile === "prod",
  "artifacts.config[0] has stableId + profile=prod"
);

// 模板提及截断5 / 版本身份分支化
const tmpl = read("fixtures/docs/releases/templates/release-note-template.md") || "";
assert(/截断5/.test(tmpl), "release-note-template mentions 截断5");
assert(/版本身份/.test(tmpl), "release-note-template mentions 版本身份");
assert(/Asia\/Shanghai/.test(tmpl), "release-note-template mentions Asia/Shanghai");

// seal-check / push-gate dry CLI（--help，无写盘）
function spawnHelp(scriptRel) {
  const bin = path.join(skillRoot, scriptRel);
  return spawnSync(process.execPath, [bin, "--help"], {
    cwd: skillRoot,
    encoding: "utf8",
  });
}
const sealHelp = spawnHelp("scripts/release-seal-check.mjs");
assert(sealHelp.status === 0, "seal-check --help exit 0");
assert(
  /--note|--root|Usage/i.test(`${sealHelp.stdout || ""}${sealHelp.stderr || ""}`),
  "seal-check --help shows usage"
);
const pushHelp = spawnHelp("scripts/release-push-gate.mjs");
assert(pushHelp.status === 0, "push-gate --help exit 0");

// --- D1：push-gate 临时仓烟测（--no-fetch；用 update-ref 模拟 origin，无网络） ---
function gitIn(cwd, args) {
  return spawnSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}
function runPushGate(root, extraArgs) {
  const bin = path.join(skillRoot, "scripts/release-push-gate.mjs");
  return spawnSync(
    process.execPath,
    [bin, "--root", root, "--no-fetch", ...extraArgs],
    { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }
  );
}
function parseGateJson(r) {
  try {
    return JSON.parse(r.stdout || "{}");
  } catch {
    return {};
  }
}
{
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "release-eng-push-gate-"));
  try {
    gitIn(work, ["init"]);
    gitIn(work, ["config", "user.email", "selfcheck@test"]);
    gitIn(work, ["config", "user.name", "selfcheck"]);
    gitIn(work, ["config", "commit.gpgsign", "false"]);
    fs.writeFileSync(path.join(work, "README.md"), "v1\n");
    gitIn(work, ["add", "README.md"]);
    gitIn(work, ["commit", "-m", "init"]);
    gitIn(work, ["checkout", "-b", "release/never-push"]);
    fs.writeFileSync(path.join(work, "README.md"), "v2-local-only\n");
    gitIn(work, ["add", "README.md"]);
    gitIn(work, ["commit", "-m", "local only"]);

    // 场景1：仅本地发版支、无 origin/<b> → fail
    const never = runPushGate(work, [
      "--release",
      "release/never-push",
      "--baseline",
      "none",
    ]);
    const neverJson = parseGateJson(never);
    assert(never.status === 2, "push-gate never-pushed exit 2");
    assert(neverJson.pass === false, "push-gate never-pushed pass=false");
    assert(
      neverJson.release?.neverPushed === true ||
        (neverJson.warnings || []).some((w) => /never pushed/.test(w)),
      "push-gate never-pushed flag/warning"
    );

    // 场景2：模拟已 push（origin 与本地同 tip）→ pass
    const tip = (gitIn(work, ["rev-parse", "HEAD"]).stdout || "").trim();
    gitIn(work, ["update-ref", "refs/remotes/origin/release/never-push", tip]);
    const synced = runPushGate(work, [
      "--release",
      "release/never-push",
      "--baseline",
      "none",
    ]);
    const syncedJson = parseGateJson(synced);
    assert(synced.status === 0, "push-gate in-sync exit 0");
    assert(syncedJson.pass === true, "push-gate in-sync pass=true");
    assert(
      String(syncedJson.headRef || "").startsWith("origin/"),
      "push-gate in-sync headRef is origin/…"
    );

    // 场景3：本地超前 origin（C1b）→ fail unpushed>0
    fs.writeFileSync(path.join(work, "README.md"), "v3-ahead\n");
    gitIn(work, ["add", "README.md"]);
    gitIn(work, ["commit", "-m", "ahead of origin"]);
    const ahead = runPushGate(work, [
      "--release",
      "release/never-push",
      "--baseline",
      "none",
    ]);
    const aheadJson = parseGateJson(ahead);
    assert(ahead.status === 2, "push-gate unpushed>0 exit 2");
    assert(aheadJson.pass === false, "push-gate unpushed>0 pass=false");
    assert(
      Number(aheadJson.release?.unpushed || 0) > 0,
      "push-gate unpushed>0 count"
    );
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignore cleanup */
    }
  }
}

// --- release.mjs thin CLI (0.3.19-dev) ---
assert(exists("scripts/release.mjs"), "release.mjs exists");
assert(
  manifest != null && /scripts\/release\.mjs/.test(manifest),
  "manifest lists scripts/release.mjs"
);
const releaseCli = read("scripts/release.mjs") || "";
assert(/prepare/.test(releaseCli) && /seal/.test(releaseCli), "release.mjs mentions prepare/seal");
assert(/modes/.test(releaseCli), "release.mjs has modes");
assert(/不代写盘|不写盘|永不写盘/.test(releaseCli), "release.mjs states no write / audit read-only");

function spawnRelease(argv) {
  return spawnSync(process.execPath, [path.join(skillRoot, "scripts/release.mjs"), ...argv], {
    cwd: skillRoot,
    encoding: "utf8",
  });
}
const relHelp = spawnRelease(["--help"]);
assert(relHelp.status === 0, "release.mjs --help exit 0");
const relHelpOut = `${relHelp.stdout || ""}${relHelp.stderr || ""}`;
assert(/modes/.test(relHelpOut), "release.mjs --help mentions modes");
assert(
  /prepare/.test(relHelpOut) &&
    /resume/.test(relHelpOut) &&
    /audit/.test(relHelpOut) &&
    /seal/.test(relHelpOut),
  "release.mjs --help lists prepare/resume/audit/seal"
);
assert(
  /push-gate|freeze|seal-check/.test(relHelpOut),
  "release.mjs --help lists script subcommands"
);

const relModes = spawnRelease(["modes"]);
assert(relModes.status === 0, "release.mjs modes exit 0");
const modesOut = `${relModes.stdout || ""}`;
assert(/prepare/.test(modesOut) && /seal/.test(modesOut), "release.mjs modes lists prepare/seal");
assert(/modes\/prepare\.md/.test(modesOut), "release.mjs modes shows modes/prepare.md");
assert(/push-gate/.test(modesOut) && /seal-check/.test(modesOut), "release.mjs modes lists script aliases");

const relPrep = spawnRelease(["prepare", "--help"]);
assert(relPrep.status === 0, "release.mjs prepare --help exit 0");
assert(/modes\/prepare\.md/.test(`${relPrep.stdout || ""}`), "prepare --help points to modes/prepare.md");

const relSealFwd = spawnRelease(["seal-check", "--", "--help"]);
assert(relSealFwd.status === 0, "release.mjs seal-check -- --help exit 0");
assert(
  /Usage|--note|--root/i.test(`${relSealFwd.stdout || ""}${relSealFwd.stderr || ""}`),
  "release.mjs forwards seal-check --help"
);

assert(/modes\//.test(skill || ""), "SKILL links modes/");
assert(/modes\//.test(index), "AGENT-INDEX links modes/");
assert(/modes\//.test(quick), "QUICKSTART links modes/");
assert(/modes\/README/.test(index), "AGENT-INDEX links modes/README");
assert(/release\.mjs/.test(skill || ""), "SKILL mentions release.mjs");
assert(/release\.mjs/.test(index), "AGENT-INDEX mentions release.mjs");
assert(/release\.mjs/.test(quick), "QUICKSTART mentions release.mjs");
assert(/release\.mjs/.test(readme), "README mentions release.mjs");
assert(/release\.mjs/.test(verify), "VERIFY mentions release.mjs");

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (release-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
