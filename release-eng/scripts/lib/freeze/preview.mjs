/**
 * freeze 预览渲染（从 release-freeze-enrich 抽出）
 */
const DRAFT_PREVIEW_MAX = 15;
/** draft-md 配置项预览：全部叶子键合计超此行数则截断（O4；「说明待补」计数仍按全量） */
const CONFIG_PREVIEW_MAX = 80;

function escCell(v) {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function takeRows(rows, max) {
  if (!rows?.length) return { rows: [], omitted: 0 };
  if (rows.length <= max) return { rows, omitted: 0 };
  return { rows: rows.slice(0, max), omitted: rows.length - max };
}

/**
 * WritePlan / audit 用：把 draft（+ suppressed 摘要）渲成 Markdown 表。
 * 每表最多 DRAFT_PREVIEW_MAX 行，超出注明省略。
 */
export function toDraftPreviewMd(data) {
  const lines = [];
  const draft = data.draft || { sql: [], config: [], jobs: [] };
  const suppressed = data.draftSuppressed || { sql: [], config: [], jobs: [] };
  const prior = data.priorRelease;

  lines.push("# WritePlan · draft 预览");
  lines.push("");
  lines.push(`- range: \`${data.range || ""}\``);
  lines.push(`- prior: ${prior?.path ? `\`${prior.path}\`` : "（无 / none）"}`);
  lines.push(
    `- draft: sql=${draft.sql?.length || 0} · config=${draft.config?.length || 0} · jobs=${draft.jobs?.length || 0}`
  );
  lines.push(
    `- suppressed: sql=${suppressed.sql?.length || 0} · config=${suppressed.config?.length || 0} · jobs=${suppressed.jobs?.length || 0}`
  );
  lines.push(`- changeObjects: ${data.changeObjects?.length || 0}`);
  lines.push(`- aiTrack: ${data.aiTrack?.status || "n/a"}`);
  if (data.todoPlaceholders?.length) {
    lines.push(`- **TODO 占位（上线前必填）: ${data.todoPlaceholders.length}**`);
  }
  if (data.jobsConfigGaps?.length) {
    lines.push(`- jobs↔config 交叉: ${data.jobsConfigGaps.length} 个任务缺 cron 表达式键`);
  }
  if (data.indexDrift?.length) {
    lines.push(`- **索引漂移: ${data.indexDrift.length} 行指向不存在的 note**`);
  }
  if (data.aiTrack?.aiNoise?.length) {
    lines.push(`- aiNoise（建议默认不勾）: ${data.aiTrack.aiNoise.length}`);
  }
  if (data.overdueHardGate) lines.push("- **逾期硬闸**: 是（须先 seal 逾期已定版单）");
  lines.push("- 目标 profile: `prod`（下列将写入发版单对应章；suppressed 默认不落单）");
  lines.push("");

  // SQL
  lines.push("## 数据库与 SQL（← draft.sql）");
  lines.push("| 执行序 | 脚本/版本 | 动作 | 目标 profile | confidence |");
  lines.push("|---|---|---|---|---|");
  {
    const { rows, omitted } = takeRows(draft.sql || [], DRAFT_PREVIEW_MAX);
    if (!rows.length) lines.push("| — | （无） | — | prod | — |");
    for (const r of rows) {
      lines.push(
        `| ${r.执行序 ?? ""} | ${escCell(r.脚本)} | ${escCell(r.动作)} | prod | ${escCell(r.confidence)} |`
      );
    }
    if (omitted) lines.push(`| … | （另有 ${omitted} 条未展示） | — | — | — |`);
  }
  lines.push("");

  // Config：yml 预览（叶子键展示前 CONFIG_PREVIEW_MAX 行，父级键不计；完整键值见 freeze --out JSON / 落单）
  lines.push("## 配置项（← draft.config · yml 格式）");
  {
    const allRows = (draft.config || []).filter((r) => r.isLeaf !== false);
    if (!allRows.length) {
      lines.push("（无）");
    } else {
      // 轻量：按来源分组展示点分键=值（完整 YAML 见 note-merge 落单）
      const bySrc = new Map();
      for (const r of allRows) {
        const src = r.来源 || "unknown";
        if (!bySrc.has(src)) bySrc.set(src, []);
        bySrc.get(src).push(r);
      }
      const totalKeys = allRows.length;
      const shownMax = Math.min(totalKeys, CONFIG_PREVIEW_MAX);
      let shown = 0;
      for (const [src, list] of bySrc) {
        if (shown >= shownMax) break;
        const slice = list.slice(0, shownMax - shown);
        shown += slice.length;
        lines.push(`#### ${src}`);
        if (/\.ya?ml$/i.test(src)) {
          lines.push("```yaml");
          for (const r of slice) {
            const v = r.值 === "" || r.值 == null ? '""' : String(r.值);
            // 行尾注释透明化推荐来源：confidence · 采集源（问卷预填时须能追溯）
            const tag = [r.confidence, r.source].filter(Boolean).join(" · ");
            lines.push(`${r.键}: ${v}${tag ? `  # ${tag}` : ""}`);
          }
          lines.push("```");
        } else {
          for (const r of slice) {
            const tag = [r.confidence, r.source].filter(Boolean).join(" · ");
            lines.push(`- \`${r.键}\` = ${escCell(r.值)} （${escCell(r.说明 || "待补")}）${tag ? ` — ${tag}` : ""}`);
          }
        }
        lines.push("");
      }
      if (totalKeys > shownMax) {
        lines.push(`> 另有 ${totalKeys - shownMax} 条未展示（完整键值见 freeze --out JSON / 落单）`);
        lines.push("");
      }
    }
  }
  const pendingDesc = (draft.config || []).filter(
    (r) => r.isLeaf !== false && (!r.说明 || r.说明 === "待补")
  ).length;
  if (pendingDesc) lines.push(`> 说明待补（仅叶子键）: **${pendingDesc}** 条（写盘前问卷应补齐或标待定）`);
  lines.push("");

  // Jobs
  lines.push("## 定时任务（← draft.jobs）");
  lines.push("| task_code | 名称 | cron | 参数 | 开关 |");
  lines.push("|---|---|---|---|---|");
  {
    const { rows, omitted } = takeRows(draft.jobs || [], DRAFT_PREVIEW_MAX);
    if (!rows.length) lines.push("| （无） | — | — | — | — |");
    for (const r of rows) {
      const codeCol =
        r.taskCode ||
        (r["task / cron 键"] ? `\`${r["task / cron 键"]}\`` : "") ||
        "—";
      const nameCol =
        r.名称 ||
        r.说明 ||
        (r["task / cron 键"]
          ? String(r["task / cron 键"])
              .split(".")
              .filter(Boolean)
              .pop()
          : "") ||
        "—";
      lines.push(
        `| ${escCell(codeCol)} | ${escCell(nameCol)} | ${escCell(r.cron)} | ${escCell(r.参数)} | ${escCell(r.开关)} |`
      );
    }
    if (omitted) lines.push(`| … | （另有 ${omitted} 条未展示） | — | — | — |`);
  }
  lines.push("");

  // Suppressed summary
  const supN =
    (suppressed.sql?.length || 0) + (suppressed.config?.length || 0) + (suppressed.jobs?.length || 0);
  lines.push("## draftSuppressed 摘要（prior 已上线 · 默认不落单）");
  if (!supN) {
    lines.push("- （无）");
  } else {
    lines.push(
      `- sql=${suppressed.sql?.length || 0} · config=${suppressed.config?.length || 0} · jobs=${suppressed.jobs?.length || 0}`
    );
    const sampleSql = (suppressed.sql || []).slice(0, 5).map((r) => r.脚本);
    const sampleJobs = (suppressed.jobs || []).slice(0, 5).map((r) => r.taskCode || r["task / cron 键"]);
    if (sampleSql.length) lines.push(`- SQL 例: ${sampleSql.join(", ")}`);
    if (sampleJobs.length) lines.push(`- jobs 例: ${sampleJobs.join(", ")}`);
  }
  lines.push("");
  lines.push("> 确认后按上表写入发版单对应章；完整键值以 freeze JSON / 问卷答复为准。");
  return lines.join("\n");
}

