/**
 * 消费仓 scripts/release-eng/ 快照版本对账。
 */
import fs from "fs";
import path from "path";
import { stripBom } from "../release-format.mjs";

/**
 * @param {string} repoRoot
 * @param {string} skillVersion
 * @returns {{ exists: boolean, ok: boolean, version: string|null, path: string }}
 */
export function checkConsumerSnapshot(repoRoot, skillVersion) {
  const versionPath = path.join(repoRoot, "scripts", "release-eng", "VERSION");
  const dir = path.join(repoRoot, "scripts", "release-eng");
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { exists: false, ok: true, version: null, path: versionPath };
  }
  if (!fs.existsSync(versionPath)) {
    return { exists: true, ok: false, version: null, path: versionPath };
  }
  const version = stripBom(fs.readFileSync(versionPath, "utf8")).trim();
  return {
    exists: true,
    ok: version === String(skillVersion).trim(),
    version,
    path: versionPath,
  };
}

/**
 * 从 skill scripts/ 同步到消费仓 scripts/release-eng/ 并写 VERSION。
 * @param {string} skillScriptsDir
 * @param {string} repoRoot
 * @param {string} skillVersion
 */
export function applyConsumerSnapshot(skillScriptsDir, repoRoot, skillVersion) {
  const dest = path.join(repoRoot, "scripts", "release-eng");
  fs.mkdirSync(dest, { recursive: true });
  const skip = new Set([
    "selfcheck.mjs",
    "sync-skill-version.mjs",
    ".gitignore",
  ]);
  const entries = fs.readdirSync(skillScriptsDir, { withFileTypes: true });
  const copied = [];
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    if (skip.has(ent.name)) continue;
    const src = path.join(skillScriptsDir, ent.name);
    const dst = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDir(src, dst);
      copied.push(ent.name + "/");
    } else if (ent.isFile() && ent.name.endsWith(".mjs")) {
      fs.copyFileSync(src, dst);
      copied.push(ent.name);
    }
  }
  // lib/
  const libSrc = path.join(skillScriptsDir, "lib");
  if (fs.existsSync(libSrc)) {
    copyDir(libSrc, path.join(dest, "lib"));
    copied.push("lib/");
  }
  fs.writeFileSync(path.join(dest, "VERSION"), `${skillVersion}\n`, "utf8");
  return { dest, copied, version: skillVersion };
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}
