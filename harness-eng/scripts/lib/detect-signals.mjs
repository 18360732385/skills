/**
 * Cheap detect-signal probes for fixtures / selfcheck (0.5.9+; 0.7.20 monorepo).
 * Boolean FS checks only — not a full Fingerprint runner.
 */
import fs from "fs";
import path from "path";

const STACK_FILES = ["pom.xml", "package.json", "go.mod", "Cargo.toml", "pyproject.toml"];

function isFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
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

/** Root or one-level child directory contains a stack manifest. */
function hasStack(root) {
  if (STACK_FILES.some((f) => isFile(path.join(root, f)))) return true;
  let names = [];
  try {
    names = fs.readdirSync(root);
  } catch {
    return false;
  }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules" || name === "target") continue;
    const dir = path.join(root, name);
    if (!isDir(dir)) continue;
    if (STACK_FILES.some((f) => isFile(path.join(dir, f)))) return true;
  }
  return false;
}

function listPomFiles(root) {
  const out = [];
  if (isFile(path.join(root, "pom.xml"))) out.push(path.join(root, "pom.xml"));
  let names = [];
  try {
    names = fs.readdirSync(root);
  } catch {
    return out;
  }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules" || name === "target") continue;
    const p = path.join(root, name, "pom.xml");
    if (isFile(p)) out.push(p);
  }
  return out;
}

function hasSpring(root) {
  for (const pom of listPomFiles(root)) {
    try {
      const text = fs.readFileSync(pom, "utf8");
      if (/spring-boot/i.test(text)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function packageJsonLooksFrontend(pkgPath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.workspaces) return true;
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.react || deps.vue || deps.vite || deps.next || deps["@angular/core"]) return true;
    if (pkg.name && /web|frontend|ui/i.test(String(pkg.name))) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function hasFrontend(root) {
  if (isFile(path.join(root, "frontend", "package.json"))) return true;
  if (isDir(path.join(root, "apps"))) {
    let apps = [];
    try {
      apps = fs.readdirSync(path.join(root, "apps"));
    } catch {
      apps = [];
    }
    for (const a of apps) {
      if (isFile(path.join(root, "apps", a, "package.json"))) return true;
    }
  }
  const rootPkg = path.join(root, "package.json");
  if (isFile(rootPkg) && packageJsonLooksFrontend(rootPkg)) return true;
  let names = [];
  try {
    names = fs.readdirSync(root);
  } catch {
    return false;
  }
  for (const name of names) {
    const pkg = path.join(root, name, "package.json");
    if (isFile(pkg) && packageJsonLooksFrontend(pkg)) return true;
  }
  return false;
}

/** Cheap Java source fingerprint scan (depth-capped). 0.7.34 LD-4. */
function scanJavaCodeFingerprints(root) {
  const out = {
    S_CODE_API: false,
    S_CODE_FUNC: false,
    S_CODE_REDIS: false,
    S_CODE_JOBS: false,
    S_CODE_DB: false,
  };
  // migration / flyway dirs
  const migHints = [
    path.join(root, "db", "migration"),
    path.join(root, "src", "main", "resources", "db", "migration"),
  ];
  for (const p of migHints) {
    if (hasNonEmptyIn(p)) out.S_CODE_DB = true;
  }
  let names = [];
  try {
    names = fs.readdirSync(root);
  } catch {
    return out;
  }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules" || name === "target") continue;
    const mig = path.join(root, name, "src", "main", "resources", "db", "migration");
    if (hasNonEmptyIn(mig)) out.S_CODE_DB = true;
  }

  const stack = [{ dir: root, depth: 0 }];
  let filesSeen = 0;
  while (stack.length && filesSeen < 400) {
    const { dir, depth } = stack.pop();
    if (depth > 8) continue;
    let ents = [];
    try {
      ents = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of ents) {
      if (name === ".git" || name === "node_modules" || name === "target" || name === "dist")
        continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push({ dir: p, depth: depth + 1 });
        continue;
      }
      if (!/\.java$/i.test(name)) continue;
      filesSeen++;
      let text = "";
      try {
        text = fs.readFileSync(p, "utf8");
      } catch {
        continue;
      }
      if (/@(?:Rest)?Controller\b/.test(text)) out.S_CODE_API = true;
      if (/@Service\b/.test(text)) out.S_CODE_FUNC = true;
      if (/RedisTemplate|StringRedisTemplate|@Cacheable\b|RedissonClient/.test(text))
        out.S_CODE_REDIS = true;
      if (
        /@Scheduled\b|SchedulingConfigurer|SyncTaskCode|SyncTaskMetadataRegistry/.test(text) ||
        /Scheduler\.java$/i.test(name)
      ) {
        out.S_CODE_JOBS = true;
      }
      if (out.S_CODE_API && out.S_CODE_FUNC && out.S_CODE_REDIS && out.S_CODE_JOBS) {
        return out;
      }
    }
  }
  return out;
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
  const docsJobs = hasNonEmptyIn(path.join(root, "docs", "jobs"));
  const codeFp = scanJavaCodeFingerprints(root);
  // detect.md: S_JOBS = docs OR scheduler fingerprints
  const S_JOBS = docsJobs || codeFp.S_CODE_JOBS;
  const S_KB = hasNonEmptyIn(path.join(root, "docs", "agent-kb"));
  const S_STACK = hasStack(root);
  const S_SPRING = hasSpring(root);
  const S_FRONTEND = hasFrontend(root);
  const S_SP = hasNonEmptyIn(path.join(root, "docs", "superpowers"));
  const S_RUNS =
    isDir(path.join(root, "docs", "runs")) ||
    hasNonEmptyIn(path.join(root, "docs", "runs"));
  const S_RULEHOOK = isFile(path.join(root, ".rulehook", "rulehook.toml"));
  // MATURE still requires docs contract dirs (not code-only S_JOBS)
  const MATURE = !!(
    S_AGENTS_ROOT &&
    S_RULES &&
    (S_FUNC || S_API || S_DB || S_REDIS || docsJobs) &&
    S_KB
  );
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
    S_SPRING,
    S_FRONTEND,
    S_SP,
    S_RUNS,
    S_RULEHOOK,
    S_CODE_API: codeFp.S_CODE_API,
    S_CODE_FUNC: codeFp.S_CODE_FUNC,
    S_CODE_REDIS: codeFp.S_CODE_REDIS,
    S_CODE_DB: codeFp.S_CODE_DB,
    S_CODE_JOBS: codeFp.S_CODE_JOBS,
    MATURE,
  };
}

export default { scanSignals };