/**
 * 中等粒度摘要（--format summary）：WritePlan 白话摘要主输入，一屏可读。
 */
export function toFreezeSummary(data) {
  const draft = data.draft || {};
  const sup = data.draftSuppressed || {};
  const lines = [];
  lines.push("# freeze · summary");
  lines.push("");
  lines.push(`- range: \`${data.range || ""}\``);
  lines.push(`- candidatePolicy: \`${data.candidatePolicy || ""}\``);
  lines.push(`- firstRelease: ${data.firstRelease ? "true" : "false"}`);
  lines.push(`- prior: ${data.priorRelease?.path ? `\`${data.priorRelease.path}\`` : "（无）"}`);
  lines.push(
    `- draft: sql=${draft.sql?.length || 0} · config=${draft.config?.length || 0} · jobs=${draft.jobs?.length || 0}`
  );
  lines.push(
    `- suppressed: sql=${sup.sql?.length || 0} · config=${sup.config?.length || 0} · jobs=${sup.jobs?.length || 0}`
  );
  lines.push(`- changeObjects: ${data.changeObjects?.length || 0}`);
  lines.push(`- commits: ${data.commits?.length || 0} · mergeSources: ${data.mergeSources?.length || 0}`);
  lines.push(`- aiTrack: ${data.aiTrack?.status || "n/a"}`);
  lines.push(`- 目标 profile: prod`);
  // 预填来源透明化：draft 行按 confidence / source 分布，问卷预填可追溯
  const confHist = {};
  for (const r of [...(draft.sql || []), ...(draft.config || []), ...(draft.jobs || [])]) {
    const c = r.confidence || "n/a";
    confHist[c] = (confHist[c] || 0) + 1;
  }
  const srcHist = {};
  for (const r of draft.config || []) {
    const s = r.source || "n/a";
    srcHist[s] = (srcHist[s] || 0) + 1;
  }
  lines.push(
    `- 推荐来源: confidence ${Object.entries(confHist).map(([k, v]) => `${k}=${v}`).join(" · ") || "—"}`
  );
  if (Object.keys(srcHist).length) {
    lines.push(`- 配置采集源: ${Object.entries(srcHist).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  }
  lines.push("");
  lines.push("## 校验信号");
  lines.push(`- TODO 占位（上线前必填）: ${data.todoPlaceholders?.length || 0}`);
  lines.push(`- jobs↔config 交叉（缺 cron 键）: ${data.jobsConfigGaps?.length || 0}`);
  lines.push(`- 索引漂移: ${data.indexDrift?.length || 0}`);
  lines.push(`- 逾期硬闸: ${data.overdueHardGate ? "是" : "否"}`);
  lines.push(`- 说明待补（仅叶子键）: ${(data.configKeys || []).filter((k) => k.isLeaf !== false && !k.description).length}`);
  lines.push("");
  if (data.todoPlaceholders?.length) {
    lines.push("## TODO 占位");
    for (const t of data.todoPlaceholders.slice(0, 10)) lines.push(`- \`${t.key}\` = \`${t.value}\`（${t.path}）`);
    if (data.todoPlaceholders.length > 10) lines.push(`- … 另有 ${data.todoPlaceholders.length - 10} 条`);
    lines.push("");
  }
  if (data.jobsConfigGaps?.length) {
    lines.push("## jobs↔config 缺口");
    for (const g of data.jobsConfigGaps.slice(0, 10)) lines.push(`- ${g.taskCode || "—"} · \`${g.cronKey}\`（${g.truthPath || "—"}）`);
    if (data.jobsConfigGaps.length > 10) lines.push(`- … 另有 ${data.jobsConfigGaps.length - 10} 条`);
    lines.push("");
  }
  if (data.warnings?.length) {
    lines.push("## warnings");
    for (const w of data.warnings) lines.push(`- ${w}`);
  }
  return lines.join("\n");
}

