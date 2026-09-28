/**
 * Field-level doc ↔ inventory drift (0.7.25 SG-1).
 * Compares db inventory columns to docs/db/table field tables;
 * optionally api inventory DTO-ish field names vs api module field tables.
 */
import fs from "fs";
import path from "path";
import { loadDomainInventory } from "./inventory-paths.mjs";
import { truthsPath, loadDomainRegistry } from "./domains.mjs";
import { splitTableRows, isEmptyOrHollow } from "./doc-density.mjs";

function listTableDocs(root) {
  const dir = truthsPath(root, "db", loadDomainRegistry());
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^\d+-.*\.md$/i.test(n))
    .map((n) => path.join(dir, n));
}

/** Extract field names from ## 字段 table. */
export function parseDocFieldNames(md) {
  const sec = String(md || "").match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return [];
  const { headers, rows } = splitTableRows(sec[0]);
  if (!headers?.length || !rows.length) return [];
  const nameIdx = headers.findIndex((h) => /字段名|列名|name|column/i.test(h));
  const idx = nameIdx >= 0 ? nameIdx : 0;
  const names = [];
  for (const cells of rows) {
    const raw = (cells[idx] ?? "").replace(/`/g, "").trim();
    if (!raw || isEmptyOrHollow(raw) || /字段名|列名/.test(raw)) continue;
    names.push(raw);
  }
  return names;
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
 * @returns {{ ok: boolean, gaps: { table: string, missing_in_doc: string[], file?: string }[], blockers: string[] }}
 */
export function detectDbFieldDrift(root) {
  const inv = loadDomainInventory(root, "db");
  const gaps = [];
  const blockers = [];
  if (!inv || !Array.isArray(inv.tables) || !inv.tables.length) {
    return { ok: true, gaps, blockers };
  }
  const docs = listTableDocs(root);
  const byTable = new Map();
  for (const f of docs) {
    const md = fs.readFileSync(f, "utf8");
    const name = tableNameFromDoc(f, md);
    byTable.set(name, { file: f, fields: parseDocFieldNames(md) });
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
 * Lightweight api drift: inventory endpoint param/response names vs field tables in api modules.
 * Only flags when inventory has structured field lists.
 */
export function detectApiFieldDrift(root, apiInventory) {
  const gaps = [];
  const blockers = [];
  if (!apiInventory?.endpoints?.length) return { ok: true, gaps, blockers };
  const dir = truthsPath(root, "api", loadDomainRegistry());
  if (!fs.existsSync(dir)) return { ok: true, gaps, blockers };
  const docText = fs
    .readdirSync(dir)
    .filter((n) => /\.md$/i.test(n) && !/^README/i.test(n))
    .map((n) => fs.readFileSync(path.join(dir, n), "utf8"))
    .join("\n");
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
  if (!docFields.size) return { ok: true, gaps, blockers };
  const codeFields = new Set();
  for (const ep of apiInventory.endpoints) {
    for (const p of ep.params || ep.requestFields || []) {
      const n = typeof p === "string" ? p : p.name;
      if (n) codeFields.add(String(n).toLowerCase());
    }
    for (const p of ep.responseFields || ep.fields || []) {
      const n = typeof p === "string" ? p : p.name;
      if (n) codeFields.add(String(n).toLowerCase());
    }
  }
  if (!codeFields.size) return { ok: true, gaps, blockers };
  const missing = [...codeFields].filter((c) => !docFields.has(c));
  // Only block when a clear majority of code fields are missing (avoid false positive on sparse inventory)
  if (missing.length && missing.length >= Math.max(1, Math.ceil(codeFields.size * 0.5))) {
    gaps.push({ missing_in_doc: missing.slice(0, 20) });
    blockers.push(`doc_field_drift:api:${missing.slice(0, 8).join("+")}`);
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
