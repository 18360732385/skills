/**
 * Git HEAD helpers for inventory freshness (0.7.34 FS-5 / G5).
 */
import { spawnSync } from "child_process";

/**
 * @param {string} root
 * @returns {string|null} full SHA or null
 */
export function readGitHead(root) {
  try {
    const r = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    if (r.status !== 0) return null;
    const sha = String(r.stdout || "").trim();
    return /^[0-9a-f]{7,40}$/i.test(sha) ? sha : null;
  } catch {
    return null;
  }
}

/**
 * Attach git_head onto an inventory report object when available.
 * @param {object} report
 * @param {string} root
 * @returns {object}
 */
export function stampInventoryGitHead(report, root) {
  if (!report || typeof report !== "object") return report;
  const head = readGitHead(root);
  if (head) report.git_head = head;
  return report;
}

/**
 * @param {object|null} inv
 * @param {string|null} currentHead
 * @returns {boolean} true when inventory is missing head or mismatches
 */
export function isInventoryStale(inv, currentHead) {
  if (!inv || typeof inv !== "object") return false;
  if (!currentHead) return false;
  const stamped = inv.git_head != null ? String(inv.git_head).trim() : "";
  if (!stamped) return true;
  return stamped !== currentHead;
}
