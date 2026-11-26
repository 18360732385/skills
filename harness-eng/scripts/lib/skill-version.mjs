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
 * Silent when the install dir is missing, unreadable, the same realpath, or the same version.
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
  try {
    runningVer = readSkillVersion(runReal);
  } catch {
    return null;
  }
  const installVer = readManifestVersionAt(installManifest);
  if (!installVer || installVer === runningVer) return null;
  return (
    `harness: 安装副本版本与正在执行的技能不一致（执行 ${runningVer} @ ${runReal}；` +
    `安装 ${installVer} @ ${instReal}）。upgrade 以正在执行的这份为准。`
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