/**
 * audit 用短摘要（非全文表）
 */
export function toAuditFreezeSummary(data) {
  const draft = data.draft || {};
  const sup = data.draftSuppressed || {};
  const conf = {};
  for (const k of data.configKeys || []) {
    conf[k.confidence || "path"] = (conf[k.confidence || "path"] || 0) + 1;
  }
  for (const k of data.jobKeys || []) {
    conf[k.confidence || "path"] = (conf[k.confidence || "path"] || 0) + 1;
  }
  const pendingDesc = (data.configKeys || []).filter(
    (k) => k.isLeaf !== false && !k.description
  ).length;
  return {
    range: data.range,
    candidatePolicy: data.candidatePolicy,
    priorPath: data.priorRelease?.path || null,
    priorNotes: data.priorReleases?.length || 0,
    changeObjects: data.changeObjects?.length || 0,
    overdueHardGate: Boolean(data.overdueHardGate),
    overdueNotes: data.overdueNotes || [],
    aiTrack: data.aiTrack?.status || null,
    draft: {
      sql: draft.sql?.length || 0,
      config: draft.config?.length || 0,
      jobs: draft.jobs?.length || 0,
    },
    suppressed: {
      sql: sup.sql?.length || 0,
      config: sup.config?.length || 0,
      jobs: sup.jobs?.length || 0,
    },
    confidenceHistogram: conf,
    configMissingDescription: pendingDesc,
    jobsHits: data.jobsHits?.length || 0,
    todoPlaceholders: data.todoPlaceholders?.length || 0,
    jobsConfigGaps: data.jobsConfigGaps?.length || 0,
    indexDrift: data.indexDrift?.length || 0,
    inventory: data.inventory
      ? {
          migrationRange: data.inventory.migrationRange,
          migrationCount: data.inventory.migrationCount,
          prodConfigKeyCount: data.inventory.prodConfigKeyCount,
          nacosOverlayKeyCount: data.inventory.nacosOverlayKeyCount,
          syncTaskCodeCount: data.inventory.syncTaskCodeCount,
          layerEmpty: data.inventory.layerEmpty,
        }
      : null,
    warnings: data.warnings || [],
  };
}
