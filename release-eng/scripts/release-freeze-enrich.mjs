/**
 * release-freeze enrichment 编排层（0.4.2+）
 * 实现拆到 lib/freeze/{catalog,prior,change-objects,preview,paths,io}
 * 本文件保留 enrichFreezePayload + draft 私有辅助，并再导出公共 API。
 */
import {
  migrationAliasSet,
  migrationCanonicalId,
  bundleSqlVolumeWarning,
  isProdConfigPath,
} from "./release-format.mjs";
import { DEFAULT_REPO_PROFILE } from "./lib/repo-profile.mjs";
import { readText, normPath, baseName } from "./lib/freeze/io.mjs";
import {
  rankConfidence,
  loadConfigDescriptionCatalog,
  loadJobsCatalog,
  loadSyncTaskCodeMap,
  lookupConfigDescription,
  resolveJobHit,
  jobScheduleSlice,
  extractJobsIntervalKeys,
  parseJobsConfigKeyCell,
  findSyncTaskCodeFiles,
  extractTaskCodesFromJavaDiff,
} from "./lib/freeze/catalog.mjs";
import {
  normalizeBaselinePresence,
  loadArtifactsForNoteFile,
  noteReleaseDate,
  resolvePriorArtifactsBundle,
  resolvePriorReleaseNote,
  parseReleaseNoteArtifacts,
  scanOverdueNotes,
  scanIndexDrift,
} from "./lib/freeze/prior.mjs";
import {
  computeJobsConfigGaps,
  buildChangeObjects,
  buildArtifactsJson,
} from "./lib/freeze/change-objects.mjs";

export { isProdConfigPath };
export {
  rankConfidence,
  loadConfigDescriptionCatalog,
  loadJobsCatalog,
  loadSyncTaskCodeMap,
  lookupConfigDescription,
  resolveJobHit,
  jobScheduleSlice,
  extractJobsIntervalKeys,
  parseJobsConfigKeyCell,
  findSyncTaskCodeFiles,
  extractTaskCodesFromJavaDiff,
};
export {
  loadArtifactsForNoteFile,
  noteReleaseDate,
  resolvePriorArtifactsBundle,
  resolvePriorReleaseNote,
  parseReleaseNoteArtifacts,
  scanOverdueNotes,
  scanIndexDrift,
};
export { computeJobsConfigGaps, buildChangeObjects, buildArtifactsJson };
export {
  toDraftPreviewMd,
  toFreezeSummary,
  toAuditFreezeSummary,
} from "./lib/freeze/preview.mjs";

const CONFIDENCE_ORDER = ["path", "key-diff", "catalog-hit", "docs-hit"];

/**
 * 为 configKeys / jobKeys / taskCodes / candidates 挂说明、jobs 真相、confidence；
 * 双源去重（线上已存在 ∪ 清单已收录）；产出变更对象 + AI 轨 stub。
 *
 * @param {object} [options]
 * @param {string} [options.prior] auto | none | 相对/绝对路径
 * @param {string} [options.priorSince] 仅并入 identity/日期 ≥ 此前缀的 archive（含）
 * @param {{ sqlScripts?: string[], configKeys?: string[], jobIds?: string[] }} [options.baselinePresence]
 */
