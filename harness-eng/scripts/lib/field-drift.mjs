/**
 * Field-level doc ↔ inventory drift (0.7.25 SG-1).
 * Compares db inventory columns to docs/db/table field tables;
 * optionally api inventory DTO-ish field names vs api module field tables.
 * 0.7.48: exact ## 字段 · CREATE TABLE fallback · schedule/redis noise normalize.
 */
import fs from "fs";
import path from "path";
import { loadDomainInventory } from "./inventory-paths.mjs";
import { truthsPath, loadDomainRegistry } from "./domains.mjs";
import { splitTableRows, isEmptyOrHollow } from "./doc-density.mjs";
import { parseCreateBodyColumns } from "./inventory-db.mjs";
import { isNoisePattern } from "./inventory-redis.mjs";

function listTableDocs(root) {
  const dir = truthsPath(root, "db", loadDomainRegistry());
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^\d+-.*\.md$/i.test(n))
    .map((n) => path.join(dir, n));
}

/**
 * Extract column names from fenced CREATE TABLE in docs (## 建表语句 or any ```sql).
 * @param {string} md
 * @returns {string[]}
 */
export function parseDocCreateFieldNames(md) {
  const text = String(md || "");
  const names = [];
  const seen = new Set();
  const fences = [...text.matchAll(/```(?:sql)?\s*([\s\S]*?)```/gi)];
  const blobs = fences.length
    ? fences.map((m) => m[1])
    : (() => {
        const sec = text.match(/##\s*建表语句[\s\S]*?(?=\n##\s+|$)/i);
        return sec ? [sec[0]] : [];
      })();
  for (const blob of blobs) {
    const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?\w+[`"]?/gi;
    let m;
    while ((m = re.exec(blob)) !== null) {
      const start = m.index;
      let i = start + m[0].length;
      let depth = 0;
      let bodyStart = -1;
      for (; i < blob.length; i++) {
        if (blob[i] === "(") {
          if (depth === 0) bodyStart = i + 1;
          depth++;
        } else if (blob[i] === ")") {
          depth--;
          if (depth === 0) break;
        }
      }
      if (bodyStart < 0) continue;
      const { columns } = parseCreateBodyColumns(blob.slice(bodyStart, i));
      for (const c of columns || []) {
        const n = String(c.name || "").trim();
        if (!n || seen.has(n.toLowerCase())) continue;
        seen.add(n.toLowerCase());
        names.push(n);
      }
    }
  }
  return names;
}

/**
 * Extract field names from exact ## 字段 table; fallback to CREATE TABLE columns.
 * 0.7.48: `^##\s*字段\s*$` only — does not match ## 字段说明.
 */
export function parseDocFieldNames(md) {
  const text = String(md || "");
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s*字段\s*$/i.test(lines[i].trim())) {
      start = i;
      break;
    }
  }
  if (start >= 0) {
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) {
        end = i;
        break;
      }
    }
    const sec = lines.slice(start, end).join("\n");
    const { headers, rows } = splitTableRows(sec);
    if (headers?.length && rows.length) {
      const nameIdx = headers.findIndex((h) => /字段名|列名|name|column/i.test(h));
      const idx = nameIdx >= 0 ? nameIdx : 0;
      const names = [];
      for (const cells of rows) {
        const raw = (cells[idx] ?? "").replace(/`/g, "").trim();
        if (!raw || isEmptyOrHollow(raw) || /字段名|列名/.test(raw)) continue;
        names.push(raw);
      }
      if (names.length) return names;
    }
  }
  return parseDocCreateFieldNames(md);
}

/**
 * True when doc CREATE TABLE already lists all inventory columns (skip hollow ## 字段 append).
 */
export function docCreateCoversColumns(md, colNames) {
  const want = [...new Set((colNames || []).map((c) => String(c).toLowerCase()).filter(Boolean))];
  if (!want.length) return false;
  const have = new Set(parseDocCreateFieldNames(md).map((n) => n.toLowerCase()));
  if (!have.size) return false;
  return want.every((c) => have.has(c));
}

function tableNameFromDoc(file, md) {
  const base = path.basename(file).replace(/^\d+-/, "").replace(/\.md$/i, "");
  const m = String(md || "").match(/表名\s*[：:]\s*`?(\w+)`?/i);
  return (m ? m[1] : base).toLowerCase();
}

function invColumns(table) {
  const set = new Set();
  for (const c of table.columns || []) {
    if (c?.name) set.add(String(c.name).toLowerCase());
  }
  for (const k of Object.keys(table.columnComments || {})) {
    set.add(String(k).toLowerCase());
  }
  return set;
}

/**
 * @param {string} root
 * @param {object|null} [dbInventory] live inventory preferred (0.7.38 G-up-db-drift-needs-inv)
 * @returns {{ ok: boolean, gaps: { table: string, missing_in_doc: string[], file?: string }[], blockers: string[] }}
 */
export function detectDbFieldDrift(root, dbInventory) {
  const inv =
    dbInventory && typeof dbInventory === "object"
      ? dbInventory
      : loadDomainInventory(root, "db");
  const gaps = [];
  const blockers = [];
  // 0.7.29 NEW-8: inventory present with tables:[] is not ready (empty_inventory)
  if (inv && Array.isArray(inv.tables) && inv.tables.length === 0) {
    blockers.push("empty_inventory:db");
    return { ok: false, gaps, blockers };
  }
  if (!inv || !Array.isArray(inv.tables) || !inv.tables.length) {
    return { ok: true, gaps, blockers };
  }
  const docs = listTableDocs(root);
  const byTable = new Map();
  for (const f of docs) {
    const md = fs.readFileSync(f, "utf8");
    const name = tableNameFromDoc(f, md);
    byTable.set(name, { file: f, fields: parseDocFieldNames(md), md });
  }
  for (const t of inv.tables) {
    const key = String(t.name || "").toLowerCase();
    if (!key) continue;
    const codeCols = invColumns(t);
    if (!codeCols.size) continue;
    const doc = byTable.get(key);
    if (!doc) {
      gaps.push({ table: t.name, missing_in_doc: [...codeCols], file: null });
      blockers.push(`doc_field_drift:${t.name}:no_doc`);
      continue;
    }
    const docSet = new Set(doc.fields.map((x) => x.toLowerCase()));
    const missing = [...codeCols].filter((c) => !docSet.has(c));
    if (missing.length) {
      gaps.push({
        table: t.name,
        missing_in_doc: missing,
        file: path.relative(root, doc.file).replace(/\\/g, "/"),
      });
      blockers.push(`doc_field_drift:${t.name}:${missing.join("+")}`);
    }
  }
  return { ok: blockers.length === 0, gaps, blockers };
}

/**
 * Collect METHOD + path tokens from api docs (接口地址 / 请求方式 / GET `/path`).
 * 0.7.37: accept colon inside or outside bold (`**接口地址：**` from fill-auto-api).
 */
export function collectDocApiPaths(docText) {
  const paths = new Set();
  const methodsByNear = [];
  const text = String(docText || "");
  for (const m of text.matchAll(/\*\*接口地址[：:]?\*\*[：:]?\s*`?([^\s`*]+)`?/gi)) {
    const p = m[1].trim();
    if (p.startsWith("/")) paths.add(p);
  }
  for (const m of text.matchAll(/\*\*请求方式[：:]?\*\*[：:]?\s*`?([A-Z]+)`?/gi)) {
    methodsByNear.push(m[1].toUpperCase());
  }
  for (const m of text.matchAll(
    /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b\s*`(\/[^`\s]+)`/gi
  )) {
    paths.add(`${m[1].toUpperCase()}:${m[2]}`);
    paths.add(m[2]);
  }
  for (const m of text.matchAll(
    /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b\s+(\/[^\s`*|]+)/gi
  )) {
    paths.add(`${m[1].toUpperCase()}:${m[2]}`);
    paths.add(m[2]);
  }
  for (const m of text.matchAll(/`(\/[a-zA-Z0-9_/{}.\-]+)`/g)) {
    if (m[1].length > 1) paths.add(m[1]);
  }
  return { paths, methodsByNear };
}

