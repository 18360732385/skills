/**
 * Merge helpers for fill-truths-auto --merge (0.2.9+).
 * Preserve non-TODO human content; replace TODO(harness-eng) when new has evidence.
 */

/** Split markdown into ## sections (title without ##). First chunk may be preamble. */
export function splitSections(md) {
  const lines = String(md || "").split(/\r?\n/);
  const sections = [];
  let title = "";
  let buf = [];
  const flush = () => {
    sections.push({ title, body: buf.join("\n") });
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      flush();
      title = m[1].trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

export function joinSections(sections) {
  const parts = [];
  for (const s of sections) {
    if (!s.title) {
      parts.push(s.body);
    } else {
      parts.push(`## ${s.title}\n${s.body.replace(/^\n/, "")}`);
    }
  }
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function sectionHasTodo(body) {
  return /TODO\(harness-eng\)/i.test(body || "");
}

function sectionLooksEmpty(body) {
  const t = (body || "").trim();
  return !t || t === "_无字段_" || t === "_无解析到索引_" || /^\| — \|/.test(t);
}

/**
 * Section-level merge: keep old human sections; replace TODO/empty with new evidence.
 * Append new-only sections. Preserve old-only sections (e.g. 人工补充).
 */
export function mergeBySections(oldMd, newMd) {
  const oldSecs = splitSections(oldMd);
  const newSecs = splitSections(newMd);
  const newMap = new Map(newSecs.filter((s) => s.title).map((s) => [s.title, s]));
  const used = new Set();
  const out = [];

  // preamble: prefer new if old preamble is auto-only / shorter
  const oldPre = oldSecs.find((s) => !s.title);
  const newPre = newSecs.find((s) => !s.title);
  if (newPre) {
    if (
      !oldPre ||
      sectionHasTodo(oldPre.body) ||
      (oldPre.body || "").length < (newPre.body || "").length * 0.5
    ) {
      out.push(newPre);
    } else {
      out.push(oldPre);
    }
  } else if (oldPre) {
    out.push(oldPre);
  }

  for (const s of oldSecs) {
    if (!s.title) continue;
    const neu = newMap.get(s.title);
    used.add(s.title);
    if (!neu) {
      out.push(s); // human-only section
      continue;
    }
    if (sectionHasTodo(s.body) && !sectionHasTodo(neu.body)) {
      out.push(neu);
    } else if (sectionLooksEmpty(s.body) && !sectionLooksEmpty(neu.body)) {
      out.push(neu);
    } else if (
      sectionHasTodo(s.body) &&
      sectionHasTodo(neu.body) &&
      (neu.body || "").length > (s.body || "").length
    ) {
      out.push(neu);
    } else {
      // Prefer old human content; enrich tables if applicable
      out.push({
        title: s.title,
        body: mergeTableBodies(s.body, neu.body),
      });
    }
  }

  for (const s of newSecs) {
    if (!s.title || used.has(s.title)) continue;
    out.push(s);
  }

  return joinSections(out);
}

/** Union markdown table rows by first column key; prefer non-empty/non-dash cells from old. */
export function mergeTableBodies(oldBody, newBody) {
  const oldRows = parseMdTable(oldBody);
  const newRows = parseMdTable(newBody);
  if (!oldRows || !newRows) {
    // Prefer longer non-TODO body
    if (sectionHasTodo(oldBody) && !sectionHasTodo(newBody)) return newBody;
    if ((oldBody || "").trim().length >= (newBody || "").trim().length) return oldBody;
    return newBody;
  }
  const map = new Map();
  for (const r of newRows.rows) map.set(r.key, r.cells);
  for (const r of oldRows.rows) {
    const neu = map.get(r.key);
    if (!neu) {
      map.set(r.key, r.cells);
      continue;
    }
    map.set(
      r.key,
      r.cells.map((c, i) => {
        const n = neu[i] ?? c;
        if (isEmptyCell(c)) return n;
        if (isEmptyCell(n)) return c;
        // Prefer old human comment when both filled and differ
        return c;
      })
    );
  }
  const header = oldRows.header.length ? oldRows.header : newRows.header;
  const sep = oldRows.sep.length ? oldRows.sep : newRows.sep;
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...[...map.values()].map((cells) => `| ${cells.join(" | ")} |`),
  ];
  // Keep any non-table prose before/after from old if present
  const prose = (oldBody || "").replace(/^\|[\s\S]*$/m, "").trim();
  if (prose && !prose.startsWith("|")) {
    return `${prose}\n\n${lines.join("\n")}\n`;
  }
  return lines.join("\n") + "\n";
}

function isEmptyCell(c) {
  const t = String(c || "")
    .trim()
    .replace(/^`|`$/g, "");
  return !t || t === "—" || t === "-" || /^TODO\(harness-eng\)/i.test(t);
}

function parseMdTable(body) {
  const lines = String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 2) return null;
  const split = (line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const header = split(lines[0]);
  const sep = split(lines[1]).map((c) => c || "---");
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = split(lines[i]);
    const key = cells[0] || `row-${i}`;
    rows.push({ key, cells });
  }
  return { header, sep, rows };
}

/**
 * Write or merge a truth file. Returns action: write | merged | unchanged | skip-empty | dry-run
 */
export function writeTruthFile(abs, text, opts = {}) {
  const {
    dryRun = false,
    merge = false,
    minBytes = 0,
    log = null,
    rel = abs,
  } = opts;
  const bytes = Buffer.byteLength(text, "utf8");
  if (minBytes > 0 && bytes < minBytes) {
    if (log) log.push({ action: "skip-empty", path: rel, reason: `content < ${minBytes} bytes`, bytes });
    return "skip-empty";
  }
  if (dryRun) {
    if (log) log.push({ action: "dry-run", path: rel, bytes, merge });
    return "dry-run";
  }

  const fs = opts.fs;
  const path = opts.path;
  if (!fs || !path) throw new Error("writeTruthFile requires opts.fs and opts.path");

  fs.mkdirSync(path.dirname(abs), { recursive: true });

  if (merge && fs.existsSync(abs)) {
    const old = fs.readFileSync(abs, "utf8");
    if (old === text) {
      if (log) log.push({ action: "unchanged", path: rel, bytes });
      return "unchanged";
    }
    const merged = mergeBySections(old, text);
    if (merged === old) {
      if (log) log.push({ action: "unchanged", path: rel, bytes: Buffer.byteLength(old, "utf8") });
      return "unchanged";
    }
    fs.writeFileSync(abs, merged, "utf8");
    if (log) log.push({ action: "merged", path: rel, bytes: Buffer.byteLength(merged, "utf8") });
    return "merged";
  }

  fs.writeFileSync(abs, text, "utf8");
  if (log) log.push({ action: "write", path: rel, bytes });
  return "write";
}
