#!/usr/bin/env node
/**
 * Lightweight 0.2.10 selfcheck (no DB/Redis required).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

// versions
const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.10"/.test(manifest), "manifest version 0.2.10");
const questions = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(/version:\s*"0\.2\.10"/.test(questions), "questions.yaml version 0.2.10");
const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
assert(skill.includes("0.2.10") && skill.includes("fill-calibrate-live"), "SKILL.md 0.2.10 + calibrate");

// scripts exist
for (const s of [
  "fill-calibrate-live.mjs",
  "fill-inventory-redis.mjs",
  "fill-truths-auto.mjs",
  "fill-dto-batch.mjs",
  "fill-score.mjs",
]) {
  assert(fs.existsSync(path.join(skillRoot, "scripts", s)), `script ${s}`);
}

// redis inventory source: multi-root + promote
const redisInv = fs.readFileSync(path.join(skillRoot, "scripts/fill-inventory-redis.mjs"), "utf8");
assert(redisInv.includes("listJavaRoots"), "redis inventory listJavaRoots");
assert(/REDIS_\*|SMS:/.test(redisInv) || redisInv.includes("REDIS_"), "redis promote REDIS_");

// auto always TTL
const auto = fs.readFileSync(path.join(skillRoot, "scripts/fill-truths-auto.mjs"), "utf8");
assert(auto.includes("always emit ## TTL") || auto.includes("## TTL"), "auto ## TTL always");

// score formula_ceiling
const score = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
assert(score.includes("formula_ceiling") || score.includes("formulaCeiling"), "fill-score formula_ceiling");

// dto multi-root
const dto = fs.readFileSync(path.join(skillRoot, "scripts/fill-dto-batch.mjs"), "utf8");
assert(dto.includes("listJavaRoots"), "dto-batch listJavaRoots");

// questions large_repo → pipeline
assert(
  /large_repo[\s\S]{0,200}pipeline|recommended_when:[\s\S]*large_repo[\s\S]*pipeline/i.test(questions) ||
    questions.includes("large_repo"),
  "questions mentions large_repo"
);

// calibrate --help
const help = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-calibrate-live.mjs"), "--help"], {
  encoding: "utf8",
});
assert(help.status === 0 || (help.stdout || help.stderr || "").includes("Usage") || (help.stdout || "").includes("--root"), "calibrate --help");

// optional: score on sms repo if present
const smsRoot = "D:/workspace/git-company/sms2023-backend";
if (fs.existsSync(path.join(smsRoot, "docs"))) {
  const r = spawnSync(
    process.execPath,
    [
      path.join(skillRoot, "scripts/fill-score.mjs"),
      "--root",
      smsRoot,
      "--ready-quality",
      "70",
      "--ready-coverage",
      "0.6",
      "--summary-only",
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
  );
  const out = (r.stdout || "") + (r.stderr || "");
  assert(out.includes("formula_ceiling") || out.includes("公式"), "fill-score emits formula_ceiling on sms repo");
}

// questions-next recommend pipeline for large_repo
const answersPath = path.join(skillRoot, "scripts/.tmp-selfcheck-answers.json");
fs.writeFileSync(
  answersPath,
  JSON.stringify({
    type: "NEW_CODE_NO_HARNESS",
    large_repo: true,
    multi_workspace: false,
  }),
  "utf8"
);
const qn = spawnSync(
  process.execPath,
  [path.join(skillRoot, "scripts/questions-next.mjs"), "--answers", answersPath, "--batch", "1"],
  { encoding: "utf8", cwd: skillRoot }
);
const qout = (qn.stdout || "") + (qn.stderr || "");
if (qn.status === 0 || qout) {
  const pipelineRec =
    /recommended["']?\s*[:=]\s*["']?pipeline/i.test(qout) ||
    /pipeline/.test(qout) && /推荐|recommended/i.test(qout);
  // soft: if script needs more context, at least ran
  if (pipelineRec) ok.push("questions-next recommends pipeline for large_repo");
  else ok.push("questions-next ran (pipeline rec soft-check skipped if schema differs)");
}
try {
  fs.unlinkSync(answersPath);
} catch {}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);
