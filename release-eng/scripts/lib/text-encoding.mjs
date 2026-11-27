/**
 * Decode user files that may be UTF-8 or UTF-16 (PowerShell Out-File / `>`).
 */
import fs from "fs";

export function stripBom(raw) {
  return String(raw ?? "").replace(/^\uFEFF+/, "");
}

/** @param {Buffer | Uint8Array | string} buf */
export function decodeTextBuffer(buf) {
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

export function readTextFile(filePath) {
  return decodeTextBuffer(fs.readFileSync(filePath));
}
