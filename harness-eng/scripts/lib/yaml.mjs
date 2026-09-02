/**
 * Vendored YAML 1.2 subset parser (ESM, no npm deps).
 * Supports: maps, sequences, nested blocks, flow [a,b] / {k:v},
 * booleans/null/numbers, quoted strings, comments.
 * Enough for harness-eng manifest.yaml + questions.yaml.
 */
export function parse(text) {
  const src = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  let i = 0;

  function peek() {
    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        i++;
        continue;
      }
      return { raw, indent: raw.match(/^ */)[0].length, trimmed, index: i };
    }
    return null;
  }

  function advance() {
    const p = peek();
    if (p) i++;
    return p;
  }

  function parseScalar(s) {
    s = String(s).trim();
    if (!s) return "";
    if (s === "~" || s === "null") return null;
    if (s === "true") return true;
    if (s === "false") return false;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?$/.test(s)) return Number(s);
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      return s.slice(1, -1);
    }
    if (s.startsWith("[") && s.endsWith("]")) return parseFlowSeq(s);
    if (s.startsWith("{") && s.endsWith("}")) return parseFlowMap(s);
    const hash = s.indexOf(" #");
    if (hash >= 0) s = s.slice(0, hash).trim();
    return s;
  }

  function splitFlow(inner) {
    const parts = [];
    let cur = "";
    let depth = 0;
    let q = null;
    for (let c = 0; c < inner.length; c++) {
      const ch = inner[c];
      if (q) {
        cur += ch;
        if (ch === q && inner[c - 1] !== "\\") q = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        q = ch;
        cur += ch;
        continue;
      }
      if (ch === "[" || ch === "{") {
        depth++;
        cur += ch;
        continue;
      }
      if (ch === "]" || ch === "}") {
        depth--;
        cur += ch;
        continue;
      }
      if (ch === "," && depth === 0) {
        parts.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  function parseFlowSeq(s) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitFlow(inner).map(parseScalar);
  }

  function parseFlowMap(s) {
    const inner = s.slice(1, -1).trim();
    const obj = {};
    if (!inner) return obj;
    for (const part of splitFlow(inner)) {
      const colon = part.indexOf(":");
      if (colon < 0) continue;
      obj[part.slice(0, colon).trim()] = parseScalar(part.slice(colon + 1).trim());
    }
    return obj;
  }

  function parseMap(minIndent) {
    const obj = {};
    while (true) {
      const p = peek();
      if (!p || p.indent < minIndent) break;
      if (p.trimmed.startsWith("- ")) break;
      if (p.indent !== minIndent) break;

      advance();
      const m = p.trimmed.match(/^([^:#][^:]*):\s*(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      let rest = m[2];
      if (rest.startsWith("#")) rest = "";

      if (!rest) {
        const next = peek();
        if (!next || next.indent <= minIndent) {
          obj[key] = null;
        } else if (next.trimmed.startsWith("- ")) {
          obj[key] = parseSeq(next.indent);
        } else {
          obj[key] = parseMap(next.indent);
        }
      } else {
        obj[key] = parseScalar(rest);
      }
    }
    return obj;
  }

  function parseSeq(minIndent) {
    const arr = [];
    while (true) {
      const p = peek();
      if (!p || p.indent < minIndent) break;
      if (!p.trimmed.startsWith("- ")) break;
      if (p.indent !== minIndent) break;
      advance();
      const rest = p.trimmed.slice(2).trim();

      if (!rest || rest.startsWith("#")) {
        const next = peek();
        if (!next || next.indent <= minIndent) arr.push(null);
        else if (next.trimmed.startsWith("- ")) arr.push(parseSeq(next.indent));
        else arr.push(parseMap(next.indent));
        continue;
      }

      if (
        (rest.startsWith("{") && rest.endsWith("}")) ||
        (rest.startsWith("[") && rest.endsWith("]")) ||
        !rest.includes(":")
      ) {
        arr.push(parseScalar(rest));
        continue;
      }

      const colon = rest.indexOf(":");
      const k0 = rest.slice(0, colon).trim();
      let v0 = rest.slice(colon + 1).trim();
      if (v0.startsWith("#")) v0 = "";

      const item = {};
      if (!v0) {
        const next = peek();
        if (next && next.indent > minIndent) {
          if (next.trimmed.startsWith("- ")) item[k0] = parseSeq(next.indent);
          else item[k0] = parseMap(next.indent);
        } else {
          item[k0] = null;
        }
      } else {
        item[k0] = parseScalar(v0);
      }

      const next = peek();
      if (next && next.indent > minIndent && !next.trimmed.startsWith("- ")) {
        Object.assign(item, parseMap(next.indent));
      }
      arr.push(item);
    }
    return arr;
  }

  const rootPeek = peek();
  if (!rootPeek) return null;
  if (rootPeek.trimmed.startsWith("- ")) return parseSeq(rootPeek.indent);
  return parseMap(rootPeek.indent);
}

/** Serialize simple values for harness-meta placeholders (flow style for arrays). */
export function stringify(value, opts = {}) {
  const flow = opts.flow !== false;
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (/^[A-Za-z0-9_./+-]+$/.test(value)) return value;
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (flow) {
      return `[${value.map((v) => stringify(v, opts)).join(", ")}]`;
    }
    if (!value.length) return "[]";
    return value.map((v) => `- ${stringify(v, { ...opts, flow: true })}`).join("\n");
  }
  if (typeof value === "object") {
    const lines = [];
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(v) && !opts.flow) {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - ${stringify(item, { flow: true })}`);
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        lines.push(`${k}:`);
        for (const line of stringify(v, opts).split("\n")) {
          lines.push(`  ${line}`);
        }
      } else {
        lines.push(`${k}: ${stringify(v, { flow: true })}`);
      }
    }
    return lines.join("\n");
  }
  return JSON.stringify(String(value));
}

export default { parse, stringify };
