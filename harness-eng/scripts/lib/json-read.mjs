/**
 * UTF-8 JSON helpers — strip BOM so Notepad / PowerShell dumps parse cleanly.
 */
import fs from "fs";

export function stripBom(raw) {
  const s = String(raw ?? "");
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function parseJsonText(raw, label = "JSON") {
  try {
    return JSON.parse(stripBom(raw));
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error(`${label}: ${msg}`);
  }
}

export function readJsonFile(absPath, label) {
  return parseJsonText(fs.readFileSync(absPath, "utf8"), label || absPath);
}

/** Extract first JSON object embedded in CLI stdout (fill-score / refresh / upgrade-diff). */
export function parseFillScoreJson(stdout) {
  const s = String(stdout || "");
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(s.slice(i, j + 1));
  } catch {
    return null;
  }
}
