import fs from "fs";
import { stripBom } from "../../release-format.mjs";

export function readText(filePath) {
  try {
    return stripBom(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function normPath(p) {
  return String(p || "").replace(/\\/g, "/");
}

export function baseName(p) {
  const n = normPath(p);
  return n.split("/").pop() || n;
}