export function enrichFreezePayload(root, payload, options = {}) {
  const profile = options.profile || DEFAULT_REPO_PROFILE;
  const descCatalog = loadConfigDescriptionCatalog(root, profile.configCatalogFiles);
  const jobsCatalog = loadJobsCatalog(root);
  const syncEnumMap = loadSyncTaskCodeMap(root);
  const priorOpt = options.prior == null ? "auto" : options.prior;
  const priorSince = options.priorSince || null;
  const baselinePresence = normalizeBaselinePresence(options.baselinePresence);

  const configKeys = (payload.configKeys || []).map((row) => {
    const hit = lookupConfigDescription(row.key, descCatalog, row.comment);
    const confidence = rankConfidence(
      "key-diff",
      hit.description && hit.source !== "yml-comment" ? "catalog-hit" : null,
      hit.source === "yml-comment" ? "key-diff" : null
    );
    return {
      ...row,
      description: hit.description,
      descriptionSource: hit.source,
      prodPath: isProdConfigPath(row.path),
      confidence,
    };
  });

  const jobKeys = (payload.jobKeys || []).map((row) => {
    const job = resolveJobHit(row.key, jobsCatalog, syncEnumMap);
    const hit = lookupConfigDescription(row.key, descCatalog, row.comment);
    return {
      ...row,
      description: hit.description || (job ? job.displayName : null),
      descriptionSource: hit.source || (job ? job.truthPath : null),
      job: jobScheduleSlice(job),
      prodPath: isProdConfigPath(row.path),
      confidence: rankConfidence("key-diff", job ? "docs-hit" : null, hit.description ? "catalog-hit" : null),
    };
  });

  const taskCodes = [];
  const seenCodes = new Set();
  for (const raw of payload.taskCodes || []) {
    let code = raw;
    if (syncEnumMap.has(raw) && /^[A-Z][A-Z0-9_]+$/.test(String(raw))) {
      const mapped = syncEnumMap.get(raw);
      if (typeof mapped === "string" && mapped) code = mapped;
    } else if (syncEnumMap.has(raw) && /^[A-Z0-9_]+$/.test(raw) === false) {
      code = raw;
    }
    const job = resolveJobHit(code, jobsCatalog, syncEnumMap) || resolveJobHit(raw, jobsCatalog, syncEnumMap);
    const id = job?.taskCode || code;
    if (seenCodes.has(id)) continue;
    seenCodes.add(id);
    const sliced = jobScheduleSlice(job) || {
      taskCode: code,
      displayName: null,
      truthPath: null,
      cronKey: null,
      cronConfigKey: null,
      defaultCron: null,
      scheduleType: null,
      intervalKeys: [],
    };
    taskCodes.push({
      raw,
      ...sliced,
      taskCode: job?.taskCode || code,
      docsHit: Boolean(job),
      confidence: job ? "docs-hit" : "key-diff",
    });
  }

  const candidates = (payload.candidates || []).map((c) => {
    const next = { ...c };
    let conf = c.confidence || "path";
    if (c.kinds?.includes("jobs") || c.kind === "jobs") {
      const job =
        resolveJobHit(c.path, jobsCatalog, syncEnumMap) ||
        (c.taskCodes && c.taskCodes[0]
          ? resolveJobHit(c.taskCodes[0], jobsCatalog, syncEnumMap)
          : null);
      if (job) {
        next.job = jobScheduleSlice(job);
        conf = rankConfidence(conf, "docs-hit");
      }
    }
    if (c.keys?.length) {
      next.keys = c.keys.map((k) => {
        const hit = lookupConfigDescription(k.key, descCatalog, k.comment);
        const job = k.jobs ? resolveJobHit(k.key, jobsCatalog, syncEnumMap) : null;
        const kConf = rankConfidence(
          "key-diff",
          hit.description && hit.source !== "yml-comment" ? "catalog-hit" : null,
          job ? "docs-hit" : null
        );
        conf = rankConfidence(conf, kConf);
        return {
          ...k,
          description: hit.description || (job ? job.displayName : null),
          descriptionSource: hit.source || (job ? job.truthPath : null),
          job: jobScheduleSlice(job),
          confidence: kConf,
        };
      });
    }
    if (c.kinds?.includes("sql")) conf = rankConfidence(conf, "path");
    next.confidence = conf;
    return next;
  });

  const jobsHitsMap = new Map();
  for (const row of jobKeys) {
    if (row.job?.taskCode) jobsHitsMap.set(row.job.taskCode, { ...row.job, confidence: row.confidence });
  }
  for (const t of taskCodes) {
    if (t.docsHit) {
      jobsHitsMap.set(t.taskCode, {
        ...jobScheduleSlice(t),
        confidence: t.confidence,
      });
    }
  }
  for (const c of candidates) {
    if (c.job?.taskCode) {
      jobsHitsMap.set(c.job.taskCode, { ...c.job, confidence: c.confidence });
    }
  }

  // docs/jobs 路径变更（或首次 inventory.jobsDocPaths）→ 即使无 SyncTaskCode 也进 jobsHits / draft.jobs
  const jobsDocPaths = new Set();
  for (const p of payload.inventory?.jobsDocPaths || []) {
    if (p) jobsDocPaths.add(normPath(p));
  }
  for (const c of candidates) {
    const p = normPath(c.path || "");
    if (p.includes("docs/jobs")) jobsDocPaths.add(p);
  }
  if (jobsDocPaths.size) {
    const seedFromEntry = (entry, confidence = "docs-hit") => {
      if (!entry?.taskCode) return;
      if (jobsHitsMap.has(entry.taskCode)) return;
      jobsHitsMap.set(entry.taskCode, {
        ...jobScheduleSlice(entry),
        confidence,
        docsHit: true,
      });
    };
    for (const p of jobsDocPaths) {
      const hit = resolveJobHit(p, jobsCatalog, syncEnumMap);
      if (hit) seedFromEntry(hit);
    }
    // jobs.md 索引变更：seed 索引内全部 task（无 SyncTaskCode 时仍有 draft.jobs）
    if ([...jobsDocPaths].some((p) => /docs\/jobs\/jobs\.md$/i.test(p))) {
      for (const entry of jobsCatalog.jobs || []) seedFromEntry(entry);
    }
    // 首次发版：有任意 docs/jobs 路径则 seed catalog 全量（分层下 docs 路径常 layerSuppressed）
    if (payload.firstRelease) {
      for (const entry of jobsCatalog.jobs || []) seedFromEntry(entry);
    }
  }

  // —— TODO 占位扫描：prod 配置值中的 TODO_* 须上线前填妥 ——
  const todoPlaceholders = [];
  for (const k of configKeys) {
    const v = String(k.value ?? "");
    if (/TODO[_A-Z0-9]/i.test(v)) {
      todoPlaceholders.push({
        key: k.key,
        path: k.path,
        source: k.source || null,
        value: v,
        description: k.description || null,
      });
    }
  }

  // —— 索引 ↔ 磁盘对账：releases.md 进行中表行指向的 note 须存在 ——
  const indexDrift = scanIndexDrift(root);

  const priorBundle = resolvePriorArtifactsBundle(root, priorOpt, priorSince, profile);
  const priorArtifacts = priorBundle.artifacts;

  const marked = markDualSource(
    { candidates, configKeys, jobKeys, taskCodes },
    priorArtifacts,
    baselinePresence,
    priorBundle
  );

  // hits 同步：仅基线抑制；清单-only 标 priorOnly
  for (const [code, hit] of jobsHitsMap) {
    const listed =
      priorArtifacts.jobIds.has(code) || (hit.cronKey && priorArtifacts.jobIds.has(hit.cronKey));
    const onBaseline =
      baselinePresence.jobIds.has(code) || (hit.cronKey && baselinePresence.jobIds.has(hit.cronKey));
    if (onBaseline) {
      hit.alreadyReleased = true;
      hit.suppressReason = "baseline";
    } else if (listed) {
      hit.priorOnly = true;
      hit.alreadyReleased = false;
    }
  }

  const draftBundle = buildDraftRows({
    candidates: marked.candidates,
    configKeys: marked.configKeys,
    jobKeys: marked.jobKeys,
    jobsHits: [...jobsHitsMap.values()],
  });

  // —— jobs ↔ config：主 gaps 仅本版 draft.jobs；全库 catalog 进 appendix ——
  const configKeySet = new Set();
  for (const k of marked.configKeys) {
    if (k.key && !k.alreadyReleased && !k.layerSuppressed) configKeySet.add(k.key);
  }
  const { jobsConfigGaps, jobsConfigGapsAppendix } = computeJobsConfigGaps({
    draftJobs: draftBundle.active?.jobs || [],
    jobsHitsMap,
    configKeySet,
  });

  const changeObjects = buildChangeObjects({
    candidates: marked.candidates,
    configKeys: marked.configKeys,
    jobKeys: marked.jobKeys,
    taskCodes: marked.taskCodes,
    draft: draftBundle.active,
    suppressed: draftBundle.suppressed,
  });

  const overdueNotes = scanOverdueNotes(root);
  const overdueHard = overdueNotes.filter((n) => n.severity === "hard");

  const warnings = [...(payload.warnings || [])];
  if (priorOpt !== "none" && !priorBundle.notes.length) {
    warnings.push("prior=auto：未找到 docs/releases/archive 发版单（或 prior-since 过滤后为空），跳过清单已收录");
  } else if (priorBundle.notes.length) {
    warnings.push(
      `prior：并集 ${priorBundle.notes.length} 份 archive` +
        (priorSince ? `（since=${priorSince}）` : "") +
        ` sql=${priorArtifacts.sqlScripts.size} configKeys=${priorArtifacts.configKeys.size} jobs=${priorArtifacts.jobIds.size}` +
        (priorBundle.usedArtifactsJson ? "（含 artifacts.json）" : "（md 启发式回退）")
    );
  }
  if (baselinePresence.sqlScripts.size || baselinePresence.configKeys.size || baselinePresence.jobIds.size) {
    warnings.push(
      `baseline：线上已存在 sql=${baselinePresence.sqlScripts.size} config=${baselinePresence.configKeys.size} jobs=${baselinePresence.jobIds.size}`
    );
  }
  for (const n of overdueNotes) {
    warnings.push(
      `逾期未归档[${n.severity}]: ${n.identity} 发版日期=${n.releaseDate} 状态=${n.status} → ${n.path}`
    );
  }
  if (overdueHard.length) {
    warnings.push(
      `逾期硬闸：存在 ${overdueHard.length} 份已定版且发版日期已过的进行中发版单，须先 seal 或书面跳过后再定版`
    );
  }
  if (todoPlaceholders.length) {
    warnings.push(
      `TODO 占位：prod 配置存在 ${todoPlaceholders.length} 个 TODO_* 值，上线前须填妥（${todoPlaceholders
        .slice(0, 5)
        .map((t) => t.key)
        .join(", ")}${todoPlaceholders.length > 5 ? " …" : ""}）`
    );
  }
  if (jobsConfigGaps.length) {
    warnings.push(
      `jobs↔config 交叉（本版 draft）：${jobsConfigGaps.length} 个任务在 prod 配置未找到对应 cron 表达式键（cronExpressionMissing），可能由 Nacos overlay 提供或本次未上线`
    );
  }
  if (jobsConfigGapsAppendix.length) {
    warnings.push(
      `jobs↔config 全库附录：另有 ${jobsConfigGapsAppendix.length} 条 catalog 缺 cron 键（见 jobsConfigGapsAppendix；不写入发版单正文）`
    );
  }
  const sqlVol = bundleSqlVolumeWarning(draftBundle.active?.sql?.length || 0, {
    context: "draft.sql",
  });
  if (sqlVol) warnings.push(sqlVol);
  if (draftBundle.parentKeysSkipped > 0) {
    warnings.push(
      `已忽略 ${draftBundle.parentKeysSkipped} 个 YAML 父级键（不进 draft.config / changeObjects）`
    );
  }
  if (indexDrift.length) {
    warnings.push(
      `索引漂移：releases.md 进行中表有 ${indexDrift.length} 行指向不存在的 note（${indexDrift
        .map((d) => d.identity)
        .slice(0, 3)
        .join(", ")}${indexDrift.length > 3 ? " …" : ""}）`
    );
  }

  const priorReleaseCompat = priorBundle.notes.length
    ? {
        path: priorBundle.notes.map((n) => n.path).join("; "),
        identity: priorBundle.notes[0]?.identity || null,
        sqlScripts: [...priorArtifacts.sqlScripts],
        configKeys: [...priorArtifacts.configKeys],
        jobIds: [...priorArtifacts.jobIds],
        notes: priorBundle.notes,
        usedArtifactsJson: priorBundle.usedArtifactsJson,
      }
    : null;

  return {
    ...payload,
    ok: payload.ok !== false && overdueHard.length === 0,
    overdueHardGate: overdueHard.length > 0,
    warnings,
    candidates: marked.candidates,
    configKeys: marked.configKeys,
    jobKeys: marked.jobKeys,
    taskCodes: marked.taskCodes,
    jobsHits: [...jobsHitsMap.values()],
    draft: draftBundle.active,
    draftSuppressed: draftBundle.suppressed,
    changeObjects,
    priorRelease: priorReleaseCompat,
    priorReleases: priorBundle.notes,
    baselinePresence: {
      sqlScripts: [...baselinePresence.sqlScripts],
      configKeys: [...baselinePresence.configKeys],
      jobIds: [...baselinePresence.jobIds],
    },
    overdueNotes,
    todoPlaceholders,
    jobsConfigGaps,
    jobsConfigGapsAppendix,
    indexDrift,
    aiTrack: {
      status: "stub",
      policy: "dual-track",
      note: "MVP1：AI 轨占位；仪式内模型可写 aiRanked/aiNoise，不得静默删除规则轨 draft",
      aiRanked: [],
      aiNoise: [],
    },
    enrich: {
      configCatalogSize: descCatalog.size,
      jobsCatalogSize: jobsCatalog.jobs.length,
      syncEnumSize: [...syncEnumMap.keys()].filter((k) => /^[A-Z]/.test(k)).length,
      priorMode: priorOpt,
      priorSince: priorSince || null,
      confidenceLevels: CONFIDENCE_ORDER,
    },
  };
}


