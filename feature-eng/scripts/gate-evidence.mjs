#!/usr/bin/env node
/**
 * feature-eng 闸门证据校验（0.2.28+）。
 * 不写盘：ISO gates.* 须有合法 authorized_by；适用环须有 审核-<stage>.md 且 result/reviewer 合法。
 * controller_proxy + 任一 ISO gate → 回链「仪式与降级」三行须填具体值。
 * 同时做 path-aware 必过闸检查，避免「只写 gates.close 就 PASS」。
 *
 * Usage:
 *   node scripts/gate-evidence.mjs --cwd <仓根> --slug <slug>
 *   node scripts/gate-evidence.mjs --cwd scripts/fixtures/advance-gate --slug 2026-09-19-advance-gate-demo
 *   node scripts/gate-evidence.mjs --cwd ... --slug ... --expect-fail
 */
import fs from "fs";
import path from "path";
import {
  isFakeChatTranscriptPlaceholder,
  isUserTaskPlaceholder,
  isLegalAuthorizedBy,
} from "./lib/auth.mjs";
import { readTextFile } from "./lib/text-encoding.mjs";
import {
  GATE_KEYS,
  L2_FOR_GATE,
  STAGE_ENUM,
  PATH_ENUM,
  CHEF_ENUM,
  DOMAIN_PROTO_ENUM,
  stripYamlInlineComment,
} from "./lib/progress-shape.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const expectFail = process.argv.includes("--expect-fail");
const cwd = path.resolve(arg("--cwd", process.cwd()));
const slug = arg("--slug");
if (!slug) {
  console.error(
    "usage: node scripts/gate-evidence.mjs --cwd <dir> --slug <slug> [--expect-fail]"
  );
  process.exit(2);
}

/** 主链 stage 顺序（smoke 在 gate 之后、verify 之前；diagnose 为旁态不参与推断） */
const STAGE_ORDER = [
  "triage",
  "grill",
  "design",
  "domain-bridge",
  "domain",
  "spec",
  "plan",
  "proto-bridge",
  "proto",
  "testdesign",
  "pre-impl",
  "implement",
  "gate",
  "smoke",
  "verify",
  "close",
  "done",
];

function passedStage(stage, target) {
  const a = STAGE_ORDER.indexOf(String(stage));
  const b = STAGE_ORDER.indexOf(target);
  return a >= 0 && b >= 0 && a > b;
}

const REVIEWERS = new Set([
  "bound_subagent",
  "inline_session",
  "self(controller_proxy)",
]);

const RITUAL_VALUES = {
  chef_mode: ["bound", "controller_proxy"],
  invoke: ["strict", "inline"],
  review_policy: ["subagent", "inline"],
};

const issues = [];
const ok = [];

function exists(rel) {
  return fs.existsSync(path.join(cwd, rel));
}
function read(rel) {
  const p = path.join(cwd, rel);
  if (!fs.existsSync(p)) return null;
  return readTextFile(p);
}

function normalizeScalar(raw) {
  let v = stripYamlInlineComment(raw).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "" || v === "—") return null;
  return v;
}

