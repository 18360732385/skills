#!/usr/bin/env node
/**
 * release-sync-scripts — 仓内 scripts/release-eng 与 skill 版本对账 / 同步
 *
 * Usage:
 *   node release-sync-scripts.mjs --root <REPO> --check
 *   node release-sync-scripts.mjs --root <REPO> --apply
 */
import path from "path";
import { fileURLToPath } from "url";
import { readSkillVersion } from "./lib/skill-version.mjs";
import {
  checkConsumerSnapshot,
  applyConsumerSnapshot,
} from "./lib/snapshot-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { root: ".", check: false, apply: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--check") out.check = true;
    else if (a === "--apply") out.apply = true;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.check && !args.apply)) {
    console.log(`release-sync-scripts — 仓内快照对账

Usage:
  node release-sync-scripts.mjs --root . --check
  node release-sync-scripts.mjs --root . --apply

无 scripts/release-eng/ 时 --check 视为 ok（无快照）。
有目录无 VERSION 或版本不一致 → --check exit 2。`);
    process.exit(args.help ? 0 : 1);
  }

  const root = path.resolve(args.root);
  const skillVersion = readSkillVersion(skillRoot);

  if (args.apply) {
    const r = applyConsumerSnapshot(
      path.join(skillRoot, "scripts"),
      root,
      skillVersion
    );
    console.log(JSON.stringify({ ok: true, applied: true, ...r }, null, 2));
    process.exit(0);
  }

  const snap = checkConsumerSnapshot(root, skillVersion);
  const payload = {
    ok: snap.ok,
    exists: snap.exists,
    skillVersion,
    snapshotVersion: snap.version,
    path: snap.path,
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(snap.ok ? 0 : 2);
}

main();
