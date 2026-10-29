/**
 * 0.7.53: thick-repo hook placeholder backfill for upgrade/resume/land.
 * Prefer explicit params; fill gaps from inventory / scripts / scraped rendered hooks.
 * hook_profile: mature | thin (≠ gate_profile mature_compat).
 */
import fs from "fs";
import path from "path";
import { readInventoryMeta } from "./inventory-meta.mjs";

const HOOK_SCRAPE_FILES = [
  "git-commit-soft-gate.js",
  "after-edit-reminder.js",
  "stop-delivery-checklist.js",
];

const HOOK_SEARCH_DIRS = [
  "docs/agent-config/hooks",
  ".cursor/hooks",
  ".claude/hooks",
  ".codex/hooks",
  ".qoder/hooks",
  ".trae/hooks",
  ".codebuddy/hooks",
];

/**
 * Normalize migration dir for startsWith / anchored RE (never keep globs).
 * @param {string|null|undefined} raw
 * @param {string} [fallback="db/migration/"]
 * @returns {string} trailing-slash relative path without * or ?
 */
export function normalizeMigrationDir(raw, fallback = "db/migration/") {
  let s = String(raw ?? "")
    .replace(/\\/g, "/")
    .trim();
  if (!s || /[*?]/.test(s)) {
    const salvaged = s
      .replace(/\*\*\//g, "")
      .replace(/\*/g, "")
      .replace(/\?/g, "")
      .replace(/\/+/g, "/")
      .replace(/^\//, "");
    if (salvaged && !/[*?]/.test(salvaged) && /db\/migration/i.test(salvaged)) {
      s = salvaged;
    } else {
      if (raw != null && String(raw).trim() && /[*?]/.test(String(raw))) {
        console.error(
          `harness: DB_MIGRATION_DIR rejects glob ${JSON.stringify(String(raw))}; using ${fallback}`
        );
      }
      s = fallback;
    }
  }
  return s.replace(/\/?$/, "/");
}

/**
 * @param {string} root
 * @returns {"mature"|"thin"}
 */
export function detectHookProfile(root, params = {}) {
  const explicit =
    params.hook_profile ||
    params.HOOK_PROFILE ||
    (params.placeholders && params.placeholders.HOOK_PROFILE);
  if (explicit === "mature" || explicit === "thin") return explicit;
  if (!root) return "thin";
  const abs = path.resolve(root);
  const markers = [
    path.join(abs, "scripts", "agent-kb", "lint-pitfalls.mjs"),
    path.join(abs, "scripts", "apply_env_migrations.py"),
    path.join(abs, "docs", "agent-config"),
  ];
  for (const m of markers) {
    try {
      if (fs.existsSync(m)) return "mature";
    } catch {
      /* ignore */
    }
  }
  return "thin";
}

function firstExistingFile(root, relCandidates) {
  for (const rel of relCandidates) {
    const abs = path.join(root, rel);
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Read rendered hook scripts and scrape thick-repo constants.
 * @param {string} root
 * @returns {Record<string, string>}
 */
export function scrapeHookPlaceholders(root) {
  if (!root) return {};
  const absRoot = path.resolve(root);
  const texts = [];
  for (const dir of HOOK_SEARCH_DIRS) {
    for (const name of HOOK_SCRAPE_FILES) {
      const abs = path.join(absRoot, dir, name);
      try {
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          texts.push(fs.readFileSync(abs, "utf8"));
        }
      } catch {
        /* ignore */
      }
    }
    if (texts.length) break; // prefer first host tree that has hooks (agent-config first)
  }
  if (!texts.length) return {};
  const blob = texts.join("\n");
  const out = {};

  const migPrefix = blob.match(
    /(?:const|let)\s+MIGRATION_(?:PREFIX|DIR)\s*=\s*["']([^"']+)["']/
  );
  if (migPrefix && migPrefix[1] && !/[*?]/.test(migPrefix[1])) {
    out.DB_MIGRATION_DIR = normalizeMigrationDir(migPrefix[1]);
  }

  // new RegExp("...") or new RegExp('...')
  const nameRe = blob.match(
    /MIGRATION_NAME_RE\s*=\s*new\s+RegExp\(\s*(["'])([\s\S]*?)\1\s*\)/
  );
  if (nameRe) out.MIGRATION_NAME_RE = nameRe[2];

  const oldSrc = blob.match(
    /MIGRATION_OLD_NAME_RE_SRC\s*=\s*(null|["']([^"']*)["'])/
  );
  if (oldSrc) {
    if (oldSrc[1] === "null") {
      // leave unset — single-track is default
    } else if (oldSrc[2]) {
      out.MIGRATION_OLD_NAME_RE = oldSrc[2];
    }
  }

  const envCmd = blob.match(
    /MIGRATION_ENV_STATUS_CMD\s*=\s*["']([^"']*)["']/
  );
  if (envCmd && envCmd[1]) out.MIGRATION_ENV_STATUS_CMD = envCmd[1];

  const newScript = blob.match(/MIGRATION_NEW_SCRIPT\s*=\s*["']([^"']*)["']/);
  if (newScript && newScript[1]) out.MIGRATION_NEW_SCRIPT = newScript[1];

  const header = blob.match(/HEADER_KEYS\s*=\s*(\[[^\]]*\])/);
  if (header && header[1] && header[1] !== "[]") {
    out.MIGRATION_HEADER_KEYS = header[1];
  }

  const checks = blob.match(
    /(?:const|let)\s+CONTRACT_CHECKS\s*=\s*(\[[\s\S]*?\n\]);/
  );
  if (checks && checks[1] && checks[1].trim() !== "[]") {
    out.CONTRACT_CHECKS_JS = checks[1];
  }

  const profile = blob.match(/HOOK_PROFILE\s*=\s*["'](mature|thin)["']/);
  if (profile) out.HOOK_PROFILE = profile[1];

  return out;
}

/**
 * Build placeholder patch for thick-repo backfill (does not override existing keys).
 * @param {string|null} root
 * @param {object} [params]
 * @param {Record<string, unknown>} [existing]
 * @returns {Record<string, string>}
 */
export function buildHookBackfill(root, params = {}, existing = {}) {
  const out = {};
  const put = (k, v) => {
    if (v == null || v === "") return;
    if (existing[k] != null && String(existing[k]).trim() !== "") return;
    if (
      params[k] != null ||
      params[k.toLowerCase()] != null ||
      (params.placeholders && params.placeholders[k] != null)
    ) {
      return;
    }
    // param aliases
    const aliases = {
      DB_MIGRATION_DIR: ["db_migration_dir"],
      MIGRATION_NAME_RE: ["migration_name_re"],
      MIGRATION_OLD_NAME_RE: ["migration_old_name_re"],
      MIGRATION_ENV_STATUS_CMD: ["migration_env_status_cmd"],
      MIGRATION_NEW_SCRIPT: ["migration_new_script"],
      MIGRATION_HEADER_KEYS: ["migration_header_keys"],
      HOOK_PROFILE: ["hook_profile"],
    };
    for (const a of aliases[k] || []) {
      if (params[a] != null && String(params[a]).trim() !== "") return;
    }
    out[k] = typeof v === "string" ? v : String(v);
  };

  const scraped = root ? scrapeHookPlaceholders(root) : {};
  const inv = root ? readInventoryMeta(root) : {};
  const sqlRoot = inv?.db?.sql_root;

  if (sqlRoot) {
    put("DB_MIGRATION_DIR", normalizeMigrationDir(sqlRoot));
  }
  if (scraped.DB_MIGRATION_DIR) {
    put("DB_MIGRATION_DIR", scraped.DB_MIGRATION_DIR);
  }

  if (root) {
    const abs = path.resolve(root);
    if (
      firstExistingFile(abs, ["scripts/apply_env_migrations.py"])
    ) {
      put(
        "MIGRATION_ENV_STATUS_CMD",
        "python scripts/apply_env_migrations.py --env dev --status"
      );
    }
    if (firstExistingFile(abs, ["scripts/new_migration.py"])) {
      put("MIGRATION_NEW_SCRIPT", "python scripts/new_migration.py");
    }
  }

  for (const k of [
    "MIGRATION_NAME_RE",
    "MIGRATION_OLD_NAME_RE",
    "MIGRATION_ENV_STATUS_CMD",
    "MIGRATION_NEW_SCRIPT",
    "MIGRATION_HEADER_KEYS",
    "CONTRACT_CHECKS_JS",
  ]) {
    if (scraped[k]) put(k, scraped[k]);
  }

  const profile = detectHookProfile(root, params);
  put("HOOK_PROFILE", scraped.HOOK_PROFILE || profile);

  return out;
}

/**
 * Compare before/after hook placeholders for upgrade-diff.
 * @param {Record<string, unknown>|null|undefined} before
 * @param {Record<string, unknown>|null|undefined} after
 * @returns {{ hooks_placeholder_delta: Record<string,{before:unknown,after:unknown}>, capability_lost: string[] }}
 */
export function diffHookPlaceholders(before, after) {
  const keys = [
    "DB_MIGRATION_DIR",
    "MIGRATION_NAME_RE",
    "MIGRATION_OLD_NAME_RE",
    "MIGRATION_ENV_STATUS_CMD",
    "MIGRATION_NEW_SCRIPT",
    "MIGRATION_HEADER_KEYS",
    "HOOK_PROFILE",
    "CONTRACT_CHECKS_JS",
  ];
  const b = before || {};
  const a = after || {};
  const delta = {};
  for (const k of keys) {
    const bv = b[k] != null ? String(b[k]) : "";
    const av = a[k] != null ? String(a[k]) : "";
    if (bv !== av) delta[k] = { before: b[k] ?? null, after: a[k] ?? null };
  }
  const lost = [];
  const had = (v) => v != null && String(v).trim() !== "" && String(v) !== "null" && String(v) !== "[]";
  if (had(b.MIGRATION_ENV_STATUS_CMD) && !had(a.MIGRATION_ENV_STATUS_CMD)) {
    lost.push("ledger_status_autorun");
  }
  if (had(b.MIGRATION_OLD_NAME_RE) && !had(a.MIGRATION_OLD_NAME_RE)) {
    lost.push("dual_track_naming");
  }
  if (had(b.MIGRATION_HEADER_KEYS) && (!had(a.MIGRATION_HEADER_KEYS) || String(a.MIGRATION_HEADER_KEYS) === "[]")) {
    lost.push("header_keys");
  }
  if (
    (String(b.HOOK_PROFILE) === "mature" || had(b.MIGRATION_ENV_STATUS_CMD)) &&
    String(a.HOOK_PROFILE) === "thin"
  ) {
    lost.push("lint_autorun");
  }
  if (had(b.DB_MIGRATION_DIR) && /[*?]/.test(String(a.DB_MIGRATION_DIR || ""))) {
    lost.push("migration_path_match");
  }
  return { hooks_placeholder_delta: delta, capability_lost: lost };
}
