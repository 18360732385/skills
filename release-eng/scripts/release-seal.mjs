#!/usr/bin/env node
/**
 * release-seal — 已上线归档（默认 dry-run；--apply 写盘）
 *
 * Usage:
 *   node release-seal.mjs --root <REPO> --note <path> --online-date YYYY-MM-DD --executor <name> [--force] [--dry-run|--apply]
 *
 * 流程：seal-check →（失败且无 --force 则 exit 2）→ dry-run 打印计划 / --apply：
 *   状态改已上线、填上线日期/执行人、git mv 整夹→archive/、releases.md 删行、ARCHIVE.md 追加。
 * WritePlan 确认词仍由 Agent 把关；本脚本不解析确认词。
 * Exit 0=ok 2=seal-check fail 1=usage/io
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  stripBom,
  identityFromBranch,
  removeReleasesIndexRow,
  appendArchiveRow,
  gitEnvChina,
} from "./release-format.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    note: null,
    onlineDate: null,
    executor: null,
    force: false,
    apply: false,
    dryRun: true,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--online-date") out.onlineDate = argv[++i];
    else if (a === "--executor") out.executor = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--apply") {
      out.apply = true;
      out.dryRun = false;
    } else if (a === "--dry-run") {
      out.dryRun = true;
      out.apply = false;
    } else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function readText(p) {
  try {
    return stripBom(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function runSealCheck(root, note, force) {
  const bin = path.join(__dirname, "release-seal-check.mjs");
  const args = [bin, "--root", root, "--note", note, "--format", "json"];
  if (force) args.push("--force");
  const r = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: gitEnvChina(),
  });
  let json = null;
  try {
    json = JSON.parse(stripBom(r.stdout || "{}"));
  } catch {
    json = { ok: false, errors: [`seal-check 输出非 JSON (exit=${r.status})`], warnings: [] };
  }
  return { status: r.status ?? 1, result: json };
}

function resolveBundle(root, noteArg) {
  const notePath = path.isAbsolute(noteArg) ? noteArg : path.join(root, noteArg);
  const rel = path.relative(root, notePath).replace(/\\/g, "/");
  const dir = path.dirname(notePath);
  const base = path.basename(notePath, ".md");
  let identity = base;
  const m =
    rel.match(/^docs\/releases\/notes\/([^/]+)\//i) ||
    rel.match(/^docs\/releases\/([^/]+)\//i);
  if (m) identity = m[1];
  const fromNotes = /\/notes\//.test(rel);
  const srcDir = dir;
  const destDir = path.join(root, "docs", "releases", "archive", identity);
  const destNoteRel = `docs/releases/archive/${identity}/${identity}.md`;
  return {
    notePath,
    relNote: rel,
    identity,
    srcDir,
    destDir,
    destNoteRel,
    fromNotes,
  };
}

function patchNoteOnline(text, { onlineDate, executor }) {
  let out = String(text || "");
  out = out.replace(/(> 状态：)[^\n]*/g, `$1已上线`);
  out = out.replace(/(\| 状态 \| )[^|]*/g, `$1已上线 `);
  if (onlineDate) {
    out = out.replace(/(\| 上线日期 \| )[^|]*/g, `$1${onlineDate} `);
  }
  if (executor) {
    out = out.replace(/(\| 上线执行人 \| )[^|]*/g, `$1${executor} `);
  }
  return out;
}

