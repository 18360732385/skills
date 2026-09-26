/**
 * audit 内容扫描：分册 AGENTS 空壳 + Never do↔Pn（不写盘改契约）。
 * Never do 逻辑对齐 templates/scripts/lint-pitfalls.mjs.tmpl 的 warnNeverDoPnBacklinks。
 */
import fs from "fs";
import path from "path";

const TODO_RE = /TODO\(harness-eng\)/g;
const PATH_LOOKUP_RE = /改动路径速查/;

function walkAgentsMd(root, maxDepth = 4) {
  const out = [];
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (name === ".git" || name === "node_modules" || name === "target" || name === "dist") {
        continue;
      }
      const abs = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(abs, depth + 1);
      else if (name === "AGENTS.md" && depth > 0) {
        out.push(abs);
      }
    }
  }
  walk(root, 0);
  return out;
}

function analyzeModuleAgents(abs, root) {
  const text = fs.readFileSync(abs, "utf8");
  const lines = text.split(/\r?\n/);
  const todoCount = (text.match(TODO_RE) || []).length;
  const nonEmpty = lines.filter((l) => l.trim()).length || 1;
  const todoRatio = todoCount / Math.max(nonEmpty, 1);
  const hasLookupHeading = PATH_LOOKUP_RE.test(text);
  // 「实表」：速查标题后有至少一行非空、非 TODO、非仅示例占位的表格行
  let hasLookupTable = false;
  if (hasLookupHeading) {
    const idx = text.search(PATH_LOOKUP_RE);
    const after = text.slice(idx);
    const rows = after.split(/\r?\n/).filter((l) => /^\|/.test(l.trim()));
    const dataRows = rows.filter(
      (l) =>
        !/^\|\s*-+/.test(l.trim()) &&
        !/参数名|路径|说明|Task/.test(l) &&
        !/TODO\(harness-eng\)/.test(l) &&
        !/待补|示例/.test(l)
    );
    hasLookupTable = dataRows.length >= 1;
  }
  const shell = todoRatio >= 0.25 || (hasLookupHeading && !hasLookupTable) || todoCount >= 5;
  return {
    rel: path.relative(root, abs).replace(/\\/g, "/"),
    todo_count: todoCount,
    todo_ratio: Number(todoRatio.toFixed(3)),
    has_path_lookup_heading: hasLookupHeading,
    has_path_lookup_table: hasLookupTable,
    shell,
  };
}

/**
 * Scan root AGENTS.md Never do for → Pn backlinks (warn-style findings).
 * If pitfalls.md exists, also note refs missing from ledger IDs (best-effort).
 */
export function scanNeverDoPn(root) {
  const findings = [];
  const agentsPath = path.join(root, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    return { findings: [{ level: "info", code: "no_root_agents", message: "无根 AGENTS.md" }] };
  }
  const agents = fs.readFileSync(agentsPath, "utf8");
  const neverIdx = agents.search(/^##\s+Never do\b/m);
  if (neverIdx < 0) {
    return { findings: [{ level: "info", code: "no_never_do", message: "根 AGENTS 无 ## Never do" }] };
  }
  const rest = agents.slice(neverIdx);
  const nextH2 = rest.search(/\n##\s+/);
  const block = nextH2 > 0 ? rest.slice(0, nextH2) : rest;
  const bullets = block.split(/\r?\n/).filter((l) => /^-\s+/.test(l.trim()));
  const noBacklink = bullets.filter(
    (l) => !/TODO\(harness-eng\)/.test(l) && !/→\s*P\d+/.test(l)
  );
  if (noBacklink.length) {
    findings.push({
      level: "warn",
      code: "never_do_missing_pn",
      message: `Never do 有 ${noBacklink.length} 行无「→ Pn」回链`,
      count: noBacklink.length,
    });
  }
  const refs = [...block.matchAll(/→\s*(P\d+)/g)].map((m) => m[1]);
  const pitfallsCandidates = [
    path.join(root, "docs", "agent-kb", "pitfalls.md"),
    path.join(root, "docs", "agent-kb", "pitfalls"),
  ];
  let ledgerIds = new Set();
  for (const p of pitfallsCandidates) {
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
    const t = fs.readFileSync(p, "utf8");
    for (const m of t.matchAll(/\b(P\d+)\b/g)) ledgerIds.add(m[1]);
  }
  if (ledgerIds.size && refs.length) {
    const missing = [...new Set(refs)].filter((id) => !ledgerIds.has(id));
    if (missing.length) {
      findings.push({
        level: "warn",
        code: "pn_not_in_ledger",
        message: `Never do 回链未在 pitfalls 台账出现：${missing.join(", ")}`,
        missing,
      });
    }
  } else if (refs.length && !ledgerIds.size) {
    findings.push({
      level: "info",
      code: "no_pitfalls_ledger",
      message: "有 → Pn 回链但未找到 docs/agent-kb/pitfalls.md（跳过台账对照）",
    });
  }
  return { findings, never_do_bullets: bullets.length, pn_refs: [...new Set(refs)] };
}

/**
 * @param {string} root
 * @returns {{ schema: string, root: string, modules: object[], never_do: object, summary: object }}
 */
export function scanContentShell(root) {
  const absRoot = path.resolve(root);
  const modules = walkAgentsMd(absRoot).map((abs) => analyzeModuleAgents(abs, absRoot));
  const shells = modules.filter((m) => m.shell);
  const never_do = scanNeverDoPn(absRoot);
  return {
    schema: "content-shell-scan/v1",
    root: absRoot,
    modules,
    never_do,
    summary: {
      module_agents: modules.length,
      module_shells: shells.length,
      never_do_warns: (never_do.findings || []).filter((f) => f.level === "warn").length,
    },
  };
}

export function formatContentShellSummary(report) {
  const lines = [
    `content-shell-scan: modules=${report.summary.module_agents} shells=${report.summary.module_shells} never_do_warns=${report.summary.never_do_warns}`,
  ];
  for (const m of report.modules.filter((x) => x.shell)) {
    lines.push(
      `  SHELL ${m.rel} todo=${m.todo_count} ratio=${m.todo_ratio} lookup_table=${m.has_path_lookup_table}`
    );
  }
  for (const f of report.never_do.findings || []) {
    lines.push(`  ${f.level.toUpperCase()} ${f.code}: ${f.message}`);
  }
  return lines.join("\n") + "\n";
}
