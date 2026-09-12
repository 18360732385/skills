#!/usr/bin/env node
/**
 * fill-report-html — render self-contained HTML dashboard (v2 / 0.2.14+) from fill-score JSON.
 *
 * Usage:
 *   node scripts/fill-report-html.mjs --root <TARGET> --score <score.json|->
 *       [--meta <harness-meta.yaml>] [--run <run.json>] [--out path]
 *       [--mode pipeline] [--history] [--dry-run] [--no-score-copy]
 *       [--no-history-append] [--history-limit N]
 *
 * Default --out: docs/harness-eng/report-latest.html
 * Also writes docs/harness-eng/score-latest.json (unless --no-score-copy)
 * Appends docs/harness-eng/score-history.jsonl (unless --no-history-append / dry-run)
 * Dashboard: 决策 / 诊断 / 任务 / 趋势台（ui via report-ui.mjs）
 * Legacy: docs/agent-kb/harness-report-latest.html still readable by agents; new writes go to harness-eng/
 * Does not invent credentials. Write still requires Agent confirmation / preauth.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "./lib/yaml.mjs";
import { buildReportUi } from "./lib/report-ui.mjs";
import { HARNESS_META_READ_CANDIDATES } from "./lib/harness-meta.mjs";
import {
  appendScoreHistory,
  buildTrendSeries,
  makeHistoryEntry,
  readScoreHistory,
  HISTORY_REL,
  DEFAULT_LIMIT,
} from "./lib/score-history.mjs";
import { ensureRunWithRound, loadRunLatest } from "./lib/run-latest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const TMPL = path.join(SKILL_ROOT, "templates/report/harness-report.html.tmpl");

const DEFAULT_REPORT_REL = "docs/harness-eng/report-latest.html";
const DEFAULT_SCORE_REL = "docs/harness-eng/score-latest.json";
const LEGACY_REPORT_REL = "docs/agent-kb/harness-report-latest.html";

function parseArgs(argv) {
  const out = {
    root: null,
    score: null,
    meta: null,
    run: null,
    out: null,
    mode: null,
    history: false,
    dryRun: false,
    noScoreCopy: false,
    noHistoryAppend: false,
    historyLimit: DEFAULT_LIMIT,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--score") out.score = argv[++i];
    else if (a === "--meta") out.meta = argv[++i];
    else if (a === "--run") out.run = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--mode") out.mode = argv[++i];
    else if (a === "--history") out.history = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--no-score-copy") out.noScoreCopy = true;
    else if (a === "--no-history-append") out.noHistoryAppend = true;
    else if (a === "--history-limit") out.historyLimit = Number(argv[++i]) || DEFAULT_LIMIT;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function usage() {
  console.log(`Usage:
  node scripts/fill-report-html.mjs --root <TARGET> --score <score.json|->
      [--meta path] [--run run.json] [--out path] [--mode pipeline]
      [--history] [--dry-run] [--no-score-copy]
      [--no-history-append] [--history-limit N]

Injects fill-score JSON (+ ui Dashboard v2 投影 + optional meta/run) into
templates/report/harness-report.html.tmpl → docs/harness-eng/report-latest.html

Also writes docs/harness-eng/score-latest.json (UTF-8) unless --no-score-copy.
Appends ${HISTORY_REL} unless --no-history-append or --dry-run.
--history → docs/harness-eng/history/report-<timestamp>.html

ui fields (0.2.24+): composite_score, pipeline_progress, decision_kpis, morph_strip,
show_domain_cards, gap_to_ready, domain_stories, miss_top, gaps_top,
chart_domains, next_actions[].command, shards[].command,
diff, trend, run_timeline

Legacy path docs/agent-kb/harness-report-latest.html is no longer the default.
--score -   read JSON from stdin (prefer UTF-8 no-BOM file on Windows)
`);
}

function readScore(spec) {
  if (!spec) throw new Error("--score is required (file path or - for stdin)");
  let raw;
  if (spec === "-") {
    raw = fs.readFileSync(0, "utf8");
  } else {
    const abs = path.resolve(spec);
    if (!fs.existsSync(abs)) throw new Error(`score file not found: ${abs}`);
    raw = fs.readFileSync(abs, "utf8");
  }
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  raw = raw.trim();
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("score input has no JSON object");
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("score JSON is incomplete");
  return { json: JSON.parse(raw.slice(start, end + 1)), scorePath: spec === "-" ? null : path.resolve(spec) };
}

function loadMeta(root, metaArg) {
  const candidates = [];
  if (metaArg) candidates.push(path.resolve(metaArg));
  for (const rel of HARNESS_META_READ_CANDIDATES) {
    candidates.push(path.join(root, ...rel.split("/")));
  }
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const doc = parseYaml(fs.readFileSync(p, "utf8"));
      if (doc && typeof doc === "object") {
        return {
          path: p,
          repo_name: doc.repo_name || doc.name || null,
          ladder: doc.ladder || null,
          skill_version: doc.skill_version || null,
          last_mode: doc.last_mode || null,
          domains: doc.domains || null,
          glob_profile: doc.glob_profile || null,
        };
      }
    } catch {
      /* ignore */
    }
  }
  return {};
}

