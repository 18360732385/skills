#!/usr/bin/env node
/**
 * feature-eng 闸门证据廉价校验（0.2.10-dev）。
 * 不写盘：ISO gates.* 须有合法 authorized_by；适用环须有 审核-<stage>.md。
 *
 * Usage:
 *   node scripts/gate-evidence.mjs --cwd <仓根> --slug <slug>
 *   node scripts/gate-evidence.mjs --cwd scripts/fixtures/advance-gate --slug 2026-09-19-advance-gate-demo
 *   node scripts/gate-evidence.mjs --cwd ... --slug ... --expect-fail
 */
import fs from "fs";
import path from "path";

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

const GATE_KEYS = [
  "triage",
  "shared_understanding",
  "design_confirmed",
  "go",
  "pre_impl",
  "gate",
  "verify",
  "close",
];

/** ISO gate → required L2 review file (null = L2 not required for that gate) */
const L2_FOR_GATE = {
  triage: null,
  shared_understanding: "审核-grill.md",
  design_confirmed: "审核-design.md",
  go: "审核-plan.md",
  pre_impl: null,
  gate: "审核-gate.md",
  verify: "审核-verify.md",
  close: null,
};

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

export function isFakeChatTranscriptPlaceholder(value) {
  if (value == null) return false;
  const s = String(value);
  if (/用户\s*[:：]/.test(s) && /(确认|同意|yes)/i.test(s)) return true;
  if (/^(User|Assistant|Human|AI)\s*[:：]/im.test(s)) return true;
  if (/\n/.test(s) && /确认/.test(s) && s.length > 40) return true;
  if (/\[chat[-_ ]?transcript\]/i.test(s)) return true;
  if (/伪造|假笔录|fake\s*transcript/i.test(s)) return true;
  return false;
}

export function isLegalAuthorizedBy(value) {
  if (value == null || value === "" || value === "—") return false;
  const s = String(value).trim();
  if (isFakeChatTranscriptPlaceholder(s)) return false;
  if (s === "user_chat" || s === "policy_exception") return true;
  if (/^user_task_[A-Za-z0-9._-]+$/.test(s)) return true;
  return false;
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

if (progress) {
  for (const gate of GATE_KEYS) {
    const ts = nestedScalar(progress, "gates", gate);
    if (!isIsoGate(ts)) continue;

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
    } else if (!isLegalAuthorizedBy(auth)) {
      issues.push(
        `gates.${gate}: illegal authorized_by (${JSON.stringify(auth)})`
      );
    } else {
      ok.push(`gates.${gate} authorized_by=${auth}`);
    }

    const reviewFile = L2_FOR_GATE[gate];
    if (reviewFile) {
      const reviewRel = `${runRel}/${reviewFile}`;
      const body = read(reviewRel);
      if (!body) {
        issues.push(`gates.${gate} set but missing ${reviewRel}`);
      } else if (!/result:\s*(pass|fail)\b/i.test(body)) {
        issues.push(`${reviewRel} missing result: pass|fail`);
      } else {
        ok.push(`${reviewFile} has result`);
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
