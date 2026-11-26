/**
 * ai_coding_ready gate helpers (strict / gold / mature_compat).
 * 0.3.3: gold profile · todo_scan · acceptance_warnings_max
 * 0.7.48: mature_compat — strict morph + gold acceptance, no coverage 1.0 force
 */
import fs from "fs";
import path from "path";
import {
  knownContractDomainIds,
  defaultContractDomains,
  truthsPath,
  indexFileName,
  loadDomainRegistry,
} from "./domains.mjs";

/** 0.3.0 / 0.7.0: strict 缺省门槛（仅填充仍为 null/未显式关闭的项） */
export function applyStrictGateDefaults(gate, explicit = {}) {
  const g = { ...(gate || {}) };
  if (typeof g.morph_floor !== "number") g.morph_floor = 75;
  if (!explicit.forbid_harness_todo) g.forbid_harness_todo = true;
  if (!explicit.todo_scan && !g.todo_scan) g.todo_scan = "truths";
  if (
    typeof g.acceptance_blockers_max !== "number" &&
    typeof g.gold_ratio_min !== "number"
  ) {
    g.acceptance_blockers_max = 0;
  }
  return g;
}

/**
 * 0.3.3 / 0.7.0: gold 缺省门槛
 * morph≥95 · template_completeness≥95 · TODO 扫面 B · blockers/warnings=0
 */
export function applyGoldGateDefaults(gate, explicit = {}) {
  const g = { ...(gate || {}) };
  if (typeof g.morph_floor !== "number") g.morph_floor = 95;
  if (typeof g.template_completeness_min !== "number") {
    g.template_completeness_min = 95;
  }
  if (!explicit.forbid_harness_todo) g.forbid_harness_todo = true;
  if (!explicit.todo_scan && !g.todo_scan) g.todo_scan = "harness_docs";
  if (typeof g.acceptance_blockers_max !== "number") {
    g.acceptance_blockers_max = 0;
  }
  // 0.8.7: gold 同时要求全仓通过率 ≥ 0.98，不再与 blockers 互斥
  if (typeof g.gold_ratio_min !== "number") {
    g.gold_ratio_min = 0.98;
  }
  if (typeof g.acceptance_warnings_max !== "number" && !explicit.acceptance_warnings_max) {
    g.acceptance_warnings_max = 0;
  }
  return g;
}

/**
 * gold 开干判定用的覆盖策略。不写回 score-policy.yaml。
 * 文件里的 overall / weighted 只在非 gold 档生效。
 */
export function evaluationCoveragePolicy(policy) {
  if ((policy?.gate_profile || "") !== "gold") return policy || {};
  return {
    ...policy,
    coverage_mode: "all_domains",
    coverage_targets: applyGoldCoverageDefaults({ ...(policy.coverage_targets || {}) }),
  };
}

/** Gold profile forces per-domain coverage targets to 1.0 (only code>0 domains enforced). */
export function applyGoldCoverageDefaults(targets = {}) {
  const out = { ...targets };
  for (const d of knownContractDomainIds()) {
    out[d] = 1.0;
  }
  return out;
}

/**
 * 0.7.48: thick/mature repos — strict morph floor + gold acceptance bars;
 * does NOT force coverage 1.0 / all_domains.
 */
export function applyMatureCompatGateDefaults(gate, explicit = {}) {
  const g = applyStrictGateDefaults(gate, explicit);
  if (typeof g.acceptance_warnings_max !== "number" && !explicit.acceptance_warnings_max) {
    g.acceptance_warnings_max = 0;
  }
  return g;
}

/**
 * 0.7.30 NEW-12: re-apply gate_profile defaults (shared by loadScorePolicy + CLI --gate-profile).
 * Gold clears strict fingerprints (morph_floor 75 / todo_scan truths) so applyGoldGateDefaults can fill.
 * @param {object} policy  mutable score-policy object ({ gate, coverage_targets, coverage_mode, ... })
 * @param {"strict"|"gold"|"legacy"|"mature_compat"|string} profile
 * @param {{ explicit?: object, coverageModeFromFile?: boolean }} [opts]
 * @returns {object} policy
 */