/**
 * Lightweight api drift: inventory endpoint param/response names vs field tables in api modules.
 */
export function detectApiFieldDrift(root, apiInventory, opts = {}) {
  const gaps = [];
  const blockers = [];
  if (!apiInventory?.endpoints?.length) return { ok: true, gaps, blockers };
  const dir = truthsPath(root, "api", loadDomainRegistry());
  if (!fs.existsSync(dir)) return { ok: true, gaps, blockers };
  const docFiles = [];
  function walkMd(d, depth = 0) {
    if (depth > 6 || !fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d)) {
      if (/^README/i.test(n) || n === ".fill-work") continue;
      const p = path.join(d, n);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walkMd(p, depth + 1);
      else if (/\.md$/i.test(n)) docFiles.push(p);
    }
  }
  walkMd(dir);
  const docText = docFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const { paths: docPaths } = collectDocApiPaths(docText);

  const codePaths = [];
  for (const ep of apiInventory.endpoints) {
    const method = String(ep.method || ep.httpMethod || "").toUpperCase();
    const p = String(ep.path || ep.url || "").trim();
    if (!p) continue;
    codePaths.push({ method, path: p, key: method ? `${method}:${p}` : p });
  }
  if (codePaths.length && docPaths.size) {
    const missingPaths = codePaths.filter(
      (c) => !docPaths.has(c.path) && !(c.method && docPaths.has(c.key))
    );
    if (missingPaths.length >= 1) {
      const sample = missingPaths.slice(0, 8).map((c) => c.key || c.path);
      gaps.push({ missing_paths_in_doc: sample });
      blockers.push(`doc_path_drift:api:${sample.join("+")}`);
    }
  }

  const docFields = new Set();
  for (const secName of ["请求参数", "响应参数", "字段"]) {
    const re = new RegExp(`###?\\s*${secName}([\\s\\S]*?)(?=###?\\s*|##\\s+|$)`, "gi");
    let m;
    while ((m = re.exec(docText)) !== null) {
      const { headers, rows } = splitTableRows(m[1]);
      if (!headers) continue;
      const idx = headers.findIndex((h) => /参数名|字段名|名称|name/i.test(h));
      const i = idx >= 0 ? idx : 0;
      for (const cells of rows) {
        const n = (cells[i] ?? "").replace(/`/g, "").trim();
        if (n && !isEmptyOrHollow(n)) docFields.add(n.toLowerCase());
      }
    }
  }
  if (!docFields.size && blockers.length) return { ok: false, gaps, blockers };
  if (!docFields.size) return { ok: blockers.length === 0, gaps, blockers };
  const codeFields = new Set();
  const annotationFields = new Set();
  for (const ep of apiInventory.endpoints) {
    for (const p of ep.annotationParams || []) {
      const n = typeof p === "string" ? p : p.name;
      if (n) annotationFields.add(String(n).toLowerCase());
    }
    for (const p of ep.params || ep.requestFields || []) {
      const n = typeof p === "string" ? p : p.name;
      if (n) codeFields.add(String(n).toLowerCase());
    }
    for (const p of ep.responseFields || ep.fields || []) {
      const n = typeof p === "string" ? p : p.name;
      if (n) codeFields.add(String(n).toLowerCase());
    }
  }
  if (!codeFields.size && !annotationFields.size) {
    return { ok: blockers.length === 0, gaps, blockers };
  }

  const missingAnn = [...annotationFields].filter((c) => !docFields.has(c));
  if (missingAnn.length >= 1) {
    gaps.push({ missing_annotation_params: missingAnn.slice(0, 20) });
    blockers.push(`doc_field_drift:api:${missingAnn.slice(0, 8).join("+")}`);
  }

  const missing = [...codeFields].filter((c) => !docFields.has(c));
  const ratio =
    typeof opts.missingRatio === "number" && Number.isFinite(opts.missingRatio)
      ? opts.missingRatio
      : 0.15;
  if (missing.length && missing.length >= Math.max(1, Math.ceil(codeFields.size * ratio))) {
    gaps.push({ missing_in_doc: missing.slice(0, 20) });
    if (!blockers.some((b) => b.startsWith("doc_field_drift:"))) {
      blockers.push(`doc_field_drift:api:${missing.slice(0, 8).join("+")}`);
    }
  }
  return { ok: blockers.length === 0, gaps, blockers };
}

export function detectFuncMethodDrift(root, funcInventory) {
  const gaps = [];
  const blockers = [];
  const inv = funcInventory || loadDomainInventory(root, "func");
  const modules = inv?.modules || (inv?.services ? [{ services: inv.services }] : []);
  if (!modules.length) return { ok: true, gaps, blockers };
  const dir = truthsPath(root, "func", loadDomainRegistry());
  if (!fs.existsSync(dir)) return { ok: true, gaps, blockers };
  const docText = fs
    .readdirSync(dir)
    .filter((n) => /\.md$/i.test(n) && !/^README/i.test(n))
    .map((n) => fs.readFileSync(path.join(dir, n), "utf8"))
    .join("\n")
    .toLowerCase();
  const codeMethods = new Set();
  for (const mod of modules) {
    for (const svc of mod.services || []) {
      for (const m of svc.methods || []) {
        const n = typeof m === "string" ? m : m.name;
        if (n && n.length > 2) codeMethods.add(String(n).toLowerCase());
      }
    }
  }
  if (!codeMethods.size) return { ok: true, gaps, blockers };
  const missing = [...codeMethods].filter((name) => !docText.includes(name));
  if (missing.length && missing.length >= Math.max(1, Math.ceil(codeMethods.size * 0.25))) {
    gaps.push({ missing_in_doc: missing.slice(0, 20) });
    blockers.push(`doc_method_drift:func:${missing.slice(0, 8).join("+")}`);
  }
  return { ok: blockers.length === 0, gaps, blockers };
}

export function detectRedisKeyDrift(root, redisInventory) {
  const gaps = [];
  const blockers = [];
  const inv = redisInventory || loadDomainInventory(root, "redis");
  if (!inv || !Array.isArray(inv.keys) || !inv.keys.length) {
    return { ok: true, gaps, blockers };
  }
  const codeKeys = [
    ...new Set(
      inv.keys
        .filter((k) => k.redis !== false)
        .map((k) => String(k.pattern || "").trim())
        .filter((p) => p && !isNoisePattern(p))
    ),
  ];
  if (!codeKeys.length) return { ok: true, gaps, blockers };

  const dir = truthsPath(root, "redis", loadDomainRegistry());
  if (!fs.existsSync(dir)) {
    gaps.push({ missing_in_doc: codeKeys.slice(0, 20) });
    blockers.push(`doc_key_drift:redis:${codeKeys.slice(0, 8).join("+")}`);
    return { ok: false, gaps, blockers };
  }
  const docText = fs
    .readdirSync(dir)
    .filter((n) => /\.md$/i.test(n) && !/^README/i.test(n))
    .map((n) => fs.readFileSync(path.join(dir, n), "utf8"))
    .join("\n");
  const docPatterns = new Set();
  for (const row of docText.match(/^\|\s*`([^`]+)`\s*\|/gm) || []) {
    const m = row.match(/`([^`]+)`/);
    if (m) docPatterns.add(m[1]);
  }
  for (const m of docText.matchAll(/`([^`]+)`/g)) {
    if (m[1] && !/\s/.test(m[1])) docPatterns.add(m[1]);
  }
  const missing = codeKeys.filter((p) => !docPatterns.has(p) && !docText.includes(p));
  if (missing.length) {
    gaps.push({ missing_in_doc: missing.slice(0, 20) });
    blockers.push(`doc_key_drift:redis:${missing.slice(0, 8).join("+")}`);
  }
  return { ok: blockers.length === 0, gaps, blockers };
}

/**
 * Normalize schedule token: `${prop:default}` → default; else raw.
 * 0.7.48
 */
export function normalizeScheduleToken(tok) {
  const s = String(tok ?? "").trim();
  if (!s) return "";
  const m = s.match(/^\$\{[^}:]+:([^}]*)\}$/);
  if (m) return m[1].trim();
  return s;
}

function scheduleTokenInDoc(docTextLower, tok) {
  const raw = String(tok || "").trim();
  if (!raw) return true;
  const norm = normalizeScheduleToken(raw);
  const candidates = [...new Set([raw, norm].filter(Boolean))];
  return candidates.some((c) => docTextLower.includes(c.toLowerCase()));
}

export function detectJobsTaskDrift(root, jobsInventory) {
  const gaps = [];
  const blockers = [];
  const inv = jobsInventory || loadDomainInventory(root, "jobs");
  if (!inv || !Array.isArray(inv.tasks) || !inv.tasks.length) {
    return { ok: true, gaps, blockers };
  }
  const codeTasks = inv.tasks
    .map((t) => String(t.task_code || t.slug || t.id || "").trim())
    .filter(Boolean);
  if (!codeTasks.length) return { ok: true, gaps, blockers };

  const dir = truthsPath(root, "jobs", loadDomainRegistry());
  if (!fs.existsSync(dir)) {
    gaps.push({ missing_in_doc: codeTasks.slice(0, 20) });
    blockers.push(`doc_task_drift:jobs:${codeTasks.slice(0, 8).join("+")}`);
    return { ok: false, gaps, blockers };
  }
  const docText = fs
    .readdirSync(dir)
    .filter((n) => /\.md$/i.test(n) && !/^README/i.test(n))
    .map((n) => fs.readFileSync(path.join(dir, n), "utf8"))
    .join("\n")
    .toLowerCase();
  const missing = codeTasks.filter((t) => !docText.includes(String(t).toLowerCase()));
  if (missing.length) {
    gaps.push({ missing_in_doc: missing.slice(0, 20) });
    blockers.push(`doc_task_drift:jobs:${missing.slice(0, 8).join("+")}`);
  }

  const missingSched = [];
  for (const t of inv.tasks) {
    const sched = t.scheduler || {};
    const tokens = [
      sched.cron,
      sched.fixedRate,
      sched.fixedDelay,
      sched.fixedRateString,
      sched.fixedDelayString,
    ]
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
    for (const tok of tokens) {
      if (!scheduleTokenInDoc(docText, tok)) {
        missingSched.push(`${t.task_code || t.slug || "?"}:${tok}`);
      }
    }
  }
  if (missingSched.length) {
    gaps.push({ missing_schedule_in_doc: missingSched.slice(0, 20) });
    blockers.push(`doc_schedule_drift:jobs:${missingSched.slice(0, 8).join("+")}`);
  }
  return { ok: blockers.length === 0, gaps, blockers };
}

/** Business section has real body (not heading-only). SG-2 */
export function hasBusinessBody(md) {
  const m = String(md || "").match(
    /##\s*(?:业务说明|表说明)\s*\n([\s\S]*?)(?=\n##\s+|$)/i
  );
  if (!m) {
    const inline = String(md || "").match(/用途[：:]\s*(.+)/);
    return !!(inline && inline[1].trim().length > 20 && !isEmptyOrHollow(inline[1]));
  }
  const body = m[1]
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*[|>].*/gm, "")
    .trim();
  if (body.length < 20) return false;
  if (/^TODO\(harness-eng\)/i.test(body)) return false;
  if (isEmptyOrHollow(body)) return false;
  return true;
}
