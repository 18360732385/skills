#!/usr/bin/env node
/**
 * harness-eng OpenAPI bridge (de-domainized). 从 docs/api/modules/*.md 生成 OpenAPI 3.0，供 Apifox import --format openapi。
 * 解析约定见 docs/api/templates/api-doc-template.md：
 *   接口地址 / 请求方式 / JSON 示例 + 字段表（参数名/类型/必填/说明）。
 * 字段表写入 schema.title / description / required / enum / x-apifox-enum，供 Apifox 设计页展示。
 * 基线列：参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值（「枚举」「备注」可选；无则仍从说明解析枚举）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const modulesDir = path.join(repoRoot, "docs/api/modules");
const outFile = path.join(repoRoot, "docs/api/generated/openapi.json");

const RESP_ENVELOPE = {
  code: {
    type: "string",
    example: "1000",
    title: "响应码",
    description: "业务码，成功一般为 1000",
  },
  type: {
    type: "string",
    enum: ["S", "E"],
    title: "响应类型",
    description: "S 成功 / E 错误",
    "x-apifox-enum": [
      { value: "S", name: "成功", description: "成功" },
      { value: "E", name: "错误", description: "错误" },
    ],
  },
  msg: { type: "string", title: "响应消息", description: "英文简述" },
  desc: { type: "string", title: "响应描述", description: "中文描述" },
  data: { title: "业务数据", description: "业务数据" },
};

function inferSchema(value) {
  if (value === null) return { nullable: true };
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length ? inferSchema(value[0]) : {},
    };
  }
  const t = typeof value;
  if (t === "string") return { type: "string", example: value };
  if (t === "number")
    return Number.isInteger(value)
      ? { type: "integer", example: value }
      : { type: "number", example: value };
  if (t === "boolean") return { type: "boolean", example: value };
  if (t === "object") {
    const properties = {};
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferSchema(v);
    }
    return { type: "object", properties };
  }
  return {};
}

function extractFirstJson(block) {
  if (!block) return null;
  const m = block.match(/```json\s*([\s\S]*?)```/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch {
    return null;
  }
}

function splitEndpointSections(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const hm = line.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (hm) {
      if (current) sections.push(current);
      current = { num: hm[1], title: hm[2].trim(), body: "" };
      continue;
    }
    if (current) current.body += line + "\n";
  }
  if (current) sections.push(current);
  return sections.filter((s) => /\*\*接口地址/.test(s.body));
}

function sliceUntilNextH3(mdFromHeading) {
  if (!mdFromHeading) return "";
  const lines = mdFromHeading.split(/\r?\n/);
  const out = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (/^###\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n");
}

/** 提取模块级 `### 标题` 正文（至下一个 ### / ## 止） */
function extractH3Section(md, title) {
  const re = new RegExp(`###\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`);
  const idx = md.search(re);
  if (idx < 0) return "";
  const lines = md.slice(idx).split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (/^###\s/.test(lines[i]) || /^##\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

/** 模块内「共用入参 / 共用出参」等公共小节 */
function buildSharedSections(md) {
  const sections = {};
  for (const title of ["共用入参", "共用出参"]) {
    const body = extractH3Section(md, title);
    if (body) sections[title] = body;
  }
  return sections;
}

/** 「见「共用入参」」类引用（须在行首，避免正文「勿写见…」误匹配） */
function parseSeeSharedRef(block) {
  const m = block.match(/(?:^|\n)\s*见[「『]([^」』]+)[」』]/);
  return m ? m[1].trim() : null;
}

function isYesAbCell(cell) {
  const t = stripMd(cell || "");
  return t === "是" || t.startsWith("是（") || t.startsWith("是(");
}

function isIgnoredAbCell(cell) {
  const t = stripMd(cell || "");
  return t.startsWith("无（") || t.startsWith("无(");
}

/** A=async、B=cache；共用入参表 A/B 列选必填 */
function inferAbMode(apiPath) {
  if (apiPath.includes("/async")) return "A";
  if (apiPath.includes("/cache")) return "B";
  return null;
}

/**
 * 「见『共用*』」且另有本地字段表时：本地表会整表覆盖共用表。
 * 若本地缺共用表字段 → 抛错，避免 Apifox 再丢条件字段（如 SO1 scene）。
 */
function assertSharedRefLocalCoverage(block, sharedSections, { abMode, label } = {}) {
  const ref = parseSeeSharedRef(block);
  if (!ref || !sharedSections[ref]) return;
  const localRows = parseFieldRows(block, { abMode });
  if (!localRows.length) return;
  const sharedRows = parseFieldRows(sharedSections[ref], { abMode });
  if (!sharedRows.length) return;
  const localPaths = new Set(localRows.map((r) => r.path));
  const missing = sharedRows.map((r) => r.path).filter((p) => !localPaths.has(p));
  if (!missing.length) return;
  const where = label || ref;
  throw new Error(
    `quality: ${where} 写了「见『${ref}』」却用本地残缺字段表覆盖，缺少: ${missing.join(", ")}。` +
      `请删除本地字段表（只保留 JSON 示例），或把本地表补全为共用表字段全集。`
  );
}

/**
 * 共用入参 JSON 示例须覆盖字段表全部顶层键（Apifox 调试体靠 example；表有键而 JSON 缺 → 联调看不到）。
 */
function assertSharedRequestExampleCoversTable(file, sharedBody) {
  if (!sharedBody) return;
  const example = extractFirstJson(sharedBody);
  const rows = parseFieldRows(sharedBody, {});
  if (!example || typeof example !== "object" || Array.isArray(example) || !rows.length) {
    return;
  }
  const tableTops = new Set();
  for (const row of rows) {
    const top = String(row.path || "").split(/[.\[\]]/)[0];
    if (top) tableTops.add(top);
  }
  const missing = [...tableTops].filter((k) => !(k in example));
  if (missing.length) {
    throw new Error(
      `quality: ${file} 「共用入参」JSON 示例缺少字段表顶层键: ${missing.join(", ")}。` +
        `请把条件字段写进共用 JSON（勿只写在差异矩阵/本地最小体）。`
    );
  }
}

/**
 * 接口节「见共用」解析后的 example 须含共用 JSON 全部顶层键（防 prefer-shared 被回退或漏合并）。
 */
function assertResolvedExampleCoversShared(label, resolvedExample, sharedBody) {
  if (!sharedBody || resolvedExample == null || typeof resolvedExample !== "object") return;
  const sharedExample = extractFirstJson(sharedBody);
  if (!sharedExample || typeof sharedExample !== "object" || Array.isArray(sharedExample)) return;
  const missing = Object.keys(sharedExample).filter((k) => !(k in resolvedExample));
  if (missing.length) {
    throw new Error(
      `quality: ${label} 见共用后 example 缺少共用键: ${missing.join(", ")}` +
        `（本地最小体不应覆盖共用入参/出参全集）`
    );
  }
}

/** 接口小节无 JSON/字段表时，回退到模块「共用*」小节；有「见共用」时示例优先用共用全集（避免本地最小体覆盖导致 Apifox 缺字段） */
function resolveSharedExampleAndRows(block, sharedSections, { abMode } = {}) {
  const localExample = extractFirstJson(block);
  let localRows = parseFieldRows(block, { abMode });
  const ref = parseSeeSharedRef(block);
  const shared = ref && sharedSections[ref] ? sharedSections[ref] : "";
  if (!shared) {
    return { example: localExample, rows: localRows, sharedRef: ref };
  }
  const sharedExample = extractFirstJson(shared);
  const sharedRows = parseFieldRows(shared, { abMode });
  return {
    example: sharedExample ?? localExample,
    rows: localRows.length ? localRows : sharedRows,
    sharedRef: ref,
  };
}

function splitRow(line) {
  const t = line.trim();
  if (!t.startsWith("|")) return [];
  const inner = t.startsWith("|") ? t.slice(1) : t;
  const end = inner.endsWith("|") ? inner.slice(0, -1) : inner;
  return end.split("|").map((c) => c.trim());
}

function isSeparator(line) {
  return /^\s*\|?\s*:?-{3,}/.test(line || "");
}

function stripMd(s) {
  return String(s || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function parseMarkdownTables(block) {
  if (!block) return [];
  const lines = block.split(/\r?\n/);
  const tables = [];
  let i = 0;
  let inFence = false;
  while (i < lines.length) {
    if (/^```/.test(lines[i].trim())) {
      inFence = !inFence;
      i += 1;
      continue;
    }
    if (
      !inFence &&
      lines[i].includes("|") &&
      isSeparator(lines[i + 1])
    ) {
      const headers = splitRow(lines[i]).map(stripMd);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && !isSeparator(lines[i])) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      tables.push({ headers, rows });
      continue;
    }
    i += 1;
  }
  return tables;
}

function colIndex(headers, names) {
  return headers.findIndex((h) => names.includes(h));
}

function parseFieldRows(block, { abMode } = {}) {
  const rows = [];
  for (const table of parseMarkdownTables(block)) {
    const nameIdx = colIndex(table.headers, ["参数名", "字段"]);
    const typeIdx = colIndex(table.headers, ["类型"]);
    const reqIdx = colIndex(table.headers, ["必填"]);
    const abAIdx = colIndex(table.headers, ["A"]);
    const abBIdx = colIndex(table.headers, ["B"]);
    const descIdx = colIndex(table.headers, ["说明"]);
    const enumIdx = colIndex(table.headers, ["枚举"]);
    const remarkIdx = colIndex(table.headers, ["备注"]);
    const exampleIdx = colIndex(table.headers, ["示例值", "示例"]);
    const defaultIdx = colIndex(table.headers, ["默认"]);
    if (nameIdx < 0 || descIdx < 0) continue;
    const useAb = reqIdx < 0 && abAIdx >= 0 && abBIdx >= 0;
    for (const cells of table.rows) {
      const name = stripMd(cells[nameIdx] || "");
      if (!name || name === "-" || name === "—") continue;
      const requiredRaw = reqIdx >= 0 ? stripMd(cells[reqIdx] || "") : "";
      let required = requiredRaw === "是";
      if (useAb) {
        const aCell = cells[abAIdx] || "";
        const bCell = cells[abBIdx] || "";
        if (abMode === "A") {
          required = isYesAbCell(aCell) && !isIgnoredAbCell(aCell);
        } else if (abMode === "B") {
          required = isYesAbCell(bCell);
        } else {
          required =
            (isYesAbCell(aCell) && !isIgnoredAbCell(aCell)) || isYesAbCell(bCell);
        }
      }
      rows.push({
        path: name,
        type: typeIdx >= 0 ? stripMd(cells[typeIdx] || "") : "",
        required,
        description: (cells[descIdx] || "").trim(),
        enumText: enumIdx >= 0 ? stripMd(cells[enumIdx] || "") : "",
        remark: remarkIdx >= 0 ? (cells[remarkIdx] || "").trim() : "",
        example: exampleIdx >= 0 ? stripMd(cells[exampleIdx] || "") : "",
        default: defaultIdx >= 0 ? stripMd(cells[defaultIdx] || "") : "",
      });
    }
  }
  return rows;
}

function mapMdType(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/\s+/g, "");
  const arrayMatch =
    s.match(/^array\[(.+)\]$/) ||
    (s.endsWith("[]") && s !== "[]" ? [s, s.slice(0, -2)] : null);
  if (s === "array") return { type: "array", items: {} };
  if (s === "object[]") return { type: "array", items: { type: "object" } };
  if (arrayMatch) {
    const inner = mapMdType(arrayMatch[1]);
    return { type: "array", items: inner || {} };
  }
  if (["int", "integer", "long", "bigint"].includes(s)) return { type: "integer" };
  if (["number", "float", "double", "decimal"].includes(s)) return { type: "number" };
  if (["boolean", "bool"].includes(s)) return { type: "boolean" };
  if (["object", "json", "map"].includes(s)) return { type: "object" };
  if (["string", "date", "datetime", "text"].includes(s)) return { type: "string" };
  return null;
}

function looksLikeEnumOnly(s) {
  return /^\d/.test(s) || /^[A-Z][A-Z0-9_]*\s*[=：:]/.test(s);
}

function extractTitle(desc) {
  if (!desc) return undefined;
  const plain = desc.replace(/`/g, "");
  const colon = plain.split(/[：:]/);
  if (colon.length >= 2) {
    const head = colon[0].trim();
    if (head && head.length <= 24 && !looksLikeEnumOnly(head)) {
      return head;
    }
  }
  const paren = plain.split(/[（(]/)[0].trim();
  if (
    paren &&
    paren.length < plain.length &&
    paren.length <= 24 &&
    !looksLikeEnumOnly(paren)
  ) {
    return paren;
  }
  const comma = plain.split(/[，,；;]/)[0].trim();
  if (
    comma &&
    comma.length < plain.length &&
    comma.length <= 24 &&
    !looksLikeEnumOnly(comma) &&
    !/=/.test(comma)
  ) {
    return comma;
  }
  if (plain.length <= 16 && !looksLikeEnumOnly(plain)) {
    return plain.replace(/[。．.]+$/, "");
  }
  return undefined;
}

function extractEnum(desc) {
  if (!desc) return null;

  const named = [
    ...desc.matchAll(/\b([A-Z][A-Z0-9_]{1,32})\s*[=：:]\s*([^\s,，;；/=]{1,20})/g),
  ];
  if (named.length >= 2) {
    return named.map((m) => ({
      value: m[1],
      name: m[2].replace(/[。．.]+$/, ""),
      description: m[2].replace(/[。．.]+$/, ""),
    }));
  }

  const numLabeled = [
    ...desc.matchAll(/(\d+)\s*[-–=：:]\s*([^\d,，;；/]{1,24}?)(?=\s*(?:[,，;；/]|$|\d+\s*[-–=：:]))/g),
  ];
  if (numLabeled.length >= 2) {
    return numLabeled.map((m) => ({
      value: Number(m[1]),
      name: m[2].replace(/[。．.]+$/, ""),
      description: m[2].replace(/[。．.]+$/, ""),
    }));
  }

  const yn = [...desc.matchAll(/(\d+)\s*(否|是)/g)];
  if (yn.length >= 2) {
    return yn.map((m) => ({
      value: Number(m[1]),
      name: m[2],
      description: m[2],
    }));
  }

  const ticks = [...desc.matchAll(/`([^`]+)`/g)]
    .map((m) => m[1].trim())
    .filter((v) => /^[A-Z][A-Z0-9_]*$/.test(v) || /^[A-Z]$/.test(v));
  const uniq = [...new Set(ticks)];
  if (uniq.length >= 2 && uniq.length <= 24) {
    return uniq.map((v) => ({ value: v, name: v, description: "" }));
  }

  return null;
}

function extractModuleEnums(md) {
  const enums = [];
  const re = /\*\*([^*]{1,40}枚举[^*]{0,40})\*\*|###\s+(.{0,40}枚举.{0,40})/g;
  let m;
  while ((m = re.exec(md))) {
    const name = (m[1] || m[2] || "").trim();
    const rest = md.slice(m.index);
    const tables = parseMarkdownTables(rest.slice(0, 2000));
    const table = tables[0];
    if (!table) continue;
    const valueIdx = colIndex(table.headers, ["值"]);
    const meaningIdx = colIndex(table.headers, ["含义", "用途", "说明"]);
    if (valueIdx < 0 || meaningIdx < 0) continue;
    const values = [];
    for (const cells of table.rows) {
      const raw = stripMd(cells[valueIdx] || "");
      if (!raw) continue;
      const meaning = (cells[meaningIdx] || "").trim();
      const num = /^-?\d+$/.test(raw) ? Number(raw) : raw;
      values.push({ value: num, name: meaning || String(raw), description: meaning });
    }
    if (values.length >= 2) enums.push({ name, values });
  }
  return enums;
}

function resolveModuleEnum(desc, moduleEnums, mdType) {
  if (!desc || !moduleEnums.length) return null;
  if (!/枚举/.test(desc)) return null;
  const named = desc.match(/`([A-Za-z][A-Za-z0-9_]*)`\s*枚举/) || desc.match(/见下表\s*`?([A-Za-z][A-Za-z0-9_]*)`?/);
  if (named) {
    const hit = moduleEnums.find((e) => e.name.includes(named[1]));
    if (hit) return hit.values;
  }
  const wantInt = /int|long|integer/i.test(mdType || "");
  const candidates = moduleEnums.filter((e) => {
    const ints = e.values.every((v) => typeof v.value === "number");
    return wantInt ? ints : !ints || /类型枚举/.test(desc);
  });
  if (/类型枚举|枚举见上/.test(desc) && candidates.length >= 1) {
    return (wantInt
      ? candidates.find((e) => e.values.every((v) => typeof v.value === "number"))
      : candidates[0]
    )?.values;
  }
  return null;
}

function tokenizePath(p) {
  return p
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyNode() {
  return {};
}

function ensureProperty(schema, name, asArray) {
  if (!schema || typeof schema !== "object") return emptyNode();
  if (schema.type && schema.type !== "object" && schema.type !== "array") {
    schema.type = "object";
  }
  if (schema.type === "array") {
    schema.items = schema.items || { type: "object", properties: {} };
    return ensureProperty(schema.items, name, asArray);
  }
  schema.type = schema.type || "object";
  schema.properties = schema.properties || {};
  if (!schema.properties[name]) {
    schema.properties[name] = asArray
      ? { type: "array", items: { type: "object", properties: {} } }
      : emptyNode();
  }
  const node = schema.properties[name];
  if (asArray) {
    if (node.type !== "array") {
      const prev = { ...node };
      delete prev.type;
      delete prev.properties;
      schema.properties[name] = {
        ...prev,
        type: "array",
        items: node.properties
          ? { type: "object", properties: node.properties, required: node.required }
          : { type: "object", properties: {} },
      };
    }
    const arr = schema.properties[name];
    arr.items = arr.items && Object.keys(arr.items).length ? arr.items : { type: "object", properties: {} };
    return arr;
  }
  return node;
}

function addRequired(schema, name) {
  if (!schema || !name) return;
  const target =
    schema.type === "array" ? (schema.items ||= { type: "object", properties: {} }) : schema;
  if (target.type && target.type !== "object") return;
  target.type = target.type || "object";
  target.required = Array.from(new Set([...(target.required || []), name]));
}

function applyTypeHint(node, hint) {
  if (!hint || !node) return;
  if (!node.type) {
    node.type = hint.type;
    if (hint.items && !node.items) node.items = { ...hint.items };
  } else if (node.type === "array" && hint.items && (!node.items || !node.items.type)) {
    node.items = { ...(node.items || {}), ...hint.items };
  }
}

function coerceScalar(raw, type) {
  if (raw == null || raw === "" || raw === "—" || raw === "-") return undefined;
  if (type === "integer") {
    const n = Number(raw);
    return Number.isInteger(n) ? n : undefined;
  }
  if (type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  if (type === "boolean") {
    if (raw === "true" || raw === "是") return true;
    if (raw === "false" || raw === "否") return false;
  }
  return raw;
}

function isBlankMeta(s) {
  const t = (s || "").trim();
  return !t || t === "-" || t === "—";
}

function applyFieldMeta(node, row, moduleEnums) {
  const hint = mapMdType(row.type);
  applyTypeHint(node, hint);
  const meaning = (row.description || "").trim();
  const remark = (row.remark || "").trim();
  const enumCell = (row.enumText || "").trim();

  if (meaning) {
    const title = extractTitle(meaning);
    if (title) node.title = title;
    else if (
      meaning.length <= 24 &&
      !/`/.test(meaning) &&
      !looksLikeEnumOnly(meaning)
    ) {
      node.title = meaning;
    }
  }

  const descParts = [];
  if (meaning) descParts.push(meaning);
  if (!isBlankMeta(remark)) descParts.push(stripMd(remark));
  if (descParts.length) node.description = descParts.join("；");

  const enumSource = !isBlankMeta(enumCell) ? enumCell : meaning;
  const enumerated =
    extractEnum(enumSource) ||
    resolveModuleEnum(enumSource || meaning, moduleEnums, row.type);
  if (enumerated) {
    node.enum = enumerated.map((e) => e.value);
    node["x-apifox-enum"] = enumerated;
    if (!node.title) {
      const labels = enumerated
        .filter((e) => e.name && e.name !== String(e.value))
        .map((e) => e.name);
      if (labels.length >= 2 && labels.every((n) => n.length <= 16)) {
        node.title = labels.join("/");
      }
    }
  }
  if (row.example && node.example === undefined) {
    const ex = coerceScalar(row.example, node.type);
    if (ex !== undefined) node.example = ex;
  }
  if (row.default && node.default === undefined) {
    const d = coerceScalar(row.default, node.type);
    if (d !== undefined) node.default = d;
  }
}

function applyRowsToSchema(schema, rows, moduleEnums) {
  if (!schema || !rows.length) return schema;
  for (const row of rows) {
    const tokens = tokenizePath(row.path);
    if (!tokens.length) continue;
    let current = schema;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const asArray = token.endsWith("[]");
      const name = asArray ? token.slice(0, -2) : token;
      const isLeaf = i === tokens.length - 1;
      const node = ensureProperty(current, name, asArray);
      if (isLeaf) {
        if (asArray) {
          applyFieldMeta(node, row, moduleEnums);
        } else {
          applyFieldMeta(node, row, moduleEnums);
        }
        if (row.required) addRequired(current, name);
      } else if (asArray) {
        current = node.items || (node.items = { type: "object", properties: {} });
        if (!current.type || current.type === "array") {
          current.type = "object";
          current.properties = current.properties || {};
        }
      } else {
        if (node.type === "array") {
          current = node.items || (node.items = { type: "object", properties: {} });
        } else {
          current = node;
        }
      }
    }
  }
  return schema;
}

function decorateEnvelope(schema) {
  if (!schema || schema.$ref || schema.type === "array") return schema;
  schema.type = schema.type || "object";
  schema.properties = schema.properties || {};
  for (const [k, meta] of Object.entries(RESP_ENVELOPE)) {
    if (!schema.properties[k]) continue;
    const node = schema.properties[k];
    if (!node.title && meta.title) node.title = meta.title;
    if (!node.description && meta.description) node.description = meta.description;
    if (meta.enum && !node.enum) {
      node.enum = meta.enum;
      node["x-apifox-enum"] = meta["x-apifox-enum"];
    }
  }
  return schema;
}

function schemaFromExample(example, { envelope } = {}) {
  if (example == null) {
    if (!envelope) return { type: "object" };
    return {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(RESP_ENVELOPE).map(([k, v]) => [k, { ...v }])
      ),
    };
  }
  const schema = inferSchema(example);
  if (envelope) decorateEnvelope(schema);
  return schema;
}

function getJsonSchema(operation, which) {
  if (which === "request") {
    return operation.requestBody?.content?.["application/json"]?.schema;
  }
  return operation.responses?.["200"]?.content?.["application/json"]?.schema;
}

function setJsonSchema(operation, which, schema) {
  if (which === "request") {
    operation.requestBody = operation.requestBody || {
      required: true,
      content: { "application/json": {} },
    };
    operation.requestBody.content["application/json"].schema = schema;
    return;
  }
  operation.responses["200"].content = operation.responses["200"].content || {
    "application/json": {},
  };
  operation.responses["200"].content["application/json"].schema = schema;
}

function isThinSchema(schema) {
  if (!schema) return true;
  if (schema.$ref) return true;
  const data = schema.properties?.data;
  if (!data) return true;
  if (data.type === "array") {
    const items = data.items || {};
    return !items.properties || !Object.keys(items.properties).length;
  }
  if (data.type === "object") {
    return !data.properties || !Object.keys(data.properties).length;
  }
  return !data.type && !data.properties;
}

function findByTitle(endpoints, name, file) {
  const inFile = endpoints.filter((e) => e.file === file);
  const pools = [inFile, endpoints];
  for (const pool of pools) {
    const exact = pool.find((e) => e.title === name);
    if (exact) return exact;
  }
  for (const pool of pools) {
    const hits = pool.filter((e) => e.title.includes(name) || name.includes(e.title));
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) {
      const prefer = hits.find((e) => e.title.startsWith(name) || name.startsWith(e.title));
      if (prefer) return prefer;
    }
  }
  return null;
}

function findPreviousList(ep, endpoints) {
  const inFile = endpoints.filter((e) => e.file === ep.file);
  const idx = inFile.indexOf(ep);
  for (let i = idx - 1; i >= 0; i--) {
    const data = getJsonSchema(inFile[i].operation, "response")?.properties?.data;
    if (data?.type === "array" && data.items?.properties) return inFile[i];
  }
  return null;
}

function parseSameAs(resBlock) {
  const text = resBlock || "";
  const listItem = /字段同列表项|字段同列表/.test(text);
  const asObject = /单个对象/.test(text);
  const m =
    text.match(/(?:结构同|字段同)「([^」]+)」/) ||
    text.match(/与「([^」]+)」相同(?:结构)?/) ||
    text.match(/(?:^|\n)[\s`]*同「([^」]+)」/);
  return {
    title: m ? m[1] : null,
    listItem,
    asObject: asObject || listItem,
  };
}

function resolveSameAs(endpoints) {
  let changed = 0;
  for (let round = 0; round < 5; round++) {
    let roundHits = 0;
    for (const ep of endpoints) {
      const hint = parseSameAs(ep.resBlock);
      if (!hint.title && !hint.listItem) continue;
      const current = getJsonSchema(ep.operation, "response");
      if (!isThinSchema(current)) continue;

      let source = null;
      if (hint.listItem) source = findPreviousList(ep, endpoints);
      if (!source && hint.title) source = findByTitle(endpoints, hint.title, ep.file);
      if (!source || source === ep) continue;
      const srcSchema = getJsonSchema(source.operation, "response");
      if (!srcSchema || srcSchema.$ref || isThinSchema(srcSchema)) continue;

      const cloned = structuredClone(srcSchema);
      if (hint.asObject && cloned.properties?.data?.type === "array") {
        cloned.properties.data = structuredClone(cloned.properties.data.items || {});
        cloned.properties.data.type = cloned.properties.data.type || "object";
      }
      setJsonSchema(ep.operation, "response", cloned);
      applyRowsToSchema(getJsonSchema(ep.operation, "response"), ep.resRows, ep.moduleEnums);
      decorateEnvelope(getJsonSchema(ep.operation, "response"));
      roundHits += 1;
    }
    changed += roundHits;
    if (!roundHits) break;
  }
  return changed;
}

function parseEndpoint(section, tag, moduleEnums, sharedSections = {}) {
  const { title, body } = section;
  const pathMatch = body.match(/\*\*接口地址[:：]?\*\*[：:]?\s*`([^`]+)`/);
  const methodMatch = body.match(/\*\*请求方式[:：]?\*\*[：:]?\s*([A-Za-z]+)/);
  if (!pathMatch || !methodMatch) return null;

  const apiPath = pathMatch[1].trim();
  const method = methodMatch[1].trim().toLowerCase();
  const descMatch = body.match(/\*\*功能描述[:：]?\*\*[：:]?\s*(.+)/);
  const description = descMatch ? descMatch[1].trim() : title;
  const abMode = inferAbMode(apiPath);

  const reqIdx = body.search(/###\s*请求参数/);
  const resIdx = body.search(/###\s*响应参数/);
  const reqBlock =
    reqIdx >= 0
      ? sliceUntilNextH3(body.slice(reqIdx, resIdx >= 0 ? resIdx : undefined))
      : "";
  const resBlock = resIdx >= 0 ? sliceUntilNextH3(body.slice(resIdx)) : "";

  const epLabel = `${tag} ${apiPath}`;
  assertSharedRefLocalCoverage(reqBlock, sharedSections, {
    abMode,
    label: `${epLabel} 请求参数`,
  });
  assertSharedRefLocalCoverage(resBlock, sharedSections, {
    label: `${epLabel} 响应参数`,
  });

  const { example: requestExample, rows: reqRows, sharedRef: reqSharedRef } =
    resolveSharedExampleAndRows(reqBlock, sharedSections, { abMode });
  const { example: responseExample, rows: resRows, sharedRef: resSharedRef } =
    resolveSharedExampleAndRows(resBlock, sharedSections, {});

  if (reqSharedRef && sharedSections[reqSharedRef]) {
    assertResolvedExampleCoversShared(
      `${epLabel} 请求`,
      requestExample,
      sharedSections[reqSharedRef]
    );
  }
  if (resSharedRef && sharedSections[resSharedRef]) {
    assertResolvedExampleCoversShared(
      `${epLabel} 响应`,
      responseExample,
      sharedSections[resSharedRef]
    );
  }

  const responseSchema = decorateEnvelope(
    applyRowsToSchema(
      schemaFromExample(responseExample, { envelope: true }),
      resRows,
      moduleEnums
    )
  );

  const operation = {
    tags: [tag],
    summary: title,
    description,
    operationId: `${method}_${apiPath.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "")}`,
    security: [{ BearerAuth: [] }, { AccessToken: [] }],
    responses: {
      "200": {
        description: "成功或业务错误（见 body.code）",
        content: {
          "application/json": {
            schema:
              responseExample || resRows.length
                ? responseSchema
                : { $ref: "#/components/schemas/Resp" },
            ...(responseExample ? { example: responseExample } : {}),
          },
        },
      },
    },
  };

  if (method !== "get" && method !== "delete") {
    const hasBody =
      requestExample !== null ||
      reqRows.length > 0 ||
      !/无\s*Body|无请求体|无参数/i.test(reqBlock);
    if (hasBody) {
      const requestSchema = applyRowsToSchema(
        schemaFromExample(requestExample, { envelope: false }),
        reqRows,
        moduleEnums
      );
      operation.requestBody = {
        required: requestExample !== null || reqRows.some((r) => r.required),
        content: {
          "application/json": {
            schema: requestSchema,
            ...(requestExample ? { example: requestExample } : {}),
          },
        },
      };
    }
  }

  return {
    apiPath,
    method,
    operation,
    title,
    reqRows,
    resRows,
    resBlock,
    moduleEnums,
  };
}

function countMeta(schema, acc = { withDesc: 0, total: 0 }) {
  if (!schema || typeof schema !== "object") return acc;
  if (schema.$ref) return acc;
  if (schema.properties) {
    for (const v of Object.values(schema.properties)) {
      acc.total += 1;
      if (v.description || v.title) acc.withDesc += 1;
      countMeta(v, acc);
    }
  }
  if (schema.items) countMeta(schema.items, acc);
  return acc;
}

function assertQuality(openapi) {
  // De-domainized: no repo-specific path assertions. Generic checks only.
  if (!openapi?.paths || typeof openapi.paths !== "object") {
    throw new Error("quality: OpenAPI paths missing");
  }
  const n = Object.keys(openapi.paths).length;
  if (n === 0) {
    console.warn("quality: OpenAPI paths empty (no endpoints parsed)");
  }
}

function selfTest() {
  const yn = extractEnum("是否默认：0否 1是");
  if (!yn || yn[0].value !== 0 || yn[1].name !== "是") {
    throw new Error("self-test: 0否 1是");
  }
  if (extractTitle("主键；空则新增") !== "主键") {
    throw new Error("self-test: title semicolon");
  }
  const dash = extractEnum("0-禁用，1-启用");
  if (!dash || dash[0].name !== "禁用" || dash[1].value !== 1) {
    throw new Error("self-test: 0-禁用");
  }
  const spaced = extractEnum("0-不对外 MCP 暴露，1-对外 MCP 暴露");
  if (!spaced || !String(spaced[0].name).includes("不对外") || spaced[1].value !== 1) {
    throw new Error("self-test: spaced enum name");
  }
  const named = extractEnum("PUBLISHED=已部署，PENDING=待部署");
  if (!named || named[0].value !== "PUBLISHED" || named[1].name !== "待部署") {
    throw new Error("self-test: named enum");
  }
  const ticks = extractEnum("`GUIDE_TYPE` / `GUIDE_INFO` / `PREVIEW`");
  if (!ticks || ticks.length !== 3 || ticks[0].value !== "GUIDE_TYPE") {
    throw new Error("self-test: backtick enum");
  }
  if (extractEnum("扩展参数 JSON；`temperature`/`maxTokens` 覆盖")) {
    throw new Error("self-test: 不应把普通反引号当成枚举");
  }
  if (extractTitle("是否默认：0否 1是") !== "是否默认") {
    throw new Error("self-test: title colon");
  }
  if (extractTitle("填报会话 ID（通常等于 conversationId）") !== "填报会话 ID") {
    throw new Error("self-test: title paren");
  }
  const schema = applyRowsToSchema(
    { type: "object", properties: { data: { type: "array", items: {} } } },
    [
      {
        path: "data[].id",
        type: "long",
        required: true,
        description: "主键",
        example: "",
        default: "",
      },
    ],
    []
  );
  if (schema.properties.data.items.properties.id.title !== "主键") {
    throw new Error("self-test: path data[].id");
  }
  const splitCols = applyRowsToSchema(
    { type: "object", properties: {} },
    [
      {
        path: "deployStatus",
        type: "string",
        required: true,
        description: "发布状态",
        enumText: "PENDING=待发布 / PUBLISHED=已发布",
        remark: "部署后变为 PUBLISHED",
        example: "PUBLISHED",
        default: "",
      },
    ],
    []
  );
  const ds = splitCols.properties.deployStatus;
  if (ds.title !== "发布状态") {
    throw new Error("self-test: 说明列 title");
  }
  if (!ds.enum?.includes("PENDING") || !ds.enum?.includes("PUBLISHED")) {
    throw new Error("self-test: 枚举列 enum");
  }
  if (!String(ds.description || "").includes("部署后")) {
    throw new Error("self-test: 备注并入 description");
  }
  const sharedMd = [
    "### 共用入参",
    "",
    "```json",
    '{"reportId":"r1","reportType":"1"}',
    "```",
    "",
    "| 参数名 | 类型 | A | B | 说明 | 示例值 |",
    "|---|---|---|---|---|---|",
    "| reportId | string | **是** | **是** | 报告 ID | r1 |",
    "| triggerIfMiss | boolean | 无（忽略） | 否 | 缺省 true | true |",
  ].join("\n");
  const sharedSections = buildSharedSections(sharedMd);
  if (!sharedSections["共用入参"]) {
    throw new Error("self-test: buildSharedSections");
  }
  const resolved = resolveSharedExampleAndRows(
    "见「共用入参」。",
    sharedSections,
    { abMode: "A" }
  );
  if (!resolved.example?.reportId || resolved.rows.length !== 2) {
    throw new Error("self-test: resolveSharedExampleAndRows");
  }
  if (resolved.rows.find((r) => r.path === "reportId")?.required !== true) {
    throw new Error("self-test: abMode A reportId required");
  }
  if (resolved.rows.find((r) => r.path === "triggerIfMiss")?.required !== false) {
    throw new Error("self-test: abMode A triggerIfMiss ignored");
  }
  const preferShared = resolveSharedExampleAndRows(
    ['见「共用入参」。', "", "```json", '{"reportId":"only-local"}', "```"].join("\n"),
    sharedSections,
    { abMode: "A" }
  );
  if (preferShared.example?.reportId !== "r1" || preferShared.example?.reportType !== "1") {
    throw new Error("self-test: 见共用时示例须优先共用全集，不被本地最小体覆盖");
  }
  try {
    assertSharedRequestExampleCoversTable(
      "self-test.md",
      [
        "```json",
        '{"reportId":"r1"}',
        "```",
        "",
        "| 参数名 | 类型 | A | B | 说明 | 示例值 |",
        "|---|---|---|---|---|---|",
        "| reportId | string | 是 | 是 | 报告 ID | r1 |",
        "| scene | string | 否 | 否 | SO1 场景 | RETURN_ADD |",
      ].join("\n")
    );
    throw new Error("self-test: 共用 JSON 缺表字段应抛错");
  } catch (e) {
    if (!String(e.message).includes("缺少字段表顶层键: scene")) {
      throw e;
    }
  }

  assertSharedRefLocalCoverage("见「共用入参」。", sharedSections, { abMode: "A" });
  try {
    assertSharedRefLocalCoverage(
      [
        "见「共用入参」。",
        "",
        "| 参数名 | 类型 | 必填 | 说明 | 示例值 |",
        "|---|---|---|---|---|",
        "| reportId | string | 是 | 报告 ID | r1 |",
      ].join("\n"),
      sharedSections,
      { abMode: "A", label: "self-test" }
    );
    throw new Error("self-test: 残缺覆盖应抛错");
  } catch (e) {
    if (!String(e.message).includes("缺少: triggerIfMiss")) {
      throw e;
    }
  }
}

function main() {
  selfTest();

  const files = fs
    .readdirSync(modulesDir)
    .filter((f) => {
      const glob = process.env.OPENAPI_MODULES_GLOB || "";
      if (glob) {
        const re = new RegExp(
          "^" +
            glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
            "$"
        );
        return re.test(f);
      }
      return f.endsWith(".md") && !f.startsWith("_");
    })
    .sort();

  const paths = {};
  const endpoints = [];

  for (const file of files) {
    const md = fs.readFileSync(path.join(modulesDir, file), "utf8");
    const tagName = file.replace(/\.md$/, "");
    const moduleEnums = extractModuleEnums(md);
    const sharedSections = buildSharedSections(md);
    assertSharedRequestExampleCoversTable(file, sharedSections["共用入参"]);

    for (const section of splitEndpointSections(md)) {
      const parsed = parseEndpoint(section, tagName, moduleEnums, sharedSections);
      if (!parsed) continue;
      parsed.file = file;
      endpoints.push(parsed);
      const { apiPath, method, operation } = parsed;
      if (!paths[apiPath]) paths[apiPath] = {};
      paths[apiPath][method] = operation;
    }
  }

  const sameAs = resolveSameAs(endpoints);

  const openapi = {
    openapi: "3.0.3",
    info: {
      title: process.env.OPENAPI_TITLE || "API",
      version: "1.0.0",
      description:
        "从 docs/api/modules 真相文档生成，供 Apifox 导入。契约 SSOT 仍为 Markdown 模块文档。字段中文名/说明/枚举来自接口字段表。",
    },
    servers: [{ url: process.env.OPENAPI_SERVER_URL || "http://localhost:8080", description: "本地默认" }],
    tags: files.map((f) => ({ name: f.replace(/\.md$/, "") })),
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: process.env.OPENAPI_BEARER_FORMAT || "JWT",
        },
        AccessToken: {
          type: "apiKey",
          in: "header",
          name: "X-Access-Token",
        },
      },
      schemas: {
        Resp: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(RESP_ENVELOPE).map(([k, v]) => [k, { ...v }])
          ),
        },
      },
    },
  };

  assertQuality(openapi);

  const meta = { withDesc: 0, total: 0 };
  for (const methods of Object.values(paths)) {
    for (const op of Object.values(methods)) {
      countMeta(getJsonSchema(op, "request"), meta);
      countMeta(getJsonSchema(op, "response"), meta);
    }
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(openapi, null, 2), "utf8");
  console.log(
    `Wrote ${outFile} with ${endpoints.length} operations, ${Object.keys(paths).length} paths, sameAs=${sameAs}, fieldMeta=${meta.withDesc}/${meta.total}`
  );
}

main();
