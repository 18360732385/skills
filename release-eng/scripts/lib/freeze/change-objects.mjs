/**
 * draft 变更对象 / artifacts.json / jobs↔config 缺口
 */
import { baseName } from "./io.mjs";
import { JOBS_FIXED_DELAY_RE } from "./catalog.mjs";

export function computeJobsConfigGaps({ draftJobs = [], jobsHitsMap, configKeySet }) {
  const gaps = [];
  const appendix = [];
  const primarySeen = new Set();
  const appendixSeen = new Set();
  const keySet = configKeySet instanceof Set ? configKeySet : new Set(configKeySet || []);

  const intervalCompanionCovers = (cronKey, keys, hit) => {
    if (Array.isArray(hit?.intervalKeys)) {
      for (const ik of hit.intervalKeys) {
        if (ik && keys.has(ik)) return true;
      }
    }
    const slug = hit?.cronConfigKey ? String(hit.cronConfigKey).trim() : "";
    if (slug) {
      for (const k of keys) {
        const s = String(k);
        if (s.includes(slug) && /interval|fixed[-]?delay|delay-ms/i.test(s)) return true;
      }
    }
    const ck = String(cronKey || "");
    if (!ck) return false;
    const prefix = ck
      .replace(/\.cron(expression)?$/i, "")
      .replace(/cron$/i, "")
      .replace(/\.$/, "");
    if (!prefix) return false;
    for (const k of keys) {
      const s = String(k);
      if (s.startsWith(prefix) && /interval|fixed[-]?delay|delay-ms/i.test(s)) return true;
    }
    return false;
  };

  const lookFixedDelayTruth = (hit) => {
    if (String(hit?.scheduleType || "").toLowerCase() === "fixeddelay") return true;
    const blob = [
      hit?.hint,
      hit?.displayName,
      hit?.truthPath,
      hit?.scheduleType,
      hit?.schedule,
      hit?.defaultCron,
    ]
      .filter(Boolean)
      .join(" ");
    return JOBS_FIXED_DELAY_RE.test(blob);
  };

  const pushGap = (list, seen, hit) => {
    const cronKey = hit.cronKey || null;
    if (!cronKey) return;
    const id = hit.taskCode || cronKey;
    if (seen.has(id)) return;
    if (keySet.has(cronKey)) return;
    if (intervalCompanionCovers(cronKey, keySet, hit)) return;
    if (lookFixedDelayTruth(hit)) return;
    seen.add(id);
    list.push({
      taskCode: hit.taskCode || null,
      cronKey,
      truthPath: hit.truthPath || null,
      displayName: hit.displayName || null,
      reason: "cronExpressionMissing",
      hint: "cron 表达式可能由 Nacos overlay 提供，或本次未随 prod yml 上线",
    });
  };

  for (const row of draftJobs) {
    const taskCode = row.taskCode || null;
    const cronKey =
      row.cronKey ||
      (taskCode && jobsHitsMap?.get?.(taskCode)?.cronKey) ||
      (typeof row["task / cron 键"] === "string" && !String(row["task / cron 键"]).includes(":")
        ? row["task / cron 键"]
        : null) ||
      null;
    const hit =
      (taskCode && jobsHitsMap?.get?.(taskCode)) ||
      {
        taskCode,
        cronKey,
        truthPath: row.真相 || row.truthPath || null,
        displayName: row.说明 || row.displayName || null,
        scheduleType: row.scheduleType || null,
        cronConfigKey: row.cronConfigKey || null,
        intervalKeys: row.intervalKeys || [],
        defaultCron: row.defaultCron || null,
      };
    pushGap(gaps, primarySeen, {
      ...hit,
      cronKey: cronKey || hit.cronKey || null,
      taskCode: taskCode || hit.taskCode || null,
      scheduleType: hit.scheduleType || row.scheduleType || null,
      cronConfigKey: hit.cronConfigKey || row.cronConfigKey || null,
      intervalKeys:
        (hit.intervalKeys && hit.intervalKeys.length ? hit.intervalKeys : null) ||
        row.intervalKeys ||
        [],
      defaultCron: hit.defaultCron || row.defaultCron || null,
    });
  }

  for (const hit of jobsHitsMap?.values?.() || []) {
    const id = hit.taskCode || hit.cronKey;
    if (!id || primarySeen.has(id)) continue;
    if (hit.alreadyReleased) continue;
    pushGap(appendix, appendixSeen, hit);
  }

  return { jobsConfigGaps: gaps, jobsConfigGapsAppendix: appendix };
}


