/**
 * Chat footer dashboard for harness-eng this-turn engineering steps (0.5.3+; gated 0.5.4+; tightened 0.6.9).
 * 0.4.0 / 0.7.16: consume buildReportUi (go_nogo/tasks) + host_surface.
 * 0.7.16+: four-side box; 【阶段】【现状】【工作】【下一步建议】各一句；现状仅 AI coding 可否（无 mermaid）。
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

const BOX_INNER = 68;

function displayWidth(s) {
  let w = 0;
  for (const ch of [...String(s ?? "")]) {
    const code = ch.codePointAt(0) || 0;
    w += code > 0xff ? 2 : 1;
  }
  return w;
}

function padVisual(s, width) {
  const str = String(s ?? "");
  const pad = Math.max(0, width - displayWidth(str));
  return str + " ".repeat(pad);
}

function truncVisual(s, maxW) {
  const str = String(s ?? "");
  if (displayWidth(str) <= maxW) return str;
  let out = "";
  let w = 0;
  for (const ch of [...str]) {
    const cw = (ch.codePointAt(0) || 0) > 0xff ? 2 : 1;
    if (w + cw > maxW - 1) break;
    out += ch;
    w += cw;
  }
  return out + "…";
}

/** Wrap by display width (CJK≈2) so long URLs are not clipped off. */
function wrapVisual(s, maxW) {
  const str = String(s ?? "");
  if (displayWidth(str) <= maxW) return [str];
  const lines = [];
  let cur = "";
  let w = 0;
  for (const ch of [...str]) {
    const cw = (ch.codePointAt(0) || 0) > 0xff ? 2 : 1;
    if (w + cw > maxW && cur) {
      lines.push(cur);
      cur = ch;
      w = cw;
    } else {
      cur += ch;
      w += cw;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/** Four-side Unicode box; title centered on top/bottom bars. */
function frameBox(innerLines, title, footTitle) {
  const width = BOX_INNER;
  const t = truncVisual(title || "harness-eng 会话仪表盘", width - 4);
  const f = truncVisual(footTitle || "详情 · 五台读法", width - 4);
  const topPad = Math.max(0, width - displayWidth(t) - 2);
  const topLeft = Math.floor(topPad / 2);
  const topRight = topPad - topLeft;
  const botPad = Math.max(0, width - displayWidth(f) - 2);
  const botLeft = Math.floor(botPad / 2);
  const botRight = botPad - botLeft;
  const top =
    "┌" + "─".repeat(topLeft) + "◆" + t + "◆" + "─".repeat(topRight) + "┐";
  const bot =
    "└" + "─".repeat(botLeft) + "◆" + f + "◆" + "─".repeat(botRight) + "┘";
  const body = [];
  for (const line of innerLines || []) {
    for (const part of wrapVisual(line, width)) {
      body.push("│" + padVisual(part, width) + "│");
    }
  }
  return [top, ...body, bot].join("\n");
}

/** Keep each narrative section to one short sentence. */
function oneSentence(s, maxLen = 72) {
  let t = String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[;；、.\s]+|[;；、.\s]+$/g, "")
    .trim();
  if (!t) return "—";
  // drop trailing soft punctuation; ensure single clause feel
  t = t.split(/[。！？\n]/)[0].trim() || t;
  if (t.length > maxLen) t = t.slice(0, maxLen - 1) + "…";
  return t;
}

function shortPath(p) {
  if (!p) return "—";
  return String(p).replace(/\\/g, "/");
}

/**
 * Coverage × morph stance helper (thresholds 0.5).
 * Kept for diagnostics/tests; session footer no longer prints 施工态势 line.
 */
export function stanceQuadrant(coverage, morph) {
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
  const handbookLabel = "五台读法（使用手册）";
  const handbookPart = data.handbookUrl
    ? `[${handbookLabel}](${data.handbookUrl})`
    : `[${handbookLabel}](${HANDBOOK_HTML}${HANDBOOK_ANCHOR_HTML})`;

  if (data.reportPath && data.reportExists) {
    const reportUrl = pathToFileURL(
      path.resolve(data.reportPath.replace(/\//g, path.sep))
    ).href;
    return `**详情请查询仪表盘** → [report](${reportUrl}) · ${handbookPart} · 开干=\`ai_coding_ready\``;
  }

  if (data.root !== "—" && data.reportExpectedRel) {
    return `**详情请查询仪表盘** → \`${data.reportExpectedRel}\`（未生成·说「完整度打分」） · ${handbookPart}`;
  }

  return `**详情请查询仪表盘** → 定根后生成 \`${REPORT_REL}\` · ${handbookPart}`;
}

export function renderSessionDashboardMarkdown(data, opts = {}) {
  const emptyNoise =
    !data.scorePath &&
    (data.decision?.label === "未打分" || data.decision?.ai_coding_ready == null) &&
    (data.diagnose?.ladder === "—" || data.diagnose?.ladder == null) &&
    data.trend?.overall == null &&
    data.trend?.coverage == null;

  const modeBit =
    data.metaLastMode && data.metaLastMode !== data.sessionMode
      ? `**模式** ${data.sessionMode}（meta.last_mode=${data.metaLastMode}）`
      : `**模式** ${data.sessionMode}`;

  if (opts.compactEmpty !== false && emptyNoise) {
    const nextLine =
      data.task?.line && data.task.line !== "—"
        ? data.task.line
        : "说「完整度打分」或先 audit/land";
    const inner = [
      "## harness-eng 会话仪表盘（精简） · 未打分",
      `\`${data.root}\``,
      "",
      `【阶段】${modeBit} · 未打分`,
      "【现状】尚未打分，暂不能判断是否可 AI coding",
      `【工作】${oneSentence(nextLine)}`,
      `【下一步建议】${oneSentence(nextLine)}`,
      "",
      renderDashboardLinkFooter(data),
    ];
    return frameBox(inner, "会话仪表盘（精简）·未打分", "详情 · 五台读法");
  }

  const ladderRaw = data.diagnose.ladder;
  const ladderLabel =
    ladderRaw === "—" ? "—" : `L${String(ladderRaw).replace(/^L/i, "")}`;
  const phaseParts = [ladderLabel, modeBit];
  if (data.sessionPhase && data.sessionPhase !== "—") {
    phaseParts.push(data.sessionPhase);
  }
  const phaseLine = oneSentence(phaseParts.join(" · "));

  const ai = data.decision.ai_coding_ready;
  const statusLine =
    ai === true
      ? "可以 AI coding（开干 YES）"
      : ai === false
        ? "暂不可 AI coding（开干 NO）"
        : "尚未打分，暂不能判断是否可 AI coding";

  const blockers = (data.decision.blockers || []).slice(0, 2);
  let workLine = "";
  if (blockers.length) {
    workLine = `待过闸：${blockers.join("、")}`;
  } else if (data.task?.line && data.task.line !== "—") {
    workLine = data.task.line;
  } else if (ai === true) {
    workLine = "无硬 blockers，契约与代码仍须人工审";
  } else {
    workLine = "补语义闸并关闭 fill-plan 开放批次";
  }
  workLine = oneSentence(workLine);

  const cmds = Array.isArray(data.decision.next_commands)
    ? data.decision.next_commands
    : [];
  let nextLine =
    (data.task?.line && data.task.line !== "—" && data.task.line) ||
    cmds[0] ||
    (ai === true
      ? "打开 report 核对五台后写业务"
      : "fill-plan --status 后 agents 清 semantic");
  nextLine = oneSentence(nextLine);

  const inner = [
    "## harness-eng 会话仪表盘",
    `\`${data.root}\``,
    "",
    `【阶段】${phaseLine}`,
    `【现状】${statusLine}`,
    `【工作】${workLine}`,
    `【下一步建议】${nextLine}`,
    "",
    renderDashboardLinkFooter(data),
  ];

  return frameBox(inner, "harness-eng 会话仪表盘", "详情 · 五台读法");
}
