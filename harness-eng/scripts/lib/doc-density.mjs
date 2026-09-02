/**
 * Document density helpers for fill-score / acceptance (0.2.27+).
 * No npm deps.
 */

const OK_PLACEHOLDER = /^(未知|—|–|-|N\/A|n\/a|无|暂无|null|NULL|\(空\))$/;

function splitTableRows(block) {
  const lines = String(block || "").split(/\r?\n/);
  const rows = [];
  let headers = null;
  for (const line of lines) {
    if (!/^\|/.test(line)) continue;
    if (/^\|\s*:?-{2,}/.test(line)) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (!cells.length) continue;
    if (!headers) {
      headers = cells;
      continue;
    }
    if (cells.some((c) => /参数名|类型|必填|说明|示例|字段名|COMMENT/.test(c))) continue;
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
      else if (OK_PLACEHOLDER.test(v)) {
        /* ok */
      }
    }
  }
  if (!hasColumn || !total) return { ratio: 0, empty, total, hasColumn };
  return { ratio: (total - empty) / total, empty, total, hasColumn };
}

/** @returns {{ ratio: number, filled: number, total: number }} */
export function dbCommentFillRatio(text) {
  const raw = String(text || "");
  // Prefer ## 字段 table COMMENT column
  const sec = raw.match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/i);
  const body = sec ? sec[0] : raw;
  const { headers, rows } = splitTableRows(body);
  if (headers) {
    const cIdx = headers.findIndex((h) => /COMMENT|注释|说明/.test(h));
    if (cIdx >= 0 && rows.length) {
      let filled = 0;
      for (const cells of rows) {
        const v = (cells[cIdx] ?? "").replace(/`/g, "").trim();
        if (v && !/^TODO/i.test(v)) filled++;
      }
      return { ratio: filled / rows.length, filled, total: rows.length };
    }
  }
  // DDL COMMENT heuristic
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
  if (/未知|业务\/运行时|无过期|-1|永不过期|\d+\s*(秒|分|小时|天|s|m|h)/i.test(b)) return true;
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
    if (rows.some((r) => r.some((c) => c && c !== "—" && !/^TODO/i.test(c)))) return true;
  }
  return false;
}

/** Method table: 功能说明 column non-empty rate */
export function funcMethodDescFillRatio(text) {
  const raw = String(text || "");
  const { headers, rows } = splitTableRows(raw);
  if (!headers || !rows.length) return { ratio: 0, empty: 0, total: 0 };
  const descIdx = headers.findIndex((h) => /功能说明|说明|语义/.test(h));
  const nameIdx = headers.findIndex((h) => /方法|签名|名称/.test(h));
  if (descIdx < 0) return { ratio: 0, empty: 0, total: 0 };
  let empty = 0;
  for (const cells of rows) {
    const desc = (cells[descIdx] ?? "").replace(/`/g, "").trim();
    const name = nameIdx >= 0 ? (cells[nameIdx] ?? "").replace(/`/g, "").trim() : "";
    if (!desc || desc === name || /^TODO/i.test(desc)) empty++;
  }
  return { ratio: (rows.length - empty) / rows.length, empty, total: rows.length };
}
