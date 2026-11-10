#!/usr/bin/env node
/**
 * 为 pitfalls.md 分配下一时间戳 ID：P{yyMMddHHmmssSSS}（Asia/Shanghai）。
 * 用法：node scripts/agent-kb/new-pitfall-id.mjs
 * 存量 P1–P999 保留；新 ID 禁止短号；台账倒序「时间戳降序 → 旧号降序」，新条插入表顶。
 * 时间戳进位与 scripts/doc_versioning.py 对齐。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "docs/agent-kb/pitfalls.md");
const NEW_P_RE = /^P(\d{15})$/;
const ID_CELL_RE = /^\|\s*(P\d+)\s*\|/;

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Asia/Shanghai wall-clock → yyMMddHHmmssSSS */
function nowTs(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  return (
    parts.year +
    parts.month +
    parts.day +
    parts.hour +
    parts.minute +
    parts.second +
    String(date.getMilliseconds()).padStart(3, "0")
  );
}

function bumpTs(ts, deltaMs = 1) {
  if (!/^\d{15}$/.test(ts)) throw new Error(`非法时间戳: ${ts}`);
  const year = 2000 + Number(ts.slice(0, 2));
  const mo = Number(ts.slice(2, 4));
  const dd = Number(ts.slice(4, 6));
  const hh = Number(ts.slice(6, 8));
  const mi = Number(ts.slice(8, 10));
  const ss = Number(ts.slice(10, 12));
  const ms = Number(ts.slice(12, 15));
  // 用 UTC 构造后加毫秒，再格式化为上海墙钟（与 Python bump 一致意图）
  const utc = Date.UTC(year, mo - 1, dd, hh, mi, ss, ms) + deltaMs;
  const d = new Date(utc);
  // 上述 Date.UTC 把「上海数字」当 UTC；进位后仍按同样数字槽输出即可
  const y = String(d.getUTCFullYear()).slice(-2);
  return (
    y +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    String(d.getUTCMilliseconds()).padStart(3, "0")
  );
}

function extractIds(text) {
  const set = new Set();
  for (const line of text.split(/\r?\n/)) {
    const m = ID_CELL_RE.exec(line.trim());
    if (m) set.add(m[1]);
  }
  return set;
}

function allocateUnique(occupied) {
  let ts = nowTs();
  let maxExisting = null;
  for (const id of occupied) {
    const m = NEW_P_RE.exec(id);
    if (m && (maxExisting === null || m[1] > maxExisting)) maxExisting = m[1];
  }
  if (maxExisting !== null && ts <= maxExisting) ts = bumpTs(maxExisting, 1);
  for (let i = 0; i < 10_000; i++) {
    const candidate = `P${ts}`;
    if (!occupied.has(candidate)) return candidate;
    ts = bumpTs(ts, 1);
  }
  throw new Error("无法分配空闲 P{ts}（重试耗尽）");
}

if (!fs.existsSync(FILE)) {
  console.error(`文件不存在: ${FILE}`);
  process.exit(1);
}

const occupied = extractIds(fs.readFileSync(FILE, "utf8"));
console.log(allocateUnique(occupied));
