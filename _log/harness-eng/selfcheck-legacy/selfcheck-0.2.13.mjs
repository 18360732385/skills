#!/usr/bin/env node
/**
 * Lightweight 0.2.13 selfcheck for Report Dashboard v2.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildReportUi } from "./lib/report-ui.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

const tmpl = path.join(skillRoot, "templates/report/harness-report.html.tmpl");
assert(fs.existsSync(tmpl), "template exists");
const tmplRaw = fs.readFileSync(tmpl, "utf8");
assert(tmplRaw.includes("{{REPORT_JSON}}"), "template has REPORT_JSON");
assert(tmplRaw.includes('id="sec-decision"'), "template has sec-decision");
assert(tmplRaw.includes('id="sec-diagnose"'), "template has sec-diagnose");
assert(tmplRaw.includes('id="sec-tasks"'), "template has sec-tasks");
assert(tmplRaw.includes('id="sec-tech"'), "template has sec-tech");
assert(tmplRaw.includes("施工指挥台") || tmplRaw.includes("决策台"), "template Chinese decision");
assert(tmplRaw.includes("chart-domains"), "template chart-domains");
assert(!tmplRaw.includes("\u0000"), "template no null bytes");

assert(fs.existsSync(path.join(skillRoot, "scripts/lib/report-ui.mjs")), "report-ui.mjs");
assert(fs.existsSync(path.join(skillRoot, "templates/docs/harness-eng/README.md")), "harness-eng README tmpl");

const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.13"/.test(manifest), "manifest 0.2.13");

const questions = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(questions.includes("Q_REPORT_HTML"), "Q_REPORT_HTML present");
assert(questions.includes("docs/harness-eng/report-latest.html"), "Q_REPORT_HTML path");

const help = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-report-html.mjs"), "--help"], {
  encoding: "utf8",
});
assert(help.status === 0 && /Usage/.test(help.stdout || ""), "fill-report-html --help");
assert(/Dashboard v2|gap_to_ready|ui fields/i.test(help.stdout || ""), "help mentions Dashboard v2 fields");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
assert(fs.existsSync(fixture), "score fixture exists");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
const ui = buildReportUi(scoreObj);
assert(ui.version === "0.2.13", "ui.version 0.2.13");
assert(typeof ui.headline === "string" && ui.headline.length > 10, "ui.headline");
assert(ui.gap_to_ready && typeof ui.gap_to_ready.summary === "string", "ui.gap_to_ready");
assert(Array.isArray(ui.domain_stories) && ui.domain_stories.length >= 1, "ui.domain_stories");
assert(Array.isArray(ui.miss_top) && ui.miss_top.length >= 1, "ui.miss_top");
assert(Array.isArray(ui.gaps_top) && ui.gaps_top.length >= 1, "ui.gaps_top");
assert(ui.chart_domains && Array.isArray(ui.chart_domains.labels), "ui.chart_domains");
assert(Array.isArray(ui.next_actions) && ui.next_actions.length >= 1, "ui.next_actions");
assert(ui.next_actions.some((a) => a.command), "next_actions has command");
assert(Array.isArray(ui.shards) && ui.shards.length >= 1, "ui.shards from fixture");
assert(ui.shards.every((s) => s.command), "shards have command");
assert(ui.lagging_domain && ui.lagging_domain.id, "ui.lagging_domain");
assert(Array.isArray(ui.glossary) && ui.glossary.length >= 5, "ui.glossary");
assert(ui.verdict && typeof ui.verdict.ready_label === "string", "ui.verdict");

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-report-"));
fs.mkdirSync(path.join(tmpRoot, ".cursor"), { recursive: true });
fs.writeFileSync(
  path.join(tmpRoot, ".cursor/harness-meta.yaml"),
  'repo_name: fixture-demo\nladder: L2\nskill_version: "0.2.13"\nlast_mode: pipeline\n',
  "utf8"
);

const dry = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/fill-report-html.mjs"),
    "--root",
    tmpRoot,
    "--score",
    fixture,
    "--mode",
    "pipeline",
    "--dry-run",
  ],
  { encoding: "utf8" }
);
assert(dry.status === 0, "dry-run exit 0");
assert(/docs\/harness-eng\/report-latest\.html/.test(dry.stdout || ""), "dry-run mentions default out");
assert(/"ui_version":\s*"0\.2\.13"/.test(dry.stdout || "") || /ui_version/.test(dry.stdout || ""), "dry-run ui_version");

const run = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/fill-report-html.mjs"),
    "--root",
    tmpRoot,
    "--score",
    fixture,
    "--mode",
    "pipeline",
  ],
  { encoding: "utf8" }
);
assert(run.status === 0, "write exit 0");
const outHtml = path.join(tmpRoot, "docs/harness-eng/report-latest.html");
const outScore = path.join(tmpRoot, "docs/harness-eng/score-latest.json");
const outReadme = path.join(tmpRoot, "docs/harness-eng/README.md");
assert(fs.existsSync(outHtml), "HTML written");
assert(fs.existsSync(outScore), "score-latest written");
assert(fs.existsSync(outReadme), "harness-eng README seeded");
const html = fs.readFileSync(outHtml, "utf8");
assert(!html.includes("\u0000"), "HTML no null bytes");
assert(html.includes("formula_ceiling"), "HTML embeds formula_ceiling");
assert(html.includes('"overall":72') || html.includes('"overall": 72'), "HTML embeds overall");
assert(html.includes('"ui"') || html.includes('"ui"'), "HTML embeds ui");
assert(html.includes("gap_to_ready"), "HTML embeds gap_to_ready");
assert(html.includes("domain_stories"), "HTML embeds domain_stories");
assert(html.includes("miss_top"), "HTML embeds miss_top");
assert(html.includes("sec-decision"), "HTML has sec-decision markup");
assert(html.includes("sec-diagnose"), "HTML has sec-diagnose markup");
assert(html.includes("sec-tasks"), "HTML has sec-tasks markup");
assert(html.includes("fill-truths-auto"), "HTML has executable merge hint");
assert(!html.includes("{{REPORT_JSON}}"), "placeholder replaced");
assert(/id="report-data">\s*\{/.test(html), "report-data script has JSON object");

try {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);