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
  "scripts/release-sql-classify.mjs",
  "scripts/release-sql-bundle.mjs",
  "scripts/release-note-merge.mjs",
  "scripts/release-seal-check.mjs",
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
  parseReleasesIndexHeader,
  isMigrationSql,
  migrationSortKey,
  migrationCanonicalId,
  migrationAliasSet,
  isProdConfigPath,
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
assert(typeof isMigrationSql === "function", "export isMigrationSql");
assert(typeof migrationCanonicalId === "function", "export migrationCanonicalId");
assert(typeof migrationAliasSet === "function", "export migrationAliasSet");
assert(typeof isProdConfigPath === "function", "export isProdConfigPath");
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

// --- report ---
const total = ok.length + fail.length;
if (fail.length) {
  console.error(`FAIL ${fail.length}/${total}`);
  for (const m of fail) console.error("  ✗", m);
  process.exit(1);
}
console.log(`PASS ${ok.length}/${total} (release-eng ${PIN})`);
for (const m of ok) console.log("  ✓", m);
