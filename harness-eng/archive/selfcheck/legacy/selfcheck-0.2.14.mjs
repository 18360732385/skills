#!/usr/bin/env node
/**
 * Lightweight 0.2.14 selfcheck: score-history + trend / diff / run_timeline.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildReportUi } from "./lib/report-ui.mjs";
import {
  appendScoreHistory,
  buildTrendSeries,
  makeHistoryEntry,
  readScoreHistory,
  HISTORY_REL,
} from "./lib/score-history.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

assert(fs.existsSync(path.join(skillRoot, "scripts/lib/score-history.mjs")), "score-history.mjs");

const tmpl = path.join(skillRoot, "templates/report/harness-report.html.tmpl");
const tmplRaw = fs.readFileSync(tmpl, "utf8");
assert(tmplRaw.includes('id="sec-trend"'), "template sec-trend");
assert(tmplRaw.includes("chart-trend"), "template chart-trend");
assert(tmplRaw.includes("trendLines") || tmplRaw.includes("chart-trend"), "template trend render");

const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.14"/.test(manifest), "manifest 0.2.14");

const help = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-report-html.mjs"), "--help"], {
  encoding: "utf8",
});
assert(help.status === 0, "help exit 0");
assert(/score-history|history-limit|no-history-append|trend/i.test(help.stdout || ""), "help mentions history");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
const entry = makeHistoryEntry(scoreObj, { mode: "pipeline", run: { round: 1, written: 3, merged: 2, unchanged: 1 } });
assert(entry.overall === 72, "history entry overall");
const series = buildTrendSeries(
  [{ at: "2026-08-01T00:00:00.000Z", overall: 70, coverage_percent: 75, ready: false }],
  entry,
  20
);
assert(series.labels.length === 2, "trend series 2 pts");
const ui = buildReportUi(scoreObj, {
  history_series: series,
  run: { round: 2, written: 1, merged: 4, unchanged: 10, note: "early-stop" },
});
assert(ui.version === "0.2.14", "ui.version");
assert(ui.diff && /overall/.test(ui.diff.summary), "ui.diff");
assert(ui.trend && ui.trend.count >= 2, "ui.trend");
assert(Array.isArray(ui.run_timeline) && ui.run_timeline.length >= 3, "ui.run_timeline");

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-hist-"));
fs.mkdirSync(path.join(tmpRoot, ".cursor"), { recursive: true });
fs.writeFileSync(
  path.join(tmpRoot, ".cursor/harness-meta.yaml"),
  'repo_name: fixture-demo\nladder: L2\nskill_version: "0.2.14"\nlast_mode: pipeline\n',
  "utf8"
);
const runPath = path.join(tmpRoot, "run.json");
fs.writeFileSync(runPath, JSON.stringify({ round: 1, written: 5, merged: 2, unchanged: 0 }) + "\n", "utf8");

const script = path.join(skillRoot, "scripts/fill-report-html.mjs");
const run1 = spawnSync(
  process.execPath,
  [script, "--root", tmpRoot, "--score", fixture, "--mode", "pipeline", "--run", runPath],
  { encoding: "utf8" }
);
assert(run1.status === 0, "write1 exit 0");
const histFile = path.join(tmpRoot, HISTORY_REL);
assert(fs.existsSync(histFile), "jsonl created");
assert(readScoreHistory(tmpRoot).length === 1, "jsonl 1 line");

const score2 = { ...scoreObj, overall: 74, diff: { overall: 2, api: 1 } };
const score2Path = path.join(tmpRoot, "score2.json");
fs.writeFileSync(score2Path, JSON.stringify(score2, null, 2) + "\n", "utf8");
const run2 = spawnSync(
  process.execPath,
  [script, "--root", tmpRoot, "--score", score2Path, "--mode", "pipeline", "--run", runPath],
  { encoding: "utf8" }
);
assert(run2.status === 0, "write2 exit 0");
assert(readScoreHistory(tmpRoot).length === 2, "jsonl 2 lines");

const html = fs.readFileSync(path.join(tmpRoot, "docs/harness-eng/report-latest.html"), "utf8");
assert(html.includes("sec-trend"), "HTML sec-trend");
assert(html.includes("trend") && html.includes("overall"), "HTML embeds trend");
assert(html.includes("score-history") || html.includes("history_rel") || html.includes('"trend"'), "HTML trend payload");
assert(/相对上次 overall \+2/.test(html) || html.includes('"diff"'), "HTML has diff");

const dry = spawnSync(
  process.execPath,
  [script, "--root", tmpRoot, "--score", fixture, "--dry-run"],
  { encoding: "utf8" }
);
assert(dry.status === 0 && /would append/.test(dry.stdout || ""), "dry-run mentions append");

try {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);