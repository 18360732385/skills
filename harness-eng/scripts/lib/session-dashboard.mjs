/**
 * Chat footer dashboard for harness-eng this-turn engineering steps (0.5.3+; gated 0.5.4+; tightened 0.6.9).
 * Mirrors report-latest.html five panels in markdown (plain-text stance; no mermaid).
 * 0.4.0 / 0.7.14: consume buildReportUi (go_nogo/tasks) + host_surface line.
 * When to SHOW/HIDE: session-dashboard.md (agent decides per this turn; --intent on session-dash.mjs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse as parseYaml } from "./yaml.mjs";
import { buildReportUi } from "./report-ui.mjs";
import { buildHostSurface, formatHostSurfaceLine } from "./host-surface.mjs";
import { readProgress } from "./progress-file.mjs";
import { findHarnessMetaFile } from "./harness-meta.mjs";

const SCORE_REL = "docs/harness-eng/score-latest.json";
const REPORT_REL = "docs/harness-eng/report-latest.html";
const FILL_PLAN_REL = "docs/harness-eng/fill-plan.yaml";
const HANDBOOK_HTML = "guide/使用手册.html";
const HANDBOOK_MD = "guide/使用手册.md";
const HANDBOOK_ANCHOR_HTML = "#s6";
const HANDBOOK_ANCHOR_MD = "#60-对话内会话仪表盘工程轮末尾";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    let raw = fs.readFileSync(file, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readMeta(root) {
  const found = findHarnessMetaFile(root);
  if (!found) return null;
  try {
    const doc = parseYaml(fs.readFileSync(found.abs, "utf8"));
    if (doc && typeof doc === "object") return doc;
  } catch {
    /* ignore */
  }
  return null;
}

function readFillPlan(root) {
  const p = path.join(root, FILL_PLAN_REL);
  if (!fs.existsSync(p)) return null;
  try {
    const doc = parseYaml(fs.readFileSync(p, "utf8"));
    return doc && typeof doc === "object" ? doc : null;
  } catch {
    return null;
  }
}

