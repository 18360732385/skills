/**
 * freeze 路径桶 / 发版包排除（从 release-freeze.mjs 抽出，便于单测与复用）。
 */

/** 路径一级桶：docs / db/migration 特例；其余取 top-level 目录名 */
export function pathBucket(p) {
  const n = String(p || "").replace(/\\/g, "/");
  if (n.includes("db/migration") || /\/V\d+__/.test(n)) return "db/migration";
  if (n.startsWith("docs/") || n.startsWith("docs\\")) return "docs/";
  if (!n.includes("/")) return "其它";
  const top = n.split("/")[0];
  if (top && /^[a-zA-Z0-9._-]+$/.test(top)) return `${top}/`;
  return "其它";
}

function normPath(p) {
  return String(p || "").replace(/\\/g, "/");
}

/** 发版过程域路径：采集候选时排除，避免包内 sql/config 再进 draft */
export function excludeReleasePackageFiles(files) {
  return (files || []).filter((f) => !normPath(f).startsWith("docs/releases/"));
}
