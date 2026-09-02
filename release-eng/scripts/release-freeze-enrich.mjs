/**
 * release-freeze enrichment — 变更对象 / 双源去重 / artifacts.json prior /
 * docs/jobs 交叉 + 配置说明 + draft + confidence + 逾期未归档 + AI 轨 stub
 * 由 release-freeze.mjs import；无外部依赖。
 */
import fs from "fs";
import path from "path";

const CONFIDENCE_ORDER = ["path", "key-diff", "catalog-hit", "docs-hit"];

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function normPath(p) {
  return String(p || "").replace(/\\/g, "/");
}

function baseName(p) {
  const n = normPath(p);
  return n.split("/").pop() || n;
}

export function rankConfidence(...levels) {
  let best = "path";
  let bestIdx = 0;
  for (const l of levels) {
    if (!l) continue;
    const idx = CONFIDENCE_ORDER.indexOf(l);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = l;
    }
  }
  return best;
}

/** 从 README / AGENTS 表格抽取 `key` → 说明 */
export function loadConfigDescriptionCatalog(root) {
  const map = new Map();
  const files = [
    path.join(root, "sms-ai", "README.md"),
    path.join(root, "sms-ai", "AGENTS.md"),
    path.join(root, "AGENTS.md"),
  ];
  for (const f of files) {
    const text = readText(f);
    if (!text) continue;
    const rel = normPath(path.relative(root, f));
    for (const line of text.split(/\r?\n/)) {
      // | `key.path` | default | 说明 |
      // | `key.path` | ENV | 说明 |
      const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]*)\|\s*([^|]*)\|/);
      if (!m) continue;
      const key = m[1].trim();
      if (!key.includes(".") && !key.includes("-")) continue;
      let desc = (m[3] || "").trim();
      // 三列时说明在第3；若第2已是长中文且第3空，用第2
      if (!desc || desc === "—" || desc === "-") {
        const mid = (m[2] || "").trim();
        if (/[\u4e00-\u9fff]/.test(mid)) desc = mid;
      }
      desc = desc.replace(/\*\*/g, "").trim();
      if (!desc || desc === "—" || desc === "-") continue;
      if (!map.has(key)) {
        map.set(key, { description: desc, source: rel });
      }
    }
  }
  return map;
}

/** 解析 SyncTaskCode.java：ENUM → task_code 字符串 */
export function loadSyncTaskCodeMap(root) {
  const file = path.join(
    root,
    "sms-ai",
    "src",
    "main",
    "java",
    "com",
    "juneyaoair",
    "msp",
    "sms",
    "ai",
    "domain",
    "enums",
    "sync",
    "SyncTaskCode.java"
  );
  const text = readText(file);
  const map = new Map(); // ENUM_NAME -> task_code, also task_code -> ENUM
  if (!text) return map;
  const re = /([A-Z][A-Z0-9_]+)\s*\(\s*"([^"]+)"\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    map.set(m[1], m[2]);
    map.set(m[2], m[1]);
  }
  return map;
}

/**
 * 加载 docs/jobs：索引行 + 各 task 真相中的 配置键 / cronConfigKey / 显示名
 */
