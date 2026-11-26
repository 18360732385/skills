#!/usr/bin/env node
/**
 * archive-docs — 可逆归档 CLI（0.8.3 D13；0.8.4 嵌套路径 + dry-run + 运行时拒绝）。
 *
 * inventory 的 archive_hint 只是文本提示；本 CLI 把「经确认归档」落成一条可审计、
 * 可回滚的命令（move + sidecar 账本记录原路径）。
 *
 * Usage:
 *   node scripts/archive-docs.mjs --root <TARGET> --archive <relPath> [--domain design|prototype] [--note <text>] [--dry-run]
 *   node scripts/archive-docs.mjs --root <TARGET> --restore <ledgerIndex>
 *   node scripts/archive-docs.mjs --root <TARGET> --list
 *   node scripts/archive-docs.mjs --help
 *
 * 账本（默认 docs/harness-eng/.fill-work/archive-ledger.json）追加：
 *   { index, from, to, domain, note, archived_at, restored_at }
 * 纪律：只 move、不删；已在 SSOT 树内或目标已存在时报错；restore 需原路径空闲。
 */
import fs from "fs";
import path from "path";
import { isCliMain } from "./lib/cli-main.mjs";

export const DEFAULT_LEDGER_REL = path.join(
  "docs",
  "harness-eng",
  ".fill-work",
  "archive-ledger.json"
);
const DOMAINS = ["design", "prototype"];

/** Runtime / package files that must never be archived as design/prototype docs. */
const RUNTIME_BASENAME_RE =
  /^(tokens\.css|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|tsconfig.*\.json|vite\.config\..+|webpack\.config\..+)$/i;
const RUNTIME_EXT_RE = /\.(tsx?|jsx?|vue|css|scss|sass|less|mjs|cjs)$/i;
const DOC_NAME_RE = /^(DESIGN|design-|prototype|PROTO)/i;

function nowIso() {
  return new Date().toISOString();
}

function toPosix(p) {
  return String(p).replace(/\\/g, "/");
}

function loadLedger(absLedger) {
  if (!fs.existsSync(absLedger)) return { entries: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(absLedger, "utf8"));
    if (raw && Array.isArray(raw.entries)) return raw;
  } catch {
    /* fallthrough: corrupt ledger treated as empty */
  }
  return { entries: [] };
}

function saveLedger(absLedger, ledger) {
  fs.mkdirSync(path.dirname(absLedger), { recursive: true });
  fs.writeFileSync(absLedger, JSON.stringify(ledger, null, 2), "utf8");
}

/**
 * 0.8.4: refuse obvious runtime paths (tokens.css / package.json / source files)
 * unless already under docs/ or the basename looks like a design/prototype doc.
 */
export function assertArchivableDoc(relNorm) {
  const posix = toPosix(relNorm);
  const base = path.posix.basename(posix);
  if (posix.startsWith("docs/")) return;
  if (DOC_NAME_RE.test(base)) return;
  if (RUNTIME_BASENAME_RE.test(base)) {
    throw new Error(
      `refusing runtime file (not a design/prototype doc): ${posix}`
    );
  }
  if (RUNTIME_EXT_RE.test(base)) {
    throw new Error(
      `refusing runtime source/style file (not a design/prototype doc): ${posix}`
    );
  }
}

/**
 * Preserve nested relative path under docs/<domain>/ instead of flattening
 * to basename (0.8.4 — avoids collisions when archiving nested trees).
 */