function isValueLevelChange(change) {
  return change === "changed" || change === "removed";
}

/**
 * 双源标记：
 * - 线上已存在 → alreadyReleased（进 suppressed）
 * - 配置/任务键：基线有键但 change=changed|removed → 仍进 draft（priorKeyHit），勿静默 suppress
 * - 仅清单已收录 → priorOnly，仍留 draft（漏检优先）
 * - layerSuppressed → 首次分层策略 suppress
 */
function sqlListedIn(setOrAlias, bn) {
  if (!bn) return false;
  if (setOrAlias.has(bn)) return true;
  const canon = migrationCanonicalId(bn);
  return setOrAlias.has(canon);
}

/**
 * jobs↔config 交叉：主列表仅本版 draft.jobs；全库 hits 缺键进 appendix。
 * @returns {{ jobsConfigGaps: object[], jobsConfigGapsAppendix: object[] }}
 */

function markDualSource(parts, priorArtifacts, baselinePresence, priorBundle) {
  const priorPath = priorBundle.notes.map((n) => n.path).join("; ") || null;
  const sqlScripts = migrationAliasSet(priorArtifacts.sqlScripts || []);
  const baselineSql = migrationAliasSet(baselinePresence.sqlScripts || []);
  const priorSqlRaw = new Set(
    [...(priorArtifacts.sqlScripts || [])].map((s) => baseName(s))
  );
  const baselineSqlRaw = new Set(
    [...(baselinePresence.sqlScripts || [])].map((s) => baseName(s))
  );
  const configKeysSet = priorArtifacts.configKeys;
  const jobIds = priorArtifacts.jobIds;

  const candidates = parts.candidates.map((c) => {
    if (c.layerSuppressed) {
      const nonProd = /non-prod/i.test(String(c.detail || ""));
      return {
        ...c,
        alreadyReleased: true,
        priorOnly: false,
        suppressReason: nonProd ? "non-prod-layer" : "first-release-layer",
        priorNote: null,
      };
    }
    const bn = baseName(c.path);
    const onBaselineExact =
      (c.kinds?.includes("sql") && baselineSqlRaw.has(bn)) ||
      (c.job?.taskCode && baselinePresence.jobIds.has(c.job.taskCode)) ||
      (c.job?.cronKey && baselinePresence.jobIds.has(c.job.cronKey));
    const onBaselineAlias =
      c.kinds?.includes("sql") && !onBaselineExact && sqlListedIn(baselineSql, bn);
    const onBaseline = onBaselineExact || onBaselineAlias;
    const listedExact =
      (c.kinds?.includes("sql") && priorSqlRaw.has(bn)) ||
      (c.job?.taskCode && jobIds.has(c.job.taskCode)) ||
      (c.job?.cronKey && jobIds.has(c.job.cronKey));
    const listedAlias = c.kinds?.includes("sql") && !listedExact && sqlListedIn(sqlScripts, bn);
    const listed = listedExact || listedAlias;
    if (onBaseline) {
      return {
        ...c,
        alreadyReleased: true,
        priorOnly: false,
        suppressReason: onBaselineAlias ? "rename-alias" : "baseline",
        priorNote: priorPath,
      };
    }
    if (listed) {
      // prior alias 命中且 basename 不同 → 已发版等价 rename，抑制执行序
      if (listedAlias) {
        return {
          ...c,
          alreadyReleased: true,
          priorOnly: false,
          suppressReason: "rename-alias",
          priorNote: priorPath,
        };
      }
      return { ...c, alreadyReleased: false, priorOnly: true, suppressReason: null, priorNote: priorPath };
    }
    return { ...c, alreadyReleased: false, priorOnly: false, suppressReason: null, priorNote: null };
  });

  const configKeys = parts.configKeys.map((k) => {
    if (k.layerSuppressed) {
      return { ...k, alreadyReleased: true, priorOnly: false, suppressReason: "first-release-layer", priorNote: null };
    }
    const onBaseline = baselinePresence.configKeys.has(k.key);
    const listed = configKeysSet.has(k.key);
    if (onBaseline && isValueLevelChange(k.change)) {
      return {
        ...k,
        alreadyReleased: false,
        priorOnly: false,
        priorKeyHit: true,
        suppressReason: null,
        priorNote: priorPath,
      };
    }
    if (onBaseline) {
      return { ...k, alreadyReleased: true, priorOnly: false, suppressReason: "baseline", priorNote: priorPath };
    }
    if (listed) {
      return { ...k, alreadyReleased: false, priorOnly: true, suppressReason: null, priorNote: priorPath };
    }
    return { ...k, alreadyReleased: false, priorOnly: false, suppressReason: null, priorNote: null };
  });

  const jobKeys = parts.jobKeys.map((k) => {
    if (k.layerSuppressed) {
      return { ...k, alreadyReleased: true, priorOnly: false, suppressReason: "first-release-layer", priorNote: null };
    }
    const onBaseline =
      (k.job?.taskCode && baselinePresence.jobIds.has(k.job.taskCode)) ||
      (k.job?.cronKey && baselinePresence.jobIds.has(k.job.cronKey)) ||
      baselinePresence.jobIds.has(k.key) ||
      baselinePresence.configKeys.has(k.key);
    const listed =
      (k.job?.taskCode && jobIds.has(k.job.taskCode)) ||
      (k.job?.cronKey && jobIds.has(k.job.cronKey)) ||
      jobIds.has(k.key) ||
      configKeysSet.has(k.key);
    if (onBaseline && isValueLevelChange(k.change)) {
      return {
        ...k,
        alreadyReleased: false,
        priorOnly: false,
        priorKeyHit: true,
        suppressReason: null,
        priorNote: priorPath,
      };
    }
    if (onBaseline) {
      return { ...k, alreadyReleased: true, priorOnly: false, suppressReason: "baseline", priorNote: priorPath };
    }
    if (listed) {
      return { ...k, alreadyReleased: false, priorOnly: true, suppressReason: null, priorNote: priorPath };
    }
    return { ...k, alreadyReleased: false, priorOnly: false, suppressReason: null, priorNote: null };
  });

  const taskCodes = parts.taskCodes.map((t) => {
    if (t.layerSuppressed) {
      return { ...t, alreadyReleased: true, priorOnly: false, suppressReason: "first-release-layer", priorNote: null };
    }
    const onBaseline = baselinePresence.jobIds.has(t.taskCode) || (t.cronKey && baselinePresence.jobIds.has(t.cronKey));
    const listed = jobIds.has(t.taskCode) || (t.cronKey && jobIds.has(t.cronKey));
    if (onBaseline) {
      return { ...t, alreadyReleased: true, priorOnly: false, suppressReason: "baseline", priorNote: priorPath };
    }
    if (listed) {
      return { ...t, alreadyReleased: false, priorOnly: true, suppressReason: null, priorNote: priorPath };
    }
    return { ...t, alreadyReleased: false, priorOnly: false, suppressReason: null, priorNote: null };
  });

  return { candidates, configKeys, jobKeys, taskCodes };
}

