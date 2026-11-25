#!/usr/bin/env node
/**
 * release-cancel — 取消未 seal 的进行中目录包（删包 + 清索引）
 *
 * Usage:
 *   node release-cancel.mjs --root <REPO> --identity release-VyyMMdd [--dry-run|--apply]
 *   node release-cancel.mjs --root <REPO> --release-date YYYY-MM-DD [--dry-run|--apply]
 */
import fs from "fs";
import path from "path";
import {
  identityFromReleaseDate,
  removeReleasesIndexRow,
  stripBom,
} from "./release-format.mjs";

function parseArgs(argv) {
  const out = {
    root: ".",
    identity: null,
    releaseDate: null,
    apply: false,
    dryRun: true,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--identity") out.identity = argv[++i];
    else if (a === "--release-date") out.releaseDate = argv[++i];
    else if (a === "--apply") {
      out.apply = true;
      out.dryRun = false;
    } else if (a === "--dry-run") {
      out.dryRun = true;
      out.apply = false;
    }
  }
  return out;
}

function rmRecursive(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`release-cancel — 取消进行中目录包（≠ seal）

Usage:
  node release-cancel.mjs --root . --identity release-V261126 [--dry-run|--apply]
  node release-cancel.mjs --root . --release-date 2026-11-26 [--apply]

默认 dry-run；确认词后 --apply。不进 archive。`);
    process.exit(0);
  }

  const root = path.resolve(args.root);
  let identity = args.identity;
  if (!identity && args.releaseDate) {
    identity = identityFromReleaseDate(args.releaseDate);
  }
  if (!identity) {
    console.error("missing --identity or --release-date");
    process.exit(1);
  }

  const bundleDir = path.join(root, "docs", "releases", identity);
  const notePath = path.join(bundleDir, `${identity}.md`);
  const archiveDir = path.join(root, "docs", "releases", "archive", identity);
  if (fs.existsSync(archiveDir)) {
    console.error(
      JSON.stringify({
        ok: false,
        error: "already_archived",
        identity,
        hint: "已在 archive/；取消发版只针对进行中包",
      })
    );
    process.exit(1);
  }
  if (!fs.existsSync(bundleDir) && !fs.existsSync(notePath)) {
    console.error(
      JSON.stringify({ ok: false, error: "not_found", identity, bundleDir })
    );
    process.exit(1);
  }

  const indexPath = path.join(root, "docs", "releases", "releases.md");
  let indexText = fs.existsSync(indexPath)
    ? stripBom(fs.readFileSync(indexPath, "utf8"))
    : "";
  const plan = {
    ok: true,
    dryRun: !args.apply,
    identity,
    removeBundle: bundleDir,
    updateIndex: indexPath,
  };

  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    process.exit(0);
  }

  if (fs.existsSync(bundleDir)) rmRecursive(bundleDir);
  if (indexText) {
    const rem = removeReleasesIndexRow(indexText, identity);
    fs.writeFileSync(indexPath, rem.text, "utf8");
    plan.indexRemoved = rem.removed;
  }
  plan.applied = true;
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

main();
