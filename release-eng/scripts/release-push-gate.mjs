#!/usr/bin/env node
/**
 * release-push-gate — fetch + resolve refs + unpushed check for release-eng
 *
 * Usage:
 *   node release-push-gate.mjs --root <REPO> --release <branch> --baseline <branch|none|无> [--no-fetch]
 *   node release-push-gate.mjs --help
 *
 * --baseline none|无 → 首次发版：只校验发版分支未推送；baseRef=null；firstRelease=true
 *
 * Exit: 0 = pass, 2 = push-gate fail, 1 = usage/git error
 * stdout: JSON
 */
import { spawnSync } from "child_process";
import path from "path";

function isNoneBaseline(v) {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "none" || s === "无" || s === "-" || s === "null";
}

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    release: "release",
    baseline: "main",
    fetch: true,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--release") out.release = argv[++i] || out.release;
    else if (a === "--baseline") out.baseline = argv[++i] || out.baseline;
    else if (a === "--no-fetch") out.fetch = false;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

function refExists(root, ref) {
  return git(root, ["rev-parse", "--verify", "--quiet", ref]).ok;
}

function resolvePair(root, name) {
  const origin = `origin/${name}`;
  const warnings = [];
  let ref;
  if (refExists(root, origin)) {
    ref = origin;
  } else if (refExists(root, name)) {
    ref = name;
    warnings.push(`missing ${origin}; fallback local ${name}`);
  } else {
    return {
      ref: null,
      warnings: [`neither ${origin} nor ${name} exists`],
      unpushed: 0,
      unpushedCommits: [],
    };
  }

  let unpushed = 0;
  let unpushedCommits = [];
  if (refExists(root, origin) && refExists(root, name)) {
    const count = git(root, ["rev-list", "--count", `${origin}..${name}`]);
    unpushed = count.ok ? Number(count.stdout || "0") : 0;
    if (unpushed > 0) {
      const log = git(root, [
        "log",
        "--format=%h|%an|%ad|%s",
        "--date=short",
        "-n",
        "20",
        `${origin}..${name}`,
      ]);
      if (log.ok && log.stdout) {
        unpushedCommits = log.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
          const [hash, author, date, ...rest] = line.split("|");
          return { hash, author, date, subject: rest.join("|") };
        });
      }
    }
  }
  return { ref, warnings, unpushed, unpushedCommits };
}

function collectBehind(root, name, side) {
  const origin = `origin/${name}`;
  if (!(refExists(root, origin) && refExists(root, name))) return null;
  const c = git(root, ["rev-list", "--count", `${name}..${origin}`]);
  const n = c.ok ? Number(c.stdout || "0") : 0;
  if (n > 0) return { branch: name, behindOriginBy: n };
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node release-push-gate.mjs --root <REPO> --release <b> --baseline <b|none|无> [--no-fetch]
Exit 0=pass 2=fail 1=error
--baseline none|无 = 首次发版（只验发版分支）
skill_version: see ../_meta/manifest.yaml`);
    process.exit(0);
  }

  if (args.fetch) {
    const f = git(args.root, ["fetch", "--prune"]);
    if (!f.ok) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            pass: false,
            error: "git fetch failed",
            stderr: f.stderr,
          },
          null,
          2
        )
      );
      process.exit(1);
    }
  }

  const firstRelease = isNoneBaseline(args.baseline);
  const release = resolvePair(args.root, args.release);
  const warnings = [...release.warnings];
  const behind = [];

  let baseline = {
    ref: null,
    warnings: [],
    unpushed: 0,
    unpushedCommits: [],
  };
  let pass;
  let baseRef = null;
  let range = null;

  if (firstRelease) {
    pass = !!release.ref && release.unpushed === 0;
    range = release.ref ? `首次发版:${release.ref}` : null;
    const b = collectBehind(args.root, args.release, release);
    if (b) behind.push(b);
    warnings.push("首次发版: baseline=无; freeze 取发版分支全量");
  } else {
    baseline = resolvePair(args.root, args.baseline);
    warnings.push(...baseline.warnings);
    pass =
      !!release.ref &&
      !!baseline.ref &&
      release.unpushed === 0 &&
      baseline.unpushed === 0;
    baseRef = baseline.ref;
    range =
      release.ref && baseline.ref ? `${baseline.ref}..${release.ref}` : null;
    for (const [name, side] of [
      [args.release, release],
      [args.baseline, baseline],
    ]) {
      const b = collectBehind(args.root, name, side);
      if (b) behind.push(b);
    }
  }

  const dirty = git(args.root, ["status", "--porcelain"]);
  const result = {
    ok: true,
    pass,
    firstRelease,
    root: args.root,
    releaseBranch: args.release,
    baselineBranch: firstRelease ? "无" : args.baseline,
    headRef: release.ref,
    baseRef,
    range,
    release: {
      unpushed: release.unpushed,
      commits: release.unpushedCommits,
    },
    baseline: {
      unpushed: baseline.unpushed,
      commits: baseline.unpushedCommits,
    },
    warnings,
    hints: {
      behind,
      dirtyWorktree: dirty.ok && dirty.stdout.length > 0,
      freezeArgs: firstRelease
        ? ["--first-release", "--head", release.ref]
        : ["--base", baseRef, "--head", release.ref],
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(pass ? 0 : 2);
}

main();