export function resolveArchiveTarget(absRoot, domain, relNorm) {
  const posix = toPosix(relNorm);
  let nested = posix;
  // Drop leading ./ and collapse; keep meaningful nesting.
  nested = nested.replace(/^\.\//, "");
  // If source was already under docs/<other>/, keep the tail after docs/.
  const docsTail = nested.match(/^docs\/(.+)$/);
  if (docsTail) nested = docsTail[1];
  // Avoid escaping via .. segments.
  const parts = nested.split("/").filter((p) => p && p !== "." && p !== "..");
  if (!parts.length) parts.push(path.posix.basename(posix) || "archived.md");
  const toRel = toPosix(path.posix.join("docs", domain, ...parts));
  const toAbs = path.join(absRoot, ...toRel.split("/"));
  return { toRel, toAbs };
}

/**
 * 归档一个非运行文档：move 到 docs/<domain>/（保留相对嵌套），账本记录原路径。
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun] — plan only; no rename / ledger write
 * @returns {object} the ledger entry created (with ledger_path); dry-run adds dry_run:true
 */
export function archiveOne(
  root,
  relPath,
  domain = "design",
  note = "",
  ledgerRel = DEFAULT_LEDGER_REL,
  opts = {}
) {
  const dryRun = !!opts.dryRun;
  const absRoot = path.resolve(root);
  if (!DOMAINS.includes(domain)) {
    throw new Error(`Unsupported domain: ${domain} (use ${DOMAINS.join("|")})`);
  }
  const fromAbs = path.resolve(absRoot, relPath);
  const relNorm = toPosix(path.relative(absRoot, fromAbs));
  if (relNorm.startsWith("..")) {
    throw new Error(`refusing outside-root path: ${relPath}`);
  }
  if (relNorm.startsWith(`docs/${domain}/`)) {
    throw new Error(`已在 docs/${domain}/ SSOT 树内，无需归档: ${relNorm}`);
  }
  if (!fs.existsSync(fromAbs) || !fs.statSync(fromAbs).isFile()) {
    throw new Error(`source not found: ${relNorm}`);
  }
  assertArchivableDoc(relNorm);
  const { toRel, toAbs } = resolveArchiveTarget(absRoot, domain, relNorm);
  if (fs.existsSync(toAbs)) {
    throw new Error(`target exists: ${toRel}`);
  }
  const absLedger = path.resolve(absRoot, ledgerRel);
  const entry = {
    index: null,
    from: relNorm,
    to: toRel,
    domain,
    note: note || null,
    archived_at: nowIso(),
    restored_at: null,
  };
  if (dryRun) {
    return {
      ...entry,
      index: 0,
      dry_run: true,
      ledger_path: toPosix(path.relative(absRoot, absLedger)),
    };
  }
  const ledger = loadLedger(absLedger);
  entry.index = ledger.entries.length + 1;
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  fs.renameSync(fromAbs, toAbs);
  ledger.entries.push(entry);
  saveLedger(absLedger, ledger);
  return { ...entry, ledger_path: toPosix(path.relative(absRoot, absLedger)) };
}

/**
 * 回滚一次归档：按账本 index 把文件移回原路径（原路径需空闲）。
 * @returns {object} the restored ledger entry (with ledger_path)
 */
export function restoreOne(root, index, ledgerRel = DEFAULT_LEDGER_REL) {
  const absRoot = path.resolve(root);
  const absLedger = path.resolve(absRoot, ledgerRel);
  const ledger = loadLedger(absLedger);
  const entry = ledger.entries.find((e) => e.index === index);
  if (!entry) throw new Error(`ledger entry not found: index=${index}`);
  if (entry.restored_at) {
    throw new Error(`entry already restored at ${entry.restored_at}: index=${index}`);
  }
  const toAbs = path.resolve(absRoot, entry.to);
  const fromAbs = path.resolve(absRoot, entry.from);
  if (!fs.existsSync(toAbs)) {
    throw new Error(`archived file missing: ${entry.to}`);
  }
  if (fs.existsSync(fromAbs)) {
    throw new Error(`original path occupied: ${entry.from}`);
  }
  fs.mkdirSync(path.dirname(fromAbs), { recursive: true });
  fs.renameSync(toAbs, fromAbs);
  entry.restored_at = nowIso();
  saveLedger(absLedger, ledger);
  return { ...entry, ledger_path: toPosix(path.relative(absRoot, absLedger)) };
}

/** 查看账本（含已恢复的历史条目）。 */
export function listLedger(root, ledgerRel = DEFAULT_LEDGER_REL) {
  const absRoot = path.resolve(root);
  const absLedger = path.resolve(absRoot, ledgerRel);
  const ledger = loadLedger(absLedger);
  return {
    ledger_path: toPosix(path.relative(absRoot, absLedger)),
    entries: ledger.entries,
  };
}

function printHelp() {
  console.log(`Usage:
  node scripts/archive-docs.mjs --root <TARGET> --archive <relPath> [--domain design|prototype] [--note <text>] [--dry-run]
  node scripts/archive-docs.mjs --root <TARGET> --restore <ledgerIndex>
  node scripts/archive-docs.mjs --root <TARGET> --list
  node scripts/archive-docs.mjs --help

可逆归档 CLI（0.8.3 D13 / 0.8.4 嵌套路径）。只 move、不删；账本默认
docs/harness-eng/.fill-work/archive-ledger.json；--restore 按账本 index 原路回滚。
--dry-run：只预告 from→to，不 rename、不写账本。
拒绝 tokens.css / package.json / 源码扩展名等运行时文件（除非已在 docs/ 或 DESIGN*|prototype* 命名）。
归档纪律不变：动手前须经用户确认（upgrade/audit 仅提示）。
`);
}

function main(argv) {
  const out = {
    help: false,
    root: null,
    archive: null,
    restore: null,
    list: false,
    domain: "design",
    note: "",
    ledger: null,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--archive") out.archive = argv[++i];
    else if (a === "--restore") out.restore = argv[++i];
    else if (a === "--list") out.list = true;
    else if (a === "--domain") out.domain = String(argv[++i] || "design").toLowerCase();
    else if (a === "--note") out.note = argv[++i] || "";
    else if (a === "--ledger") out.ledger = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (out.help) {
    printHelp();
    return;
  }
  if (!out.root) throw new Error("Required: --root <TARGET>");
  const ledgerRel = out.ledger || DEFAULT_LEDGER_REL;
  const hasRestore =
    out.restore !== null && out.restore !== "" && !Number.isNaN(Number(out.restore));
  const modes = [!!out.archive, hasRestore, out.list].filter(Boolean).length;
  if (modes !== 1) {
    throw new Error(
      "Pick exactly one mode: --archive <relPath> | --restore <index> | --list"
    );
  }
  if (out.archive) {
    const r = archiveOne(out.root, out.archive, out.domain, out.note, ledgerRel, {
      dryRun: out.dryRun,
    });
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  if (hasRestore) {
    const r = restoreOne(out.root, Number(out.restore), ledgerRel);
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  const r = listLedger(out.root, ledgerRel);
  console.log(JSON.stringify(r, null, 2));
}

if (isCliMain(import.meta.url)) {
  try {
    main(process.argv);
  } catch (e) {
    console.error(String(e && e.message ? e.message : e));
    process.exit(1);
  }
}
