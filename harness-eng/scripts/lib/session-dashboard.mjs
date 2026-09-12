/**
 * Chat footer dashboard for harness-eng engineering turns (0.5.3+; gated 0.5.4+).
 * Mirrors report-latest.html four panels in markdown + mermaid.
 * When to SHOW/HIDE: session-dashboard.md (agent decides; --intent on session-dash.mjs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parse as parseYaml } from "./yaml.mjs";
import { buildReportUi } from "./report-ui.mjs";
import { readProgress } from "./progress-file.mjs";
import { findHarnessMetaFile } from "./harness-meta.mjs";

const SCORE_REL = "docs/harness-eng/score-latest.json";
const REPORT_REL = "docs/harness-eng/report-latest.html";
const FILL_PLAN_REL = "docs/harness-eng/fill-plan.yaml";
const HANDBOOK_REL = "使用手册.html";
const HANDBOOK_ANCHOR = "#s6";

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

  let ui = null;
  if (score) {
    try {
      ui = buildReportUi(score, { meta: meta || {} });
    } catch {
      ui = null;
    }
  }

  const aiReady = score?.ai_coding_ready?.ok;
  const verdictLabel =
    ui?.verdict?.ready_label ||
    (aiReady === true ? "建议可以开干" : aiReady === false ? "建议暂缓" : "未打分");

  const coveragePct =
    typeof score?.coverage?.percent === "number"
      ? score.coverage.percent / 100
      : typeof score?.coverage?.ratio === "number"
        ? score.coverage.ratio
        : null;

  const morphOverall =
    typeof score?.overall === "number"
      ? score.overall / 100
      : typeof score?.quality?.overall === "number"
        ? score.quality.overall / 100
        : null;

  const compositePct =
    typeof ui?.composite_score?.value === "number"
      ? ui.composite_score.value / 100
      : null;

  const blockers = score?.ai_coding_ready?.blockers || [];
  const ladder = meta?.ladder || score?.skeleton_ready?.ladder || "—";
  const domains = meta?.domains || (score?.domains ? Object.keys(score.domains) : []);
  const domainStr = Array.isArray(domains) ? domains.join(", ") || "—" : String(domains);

  let taskLine = opts.nextAction || "—";
  if (!opts.nextAction) {
    if (opts.pending) taskLine = opts.pending;
    else if (fillPlan && fillPlan.batches) {
      const batches = Object.values(fillPlan.batches);
      const open = batches.filter((b) => b && b.status !== "closed" && b.status !== "done").length;
      taskLine = open > 0 ? `fill-plan 开放 ${open} 批` : "fill-plan 已关";
    } else if (score?.next_shards?.length) {
      taskLine = `next_shards ×${score.next_shards.length}`;
    } else if (!score && meta) {
      taskLine = "建议 fill-score 或续跑补缺口";
    } else if (!meta && root) {
      taskLine = "无 meta · 建议 audit 或 land";
    }
  }

  return {
    root: root ? shortPath(root) : "—",
    sessionMode: opts.sessionMode || meta?.last_mode || "—",
    sessionPhase: opts.sessionPhase || "—",
    preauth: opts.preauth === true ? "是" : opts.preauth === false ? "否" : "—",
    decision: {
      ai_coding_ready: aiReady,
      label: verdictLabel,
      blockers: blockers.slice(0, 4),
    },
    diagnose: {
      ladder,
      domains: domainStr,
      skeleton: score?.skeleton_ready?.ok,
      semantic: score?.semantic_ready?.ok,
      gold_ratio: score?.gold_ratio,
      formula_ceiling: score?.formula_ceiling,
    },
    task: {
      line: taskLine,
      progress_updated: progress?.updated_at || null,
    },
    trend: {
      coverage: coveragePct,
      morph: morphOverall,
      composite: compositePct,
      overall: score?.overall ?? null,
    },
    reportPath: reportExists && root ? shortPath(path.join(root, REPORT_REL)) : null,
    reportExpectedRel: root ? REPORT_REL : null,
    reportExists,
    scorePath: score && root ? shortPath(path.join(root, SCORE_REL)) : null,
    handbookPath: fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_REL))
      ? shortPath(path.join(SKILL_ROOT, HANDBOOK_REL))
      : HANDBOOK_REL,
    handbookUrl: fs.existsSync(path.join(SKILL_ROOT, HANDBOOK_REL))
      ? pathToFileURL(path.join(SKILL_ROOT, HANDBOOK_REL)).href + HANDBOOK_ANCHOR
      : null,
  };
}

function renderDashboardLinkFooter(data) {
  const handbookLabel = "四台读法（使用手册.html#s6）";
  const handbookPart = data.handbookUrl
    ? `[${handbookLabel}](${data.handbookUrl})`
    : `[${handbookLabel}](${HANDBOOK_REL}${HANDBOOK_ANCHOR})`;

  if (data.reportPath && data.reportExists) {
    const reportUrl = pathToFileURL(path.resolve(data.reportPath.replace(/\//g, path.sep))).href;
    return `**详情请查询仪表盘** → [report-latest.html](${reportUrl}) · ${handbookPart}（开干只看决策台 \`ai_coding_ready\`）`;
  }

  if (data.root !== "—" && data.reportExpectedRel) {
    return `**详情请查询仪表盘** → 目标仓 \`${data.reportExpectedRel}\`（尚未生成；说「完整度打分」或跑 fill-report-html） · ${handbookPart}`;
  }

  return `**详情请查询仪表盘** → 定目标根后生成 \`${REPORT_REL}\` · ${handbookPart}`;
}

export function renderSessionDashboardMarkdown(data) {
  const lines = [];
  lines.push("---");
  lines.push("## harness-eng 会话仪表盘");
  lines.push("");
  lines.push(
    `**目标** \`${data.root}\` · **模式** ${data.sessionMode} · **阶段** ${data.sessionPhase} · **预授权** ${data.preauth}`
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
  if (typeof data.diagnose.formula_ceiling === "number" && typeof data.trend.overall === "number") {
    if (data.trend.overall >= data.diagnose.formula_ceiling - 2) diagParts.push("形态贴顶");
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
    lines.push("```mermaid");
    lines.push("quadrantChart");
    lines.push("    title 施工态势（覆盖 × 形态）");
    lines.push("    x-axis 低覆盖 --> 高覆盖");
    lines.push("    y-axis 低形态 --> 高形态");
    lines.push("    quadrant-1 补形态");
    lines.push("    quadrant-2 理想区");
    lines.push("    quadrant-3 起步");
    lines.push("    quadrant-4 补覆盖");
    lines.push(`    当前仓: [${cx / 100}, ${my / 100}]`);
    lines.push("```");
    lines.push("");
  }

  lines.push("");
  lines.push(renderDashboardLinkFooter(data));
  lines.push("---");
  return lines.join("\n");
}
