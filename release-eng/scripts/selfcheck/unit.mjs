/**
 * @layer unit — 纯函数（快）
 */
import path from "path";
import { pathToFileURL } from "url";

export async function runUnit(kit) {
  const { skillRoot, assert } = kit;

  const format = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-format.mjs")).href
  );
  const paths = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/paths.mjs")).href
  );
  const preview = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/preview.mjs")).href
  );
  const catalog = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/catalog.mjs")).href
  );
  const prior = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/prior.mjs")).href
  );
  const change = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/change-objects.mjs")).href
  );
  const safeOut = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/safe-out.mjs")).href
  );

  assert(
    format.identityFromReleaseDate("2026-11-26") === "release-V261126",
    "identityFromReleaseDate"
  );
  assert(format.identityFromReleaseDate("bad") === "", "identityFromReleaseDate bad");
  assert(
    format.identityFromBranch("origin/release/V260827") === "release-V260827",
    "identityFromBranch"
  );
  assert(format.shortCommitHash("abcdef012345") === "abcdef01", "shortCommitHash");
  assert(format.COMMIT_DISPLAY_MAX === 5, "COMMIT_DISPLAY_MAX");
  assert(format.stripBom("\uFEFFabc") === "abc", "stripBom");
  assert(format.stripBom("\uFEFF\uFEFFabc") === "abc", "stripBom strips every leading FEFF");
  const textEnc = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/text-encoding.mjs")).href
  );
  const utf16Json = Buffer.concat([
    Buffer.from([0xff, 0xfe]),
    Buffer.from('{"ok":true}', "utf16le"),
  ]);
  assert(textEnc.decodeTextBuffer(utf16Json) === '{"ok":true}', "UTF-16 LE JSON decodes");

  const thu = format.recommendedReleaseThursday(
    new Date(Date.UTC(2026, 10, 24, 12))
  );
  assert(thu === "2026-11-26", "recommendedReleaseThursday Tue");

  assert(paths.pathBucket("docs/x.md") === "docs/", "pathBucket docs");
  assert(
    paths.pathBucket("sms-ai/db/migration/V1__a.sql") === "db/migration",
    "pathBucket migration"
  );
  assert(
    paths.excludeReleasePackageFiles(["docs/releases/a/a.md", "src/a.java"]).length === 1,
    "excludeReleasePackageFiles"
  );

  assert(typeof preview.toDraftPreviewMd === "function", "toDraftPreviewMd");
  assert(typeof preview.toFreezeSummary === "function", "toFreezeSummary");
  assert(typeof preview.toAuditFreezeSummary === "function", "toAuditFreezeSummary");
  const summary = preview.toFreezeSummary({
    range: "a..b",
    draft: { sql: [], config: [], jobs: [] },
    draftSuppressed: { sql: [], config: [], jobs: [] },
  });
  assert(/freeze · summary/.test(summary), "toFreezeSummary renders");

  assert(catalog.rankConfidence("path", "docs-hit") === "docs-hit", "rankConfidence");
  assert(typeof catalog.loadJobsCatalog === "function", "loadJobsCatalog");
  assert(typeof prior.scanOverdueNotes === "function", "scanOverdueNotes");
  assert(typeof prior.scanIndexDrift === "function", "scanIndexDrift");
  assert(typeof change.buildArtifactsJson === "function", "buildArtifactsJson");
  assert(typeof change.buildChangeObjects === "function", "buildChangeObjects");
  const art = change.buildArtifactsJson("release-V261126", {
    draft: { sql: [], config: [], jobs: [] },
  });
  assert(art.identity === "release-V261126" && art.version === 1, "buildArtifactsJson shape");

  const resolved = safeOut.resolveSafeOut({
    format: "json",
    out: null,
    forceTemp: true,
    prefix: "unit-test",
  });
  assert(resolved.autoOut && resolved.outPath, "resolveSafeOut forceTemp");
  const resolvedExplicit = safeOut.resolveSafeOut({
    format: "json",
    out: path.join(skillRoot, "scripts/_tmp_unit_out.json"),
  });
  assert(!resolvedExplicit.autoOut && resolvedExplicit.outPath, "resolveSafeOut explicit");

  const fly = { sqlDir: "custom/sql", sqlFormat: "flyway" };
  const glob = { sqlDir: "custom/sql", sqlFormat: "*.sql" };
  assert(
    format.isMigrationSql("sms-ai/src/main/resources/db/migration/V0001__DDL__x.sql"),
    "legacy isMigrationSql still matches db/migration"
  );
  assert(
    !format.isMigrationSql("custom/sql/V0001__DDL__x.sql"),
    "legacy isMigrationSql rejects outside db/migration"
  );
  assert(
    format.isMigrationSql("custom/sql/V0001__DDL__x.sql", fly),
    "flyway profile matches under dir"
  );
  assert(
    !format.isMigrationSql("custom/sql/notes.sql", fly),
    "flyway profile rejects non-version name"
  );
  assert(
    !format.isMigrationSql("other/sql/V0001__DDL__x.sql", fly),
    "flyway profile rejects outside dir"
  );
  assert(format.isMigrationSql("custom/sql/notes.sql", glob), "glob profile matches *.sql");
  assert(
    format.isMigrationSql("custom/sql/nested/a.sql", glob),
    "glob profile includes nested files"
  );
  assert(!format.isMigrationSql("custom/sql/a.sql", { sqlDir: "custom/sql" }), "half profile misses");
  assert(format.recommendSqlFormat(["V1__a.sql"]) === "flyway", "recommend flyway");
  assert(format.recommendSqlFormat(["a.sql", "b.sql"]) === "*.sql", "recommend *.sql");
  assert(format.recommendSqlFormat(["V1__a.sql", "a.sql"]) == null, "mixed format no recommend");
  assert(format.validateSqlDir("../x"), "reject parent sql dir");
  assert(format.validateSqlDir("C:/sql"), "reject absolute sql dir");
  assert(!format.validateSqlDir("custom/sql"), "accept relative sql dir");
  assert(format.validateSqlFormat("a/b.sql"), "reject format with slash");
  assert(!format.validateSqlFormat("flyway") && !format.validateSqlFormat("*.sql"), "accept formats");
  const unread = format.readSqlProfile("# x\n\n## SQL 扫描\n\n| 项 | 值 |\n|---|---|\n| SQL 目录 | （未记录） |\n| SQL 格式 | （未记录） |\n");
  assert(unread.firstUse && !unread.sqlDir && !unread.sqlFormat, "placeholder is first use");
  const onlyDir = format.readSqlProfile(
    "## SQL 扫描\n\n| 项 | 值 |\n|---|---|\n| SQL 目录 | `custom/sql` |\n| SQL 格式 | （未记录） |\n"
  );
  assert(onlyDir.firstUse && onlyDir.sqlDir === "custom/sql", "one cell is still first use");
  const up = format.upsertSqlProfile("# idx\n\n## 进行中\n", {
    sqlDir: "custom/sql",
    sqlFormat: "flyway",
  });
  const again = format.readSqlProfile(up.text);
  assert(up.updated && !again.firstUse && again.sqlFormat === "flyway", "upsert records both");
  assert(/## 进行中/.test(up.text), "upsert keeps 进行中");

  // 0.4.5：对比版本 merge 口径 / 前 5 条样表 / 附属逐项 / HTML 链接
  assert(
    format.parseNoteHeadRef("> 定版引用：origin/main..origin/release/x · 负责人") ===
      "origin/release/x",
    "parseNoteHeadRef a..b"
  );
  assert(
    format.parseNoteHeadRef("> 定版引用：首次发版:origin/release/V260827") ===
      "origin/release/V260827",
    "parseNoteHeadRef first release"
  );
  assert(
    format.parseNoteHeadRef("| 定版引用 | origin/main..origin/release/y |") ===
      "origin/release/y",
    "parseNoteHeadRef table row"
  );

  const merge = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-note-merge.mjs")).href
  );
  const html = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-note-html.mjs")).href
  );
  const manySql = merge.buildSqlSection({
    sql: Array.from({ length: 8 }, (_, i) => ({
      stableId: `V01${i}_0__DDL__t${i}.sql`,
      action: "新增",
    })),
  });
  assert((manySql.match(/^\| \d+ \|/gm) || []).length === 5, "sql sample max 5");
  assert(/其余 3 条详见 \[sql\/README\.md\]/.test(manySql), "sql rest links README");
  const manyJobs = merge.buildJobsSection({
    draft: {
      jobs: Array.from({ length: 7 }, (_, i) => ({
        taskCode: `job:${i}`,
        description: `任务${i}`,
        cron: `0 0 ${i} * * ?`,
      })),
    },
  });
  assert((manyJobs.match(/^\| \d+ \|/gm) || []).length === 5, "jobs sample max 5");
  assert(/其余 2 条详见 \[jobs\/README\.md\]/.test(manyJobs), "jobs rest links README");
  const bundle = merge.buildBundleSection([
    { kind: "sql", bundlePath: "sql/refs/a.sql", sourcePath: "x" },
    {
      kind: "sql-bundle",
      bundlePath: "sql/[sms_db_prod]-V261126-DDL.sql",
      sourcePath: "← sql/refs/ × 2（DDL）",
    },
    { kind: "jobs", bundlePath: "jobs/README.md", sourcePath: "（汇总 9 项）" },
  ]);
  assert(/^- \*\*SQL 原件\*\*/m.test(bundle), "bundle item sql");
  assert(/^- \*\*整理 · DDL\*\*/m.test(bundle), "bundle item ddl");
  assert(/^- \*\*定时任务\*\*：9 项 ·/m.test(bundle), "bundle item jobs");

  const noteMd = [
    "# 发版单：release-V261126",
    "",
    "## 七、包内附属文件",
    "",
    "<!-- auto:bundle:start -->",
    "",
    "本版附属：SQL 原件 1 份。",
    "",
    "- **整理 · DDL**：[[sms_db_prod]-V261126-DDL.sql](./sql/[sms_db_prod]-V261126-DDL.sql)（1 条）",
    "",
    "<!-- auto:bundle:end -->",
  ].join("\n");
  const noteHtml = html.buildNoteHtml(noteMd);
  assert(/class="manifest-item"/.test(noteHtml), "html manifest item");
  assert(
    /href="\.\/sql\/\[sms_db_prod\]-V261126-DDL\.sql"[^>]*class="filelink"/.test(noteHtml),
    "html bracket filename link"
  );
  assert(/target="_blank"/.test(noteHtml), "html file link new tab");
}
