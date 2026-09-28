/**
 * Document density helpers for fill-score / acceptance (0.2.27+).
 * 0.7.25: SG-2 hollow — not filled; SG-5 per-table / per-section header reset.
 * No npm deps.
 */

const OK_PLACEHOLDER = /^(未知|—|–|-|N\/A|n\/a|无|暂无|null|NULL|\(空\))$/;

/** True if cell is empty or a non-informative placeholder (— counts empty for fill ratio). */
export function isEmptyOrHollow(v) {
  const s = String(v ?? "")
    .replace(/`/g, "")
    .trim();
  if (!s) return true;
  if (/^TODO/i.test(s)) return true;
  if (OK_PLACEHOLDER.test(s)) return true;
  return false;
}

/**
 * Split markdown table rows. Resets headers when a new structural header row appears
 * (SG-5: multi-table docs must not reuse first table's headers).
 * 0.7.28 NEW-4: do not treat data cells containing 返回/说明/类型/方法 as headers.
 */
export function splitTableRows(block) {
  const lines = String(block || "").split(/\r?\n/);
  const rows = [];
  let headers = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\|/.test(line)) continue;
    if (/^\|\s*:?-{2,}/.test(line)) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (!cells.length) continue;
    // Structural header tokens only (not values like「返回类型说明」)
    const looksHeader = cells.some((c) =>
      /^(参数名|字段名|COMMENT|必填|示例|服务类|Name|Type|Required)$/i.test(c) ||
      /参数名|字段名|^COMMENT$|必填|^示例|服务类/.test(c)
    );
    // Accept new header only if none yet, or next line is a markdown separator
    let nextIsSep = false;
    for (let j = i + 1; j < lines.length; j++) {
      if (!/^\|/.test(lines[j])) break;
      if (/^\|\s*:?-{2,}/.test(lines[j])) {
        nextIsSep = true;
        break;
      }
      break;
    }
    if (!headers || (looksHeader && nextIsSep)) {
      headers = cells;
      continue;
    }
    if (!headers && looksHeader) {
      headers = cells;
      continue;
    }
    rows.push(cells);
  }
  return { headers, rows };
}

/** @returns {{ ratio: number, empty: number, total: number, hasColumn: boolean }} */
export function apiExampleFillRatio(text) {
  let total = 0;
  let empty = 0;
  let hasColumn = false;
  for (const secName of ["请求参数", "响应参数"]) {
    const sec = String(text || "").match(
      new RegExp(`###\\s*${secName}([\\s\\S]*?)(?=###\\s*|##\\s+\\d+\\.|$)`, "i")
    );
    if (!sec) continue;
    const { headers, rows } = splitTableRows(sec[1]);
    if (!headers) continue;
    const exIdx = headers.findIndex((h) => /示例/.test(h));
    if (exIdx < 0) continue;
    hasColumn = true;
    for (const cells of rows) {
      total++;
      const v = (cells[exIdx] ?? "").replace(/`/g, "").trim();
      if (!v) empty++;
      else if (OK_PLACEHOLDER.test(v) && v !== "—" && v !== "-" && v !== "–") {
        /* 未知 etc. ok for api examples */
      } else if (isEmptyOrHollow(v)) empty++;
    }
  }
  if (!hasColumn || !total) return { ratio: 0, empty, total, hasColumn };
  return { ratio: (total - empty) / total, empty, total, hasColumn };
}

/** @returns {{ ratio: number, filled: number, total: number }} */
export function dbCommentFillRatio(text) {
  const raw = String(text || "");
  const sec = raw.match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/i);
  const body = sec ? sec[0] : raw;
  const { headers, rows } = splitTableRows(body);
  if (headers) {
    const cIdx = headers.findIndex((h) => /COMMENT|注释|说明/.test(h));
    if (cIdx >= 0 && rows.length) {
      let filled = 0;
      for (const cells of rows) {
        const v = cells[cIdx] ?? "";
        if (!isEmptyOrHollow(v)) filled++;
      }
      return { ratio: filled / rows.length, filled, total: rows.length };
    }
  }
  const cols = (raw.match(/^\s*`[^`]+`[^,\n]*,?/gm) || []).length;
  const comments = (raw.match(/COMMENT\s+'/gi) || []).length;
  if (cols > 0) {
    return {
      ratio: Math.min(1, comments / cols),
      filled: comments,
      total: cols,
    };
  }
  if (/未知/.test(raw) && /COMMENT|注释|字段说明/.test(raw)) {
    return { ratio: 1, filled: 1, total: 1 };
  }
  return { ratio: 0, filled: 0, total: 0 };
}

export function redisHasTtlContent(text) {
  const sec = String(text || "").match(/##\s*TTL[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return false;
  const b = sec[0];
  if (/未知|业务\/运行时|无过期|-1|永不过期|\d+\s*(秒|分|小时|天|s|m|h)/i.test(b))
    return true;
  if (/\|\s*`[^`]+`\s*\|/.test(b)) return true;
  if (/TODO\(harness-eng\)/i.test(b) && b.length < 80) return false;
  return b.replace(/##\s*TTL/i, "").trim().length > 8;
}

/** Key 示例 / live 样例 / 显式未知 */
export function redisHasExampleOrUnknown(text) {
  const raw = String(text || "");
  if (/示例\s*[：:]|live\s*[：:]|SCAN\s*`/i.test(raw)) return true;
  if (/未知/.test(raw) && /Key\s*模式|模式/.test(raw)) return true;
  const sec = raw.match(/##\s*Key\s*模式[\s\S]*?(?=\n##\s+|$)/i);
  if (sec && /示例/.test(sec[0]) && /\|/.test(sec[0])) {
    const { rows } = splitTableRows(sec[0]);
    if (rows.some((r) => r.some((c) => c && !isEmptyOrHollow(c)))) return true;
  }
  return false;
}

/** Method table under ### 方法清单 (SG-5 section-scoped). */
export function funcMethodDescFillRatio(text) {
  const raw = String(text || "");
  const sec =
    raw.match(/#{2,3}\s*方法清单[\s\S]*?(?=\n#{2,3}\s+|$)/i) ||
    raw.match(/#{2,3}\s*方法功能[\s\S]*?(?=\n#{2,3}\s+|$)/i);
  const body = sec ? sec[0] : raw;
  const { headers, rows } = splitTableRows(body);
  if (!headers || !rows.length) return { ratio: 0, empty: 0, total: 0 };
  const descIdx = headers.findIndex((h) => /功能说明|说明|语义/.test(h));
  const nameIdx = headers.findIndex((h) => /方法|签名|名称/.test(h));
  if (descIdx < 0) return { ratio: 0, empty: 0, total: 0 };
  let empty = 0;
  for (const cells of rows) {
    const desc = (cells[descIdx] ?? "").replace(/`/g, "").trim();
    const name =
      nameIdx >= 0 ? (cells[nameIdx] ?? "").replace(/`/g, "").trim() : "";
    if (!desc || desc === name || isEmptyOrHollow(desc)) empty++;
  }
  return {
    ratio: (rows.length - empty) / rows.length,
    empty,
    total: rows.length,
  };
}

/** Doc field column names from ## 字段 table (for SG-1 drift). */
export function parseDbDocFieldNames(text) {
  const sec = String(text || "").match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return [];
  const { headers, rows } = splitTableRows(sec[0]);
  if (!headers || !rows.length) return [];
  const nameIdx = headers.findIndex((h) => /字段名|列名|column|name/i.test(h));
  const idx = nameIdx >= 0 ? nameIdx : 0;
  return rows
    .map((r) => (r[idx] ?? "").replace(/`/g, "").trim())
    .filter((n) => n && !isEmptyOrHollow(n) && !/^字段/.test(n));
}
