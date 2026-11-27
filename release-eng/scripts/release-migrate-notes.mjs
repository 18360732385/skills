#!/usr/bin/env node
/**
 * release-migrate-notes — 将 docs/releases/notes/ 迁到 docs/releases/<id>/
 *
 * Usage:
 *   node release-migrate-notes.mjs --root <REPO> [--dry-run|--apply]
 */
import fs from "fs";
import path from "path";
import { readTextFile } from "./lib/text-encoding.mjs";

function parseArgs(argv) {
  const out = { root: ".", apply: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--apply") out.apply = true;
    else if (a === "--dry-run") out.apply = false;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`release-migrate-notes — notes/ → docs/releases/<id>/

Usage: node release-migrate-notes.mjs --root . [--dry-run|--apply]
默认 dry-run。`);
    process.exit(0);
  }

  const root = path.resolve(args.root);
  const notesDir = path.join(root, "docs", "releases", "notes");
  const moves = [];
  if (!fs.existsSync(notesDir)) {
    console.log(JSON.stringify({ ok: true, moved: [], message: "no notes/ dir" }));
    process.exit(0);
  }

  for (const ent of fs.readdirSync(notesDir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    if (ent.isDirectory()) {
      const id = ent.name;
      const src = path.join(notesDir, id);
      const dest = path.join(root, "docs", "releases", id);
      moves.push({ identity: id, from: src, to: dest, kind: "bundle" });
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      const id = ent.name.replace(/\.md$/i, "");
      const src = path.join(notesDir, ent.name);
      const destDir = path.join(root, "docs", "releases", id);
      const dest = path.join(destDir, `${id}.md`);
      moves.push({ identity: id, from: src, to: dest, kind: "flat" });
    }
  }

  if (!args.apply) {
    console.log(JSON.stringify({ ok: true, dryRun: true, moves }, null, 2));
    process.exit(0);
  }

  const done = [];
  for (const m of moves) {
    if (m.kind === "bundle") {
      if (fs.existsSync(m.to)) {
        done.push({ ...m, skipped: true, reason: "dest_exists" });
        continue;
      }
      fs.renameSync(m.from, m.to);
      done.push({ ...m, moved: true });
    } else {
      if (fs.existsSync(m.to)) {
        done.push({ ...m, skipped: true, reason: "dest_exists" });
        continue;
      }
      fs.mkdirSync(path.dirname(m.to), { recursive: true });
      fs.renameSync(m.from, m.to);
      done.push({ ...m, moved: true });
    }
  }

  // 更新索引中 ./notes/ 链接
  const indexPath = path.join(root, "docs", "releases", "releases.md");
  if (fs.existsSync(indexPath)) {
    let text = readTextFile(indexPath);
    text = text.replace(/\]\(\.\/notes\//g, "](./");
    text = text.replace(/\]\(notes\//g, "](");
    fs.writeFileSync(indexPath, text, "utf8");
  }

  // 若 notes 已空则删目录
  const left = fs.existsSync(notesDir)
    ? fs.readdirSync(notesDir).filter((n) => !n.startsWith("."))
    : [];
  if (left.length === 0 && fs.existsSync(notesDir)) {
    fs.rmSync(notesDir, { recursive: true, force: true });
  }

  console.log(JSON.stringify({ ok: true, applied: true, done }, null, 2));
  process.exit(0);
}

main();