function loadRun(runArg) {
  if (!runArg) return null;
  const abs = path.resolve(runArg);
  if (!fs.existsSync(abs)) throw new Error(`run file not found: ${abs}`);
  let raw = fs.readFileSync(abs, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

/** 0.2.29+: synthesize score.diff from history when --compare was not used. */
function ensureDiffFromHistory(score, prior) {
  if (score?.diff && typeof score.diff.overall === "number") return score;
  if (!Array.isArray(prior) || prior.length < 1) return score;
  const last = prior[prior.length - 1];
  if (typeof last?.overall !== "number" || typeof score?.overall !== "number") {
    return score;
  }
  const diff = {
    overall: Math.round((score.overall - last.overall) * 10) / 10,
    source: "history",
  };
  if (
    typeof score.coverage?.percent === "number" &&
    typeof last.coverage_percent === "number"
  ) {
    diff.coverage_percent = score.coverage.percent - last.coverage_percent;
  }
  return { ...score, diff };
}

function inject(tmpl, payload) {
  const json = JSON.stringify(payload);
  const safe = json.replace(/</g, "\\u003c");
  if (!tmpl.includes("{{REPORT_JSON}}")) {
    throw new Error("template missing {{REPORT_JSON}} placeholder");
  }
  return tmpl.replace("{{REPORT_JSON}}", safe);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function ensureHarnessEngReadme(root) {
  const dir = path.join(root, "docs/harness-eng");
  const readme = path.join(dir, "README.md");
  if (fs.existsSync(readme)) return;
  ensureDir(dir);
  const src = path.join(SKILL_ROOT, "templates/docs/harness-eng/README.md");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, readme);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    process.exit(0);
  }
  if (!args.root) {
    usage();
    console.error("error: --root is required");
    process.exit(1);
  }
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) {
    console.error(`error: root not found: ${root}`);
    process.exit(1);
  }
  if (!fs.existsSync(TMPL)) {
    console.error(`error: template missing: ${TMPL}`);
    process.exit(1);
  }

  const { json: score, scorePath } = readScore(args.score);
  const meta = loadMeta(root, args.meta);
  if (!meta.repo_name) {
    meta.repo_name = path.basename(root);
  }
  let run = null;
  try {
    run = loadRun(args.run);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
  // 0.2.29: default-load run-latest.json; ensure round non-null
  if (!run) run = loadRunLatest(root);
  if (!args.dryRun) {
    run = ensureRunWithRound(root, run, {
      persist: true,
      note: run?.note || "fill-report-html",
    });
  } else if (!run || run.round == null) {
    run = ensureRunWithRound(root, run, { persist: false, note: "dry-run" });
  }

  const skillManifest = path.join(SKILL_ROOT, "templates/_meta/manifest.yaml");
  let skillVersion = null;
  if (fs.existsSync(skillManifest)) {
    try {
      const m = parseYaml(fs.readFileSync(skillManifest, "utf8"));
      skillVersion = m?.version || null;
    } catch {
      /* ignore */
    }
  }

  const prior = readScoreHistory(root, args.historyLimit);
  const scoreForUi = ensureDiffFromHistory(score, prior);
  const mode = args.mode || meta.last_mode || null;
  const entry = makeHistoryEntry(scoreForUi, {
    mode,
    run,
    at: new Date().toISOString(),
  });
  const history_series = buildTrendSeries(prior, entry, args.historyLimit);
  const ui = buildReportUi(scoreForUi, { history_series, run });
  const reportDirRel = "docs/harness-eng";
  const payload = {
    generated_at: entry.at,
    skill_version: skillVersion,
    mode,
    score_path: scorePath,
    report_dir: reportDirRel,
    legacy_report: LEGACY_REPORT_REL,
    history_rel: HISTORY_REL,
    meta,
    ui,
    score: scoreForUi,
    run,
  };

  const tmpl = fs.readFileSync(TMPL, "utf8");
  const html = inject(tmpl, payload);
  const defaultOut = path.join(root, DEFAULT_REPORT_REL);
  const outPath = path.resolve(args.out || defaultOut);
  const scoreOut = path.join(root, DEFAULT_SCORE_REL);

  const result = {
    ok: true,
    root,
    out: outPath.replace(/\\/g, "/"),
    score_out: args.noScoreCopy ? null : scoreOut.replace(/\\/g, "/"),
    history_jsonl: null,
    bytes: Buffer.byteLength(html, "utf8"),
    dry_run: args.dryRun,
    history: null,
    overall: scoreForUi.overall ?? null,
    ready: scoreForUi.ready?.ok ?? null,
    formula_ceiling: scoreForUi.formula_ceiling ?? null,
    headline: ui.headline,
    ui_version: ui.version || null,
    lagging_domain: ui.lagging_domain?.id || null,
    gap_summary: ui.gap_to_ready?.summary || null,
    trend_summary: ui.trend?.summary || null,
    diff_summary: ui.diff?.summary || null,
    legacy_note: `旧路径 ${LEGACY_REPORT_REL} 仍可读；新默认 ${DEFAULT_REPORT_REL}`,
  };

  if (args.dryRun) {
    console.log(JSON.stringify(result, null, 2));
    console.log("");
    console.log(`—— fill-report-html dry-run ——`);
    console.log(`would write ${result.out} (${result.bytes} bytes)`);
    if (result.score_out) console.log(`would write ${result.score_out}`);
    if (!args.noHistoryAppend) console.log(`would append ${HISTORY_REL}`);
    process.exit(0);
  }

  ensureDir(path.dirname(outPath));
  ensureHarnessEngReadme(root);
  fs.writeFileSync(outPath, html, "utf8");

  if (!args.noScoreCopy) {
    ensureDir(path.dirname(scoreOut));
    fs.writeFileSync(scoreOut, JSON.stringify(scoreForUi, null, 2) + "\n", "utf8");
  }

  if (!args.noHistoryAppend) {
    result.history_jsonl = appendScoreHistory(root, entry);
  }

  if (args.history) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const histDir = path.join(root, "docs/harness-eng/history");
    ensureDir(histDir);
    const hist = path.join(histDir, `report-${stamp}.html`);
    fs.writeFileSync(hist, html, "utf8");
    result.history = hist.replace(/\\/g, "/");
  }

  console.log(JSON.stringify(result, null, 2));
  console.log("");
  console.log("—— fill-report-html ——");
  console.log(`wrote: ${result.out}`);
  if (result.score_out) console.log(`score: ${result.score_out}`);
  if (result.history_jsonl) console.log(`history-jsonl: ${result.history_jsonl}`);
  if (result.history) console.log(`history: ${result.history}`);
  console.log(
    `overall: ${result.overall}%  ready: ${result.ready ? "YES" : "NO"}  formula_ceiling: ~${result.formula_ceiling}%`
  );
  if (ui.headline) console.log(`摘要: ${ui.headline}`);
  if (ui.lagging_domain?.story) {
    console.log(`拖后腿: ${ui.lagging_domain.name_zh || ui.lagging_domain.id} — ${ui.lagging_domain.story}`);
  }
  if (ui.gap_to_ready?.summary) console.log(`距门槛: ${ui.gap_to_ready.summary}`);
  if (ui.diff?.summary) console.log(`相对上次: ${ui.diff.summary}`);
  if (ui.trend?.summary) console.log(`趋势: ${ui.trend.summary}`);
  console.log("请将报告路径回复给用户，并用浏览器或 IDE 打开查看（决策/诊断/任务/趋势台）。");
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
