/**
 * @layer unit — 纯函数（快）
 */
import fs from "fs";
import os from "os";
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

  const mariadb = format.jdbcUrlFromValue(
    "${DB_URL:jdbc:mariadb://prod-db:3306/inventory_order}"
  );
  assert(
    mariadb === "jdbc:mariadb://prod-db:3306/inventory_order",
    "jdbc unwraps spring default"
  );
  assert(format.jdbcUrlFromValue("${DB_URL}") == null, "jdbc bare placeholder is not a url");
  const dsSpring = format.resolveProdDatasource(
    {
      draft: {
        config: [
          {
            键: "spring.datasource.url",
            值: "${DB_URL:jdbc:mariadb://prod-db:3306/inventory_order}",
          },
        ],
      },
    },
    {
      texts: [
        {
          source: "application-prod.yml",
          text: "url: ${PG_URL:jdbc:postgresql://db:5432/orders_pg}\n",
        },
      ],
    }
  );
  assert(dsSpring?.dbName === "inventory_order", "spring mariadb default yields db name");
  const dsPg = format.resolveProdDatasource(
    { draft: { config: [] } },
    {
      texts: [
        {
          source: "application-prod.yml",
          text: 'url: "${PG_URL:jdbc:postgresql://db:5432/orders_pg}"\n',
        },
      ],
    }
  );
  assert(dsPg?.dbName === "orders_pg", "spring postgres default yields db name");
  assert(
    format.classifySqlByVerbs("CREATE TABLE t(id INT);").kind === "DDL",
    "verb heuristic DDL"
  );
  assert(
    format.classifySqlByVerbs("INSERT INTO t VALUES(1);").kind === "DML",
    "verb heuristic DML"
  );
  assert(
    format.classifySqlByVerbs("CREATE TABLE t(id INT);\nINSERT INTO t VALUES(1);") == null,
    "verb heuristic mixed is null"
  );

  const blurbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "re-blurb-"));
  try {
    fs.writeFileSync(
      path.join(blurbRoot, "README.md"),
      "# 仓\n\n> 库存与订单管理的小型全栈 monorepo：\n",
      "utf8"
    );
    fs.mkdirSync(path.join(blurbRoot, "backend"), { recursive: true });
    assert(
      format.loadModuleBlurb(blurbRoot, "backend", {}) === "（待补）",
      "module blurb does not copy repo intro"
    );
    assert(
      format.loadModuleBlurb(blurbRoot, "sms-ai", { "sms-ai": "短信服务" }) === "短信服务",
      "module blurb uses profile"
    );
  } finally {
    fs.rmSync(blurbRoot, { recursive: true, force: true });
  }

  const archRoot = fs.mkdtempSync(path.join(os.tmpdir(), "re-arch-"));
  try {
    const id = "release-V261203";
    fs.mkdirSync(path.join(archRoot, "docs", "releases", "archive", id), { recursive: true });
    fs.writeFileSync(
      path.join(archRoot, "docs", "releases", "archive", id, `${id}.md`),
      "# archived\n",
      "utf8"
    );
    const hit = format.findArchivedIdentity(archRoot, id);
    assert(hit?.via === "archive-dir", "findArchivedIdentity sees archive dir");
    assert(format.findArchivedIdentity(archRoot, "release-V990101") == null, "unknown identity not archived");
  } finally {
    fs.rmSync(archRoot, { recursive: true, force: true });
  }

  const freezeMod = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-freeze.mjs")).href
  );
  assert(freezeMod.isJobsKey("app.order.timeout.cron") === true, "jobs key cron");
  assert(freezeMod.isJobsKey("app.order.fixed-delay") === true, "jobs key fixedDelay");
  assert(freezeMod.isJobsKey("app.scheduling") === false, "scheduling parent is not a job key");
  assert(freezeMod.isJobsKey("app.scheduling.zone") === false, "timezone is not a job key");
  const yml = freezeMod.flattenYamlKeys(`# prod profile：生产环境连接与开关（首次发版验证素材）
spring:
  datasource:
    url: jdbc:mariadb://prod-db:3306/inventory_order # 生产库
    username: app
    password: secret
# 库存告警阈值
stock-alert:
  threshold: 20
`);
  assert(yml.get("spring.datasource.url")?.comment === "生产库", "leaf keeps own comment");
  assert(yml.get("spring.datasource.username")?.comment === "", "file header does not cross empty parent");
  assert(yml.get("spring.datasource.password")?.comment === "", "password does not inherit file header");
  assert(yml.get("stock-alert.threshold")?.comment === "库存告警阈值", "immediate parent comment still inherits");

  const previewMd = preview.toDraftPreviewMd({
    draft: {
      sql: [],
      config: [
        {
          键: "app.order.unpaid-timeout-minutes",
          值: "30",
          说明: "未支付超时分钟",
          来源: "application-prod.yml",
          confidence: "key-diff",
          source: "application-prod",
          isLeaf: true,
        },
      ],
      jobs: [],
    },
  });
  assert(
    /app\.order\.unpaid-timeout-minutes: 30\s+# 未支付超时分钟/.test(previewMd),
    "draft-md line comment is the description"
  );
  assert(!/30\s+# key-diff/.test(previewMd), "draft-md line comment is not confidence");
  assert(/\| `app\.order\.unpaid-timeout-minutes` \| key-diff \| application-prod \|/.test(previewMd), "confidence is a separate column");

  const sqlSample = merge.buildSqlSection(
    {
      sql: [
        { 脚本: "V1__create_order.sql", 动作: "新增/变更" },
        { 脚本: "V2__seed.sql", 动作: "新增/变更" },
      ],
    },
    new Map([
      ["V1__create_order.sql", "DDL"],
      ["V2__seed.sql", "DML"],
    ])
  );
  assert(/V1__create_order\.sql` \| DDL \|/.test(sqlSample), "sql sample uses classify kind");
  assert(/V2__seed\.sql` \| DML \|/.test(sqlSample), "sql sample DML kind");

  const classifyMod = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-sql-classify.mjs")).href
  );
  const heur = classifyMod.classifyRefs([
    { basename: "V1__create_order.sql", content: "CREATE TABLE t(id INT);\n" },
  ]);
  assert(heur.ok && heur.resolved[0]?.kind === "DDL", "classic flyway create is DDL without ai json");
  assert(heur.needsAi.length === 0, "clear DDL does not need ai");
  const overridden = classifyMod.classifyRefs(
    [{ basename: "V1__create_order.sql", content: "CREATE TABLE t(id INT);\n" }],
    { aiByName: new Map([["V1__create_order.sql", { kind: "DML", confidence: "high" }]]) }
  );
  assert(overridden.resolved[0]?.kind === "DML", "sql-ai-json overrides heuristic");
  assert(overridden.resolved[0]?.classifySource === "ai", "override source is ai");

  const enrichMod = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-freeze-enrich.mjs")).href
  );
  const jobsWork = fs.mkdtempSync(path.join(os.tmpdir(), "re-jobs-"));
  try {
    const out = enrichMod.enrichFreezePayload(
      jobsWork,
      {
        firstRelease: true,
        candidates: [],
        configKeys: [
          {
            key: "app.scheduling",
            path: "application-prod.yml",
            value: "",
            isLeaf: false,
            jobs: true,
            change: "added",
          },
          {
            key: "app.scheduling.zone",
            path: "application-prod.yml",
            value: "Asia/Shanghai",
            isLeaf: true,
            jobs: false,
            change: "added",
          },
          {
            key: "app.order.fixed-delay",
            path: "application-prod.yml",
            value: "60000",
            isLeaf: true,
            jobs: true,
            change: "added",
          },
        ],
        jobKeys: [
          {
            key: "app.scheduling",
            path: "application-prod.yml",
            value: "",
            isLeaf: false,
            jobs: true,
            change: "added",
          },
          {
            key: "app.order.fixed-delay",
            path: "application-prod.yml",
            value: "60000",
            isLeaf: true,
            jobs: true,
            change: "added",
          },
        ],
        taskCodes: ["order-timeout-cancel", "stock:alert-scan"],
      },
      { prior: "none" }
    );
    const codes = (out.draft?.jobs || []).map((j) => j.taskCode || j["task / cron 键"]);
    assert(codes.includes("stock:alert-scan"), "enum without docs enters draft.jobs");
    assert(codes.includes("order-timeout-cancel"), "enum with colon-less code enters draft.jobs");
    assert(!codes.includes("app.scheduling"), "parent scheduling key stays out of draft.jobs");
    assert(
      !(out.draft?.jobs || []).some((j) => String(j["task / cron 键"] || "").endsWith(".zone")),
      "timezone key stays out of draft.jobs"
    );
    const scan = (out.draft?.jobs || []).find((j) => j.taskCode === "stock:alert-scan");
    assert(scan?.说明 === "建议人工确认", "undocumented enum asks for confirmation");
    assert(
      !(out.jobsConfigGaps || []).some((g) => /scheduling|\.zone$/.test(String(g.cronKey || ""))),
      "zone and parent are not cron gaps"
    );
  } finally {
    fs.rmSync(jobsWork, { recursive: true, force: true });
  }
}
