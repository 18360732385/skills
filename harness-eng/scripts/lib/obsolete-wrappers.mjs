/**
 * 0.7.39 G-up-wrappers-linger: detect (and optionally retire) obsolete inventory wrappers.
 * Does not retire scripts/agent-kb/refresh-score.mjs (stock entry).
 */
import fs from "fs";
import path from "path";

const KB_REL = path.join("scripts", "agent-kb");
const OBSOLETE_DIR = path.join(KB_REL, "_obsolete");
const NAMED = ["fill-score-ready.mjs", "cold-bootstrap-inventory.mjs"];
const STALE_REFRESH_RE = /--inventory|fill-score-ready|inventory_stale/;

function kbDir(root) {
  return path.join(path.resolve(root), KB_REL);
}

function listColdBootstrap(root) {
  const dir = kbDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^cold-bootstrap.*\.mjs$/i.test(n))
    .map((n) => path.join(KB_REL, n).replace(/\\/g, "/"));
}

/**
 * @param {string} root
 * @returns {{ retire: string[], refreshStale: string[] }}
 */
export function findObsoleteWrappers(root) {
  const abs = path.resolve(root);
  const retire = [];
  for (const name of NAMED) {
    const rel = path.join(KB_REL, name).replace(/\\/g, "/");
    if (fs.existsSync(path.join(abs, rel))) retire.push(rel);
  }
  for (const rel of listColdBootstrap(root)) {
    if (!retire.includes(rel)) retire.push(rel);
  }
  const refreshRel = path.join(KB_REL, "refresh-score.mjs").replace(/\\/g, "/");
  const refreshAbs = path.join(abs, refreshRel);
  const refreshStale = [];
  if (fs.existsSync(refreshAbs)) {
    try {
      const t = fs.readFileSync(refreshAbs, "utf8");
      if (STALE_REFRESH_RE.test(t)) refreshStale.push(refreshRel);
    } catch {
      /* ignore */
    }
  }
  return { retire, refreshStale };
}

/**
 * @param {string} root
 * @returns {{ retire: string[], refreshStale: string[] }}
 */
export function warnObsoleteWrappers(root) {
  const found = findObsoleteWrappers(root);
  const absRoot = path.resolve(root);
  const rootDisp = absRoot.replace(/\\/g, "/");
  if (found.retire.length) {
    console.error(
      `harness: 【旧仓升级】发现已过时绕过脚本（不会自动删除；标准入口仍是 refresh-score.mjs；--retire-wrappers 可移到 ${OBSOLETE_DIR.replace(/\\/g, "/")}）：${found.retire.join("；")}`
    );
    console.error(
      `harness: 【旧仓升级】退役命令（可复制）：node scripts/harness.mjs --mode upgrade --root ${rootDisp} --retire-wrappers`
    );
    console.error(
      `harness: 【旧仓升级】或设环境变量 HARNESS_RETIRE_WRAPPERS=1；勿删 scripts/agent-kb/refresh-score.mjs（标准入口）`
    );
  }
  if (found.refreshStale.length) {
    console.error(
      `harness: 【旧仓升级】${found.refreshStale.join("；")} 含旧绕过指纹（--inventory / fill-score-ready / inventory_stale）。refresh-score.mjs 是标准入口，勿删；建议对照 skill tmpl 重渲`
    );
  }
  return found;
}

function uniqueDest(dir, base) {
  const dest = path.join(dir, base);
  if (!fs.existsSync(dest)) return dest;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${base}.${stamp}`);
}

/**
 * Move retireable wrappers to scripts/agent-kb/_obsolete/. Never moves refresh-score.mjs.
 * @param {string} root
 * @returns {{ moved: string[] }}
 */
export function retireObsoleteWrappers(root) {
  const abs = path.resolve(root);
  const { retire } = findObsoleteWrappers(root);
  const destDir = path.join(abs, OBSOLETE_DIR);
  const moved = [];
  if (!retire.length) return { moved };
  fs.mkdirSync(destDir, { recursive: true });
  for (const rel of retire) {
    const src = path.join(abs, rel);
    if (!fs.existsSync(src)) continue;
    const dest = uniqueDest(destDir, path.basename(rel));
    fs.renameSync(src, dest);
    moved.push(rel);
  }
  if (moved.length) {
    console.error(
      `harness: 已退役绕过脚本 → ${OBSOLETE_DIR.replace(/\\/g, "/")}：${moved.join("；")}`
    );
  }
  return { moved };
}
