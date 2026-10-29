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
  "modes/conventions.md",
  "modes/README.md",
];

const SCRIPTS = [
  "scripts/release.mjs",
  "scripts/release-format.mjs",
  "scripts/release-push-gate.mjs",
  "scripts/release-freeze.mjs",
  "scripts/release-freeze-enrich.mjs",
  "scripts/release-ai-track.mjs",
  "scripts/release-sql-classify.mjs",
  "scripts/release-sql-bundle.mjs",
  "scripts/release-note-merge.mjs",
  "scripts/release-seal-check.mjs",
  "scripts/release-seal.mjs",
  "scripts/selfcheck.mjs",
];

const FIXTURE_SEED = [
  "fixtures/docs/releases/releases.md",
  "fixtures/docs/releases/ARCHIVE.md",
  "fixtures/docs/releases/templates/release-note-template.md",
  "fixtures/docs/releases/_example-artifacts.json",
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
  removeReleasesIndexRow,
  appendArchiveRow,
  parseReleasesIndexHeader,
  stripBom,
  isMigrationSql,
  migrationSortKey,
  migrationCanonicalId,
  migrationAliasSet,
  isProdConfigPath,
  normalizeNoteStatus,
  isMergeSourceNoise,
  formatMergeSourcesTableRows,
  buildMergeSources,
  bundleSqlVolumeWarning,
  BUNDLE_SQL_WARN_COUNT,
  BUNDLE_SQL_ALERT_COUNT,
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
assert(typeof removeReleasesIndexRow === "function", "export removeReleasesIndexRow");
assert(typeof appendArchiveRow === "function", "export appendArchiveRow");
assert(typeof stripBom === "function", "export stripBom");
assert(typeof isMigrationSql === "function", "export isMigrationSql");
assert(typeof migrationCanonicalId === "function", "export migrationCanonicalId");
assert(typeof migrationAliasSet === "function", "export migrationAliasSet");
assert(typeof isProdConfigPath === "function", "export isProdConfigPath");
assert(typeof normalizeNoteStatus === "function", "export normalizeNoteStatus");
assert(typeof isMergeSourceNoise === "function", "export isMergeSourceNoise");
assert(typeof formatMergeSourcesTableRows === "function", "export formatMergeSourcesTableRows");
assert(typeof bundleSqlVolumeWarning === "function", "export bundleSqlVolumeWarning");

// P2：mergeSources noise + 摘要跳过环境支 + 体积闸
{
  assert(isMergeSourceNoise("test") && isMergeSourceNoise("uat"), "P2 noise test/uat");
  assert(isMergeSourceNoise("无/未识别") && isMergeSourceNoise("merge/foo"), "P2 noise unknown/merge");
  assert(!isMergeSourceNoise("feature/zj8/milvus集合优化"), "P2 feature not noise");
  assert(!isMergeSourceNoise("release/V261029"), "P2 release branch not noise");
  const sources = [
    { source: "test", count: 61, branchSummary: "测试分支合入", noise: true },
    {
      source: "feature/zj8/00-sms-ai项目/261029-milvus集合优化",
      count: 18,
      branchSummary: "milvus集合优化",
      noise: false,
    },
    { source: "uat", count: 7, branchSummary: "uat 相关能力", noise: true },
  ];
  const summary = buildReleaseSummaryLines([], { mergeSources: sources, max: 5 });
  assert(!/测试分支合入/.test(summary[0] || ""), "P2 summary does not lead with test noise");
  assert(/milvus/i.test(summary[0] || ""), "P2 summary prefers business branch");
  const table = formatMergeSourcesTableRows(sources);
  assert(table.some((r) => r.folded && r.count === 68), "P2 fold row sums noise counts");
  assert(table.filter((r) => !r.folded).length === 1, "P2 table keeps one business row");
  const built = buildMergeSources([
    { source: "origin/test", subject: "Merge branch test" },
    { source: "feature/x/y", subject: "feat: ship" },
  ]);
  assert(built.find((r) => r.source === "test")?.noise === true, "P2 buildMergeSources marks noise");
  assert(BUNDLE_SQL_WARN_COUNT === 40 && BUNDLE_SQL_ALERT_COUNT === 100, "P2 volume thresholds");
  assert(/40/.test(bundleSqlVolumeWarning(40) || ""), "P2 warn at 40");
  assert(/100/.test(bundleSqlVolumeWarning(100) || ""), "P2 alert at 100");
  assert(bundleSqlVolumeWarning(10) == null, "P2 no warn under 40");
}

// P0：Flyway 命名 + canonical alias + prod 路径
{
  assert(
    isMigrationSql("sms-ai/src/main/resources/db/migration/V0001__DDL__x.sql"),
    "P0 isMigrationSql Vn__"
  );
  assert(
    isMigrationSql("sms-ai/src/main/resources/db/migration/V0001_0__DDL__x.sql"),
    "P0 isMigrationSql Vn_0__"
  );
  assert(
    isMigrationSql("sms-ai/src/main/resources/db/migration/V0115_1__DML__y.sql"),
    "P0 isMigrationSql Vn_1__"
  );
  assert(
    !isMigrationSql("docs/db/table/foo_change.sql"),
    "P0 isMigrationSql rejects non-migration"
  );
  assert(
    migrationCanonicalId("V0001__DDL__x.sql") ===
      migrationCanonicalId("V0001_0__DDL__x.sql"),
    "P0 canonical Vn__ ≡ Vn_0__"
  );
  assert(
    migrationCanonicalId("V0001_1__DDL__x.sql") !==
      migrationCanonicalId("V0001_0__DDL__x.sql"),
    "P0 canonical Vn_1__ ≠ Vn_0__"
  );
  const priorHit = migrationAliasSet(["V0001__DDL__baseline_schema.sql"]);
  assert(
    priorHit.has(migrationCanonicalId("V0001_0__DDL__baseline_schema.sql")),
    "P0 aliasSet prior Vn__ hits head Vn_0__"
  );
  assert(
    migrationSortKey("V0001_0__a.sql") < migrationSortKey("V0001_1__a.sql"),
    "P0 migrationSortKey orders sub-versions"
  );
  assert(
    isProdConfigPath("sms-ai/src/main/resources/application-prod.yml"),
    "P0 isProdConfigPath application-prod"
  );
  assert(
    isProdConfigPath("sms-ai/src/main/resources/config/nacos/application-prod-nacos.yml"),
    "P0 isProdConfigPath nacos overlay"
  );
  assert(
    !isProdConfigPath("sms-ai/src/main/resources/application-dev.yml"),
    "P0 isProdConfigPath rejects application-dev"
  );
}

// 0.3.28：SQL 归类 / 拼接 / bundle / mock AI
{
  const {
    classifyMigrationKindByFilename,
    releaseSqlBundleName,
    releaseDateToYyMmDd,
    sqlBundleSeparator,
    buildSqlBundleContent,
    sha256Hex,
    assertStatementsEndWithSemicolon,
    detectMixedDdlDml,
  } = format;
  assert(classifyMigrationKindByFilename("V0003_0__DDL__x.sql") === "DDL", "028 filename DDL");
  assert(classifyMigrationKindByFilename("V0005_0__DML__y.sql") === "DML", "028 filename DML");
  assert(
    classifyMigrationKindByFilename("V0113_1__DDL__x.sql") === "DDL",
    "028 old subver _1 still DDL via literal"
  );
  assert(
    classifyMigrationKindByFilename("V261026153045123_0__a__x.sql") === "DDL",
    "028 new-track _0=DDL"
  );
  assert(
    classifyMigrationKindByFilename("V261026153045123_1__a__y.sql") === "DML",
    "028 new-track _1=DML"
  );
  assert(
    classifyMigrationKindByFilename("V0003_1__mystery__x.sql") == null,
    "028 old four-digit subver alone → null"
  );
  assert(releaseDateToYyMmDd("2026-10-29") === "261029", "028 yyMMdd");
  assert(
    releaseSqlBundleName("2026-10-29", "DML") === "release-V261029-DML.sql",
    "028 bundle name"
  );
  assert(
    sqlBundleSeparator("V1__x.sql", "begin") === "-- >>> begin: V1__x.sql",
    "028 begin sep"
  );
  const c1 = "CREATE TABLE a (id INT);\n";
  const c2 = "ALTER TABLE a ADD COLUMN x INT;\n";
  const once = buildSqlBundleContent([
    { basename: "V1__DDL__a.sql", content: c1 },
    { basename: "V2__DDL__b.sql", content: c2 },
  ]);
  const twice = buildSqlBundleContent([
    { basename: "V1__DDL__a.sql", content: c1 },
    { basename: "V2__DDL__b.sql", content: c2 },
  ]);
  assert(once === twice && sha256Hex(once) === sha256Hex(twice), "028 bundle sha reproducible");
  assert(assertStatementsEndWithSemicolon("CREATE TABLE t (id INT);").ok, "028 semicolon ok");
  assert(!assertStatementsEndWithSemicolon("CREATE TABLE t (id INT)").ok, "028 semicolon fail");
  assert(detectMixedDdlDml("CREATE TABLE t(id INT);\nINSERT INTO t VALUES(1);").mixed, "028 mixed");
  assert(!detectMixedDdlDml("INSERT INTO t VALUES(1);").mixed, "028 dml only not mixed");

  const { classifyRefs } = await import(pathToFileURL(path.join(skillRoot, "scripts/release-sql-classify.mjs")).href);
  const { runSqlBundle, verifySqlBundlesOnDisk } = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-sql-bundle.mjs")).href
  );

  const needs = classifyRefs(
    [{ basename: "V99__mystery__x.sql", content: "INSERT INTO t VALUES (1);\n" }],
    {}
  );
  assert(needs.needsAi.length === 1 && !needs.ok, "028 needsAi without ai-json");

  const withAi = classifyRefs(
    [{ basename: "V99__mystery__x.sql", content: "INSERT INTO t VALUES (1);\n" }],
    {
      aiByName: new Map([
        ["V99__mystery__x.sql", { path: "V99__mystery__x.sql", kind: "DML", confidence: "high", reason: "insert" }],
      ]),
    }
  );
  assert(withAi.ok && withAi.resolved[0].kind === "DML" && withAi.resolved[0].classifySource === "ai", "028 ai-json closes");

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "re-sql-bundle-"));
  try {
    const refs = path.join(tmpRoot, "sql", "refs");
    fs.mkdirSync(refs, { recursive: true });
    fs.writeFileSync(path.join(refs, "V0001_0__DDL__a.sql"), "CREATE TABLE a (id INT);\n", "utf8");
    fs.writeFileSync(path.join(refs, "V0002_0__DML__b.sql"), "INSERT INTO a VALUES (1);\n", "utf8");
    const onlyDmlDir = path.join(tmpRoot, "dml-only");
    fs.mkdirSync(path.join(onlyDmlDir, "sql", "refs"), { recursive: true });
    fs.writeFileSync(
      path.join(onlyDmlDir, "sql", "refs", "V0005_0__DML__x.sql"),
      "INSERT INTO t VALUES (1);\n",
      "utf8"
    );

    const both = runSqlBundle({
      bundleDir: tmpRoot,
      releaseDate: "2026-10-29",
      freeze: {
        draft: {
          sql: [
            { 脚本: "V0001_0__DDL__a.sql", 路径: "db/migration/V0001_0__DDL__a.sql" },
            { 脚本: "V0002_0__DML__b.sql", 路径: "db/migration/V0002_0__DML__b.sql" },
          ],
        },
      },
    });
    assert(both.ok, `028 bundle both ok: ${both.errors.join(";")}`);
    assert(both.sqlBundles.length === 2, "028 two bundles");
    assert(fs.existsSync(path.join(tmpRoot, "sql", "release-V261029-DDL.sql")), "028 ddl file");
    assert(fs.existsSync(path.join(tmpRoot, "sql", "release-V261029-DML.sql")), "028 dml file");
    assert(
      verifySqlBundlesOnDisk(tmpRoot, both.sqlBundles, "2026-10-29").length === 0,
      "028 verify ok"
    );
    fs.writeFileSync(path.join(tmpRoot, "sql", "release-V261029-DDL.sql"), "-- tampered\n", "utf8");
    assert(
      verifySqlBundlesOnDisk(tmpRoot, both.sqlBundles, "2026-10-29").length > 0,
      "028 tamper detected"
    );

    const dmlOnly = runSqlBundle({
      bundleDir: onlyDmlDir,
      releaseDate: "2026-10-29",
      freeze: {
        draft: {
          sql: [{ 脚本: "V0005_0__DML__x.sql", 路径: "db/migration/V0005_0__DML__x.sql" }],
        },
      },
    });
    assert(dmlOnly.ok, "028 dml-only ok");
    assert(dmlOnly.sqlBundles.length === 1 && dmlOnly.sqlBundles[0].kind === "DML", "028 only DML side");
    assert(!fs.existsSync(path.join(onlyDmlDir, "sql", "release-V261029-DDL.sql")), "028 no empty DDL");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

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
    noteRel: "release-V251016/release-V251016.md",
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
    noteRel: "release-V251016/release-V251016.md",
    owner: "bob",
  });
  const idHits = (up2.text.match(/release-V251016/g) || []).length;
  assert(idHits >= 1 && /bob/.test(up2.text), "D5 upsert same identity updates row");
}

