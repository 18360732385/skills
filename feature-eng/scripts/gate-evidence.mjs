#!/usr/bin/env node
/**
 * feature-eng 闸门证据廉价校验（0.2.15-dev）。
 * 不写盘：ISO gates.* 须有合法 authorized_by；适用环须有 审核-<stage>.md 且 result: pass。
 * controller_proxy + 任一 ISO gate → 回链「仪式与降级」节非空。
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
import { GATE_KEYS, L2_FOR_GATE } from "./lib/progress-shape.mjs";

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

/** 主链 stage 顺序（smoke/diagnose 为旁态，不参与中途环推断） */
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
  "verify",
  "close",
  "done",
];

/** stage 是否已越过主链上 target 环（任一不在主链内则视为未越过） */
function passedStage(stage, target) {
  const a = STAGE_ORDER.indexOf(String(stage));
  const b = STAGE_ORDER.indexOf(target);
  return a >= 0 && b >= 0 && a > b;
}

const issues = [];
const ok = [];

function exists(rel) {
  return fs.existsSync(path.join(cwd, rel));
}
function read(rel) {
  const p = path.join(cwd, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}
function nestedScalar(text, parentKey, childKey) {
  if (!text) return undefined;
  const start = text.search(new RegExp(`^${parentKey}:\\s*$`, "m"));
  if (start < 0) return undefined;
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  const m = block.match(new RegExp(`^\\s+${childKey}\\s*:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}
function readScalar(text, key) {
  if (!text) return undefined;
  const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}

function isIsoGate(v) {
  return v != null && /^\d{4}-\d{2}-\d{2}T/.test(String(v));
}

/**
 * Parse 硬闸授权 markdown table rows:
 * | triage | 2026-... | user_chat | ... |
 */
function parseAuthTable(huilian) {
  const map = {};
  if (!huilian) return map;
  const section = huilian.match(
    /##\s*硬闸授权[\s\S]*?(?=\n##\s|\n*$)/
  );
  const block = section ? section[0] : huilian;
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(
      /^\|\s*([a-z_][a-z0-9_]*)\s*\|\s*([^|]*)\|\s*([^|]*)\|/
    );
    if (!m) continue;
    const gate = m[1].trim();
    if (gate === "闸" || gate === "---" || !GATE_KEYS.includes(gate)) continue;
    map[gate] = {
      time: m[2].trim(),
      authorized_by: m[3].trim(),
    };
  }
  return map;
}

/** 「仪式与降级」节存在且有实质行（非空、非纯 —） */
function ritualSectionOk(huilian) {
  if (!huilian || !/##\s*仪式与降级/.test(huilian)) return false;
  const m = huilian.match(/##\s*仪式与降级\s*\n([\s\S]*?)(?=\n##\s|\n*$)/);
  if (!m) return false;
  const meaningful = (m[1] || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && l !== "—" && !/^[-*]\s*—\s*$/.test(l));
  return meaningful.length > 0;
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
  // D4：内联 gates 映射（gates: {...}）块状解析器读不到，显式拒绝，杜绝静默漏检
  if (/^gates:\s*\{/m.test(progress)) {
    issues.push("inline gates mapping not supported; use block style");
  }
  for (const gate of GATE_KEYS) {
    const ts = nestedScalar(progress, "gates", gate);
    if (!isIsoGate(ts)) continue;
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
      issues.push(`gates.${gate}: authorized_by empty (got ${JSON.stringify(auth)})`);
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

    // D5：授权表 time 列 ↔ progress gates ISO 时间一致性（双非空且字符串不等 → issue）
    if (row.time && row.time !== "—") {
      if (String(ts) !== row.time) {
        issues.push(
          `gates.${gate} auth table time mismatch (progress=${String(ts)} table=${row.time})`
        );
      } else {
        ok.push(`gates.${gate} auth table time matches`);
      }
    }

    const reviewFile = L2_FOR_GATE[gate];
    if (reviewFile) {
      const reviewRel = `${runRel}/${reviewFile}`;
      const body = read(reviewRel);
      if (!body) {
        issues.push(`gates.${gate} set but missing ${reviewRel}`);
      } else if (!/result:\s*pass\b/i.test(body)) {
        if (/result:\s*fail\b/i.test(body)) {
          issues.push(
            `${reviewRel} result: fail (ISO gates.${gate} requires result: pass)`
          );
        } else {
          issues.push(`${reviewRel} missing result: pass`);
        }
      } else {
        ok.push(`${reviewFile} result: pass`);
      }
    }
  }

  const chefMode = readScalar(progress, "chef_mode");
  if (chefMode === "controller_proxy" && anyIsoGate) {
    if (!ritualSectionOk(huilian)) {
      issues.push(
        "chef_mode=controller_proxy with ISO gates requires non-empty 回链「仪式与降级」"
      );
    } else {
      ok.push("controller_proxy 仪式与降级 present");
    }
  }

  // F-04: proto=entered requires ISO gates.proto_confirmed
  const protoVal = readScalar(progress, "proto");
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

  // D2：中途环 L2 阶段推断 —— stage 越过环 X 时须有 审核-X.md 且 result: pass
  // spec / testdesign 仅 path=full 检查（B 路径无独立 spec/testdesign 环，勿误伤）；
  // smoke / diagnose 为旁态，跳过本检查。
  const stageVal = readScalar(progress, "stage");
  const pathVal = readScalar(progress, "path");
  const domainVal = readScalar(progress, "domain");
  if (stageVal !== "smoke" && stageVal !== "diagnose" && runRel) {
    const midReqs = [];
    if (pathVal === "full" && passedStage(stageVal, "spec")) {
      midReqs.push(["spec", "审核-spec.md"]);
    }
    if (pathVal === "full" && passedStage(stageVal, "testdesign")) {
      midReqs.push(["testdesign", "审核-testdesign.md"]);
    }
    if (passedStage(stageVal, "implement")) {
      midReqs.push(["implement", "审核-implement.md"]);
    }
    if (domainVal === "entered" && passedStage(stageVal, "domain")) {
      midReqs.push(["domain", "审核-domain.md"]);
    }
    for (const [ring, reviewFile] of midReqs) {
      const reviewRel = `${runRel}/${reviewFile}`;
      const body = read(reviewRel);
      if (!body) {
        issues.push(
          `stage=${stageVal} passed ring ${ring} but missing ${reviewRel}`
        );
      } else if (!/result:\s*pass\b/i.test(body)) {
        if (/result:\s*fail\b/i.test(body)) {
          issues.push(
            `${reviewRel} result: fail (stage=${stageVal} passed ring ${ring} requires result: pass)`
          );
        } else {
          issues.push(`${reviewRel} missing result: pass`);
        }
      } else {
        ok.push(`${reviewFile} result: pass (stage=${stageVal} passed ring ${ring})`);
      }
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
