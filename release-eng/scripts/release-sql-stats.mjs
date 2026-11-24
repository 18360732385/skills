#!/usr/bin/env node
/**
 * release-sql-stats — 生成本版 SQL 统计 Markdown（`sql/README.md`）
 *
 * 纯函数：输入整理文件（release-V{yyMMdd}-DDL|DML.sql）的执行序与源元数据，
 * 输出 Markdown 文本；不读写磁盘（由 release-sql-bundle.mjs 落盘）。
 *
 * 统计口径：
 * - 文件数 = 源 SQL 个数；语句数 = 去注释/字符串后以 `;` 切分的非空段（由调用方计好传入）。
 * - 提交人 = 该源文件最后一次 Git 改动的作者；取不到则「未识别」。
 * - 执行顺序与整理文件一致：先 DDL，再 DML；各类内部按 SQL序。
 * - SQL 文件名链接到对应整理文件的起始行 `#L<行号>`（GitHub/编辑器通用锚点）。
 */

function escCell(v) {
  return String(v == null ? "" : v)
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function positionCell(entry) {
  if (!entry || !entry.lineNo) return "—";
  return `${entry.kind} 第 ${entry.lineNo} 行`;
}

function entryHref(entry) {
  const anchor = entry.lineNo ? `#L${entry.lineNo}` : "";
  return `./${entry.fileName}${anchor}`;
}

/**
 * @param {object} opts
 * @param {string} [opts.releaseDate] YYYY-MM-DD
 * @param {string} [opts.identity] 发版身份（目录名）；缺省用 releaseDate
 * @param {string|null} [opts.datasourceUrl] 已脱敏 JDBC URL（仅展示，不含账号密码）
 * @param {string|null} [opts.dbName] 生产库名（写入总览与整理文件名前缀）
 * @param {{kind: "DDL"|"DML", fileName: string, sources: Array}[]} [opts.bundles]
 *   sources: { basename, order, globalOrder, author, srcPath, lineNo, statements }
 * @returns {string}
 */
export function buildSqlStatsMarkdown({
  releaseDate = "",
  identity = "",
  bundles = [],
  datasourceUrl = null,
  dbName = null,
} = {}) {
  const label = identity || (releaseDate ? `release-${releaseDate}` : "本版");
  const lines = [];
  lines.push(`# 本版 SQL 统计（${label}）`);
  lines.push("");
  lines.push("> 自动生成，勿手改：`release-note-merge` 刷新会先清空并重建 `sql/`。");
  lines.push(
    "> 执行顺序：**先执行 DDL 整理文件，再执行 DML 整理文件**；各类内部按 migration 版本号（`SQL序`）升序。"
  );
  lines.push(
    "> 文件名即链接：点击跳到对应整理文件的起始行（`#L<行号>`）；提交人取该文件最后一次 Git 改动的作者。"
  );
  if (releaseDate) lines.push(`> 发版日期：${releaseDate}`);
  lines.push("");

  const byKind = new Map();
  for (const b of bundles || []) byKind.set(b.kind, b);

  // 一、总览
  lines.push("## 一、总览");
  lines.push("");
  const dbLabel = dbName ? `\`${dbName}\`` : "（待填：执行库）";
  const urlLabel = datasourceUrl
    ? `\`${datasourceUrl}\``
    : "（待填：从 prod `spring.datasource.url` 抽取）";
  lines.push(`- **执行库**：${dbLabel}`);
  lines.push(`- **连接串**：${urlLabel}`);
  lines.push("- 说明：连接串已脱敏（无账号密码）；整理文件名带 `[库名]-V{yyMMdd}-*` 前缀（抽不到库名时回落 `release-V*`）。");
  lines.push("");
  lines.push("| 类别 | 文件数 | 语句数 | 整理文件 |");
  lines.push("|---|---|---|---|");
  let totalFiles = 0;
  let totalStatements = 0;
  let anySource = false;
  for (const kind of ["DDL", "DML"]) {
    const b = byKind.get(kind);
    const sources = b?.sources || [];
    const files = sources.length;
    const statements = sources.reduce(
      (n, s) => n + (Number(s.statements) || 0),
      0
    );
    totalFiles += files;
    totalStatements += statements;
    if (files) anySource = true;
    const cell = files ? `[${b.fileName}](./${b.fileName})` : "—";
    lines.push(`| ${kind} | ${files} | ${statements} | ${cell} |`);
  }
  lines.push(`| **合计** | **${totalFiles}** | **${totalStatements}** | — |`);
  lines.push("");

  if (!anySource) {
    lines.push("本版无 SQL（未生成 DDL/DML 整理文件）。");
    lines.push("");
    return lines.join("\n");
  }

  const entries = [];
  for (const b of bundles || []) {
    for (const s of b.sources || []) {
      entries.push({ ...s, kind: b.kind, fileName: b.fileName });
    }
  }
  entries.sort(
    (a, b) => (a.globalOrder ?? 0) - (b.globalOrder ?? 0) || a.basename.localeCompare(b.basename)
  );

  // 二、按提交人
  lines.push("## 二、按提交人");
  lines.push("");
  const groups = new Map();
  for (const e of entries) {
    const key = e.author || "未识别";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const authorKeys = [...groups.keys()].sort((a, b) => {
    const fa = groups.get(a)[0]?.globalOrder ?? 0;
    const fb = groups.get(b)[0]?.globalOrder ?? 0;
    if (fa !== fb) return fa - fb;
    return a.localeCompare(b);
  });
  for (const key of authorKeys) {
    const list = groups
      .get(key)
      .slice()
      .sort((a, b) => (a.globalOrder ?? 0) - (b.globalOrder ?? 0));
    lines.push(`### ${key}（${list.length} 个文件）`);
    lines.push("");
    lines.push("| 类别 | 类别内序 | 全局序 | SQL 文件 | 整理文件位置 |");
    lines.push("|---|---|---|---|---|");
    for (const e of list) {
      lines.push(
        `| ${e.kind} | ${e.order ?? "—"} | ${e.globalOrder ?? "—"} | ` +
          `[${escCell(e.basename)}](${entryHref(e)}) | ${positionCell(e)} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export const SQL_STATS_BASENAME = "README.md";
