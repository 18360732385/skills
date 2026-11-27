/**
 * 安全落盘：避免 PowerShell `>` 写成 UTF-16 LE 导致 JSON.parse 失败。
 * json / audit-json 在未指定 --out 时，Win32 默认写临时文件并在 stderr 提示路径。
 */
import fs from "fs";
import os from "os";
import path from "path";
import { readTextFile } from "./text-encoding.mjs";

/**
 * @param {{ format?: string, out?: string|null, prefix?: string, forceTemp?: boolean }} opts
 * @returns {{ outPath: string|null, autoOut: boolean }}
 */
export function resolveSafeOut(opts = {}) {
  const format = String(opts.format || "json").toLowerCase();
  const explicit = opts.out ? path.resolve(String(opts.out)) : null;
  if (explicit) return { outPath: explicit, autoOut: false };

  const bulky = format === "json" || format === "audit-json";
  const wantTemp =
    opts.forceTemp === true ||
    (bulky && (opts.forceTemp !== false && process.platform === "win32"));

  if (!wantTemp) return { outPath: null, autoOut: false };

  const prefix = opts.prefix || "release-eng-out";
  const outPath = path.join(
    os.tmpdir(),
    `${prefix}-${Date.now()}-${process.pid}.${format.includes("json") ? "json" : "txt"}`
  );
  return { outPath, autoOut: true };
}

/**
 * 写出文本；autoOut 时 stderr 提示路径，stdout 只打一行指针（便于管道）。
 * @param {string} text
 * @param {{ outPath: string|null, autoOut?: boolean, label?: string }} resolved
 */
export function emitText(text, resolved = {}) {
  const body = text.endsWith("\n") ? text : text + "\n";
  if (resolved.outPath) {
    fs.writeFileSync(resolved.outPath, body, "utf8");
    const label = resolved.label || "written";
    if (resolved.autoOut) {
      console.error(
        `[safe-out] ${label} ${resolved.outPath}（Win32 默认落盘，避免 PowerShell > UTF-16；显式 --out 可改路径）`
      );
      console.log(resolved.outPath);
    } else {
      console.log(`${label} ${resolved.outPath}`);
    }
    return resolved.outPath;
  }
  process.stdout.write(body);
  return null;
}

/** 读 JSON 文件。接受 UTF-8 / UTF-16（含 BOM）。 */
export function readJsonFileSafe(filePath, stripBom) {
  const raw = readTextFile(filePath);
  const text = typeof stripBom === "function" ? stripBom(raw) : raw;
  return JSON.parse(text);
}
