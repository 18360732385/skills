/**
 * ai_coding_ready gate helpers (strict / gold).
 * 0.3.3: gold profile · todo_scan · acceptance_warnings_max
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

/** 0.3.0: strict 缺省门槛（仅填充仍为 null/未显式关闭的项） */
export function applyStrictGateDefaults(gate, explicit = {}) {
  const g = { ...(gate || {}) };
  if (typeof g.morph_floor !== "number") g.morph_floor = 60;
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
 * 0.3.3: gold 缺省门槛
 * morph≥90 · template_completeness≥95 · TODO 扫面 B · blockers/warnings=0
 */
export function applyGoldGateDefaults(gate, explicit = {}) {
  const g = { ...(gate || {}) };
  if (typeof g.morph_floor !== "number") g.morph_floor = 90;
  if (typeof g.template_completeness_min !== "number") {
    g.template_completeness_min = 95;
  }
  if (!explicit.forbid_harness_todo) g.forbid_harness_todo = true;
  if (!explicit.todo_scan && !g.todo_scan) g.todo_scan = "harness_docs";
  if (
    typeof g.acceptance_blockers_max !== "number" &&
    typeof g.gold_ratio_min !== "number"
  ) {
    g.acceptance_blockers_max = 0;
  }
  if (typeof g.acceptance_warnings_max !== "number" && !explicit.acceptance_warnings_max) {
    g.acceptance_warnings_max = 0;
  }
  return g;
}

/** Gold profile forces per-domain coverage targets to 1.0 (only code>0 domains enforced). */
export function applyGoldCoverageDefaults(targets = {}) {
  const out = { ...targets };
  for (const d of knownContractDomainIds()) {
    out[d] = 1.0;
  }
  return out;
}

function countTodosInFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return 0;
  const text = fs.readFileSync(filePath, "utf8");
  const m = text.match(/TODO\(harness-eng\)/gi);
  return m ? m.length : 0;
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
 * Evaluate strict/gold gate extras for ai_coding_ready.
 * @returns {{ active: boolean, ok: boolean, blockers: string[], checks: object }}
 */
export function evaluateAiCodingGate(report, policy, gold) {
  const profile = policy.gate_profile || "legacy";
  const active = profile === "strict" || profile === "gold";
  const checks = {
    gate_profile: profile,
    morph_floor_ok: null,
    template_completeness_ok: null,
    no_harness_todo: null,
    gold_ok: null,
    warnings_ok: null,
    todo_scan: null,
  };
  if (!active) {
    return { active: false, ok: true, blockers: [], checks };
  }
  const g = policy.gate || {};
  const blockers = [];
  if (typeof g.morph_floor === "number") {
    const floors = [];
    const domainKeys = Object.keys(report.domains || {});
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
  } else if (typeof g.gold_ratio_min === "number") {
    const r = gold?.gold_pass_ratio;
    checks.gold_ok = typeof r === "number" && r + 1e-9 >= g.gold_ratio_min;
    if (!checks.gold_ok)
      blockers.push(`gold_ratio:${r ?? "null"}<${g.gold_ratio_min}`);
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
