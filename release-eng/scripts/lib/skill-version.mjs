/**
 * Skill version SSOT helpers (release-eng).
 * Authority: `_meta/manifest.yaml` → `version`.
 * Regex-only — no yaml dependency (portable copy-skill-dir).
 */
import fs from "fs";
import path from "path";

/** Allow 0.3.19 and 0.3.19-dev style pins. */
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
  const text = fs.readFileSync(manifestPath, "utf8");
  const m = text.match(/^version:\s*"([^"]+)"/m);
  const version = m ? m[1].trim() : "";
  if (!version) {
    throw new Error(`skill version missing in ${manifestPath}`);
  }
  if (!SEMVER_RE.test(version)) {
    throw new Error(`invalid skill version "${version}" in ${manifestPath}`);
  }
  return version;
}

/**
 * @param {string} v
 * @returns {string}
 */
export function escapeSemverRe(v) {
  return String(v).replace(/\./g, "\\.");
}

/**
 * Infer previous pin from known doc headers (for sync replace-from).
 * @param {string} skillRoot
 * @returns {string|null}
 */
export function inferPinnedVersionFromDocs(skillRoot) {
  const verify = path.join(skillRoot, "VERIFY.md");
  if (fs.existsSync(verify)) {
    const t = fs.readFileSync(verify, "utf8");
    const m = t.match(/当前 \*\*([^*]+)\*\*/);
    if (m && SEMVER_RE.test(m[1].trim())) return m[1].trim();
  }
  const readme = path.join(skillRoot, "README.md");
  if (fs.existsSync(readme)) {
    const t = fs.readFileSync(readme, "utf8");
    const m = t.match(/当前 \*\*([^*]+)\*\*/);
    if (m && SEMVER_RE.test(m[1].trim())) return m[1].trim();
  }
  const skill = path.join(skillRoot, "SKILL.md");
  if (fs.existsSync(skill)) {
    const t = fs.readFileSync(skill, "utf8");
    const m = t.match(/（\*\*([^*]+)\*\*；/);
    if (m && SEMVER_RE.test(m[1].trim())) return m[1].trim();
  }
  return null;
}
