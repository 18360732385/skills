/**
 * Skill version SSOT helpers.
 * Authority: `_meta/manifest.yaml` → `version`.
 */
import fs from "fs";
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
export function installSkewWarning(runningRoot, installRoot) {
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
    `安装 ${installVer} rev ${installRev} @ ${instReal}）。upgrade 以正在执行的这份为准。`
  );
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
