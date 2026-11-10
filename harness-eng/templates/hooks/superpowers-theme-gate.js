/**
 * superpowers 进行中主题门禁辅助（harness-eng hooks 家族 companion）。
 * 供 git-commit-soft-gate / superpowers-commit-gate / stop-delivery-checklist /
 * codex-stop-checklist 复用：
 * 解析 README「进行中」表（含「用户」列）、匹配本机 git 身份、筛有 Plan 的本人主题。
 * Hook 不做完成判定；完成与否交给 AI 对照 plan.md 与代码。
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const README_REL = path.join("docs", "superpowers", "README.md");
const PLAN_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/;
const DASH_RE = /^[—–\-]+$/;

/**
 * @param {string} root
 * @returns {{ name: string, emailLocal: string }}
 */
function resolveGitIdentity(root) {
  let name = "";
  let emailLocal = "";
  try {
    name = execSync("git config user.name", {
      encoding: "utf8",
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 3000,
      windowsHide: true,
    }).trim();
  } catch {
    /* ignore */
  }
  try {
    const email = execSync("git config user.email", {
      encoding: "utf8",
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 3000,
      windowsHide: true,
    }).trim();
    const at = email.indexOf("@");
    if (at > 0) emailLocal = email.slice(0, at);
  } catch {
    /* ignore */
  }
  return { name, emailLocal };
}

/**
 * @param {string} user
 * @param {{ name?: string, emailLocal?: string }} identity
 * @returns {boolean}
 */
function isOwnTheme(user, identity) {
  const u = String(user || "")
    .trim()
    .toLowerCase();
  if (!u) return false;
  const name = String(identity?.name || "")
    .trim()
    .toLowerCase();
  const emailLocal = String(identity?.emailLocal || "")
    .trim()
    .toLowerCase();
  return (name && u === name) || (emailLocal && u === emailLocal);
}

/**
 * 从 Plan 单元格抽出 `./plans/xxx.md` 相对路径（相对 docs/superpowers/）。
 * @param {string} cell
 * @returns {string|null} 如 `plans/foo.md`；无有效链接返回 null
 */
function extractPlanRel(cell) {
  const raw = String(cell || "").trim();
  if (!raw || DASH_RE.test(raw)) return null;
  const m = raw.match(PLAN_LINK_RE);
  if (!m) return null;
  let href = m[2].trim().replace(/\\/g, "/");
  // 去掉 query / 标题锚点
  href = href.split("#")[0].split("?")[0];
  if (!href) return null;
  // 只认指向 plans/ 的相对链接
  const normalized = href.replace(/^\.\//, "");
  if (!/(^|\/)plans\/[^/]+\.md$/i.test(normalized)) return null;
  const idx = normalized.toLowerCase().lastIndexOf("plans/");
  return normalized.slice(idx);
}

/**
 * 按 `|` 切分表格行单元格（去掉首尾空段）。
 * @param {string} line
 * @returns {string[]}
 */
function splitTableCells(line) {
  const parts = line.trim().split("|");
  if (parts.length && parts[0].trim() === "") parts.shift();
  if (parts.length && parts[parts.length - 1].trim() === "") parts.pop();
  return parts.map((c) => c.trim());
}

/**
 * 解析 README 中首个表头同时含「用户」与「Plan」的进行中主题表。
 * 忽略无「用户」列的旧表副本；Plan 为 — / 空的行不返回。
 * @param {string} readmeText
 * @returns {{ user: string, topic: string, planRel: string }[]}
 */
function parseInProgressThemes(readmeText) {
  const lines = String(readmeText || "").split(/\r?\n/);
  let headerIdx = -1;
  let userCol = -1;
  let topicCol = -1;
  let planCol = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;
    const cells = splitTableCells(line);
    const userI = cells.findIndex((c) => c === "用户");
    const planI = cells.findIndex((c) => c === "Plan" || c === "计划");
    if (userI < 0 || planI < 0) continue;
    headerIdx = i;
    userCol = userI;
    planCol = planI;
    topicCol = cells.findIndex((c) => c === "主题");
    break;
  }
  if (headerIdx < 0) return [];

  /** @type {{ user: string, topic: string, planRel: string }[]} */
  const out = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    // 跳过分隔行 |---|---|
    if (/^\|?\s*:?-{3,}/.test(line)) continue;
    const cells = splitTableCells(line);
    if (cells.length <= Math.max(userCol, planCol, topicCol)) continue;
    const user = cells[userCol] || "";
    const topic = topicCol >= 0 ? cells[topicCol] || "" : "";
    const planRel = extractPlanRel(cells[planCol] || "");
    if (!planRel) continue;
    out.push({ user, topic, planRel });
  }
  return out;
}

/**
 * 读 README + 本机身份，返回本人且有 Plan 的进行中主题。
 * @param {string} root
 * @returns {{ user: string, topic: string, planRel: string, planPath: string }[]}
 */
function listOwnActivePlanThemes(root) {
  const identity = resolveGitIdentity(root);
  if (!identity.name && !identity.emailLocal) return [];

  let text = "";
  try {
    text = fs.readFileSync(path.join(root, README_REL), "utf8");
  } catch {
    return [];
  }

  return parseInProgressThemes(text)
    .filter((t) => isOwnTheme(t.user, identity))
    .map((t) => ({
      ...t,
      planPath: path.posix.join("docs/superpowers", t.planRel.replace(/\\/g, "/")),
    }));
}

/**
 * 格式化提醒用的主题列表行（最多 max 条）。
 * @param {{ topic: string, planPath: string }[]} themes
 * @param {number} [max=5]
 * @returns {{ lines: string[], total: number }}
 */
function formatThemeBulletLines(themes, max = 5) {
  const total = themes.length;
  const shown = themes.slice(0, max);
  const lines = shown.map((t) => {
    const short =
      String(t.topic || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48) || "(无主题名)";
    const more = (t.topic || "").length > 48 ? "…" : "";
    return `  - ${short}${more} → ${t.planPath}`;
  });
  return { lines, total };
}

module.exports = {
  resolveGitIdentity,
  isOwnTheme,
  extractPlanRel,
  parseInProgressThemes,
  listOwnActivePlanThemes,
  formatThemeBulletLines,
  README_REL,
};