export function buildChangeObjects({ candidates, configKeys, jobKeys, taskCodes, draft, suppressed }) {
  const out = [];
  const seen = new Set();
  const push = (obj) => {
    const k = `${obj.kind}:${obj.stableId}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(obj);
  };

  for (const c of candidates || []) {
    if (c.kinds?.includes("sql")) {
      push({
        kind: "sql",
        stableId: baseName(c.path),
        path: c.path,
        confidence: c.confidence || "path",
        sources: ["path", ...(c.priorOnly ? ["prior-note"] : []), ...(c.suppressReason === "baseline" ? ["baseline-tree"] : [])],
        alreadyReleased: Boolean(c.alreadyReleased),
        priorOnly: Boolean(c.priorOnly),
        suppressReason: c.suppressReason || null,
        inDraft: !(c.alreadyReleased),
      });
    }
  }
  for (const k of configKeys || []) {
    if (k.isLeaf === false) continue;
    push({
      kind: "config",
      stableId: k.key,
      path: k.path,
      confidence: k.confidence || "key-diff",
      sources: ["key-diff", ...(k.priorOnly ? ["prior-note"] : []), ...(k.suppressReason === "baseline" ? ["baseline-tree"] : [])],
      alreadyReleased: Boolean(k.alreadyReleased),
      priorOnly: Boolean(k.priorOnly),
      suppressReason: k.suppressReason || null,
      inDraft: !k.alreadyReleased,
      value: k.value,
    });
  }
  for (const k of jobKeys || []) {
    const id = k.job?.taskCode || k.job?.cronKey || k.key;
    push({
      kind: "jobs",
      stableId: id,
      path: k.path,
      confidence: k.confidence || "key-diff",
      sources: ["key-diff", ...(k.job ? ["jobs-doc"] : []), ...(k.priorOnly ? ["prior-note"] : []), ...(k.suppressReason === "baseline" ? ["baseline-tree"] : [])],
      alreadyReleased: Boolean(k.alreadyReleased),
      priorOnly: Boolean(k.priorOnly),
      suppressReason: k.suppressReason || null,
      inDraft: !k.alreadyReleased,
      taskCode: k.job?.taskCode || null,
      cronKey: k.job?.cronKey || k.key,
    });
  }
  for (const t of taskCodes || []) {
    push({
      kind: "jobs",
      stableId: t.taskCode,
      path: t.truthPath || null,
      confidence: t.confidence || "key-diff",
      sources: [t.docsHit ? "jobs-doc" : "java-diff", ...(t.priorOnly ? ["prior-note"] : []), ...(t.suppressReason === "baseline" ? ["baseline-tree"] : [])],
      alreadyReleased: Boolean(t.alreadyReleased),
      priorOnly: Boolean(t.priorOnly),
      suppressReason: t.suppressReason || null,
      inDraft: !t.alreadyReleased,
      taskCode: t.taskCode,
      cronKey: t.cronKey || null,
    });
  }
  // 保证 draft/suppressed 行也有对象（兜底）
  for (const r of draft?.sql || []) {
    push({
      kind: "sql",
      stableId: r.脚本,
      path: r.路径,
      confidence: r.confidence || "path",
      sources: ["draft"],
      alreadyReleased: false,
      priorOnly: Boolean(r.priorOnly),
      inDraft: true,
    });
  }
  void suppressed;
  return out;
}


/** 目录包 artifacts.json SSOT（允许含密文值；不做密文拦截） */
export function buildArtifactsJson(identity, freeze) {
  const draft = freeze.draft || { sql: [], config: [], jobs: [] };
  return {
    identity,
    version: 1,
    generatedAt: new Date().toISOString(),
    sql: (draft.sql || []).map((r) => ({
      stableId: r.脚本,
      path: r.路径,
      action: r.动作,
      profile: r["目标 profile"] || "prod",
      confidence: r.confidence,
      priorOnly: Boolean(r.priorOnly),
    })),
    config: (draft.config || []).map((r) => ({
      stableId: r.键,
      path: r.来源,
      description: r.说明,
      value: r.值,
      profile: r["目标 profile"] || "prod",
      change: r.变更,
      confidence: r.confidence,
      priorOnly: Boolean(r.priorOnly),
    })),
    jobs: (draft.jobs || []).map((r) => ({
      stableId: r.taskCode || r["task / cron 键"],
      taskCode: r.taskCode || null,
      cronKey: r["task / cron 键"],
      cron: r.cron || null,
      params: r.参数 || r.params || null,
      enable: r.开关 || r.enable || null,
      change: r.变更类型,
      description: r.说明,
      truthPath: r.真相,
      profile: r["目标 profile"] || "prod",
      confidence: r.confidence,
      priorOnly: Boolean(r.priorOnly),
    })),
    changeObjects: freeze.changeObjects || [],
    aiTrack: freeze.aiTrack || { status: "stub", aiRanked: [], aiNoise: [] },
    /** 由 note-merge / sql-bundle 写入；enrich 默认空数组 */
    sqlBundles: freeze.sqlBundles || [],
  };
}