function nestedScalar(text, parentKey, childKey) {
  if (!text) return undefined;
  const start = text.search(
    new RegExp(`^${parentKey}\\s*:\\s*(?:#.*)?$`, "m")
  );
  if (start < 0) return undefined;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  const m = block.match(new RegExp(`^\\s+${childKey}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  return normalizeScalar(m[1]);
}

function readScalar(text, key) {
  if (!text) return undefined;
  const m = text.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  return normalizeScalar(m[1]);
}

function isIsoGate(v) {
  return v != null && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(v));
}

/** | gate | time | authorized_by | note | */
function parseAuthTable(huilian) {
  const map = {};
  if (!huilian) return map;
  const section = huilian.match(/##\s*硬闸授权[\s\S]*?(?=\n##\s|\n*$)/);
  const block = section ? section[0] : huilian;
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(
      /^\|\s*([a-z_][a-z0-9_]*)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|?/
    );
    if (!m) continue;
    const gate = m[1].trim();
    if (gate === "闸" || gate === "---" || !GATE_KEYS.includes(gate)) continue;
    map[gate] = {
      time: normalizeScalar(m[2]) ?? "",
      authorized_by: normalizeScalar(m[3]) ?? "",
      note: normalizeScalar(m[4]) ?? "",
    };
  }
  return map;
}

/**
 * 「仪式与降级」须三行都填具体枚举值；模板占位（含 `|` 或纯 `—`）不算。
 */
function ritualSectionOk(huilian) {
  if (!huilian) return false;
  const section = huilian.match(
    /##\s*仪式与降级[\s\S]*?(?=\n##\s|\n*$)/
  );
  if (!section) return false;
  const lines = section[0].split(/\r?\n/);
  for (const [key, allowed] of Object.entries(RITUAL_VALUES)) {
    const line = lines.find((l) =>
      new RegExp(`^[-*]?\\s*${key}\\s*[:：]`).test(l.trim())
    );
    if (!line) return false;
    const raw = line
      .trim()
      .replace(new RegExp(`^[-*]?\\s*${key}\\s*[:：]\\s*`), "");
    const value = stripYamlInlineComment(raw)
      .replace(/`/g, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (!value || value === "—" || value.includes("|")) return false;
    const token = value.split(/[\s（(—]/)[0];
    if (!allowed.includes(token)) return false;
  }
  return true;
}

function parseReviewResult(body) {
  const results = [];
  let reviewer = null;
  for (const line of body.split(/\r?\n/)) {
    const rm = line.match(/^\s*[-*]?\s*result\s*:\s*(.*)$/i);
    if (rm) {
      results.push(stripYamlInlineComment(rm[1]).trim().toLowerCase());
    }
    const vm = line.match(/^\s*[-*]?\s*reviewer\s*:\s*(.*)$/i);
    if (vm) {
      reviewer = stripYamlInlineComment(vm[1])
        .replace(/`/g, "")
        .replace(/^["']|["']$/g, "")
        .trim();
    }
  }
  let status = "invalid";
  if (results.length === 0) status = "missing";
  else if (results.some((v) => v === "fail")) status = "fail";
  else if (results.every((v) => v === "pass")) status = "pass";
  return { status, value: results.join(" | "), reviewer };
}

function checkReview(reviewRel, label) {
  const body = read(reviewRel);
  if (!body) {
    issues.push(`${label}: missing ${reviewRel}`);
    return;
  }
  const rr = parseReviewResult(body);
  if (rr.status === "pass") {
    ok.push(`${reviewRel} result: pass`);
  } else if (rr.status === "fail") {
    issues.push(`${reviewRel} result: fail (${label} requires result: pass)`);
  } else if (rr.status === "missing") {
    issues.push(`${reviewRel} missing result: pass`);
  } else {
    issues.push(
      `${reviewRel} invalid result ${JSON.stringify(rr.value)} (expected exactly pass|fail)`
    );
  }
  if (!REVIEWERS.has(rr.reviewer)) {
    issues.push(
      `${reviewRel} missing/invalid reviewer (bound_subagent|inline_session|self(controller_proxy))`
    );
  }
}

function requiredGatesFor(pathVal, stageVal) {
  if (!pathVal || pathVal === "spike") return [];
  if (stageVal === "diagnose") return [];
  const s = stageVal === "smoke" ? "smoke" : stageVal;
  const req = [];
  if (passedStage(s, "triage")) req.push("triage");
  if (passedStage(s, "grill")) req.push("shared_understanding");
  if (passedStage(s, "design")) req.push("design_confirmed");
  if (passedStage(s, "plan")) req.push("go");
  if (passedStage(s, "pre-impl")) req.push("pre_impl");
  if (passedStage(s, "gate")) req.push("gate");
  if (pathVal === "full" && passedStage(s, "verify")) req.push("verify");
  if (s === "done") req.push("close");
  return req;
}

const activeRel = `docs/runs/active/${slug}`;
const archiveRel = `docs/runs/archive/${slug}`;
let runRel = null;
if (exists(`${activeRel}/progress.yaml`)) runRel = activeRel;
else if (exists(`${archiveRel}/progress.yaml`)) runRel = archiveRel;

if (!runRel) {
  issues.push(
    `missing docs/runs/{active|archive}/${slug}/progress.yaml under ${cwd}`
  );
} else {
  ok.push(`run dir: ${runRel}`);
}

const progressRel = runRel ? `${runRel}/progress.yaml` : null;
const huilianRel = runRel ? `${runRel}/回链.md` : null;
const progress = progressRel ? read(progressRel) : null;
const huilian = huilianRel ? read(huilianRel) : null;

if (runRel && !progress) issues.push(`unreadable ${progressRel}`);
if (runRel && !huilian) issues.push(`missing ${huilianRel}`);
else if (huilian) ok.push("回链.md present");

const authMap = parseAuthTable(huilian || "");

let anyIsoGate = false;
if (progress) {
  const gatesLine = progress.match(/^gates\s*:\s*(.*)$/m);
  if (!gatesLine) {
    issues.push("missing block-style gates: in progress.yaml");
  } else {
    const tail = stripYamlInlineComment(gatesLine[1]).trim();
    if (tail.startsWith("{")) {
      issues.push("inline gates mapping not supported; use block style");
    } else if (tail === "null" || tail === "~") {
      issues.push("gates block is null; use block style with gate keys");
    }
  }

  for (const gate of GATE_KEYS) {
    const ts = nestedScalar(progress, "gates", gate);
    if (ts == null) continue;
    if (!isIsoGate(ts)) {
      issues.push(`gates.${gate} not ISO timestamp: ${JSON.stringify(ts)}`);
      continue;
    }
    anyIsoGate = true;
    ok.push(`gates.${gate} is ISO`);

    const row = authMap[gate];
    if (!row) {
      issues.push(
        `gates.${gate} set but 回链 硬闸授权表 missing row for ${gate}`
      );
      continue;
    }
    const auth = row.authorized_by;
    if (auth === "—" || auth === "" || auth == null) {
      issues.push(
        `gates.${gate}: authorized_by empty (got ${JSON.stringify(auth)})`
      );
    } else if (isFakeChatTranscriptPlaceholder(auth)) {
      issues.push(`gates.${gate}: fake transcript in authorized_by`);
    } else if (isUserTaskPlaceholder(auth)) {
      issues.push(
        `gates.${gate}: placeholder user_task id (${JSON.stringify(auth)})`
      );
    } else if (!isLegalAuthorizedBy(auth)) {
      issues.push(
        `gates.${gate}: illegal authorized_by (${JSON.stringify(auth)})`
      );
    } else {
      ok.push(`gates.${gate} authorized_by=${auth}`);
    }
    if (
      auth === "policy_exception" &&
      (!row.note || row.note === "—")
    ) {
      issues.push(`gates.${gate}: policy_exception requires 备注`);
    }

    if (!row.time || row.time === "—") {
      issues.push(`gates.${gate}: auth table time empty`);
    } else {
      const progressTime = Date.parse(String(ts));
      const tableTime = Date.parse(row.time);
      const same =
        Number.isFinite(progressTime) && Number.isFinite(tableTime)
          ? progressTime === tableTime
          : String(ts) === row.time;
      if (same) {
        ok.push(`gates.${gate} auth table time matches`);
      } else {
        issues.push(
          `gates.${gate} auth table time mismatch (progress=${String(ts)} table=${row.time})`
        );
      }
    }

    const reviewFile = L2_FOR_GATE[gate];
    if (reviewFile) {
      checkReview(`${runRel}/${reviewFile}`, `gates.${gate}`);
    }
  }

  const chefMode = readScalar(progress, "chef_mode");
  const protoVal = readScalar(progress, "proto");
  const stageVal = readScalar(progress, "stage");
  const pathVal = readScalar(progress, "path");
  const domainVal = readScalar(progress, "domain");

  if (pathVal != null && !PATH_ENUM.has(pathVal)) {
    issues.push(`path illegal: ${JSON.stringify(pathVal)}`);
  }
  if (chefMode != null && !CHEF_ENUM.has(chefMode)) {
    issues.push(`chef_mode illegal: ${JSON.stringify(chefMode)}`);
  }
  if (protoVal != null && !DOMAIN_PROTO_ENUM.has(protoVal)) {
    issues.push(`proto illegal: ${JSON.stringify(protoVal)}`);
  }
  if (stageVal != null && !STAGE_ENUM.has(stageVal)) {
    issues.push(`stage illegal: ${JSON.stringify(stageVal)}`);
  }
  if (pathVal == null && stageVal !== "triage") {
    issues.push("progress.path missing/null");
  }

  if (chefMode === "controller_proxy" && anyIsoGate) {
    if (!ritualSectionOk(huilian)) {
      issues.push(
        "chef_mode=controller_proxy with ISO gates requires 回链「仪式与降级」chef_mode/invoke/review_policy 三行具体值"
      );
    } else {
      ok.push("controller_proxy 仪式与降级 filled");
    }
  }

  // F-04: proto=entered requires ISO gates.proto_confirmed
  if (protoVal === "entered") {
    const pc = nestedScalar(progress, "gates", "proto_confirmed");
    if (!isIsoGate(pc)) {
      issues.push(
        "progress.proto=entered requires ISO gates.proto_confirmed"
      );
    } else {
      ok.push("gates.proto_confirmed present for proto=entered");
    }
  }

  // path-aware 必过闸：只校验“已声明”的闸会漏掉整段跳闸。
  for (const gate of requiredGatesFor(pathVal, stageVal)) {
    const v = nestedScalar(progress, "gates", gate);
    if (v == null) {
      issues.push(
        `required gate ${gate} missing (path=${pathVal}, stage=${stageVal})`
      );
    }
  }

  // 中途环 L2：stage 越过环 X 时须有 审核-X.md；diagnose 可出现在任意时点，跳过。
  const inferredStage = stageVal === "smoke" ? "smoke" : stageVal;
  if (stageVal !== "diagnose" && runRel) {
    const midReqs = [];
    if (pathVal === "full" && passedStage(inferredStage, "spec")) {
      midReqs.push(["spec", "审核-spec.md"]);
    }
    if (pathVal === "full" && passedStage(inferredStage, "testdesign")) {
      midReqs.push(["testdesign", "审核-testdesign.md"]);
    }
    if (passedStage(inferredStage, "implement")) {
      midReqs.push(["implement", "审核-implement.md"]);
    }
    if (domainVal === "entered" && passedStage(inferredStage, "domain")) {
      midReqs.push(["domain", "审核-domain.md"]);
    }
    for (const [ring, reviewFile] of midReqs) {
      checkReview(
        `${runRel}/${reviewFile}`,
        `stage=${stageVal} passed ring ${ring}`
      );
    }
  }
}

const failed = issues.length > 0;
if (expectFail) {
  if (failed) {
    console.log(
      `gate-evidence EXPECT-FAIL OK slug=${slug} (${issues.length} issue(s))`
    );
    for (const i of issues) console.log("  ✗", i);
    process.exit(0);
  }
  console.error(
    `gate-evidence EXPECT-FAIL but PASSED slug=${slug} (${ok.length} checks)`
  );
  for (const o of ok) console.log("  ✓", o);
  process.exit(1);
}

if (failed) {
  console.error(`gate-evidence FAIL ${issues.length} issue(s) slug=${slug}`);
  for (const i of issues) console.error("  ✗", i);
  for (const o of ok) console.log("  ✓", o);
  process.exit(1);
}
console.log(`gate-evidence PASS slug=${slug} (${ok.length} checks)`);
for (const o of ok) console.log("  ✓", o);
