/**
 * Cheap detect-signal probes for fixtures / selfcheck (0.5.9).
 * Boolean FS checks only — not a full Fingerprint runner.
 */
import fs from "fs";
import path from "path";

function isFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function walkNonEmptyFiles(dir, acc = [], depth = 0) {
  if (depth > 4 || !fs.existsSync(dir)) return acc;
  let st;
  try {
    st = fs.statSync(dir);
  } catch {
    return acc;
  }
  if (st.isFile()) {
    if (st.size > 0) acc.push(dir);
    return acc;
  }
  if (!st.isDirectory()) return acc;
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of names) {
    if (name === ".git" || name === "node_modules" || name === "target") continue;
    walkNonEmptyFiles(path.join(dir, name), acc, depth + 1);
  }
  return acc;
}

function hasNonEmptyIn(dir) {
  return walkNonEmptyFiles(dir).length > 0;
}

function settingsHasHooks(abs) {
  if (!isFile(abs)) return false;
  try {
    const doc = JSON.parse(fs.readFileSync(abs, "utf8"));
    return !!(doc && doc.hooks);
  } catch {
    return false;
  }
}

function hasRules(root) {
  return [
    path.join(root, ".cursor", "rules"),
    path.join(root, ".claude", "rules"),
    path.join(root, ".qoder", "rules"),
    path.join(root, ".trae", "rules"),
    path.join(root, ".codebuddy", "rules"),
  ].some(hasNonEmptyIn);
}

function hasHooks(root) {
  if (isFile(path.join(root, ".cursor", "hooks.json"))) return true;
  if (isFile(path.join(root, ".trae", "hooks.json"))) return true;
  if (isFile(path.join(root, ".codex", "hooks.json"))) return true;
  if (isFile(path.join(root, ".githooks", "pre-commit"))) return true;
  return [
    path.join(root, ".claude", "settings.json"),
    path.join(root, ".qoder", "settings.json"),
    path.join(root, ".codebuddy", "settings.json"),
  ].some(settingsHasHooks);
}

function hasStack(root) {
  return ["pom.xml", "package.json", "go.mod", "Cargo.toml", "pyproject.toml"].some((f) =>
    isFile(path.join(root, f))
  );
}

/**
 * @param {string} root
 * @returns {Record<string, boolean>}
 */
export function scanSignals(root) {
  const S_AGENTS_ROOT = isFile(path.join(root, "AGENTS.md"));
  const S_RULES = hasRules(root);
  const S_CURSOR_RULES = hasNonEmptyIn(path.join(root, ".cursor", "rules"));
  const S_HOOKS = hasHooks(root);
  const S_FUNC = hasNonEmptyIn(path.join(root, "docs", "func"));
  const S_API = hasNonEmptyIn(path.join(root, "docs", "api"));
  const S_DB = hasNonEmptyIn(path.join(root, "docs", "db"));
  const S_REDIS = hasNonEmptyIn(path.join(root, "docs", "redis"));
  const S_JOBS = hasNonEmptyIn(path.join(root, "docs", "jobs"));
  const S_KB = hasNonEmptyIn(path.join(root, "docs", "agent-kb"));
  const S_STACK = hasStack(root);
  const MATURE = !!(S_AGENTS_ROOT && S_RULES && (S_FUNC || S_API || S_DB || S_REDIS || S_JOBS) && S_KB);
  return {
    S_AGENTS_ROOT,
    S_RULES,
    S_CURSOR_RULES,
    S_HOOKS,
    S_FUNC,
    S_API,
    S_DB,
    S_REDIS,
    S_JOBS,
    S_KB,
    S_STACK,
    MATURE,
  };
}

export default { scanSignals };