function metaFromNote(text) {
  const branch = (text.match(/> 发版分支：\s*([^\n·]+)/) || [])[1]?.trim() || "";
  const baseline = (text.match(/基线分支：\s*([^\n]+)/) || [])[1]?.trim() || "";
  const date = (text.match(/> 发版日期：\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
  const owner = (text.match(/> 负责人：\s*([^\n]+)/) || [])[1]?.trim() || "";
  const identity =
    (text.match(/\|\s*版本身份\s*\|\s*([^|]+)\|/) || [])[1]?.trim() ||
    identityFromBranch(branch);
  return { branch, baseline, date, owner, identity };
}

function gitMv(root, fromAbs, toAbs) {
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  const relFrom = path.relative(root, fromAbs).replace(/\\/g, "/");
  const relTo = path.relative(root, toAbs).replace(/\\/g, "/");
  const r = spawnSync("git", ["mv", relFrom, relTo], {
    cwd: root,
    encoding: "utf8",
    env: gitEnvChina(),
  });
  if (r.status === 0) return { ok: true, method: "git-mv" };
  // 非 git 仓或未跟踪：fs rename 兜底
  try {
    fs.renameSync(fromAbs, toAbs);
    return { ok: true, method: "fs-rename", warning: r.stderr || "git mv failed; used fs.rename" };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), gitStderr: r.stderr || "" };
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-seal.mjs --root <REPO> --note <path> --online-date YYYY-MM-DD --executor <name> [--force] [--dry-run|--apply]
默认 --dry-run；确认词后由 Agent 加 --apply。`);
    process.exit(0);
  }
  if (!args.note) {
    console.error("require --note");
    process.exit(1);
  }
  if (!args.onlineDate || !args.executor) {
    console.error("require --online-date and --executor");
    process.exit(1);
  }

  const check = runSealCheck(args.root, args.note, args.force);
  if (check.status !== 0 && !args.force) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          pass: false,
          reason: "seal-check failed",
          sealCheck: check.result,
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const bundle = resolveBundle(args.root, args.note);
  const text = readText(bundle.notePath);
  if (!text) {
    console.error(`cannot read note ${bundle.relNote}`);
    process.exit(1);
  }
  const meta = metaFromNote(text);
  const identity = bundle.identity || meta.identity;
  const patched = patchNoteOnline(text, {
    onlineDate: args.onlineDate,
    executor: args.executor,
  });
  const branchPair =
    meta.baseline && meta.baseline !== "无"
      ? `${meta.branch || "—"} vs ${meta.baseline}`
      : `${meta.branch || identity}（首次）`;

  const plan = {
    ok: true,
    dryRun: !args.apply,
    identity,
    note: bundle.relNote,
    onlineDate: args.onlineDate,
    executor: args.executor,
    force: args.force,
    sealCheck: {
      ok: check.result?.ok !== false,
      errors: check.result?.errors || [],
      warnings: check.result?.warnings || [],
    },
    actions: [
      { op: "patch-status", status: "已上线", onlineDate: args.onlineDate, executor: args.executor },
      {
        op: "mv-bundle",
        from: path.relative(args.root, bundle.srcDir).replace(/\\/g, "/"),
        to: path.relative(args.root, bundle.destDir).replace(/\\/g, "/"),
      },
      { op: "remove-index-row", identity },
      {
        op: "append-archive",
        path: "docs/releases/ARCHIVE.md",
        noteRel: bundle.destNoteRel,
      },
    ],
  };

  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    process.exit(0);
  }

  // --apply
  fs.writeFileSync(bundle.notePath, patched, "utf8");

  const mv = gitMv(args.root, bundle.srcDir, bundle.destDir);
  if (!mv.ok) {
    console.log(JSON.stringify({ ok: false, error: "mv failed", detail: mv, plan }, null, 2));
    process.exit(1);
  }

  const indexPath = path.join(args.root, "docs", "releases", "releases.md");
  const archivePath = path.join(args.root, "docs", "releases", "ARCHIVE.md");
  const indexCur = readText(indexPath);
  let indexUpdated = false;
  if (indexCur != null) {
    const rem = removeReleasesIndexRow(indexCur, identity);
    fs.writeFileSync(indexPath, rem.text, "utf8");
    indexUpdated = rem.removed;
  }

  let archiveCur = readText(archivePath);
  if (archiveCur == null) archiveCur = "";
  const arch = appendArchiveRow(archiveCur, {
    date: meta.date,
    identity,
    branchPair,
    status: "已上线",
    noteRel: `[${identity}](./archive/${identity}/${identity}.md)`,
    onlineDate: args.onlineDate,
    executor: args.executor,
  });
  fs.writeFileSync(archivePath, arch.text, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        applied: true,
        identity,
        dest: path.relative(args.root, bundle.destDir).replace(/\\/g, "/"),
        mv,
        indexUpdated,
        archiveRow: arch.row,
        sealCheckWarnings: check.result?.warnings || [],
      },
      null,
      2
    )
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMain) main();
