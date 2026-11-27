/**
 * JSON helpers. Accept UTF-8 (with or without BOM) and UTF-16 LE/BE
 * (BOM, or LE without BOM when the payload is ASCII JSON).
 */
import fs from "fs";

export function stripBom(raw) {
  return String(raw ?? "").replace(/^\uFEFF+/, "");
}

/** @param {Buffer | Uint8Array | string} buf */
export function decodeJsonBuffer(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    return stripBom(b.slice(2).toString("utf16le"));
  }
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    const body = b.slice(2);
    const swapped = Buffer.alloc(body.length - (body.length % 2));
    for (let i = 0; i + 1 < body.length; i += 2) {
      swapped[i] = body[i + 1];
      swapped[i + 1] = body[i];
    }
    return stripBom(swapped.toString("utf16le"));
  }
  if (b.length >= 4 && b[1] === 0x00 && b[0] !== 0x00) {
    return stripBom(b.toString("utf16le"));
  }
  return stripBom(b.toString("utf8"));
}

export function parseJsonText(raw, label = "JSON") {
  const text = Buffer.isBuffer(raw) ? decodeJsonBuffer(raw) : stripBom(raw);
  try {
    return JSON.parse(text);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error(`${label}: ${msg}`);
  }
}

export function readJsonFile(absPath, label) {
  return parseJsonText(decodeJsonBuffer(fs.readFileSync(absPath)), label || absPath);
}

/** Read a text file as UTF-8 or UTF-16 (BOM, or LE without BOM for ASCII text). */
export function readTextFile(filePath) {
  return decodeJsonBuffer(fs.readFileSync(filePath));
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
