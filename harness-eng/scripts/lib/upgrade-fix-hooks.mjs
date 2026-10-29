/**
 * 0.7.54: upgrade_fix_hooks policy — replace | skip | auto.
 * auto: adapters always replace; other fix-hooks skip when structural customization detected.
 */
import fs from "fs";
import path from "path";

/** Scripts that upgrade may force-replace (behavior-fix family). */
export const UPGRADE_FIX_HOOK_SCRIPTS = new Set([
  "git-commit-soft-gate.js",
  "after-edit-reminder.js",
  "superpowers-commit-gate.js",
  "mcp-mysql-guard.js",
  "stop-delivery-checklist.js",
  "codex-stop-checklist.js",
  "codex-adapter.js",
  "claude-adapter.js",
  "codex-hook.cmd",
]);

/** Adapters / cmd: always replace under auto (rarely customized). */
export const UPGRADE_FIX_HOOK_ALWAYS_REPLACE = new Set([
  "codex-adapter.js",
  "claude-adapter.js",
  "codex-hook.cmd",
]);

const CONST_NAME_RE =
  /^(?:MIGRATION_(?:PREFIX|DIR|ENVS|NAME_RE|ENV_STATUS_CMD|NEW_SCRIPT|OLD_NAME_RE(?:_SRC)?|SEG_RE|ANY_RE)|HOOK_PROFILE|HEADER_KEYS|CODE_PREFIXES|CONTRACT_CHECKS|JOBS_YML_RE|JOBS_DIFF_KEYWORD_RE|JOBS_KEYWORD_RE|FINGERPRINT_FILE|STDIN_TIMEOUT_MS|OPENAPI_BRIDGE_TIP|GENERATED_PATH_RE|GENERATED_FILES|GENERATED_EXCLUDE|argv|GIT_MODE|HOST_SOFT)$/;

/**
 * Remove one const/let/var declaration starting at index (handles multi-line values).
 * @returns {number} end index after declaration (exclusive), or start if not a decl
 */
function endOfDeclaration(text, start) {
  const slice = text.slice(start);
  const m = slice.match(/^\s*(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\b\s*=\s*/);
  if (!m || !CONST_NAME_RE.test(m[1])) return start;
  let i = start + m[0].length;
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      depth++;
      continue;
    }
    if (c === ")" || c === "]" || c === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (c === ";" && depth === 0) return i + 1;
  }
  return start;
}

/**
 * @param {unknown} raw
 * @returns {"replace"|"skip"|"auto"}
 */
export function normalizeUpgradeFixHooks(raw) {
  if (raw == null || raw === "") return "auto";
  const s = String(raw).trim().toLowerCase();
  if (s === "true" || s === "replace" || s === "1" || s === "yes" || s === "on") {
    return "replace";
  }
  if (s === "false" || s === "skip" || s === "0" || s === "no" || s === "off") {
    return "skip";
  }
  if (s === "auto") return "auto";
  return "auto";
}

/**
 * @param {string} relNorm
 * @returns {boolean}
 */
export function isUpgradeFixHookTarget(relNorm) {
  const rel = String(relNorm || "").replace(/\\/g, "/");
  const base = path.basename(rel);
  if (!UPGRADE_FIX_HOOK_SCRIPTS.has(base)) return false;
  return (
    rel.startsWith("docs/agent-config/hooks/") ||
    /^(\.cursor|\.claude|\.codex|\.qoder|\.trae|\.codebuddy|\.githooks)\/hooks\//.test(
      rel
    ) ||
    rel.startsWith(".githooks/")
  );
}

function normalizeEol(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/, "\n");
}

/**
 * Strip placeholder-driven const/let assignments (incl. multi-line) and leading shebang / block comments.
 * @param {string} text
 * @returns {string}
 */
