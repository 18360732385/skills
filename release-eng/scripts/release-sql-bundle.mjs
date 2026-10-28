#!/usr/bin/env node
/**
 * release-sql-bundle — 将 sql/refs/ 整理为 release-V{yyMMdd}-DDL|DML.sql
 *
 * Usage:
 *   node release-sql-bundle.mjs --bundle-dir <dir> --release-date YYYY-MM-DD
 *     [--freeze-json <file>] [--ai-json <file>] [--prior-artifacts <file>]
 *     [--skip-ai-classify] [--root <repo>] [--format json]
 *
 * Exit 0=ok；1=硬失败（不写残缺整理文件）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import {
  assertStatementsEndWithSemicolon,
  buildSqlBundleContent,
  detectMixedDdlDml,
  isMigrationSql,
  migrationSortKey,
  releaseSqlBundleName,
  sha256Hex,
} from "./release-format.mjs";
import {
  buildClassifyPromptMd,
  classifyRefs,
  listRefsDir,
} from "./release-sql-classify.mjs";

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    bundleDir: null,
    releaseDate: null,
    freezeJson: null,
    aiJson: null,
    priorArtifacts: null,
    skipAiClassify: false,
    format: "json",
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--bundle-dir") out.bundleDir = argv[++i];
    else if (a === "--release-date") out.releaseDate = argv[++i];
    else if (a === "--freeze-json") out.freezeJson = argv[++i];
    else if (a === "--ai-json") out.aiJson = argv[++i];
    else if (a === "--prior-artifacts") out.priorArtifacts = argv[++i];
    else if (a === "--skip-ai-classify") out.skipAiClassify = true;
    else if (a === "--format") out.format = argv[++i] || "json";
    else if (a === "--out") out.out = argv[++i] || null;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function baseName(p) {
  return String(p || "").replace(/\\/g, "/").split("/").pop() || "";
}

function loadJson(p) {
  if (!p || !fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadPriorBySha(artifactsPath) {
  const bySha = new Map();
  const art = loadJson(artifactsPath);
  if (!art) return bySha;
  for (const b of art.sqlBundles || []) {
    for (const s of b.sources || []) {
      if (s.sha256 && (s.kind || b.kind)) {
        bySha.set(s.sha256, { kind: s.kind || b.kind });
      }
    }
  }
  return bySha;
}

function loadAiByName(aiJsonPath) {
  const map = new Map();
  const raw = loadJson(aiJsonPath);
  if (!raw) return map;
  const list = Array.isArray(raw) ? raw : raw.classifications || raw.items || [];
  for (const row of list) {
    const key = baseName(row.path || row.stableId || row.basename || "");
    if (key) map.set(key, row);
  }
  return map;
}

function draftMigrationBasenames(freeze) {
  const set = new Set();
  for (const r of freeze?.draft?.sql || []) {
    const p = r.路径 || r.path || r.脚本 || "";
    if (p && isMigrationSql(p)) set.add(baseName(p));
    else if (r.脚本 && /\.sql$/i.test(r.脚本)) set.add(baseName(r.脚本));
  }
  return set;
}

function gitCommitTime(root, sourcePath) {
  if (!root || !sourcePath) return null;
  try {
    const out = execFileSync(
      "git",
      ["-C", root, "log", "-1", "--format=%ct", "--", sourcePath],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    const n = Number(out);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function removeStaleBundles(sqlDir) {
  if (!fs.existsSync(sqlDir)) return;
  for (const n of fs.readdirSync(sqlDir)) {
    if (/^release-V\d+-DDL\.sql$/i.test(n) || /^release-V\d+-DML\.sql$/i.test(n)) {
      fs.rmSync(path.join(sqlDir, n), { force: true });
    }
  }
}

/**
 * @returns {{ ok: boolean, errors: string[], warnings: string[], sqlBundles: object[], promptMd?: string, classify?: object, incomplete?: boolean }}
 */
