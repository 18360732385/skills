/**
 * Disk-write authorization for harness.mjs / render.mjs.
 * Spoken gate phrases are the only write tokens. Persisted preauth lives in
 * docs/harness-eng/write-auth.yaml and authorizes later rounds only.
 */
import fs from "fs";
import path from "path";
import { readTextFile } from "./json-read.mjs";

export const PREAUTH_REL = "docs/harness-eng/write-auth.yaml";

export const WRITE_PHRASES = ["确认写入", "按计划执行", "执行 WritePlan", "LGTM"];
export const PREAUTH_PHRASES = ["确认预授权", "预授权后续写盘"];
export const CANCEL_PHRASE = "取消预授权";

const SUBSET_RE = /^(只执行 L[0-5]|去掉 14 后执行)$/;

export function confirmKind(phrase) {
  const p = String(phrase || "").trim();
  if (!p) return null;
  if (WRITE_PHRASES.includes(p) || SUBSET_RE.test(p)) return "write";
  if (PREAUTH_PHRASES.includes(p)) return "preauth";
  if (p === CANCEL_PHRASE) return "cancel";
  return null;
}

export function preauthPath(root) {
  return path.join(root, ...PREAUTH_REL.split("/"));
}

export function readPreauth(root) {
  if (!root) return { present: false, on: false };
  const abs = preauthPath(root);
  if (!fs.existsSync(abs)) return { present: false, on: false };
  let text = "";
  try {
    text = readTextFile(abs);
  } catch {
    return { present: false, on: false };
  }
  const m = text.match(/^preauth:\s*(true|false)\s*$/m);
  if (!m) return { present: false, on: false };
  return { present: true, on: m[1] === "true" };
}

export function applyPreauth(root, mutate) {
  if (!root || (mutate !== "set" && mutate !== "clear")) return;
  const abs = preauthPath(root);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (mutate === "set") {
    fs.writeFileSync(abs, "preauth: true\nphrase: 确认预授权\n", "utf8");
    return;
  }
  fs.writeFileSync(abs, "preauth: false\n", "utf8");
}

/**
 * @param {{ confirms?: string[], root?: string|null, dryRun?: boolean, writes?: boolean }} opts
 * @returns {{ ok: boolean, exitCode: number, mutate: null|"set"|"clear", message: string }}
 */
export function decideWriteAuth(opts = {}) {
  const list = (Array.isArray(opts.confirms) ? opts.confirms : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
  const unknown = list.filter((p) => !confirmKind(p));
  if (unknown.length) {
    return {
      ok: false,
      exitCode: 1,
      mutate: null,
      message:
        `harness: 无法识别的确认词：${unknown.join("、")}。` +
        "写盘用 --confirm 确认写入（或 按计划执行 / 执行 WritePlan / LGTM / 只执行 L0…L5 / 去掉 14 后执行）。",
    };
  }
  const kinds = new Set(list.map((p) => confirmKind(p)));
  const hasWrite = kinds.has("write");
  const hasPre = kinds.has("preauth");
  const hasCancel = kinds.has("cancel");
  let mutate = null;
  if (hasCancel) mutate = "clear";
  else if (hasPre) mutate = "set";

  if (!opts.writes || opts.dryRun) {
    const note =
      opts.dryRun && mutate
        ? `harness: --dry-run，不改 write-auth.yaml（将${mutate === "set" ? "记录" : "取消"}预授权）。`
        : "";
    return { ok: true, exitCode: 0, mutate: null, message: note };
  }

  const persisted = readPreauth(opts.root).on && !hasCancel;
  if (hasWrite || persisted) {
    const bits = [];
    if (mutate === "set") {
      bits.push("harness: 已记录预授权（docs/harness-eng/write-auth.yaml）。后续写盘可省略 --confirm。");
    }
    if (mutate === "clear") bits.push("harness: 已取消预授权。");
    if (!hasWrite && persisted) bits.push("harness: 沿用已落盘预授权。");
    return { ok: true, exitCode: 0, mutate, message: bits.join("\n") };
  }
  if (hasPre) {
    return {
      ok: false,
      exitCode: 0,
      mutate,
      message: "harness: 已记录预授权。本轮未写盘；要写本轮再加 --confirm 确认写入。",
    };
  }
  if (hasCancel) {
    return {
      ok: false,
      exitCode: 0,
      mutate,
      message: "harness: 已取消预授权。本轮未写盘。",
    };
  }
  return {
    ok: false,
    exitCode: 1,
    mutate: null,
    message:
      "harness: 写盘被确认闸门拦住。请加 --confirm 确认写入（或 按计划执行 / 执行 WritePlan / LGTM）。" +
      "预授权用 --confirm 确认预授权，只对后续轮次生效。--dry-run 不需要确认词。",
  };
}