export function stripHookConstSkeleton(text) {
  let t = normalizeEol(text);
  t = t.replace(/^#![^\n]*\n/, "");
  t = t.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "");
  t = t.replace(/^\/\*[\s\S]*?\*\/\s*/, "");
  let out = "";
  let i = 0;
  while (i < t.length) {
    const next = endOfDeclaration(t, i);
    if (next > i) {
      i = next;
      // drop following newline clutter
      while (t[i] === "\n") i++;
      continue;
    }
    out += t[i];
    i++;
  }
  return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/**
 * @param {string} diskText
 * @param {string} renderedText
 * @returns {boolean} true if body beyond consts differs → structural customization
 */
export function detectStructuralHookCustomization(diskText, renderedText) {
  if (!diskText || !String(diskText).trim()) return false;
  if (!renderedText || !String(renderedText).trim()) return false;
  const a = stripHookConstSkeleton(diskText);
  const b = stripHookConstSkeleton(renderedText);
  return a !== b;
}

/**
 * Whether upgrade should force-replace this fix-hook target (policy only; structural needs rendered).
 * For auto + non-adapter: returns true (tentative); applyOne must re-check with rendered text.
 * @param {{ mode?: unknown, targetRel: string }} opts
 * @returns {boolean}
 */
export function shouldReplaceFixHook(opts = {}) {
  const mode = normalizeUpgradeFixHooks(opts.mode);
  const base = path.basename(String(opts.targetRel || "").replace(/\\/g, "/"));
  if (!UPGRADE_FIX_HOOK_SCRIPTS.has(base) && !isUpgradeFixHookTarget(opts.targetRel)) {
    return false;
  }
  if (mode === "skip") return false;
  if (mode === "replace") return true;
  // auto
  if (UPGRADE_FIX_HOOK_ALWAYS_REPLACE.has(base)) return true;
  return true; // tentative replace; structural gate in applyOne
}

/**
 * Final action after render is known.
 * @param {{ mode?: unknown, targetRel: string, diskText?: string, renderedText?: string, exists?: boolean }} opts
 * @returns {"create"|"replace"|"skip"}
 */
export function decideFixHookAction(opts = {}) {
  const mode = normalizeUpgradeFixHooks(opts.mode);
  const rel = String(opts.targetRel || "").replace(/\\/g, "/");
  const base = path.basename(rel);
  if (!opts.exists) return "create";
  if (mode === "skip") return "skip";
  if (mode === "replace") return "replace";
  // auto
  if (UPGRADE_FIX_HOOK_ALWAYS_REPLACE.has(base)) return "replace";
  if (
    detectStructuralHookCustomization(opts.diskText || "", opts.renderedText || "")
  ) {
    return "skip";
  }
  return "replace";
}

/**
 * Collect fix-hook paths that would be skipped under auto due to structural customization.
 * Used by upgrade-diff when render log is unavailable.
 * @param {string} root
 * @param {string} skillRoot
 * @param {(rel: string, disk: string) => string|null} renderForCompare - return rendered text or null to skip
 * @returns {string[]}
 */
export function collectSkippedCustomHooks(root, skillRoot, renderForCompare) {
  void skillRoot;
  const absRoot = path.resolve(root);
  const skipped = [];
  const searchDirs = [
    "docs/agent-config/hooks",
    ".cursor/hooks",
    ".claude/hooks",
    ".codex/hooks",
    ".qoder/hooks",
    ".trae/hooks",
    ".codebuddy/hooks",
  ];
  for (const dir of searchDirs) {
    for (const name of UPGRADE_FIX_HOOK_SCRIPTS) {
      if (UPGRADE_FIX_HOOK_ALWAYS_REPLACE.has(name)) continue;
      const rel = `${dir}/${name}`.replace(/\\/g, "/");
      const abs = path.join(absRoot, dir, name);
      try {
        if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
        const disk = fs.readFileSync(abs, "utf8");
        const rendered = renderForCompare ? renderForCompare(rel, disk) : null;
        if (rendered == null) continue;
        if (detectStructuralHookCustomization(disk, rendered)) {
          skipped.push(rel);
        }
      } catch {
        /* ignore */
      }
    }
    if (skipped.length) break; // prefer first host tree
  }
  return skipped;
}
