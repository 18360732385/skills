import { readTextFile } from "../text-encoding.mjs";

export function readText(filePath) {
  try {
    return readTextFile(filePath);
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