export function runSqlBundle({
  bundleDir,
  releaseDate,
  freeze = null,
  root = null,
  aiJsonPath = null,
  priorArtifactsPath = null,
  skipAiClassify = false,
  classifyFn = null,
  sourcePathByBasename = null,
} = {}) {
  const errors = [];
  const warnings = [];
  if (!bundleDir) {
    return { ok: false, errors: ["bundleDir required"], warnings, sqlBundles: [] };
  }
  if (!releaseDate || !/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) {
    return {
      ok: false,
      errors: [`releaseDate required YYYY-MM-DD, got: ${releaseDate}`],
      warnings,
      sqlBundles: [],
    };
  }

  const sqlDir = path.join(bundleDir, "sql");
  const refsDir = path.join(sqlDir, "refs");
  const files = listRefsDir(refsDir);

  if (freeze) {
    const expected = draftMigrationBasenames(freeze);
    const actual = new Set(files.map((f) => f.basename));
    for (const e of expected) {
      if (!actual.has(e)) errors.push(`refs 缺少 draft.sql migration: ${e}`);
    }
    for (const a of actual) {
      if (expected.size && !expected.has(a)) {
        errors.push(`refs 含非 draft migration: ${a}`);
      }
    }
  }

  const classify = classifyRefs(files, {
    priorBySha: loadPriorBySha(priorArtifactsPath),
    aiByName: loadAiByName(aiJsonPath),
    skipAiClassify,
    classifyFn,
  });

  if (!classify.ok) {
    if (classify.needsAi.length) {
      errors.push(
        `SQL 归类未闭环，needsAi=${classify.needsAi.length}（请提供 --ai-json 或先跑 prompt-md）`
      );
    }
    for (const f of classify.failed) {
      errors.push(`归类失败 ${f.basename}: ${f.error}`);
    }
  }

  // 静态校验（归类已成功的项）
  const byKind = { DDL: [], DML: [] };
  for (const r of classify.resolved) {
    const file = files.find((f) => f.basename === r.basename);
    const content = file?.content ?? "";
    if (content.includes("\0")) {
      errors.push(`${r.basename}: 含 \\0`);
      continue;
    }
    try {
      // UTF-8 roundtrip
      Buffer.from(content, "utf8").toString("utf8");
    } catch {
      errors.push(`${r.basename}: 非 UTF-8`);
      continue;
    }
    const mixed = detectMixedDdlDml(content);
    if (mixed.mixed) {
      errors.push(`${r.basename}: 正文同时含 DDL 与 DML 动词（须拆文件）`);
      continue;
    }
    const semi = assertStatementsEndWithSemicolon(content);
    if (!semi.ok) {
      errors.push(`${r.basename}: ${semi.message}`);
      continue;
    }
    const srcPath =
      (sourcePathByBasename && sourcePathByBasename.get(r.basename)) ||
      freeze?.draft?.sql?.find((x) => baseName(x.脚本 || x.路径) === r.basename)?.路径 ||
      null;
    const commitTime = gitCommitTime(root, srcPath);
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(file.absPath).mtimeMs;
    } catch {
      mtimeMs = 0;
    }
    byKind[r.kind].push({
      ...r,
      content,
      commitTime: commitTime ?? null,
      mtimeMs,
      sortKey: migrationSortKey(r.basename),
    });
  }

  for (const kind of ["DDL", "DML"]) {
    byKind[kind].sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      const ta = a.commitTime != null ? a.commitTime : a.mtimeMs / 1000;
      const tb = b.commitTime != null ? b.commitTime : b.mtimeMs / 1000;
      if (ta !== tb) return ta - tb;
      return a.basename.localeCompare(b.basename);
    });
  }

  if (errors.length) {
    removeStaleBundles(sqlDir);
    return {
      ok: false,
      errors,
      warnings,
      sqlBundles: [],
      classify,
      promptMd: classify.needsAi.length
        ? buildClassifyPromptMd(classify.needsAi)
        : null,
      incomplete: true,
    };
  }

  removeStaleBundles(sqlDir);
  fs.mkdirSync(sqlDir, { recursive: true });

  const sqlBundles = [];
  const written = [];

  for (const kind of ["DDL", "DML"]) {
    const ordered = byKind[kind];
    if (!ordered.length) continue;
    const name = releaseSqlBundleName(releaseDate, kind);
    const content = buildSqlBundleContent(
      ordered.map((o) => ({ basename: o.basename, content: o.content }))
    );
    const contentSha256 = sha256Hex(content);
    const dest = path.join(sqlDir, name);
    const tmp = dest + ".tmp";
    fs.writeFileSync(tmp, content, "utf8");
    fs.renameSync(tmp, dest);
    written.push(dest);
    sqlBundles.push({
      kind,
      path: `sql/${name}`,
      sourceCount: ordered.length,
      contentSha256,
      incomplete: Boolean(skipAiClassify),
      sources: ordered.map((o) => ({
        stableId: o.basename,
        sha256: o.sha256,
        kind: o.kind,
        classifySource: o.classifySource,
      })),
    });
  }

  if (classify.resolved.some((r) => r.classifySource === "ai")) {
    warnings.push(
      `classifySource=ai 计数=${classify.resolved.filter((r) => r.classifySource === "ai").length}`
    );
  }

  return {
    ok: true,
    errors: [],
    warnings,
    sqlBundles,
    classify,
    incomplete: Boolean(skipAiClassify),
    written,
  };
}