export function loadJobsCatalog(root) {
  const jobs = [];
  const byTaskCode = new Map();
  const byCronKey = new Map();
  const byCronConfigKey = new Map();
  const bySlugFile = new Map();

  const indexPath = path.join(root, "docs", "jobs", "jobs.md");
  const indexText = readText(indexPath);
  if (indexText) {
    for (const line of indexText.split(/\r?\n/)) {
      // | 01 | 显示名 | `task_code` | [tasks/01-xxx.md](...) | ...
      const m = line.match(
        /^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*`([^`]+)`\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/
      );
      if (!m) continue;
      const taskCode = m[3].trim();
      const displayName = m[2].trim();
      let truthRel = m[5].trim().replace(/^\.\//, "");
      if (!truthRel.startsWith("tasks/")) {
        truthRel = truthRel.includes("tasks/")
          ? truthRel.slice(truthRel.indexOf("tasks/"))
          : `tasks/${baseName(truthRel)}`;
      }
      const entry = {
        nn: m[1],
        displayName,
        taskCode,
        truthPath: `docs/jobs/${truthRel.replace(/\\/g, "/")}`,
        cronKey: null,
        cronConfigKey: null,
        enableKey: null,
        defaultCron: null,
      };
      jobs.push(entry);
      byTaskCode.set(taskCode, entry);
      bySlugFile.set(baseName(truthRel), entry);
    }
  }

  const tasksDir = path.join(root, "docs", "jobs", "tasks");
  let taskFiles = [];
  try {
    taskFiles = fs.readdirSync(tasksDir).filter((f) => /^\d+-.*\.md$/i.test(f));
  } catch {
    taskFiles = [];
  }

  for (const file of taskFiles) {
    const full = path.join(tasksDir, file);
    const text = readText(full);
    if (!text) continue;
    let entry = bySlugFile.get(file);
    if (!entry) {
      entry = {
        nn: file.slice(0, 2),
        displayName: file,
        taskCode: null,
        truthPath: `docs/jobs/tasks/${file}`,
        cronKey: null,
        cronConfigKey: null,
        enableKey: null,
        defaultCron: null,
      };
      jobs.push(entry);
      bySlugFile.set(file, entry);
    }
    const taskCodeM = text.match(/\|\s*task_code\s*\|\s*`([^`]+)`/);
    if (taskCodeM) {
      entry.taskCode = taskCodeM[1].trim();
      byTaskCode.set(entry.taskCode, entry);
    }
    const nameM = text.match(/\|\s*显示名\s*\|\s*([^|]+)\|/);
    if (nameM) entry.displayName = nameM[1].trim();
    const cronKeyM = text.match(/\|\s*配置键\s*\|\s*`([^`]+)`/);
    if (cronKeyM) {
      entry.cronKey = cronKeyM[1].trim();
      byCronKey.set(entry.cronKey, entry);
    }
    const slugM = text.match(/\|\s*cronConfigKey\s*\|\s*`([^`]+)`/);
    if (slugM) {
      entry.cronConfigKey = slugM[1].trim();
      byCronConfigKey.set(entry.cronConfigKey, entry);
    }
    const enableM = text.match(/\|\s*enable 配置\s*\|\s*`([^`]+)`/);
    if (enableM) {
      entry.enableKey = enableM[1].replace(/\s*（.*$/, "").trim();
    }
    const defM = text.match(/\|\s*默认表达式\s*\|\s*`([^`]+)`/);
    if (defM) entry.defaultCron = defM[1].trim();
    const daysM = text.match(/\|\s*defaultDays\s*\|\s*([^|]+)\|/);
    if (daysM) entry.defaultDays = daysM[1].trim();
    const hoursM = text.match(/\|\s*defaultHours\s*\|\s*([^|]+)\|/);
    if (hoursM) entry.defaultHours = hoursM[1].trim();
  }

  return { jobs, byTaskCode, byCronKey, byCronConfigKey, bySlugFile };
}

export function lookupConfigDescription(key, catalog, ymlComment) {
  if (ymlComment && String(ymlComment).trim()) {
    return { description: String(ymlComment).trim(), source: "yml-comment" };
  }
  if (catalog.has(key)) return catalog.get(key);
  // 最长前缀：sms.ai.sync.cron.foo → 试 sms.ai.sync.cron / sms.ai.sync / sms.ai
  const parts = key.split(".");
  for (let i = parts.length - 1; i >= 2; i--) {
    const prefix = parts.slice(0, i).join(".");
    if (catalog.has(prefix)) {
      const hit = catalog.get(prefix);
      return {
        description: `${hit.description}（前缀命中 ${prefix}）`,
        source: hit.source,
      };
    }
  }
  return { description: null, source: null };
}

export function resolveJobHit(keyOrCode, jobsCatalog, syncEnumMap) {
  if (!keyOrCode) return null;
  const s = String(keyOrCode).trim();
  if (jobsCatalog.byCronKey.has(s)) return jobsCatalog.byCronKey.get(s);
  if (jobsCatalog.byTaskCode.has(s)) return jobsCatalog.byTaskCode.get(s);
  if (jobsCatalog.byCronConfigKey.has(s)) return jobsCatalog.byCronConfigKey.get(s);
  // sms.ai.sync.cron.milvus-safety-report-full
  const cronTail = s.match(/\.cron\.([a-z0-9-]+)$/i);
  if (cronTail && jobsCatalog.byCronConfigKey.has(cronTail[1])) {
    return jobsCatalog.byCronConfigKey.get(cronTail[1]);
  }
  // ENUM_NAME
  if (syncEnumMap.has(s) && String(syncEnumMap.get(s)).includes(":")) {
    const code = syncEnumMap.get(s);
    if (jobsCatalog.byTaskCode.has(code)) return jobsCatalog.byTaskCode.get(code);
  }
  // path docs/jobs/tasks/01-xxx.md
  const base = baseName(s);
  if (jobsCatalog.bySlugFile.has(base)) return jobsCatalog.bySlugFile.get(base);
  return null;
}

export function isProdConfigPath(filePath) {
  const n = normPath(filePath);
  const b = baseName(n);
  if (/^application-prod\.ya?ml$/i.test(b)) return true;
  if (/^application\.ya?ml$/i.test(b)) return true;
  return false;
}

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
  const descCatalog = loadConfigDescriptionCatalog(root);
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
      job: job
        ? {
            taskCode: job.taskCode,
            displayName: job.displayName,
            truthPath: job.truthPath,
            cronKey: job.cronKey,
            cronConfigKey: job.cronConfigKey,
            defaultCron: job.defaultCron,
          }
        : null,
      prodPath: isProdConfigPath(row.path),
      confidence: rankConfidence("key-diff", job ? "docs-hit" : null, hit.description ? "catalog-hit" : null),
    };
  });

  const taskCodes = [];
  const seenCodes = new Set();
  for (const raw of payload.taskCodes || []) {
    let code = raw;
    if (syncEnumMap.has(raw) && String(syncEnumMap.get(raw)).includes(":")) {
      code = syncEnumMap.get(raw);
    } else if (syncEnumMap.has(raw) && /^[A-Z0-9_]+$/.test(raw) === false) {
      code = raw;
    }
    const job = resolveJobHit(code, jobsCatalog, syncEnumMap) || resolveJobHit(raw, jobsCatalog, syncEnumMap);
    const id = job?.taskCode || code;
    if (seenCodes.has(id)) continue;
    seenCodes.add(id);
    taskCodes.push({
      raw,
      taskCode: job?.taskCode || code,
      displayName: job?.displayName || null,
      truthPath: job?.truthPath || null,
      cronKey: job?.cronKey || null,
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
        next.job = {
          taskCode: job.taskCode,
          displayName: job.displayName,
          truthPath: job.truthPath,
          cronKey: job.cronKey,
        };
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
          job: job
            ? { taskCode: job.taskCode, displayName: job.displayName, truthPath: job.truthPath }
            : null,
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
        taskCode: t.taskCode,
        displayName: t.displayName,
        truthPath: t.truthPath,
        cronKey: t.cronKey,
        confidence: t.confidence,
      });
    }
  }
  for (const c of candidates) {
    if (c.job?.taskCode) {
      jobsHitsMap.set(c.job.taskCode, { ...c.job, confidence: c.confidence });
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

  // —— jobs ↔ config 交叉校验：有 taskCode/cronKey 但 prod 配置无对应 cron 表达式键 ——
  const configKeySet = new Set(configKeys.map((k) => k.key));
  const jobsConfigGaps = [];
  const gapSeen = new Set();
  for (const hit of jobsHitsMap.values()) {
    const cronKey = hit.cronKey || null;
    if (!cronKey) continue;
    const id = hit.taskCode || cronKey;
    if (gapSeen.has(id)) continue;
    if (!configKeySet.has(cronKey)) {
      gapSeen.add(id);
      jobsConfigGaps.push({
        taskCode: hit.taskCode || null,
        cronKey,
        truthPath: hit.truthPath || null,
        displayName: hit.displayName || null,
        reason: "cronExpressionMissing",
        hint: "cron 表达式可能由 Nacos overlay 提供，或本次未随 prod yml 上线",
      });
    }
  }

  // —— 索引 ↔ 磁盘对账：releases.md 进行中表行指向的 note 须存在 ——
  const indexDrift = scanIndexDrift(root);

  const priorBundle = resolvePriorArtifactsBundle(root, priorOpt, priorSince);
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
      `逾期硬闸：存在 ${overdueHard.length} 份已定版且发版日期已过的 notes/ 发版单，须先 seal 或书面跳过后再定版`
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
      `jobs↔config 交叉：${jobsConfigGaps.length} 个任务在 prod 配置未找到对应 cron 表达式键（cronExpressionMissing），可能由 Nacos overlay 提供或本次未上线`
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

function normalizeBaselinePresence(raw) {
  return {
    sqlScripts: new Set(raw?.sqlScripts || []),
    configKeys: new Set(raw?.configKeys || []),
    jobIds: new Set(raw?.jobIds || []),
  };
}

function emptyArtifacts() {
  return {
    identity: null,
    sqlScripts: new Set(),
    configKeys: new Set(),
    jobIds: new Set(),
  };
}

function mergeArtifactSets(into, from) {
  for (const s of from.sqlScripts || []) into.sqlScripts.add(s);
  for (const s of from.configKeys || []) into.configKeys.add(s);
  for (const s of from.jobIds || []) into.jobIds.add(s);
  if (!into.identity && from.identity) into.identity = from.identity;
  return into;
}

/** 从目录包 artifacts.json 或 md 启发式加载清单已收录 */
export function loadArtifactsForNoteFile(root, mdFullPath) {
  const dir = path.dirname(mdFullPath);
  const jsonPath = path.join(dir, "artifacts.json");
  const jsonText = readText(jsonPath);
  if (jsonText) {
    try {
      const data = JSON.parse(jsonText);
      const out = emptyArtifacts();
      out.identity = data.identity || path.basename(dir);
      for (const row of data.sql || []) {
        const id = row.stableId || row.脚本 || row.script;
        if (id) out.sqlScripts.add(baseName(id));
      }
      for (const row of data.config || []) {
        const id = row.stableId || row.键 || row.key;
        if (id) out.configKeys.add(id);
      }
      for (const row of data.jobs || []) {
        const id = row.stableId || row.taskCode || row["task / cron 键"] || row.cronKey;
        if (id) out.jobIds.add(id);
        if (row.taskCode) out.jobIds.add(row.taskCode);
        if (row.cronKey) out.jobIds.add(row.cronKey);
      }
      return { artifacts: out, source: "artifacts.json", path: normPath(path.relative(root, jsonPath)) };
    } catch {
      /* fall through to md */
    }
  }
  const text = readText(mdFullPath);
  const artifacts = parseReleaseNoteArtifacts(text);
  return {
    artifacts,
    source: "md-heuristic",
    path: normPath(path.relative(root, mdFullPath)),
  };
}

/** 按 identity 日期前缀倒序列出发版单 md（兼容扁平 archive/*.md 与目录包 archive/{id}/{id}.md） */
function listReleaseNotesNewestFirst(dir) {
  const found = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const ent of entries) {
    if (ent.isFile() && ent.name.endsWith(".md")) {
      found.push({
        file: ent.name,
        full: path.join(dir, ent.name),
        sort: /^(\d{4}-\d{2}-\d{2})/.test(ent.name) ? ent.name : `0000-00-00-${ent.name}`,
        identity: ent.name.replace(/\.md$/i, ""),
      });
    } else if (ent.isDirectory()) {
      const nested = path.join(dir, ent.name, `${ent.name}.md`);
      if (fs.existsSync(nested)) {
        found.push({
          file: `${ent.name}.md`,
          full: nested,
          sort: /^(\d{4}-\d{2}-\d{2})/.test(ent.name) ? ent.name : `0000-00-00-${ent.name}`,
          identity: ent.name,
        });
      }
    }
  }
  return found.sort((a, b) => b.sort.localeCompare(a.sort));
}

function identityDatePrefix(identity) {
  const m = String(identity || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * prior: auto → archive 全量并集（可选 --prior-since）；none → 空；否则单路径
 */
export function resolvePriorArtifactsBundle(root, priorOpt, priorSince) {
  const empty = { notes: [], artifacts: emptyArtifacts(), usedArtifactsJson: false };
  if (!priorOpt || priorOpt === "none") return empty;

  const notes = [];
  let usedArtifactsJson = false;
  const union = emptyArtifacts();

  const ingest = (mdFull) => {
    const loaded = loadArtifactsForNoteFile(root, mdFull);
    if (loaded.source === "artifacts.json") usedArtifactsJson = true;
    mergeArtifactSets(union, loaded.artifacts);
    notes.push({
      path: loaded.path.endsWith("artifacts.json")
        ? normPath(path.relative(root, mdFull))
        : loaded.path,
      identity: loaded.artifacts.identity || path.basename(mdFull).replace(/\.md$/i, ""),
      source: loaded.source,
    });
  };

  if (priorOpt !== "auto") {
    const full = path.isAbsolute(priorOpt) ? priorOpt : path.join(root, priorOpt);
    if (!fs.existsSync(full)) return empty;
    ingest(full);
    return { notes, artifacts: union, usedArtifactsJson };
  }

  const archiveDir = path.join(root, "docs", "releases", "archive");
  let listed = listReleaseNotesNewestFirst(archiveDir);
  if (priorSince) {
    const since = String(priorSince).trim();
    listed = listed.filter((n) => {
      const id = n.identity || n.file.replace(/\.md$/i, "");
      const d = identityDatePrefix(id) || identityDatePrefix(since);
      if (/^\d{4}-\d{2}-\d{2}/.test(since) && identityDatePrefix(id)) {
        return identityDatePrefix(id) >= since.slice(0, 10);
      }
      return id >= since || id.includes(since);
    });
  }
  for (const pick of listed) ingest(pick.full);
  return { notes, artifacts: union, usedArtifactsJson };
}

/** @deprecated 兼容旧调用：返回单份 note 形状；auto 时取并集后的兼容包装请用 resolvePriorArtifactsBundle */
export function resolvePriorReleaseNote(root, priorOpt) {
  const bundle = resolvePriorArtifactsBundle(root, priorOpt, null);
  if (!bundle.notes.length) return null;
  const first = bundle.notes[0];
  const full = path.join(root, first.path);
  const text = readText(full);
  return {
    path: first.path,
    identity: first.identity,
    text: text || "",
  };
}

/** 从发版单正文抽取已上线 SQL / 配置键 / 任务标识（无 artifacts.json 时回退） */
export function parseReleaseNoteArtifacts(text) {
  const out = emptyArtifacts();
  if (!text) return out;
  const idM = text.match(/^#\s*发版单[：:]\s*(\S+)/m) || text.match(/\|\s*版本身份\s*\|\s*([^|]+)\|/);
  if (idM) out.identity = idM[1].trim();

  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    for (const m of line.matchAll(/\b(V\d+__[A-Za-z0-9_.-]+\.sql)\b/gi)) {
      out.sqlScripts.add(m[1]);
    }
    for (const m of line.matchAll(/`([a-zA-Z][a-zA-Z0-9_.-]{2,})`/g)) {
      const k = m[1];
      if (k.includes(".") || k.includes(":")) {
        if (k.includes(":") || /^[a-z]+:/.test(k) || k.startsWith("sms.") || k.startsWith("agent.") || k.startsWith("spring.")) {
          if (k.includes(":")) out.jobIds.add(k);
          else out.configKeys.add(k);
        }
      }
    }
    const taskM = line.match(/\|\s*([a-z][a-z0-9:_\/-]+:[a-z0-9:_\/-]+)\s*\|/i);
    if (taskM) out.jobIds.add(taskM[1].trim());
    for (const m of line.matchAll(/sms\.ai\.[a-z0-9_.-]*cron[a-z0-9_.-]*/gi)) {
      out.jobIds.add(m[0]);
      out.configKeys.add(m[0]);
    }
  }
  return out;
}

/**
 * 双源标记：
 * - 线上已存在 → alreadyReleased（进 suppressed）
 * - 仅清单已收录 → priorOnly，仍留 draft（漏检优先）
 * - layerSuppressed → 首次分层策略 suppress
 */
function markDualSource(parts, priorArtifacts, baselinePresence, priorBundle) {
  const priorPath = priorBundle.notes.map((n) => n.path).join("; ") || null;
  const sqlScripts = priorArtifacts.sqlScripts;
  const configKeysSet = priorArtifacts.configKeys;
  const jobIds = priorArtifacts.jobIds;

  const candidates = parts.candidates.map((c) => {
    if (c.layerSuppressed) {
      return {
        ...c,
        alreadyReleased: true,
        priorOnly: false,
        suppressReason: "first-release-layer",
        priorNote: null,
      };
    }
    const bn = baseName(c.path);
    const onBaseline =
      (c.kinds?.includes("sql") && baselinePresence.sqlScripts.has(bn)) ||
      (c.job?.taskCode && baselinePresence.jobIds.has(c.job.taskCode)) ||
      (c.job?.cronKey && baselinePresence.jobIds.has(c.job.cronKey));
    const listed =
      (c.kinds?.includes("sql") && sqlScripts.has(bn)) ||
      (c.job?.taskCode && jobIds.has(c.job.taskCode)) ||
      (c.job?.cronKey && jobIds.has(c.job.cronKey));
    if (onBaseline) {
      return { ...c, alreadyReleased: true, priorOnly: false, suppressReason: "baseline", priorNote: priorPath };
    }
    if (listed) {
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

  const configAll = configKeys.map((k) => ({
    来源: k.path,
    键: k.key,
    说明: k.description || "待补",
    值: k.change === "removed" ? "（删除）" : k.value ?? "",
    "目标 profile": "prod",
    变更: k.change,
    prodPath: k.prodPath,
    isLeaf: k.isLeaf !== false,
    source: k.source || null,
    confidence: k.confidence || "key-diff",
    alreadyReleased: Boolean(k.alreadyReleased),
    priorOnly: Boolean(k.priorOnly),
    suppressReason: k.suppressReason || null,
    已确认: "",
  }));

  const jobsFromKeys = jobKeys.map((k) =>
    attachJobScheduleFields(
      {
        "task / cron 键": k.job?.cronKey || k.key,
        taskCode: k.job?.taskCode || "",
        变更类型: k.change === "added" ? "新建/改 Cron" : k.change === "removed" ? "开关/删除" : "改 Cron",
        说明: k.job?.displayName || k.description || "",
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
    )
  );

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
  };
}

/** 变更对象列表（规则轨） */
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
  };
}

/** notes/ 逾期未归档：发版日期 < 今天(上海)；已定版→hard，准备中→soft */
export function scanOverdueNotes(root) {
  const notesDir = path.join(root, "docs", "releases", "notes");
  const listed = listReleaseNotesNewestFirst(notesDir);
  const today = chinaToday();
  const out = [];
  for (const n of listed) {
    const text = readText(n.full);
    if (!text) continue;
    const dateM = text.match(/\|\s*发版日期\s*\|\s*([^|]+)\|/) || text.match(/>\s*发版日期：\s*(\S+)/);
    const releaseDate = dateM && /(\d{4}-\d{2}-\d{2})/.test(dateM[1]) ? dateM[1].match(/(\d{4}-\d{2}-\d{2})/)[1] : identityDatePrefix(n.identity);
    if (!releaseDate || releaseDate >= today) continue;
    const statusM = text.match(/>\s*状态：\s*([^\n]+)/) || text.match(/\|\s*状态\s*\|\s*([^|]+)\|/);
    const status = statusM ? statusM[1].trim() : "";
    if (status.includes("已取消") || status.includes("已上线")) continue;
    const severity = status.includes("已定版") ? "hard" : "soft";
    out.push({
      identity: n.identity,
      path: normPath(path.relative(root, n.full)),
      releaseDate,
      status: status || "未知",
      severity,
    });
  }
  return out;
}

function chinaToday() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * 索引 ↔ 磁盘对账：解析 docs/releases/releases.md「进行中」表行，
 * 检查其指向的 note 路径在磁盘是否存在；不存在 → 漂移。
 */
export function scanIndexDrift(root) {
  const indexPath = path.join(root, "docs", "releases", "releases.md");
  const text = readText(indexPath);
  if (!text) return [];
  const drift = [];
  let inProgress = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^##\s*进行中/.test(line.trim())) {
      inProgress = true;
      continue;
    }
    if (inProgress && /^##\s/.test(line.trim())) {
      inProgress = false;
      break;
    }
    if (!inProgress) continue;
    if (!line.includes("|") || line.includes("---")) continue;
    // 提取 markdown 链接目标：[`...`](./notes/xxx/xxx.md)
    const linkM = line.match(/\]\(([^)]+\.md)\)/);
    if (!linkM) continue;
    const rel = linkM[1].replace(/^\.?\//, "");
    if (!rel.startsWith("notes/")) continue;
    const full = path.join(root, "docs", "releases", rel);
    const identity = rel.split("/").pop().replace(/\.md$/i, "");
    if (!fs.existsSync(full)) {
      drift.push({ identity, path: normPath(rel), declaredStatus: "进行中" });
    }
  }
  return drift;
}

/** 改进 Java diff：抽取 "milvus:..." 类 task_code 与 ENUM */
export function extractTaskCodesFromJavaDiff(diffText, syncEnumMap) {
  if (!diffText) return [];
  const codes = new Set();
  for (const line of diffText.split(/\r?\n/)) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const body = line.slice(1);
    const enumM = body.match(/^\s*([A-Z][A-Z0-9_]{2,})\s*\(/);
    if (enumM) {
      const name = enumM[1];
      codes.add(syncEnumMap?.has(name) ? syncEnumMap.get(name) : name);
    }
    for (const m of body.matchAll(/"([a-z][a-z0-9:_\/-]{3,})"/gi)) {
      if (m[1].includes(":") || m[1].includes("-")) codes.add(m[1]);
    }
    for (const m of body.matchAll(/"([A-Z][A-Z0-9_]{2,})"/g)) {
      const name = m[1];
      codes.add(syncEnumMap?.has(name) ? syncEnumMap.get(name) : name);
    }
  }
  return [...codes].sort();
}

const DRAFT_PREVIEW_MAX = 15;

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

  // Config：yml 预览（叶子键全量展示，父级键不计；发版单需完整键）
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
      for (const [src, list] of bySrc) {
        lines.push(`#### ${src}`);
        if (/\.ya?ml$/i.test(src)) {
          lines.push("```yaml");
          for (const r of list) {
            const v = r.值 === "" || r.值 == null ? '""' : String(r.值);
            // 行尾注释透明化推荐来源：confidence · 采集源（问卷预填时须能追溯）
            const tag = [r.confidence, r.source].filter(Boolean).join(" · ");
            lines.push(`${r.键}: ${v}${tag ? `  # ${tag}` : ""}`);
          }
          lines.push("```");
        } else {
          for (const r of list) {
            const tag = [r.confidence, r.source].filter(Boolean).join(" · ");
            lines.push(`- \`${r.键}\` = ${escCell(r.值)} （${escCell(r.说明 || "待补")}）${tag ? ` — ${tag}` : ""}`);
          }
        }
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
      lines.push(
        `| ${escCell(r.taskCode)} | ${escCell(r.名称 || r.说明)} | ${escCell(r.cron)} | ${escCell(r.参数)} | ${escCell(r.开关)} |`
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
      ? { migrationRange: data.inventory.migrationRange, migrationCount: data.inventory.migrationCount }
      : null,
    warnings: data.warnings || [],
  };
}
