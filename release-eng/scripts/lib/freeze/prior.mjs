import fs from "fs";
import path from "path";
import {
  normalizeNoteStatus,
  extractMigrationNames,
} from "../../release-format.mjs";
import { DEFAULT_REPO_PROFILE } from "../repo-profile.mjs";
import { readText, normPath, baseName } from "./io.mjs";

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
export function loadArtifactsForNoteFile(root, mdFullPath, profile = DEFAULT_REPO_PROFILE) {
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
  const artifacts = parseReleaseNoteArtifacts(text, profile?.artifactKeyPrefixes);
  return {
    artifacts,
    source: "md-heuristic",
    path: normPath(path.relative(root, mdFullPath)),
  };
}

/** releases/ 根下保留名：不是进行中版本身份目录 */
const RELEASES_RESERVED_DIRS = new Set(["archive", "templates", "notes"]);

/** 按 identity 日期前缀倒序列出发版单 md（兼容扁平 *.md 与目录包 {id}/{id}.md） */
function listReleaseNotesNewestFirst(dir, { skipDirs = [] } = {}) {
  const skip = new Set(
    [...skipDirs, ...RELEASES_RESERVED_DIRS].map((s) => String(s).toLowerCase())
  );
  const found = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const ent of entries) {
    if (ent.isFile() && ent.name.endsWith(".md")) {
      const base = ent.name.replace(/\.md$/i, "");
      // 跳过索引/说明类顶层 md
      if (/^(releases|archive|readme|changelog)$/i.test(base)) continue;
      found.push({
        file: ent.name,
        full: path.join(dir, ent.name),
        sort: /^(\d{4}-\d{2}-\d{2})/.test(ent.name) ? ent.name : `0000-00-00-${ent.name}`,
        identity: base,
      });
    } else if (ent.isDirectory()) {
      if (skip.has(ent.name.toLowerCase())) continue;
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
 * 从发版单正文读取 发版日期（YYYY-MM-DD）：
 * 表格行 `| 发版日期 | 2026-08-27 |` 或引语行 `> 发版日期：2026-08-27`；读不到返回 null。
 * 供 prior-since 对无日期前缀的新式身份（release-Vxxxxxx）回退判期，及逾期扫描复用。
 */
export function noteReleaseDate(text) {
  const s = String(text || "");
  const m =
    s.match(/\|\s*发版日期\s*\|\s*(\d{4}-\d{2}-\d{2})/) ||
    s.match(/>\s*发版日期：\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * prior: auto → archive 全量并集（可选 --prior-since）；none → 空；否则单路径。
 * profile：目标仓 repo-profile（artifactKeyPrefixes 注入 md 启发式；缺省 DEFAULT）。
 */
export function resolvePriorArtifactsBundle(root, priorOpt, priorSince, profile = DEFAULT_REPO_PROFILE) {
  const empty = { notes: [], artifacts: emptyArtifacts(), usedArtifactsJson: false };
  if (!priorOpt || priorOpt === "none") return empty;

  const notes = [];
  let usedArtifactsJson = false;
  const union = emptyArtifacts();

  const ingest = (mdFull) => {
    const loaded = loadArtifactsForNoteFile(root, mdFull, profile);
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
    const sinceDate = /^\d{4}-\d{2}-\d{2}/.test(since) ? since.slice(0, 10) : null;
    listed = listed.filter((n) => {
      const id = n.identity || n.file.replace(/\.md$/i, "");
      const idDate = identityDatePrefix(id);
      if (sinceDate) {
        if (idDate) return idDate >= sinceDate;
        // 新式身份（无日期前缀）：回退读 archive md 的 发版日期（C4/D4）；
        // 读不到日期时保守并入（漏检优先，宁可多 prior 不可漏已上线）。
        const mdDate = noteReleaseDate(readText(n.full));
        if (mdDate) return mdDate >= sinceDate;
        return true;
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

/**
 * 从发版单正文抽取已上线 SQL / 配置键 / 任务标识（无 artifacts.json 时回退）。
 * prefixes：业务键前缀表（缺省 DEFAULT_REPO_PROFILE.artifactKeyPrefixes；目标仓 repo-profile.json 可覆盖）。
 */
export function parseReleaseNoteArtifacts(text, prefixes = DEFAULT_REPO_PROFILE.artifactKeyPrefixes) {
  const out = emptyArtifacts();
  if (!text) return out;
  const idM = text.match(/^#\s*发版单[：:]\s*(\S+)/m) || text.match(/\|\s*版本身份\s*\|\s*([^|]+)\|/);
  if (idM) out.identity = idM[1].trim();
  const prefixList = Array.isArray(prefixes) ? prefixes : DEFAULT_REPO_PROFILE.artifactKeyPrefixes;

  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    // 旧轨与新轨（含中文描述）统一抽取，见 extractMigrationNames
    for (const name of extractMigrationNames(line)) out.sqlScripts.add(name);
    for (const m of line.matchAll(/`([a-zA-Z][a-zA-Z0-9_.-]{2,})`/g)) {
      const k = m[1];
      if (k.includes(".") || k.includes(":")) {
        if (k.includes(":") || /^[a-z]+:/.test(k) || prefixList.some((p) => k.startsWith(p))) {
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

/** 增量键级 diff 的值变更/删除：键可能已在基线树，但仍须进 draft */

/**
 * 进行中发版单逾期未归档：发版日期 < 今天(上海)；已定版→hard，准备中→soft。
 * 扫描 docs/releases/{id}/（跳过 archive/templates/notes）。0.4 不再扫 notes/。
 */
export function scanOverdueNotes(root) {
  const releasesDir = path.join(root, "docs", "releases");
  const listed = [...listReleaseNotesNewestFirst(releasesDir)];
  // 同 identity 去重：优先新路径（releases 根下先列出）
  const seen = new Set();
  const today = chinaToday();
  const out = [];
  for (const n of listed) {
    if (seen.has(n.identity)) continue;
    seen.add(n.identity);
    const text = readText(n.full);
    if (!text) continue;
    const releaseDate = noteReleaseDate(text) || identityDatePrefix(n.identity);
    if (!releaseDate || releaseDate >= today) continue;
    const statusM = text.match(/>\s*状态：\s*([^\n]+)/) || text.match(/\|\s*状态\s*\|\s*([^|]+)\|/);
    // 状态精确归一（normalizeNoteStatus）：占位/未知不再被 includes 误判（C5）
    const status = normalizeNoteStatus(statusM ? statusM[1] : "");
    if (status === "已取消" || status === "已上线") continue;
    const severity = status === "已定版" ? "hard" : "soft";
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
    // 兜底：UTC+8 偏移后取 ISO 日期（上海日，不再差一天）
    return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
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
    // 提取 markdown 链接目标：[`...`](./release-Vxx/release-Vxx.md)
    const linkM = line.match(/\]\(([^)]+\.md)\)/);
    if (!linkM) continue;
    const rel = linkM[1].replace(/^\.?\//, "");
    if (rel.startsWith("archive/") || rel.startsWith("templates/") || rel.startsWith("notes/")) continue;
    // 进行中：releases 根下 {id}/{id}.md
    if (!/^[^/]+\/[^/]+\.md$/i.test(rel)) {
      continue;
    }
    const full = path.join(root, "docs", "releases", rel);
    const identity = rel.split("/").pop().replace(/\.md$/i, "");
    if (!fs.existsSync(full)) {
      drift.push({ identity, path: normPath(rel), declaredStatus: "进行中" });
    }
  }
  return drift;
}


export { normalizeBaselinePresence };
