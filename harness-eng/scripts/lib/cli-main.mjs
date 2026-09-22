/**
 * CLI entry guard that survives Windows junctions / symlinks.
 * path.resolve(argv[1]) !== fileURLToPath(import.meta.url) when the skill
 * is reached via .claude/skills → .agents/skills junction.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @param {string} metaUrl import.meta.url of the calling module
 * @param {string} [argv1=process.argv[1]]
 * @returns {boolean}
 */
export function isCliMain(metaUrl, argv1 = process.argv[1]) {
  if (!argv1 || !metaUrl) return false;
  const resolvedArg = path.resolve(argv1);
  const resolvedSelf = path.resolve(fileURLToPath(metaUrl));
  try {
    return fs.realpathSync(resolvedArg) === fs.realpathSync(resolvedSelf);
  } catch {
    return resolvedArg === resolvedSelf;
  }
}
