#!/usr/bin/env node
/**
 * 读写 docs/releases/releases.md「SQL 扫描」（目录 + 格式）。
 *
 *   node release-sql-profile.mjs --root <REPO>
 *   node release-sql-profile.mjs --root <REPO> --set-dir <rel> --set-format <flyway|glob> [--apply]
 *
 * 无 --set-*：只读，exit 0。
 * 有 --set-* 无 --apply：校验并预览，不写盘；不合法 exit 1。
 * --apply：两项都有效才写入索引。只给一项且索引里另一项也没有 → 不写、exit 1。
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import {
  canonicalSqlFormat,
  normalizeSqlDir,
  pathUnderSqlDir,
  readSqlProfile,
  recommendSqlFormat,
  sqlBasenameMatchesFormat,
  stripBom,
  upsertSqlProfile,
  validateSqlDir,
  validateSqlFormat,
} from "./release-format.mjs";

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    setDir: null,
    setFormat: null,
    apply: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--set-dir") out.setDir = argv[++i] ?? "";
    else if (a === "--set-format") out.setFormat = argv[++i] ?? "";
    else if (a === "--apply") out.apply = true;
  }
  return out;
}

function printHelp() {
  console.log(`release-sql-profile — 读/写 releases.md 的 SQL 目录与格式

Usage:
  node release-sql-profile.mjs --root <REPO>
  node release-sql-profile.mjs --root <REPO> --set-dir <rel> --set-format <flyway|glob> [--apply]

只读 exit 0，JSON 含 firstUse / sqlDir / sqlFormat / 推荐。
--apply 才写入 docs/releases/releases.md「SQL 扫描」（不创建发版目录包）。
两项缺一不落盘。目录须已存在；格式为 flyway 或文件名 glob。`);
}

function listRepoSqlFiles(root) {
  const r = spawnSync("git", ["-C", root, "ls-files", "-z"], {
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024,
  });
  /** @type {string[]} */
  let files = [];
  if (r.status === 0 && r.stdout && r.stdout.length) {
    files = r.stdout
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .map((p) => p.replace(/\\/g, "/"));
  }
  return files.filter(
    (p) => /\.sql$/i.test(p) && !p.startsWith("docs/releases/")
  );
}

function dirOf(filePath) {
  const n = filePath.replace(/\\/g, "/");
  const i = n.lastIndexOf("/");
  return i < 0 ? "" : n.slice(0, i);
}

function buildRecommendation(files, recordedDir) {
  const byDir = new Map();
  for (const f of files) {
    const d = dirOf(f);
    if (!d) continue;
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(path.posix.basename(f));
  }
  const dirs = [...byDir.keys()].sort();
  let dirRecommendation = null;
  let dirSource = null;
  if (dirs.length === 1) {
    dirRecommendation = dirs[0];
    dirSource = dirRecommendation.includes("db/migration")
      ? "db/migration"
      : "unique-sql-dir";
  }
  const sampleDir = recordedDir || dirRecommendation;
  const sampleNames = sampleDir ? byDir.get(sampleDir) || [] : [];
  const formatRecommendation = sampleDir ? recommendSqlFormat(sampleNames) : null;
  return {
    dirCandidates: dirs,
    dirRecommendation,
    dirSource,
    formatRecommendation,
  };
}

function countMatches(files, sqlDir, sqlFormat) {
  return files.filter(
    (f) => pathUnderSqlDir(f, sqlDir) && sqlBasenameMatchesFormat(f, sqlFormat)
  ).length;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const root = args.root;
  const indexPath = path.join(root, "docs", "releases", "releases.md");
  const indexExists = fs.existsSync(indexPath);
  const indexText = indexExists ? stripBom(fs.readFileSync(indexPath, "utf8")) : "";
  const recorded = readSqlProfile(indexText);
  const files = listRepoSqlFiles(root);
  const rec = buildRecommendation(files, recorded.sqlDir);

  const setting = args.setDir != null || args.setFormat != null;
  if (!setting) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          firstUse: recorded.firstUse,
          sqlDir: recorded.sqlDir,
          sqlFormat: recorded.sqlFormat,
          indexExists,
          ...rec,
          warnings: [],
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  const sqlDir = args.setDir != null ? normalizeSqlDir(args.setDir) : recorded.sqlDir;
  const sqlFormat =
    args.setFormat != null ? canonicalSqlFormat(args.setFormat) : recorded.sqlFormat;
  const warnings = [];
  /** @type {string|null} */
  let error = null;
  if (!sqlDir || !sqlFormat) {
    error = "SQL 目录与格式须同时有效；只答一项不落盘";
  } else {
    error = validateSqlDir(sqlDir) || validateSqlFormat(sqlFormat);
  }
  if (!error && sqlDir) {
    const abs = path.join(root, sqlDir);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
      error = `SQL 目录不存在: ${sqlDir}`;
    } else if (countMatches(files, sqlDir, sqlFormat) === 0) {
      warnings.push(`目录 ${sqlDir} 下暂无符合格式 ${sqlFormat} 的 SQL（仍允许记录）`);
    }
  }

  const payload = {
    ok: !error,
    firstUse: Boolean(error) || !sqlDir || !sqlFormat,
    sqlDir: sqlDir || null,
    sqlFormat: sqlFormat || null,
    indexExists,
    apply: args.apply,
    wouldWrite: !error,
    ...rec,
    warnings,
    error,
  };

  if (error) {
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
  if (!args.apply) {
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }
  if (!indexExists) {
    payload.ok = false;
    payload.wouldWrite = false;
    payload.error = "缺少 docs/releases/releases.md，先 bootstrap";
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  const up = upsertSqlProfile(indexText, { sqlDir, sqlFormat });
  if (!up.updated) {
    payload.ok = false;
    payload.error = up.error || "upsert failed";
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
  fs.writeFileSync(indexPath, up.text, "utf8");
  const after = readSqlProfile(up.text);
  console.log(
    JSON.stringify(
      {
        ...payload,
        ok: true,
        written: true,
        firstUse: after.firstUse,
        sqlDir: after.sqlDir,
        sqlFormat: after.sqlFormat,
      },
      null,
      2
    )
  );
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  main();
}