// P1：releases.md upsert 自适应 sms-ai 列序（版本身份|发版日期|…|路径）
{
  assert(typeof parseReleasesIndexHeader === "function", "export parseReleasesIndexHeader");
  const smsSkeleton = `# idx

## 进行中

| 版本身份 | 发版日期 | 分支对 | 状态 | 路径 | 负责人 |
|---|---|---|---|---|---|
| — | （暂无） | — | — | — | — |

## 其它
`;
  const up = upsertReleasesIndexRow(smsSkeleton, {
    date: "2026-10-29",
    identity: "release-V261029",
    branchPair: "`release/V261029` ← `main`",
    status: "已定版",
    noteRel: "[`release-V261029/`](./release-V261029/release-V261029.md)",
    owner: "待定",
  });
  assert(up.updated, "P1 sms-ai upsert updated");
  assert(
    /^\|\s*release-V261029\s*\|/.test(
      (up.text.match(/^\|.*release-V261029.*\|/m) || [""])[0]
    ),
    "P1 sms-ai upsert identity is first data column"
  );
  assert(/2026-10-29/.test(up.text), "P1 sms-ai upsert writes date");
  assert(
    !/\| 日期 \| 版本身份 \|/.test(up.text.split("## 进行中")[1] || ""),
    "P1 sms-ai upsert does not insert tip default header"
  );
  const headerCount = (up.text.match(/\| 版本身份 \| 发版日期 \|/g) || []).length;
  assert(headerCount === 1, "P1 sms-ai upsert keeps single matching header");
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
const artRel = "fixtures/docs/releases/_example-artifacts.json";
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
assert(Array.isArray(art.sqlBundles), "028 example artifacts.sqlBundles");
assert(art.sqlBundles[0]?.kind === "DDL" && art.sqlBundles[0]?.path, "028 sqlBundles[0] shape");

// 模板提及截断5 / 版本身份分支化
const tmpl = read("fixtures/docs/releases/templates/release-note-template.md") || "";
assert(/截断5/.test(tmpl), "release-note-template mentions 截断5");
assert(/版本身份/.test(tmpl), "release-note-template mentions 版本身份");
assert(/Asia\/Shanghai/.test(tmpl), "release-note-template mentions Asia/Shanghai");
assert(/sql\/refs/.test(tmpl), "release-note-template mentions sql/refs");
assert(/release-V\{yyMMdd\}-DDL|release-V\d+-DDL/.test(tmpl), "release-note-template mentions DDL bundle");

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

// P1：ai-track merge → tagged；prompt 约束
{
  const aiUrl = pathToFileURL(path.join(skillRoot, "scripts/release-ai-track.mjs")).href;
  const aiMod = await import(aiUrl);
  const { mergeAiTrack, buildPromptMd, collectAiCandidates } = aiMod;
  const freeze = {
    draft: {
      sql: [{ 脚本: "V0001_0__DDL__x.sql", 路径: "db/migration/V0001_0__DDL__x.sql", confidence: "path" }],
      config: [{ 键: "sms.ai.x", 来源: "application-prod.yml", 说明: "待补", confidence: "key-diff", 值: "1" }],
      jobs: [],
    },
    changeObjects: [],
  };
  const prompt = buildPromptMd(freeze, collectAiCandidates(freeze));
  assert(/rename-alias/.test(prompt) && /禁止对多条/.test(prompt), "P1 prompt has rename + per-reason rules");
  const merged = mergeAiTrack(freeze, {
    aiRanked: [{ kind: "config", stableId: "sms.ai.x", recommend: "keep", reason: "prod 必改" }],
    aiNoise: [{ kind: "sql", stableId: "V0001_0__DDL__x.sql", reason: "rename-alias：勿重跑" }],
  });
  assert(merged.aiTrack?.status === "tagged", "P1 mergeAiTrack status=tagged");
  assert(merged.aiTrack?.status !== "filled", "P1 mergeAiTrack not filled");
  assert(merged.aiTrack?.rankedTagged === 1 && merged.aiTrack?.noiseTagged === 1, "P1 tagged counts");
  assert(merged.aiTrack?.draftCountsUnchanged === true, "P1 draftCountsUnchanged");
  assert(merged.draft.sql.length === 1 && merged.draft.config.length === 1, "P1 draft rows unchanged");
}

// P1：jobsConfigGaps 仅 draft.jobs
{
  const enrichUrl = pathToFileURL(path.join(skillRoot, "scripts/release-freeze-enrich.mjs")).href;
  const enrichMod = await import(enrichUrl);
  const { computeJobsConfigGaps } = enrichMod;
  const hits = new Map([
    ["a:job", { taskCode: "a:job", cronKey: "cron.a", displayName: "A" }],
    ["b:job", { taskCode: "b:job", cronKey: "cron.b", displayName: "B" }],
    ["c:job", { taskCode: "c:job", cronKey: "cron.c", displayName: "C" }],
  ]);
  const { jobsConfigGaps, jobsConfigGapsAppendix } = computeJobsConfigGaps({
    draftJobs: [{ taskCode: "a:job", "task / cron 键": "cron.a" }],
    jobsHitsMap: hits,
    configKeySet: new Set(),
  });
  assert(jobsConfigGaps.length === 1 && jobsConfigGaps[0].taskCode === "a:job", "P1 gaps only draft job");
  assert(jobsConfigGapsAppendix.length === 2, "P1 appendix has remaining catalog gaps");
}

// P0：seal-check 非 prod config → exit 1
{
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "release-eng-seal-prod-"));
  try {
    const noteDir = path.join(work, "docs/releases/release-P0");
    fs.mkdirSync(path.join(noteDir, "config"), { recursive: true });
    fs.mkdirSync(path.join(work, "docs/releases"), { recursive: true });
    fs.writeFileSync(path.join(work, "docs/releases/releases.md"), "# idx\n");
    const md = `# 发版单：release-P0

> 状态：已定版
> 发版日期：2099-12-31

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | release-P0 |
| 发版日期 | 2099-12-31 |
| 状态 | 已定版 |

## 二、Git 定版

| hash | author | date | subject |
|---|---|---|---|
| abcdef01 | u | 2099-01-01 | feat |

## 四、数据库与 SQL

| 执行序 | 脚本/版本 | 动作 | 目标 profile | 已确认 |
|---|---|---|---|---|
| — | 无 | — | prod | — |

## 五、配置项

> 目标 profile = prod

## 六、定时任务

| — | 无 | — | prod | — |

## 七、包内附属文件

| 类型 | 包内路径 | 源路径 |
|---|---|---|
| config | [application-dev.yml](./config/application-dev.yml) | \`x\` |
`;
    fs.writeFileSync(path.join(noteDir, "release-P0.md"), md);
    fs.writeFileSync(path.join(noteDir, "config/application-dev.yml"), "x: 1\n");
    fs.writeFileSync(
      path.join(noteDir, "artifacts.json"),
      JSON.stringify({
        identity: "release-P0",
        version: 1,
        sql: [],
        config: [
          {
            stableId: "x",
            path: "sms-ai/src/main/resources/application-dev.yml",
            profile: "prod",
          },
        ],
        jobs: [],
        changeObjects: [],
        aiTrack: {},
      })
    );
    const bin = path.join(skillRoot, "scripts/release-seal-check.mjs");
    const r = spawnSync(
      process.execPath,
      [bin, "--root", work, "--note", "docs/releases/release-P0/release-P0.md"],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }
    );
    assert(r.status === 1, "P0 seal-check non-prod config exit 1");
    const out = `${r.stdout || ""}${r.stderr || ""}`;
    assert(/非 prod/.test(out), "P0 seal-check reports 非 prod");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.29：N1 flattenYamlKeys 上一行注释 ---
{
  const freezeUrl = pathToFileURL(path.join(skillRoot, "scripts/release-freeze.mjs")).href;
  const freezeMod = await import(freezeUrl);
  assert(typeof freezeMod.flattenYamlKeys === "function", "export flattenYamlKeys");
  const map = freezeMod.flattenYamlKeys(`
# 上一行中文说明
app.timeout: 30
app.inline: 1 # 行尾说明

# 会被空行隔断

app.afterBlank: 2

# 上一行优先
app.both: 9 # 行尾应输
`);
  assert(map.get("app.timeout")?.comment === "上一行中文说明", "N1 previous-line comment");
  assert(map.get("app.inline")?.comment === "行尾说明", "N1 trailing comment");
  assert(map.get("app.afterBlank")?.comment === "", "N1 blank clears pending");
  assert(map.get("app.both")?.comment === "上一行优先", "N1 previous wins over trailing");
}

