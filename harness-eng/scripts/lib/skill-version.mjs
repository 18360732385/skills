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
