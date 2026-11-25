#!/usr/bin/env node
/**
 * release-eng prepare 半自动编排（0.4+）
 *
 * 首问参数齐后：snapshot-check → push-gate → freeze → draft-md 预览包。
 * 不写目录包、不代答确认词；ai-track 默认跳过（--ai-track 才跑）。
 * 同会话一次性；无闸状态落盘。
 *
 * Usage:
 *   node release-prepare.mjs --root <REPO> --release-date YYYY-MM-DD \
 *     --release-branch <branch> --baseline <branch|无> [--first-release] \
 *     [--allow-drift] [--ai-track] [--out <freeze.json>] [--format json|summary]
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import {
  identityFromReleaseDate,
  recommendedReleaseThursday,
  stripBom,
} from "./release-format.mjs";
import { readSkillVersion } from "./lib/skill-version.mjs";
import { checkConsumerSnapshot } from "./lib/snapshot-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {
    root: ".",
    releaseDate: null,
    releaseBranch: null,
    baseline: null,
    firstRelease: false,
    allowDrift: false,
    aiTrack: false,
    out: null,
    format: "summary",
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--release-date") out.releaseDate = argv[++i];
    else if (a === "--release-branch") out.releaseBranch = argv[++i];
    else if (a === "--baseline") out.baseline = argv[++i];
    else if (a === "--first-release") out.firstRelease = true;
    else if (a === "--allow-drift") out.allowDrift = true;
    else if (a === "--ai-track") out.aiTrack = true;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--format") out.format = argv[++i];
  }
  return out;
}

function printHelp() {
  console.log(`release-prepare — 半自动编排到 WritePlan 预览（不写盘）

Usage:
  node release-prepare.mjs --root <REPO> --release-date YYYY-MM-DD \\
    --release-branch <branch> (--baseline <branch> | --first-release) \\
    [--allow-drift] [--ai-track] [--out <freeze.json>] [--format summary|json]

步骤: sync-check → push-gate → freeze →（可选 ai-track）→ draft-md
身份: release-V{yyMMdd} ← --release-date
同身份目录已存在 → refresh=true（原 resume 行为）
确认词后由 Agent 调 note-merge 写盘。`);
}

function runNode(script, args, cwd) {
  const bin = path.join(__dirname, script);
  const r = spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return r;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const root = path.resolve(args.root || ".");
  const releaseDate =
    args.releaseDate || recommendedReleaseThursday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(releaseDate).slice(0, 10))) {
    console.error(`invalid --release-date: ${releaseDate}`);
    process.exit(1);
  }
  const date = String(releaseDate).slice(0, 10);
  const identity = identityFromReleaseDate(date);
  if (!identity) {
    console.error(`cannot derive identity from date: ${date}`);
    process.exit(1);
  }

  const releaseBranch = args.releaseBranch;
  if (!releaseBranch) {
    console.error("missing --release-branch");
    process.exit(1);
  }

  const firstRelease =
    args.firstRelease ||
    args.baseline === "无" ||
    String(args.baseline || "").toLowerCase() === "none";
  const baseline = firstRelease ? null : args.baseline;
  if (!firstRelease && !baseline) {
    console.error("missing --baseline <branch> or --first-release");
    process.exit(1);
  }

  const skillVersion = readSkillVersion(skillRoot);
  const snap = checkConsumerSnapshot(root, skillVersion);
  if (snap.exists && !snap.ok && !args.allowDrift) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          step: "sync-scripts",
          error: "snapshot_version_mismatch",
          skillVersion,
          snapshotVersion: snap.version,
          hint: "node scripts/release.mjs sync-scripts -- --root . --apply  或  --allow-drift",
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const notePath = path.join(
    root,
    "docs",
    "releases",
    identity,
    `${identity}.md`
  );
  const refresh = fs.existsSync(notePath);

  // push-gate
  const gateArgs = [
    "--root",
    root,
    "--release",
    releaseBranch,
    "--baseline",
    firstRelease ? "无" : baseline,
  ];
  const gate = runNode("release-push-gate.mjs", gateArgs, root);
  let gateJson = null;
  try {
    gateJson = JSON.parse(stripBom(gate.stdout || "{}"));
  } catch {
    gateJson = { raw: gate.stdout, stderr: gate.stderr };
  }
  if (gate.status !== 0) {
    const out = {
      ok: false,
      step: "push-gate",
      identity,
      releaseDate: date,
      releaseBranch,
      baseline: firstRelease ? "无" : baseline,
      firstRelease,
      refresh,
      pushGate: gateJson,
      preview: null,
      next: "fix push / create origin refs; 会话可贴预览，勿写目录包",
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(gate.status == null ? 1 : gate.status);
  }

  const baseRef = gateJson.baseRef || (firstRelease ? null : `origin/${baseline}`);
  const headRef = gateJson.headRef || `origin/${releaseBranch}`;

  const freezeOut =
    args.out ||
    path.join(os.tmpdir(), `release-eng-freeze-${identity}-${Date.now()}.json`);
  const freezeArgs = ["--root", root, "--format", "json", "--out", freezeOut];
  if (firstRelease) {
    freezeArgs.push("--first-release", "--head", headRef);
  } else {
    freezeArgs.push("--base", baseRef, "--head", headRef);
  }
  const freeze = runNode("release-freeze.mjs", freezeArgs, root);
  if (freeze.status !== 0) {
    console.error(freeze.stderr || freeze.stdout || "freeze failed");
    process.exit(freeze.status == null ? 1 : freeze.status);
  }

  let freezeJsonPath = freezeOut;
  let aiTrackPrompt = null;
  if (args.aiTrack) {
    const ai = runNode(
      "release-ai-track.mjs",
      ["--root", root, "--freeze-json", freezeOut, "--format", "prompt-md"],
      root
    );
    aiTrackPrompt =
      ai.status === 0
        ? ai.stdout
        : `(ai-track prompt failed) ${ai.stderr || ""}`;
  }

  const draft = runNode(
    "release-freeze.mjs",
    [
      "--root",
      root,
      "--format",
      "draft-md",
      ...(firstRelease
        ? ["--first-release", "--head", headRef]
        : ["--base", baseRef, "--head", headRef]),
    ],
    root
  );

  const result = {
    ok: true,
    step: "writeplan-preview",
    identity,
    releaseDate: date,
    releaseBranch,
    baseline: firstRelease ? "无" : baseline,
    firstRelease,
    refresh,
    notePath: path.relative(root, notePath).replace(/\\/g, "/"),
    pushGate: {
      ok: true,
      baseRef,
      headRef,
      hints: gateJson.hints || null,
    },
    snapshot: {
      checked: snap.exists,
      ok: snap.ok || args.allowDrift,
      skillVersion,
      snapshotVersion: snap.version,
      allowDrift: args.allowDrift,
    },
    aiTrack: args.aiTrack ? "prompt-ready" : "skipped",
    aiTrackPrompt: args.aiTrack ? aiTrackPrompt : null,
    freezeJson: freezeJsonPath,
    draftMd: draft.status === 0 ? draft.stdout : null,
    draftMdError: draft.status === 0 ? null : draft.stderr || "draft-md failed",
    questionnaireDefaults: "全部推荐",
    highRiskInterrupt: [
      "密文键未确认",
      "配置说明待补 > 0",
      "overdueHardGate 需书面 --overdue-waived",
    ],
    writePlanConfirmWords: [
      "确认",
      "确认写入",
      "按计划执行",
      "执行 WritePlan",
      "LGTM",
    ],
    nextNoteMerge: firstRelease
      ? `node scripts/release-note-merge.mjs --root . --note ${path.relative(root, notePath).replace(/\\/g, "/")} --freeze-json ${freezeJsonPath} --first-release --head ${headRef} --identity ${identity} --release-date ${date} --release-branch ${releaseBranch}`
      : `node scripts/release-note-merge.mjs --root . --note ${path.relative(root, notePath).replace(/\\/g, "/")} --freeze-json ${freezeJsonPath} --base ${baseRef} --head ${headRef} --baseline ${baseline} --identity ${identity} --release-date ${date} --release-branch ${releaseBranch}`,
  };

  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`# WritePlan 预览包（未写盘）
身份: ${identity}  发版日期: ${date}  刷新: ${refresh}
分支对: ${firstRelease ? `(首次) ${headRef}` : `${baseRef}..${headRef}`}
push-gate: 通过
ai-track: ${result.aiTrack}
freeze JSON: ${freezeJsonPath}

## draft-md
${result.draftMd || `(失败) ${result.draftMdError}`}

## 下一步
问卷默认「全部推荐」；高风险项见 JSON。用户确认词后执行:
${result.nextNoteMerge}
`);
    if (args.format !== "summary-only") {
      console.log("\n---\n" + JSON.stringify({ ok: true, identity, freezeJson: freezeJsonPath, refresh, notePath: result.notePath }, null, 2));
    }
  }
  process.exit(0);
}

main();
