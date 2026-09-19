#!/usr/bin/env node
/**
 * release-eng selfcheck (0.3.20-dev)：静态断言 + 纯函数/形断言。
 * 覆盖：manifest · modes/ 模式文件 · 关键脚本 · fixtures 种子 ·
 * AGENT-INDEX / QUICKSTART / VERIFY · 钉号链 ·
 * identityFromBranch · 截断5 · shortCommitHash · artifacts.json 形 ·
 * seal-check --help · release.mjs --help/modes。
 *
 * 非 harness land：不对齐 harness 自动 land 流水线。
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

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

const PIN = "0.3.20-dev";

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
  manifest != null && /version:\s*"0\.3\.20-dev"/.test(manifest),
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
  skill != null && /0\.3\.20-dev/.test(skill),
  `SKILL pins ${PIN}`
);

assert(exists("AGENT-INDEX.md"), "AGENT-INDEX.md exists");
const index = read("AGENT-INDEX.md") || "";
assert(/必读/.test(index), "AGENT-INDEX has 必读");
assert(/按需/.test(index), "AGENT-INDEX has 按需");
assert(/0\.3\.20-dev/.test(index), `AGENT-INDEX pins ${PIN}`);
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

const changelog = read("CHANGELOG.md");
assert(changelog != null, "CHANGELOG.md exists");
assert(
  changelog != null && /^##\s+0\.3\.20-dev\b/m.test(changelog),
  "CHANGELOG has ## 0.3.20-dev heading"
);
assert(
  changelog != null && /^##\s+0\.3\.19-dev\b/m.test(changelog),
  "CHANGELOG retains ## 0.3.19-dev heading"
);
assert(
  changelog != null && /^##\s+0\.3\.18-dev\b/m.test(changelog),
  "CHANGELOG retains ## 0.3.18-dev heading"
);
assert(
  changelog != null && changelog.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);

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
} = format;

assert(typeof identityFromBranch === "function", "export identityFromBranch");
assert(typeof shortCommitHash === "function", "export shortCommitHash");
assert(typeof normalizeSourceBranch === "function", "export normalizeSourceBranch");

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

// --- release.mjs thin CLI (0.3.20-dev) ---
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