/** 校验已落盘 sqlBundles 与 refs 拼接一致 */
export function verifySqlBundlesOnDisk(bundleDir, sqlBundles, releaseDate) {
  const errors = [];
  const refsDir = path.join(bundleDir, "sql", "refs");
  const files = listRefsDir(refsDir);
  const byName = new Map(files.map((f) => [f.basename, f]));

  for (const b of sqlBundles || []) {
    const abs = path.join(bundleDir, b.path);
    if (!fs.existsSync(abs)) {
      errors.push(`缺少整理文件 ${b.path}`);
      continue;
    }
    const ordered = (b.sources || [])
      .map((s) => {
        const f = byName.get(s.stableId);
        return f ? { basename: f.basename, content: f.content } : null;
      })
      .filter(Boolean);
    if (ordered.length !== (b.sources || []).length) {
      errors.push(`${b.path}: sources 与 refs 不一致`);
      continue;
    }
    const expected = buildSqlBundleContent(ordered);
    const actual = fs.readFileSync(abs, "utf8");
    const expHash = sha256Hex(expected);
    const actHash = sha256Hex(actual);
    if (expHash !== actHash || (b.contentSha256 && b.contentSha256 !== actHash)) {
      errors.push(`${b.path}: contentSha256 与 refs 重算不一致`);
    }
    if (releaseDate) {
      try {
        const expectName = releaseSqlBundleName(releaseDate, b.kind);
        if (!b.path.endsWith(expectName)) {
          errors.push(`${b.path}: 文件名与发版日期/kind 不符（期望 ${expectName}）`);
        }
      } catch (e) {
        errors.push(String(e.message || e));
      }
    }
  }
  return errors;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-sql-bundle.mjs --bundle-dir <dir> --release-date YYYY-MM-DD
    [--freeze-json f] [--ai-json f] [--prior-artifacts f] [--skip-ai-classify]
    [--root <repo>] [--format json] [--out f]`);
    process.exit(0);
  }
  if (!args.bundleDir || !args.releaseDate) {
    console.error("require --bundle-dir and --release-date");
    process.exit(1);
  }
  const bundleDir = path.isAbsolute(args.bundleDir)
    ? args.bundleDir
    : path.join(args.root, args.bundleDir);
  const freezePath = args.freezeJson
    ? path.isAbsolute(args.freezeJson)
      ? args.freezeJson
      : path.join(args.root, args.freezeJson)
    : null;
  const freeze = freezePath ? loadJson(freezePath) : null;
  const aiPath = args.aiJson
    ? path.isAbsolute(args.aiJson)
      ? args.aiJson
      : path.join(args.root, args.aiJson)
    : null;
  const priorPath = args.priorArtifacts
    ? path.isAbsolute(args.priorArtifacts)
      ? args.priorArtifacts
      : path.join(args.root, args.priorArtifacts)
    : path.join(bundleDir, "artifacts.json");

  const result = runSqlBundle({
    bundleDir,
    releaseDate: String(args.releaseDate).slice(0, 10),
    freeze,
    root: args.root,
    aiJsonPath: aiPath,
    priorArtifactsPath: priorPath,
    skipAiClassify: args.skipAiClassify,
  });

  const text = JSON.stringify(
    {
      ok: result.ok,
      errors: result.errors,
      warnings: result.warnings,
      sqlBundles: result.sqlBundles,
      incomplete: result.incomplete,
      needsAi: result.classify?.needsAi?.map((n) => n.basename) || [],
    },
    null,
    2
  );
  if (args.out) fs.writeFileSync(args.out, text + "\n", "utf8");
  else console.log(text);

  if (result.promptMd && !result.ok) {
    console.error("--- classify prompt-md ---");
    console.error(result.promptMd);
  }
  if (!result.ok) {
    for (const e of result.errors) console.error(e);
    process.exit(1);
  }
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMain) main();