export function reapplyGateProfile(policy, profile, opts = {}) {
  const p = policy || {};
  const explicit = { ...(opts.explicit || {}) };
  p.gate_profile = profile;
  const gate = { ...(p.gate || {}) };
  if (profile === "gold") {
    // land 曾写死的 strict 指纹在切 gold 时视为未设置
    if (gate.morph_floor === 75) delete gate.morph_floor;
    if (gate.todo_scan === "truths") {
      delete gate.todo_scan;
      delete explicit.todo_scan;
    }
    p.gate = applyGoldGateDefaults(gate, explicit);
    p.coverage_targets = applyGoldCoverageDefaults(p.coverage_targets || {});
    // match loadScorePolicy: only set all_domains when file omitted coverage_mode
    if (!opts.coverageModeFromFile) p.coverage_mode = "all_domains";
  } else if (profile === "mature_compat") {
    // clear gold fingerprints if switching down from gold
    if (gate.morph_floor === 95) delete gate.morph_floor;
    if (gate.todo_scan === "harness_docs") {
      delete gate.todo_scan;
      delete explicit.todo_scan;
    }
    if (gate.template_completeness_min === 95) delete gate.template_completeness_min;
    p.gate = applyMatureCompatGateDefaults(gate, explicit);
  } else if (profile === "strict") {
    p.gate = applyStrictGateDefaults(gate, explicit);
  } else {
    p.gate = gate;
  }
  return p;
}

/**
 * Strip ## 变更记录 … (until next ##) so changelog mentions of the marker
 * do not inflate harness_todo counts (0.8.5).
 */