function pctBar(ratio, width = 10) {
  if (ratio == null || Number.isNaN(ratio)) return "—";
  const r = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(r * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)} ${Math.round(r * 100)}%`;
}

function yesNo(ok) {
  if (ok === true) return "**YES**";
  if (ok === false) return "**NO**";
  return "—";
}

function shortPath(p) {
  if (!p) return "—";
  return String(p).replace(/\\/g, "/");
}

/** Coverage × morph stance; thresholds 0.5. No mermaid (Trae Syntax Error). */
function stanceQuadrant(coverage, morph) {
  const highC = coverage >= 0.5;
  const highM = morph >= 0.5;
  if (highC && !highM) return "Q1 补形态";
  if (highC && highM) return "Q2 理想区";
  if (!highC && !highM) return "Q3 起步";
  return "Q4 补覆盖";
}

/**
 * @param {object} opts
 * @param {string} [opts.root]
 * @param {string} [opts.sessionMode]
 * @param {string} [opts.sessionPhase]
 * @param {boolean} [opts.preauth]
 * @param {string} [opts.pending]
 * @param {string} [opts.nextAction]
 */
export function buildSessionDashboard(opts = {}) {
  const root = opts.root ? path.resolve(opts.root) : null;
  const meta = root ? readMeta(root) : null;
  const score = root ? readJson(path.join(root, SCORE_REL)) : null;
  const progress = root ? readProgress(root) : null;
  const fillPlan = root ? readFillPlan(root) : null;
  const reportExists = root ? fs.existsSync(path.join(root, REPORT_REL)) : false;

  let host_surface = null;
  if (root) {
    try {
      host_surface = buildHostSurface(root, { meta: meta || {} });
    } catch {
      host_surface = null;
    }
  }

  let ui = null;
  if (score) {
    try {
      ui = buildReportUi(score, {
        meta: meta || {},
        root: root || null,
        host_surface,
      });
    } catch {
      ui = null;
    }
  }

  const go = ui?.go_nogo || null;
  const aiReady =
    go && typeof go.ok === "boolean"
      ? go.ok
      : score?.ai_coding_ready?.ok;
  const verdictLabel =
    go?.label_zh ||
    ui?.verdict?.ready_label ||
    (aiReady === true ? "建议可以开干" : aiReady === false ? "建议暂缓" : "未打分");
  const blockers = Array.isArray(go?.blockers)
    ? go.blockers
    : score?.ai_coding_ready?.blockers || [];

  const coveragePct =
    typeof ui?.coverage_percent === "number"
      ? ui.coverage_percent / 100
      : typeof score?.coverage?.percent === "number"
        ? score.coverage.percent / 100
        : typeof score?.coverage?.ratio === "number"
          ? score.coverage.ratio
          : null;

  const morphOverall =
    typeof ui?.quality_overall === "number"
      ? ui.quality_overall / 100
      : typeof score?.overall === "number"
        ? score.overall / 100
        : typeof score?.quality?.overall === "number"
          ? score.quality.overall / 100
          : null;

  const compositePct =
    typeof ui?.composite_score?.value === "number"
      ? ui.composite_score.value / 100
      : null;

  const ladder =
    ui?.ladder_progress?.current ||
    meta?.ladder ||
    score?.skeleton_ready?.ladder ||
    "—";
  const domains =
    meta?.domains || (score?.domains ? Object.keys(score.domains) : []);
  const domainStr = Array.isArray(domains)
    ? domains.join(", ") || "—"
    : String(domains);

  let taskLine = opts.nextAction || "—";
  if (!opts.nextAction) {
    if (opts.pending) {
      taskLine = opts.pending;
    } else if (ui?.tasks?.length) {
      const t0 = ui.tasks[0];
      taskLine = t0.title || t0.cmd || "—";
    } else if (fillPlan && fillPlan.batches) {
      const batches = Object.values(fillPlan.batches);
      const open = batches.filter(
        (b) => b && b.status !== "closed" && b.status !== "done"
      ).length;
      taskLine = open > 0 ? `fill-plan 开放 ${open} 批` : "fill-plan 已关";
    } else if (score?.next_shards?.length) {
      taskLine = `next_shards ×${score.next_shards.length}`;
    } else if (!score && meta) {
      taskLine = "建议 fill-score 或续跑补缺口";
    } else if (!meta && root) {
      taskLine = "无 meta · 建议 audit 或 land";
    }
  }

  if (score?.warning_shards?.length) {
    const n = score.warning_shards.length;
    const residualBit = `residual ×${n}`;
    if (!opts.nextAction && !opts.pending) {
      taskLine =
        taskLine && taskLine !== "—"
          ? `${residualBit} · ${taskLine}`
          : residualBit;
    }
  }

  const hostLine = formatHostSurfaceLine(host_surface || ui?.host_surface);

  return {
    root: root ? shortPath(root) : "—",
    sessionMode: opts.sessionMode || "—",
    metaLastMode: meta?.last_mode || null,
    sessionPhase: opts.sessionPhase || "—",
    preauth: opts.preauth === true ? "是" : opts.preauth === false ? "否" : "—",
    decision: {
      ai_coding_ready: aiReady,
      label: verdictLabel,
      blockers: blockers.slice(0, 4),
      next_commands: Array.isArray(go?.next_commands)
        ? go.next_commands.slice(0, 3)
        : [],
    },
    diagnose: {
      ladder,
      domains: domainStr,
      skeleton: ui?.skeleton_ready ?? score?.skeleton_ready?.ok,
      semantic: ui?.semantic_ready ?? score?.semantic_ready?.ok,
      gold_ratio: ui?.gold_ratio ?? score?.gold_ratio,
      formula_ceiling: ui?.formula_ceiling ?? score?.formula_ceiling,
      story: ui?.diagnose?.story || null,
    },
    task: {
      line: taskLine,
      progress_updated: progress?.updated_at || null,
    },
    trend: {
      coverage: coveragePct,
      morph: morphOverall,
      composite: compositePct,
      overall: ui?.quality_overall ?? score?.overall ?? null,
    },
    host_surface: host_surface || ui?.host_surface || null,
    hostLine,
    reportPath: reportExists && root ? shortPath(path.join(root, REPORT_REL)) : null,
    reportExpectedRel: root ? REPORT_REL : null,
    reportExists,
    scorePath: score && root ? shortPath(path.join(root, SCORE_REL)) : null,
    handbookPath: fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_HTML))
      ? shortPath(path.join(SKILL_ROOT, HANDBOOK_HTML))
      : fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_MD))
        ? shortPath(path.join(SKILL_ROOT, HANDBOOK_MD))
        : HANDBOOK_HTML,
    handbookUrl: fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_HTML))
      ? pathToFileURL(path.join(SKILL_ROOT, HANDBOOK_HTML)).href +
        HANDBOOK_ANCHOR_HTML
      : fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_MD))
        ? pathToFileURL(path.join(SKILL_ROOT, HANDBOOK_MD)).href +
          HANDBOOK_ANCHOR_MD
        : null,
  };
}

function renderDashboardLinkFooter(data) {
  const handbookLabel = "五台读法（使用手册 · 第6章）";
  const handbookPart = data.handbookUrl
    ? `[${handbookLabel}](${data.handbookUrl})`
    : `[${handbookLabel}](${HANDBOOK_HTML}${HANDBOOK_ANCHOR_HTML})`;

  if (data.reportPath && data.reportExists) {
    const reportUrl = pathToFileURL(
      path.resolve(data.reportPath.replace(/\//g, path.sep))
    ).href;
    return `**详情请查询仪表盘** → [report-latest.html](${reportUrl}) · ${handbookPart}（开干只看决策台 \`ai_coding_ready\`）`;
  }

  if (data.root !== "—" && data.reportExpectedRel) {
    return `**详情请查询仪表盘** → 目标仓 \`${data.reportExpectedRel}\`（尚未生成；说「完整度打分」或跑 fill-report-html） · ${handbookPart}`;
  }

  return `**详情请查询仪表盘** → 定目标根后生成 \`${REPORT_REL}\` · ${handbookPart}`;
}

