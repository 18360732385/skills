import fs from "fs";
import path from "path";
import { DEFAULT_REPO_PROFILE } from "../repo-profile.mjs";
import { readText, normPath, baseName } from "./io.mjs";

const CONFIDENCE_ORDER = ["path", "key-diff", "catalog-hit", "docs-hit"];


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
export function loadConfigDescriptionCatalog(root, catalogFiles = DEFAULT_REPO_PROFILE.configCatalogFiles) {
  const map = new Map();
  const files = (Array.isArray(catalogFiles) && catalogFiles.length
    ? catalogFiles
    : DEFAULT_REPO_PROFILE.configCatalogFiles
  ).map((rel) => path.join(root, rel));
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

const SYNC_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "target",
  "dist",
  "build",
  ".idea",
  ".cursor",
]);

/** 递归发现 SyncTaskCode.java（相对 root；跳过常见构建/依赖目录） */
export function findSyncTaskCodeFiles(root) {
  const out = [];
  const walk = (abs, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name.startsWith(".") && ent.name !== ".git") {
        /* allow hidden only if not skip; still skip .git via set */
      }
      if (ent.isDirectory()) {
        if (SYNC_SKIP_DIRS.has(ent.name)) continue;
        walk(path.join(abs, ent.name), rel ? `${rel}/${ent.name}` : ent.name);
        continue;
      }
      if (ent.isFile() && ent.name === "SyncTaskCode.java") {
        out.push(rel ? `${rel}/${ent.name}` : ent.name);
      }
    }
  };
  walk(root, "");
  return out.map((p) => p.replace(/\\/g, "/"));
}

function parseSyncTaskCodeText(text, map) {
  if (!text) return;
  const re = /([A-Z][A-Z0-9_]+)\s*\(\s*"([^"]+)"\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    map.set(m[1], m[2]);
    map.set(m[2], m[1]);
  }
}

/**
 * 解析 SyncTaskCode.java：ENUM → task_code 字符串。
 * 扫描仓内全部 SyncTaskCode.java；`map.files` = 相对路径列表。
 */
export function loadSyncTaskCodeMap(root) {
  const map = new Map(); // ENUM_NAME -> task_code, also task_code -> ENUM
  const files = findSyncTaskCodeFiles(root);
  map.files = files;
  for (const rel of files) {
    parseSyncTaskCodeText(readText(path.join(root, rel)), map);
  }
  return map;
}

/** 真相「配置键 / 默认表达式」单元格是否声明 fixedDelay / 非 cron */
export const JOBS_FIXED_DELAY_RE =
  /非\s*cron|fixed\s*delay|fixedDelay|fixedDelayString|interval-?ms/i;

/** 从 SpEL / 反引号中抽出配置键（interval / delay / enabled 等） */
export function extractJobsIntervalKeys(cell) {
  const keys = [];
  for (const m of String(cell || "").matchAll(/\$\{([a-zA-Z][a-zA-Z0-9_.-]*?)(?::[^}]*)?\}/g)) {
    keys.push(m[1]);
  }
  for (const m of String(cell || "").matchAll(/`([a-zA-Z][a-zA-Z0-9_.-]+)`/g)) {
    if (/interval|fixed[-]?delay|delay-ms|enabled/i.test(m[1])) keys.push(m[1]);
  }
  return [...new Set(keys)];
}

/**
 * 解析 jobs 真相「配置键」单元格。
 * - 非 cron / fixedDelay：设 scheduleType，抽 intervalKeys，不写 cronKey
 * - 真 cron：反引号内纯配置键 → cronKey
 */
export function parseJobsConfigKeyCell(cell) {
  const text = String(cell || "").trim();
  const out = { cronKey: null, scheduleType: null, intervalKeys: [] };
  if (!text) return out;
  if (JOBS_FIXED_DELAY_RE.test(text)) {
    out.scheduleType = "fixedDelay";
    out.intervalKeys = extractJobsIntervalKeys(text);
    return out;
  }
  const tick = text.match(/`([^`]+)`/);
  if (tick) {
    const v = tick[1].trim();
    if (v && !/=/.test(v) && !/\$\{/.test(v)) out.cronKey = v;
  }
  return out;
}

/** 组装 job / jobsHits 共用调度字段 */
export function jobScheduleSlice(job) {
  if (!job) return null;
  return {
    taskCode: job.taskCode,
    displayName: job.displayName,
    truthPath: job.truthPath,
    cronKey: job.cronKey ?? null,
    cronConfigKey: job.cronConfigKey || null,
    defaultCron: job.defaultCron || null,
    scheduleType: job.scheduleType || null,
    intervalKeys: Array.isArray(job.intervalKeys) ? [...job.intervalKeys] : [],
  };
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
        scheduleType: null,
        intervalKeys: [],
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
        scheduleType: null,
        intervalKeys: [],
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
    const cfgCellM = text.match(/\|\s*配置键\s*\|\s*([^|]+)\|/);
    if (cfgCellM) {
      const parsed = parseJobsConfigKeyCell(cfgCellM[1]);
      if (parsed.scheduleType) entry.scheduleType = parsed.scheduleType;
      if (parsed.intervalKeys.length) {
        entry.intervalKeys = [...new Set([...(entry.intervalKeys || []), ...parsed.intervalKeys])];
      }
      if (parsed.cronKey) {
        entry.cronKey = parsed.cronKey;
        byCronKey.set(entry.cronKey, entry);
      }
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
    const defCellM = text.match(/\|\s*默认表达式\s*\|\s*([^|]+)\|/);
    if (defCellM) {
      const cell = defCellM[1].trim();
      const tick = cell.match(/`([^`]+)`/);
      entry.defaultCron = tick ? tick[1].trim() : cell.replace(/\s*（.*$/, "").trim();
      if (JOBS_FIXED_DELAY_RE.test(cell)) entry.scheduleType = entry.scheduleType || "fixedDelay";
    }
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
  // ENUM_NAME → task_code（不强制含 ':'）
  if (syncEnumMap.has(s) && /^[A-Z][A-Z0-9_]+$/.test(s)) {
    const code = syncEnumMap.get(s);
    if (typeof code === "string" && jobsCatalog.byTaskCode.has(code)) {
      return jobsCatalog.byTaskCode.get(code);
    }
  }
  // path docs/jobs/tasks/01-xxx.md
  const base = baseName(s);
  if (jobsCatalog.bySlugFile.has(base)) return jobsCatalog.bySlugFile.get(base);
  return null;
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