function stripChangelogSections(text) {
  const parts = String(text || "").split(/(?=^##\s)/m);
  return parts.filter((p) => !/^##[^\n]*变更记录/m.test(p)).join("");
}

function stripTodoNoise(text) {
  let s = stripChangelogSections(text);
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/`[^`\n]*`/g, "");
  return s;
}

/** A line counts when the marker is the placeholder, not a mid-sentence mention. */
function lineActionableTodoHits(line) {
  if (!/TODO\(harness-eng\)/i.test(line)) return 0;
  if (line.includes("|")) {
    const cells = line.split("|").map((c) => c.trim());
    let n = 0;
    for (const cell of cells) {
      if (/^TODO\(harness-eng\)(?:\s*[:：]|\s*$)/i.test(cell)) n++;
    }
    if (n) return n;
  }
  const stripped = line
    .replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|>\s+|\d+[.)]\s+)*/, "")
    .trim();
  if (/^TODO\(harness-eng\)(?:\s*[:：]|\s*$)/i.test(stripped)) return 1;
  return 0;
}

/**
 * Count placeholder TODO(harness-eng), not prose mentions (0.8.6).
 * Skips changelog sections, fenced code, and inline code.
 */
export function countActionableHarnessTodos(text) {
  const body = stripTodoNoise(text);
  let n = 0;
  for (const line of body.split(/\r?\n/)) n += lineActionableTodoHits(line);
  return n;
}

export function hasActionableHarnessTodo(text) {
  return countActionableHarnessTodos(text) > 0;
}

function countTodosInFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return 0;
  return countActionableHarnessTodos(fs.readFileSync(filePath, "utf8"));
}

function countTodosInDir(dir, { recursive = false, nameRe = /\.md$/i } = {}) {
  let n = 0;
  if (!fs.existsSync(dir)) return 0;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      if (name === "node_modules" || name === ".git") continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (recursive) walk(p);
        continue;
      }
      if (!nameRe.test(name) || /^README/i.test(name)) continue;
      n += countTodosInFile(p);
    }
  };
  walk(dir);
  return n;
}

/**
 * Count TODO(harness-eng).
 * @param {string} root
 * @param {"truths"|"harness_docs"|"all"} scan
 *   truths (A/strict): 契约域真相目录（domains.yaml）
 *   harness_docs (B/gold): + 索引 + 根/分册 AGENTS + agent-kb + .cursor/rules
 *   all (C): B + 常见源码树中的 TODO(harness-eng)
 */
export function countHarnessTodos(root, scan = "truths") {
  if (!root) return 0;
  let n = 0;
  const registry = loadDomainRegistry();
  const domains = knownContractDomainIds(registry);
  for (const d of domains) {
    n += countTodosInDir(truthsPath(root, d, registry));
  }

  if (scan === "truths") return n;

  for (const d of domains) {
    n += countTodosInFile(path.join(root, "docs", d, indexFileName(d, registry)));
  }

  n += countTodosInFile(path.join(root, "AGENTS.md"));
  try {
    for (const name of fs.readdirSync(root)) {
      const p = path.join(root, name);
      try {
        if (fs.statSync(p).isDirectory() && !name.startsWith(".")) {
          n += countTodosInFile(path.join(p, "AGENTS.md"));
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }

  n += countTodosInDir(path.join(root, "docs", "agent-kb"), { recursive: true });
  n += countTodosInDir(path.join(root, ".cursor", "rules"), {
    recursive: true,
    nameRe: /\.(mdc|md)$/i,
  });

  if (scan === "harness_docs") return n;

  // all: also scan java/ts/js under src (and scripts) for TODO(harness-eng)
  const codeRoots = [];
  try {
    for (const name of fs.readdirSync(root)) {
      const p = path.join(root, name);
      try {
        if (!fs.statSync(p).isDirectory() || name.startsWith(".")) continue;
        const src = path.join(p, "src");
        if (fs.existsSync(src)) codeRoots.push(src);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  const scriptsDir = path.join(root, "scripts");
  if (fs.existsSync(scriptsDir)) codeRoots.push(scriptsDir);
  for (const dir of codeRoots) {
    n += countTodosInDir(dir, {
      recursive: true,
      nameRe: /\.(java|ts|tsx|js|mjs|md|yml|yaml)$/i,
    });
  }
  return n;
}

/**
 * Strict entry_ready: ## Commands / Critical sections must not still be TODO(harness-eng).
 * @returns {{ ok: boolean, files: string[] }}
 */
export function checkEntryReady(root) {
  const files = [];
  const paths = [path.join(root, "AGENTS.md")];
  try {
    for (const name of fs.readdirSync(root)) {
      const p = path.join(root, name);
      try {
        if (fs.statSync(p).isDirectory() && !name.startsWith(".")) {
          paths.push(path.join(p, "AGENTS.md"));
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  for (const abs of paths) {
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const text = fs.readFileSync(abs, "utf8");
    const sections = text.split(/^##\s+/m);
    for (const sec of sections) {
      const head = (sec.split(/\r?\n/)[0] || "").trim();
      // 0.7.27 SG-7: JS \\b does not bound CJK — English use \\b, Chinese use $
      if (
        !/^(?:Commands|Critical|Never\s*do)\b|^(?:命令|常用命令|关键|关键约束|禁止|禁区)$/i.test(
          head
        )
      )
        continue;
      if (hasActionableHarnessTodo(sec)) {
        files.push(path.relative(root, abs).replace(/\\/g, "/"));
        break;
      }
    }
  }
  return { ok: files.length === 0, files: [...new Set(files)] };
}

/**
 * Evaluate strict/gold gate extras for ai_coding_ready.
 * @returns {{ active: boolean, ok: boolean, blockers: string[], checks: object }}
 */
export function evaluateAiCodingGate(report, policy, gold) {
  const profile = policy.gate_profile || "legacy";
  const active =
    profile === "strict" || profile === "gold" || profile === "mature_compat";
  const checks = {
    gate_profile: profile,
    morph_floor_ok: null,
    template_completeness_ok: null,
    no_harness_todo: null,
    entry_ready: null,
    gold_ok: null,
    warnings_ok: null,
    todo_scan: null,
    frontend_coverage: null,
  };
  if (!active) {
    return { active: false, ok: true, blockers: [], checks };
  }
  const g = policy.gate || {};
  const blockers = [];
  // strict / mature_compat: AGENTS Commands/Critical 不得仍是 TODO
  if ((profile === "strict" || profile === "mature_compat") && report.root) {
    const entry = checkEntryReady(report.root);
    checks.entry_ready = entry.ok;
    if (!entry.ok) {
      blockers.push("entry_todo:" + entry.files.join(","));
    }
  }
  const domainKeys = Object.keys(report.domains || {});
  // 0.8.0: 前端域实计——design/prototype（及后续 pages/components/client-api 精填）
  // 计入 coverage_by_domain；启用即 measured，未启用沿用 not_measured 占位（防回归）
  if (domainKeys.length) {
    const FRONTEND_DOMAINS = ["design", "prototype", "pages", "components", "client-api"];
    const feScored = domainKeys.filter((d) => FRONTEND_DOMAINS.includes(d));
    checks.frontend_coverage = feScored.length
      ? `measured_by_domain:${feScored.join(",")}`
      : "not_measured";
  }
  if (typeof g.morph_floor === "number") {
    const floors = [];
    const checkDomains = domainKeys.length
      ? domainKeys
      : defaultContractDomains();
    for (const d of checkDomains) {
      const sc = report.domains?.[d]?.score;
      if (typeof sc !== "number") continue;
      if (sc + 1e-9 < g.morph_floor) floors.push(`${d}:${sc}<${g.morph_floor}`);
    }
    checks.morph_floor_ok = floors.length === 0;
    if (!checks.morph_floor_ok) blockers.push("morph_floor:" + floors.join(","));
  }
  if (typeof g.template_completeness_min === "number") {
    const tc = report.template_completeness?.overall;
    checks.template_completeness_ok =
      typeof tc === "number" && tc + 1e-9 >= g.template_completeness_min;
    if (!checks.template_completeness_ok)
      blockers.push(
        `template_completeness:${tc ?? "null"}<${g.template_completeness_min}`
      );
  }
  if (g.forbid_harness_todo) {
    const scan = g.todo_scan || (profile === "gold" ? "harness_docs" : "truths");
    checks.todo_scan = scan;
    const todos = countHarnessTodos(report.root, scan);
    checks.no_harness_todo = todos === 0;
    checks.harness_todo_count = todos;
    if (!checks.no_harness_todo) blockers.push(`harness_todo:${todos}@${scan}`);
  }
  if (typeof g.acceptance_blockers_max === "number") {
    const b = gold?.blockers;
    checks.gold_ok = typeof b === "number" && b <= g.acceptance_blockers_max;
    if (!checks.gold_ok)
      blockers.push(
        `acceptance_blockers:${b ?? "null"}>max${g.acceptance_blockers_max}`
      );
  }
  if (typeof g.gold_ratio_min === "number") {
    const r = gold?.gold_pass_ratio;
    const ratioOk = typeof r === "number" && r + 1e-9 >= g.gold_ratio_min;
    checks.gold_ratio_ok = ratioOk;
    if (checks.gold_ok == null) checks.gold_ok = ratioOk;
    else if (!ratioOk) checks.gold_ok = false;
    if (!ratioOk)
      blockers.push(`gold_ratio:${r ?? "null"}<${g.gold_ratio_min}`);
  }
  if (profile === "gold") {
    const min =
      typeof g.gold_ratio_min === "number" ? g.gold_ratio_min : 0.98;
    const domainGaps = [];
    for (const [d, row] of Object.entries(report.coverage_by_domain || {})) {
      if (!(row && row.code > 0)) continue;
      const ratio = report.gold_by_domain?.[d]?.gold_pass_ratio;
      if (typeof ratio !== "number" || ratio + 1e-9 < min) {
        domainGaps.push(`${d}:${ratio ?? "null"}<${min}`);
      }
    }
    checks.gold_ratio_domain_ok = domainGaps.length === 0;
    if (!checks.gold_ratio_domain_ok) {
      blockers.push("gold_ratio_domain:" + domainGaps.join(","));
    }
    const auditGaps = [];
    for (const [d, row] of Object.entries(report.coverage_audit?.by_domain || {})) {
      if (!row?.required) continue;
      if (row.status !== "pass") {
        auditGaps.push(`${d}:${row.reason || row.status || "gap"}`);
      }
    }
    checks.coverage_audit_ok = auditGaps.length === 0;
    if (!checks.coverage_audit_ok) {
      blockers.push("coverage_audit:" + auditGaps.join(","));
    }
  }
  if (typeof g.acceptance_warnings_max === "number") {
    const w = gold?.warnings;
    checks.warnings_ok = typeof w === "number" && w <= g.acceptance_warnings_max;
    if (!checks.warnings_ok)
      blockers.push(
        `acceptance_warnings:${w ?? "null"}>max${g.acceptance_warnings_max}`
      );
  }
  return { active: true, ok: blockers.length === 0, blockers, checks };
}
