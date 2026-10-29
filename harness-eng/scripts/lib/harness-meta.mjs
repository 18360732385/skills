/**
 * harness-meta / mcp-usage-guide 路径（0.5.6+）。
 *
 * 写入默认：docs/harness-eng/
 * 读取：先新路径，再回退 .cursor/ 遗留（yaml/yml；usage-guide 另含旧中文名）。
 * 升阶/续跑：仅有遗留、无新路径时迁到新路径；不自动删除旧文件。
 */
import fs from "fs";
import path from "path";

export const HARNESS_META_CANONICAL = "docs/harness-eng/harness-meta.yaml";
export const HARNESS_META_READ_CANDIDATES = [
  "docs/harness-eng/harness-meta.yaml",
  "docs/harness-eng/harness-meta.yml",
  ".cursor/harness-meta.yaml",
  ".cursor/harness-meta.yml",
];

export const MCP_USAGE_GUIDE_CANONICAL = "docs/harness-eng/mcp-usage-guide.md";
export const MCP_USAGE_GUIDE_READ_CANDIDATES = [
  "docs/harness-eng/mcp-usage-guide.md",
  ".cursor/mcp-usage-guide.md",
  ".cursor/MCP使用说明.md",
];

function toAbs(root, rel) {
  return path.join(root, ...String(rel).split("/"));
}

function firstExisting(root, rels) {
  for (const rel of rels) {
    const abs = toAbs(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return { rel, abs };
    }
  }
  return null;
}

/**
 * 查找第一个存在的 harness-meta（新路径优先）。
 * @returns {{ rel: string, abs: string } | null}
 */
export function findHarnessMetaFile(root) {
  if (!root) return null;
  return firstExisting(root, HARNESS_META_READ_CANDIDATES);
}

/** 目标仓是否有任一可读 meta（新或遗留）。 */
export function harnessMetaExists(root) {
  return findHarnessMetaFile(root) != null;
}

/**
 * 写入/渲染用的规范路径（始终新路径）。
 * @returns {{ rel: string, abs: string }}
 */
export function canonicalHarnessMetaPath(root) {
  return { rel: HARNESS_META_CANONICAL, abs: toAbs(root, HARNESS_META_CANONICAL) };
}

/**
 * 仅有遗留 meta、无新路径时复制到规范路径；不删除旧文件。
 * @returns {{ migrated: boolean, from: string|null, to: string }}
 */
export function migrateHarnessMetaIfNeeded(root) {
  const dest = canonicalHarnessMetaPath(root);
  if (fs.existsSync(dest.abs)) {
    return { migrated: false, from: null, to: dest.rel };
  }
  const found = findHarnessMetaFile(root);
  if (!found) return { migrated: false, from: null, to: dest.rel };
  fs.mkdirSync(path.dirname(dest.abs), { recursive: true });
  fs.copyFileSync(found.abs, dest.abs);
  return { migrated: true, from: found.rel, to: dest.rel };
}

/**
 * 查找第一个存在的 mcp-usage-guide。
 * @returns {{ rel: string, abs: string } | null}
 */
export function findMcpUsageGuideFile(root) {
  if (!root) return null;
  return firstExisting(root, MCP_USAGE_GUIDE_READ_CANDIDATES);
}

export function mcpUsageGuideExists(root) {
  return findMcpUsageGuideFile(root) != null;
}

export function canonicalMcpUsageGuidePath(root) {
  return { rel: MCP_USAGE_GUIDE_CANONICAL, abs: toAbs(root, MCP_USAGE_GUIDE_CANONICAL) };
}

/**
 * 仅有遗留说明、无新路径时复制到规范路径；不删除旧文件。
 */
export function migrateMcpUsageGuideIfNeeded(root) {
  const dest = canonicalMcpUsageGuidePath(root);
  if (fs.existsSync(dest.abs)) {
    return { migrated: false, from: null, to: dest.rel };
  }
  const found = findMcpUsageGuideFile(root);
  if (!found) return { migrated: false, from: null, to: dest.rel };
  fs.mkdirSync(path.dirname(dest.abs), { recursive: true });
  fs.copyFileSync(found.abs, dest.abs);
  return { migrated: true, from: found.rel, to: dest.rel };
}

/** 0.7.55：已交付索引权威路径（对齐 sms-ai 物理隔离）。 */
export const SUPERPOWERS_ARCHIVE_CANONICAL = "docs/superpowers/archive/ARCHIVE.md";
export const SUPERPOWERS_ARCHIVE_LEGACY = "docs/superpowers/ARCHIVE.md";

export function canonicalSuperpowersArchivePath(root) {
  return {
    rel: SUPERPOWERS_ARCHIVE_CANONICAL,
    abs: toAbs(root, SUPERPOWERS_ARCHIVE_CANONICAL),
  };
}

/**
 * 仅有根级遗留 ARCHIVE、无 archive/ARCHIVE.md 时复制到规范路径；不删除旧文件。
 * 若规范路径已存在（含 sms-ai 双文件态），不覆盖。
 * @returns {{ migrated: boolean, from: string|null, to: string }}
 */
export function migrateSuperpowersArchiveIfNeeded(root) {
  const dest = canonicalSuperpowersArchivePath(root);
  if (fs.existsSync(dest.abs)) {
    return { migrated: false, from: null, to: dest.rel };
  }
  const legacyAbs = toAbs(root, SUPERPOWERS_ARCHIVE_LEGACY);
  if (!fs.existsSync(legacyAbs) || !fs.statSync(legacyAbs).isFile()) {
    return { migrated: false, from: null, to: dest.rel };
  }
  fs.mkdirSync(path.dirname(dest.abs), { recursive: true });
  fs.copyFileSync(legacyAbs, dest.abs);
  return { migrated: true, from: SUPERPOWERS_ARCHIVE_LEGACY, to: dest.rel };
}

/**
 * 是否像「主题索引表」表头（兼容有/无「用户」列；0.7.49+ 含用户）。
 */
export function looksLikeSuperpowersThemeTable(body) {
  const text = String(body || "");
  return (
    /\|\s*日期\s*\|(?:\s*用户\s*\|)?\s*主题\s*\|/.test(text) ||
    /\|\s*日期\s*\|\s*主题\s*\|\s*Spec\s*\|/.test(text)
  );
}
