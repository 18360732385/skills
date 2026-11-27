/**
 * Surgical merge of the client-api type_export scoring note.
 * Never replaces an existing docs/client-api/client-api.md wholesale.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TYPE_EXPORT_INDEX_REL = "docs/client-api/client-api.md";
export const TYPE_EXPORT_NOTE =
  "- **计分**：分母排除 `type_export`；排除个数以报告分域行为准，本索引不重复列出";

export function typeExportSnippetPath(skillRoot) {
  return path.join(skillRoot, "templates", "docs", "client-api", "type-export-note.snippet");
}

export function loadTypeExportNote(skillRoot) {
  const p = skillRoot ? typeExportSnippetPath(skillRoot) : null;
  if (p && fs.existsSync(p)) {
    const text = fs.readFileSync(p, "utf8").trim();
    if (text) return text;
  }
  return TYPE_EXPORT_NOTE;
}

function buildBlock(note) {
  return `\n\n## 计分说明（harness-eng）\n\n${note.trim()}\n`;
}

/**
 * @param {string} root target repo
 * @param {{ write?: boolean, skillRoot?: string }} [opts]
 * @returns {{ path: string, action: 'absent'|'present'|'would_merge'|'merged', note?: string }}
 */
export function mergeTypeExportNote(root, opts = {}) {
  const write = !!opts.write;
  const rel = TYPE_EXPORT_INDEX_REL;
  const abs = path.join(path.resolve(root), rel);
  if (!fs.existsSync(abs)) {
    return { path: rel, action: "absent" };
  }
  const text = fs.readFileSync(abs, "utf8");
  if (/type_export/.test(text)) {
    return { path: rel, action: "present" };
  }
  const note = loadTypeExportNote(opts.skillRoot);
  if (!write) {
    return {
      path: rel,
      action: "would_merge",
      note: "索引缺失 type_export 说明；upgrade 真写将追加计分片段，不会整文覆盖 client-api.md",
    };
  }
  const next = text.replace(/\s*$/, "") + buildBlock(note);
  fs.writeFileSync(abs, next, "utf8");
  return { path: rel, action: "merged" };
}

export function formatTypeExportHint(result) {
  if (!result || result.action !== "would_merge") return null;
  return (
    `harness: 厚仓 on_exists=skip 未覆盖已有 ${result.path}，${result.note || "索引缺失 type_export 说明"}。` +
    "可单独合并 templates/docs/client-api/type-export-note.snippet，勿整文替换。"
  );
}

export default { mergeTypeExportNote };