export function renderSessionDashboardMarkdown(data, opts = {}) {
  const emptyNoise =
    !data.scorePath &&
    (data.decision?.label === "未打分" || data.decision?.ai_coding_ready == null) &&
    (data.diagnose?.ladder === "—" || data.diagnose?.ladder == null) &&
    data.trend?.overall == null &&
    data.trend?.coverage == null;
  if (opts.compactEmpty !== false && emptyNoise) {
    const modeBit =
      data.metaLastMode && data.metaLastMode !== data.sessionMode
        ? `**模式** ${data.sessionMode}（meta.last_mode=${data.metaLastMode}）`
        : `**模式** ${data.sessionMode}`;
    const nextLine =
      data.task?.line && data.task.line !== "—"
        ? `下一动作：${data.task.line}`
        : "下一动作：说「完整度打分」或先 audit/land";
    const compact = [
      "---",
      "## harness-eng 会话仪表盘（精简） · 未打分",
      "",
      `**目标** \`${data.root}\` · ${modeBit} · **阶段** ${data.sessionPhase} · **预授权** ${data.preauth}`,
      "",
      nextLine,
      "",
    ];
    if (data.hostLine) {
      compact.push(data.hostLine);
      compact.push("");
    }
    compact.push(renderDashboardLinkFooter(data));
    compact.push("---");
    return compact.join("\n");
  }
  const lines = [];
  lines.push("---");
  lines.push("## harness-eng 会话仪表盘");
  lines.push("");
  lines.push(
    `**目标** \`${data.root}\` · **模式** ${data.sessionMode}${
      data.metaLastMode && data.metaLastMode !== data.sessionMode
        ? `（meta.last_mode=${data.metaLastMode}）`
        : ""
    } · **阶段** ${data.sessionPhase} · **预授权** ${data.preauth}`
  );
  lines.push("");
  lines.push("| 台 | 读数 |");
  lines.push("|:---|:---|");
  lines.push(
    `| **决策台** | 开干 ${yesNo(data.decision.ai_coding_ready)} · ${data.decision.label}${
      data.decision.blockers.length
        ? ` · blockers: ${data.decision.blockers.join(", ")}`
        : ""
    } |`
  );

  const ladderRaw = data.diagnose.ladder;
  const diagParts = [
    ladderRaw === "—" ? "—" : `L${String(ladderRaw).replace(/^L/i, "")}`,
  ];
  if (data.diagnose.skeleton === true) diagParts.push("骨架就绪");
  else if (data.diagnose.skeleton === false) diagParts.push("骨架未齐");
  if (data.diagnose.semantic === true) diagParts.push("语义关");
  else if (data.diagnose.semantic === false) diagParts.push("语义未关");
  if (typeof data.diagnose.gold_ratio === "number") {
    diagParts.push(`金标 ${Math.round(data.diagnose.gold_ratio * 100)}%`);
  }
  if (
    typeof data.diagnose.formula_ceiling === "number" &&
    typeof data.trend.overall === "number"
  ) {
    if (data.trend.overall >= data.diagnose.formula_ceiling - 2) {
      diagParts.push("形态贴顶");
    }
  }
  lines.push(`| **诊断台** | ${diagParts.join(" · ")} · 域 ${data.diagnose.domains} |`);

  lines.push(`| **任务台** | ${data.task.line} |`);

  const trendParts = [];
  if (data.trend.coverage != null) trendParts.push(`覆盖 ${pctBar(data.trend.coverage)}`);
  if (data.trend.morph != null) trendParts.push(`形态 ${pctBar(data.trend.morph)}`);
  if (data.trend.composite != null) {
    trendParts.push(`参考分 ${pctBar(data.trend.composite)}（≠开干）`);
  } else if (data.trend.overall == null) {
    trendParts.push("暂无 score");
  }
  lines.push(`| **趋势台** | ${trendParts.join(" · ") || "—"} |`);
  lines.push("");

  if (data.trend.coverage != null && data.trend.morph != null) {
    const cx = Math.round(data.trend.coverage * 100);
    const my = Math.round(data.trend.morph * 100);
    const q = stanceQuadrant(data.trend.coverage, data.trend.morph);
    lines.push(`施工态势：覆盖 ${cx}% × 形态 ${my}%（${q}）`);
    lines.push("");
  }

  if (data.hostLine) {
    lines.push(data.hostLine);
    lines.push("");
  }

  lines.push(renderDashboardLinkFooter(data));
  lines.push("---");
  return lines.join("\n");
}
