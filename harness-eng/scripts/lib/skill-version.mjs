/**
 * Skill version SSOT helpers.
 * Authority: `_meta/manifest.yaml` → `version`.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { parse as parseYaml } from "./yaml.mjs";

const SEMVER_RE = /^\d+\.\d+\.\d+([.-][0-9A-Za-z.-]+)?$/;

/**
 * @param {string} skillRoot
 * @returns {string}
 */
export function readSkillVersion(skillRoot) {
  const manifestPath = path.join(skillRoot, "_meta", "manifest.yaml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`skill version SSOT missing: ${manifestPath}`);
  }
  const doc = parseYaml(fs.readFileSync(manifestPath, "utf8")) || {};
  const version = doc.version != null ? String(doc.version).trim() : "";
  if (!version) {
    throw new Error(`skill version missing in ${manifestPath}`);
  }
  if (!SEMVER_RE.test(version)) {
    throw new Error(`invalid skill version "${version}" in ${manifestPath}`);
  }
  return version;
}

/**
 * Package build revision within a semver version.
 * @param {string} skillRoot
 * @returns {number}
 */
export function readSkillRev(skillRoot) {
  const manifestPath = path.join(skillRoot, "_meta", "manifest.yaml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`skill rev SSOT missing: ${manifestPath}`);
  }
  const doc = parseYaml(fs.readFileSync(manifestPath, "utf8")) || {};
  const raw = doc.rev != null ? String(doc.rev).trim() : "0";
  if (!/^\d+$/.test(raw)) {
    throw new Error(`invalid skill rev "${raw}" in ${manifestPath}`);
  }
  return Number(raw);
}

/**
 * Escape a semver string for use inside a RegExp source.
 * @param {string} v
 * @returns {string}
 */
export function escapeSemverRe(v) {
  return String(v).replace(/\./g, "\\.");
}

/**
 * Read version from templates/_meta/manifest.yaml (mechanical copy; may lag SSOT).
 * @param {string} skillRoot
 * @returns {string|null}
 */
/**
 * 0.8.7: running skill vs an install copy (typically ~/.cursor/skills/harness-eng).
 * Silent when the install dir is missing, unreadable, the same realpath, or the same version and rev.
 * A missing `rev` counts as 0.
 * @param {string} runningRoot
 * @param {string} installRoot
 * @returns {string|null}
 */
export function installSkewWarning(runningRoot, installRoot, opts = {}) {
  if (!runningRoot || !installRoot) return null;
  const installManifest = path.join(installRoot, "_meta", "manifest.yaml");
  if (!fs.existsSync(installManifest)) return null;
  let runReal;
  let instReal;
  try {
    runReal = fs.realpathSync(path.resolve(runningRoot));
    instReal = fs.realpathSync(path.resolve(installRoot));
  } catch {
    return null;
  }
  if (runReal === instReal) return null;
  let runningVer;
  let runningRev;
  try {
    runningVer = readSkillVersion(runReal);
    runningRev = readSkillRev(runReal);
  } catch {
    return null;
  }
  const installVer = readManifestVersionAt(installManifest);
  if (!installVer) return null;
  const installRev = readManifestRevAt(installManifest);
  if (installVer === runningVer && installRev === runningRev) return null;
  return (
    `harness: 安装副本版本与正在执行的技能不一致（执行 ${runningVer} rev ${runningRev} @ ${runReal}；` +
    `安装 ${installVer} rev ${installRev} @ ${instReal}）。` +
    `${opts && opts.mode ? String(opts.mode) : "本次调用"} 以正在执行的这份为准。`
  );
}

export const DEFAULT_INSTALL_HOSTS = [
  ".cursor",
  ".trae",
  ".claude",
  ".codex",
  ".qoder",
  ".codebuddy",
  ".workbuddy",
];

export function managerDataInstallRoots(home = os.homedir()) {
  const out = [];
  for (const key of ["SKILLS_MANAGER_DATA", "SKILLS_MANAGER_ROOT"]) {
    const v = String(process.env[key] || "").trim();
    if (v) out.push(path.join(v, "skills", "harness-eng"));
  }
  out.push(path.join(home, "skills-manager-data", "skills", "harness-eng"));
  if (process.platform === "win32") {
    for (const base of ["D:\\software", "C:\\software", "C:\\ProgramData"]) {
      out.push(path.join(base, "skills-manager-data", "skills", "harness-eng"));
    }
  }
  return out;
}

export function defaultInstallRoots(home = os.homedir()) {
  return [...new Set([
    ...DEFAULT_INSTALL_HOSTS.map((host) =>
      path.join(home, host, "skills", "harness-eng")
    ),
    ...managerDataInstallRoots(home),
  ])];
}

export function envInstallRoots() {
  const raw = String(process.env.HARNESS_INSTALL_ROOTS || "").trim();
  if (!raw) return [];
  return raw
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 0.8.13: warn for every installed copy, not only ~/.cursor. */
export function installSkewWarnings(runningRoot, installRoots = defaultInstallRoots(), opts = {}) {
  const out = [];
  for (const root of installRoots || []) {
    const msg = installSkewWarning(runningRoot, root, opts);
    if (msg && !out.includes(msg)) out.push(msg);
  }
  return out;
}

function readManifestVersionAt(manifestPath) {
  try {
    const doc = parseYaml(fs.readFileSync(manifestPath, "utf8")) || {};
    const version = doc.version != null ? String(doc.version).trim() : "";
    return version || null;
  } catch {
    return null;
  }
}

function readManifestRevAt(manifestPath) {
  try {
    const doc = parseYaml(fs.readFileSync(manifestPath, "utf8")) || {};
    if (doc.rev == null || String(doc.rev).trim() === "") return 0;
    const n = Number(doc.rev);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function readTemplatesManifestVersion(skillRoot) {
  const p = path.join(skillRoot, "templates", "_meta", "manifest.yaml");
  if (!fs.existsSync(p)) return null;
  try {
    const doc = parseYaml(fs.readFileSync(p, "utf8")) || {};
    const version = doc.version != null ? String(doc.version).trim() : "";
    return version || null;
  } catch {
    return null;
  }
}