// --- 0.3.29：N2 SyncTaskCode 发现 + 无冒号 ---
{
  const enrichUrl = pathToFileURL(
    path.join(skillRoot, "scripts/release-freeze-enrich.mjs")
  ).href;
  const enrich = await import(enrichUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n2-"));
  try {
    const javaDir = path.join(work, "svc", "enums");
    fs.mkdirSync(javaDir, { recursive: true });
    fs.writeFileSync(
      path.join(javaDir, "SyncTaskCode.java"),
      `public enum SyncTaskCode {
  ORDER_TIMEOUT("order-timeout-cancel"),
  LEGACY("sms:legacy-job");
}`
    );
    const files = enrich.findSyncTaskCodeFiles(work);
    assert(
      files.some((f) => /SyncTaskCode\.java$/.test(f)),
      "N2 findSyncTaskCodeFiles discovers non-sms-ai path"
    );
    const map = enrich.loadSyncTaskCodeMap(work);
    assert(map.get("ORDER_TIMEOUT") === "order-timeout-cancel", "N2 no-colon code");
    assert(map.get("LEGACY") === "sms:legacy-job", "N2 colon code still ok");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.29：N4 父级键不进 draft/changeObjects ---
{
  const enrichUrl = pathToFileURL(
    path.join(skillRoot, "scripts/release-freeze-enrich.mjs")
  ).href;
  const enrich = await import(enrichUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n4-"));
  try {
    const out = enrich.enrichFreezePayload(work, {
      candidates: [],
      configKeys: [
        { key: "app", path: "application-prod.yml", value: "", isLeaf: false, change: "added" },
        {
          key: "app.timeout",
          path: "application-prod.yml",
          value: "30",
          isLeaf: true,
          change: "added",
          comment: "超时",
        },
      ],
      jobKeys: [],
      taskCodes: [],
    });
    assert(
      (out.draft?.config || []).every((r) => r.键 !== "app"),
      "N4 draft.config excludes parent"
    );
    assert(
      (out.draft?.config || []).some((r) => r.键 === "app.timeout"),
      "N4 draft.config keeps leaf"
    );
    assert(
      !(out.changeObjects || []).some((o) => o.kind === "config" && o.stableId === "app"),
      "N4 changeObjects excludes parent"
    );
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.29：N10 stripBom ---
{
  assert(stripBom("\uFEFF{\"a\":1}") === '{"a":1}', "N10 stripBom removes FEFF");
  assert(stripBom("plain") === "plain", "N10 stripBom plain unchanged");
}

// --- 0.3.29：N9 seal dry-run + index/ARCHIVE helpers ---
{
  const skeleton = `# idx

## 进行中

| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |
|---|---|---|---|---|---|
| 2026-10-22 | release-V261028 | a→b | 已定版 | release-V261028/x.md | alice |
`;
  const rem = removeReleasesIndexRow(skeleton, "release-V261028");
  assert(rem.removed, "N9 removeReleasesIndexRow removed");
  assert(!/release-V261028/.test(rem.text), "N9 index row gone");

  const arch = appendArchiveRow("", {
    date: "2026-10-22",
    identity: "release-V261028",
    branchPair: "a→b",
    onlineDate: "2026-10-28",
    executor: "bob",
    noteRel: "./archive/release-V261028/release-V261028.md",
  });
  assert(arch.appended && /release-V261028/.test(arch.row), "N9 appendArchiveRow");

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n9-"));
  try {
    const id = "release-N9";
    const noteDir = path.join(work, "docs/releases", id);
    fs.mkdirSync(path.join(noteDir, "config"), { recursive: true });
    fs.mkdirSync(path.join(work, "docs/releases/archive"), { recursive: true });
    const md = `# 发版单：${id}

> 状态：已定版
> 发版日期：2026-10-22
> 发版分支：release/N9 · 基线分支：无
> 负责人：alice

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | ${id} |
| 发版日期 | 2026-10-22 |
| 状态 | 已定版 |
| 上线日期 | （seal 时填；可与发版日期相同） |
| 上线执行人 | （seal 时填） |

## 二、Git 定版

| hash | author | date | subject |
|---|---|---|---|
| abc | a | 2026-10-01 | x |

## 四、数据库与 SQL

| 执行序 | 脚本/版本 | 动作 | 目标 profile | 已确认 |
|---|---|---|---|---|
| — | 无 | — | prod | — |

## 五、配置项

| 来源 | 键 | 说明 | 值 | 目标 profile |
|---|---|---|---|---|
| — | 无 | — | — | prod |

## 六、定时任务

| task_code | 名称 | cron | 目标 profile |
|---|---|---|---|
| — | 无 | — | prod |
`;
    fs.writeFileSync(path.join(noteDir, `${id}.md`), md);
    fs.writeFileSync(
      path.join(noteDir, "artifacts.json"),
      JSON.stringify({
        identity: id,
        version: 1,
        sql: [],
        config: [],
        jobs: [],
        changeObjects: [],
        aiTrack: {},
      })
    );
    fs.writeFileSync(
      path.join(work, "docs/releases/releases.md"),
      `# idx\n\n## 进行中\n\n| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |\n|---|---|---|---|---|---|\n| 2026-10-22 | ${id} | x | 已定版 | ${id}/${id}.md | alice |\n`
    );
    fs.writeFileSync(
      path.join(work, "docs/releases/ARCHIVE.md"),
      `# ARCHIVE\n\n| 日期 | 版本身份 | 分支对 | 上线日期 | 执行人 | 发版单 |\n|---|---|---|---|---|---|\n| — | （暂无） | — | — | — | — |\n`
    );
    const bin = path.join(skillRoot, "scripts/release-seal.mjs");
    const dry = spawnSync(
      process.execPath,
      [
        bin,
        "--root",
        work,
        "--note",
        `docs/releases/${id}/${id}.md`,
        "--online-date",
        "2026-10-28",
        "--executor",
        "bob",
        "--force",
        "--dry-run",
      ],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }
    );
    assert(dry.status === 0, "N9 seal dry-run exit 0");
    let dryJson = {};
    try {
      dryJson = JSON.parse(dry.stdout || "{}");
    } catch {
      dryJson = {};
    }
    assert(dryJson.dryRun === true, "N9 seal dry-run flag");
    assert(Array.isArray(dryJson.actions) && dryJson.actions.length >= 3, "N9 seal plan actions");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.30：N11 值变更不因 baseline 键身份 suppress ---
{
  const enrichUrl = pathToFileURL(
    path.join(skillRoot, "scripts/release-freeze-enrich.mjs")
  ).href;
  const enrich = await import(enrichUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n11-"));
  try {
    const out = enrich.enrichFreezePayload(
      work,
      {
        candidates: [],
        configKeys: [
          {
            key: "unpaid-timeout-minutes",
            path: "backend/application-prod.yml",
            value: "45",
            from: "30",
            change: "changed",
            isLeaf: true,
            comment: "超时",
          },
          {
            key: "timeout-batch-size",
            path: "backend/application-prod.yml",
            value: "100",
            change: "added",
            isLeaf: true,
            comment: "批次",
          },
          {
            key: "legacy.static",
            path: "backend/application-prod.yml",
            value: "1",
            change: "added",
            isLeaf: true,
            comment: "误标但基线已有",
          },
        ],
        jobKeys: [],
        taskCodes: [],
      },
      {
        prior: "none",
        baselinePresence: {
          sqlScripts: [],
          configKeys: ["unpaid-timeout-minutes", "legacy.static"],
          jobIds: [],
        },
      }
    );
    const draftKeys = (out.draft?.config || []).map((r) => r.键);
    const suppressedKeys = (out.draftSuppressed?.config || []).map((r) => r.键);
    assert(draftKeys.includes("unpaid-timeout-minutes"), "N11 changed key stays in draft");
    assert(draftKeys.includes("timeout-batch-size"), "N11 added key in draft");
    assert(
      (out.draft?.config || []).some(
        (r) => r.键 === "unpaid-timeout-minutes" && r.值 === "30→45"
      ),
      "N11 draft value shows old→new"
    );
    assert(!suppressedKeys.includes("unpaid-timeout-minutes"), "N11 changed not suppressed");
    assert(suppressedKeys.includes("legacy.static"), "N11 baseline identity still suppresses non-value-change");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.30：N12 完整记录 URL 在 auto:git / 旧壳兜底 ---
{
  const mergeUrl = pathToFileURL(path.join(skillRoot, "scripts/release-note-merge.mjs")).href;
  const merge = await import(mergeUrl);
  const freeze = {
    gitlabUrl: "https://github.com/org/repo/compare/a...b",
    remoteHost: "github",
    timezone: "Asia/Shanghai",
    commits: [],
    merges: [],
    mergeSources: [],
    draft: { sql: [], config: [], jobs: [] },
  };
  const shell = `## 二、Git 定版

> 截断说明
> 完整记录：

<!-- auto:git:start -->

OLD

<!-- auto:git:end -->
`;
  const out = merge.applySections(shell, freeze);
  assert(/完整记录请登录 GitHub 查看：https:\/\/github\.com\/org\/repo\/compare\/a\.\.\.b/.test(out), "N12 GitHub hint present");
  assert(!/^> 完整记录：\s*$/m.test(out), "N12 empty 完整记录 shell gone");
  assert(
    out.indexOf("完整记录请登录") > out.indexOf("auto:git:start") &&
      out.indexOf("完整记录请登录") < out.indexOf("auto:git:end"),
    "N12 hint inside auto:git markers"
  );
}

// --- 0.3.30：N7 pathBucket top-level + inferServices ---
{
  const freezeUrl = pathToFileURL(path.join(skillRoot, "scripts/release-freeze.mjs")).href;
  const freezeMod = await import(freezeUrl);
  assert(freezeMod.pathBucket("backend/src/x.java") === "backend/", "N7 pathBucket backend");
  assert(freezeMod.pathBucket("order-api/a.yml") === "order-api/", "N7 pathBucket order-api");
  assert(freezeMod.pathBucket("sms-ai/a.java") === "sms-ai/", "N7 pathBucket sms-ai");
  assert(freezeMod.pathBucket("docs/x.md") === "docs/", "N7 pathBucket docs");
  const mergeUrl = pathToFileURL(path.join(skillRoot, "scripts/release-note-merge.mjs")).href;
  const merge = await import(mergeUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n7-"));
  try {
    fs.mkdirSync(path.join(work, "backend"), { recursive: true });
    const block = merge.inferServices(work, { pathStats: { "backend/": 3, 其它: 0 } });
    assert(/\|\s*backend\s*\|\s*是\s*\|/.test(block), "N7 inferServices lists backend");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.30：N13 未跟踪目录 fs-rename 无 fatal warning ---
{
  const sealUrl = pathToFileURL(path.join(skillRoot, "scripts/release-seal.mjs")).href;
  const seal = await import(sealUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-n13-"));
  try {
    spawnSync("git", ["init"], { cwd: work, encoding: "utf8" });
    const fromDir = path.join(work, "docs", "releases", "rel-n13");
    const toDir = path.join(work, "docs", "releases", "archive", "rel-n13");
    fs.mkdirSync(fromDir, { recursive: true });
    fs.writeFileSync(path.join(fromDir, "rel-n13.md"), "# n13\n", "utf8");
    fs.mkdirSync(path.dirname(toDir), { recursive: true });
    const mv = seal.gitMv(work, fromDir, toDir);
    assert(mv.ok === true, "N13 gitMv ok");
    assert(mv.method === "fs-rename", "N13 untracked uses fs-rename");
    assert(!mv.warning || !/fatal/i.test(String(mv.warning)), "N13 no fatal warning");
    assert(fs.existsSync(path.join(toDir, "rel-n13.md")), "N13 dest exists");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.30：N14 interval/fixedDelay 伴键不报 cron 缺口 ---
{
  const enrichUrl = pathToFileURL(
    path.join(skillRoot, "scripts/release-freeze-enrich.mjs")
  ).href;
  const enrich = await import(enrichUrl);
  const { jobsConfigGaps } = enrich.computeJobsConfigGaps({
    draftJobs: [{ taskCode: "order-timeout-cancel", cronKey: "order.timeout.cron" }],
    jobsHitsMap: new Map(),
    configKeySet: new Set(["order.timeout.interval-ms"]),
  });
  assert(jobsConfigGaps.length === 0, "N14 interval companion covers cron gap");
  const stillGap = enrich.computeJobsConfigGaps({
    draftJobs: [{ taskCode: "x", cronKey: "app.jobs.cron" }],
    jobsHitsMap: new Map(),
    configKeySet: new Set(["unrelated.key"]),
  });
  assert(stillGap.jobsConfigGaps.length === 1, "N14 true cron miss still gaps");
}

// --- 0.3.31：N14 实仓 docs-hit + 非 cron 真相（cronKey=null 回退 taskCode）---
{
  const enrichUrl = pathToFileURL(
    path.join(skillRoot, "scripts/release-freeze-enrich.mjs")
  ).href;
  const enrich = await import(enrichUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "release-eng-n14-truth-"));
  try {
    fs.mkdirSync(path.join(work, "docs/jobs/tasks"), { recursive: true });
    fs.writeFileSync(
      path.join(work, "docs/jobs/jobs.md"),
      [
        "| # | 显示名 | task_code | 真相路径 | engine | mode |",
        "|---|---|---|---|---|---|",
        "| 01 | 未支付订单超时取消 | `order-timeout-cancel` | [tasks/01-order-timeout-cancel.md](tasks/01-order-timeout-cancel.md) | Spring | INC |",
        "",
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(work, "docs/jobs/tasks/01-order-timeout-cancel.md"),
      [
        "| task_code | `order-timeout-cancel` |",
        "| 显示名 | 未支付订单超时取消 |",
        "| 配置键 | 非 cron：`fixedDelayString=${app.order.timeout-job.interval-ms:60000}`，`initialDelayString=${app.order.timeout-job.initial-delay-ms:30000}` |",
        "| cronConfigKey | `timeout-job`（无 cron 表达式） |",
        "| 默认表达式 | fixedDelay 60000 ms |",
      ].join("\n")
    );
    const e = enrich.loadJobsCatalog(work).byTaskCode.get("order-timeout-cancel");
    assert(e, "N14 truth catalog entry exists");
    assert(e.cronKey == null, "N14 truth cronKey stays null (non-cron cell)");
    assert(e.scheduleType === "fixedDelay", "N14 truth scheduleType=fixedDelay");
    assert(
      Array.isArray(e.intervalKeys) &&
        e.intervalKeys.includes("app.order.timeout-job.interval-ms"),
      "N14 truth intervalKeys from SpEL"
    );
    assert(e.cronConfigKey === "timeout-job", "N14 truth cronConfigKey");
    const hit = enrich.jobScheduleSlice(e);
    const { jobsConfigGaps } = enrich.computeJobsConfigGaps({
      draftJobs: [
        {
          taskCode: hit.taskCode,
          "task / cron 键": hit.cronKey || hit.taskCode,
          真相: hit.truthPath,
          说明: hit.displayName,
          scheduleType: hit.scheduleType,
          intervalKeys: hit.intervalKeys,
          cronConfigKey: hit.cronConfigKey,
        },
      ],
      jobsHitsMap: new Map([[hit.taskCode, hit]]),
      configKeySet: new Set([
        "app.order.timeout-job.interval-ms",
        "app.order.timeout-job.initial-delay-ms",
        "app.order.timeout-job.enabled",
      ]),
    });
    assert(jobsConfigGaps.length === 0, "N14 real-world fixedDelay docs-hit no cron gap");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.30：N1 叶子继承父级 map 注释 ---
{
  const freezeUrl = pathToFileURL(path.join(skillRoot, "scripts/release-freeze.mjs")).href;
  const freezeMod = await import(freezeUrl);
  const map = freezeMod.flattenYamlKeys(`# 库存告警阈值
stock-alert:
  threshold: 20

# 父级
parent:
  # 叶子自有
  leaf: 1
`);
  assert(
    map.get("stock-alert.threshold")?.comment === "库存告警阈值",
    "N1 inherit parent map comment"
  );
  assert(map.get("parent.leaf")?.comment === "叶子自有", "N1 leaf comment not overwritten");
}

// =====================================================================
// 0.3.32 修复轮新增断言（① sql-bundle _change.sql/D7 · ② nacos prod 判定 ·
// ③ enrich prodPath · ④ prior-since 新式身份 · ⑤ seal --apply 事务性 ·
// ⑥ 状态精确匹配 · ⑦ BOM 统一 · ⑧ --overdue-waived · ⑨ repo-profile ·
// ⑩ prodConfigKeyCount 并入 jobKeys · ⑪ conventions SSOT）
// =====================================================================

/** seal-check 集成测试用最小发版单（目录包 + 空 artifacts.json） */
function writeSealCheckFixture(work, id, { status = "已定版", artifactsJson = null } = {}) {
  const noteDir = path.join(work, "docs", "releases", id);
  fs.mkdirSync(noteDir, { recursive: true });
  const md = `# 发版单：${id}

> 状态：${status}
> 发版日期：2026-10-22

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | ${id} |
| 发版日期 | 2026-10-22 |
| 状态 | 已定版 |

## 二、Git 定版

| hash | author | date | subject |
|---|---|---|---|
| abcdef01 | u | 2026-10-01 | feat |

## 四、数据库与 SQL

| 执行序 | 脚本/版本 | 动作 | 目标 profile | 已确认 |
|---|---|---|---|---|
| — | 无 | — | prod | — |

## 五、配置项

> 目标 profile = prod

## 六、定时任务

| task_code | 名称 | cron | 目标 profile |
|---|---|---|---|
| — | 无 | — | prod |

## 七、包内附属文件

| 类型 | 包内路径 | 源路径 |
|---|---|---|
| — | 无 | — |
`;
  fs.writeFileSync(path.join(noteDir, `${id}.md`), md, "utf8");
  fs.writeFileSync(
    path.join(noteDir, "artifacts.json"),
    artifactsJson != null
      ? artifactsJson
      : JSON.stringify({
          identity: id,
          version: 1,
          sql: [],
          config: [],
          jobs: [],
          changeObjects: [],
          aiTrack: {},
        })
  );
  return noteDir;
}

function runSealCheckBin(root, noteRel, extraArgs = []) {
  const bin = path.join(skillRoot, "scripts/release-seal-check.mjs");
  return spawnSync(
    process.execPath,
    [bin, "--root", root, "--note", noteRel, ...extraArgs],
    { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }
  );
}

// --- 0.3.32 ①：runSqlBundle 剔除 _change.sql + 失败路径保留旧整理文件（C1/D1/D7）---
{
  const bundleUrl = pathToFileURL(path.join(skillRoot, "scripts/release-sql-bundle.mjs")).href;
  const bundleMod = await import(bundleUrl);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-sqlbundle-"));
  try {
    const refs = path.join(work, "sql", "refs");
    fs.mkdirSync(refs, { recursive: true });
    fs.writeFileSync(path.join(refs, "V0001_0__DDL__a.sql"), "CREATE TABLE a (id INT);\n", "utf8");
    fs.writeFileSync(path.join(refs, "V0002_0__DML__b.sql"), "INSERT INTO a VALUES (1);\n", "utf8");

    const withChangeSql = bundleMod.runSqlBundle({
      bundleDir: work,
      releaseDate: "2026-10-29",
      freeze: {
        draft: {
          sql: [
            { 脚本: "docs/db/table/sms_change.sql", 路径: "docs/db/table/sms_change.sql" },
            { 脚本: "V0001_0__DDL__a.sql", 路径: "db/migration/V0001_0__DDL__a.sql" },
            { 脚本: "V0002_0__DML__b.sql", 路径: "db/migration/V0002_0__DML__b.sql" },
          ],
        },
      },
    });
    assert(withChangeSql.ok, `① _change.sql + 双 migration bundle ok: ${withChangeSql.errors.join(";")}`);
    assert(
      !withChangeSql.errors.join(";").includes("refs 缺少 draft.sql migration"),
      "① _change.sql 不再触发「refs 缺少 draft.sql migration」"
    );
    assert(fs.existsSync(path.join(work, "sql", "release-V261029-DDL.sql")), "① DDL 整理文件落盘");
    assert(fs.existsSync(path.join(work, "sql", "release-V261029-DML.sql")), "① DML 整理文件落盘");

    // 真缺 migration → ok=false 且失败路径保留旧整理文件（D7）
    const missing = bundleMod.runSqlBundle({
      bundleDir: work,
      releaseDate: "2026-10-29",
      freeze: {
        draft: {
          sql: [{ 脚本: "V0009_0__DDL__missing.sql", 路径: "db/migration/V0009_0__DDL__missing.sql" }],
        },
      },
    });
    assert(missing.ok === false, "① 真缺 migration → ok=false");
    assert(
      missing.errors.some((e) => e.includes("refs 缺少 draft.sql migration")),
      "① 真缺 migration 仍报缺 refs 错"
    );
    assert(
      fs.existsSync(path.join(work, "sql", "release-V261029-DDL.sql")),
      "① D7 失败路径保留旧 DDL 整理文件"
    );
    assert(
      fs.existsSync(path.join(work, "sql", "release-V261029-DML.sql")),
      "① D7 失败路径保留旧 DML 整理文件"
    );
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ②：isProdConfigPath 放行 basename application-prod-nacos.yml（C2/D2）---
{
  assert(isProdConfigPath("config/application-prod-nacos.yml") === true, "② config/ 下 nacos prod 放行");
  assert(isProdConfigPath("application-prod-nacos.yml") === true, "② 包内拍平 basename nacos prod 放行");
  assert(isProdConfigPath("application-dev.yml") === false, "② application-dev 不放行");
  assert(isProdConfigPath("application.yml") === false, "② application.yml 不放行");
}

// --- 0.3.32 ③：enrich prodPath 语义统一（nacos=true / application.yml=false）（C3/D3）---
{
  const enrichUrlP3 = pathToFileURL(path.join(skillRoot, "scripts/release-freeze-enrich.mjs")).href;
  const enrichP3 = await import(enrichUrlP3);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-prodpath-"));
  try {
    const out = enrichP3.enrichFreezePayload(
      work,
      {
        candidates: [],
        configKeys: [
          {
            key: "sms.ai.timeout",
            path: "sms-ai/src/main/resources/config/nacos/application-prod-nacos.yml",
            value: "30",
            isLeaf: true,
            change: "added",
          },
          {
            key: "app.name",
            path: "sms-ai/src/main/resources/application.yml",
            value: "sms",
            isLeaf: true,
            change: "added",
          },
        ],
        jobKeys: [],
        taskCodes: [],
      },
      { prior: "none" }
    );
    const nacosRow = (out.configKeys || []).find((r) => r.key === "sms.ai.timeout");
    const plainRow = (out.configKeys || []).find((r) => r.key === "app.name");
    assert(nacosRow?.prodPath === true, "③ nacos overlay 键 prodPath=true");
    assert(plainRow?.prodPath === false, "③ application.yml 键 prodPath=false");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ④：prior-since 新式身份回退读 md 发版日期（C4/D4）---
{
  const enrichUrlP4 = pathToFileURL(path.join(skillRoot, "scripts/release-freeze-enrich.mjs")).href;
  const enrichP4 = await import(enrichUrlP4);
  assert(typeof enrichP4.noteReleaseDate === "function", "④ export noteReleaseDate");
  assert(enrichP4.noteReleaseDate("| 发版日期 | 2026-08-27 |") === "2026-08-27", "④ noteReleaseDate 表格式");
  assert(enrichP4.noteReleaseDate("> 发版日期：2026-08-31") === "2026-08-31", "④ noteReleaseDate 引语式");
  assert(enrichP4.noteReleaseDate("# 无日期正文") == null, "④ noteReleaseDate 读不到 → null");

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-priorsince-"));
  try {
    const arch = path.join(work, "docs", "releases", "archive");
    const mkArchiveNote = (id, md) => {
      const dir = path.join(arch, id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${id}.md`), md, "utf8");
    };
    mkArchiveNote("release-V260827", "# 发版单：release-V260827\n\n| 发版日期 | 2026-08-27 |\n");
    mkArchiveNote("release-V260831", "# 发版单：release-V260831\n\n> 发版日期：2026-08-31\n");
    mkArchiveNote("release-V261015", "# 发版单：release-V261015\n\n> 发版日期：2026-10-15\n");
    mkArchiveNote("release-V261099", "# 发版单：release-V261099\n");

    const since = enrichP4.resolvePriorArtifactsBundle(work, "auto", "2026-09-01");
    const ids = since.notes.map((n) => n.identity);
    assert(!ids.includes("release-V260827"), "④ prior-since 过滤 2026-08-27（表格日期）");
    assert(!ids.includes("release-V260831"), "④ prior-since 过滤 2026-08-31（引语日期）");
    assert(ids.includes("release-V261015"), "④ prior-since 保留 2026-10-15");
    assert(ids.includes("release-V261099"), "④ prior-since 无日期保守并入");

    // 旧式日期前缀身份仍按前缀过滤（前缀优先，md 日期更晚也不救）
    mkArchiveNote("2026-08-20-legacy-foo", "# 发版单：2026-08-20-legacy-foo\n\n> 发版日期：2026-10-20\n");
    mkArchiveNote("2026-10-01-legacy-bar", "# 发版单：2026-10-01-legacy-bar\n");
    const since2 = enrichP4.resolvePriorArtifactsBundle(work, "auto", "2026-09-01");
    const ids2 = since2.notes.map((n) => n.identity);
    assert(!ids2.includes("2026-08-20-legacy-foo"), "④ 旧式日期前缀身份按前缀过滤");
    assert(ids2.includes("2026-10-01-legacy-bar"), "④ 旧式日期前缀身份 ≥ since 保留");
    assert(ids2.length === 3, "④ 过滤后并集 3 份（0.15 + 无日期 + 旧式保留）");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑤：seal --apply 事务性 + 分支对尾注剥离（D5/D6）---
{
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-sealapply-"));
  try {
    gitIn(work, ["init"]);
    gitIn(work, ["checkout", "-b", "main"]);
    gitIn(work, ["config", "user.email", "selfcheck@test"]);
    gitIn(work, ["config", "user.name", "selfcheck"]);
    gitIn(work, ["config", "commit.gpgsign", "false"]);
    const id = "release-V261029";
    writeSealCheckFixture(work, id);
    const noteMdPath = path.join(work, "docs", "releases", id, `${id}.md`);
    const noteText = fs
      .readFileSync(noteMdPath, "utf8")
      .replace(
        "> 发版日期：2026-10-22\n",
        "> 发版日期：2026-10-22\n> 发版分支：release/V261029 · 基线分支：main\n> 负责人：alice\n"
      );
    fs.writeFileSync(noteMdPath, noteText, "utf8");
    fs.writeFileSync(
      path.join(work, "docs", "releases", "releases.md"),
      `# idx\n\n## 进行中\n\n| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |\n|---|---|---|---|---|---|\n| 2026-10-22 | ${id} | release/V261029 → main | 已定版 | ${id}/${id}.md | alice |\n`
    );
    fs.writeFileSync(
      path.join(work, "docs", "releases", "ARCHIVE.md"),
      `# ARCHIVE\n\n| 日期 | 版本身份 | 分支对 | 上线日期 | 执行人 | 发版单 |\n|---|---|---|---|---|---|\n| — | （暂无） | — | — | — | — |\n`
    );
    gitIn(work, ["add", "."]);
    gitIn(work, ["commit", "-m", "seed"]);

    const bin = path.join(skillRoot, "scripts/release-seal.mjs");
    const r = spawnSync(
      process.execPath,
      [
        bin,
        "--root",
        work,
        "--note",
        `docs/releases/${id}/${id}.md`,
        "--online-date",
        "2026-10-29",
        "--executor",
        "bob",
        "--force",
        "--apply",
      ],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }
    );
    const rOut = `${r.stdout || ""}${r.stderr || ""}`.replace(/\s+/g, " ").slice(0, 160);
    assert(r.status === 0, `⑤ seal --apply exit 0（got ${r.status}: ${rOut}）`);
    const archivedMdPath = path.join(work, "docs", "releases", "archive", id, `${id}.md`);
    assert(fs.existsSync(archivedMdPath), "⑤ 归档侧 md 存在");
    const archivedMd = fs.readFileSync(archivedMdPath, "utf8");
    assert(/> 状态：已上线/.test(archivedMd), "⑤ 归档侧 md 状态=已上线");
    assert(!fs.existsSync(path.join(work, "docs", "releases", id)), "⑤ 进行中目录无残留");
    const releasesMd = fs.readFileSync(path.join(work, "docs", "releases", "releases.md"), "utf8");
    assert(!releasesMd.includes(id), "⑤ releases.md 行已删");
    const archiveMd = fs.readFileSync(path.join(work, "docs", "releases", "ARCHIVE.md"), "utf8");
    assert(/release\/V261029 vs main/.test(archiveMd), "⑤ ARCHIVE 分支对=release vs main");
    assert(!archiveMd.includes("首次发版填"), "⑤ ARCHIVE 分支对无「（首次发版填「无」）」尾注");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑥：normalizeNoteStatus 精确匹配 + seal-check 占位状态（C5/D5）---
{
  assert(normalizeNoteStatus("准备中 | 已定版 | 已上线 | 已取消") === "", "⑥ 占位枚举行 → 空串");
  assert(normalizeNoteStatus("已定版") === "已定版", "⑥ 精确匹配 已定版");
  assert(normalizeNoteStatus("  已上线  ") === "已上线", "⑥ trim 后精确匹配");
  assert(normalizeNoteStatus("已上线（草稿）") === "", "⑥ 带装饰后缀 → 空串");

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-placeholder-"));
  try {
    const id = "release-PLACEHOLDER";
    writeSealCheckFixture(work, id, {
      status: "准备中 | 已定版 | 已上线 | 已取消",
    });
    const r = runSealCheckBin(work, `docs/releases/${id}/${id}.md`);
    const out = `${r.stdout || ""}${r.stderr || ""}`;
    assert(r.status === 1, "⑥ 占位状态 seal-check exit 1");
    assert(/状态须为「已定版」/.test(out), "⑥ 占位状态报「状态须为已定版」");
    assert(!/可能已 seal/.test(out), "⑥ 占位状态不再误报「可能已 seal」");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑦：BOM artifacts.json —— seal-check 可解析 + enrich 走 artifacts 源（D8）---
{
  const enrichUrlP7 = pathToFileURL(path.join(skillRoot, "scripts/release-freeze-enrich.mjs")).href;
  const enrichP7 = await import(enrichUrlP7);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-bom-"));
  try {
    const id = "release-BOM";
    const noteDir = writeSealCheckFixture(work, id, {
      artifactsJson:
        "\uFEFF" +
        JSON.stringify({
          identity: id,
          version: 1,
          sql: [],
          config: [
            {
              stableId: "sms.ai.timeout",
              path: "sms-ai/src/main/resources/config/nacos/application-prod-nacos.yml",
              profile: "prod",
            },
          ],
          jobs: [],
          changeObjects: [],
          aiTrack: {},
        }),
    });
    fs.writeFileSync(
      path.join(work, "docs", "releases", "releases.md"),
      `# idx\n\n## 进行中\n\n| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |\n|---|---|---|---|---|---|\n| 2026-10-22 | ${id} | a→b | 已定版 | ${id}/${id}.md | alice |\n`
    );
    const loaded = enrichP7.loadArtifactsForNoteFile(work, path.join(noteDir, `${id}.md`));
    assert(loaded.source === "artifacts.json", "⑦ BOM 下 enrich 仍走 artifacts.json 源");
    assert(loaded.artifacts.identity === id, "⑦ BOM 下 artifacts identity 正常解析");
    assert(loaded.artifacts.configKeys.has("sms.ai.timeout"), "⑦ BOM 下 config 键正常收录");

    const r = runSealCheckBin(work, `docs/releases/${id}/${id}.md`);
    let json = {};
    try {
      json = JSON.parse(r.stdout || "{}");
    } catch {
      json = {};
    }
    assert(r.status === 0, `⑦ BOM 下 seal-check exit 0（got ${r.status}）`);
    assert(
      !JSON.stringify(json.errors || []).includes("无法解析"),
      "⑦ BOM 下 seal-check 不报「artifacts.json 无法解析」"
    );
    assert((json.errors || []).length === 0, "⑦ BOM 下 seal-check 无 error");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑧：note-merge --overdue-waived 硬闸落点（D15）---
{
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-overdue-"));
  try {
    const freezePath = path.join(work, "freeze.json");
    fs.writeFileSync(
      freezePath,
      JSON.stringify({
        ok: false,
        overdueHardGate: true,
        head: "release/V261029",
        draft: { sql: [], config: [], jobs: [] },
        commits: [],
        merges: [],
        mergeSources: [],
        changeObjects: [],
        todoPlaceholders: [],
      }),
      "utf8"
    );
    const bin = path.join(skillRoot, "scripts/release-note-merge.mjs");
    const base = [
      "--root",
      work,
      "--note",
      "docs/releases/release-OW/release-OW.md",
      "--freeze-json",
      freezePath,
      "--release-date",
      "2026-10-29",
    ];
    const denied = spawnSync(process.execPath, [bin, ...base], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    const deniedOut = `${denied.stdout || ""}${denied.stderr || ""}`;
    assert(denied.status === 1, "⑧ overdueHardGate 无 --overdue-waived → exit 1");
    assert(!fs.existsSync(path.join(work, "docs", "releases", "release-OW")), "⑧ 拒绝写盘：目录包未落盘");
    assert(/--overdue-waived/.test(deniedOut), "⑧ 拒绝信息提示 --overdue-waived");

    const reason = "书面说明：历史逾期单经批准跳过";
    const waived = spawnSync(process.execPath, [bin, ...base, "--overdue-waived", reason], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    const waivedOut = `${waived.stdout || ""}${waived.stderr || ""}`.replace(/\s+/g, " ").slice(0, 160);
    assert(
      waived.status === 0,
      `⑧ --overdue-waived → exit 0（got ${waived.status}: ${waivedOut}）`
    );
    const artifactsPath = path.join(work, "docs", "releases", "release-OW", "artifacts.json");
    assert(fs.existsSync(artifactsPath), "⑧ waived 后 artifacts.json 落盘");
    const art = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
    assert(art.overdueWaived?.reason === reason, "⑧ artifacts.overdueWaived.reason 记录书面说明");
    assert(/^\d{4}-\d{2}-\d{2}$/.test(art.overdueWaived?.date || ""), "⑧ artifacts.overdueWaived.date 落日期");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑨：repo-profile 外置覆盖 + slugCn 注入（T6）---
{
  const profileUrl = pathToFileURL(path.join(skillRoot, "scripts/lib/repo-profile.mjs")).href;
  const profileMod = await import(profileUrl);
  assert(typeof profileMod.loadRepoProfile === "function", "⑨ export loadRepoProfile");
  assert(
    profileMod.DEFAULT_REPO_PROFILE?.branchSlugCn?.milvus === "Milvus 向量库同步",
    "⑨ DEFAULT_REPO_PROFILE.branchSlugCn 保留源仓默认表"
  );
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "re-0332-profile-"));
  try {
    const missing = profileMod.loadRepoProfile(work);
    assert(
      missing.branchSlugCn === profileMod.DEFAULT_REPO_PROFILE.branchSlugCn,
      "⑨ 文件缺失回退 DEFAULT"
    );
    const profDir = path.join(work, "docs", "releases");
    fs.mkdirSync(profDir, { recursive: true });
    fs.writeFileSync(path.join(profDir, "repo-profile.json"), "{ not json", "utf8");
    const bad = profileMod.loadRepoProfile(work);
    assert(bad.branchSlugCn === profileMod.DEFAULT_REPO_PROFILE.branchSlugCn, "⑨ 坏 JSON 回退 DEFAULT 不抛错");
    fs.writeFileSync(
      path.join(profDir, "repo-profile.json"),
      JSON.stringify({ branchSlugCn: { milvus: "自定义向量库短语" } }),
      "utf8"
    );
    const merged = profileMod.loadRepoProfile(work);
    assert(merged.branchSlugCn.milvus === "自定义向量库短语", "⑨ 覆盖键胜出");
    assert(
      merged.branchSlugCn.neo4j === profileMod.DEFAULT_REPO_PROFILE.branchSlugCn.neo4j,
      "⑨ 深合并保留其它 slug"
    );
    assert(
      merged.knownServices === profileMod.DEFAULT_REPO_PROFILE.knownServices,
      "⑨ 未覆盖表原样保留"
    );
    const built = buildMergeSources([{ source: "feature/milvus", subject: "" }], {
      slugCn: merged.branchSlugCn,
    });
    assert(built[0]?.branchSummary === "自定义向量库短语", "⑨ buildMergeSources 注入覆盖词");
    const builtDefault = buildMergeSources([{ source: "feature/milvus", subject: "" }]);
    assert(builtDefault[0]?.branchSummary === "Milvus 向量库同步", "⑨ 缺省 slugCn 不受影响");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// --- 0.3.32 ⑩：prodConfigKeyCount 并入 jobKeys（D18）---
{
  const obs = enrichFirstReleaseLayerObservability(
    { policy: "first-release-layered" },
    {
      configKeys: [],
      jobKeys: [{ key: "app.order.timeout-job.cron", source: "application-prod" }],
      taskCodes: [],
    }
  );
  assert(obs.inventory.prodConfigKeyCount === 1, "⑩ jobKeys 计入 prodConfigKeyCount");
  assert(!obs.inventory.layerEmpty.includes("config"), "⑩ prod yml 仅 cron 键不再误报 config 空层");
}

// --- 0.3.32 ⑪：conventions.md SSOT 存在 + 入口链接（T4）---
{
  const conventions = read("modes/conventions.md");
  assert(conventions != null, "⑪ modes/conventions.md 存在");
  assert(
    conventions != null && /发版日期/.test(conventions) && /截断5/.test(conventions),
    "⑪ conventions 覆盖日期算法与截断5"
  );
  assert((skill || "").includes("modes/conventions.md"), "⑪ SKILL 链接 conventions.md");
  const gatesCommonText = read("modes/gates-common.md") || "";
  assert(gatesCommonText.includes("conventions.md"), "⑪ gates-common 链接 conventions.md");
}

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (release-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