function lookupConfigValue(configKeys, key) {
  if (!key) return null;
  const hit = (configKeys || []).find((k) => k.key === key && k.change !== "removed");
  if (!hit) return null;
  if (hit.value == null || hit.value === "") return null;
  return String(hit.value).replace(/^["']|["']$/g, "");
}

function formatJobParams(job) {
  const parts = [];
  const days = job?.defaultDays;
  const hours = job?.defaultHours;
  if (days != null && String(days).trim() !== "" && String(days).trim() !== "—") {
    parts.push(`days=${String(days).trim()}`);
  }
  if (hours != null && String(hours).trim() !== "" && String(hours).trim() !== "—") {
    parts.push(`hours=${String(hours).trim()}`);
  }
  return parts.length ? parts.join(" · ") : "—";
}

function formatJobCron(job, configKeys) {
  const fromCfg = lookupConfigValue(configKeys, job?.cronKey);
  if (fromCfg) return fromCfg;
  return job?.defaultCron || "—";
}

function formatJobEnable(job, configKeys) {
  const key = job?.enableKey;
  if (!key) return "—";
  const val = lookupConfigValue(configKeys, key);
  if (val == null) return `\`${key}\``;
  return `\`${key}\`=${val}`;
}

function attachJobScheduleFields(row, job, configKeys) {
  const j = job || {};
  return {
    ...row,
    cron: formatJobCron(j, configKeys),
    参数: formatJobParams(j),
    开关: formatJobEnable(j, configKeys),
    名称: j.displayName || row.说明 || "",
    defaultCron: j.defaultCron || null,
    enableKey: j.enableKey || null,
    defaultDays: j.defaultDays ?? null,
    defaultHours: j.defaultHours ?? null,
    scheduleType: j.scheduleType || row.scheduleType || null,
    cronConfigKey: j.cronConfigKey || row.cronConfigKey || null,
    intervalKeys: Array.isArray(j.intervalKeys)
      ? j.intervalKeys
      : Array.isArray(row.intervalKeys)
        ? row.intervalKeys
        : [],
  };
}

function buildDraftRows({ candidates, configKeys, jobKeys, jobsHits }) {
  const sqlAll = candidates
    .filter((c) => c.kinds?.includes("sql"))
    .map((c, i) => ({
      执行序: i + 1,
      脚本: baseName(c.path),
      路径: c.path,
      动作: "新增/变更",
      "目标 profile": "prod",
      confidence: c.confidence || "path",
      alreadyReleased: Boolean(c.alreadyReleased),
      priorOnly: Boolean(c.priorOnly),
      suppressReason: c.suppressReason || null,
      已确认: "",
    }));

  const parentSkipped = (configKeys || []).filter((k) => k.isLeaf === false).length;
  const configAll = configKeys
    .filter((k) => k.isLeaf !== false)
    .map((k) => ({
      来源: k.path,
      键: k.key,
      说明: k.description || "待补",
      值:
        k.change === "removed"
          ? "（删除）"
          : k.change === "changed" && k.from != null && k.from !== ""
            ? `${k.from}→${k.value ?? ""}`
            : k.value ?? "",
      "目标 profile": "prod",
      变更: k.change,
      prodPath: k.prodPath,
      isLeaf: true,
      source: k.source || null,
      confidence: k.confidence || "key-diff",
      alreadyReleased: Boolean(k.alreadyReleased),
      priorOnly: Boolean(k.priorOnly),
      priorKeyHit: Boolean(k.priorKeyHit),
      suppressReason: k.suppressReason || null,
      已确认: "",
    }));

  const jobsFromKeys = jobKeys.map((k) => {
    const cronKey = k.job?.cronKey || k.key;
    const taskCode = k.job?.taskCode || "";
    const keyTail = String(cronKey || "")
      .split(".")
      .filter(Boolean)
      .pop();
    return attachJobScheduleFields(
      {
        "task / cron 键": cronKey,
        taskCode,
        变更类型: k.change === "added" ? "新建/改 Cron" : k.change === "removed" ? "开关/删除" : "改 Cron",
        说明: k.job?.displayName || k.description || keyTail || "",
        真相: k.job?.truthPath || "",
        "目标 profile": "prod",
        confidence: k.confidence || "key-diff",
        alreadyReleased: Boolean(k.alreadyReleased),
        priorOnly: Boolean(k.priorOnly),
        suppressReason: k.suppressReason || null,
        已确认: "",
      },
      k.job,
      configKeys
    );
  });

  const jobsFromHits = jobsHits
    .filter((h) => !jobsFromKeys.some((j) => j.taskCode && j.taskCode === h.taskCode))
    .map((h) =>
      attachJobScheduleFields(
        {
          "task / cron 键": h.cronKey || h.taskCode,
          taskCode: h.taskCode,
          变更类型: "涉及（见候选）",
          说明: h.displayName || "",
          真相: h.truthPath || "",
          "目标 profile": "prod",
          confidence: h.confidence || "docs-hit",
          alreadyReleased: Boolean(h.alreadyReleased),
          priorOnly: Boolean(h.priorOnly),
          suppressReason: h.suppressReason || null,
          已确认: "",
        },
        h,
        configKeys
      )
    );

  const jobsAll = [...jobsFromKeys, ...jobsFromHits];

  const split = (rows) => ({
    active: rows.filter((r) => !r.alreadyReleased).map((r, i) => (r.执行序 != null ? { ...r, 执行序: i + 1 } : r)),
    suppressed: rows.filter((r) => r.alreadyReleased),
  });

  const sql = split(sqlAll);
  const config = split(configAll);
  config.active.sort((a, b) => Number(b.prodPath) - Number(a.prodPath));
  const jobs = split(jobsAll);

  return {
    active: { sql: sql.active, config: config.active, jobs: jobs.active },
    suppressed: { sql: sql.suppressed, config: config.suppressed, jobs: jobs.suppressed },
    parentKeysSkipped: parentSkipped,
  };
}

/** 变更对象列表（规则轨） */

