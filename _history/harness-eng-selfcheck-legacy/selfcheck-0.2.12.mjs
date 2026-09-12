#!/usr/bin/env node
/**
 * Lightweight 0.2.12 selfcheck for fill-report-html + harness-eng paths + ui.
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
assert(tmplRaw.includes("建议下一步"), "template has Chinese next-steps");
assert(tmplRaw.includes("名词解释"), "template has glossary section");

assert(fs.existsSync(path.join(skillRoot, "scripts/lib/report-ui.mjs")), "report-ui.mjs");
assert(fs.existsSync(path.join(skillRoot, "templates/docs/harness-eng/README.md")), "harness-eng README tmpl");

const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.12"/.test(manifest), "manifest 0.2.12");
assert(manifest.includes("docs/harness-eng/README.md"), "manifest has harness-eng-readme");

const questions = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(questions.includes("Q_REPORT_HTML"), "Q_REPORT_HTML present");
assert(questions.includes("docs/harness-eng/report-latest.html"), "Q_REPORT_HTML path 0.2.12");

const help = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-report-html.mjs"), "--help"], {
  encoding: "utf8",
});
assert(help.status === 0 && /Usage/.test(help.stdout || ""), "fill-report-html --help");
assert(/docs\/harness-eng\/report-latest\.html/.test(help.stdout || ""), "help mentions new default out");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
assert(fs.existsSync(fixture), "score fixture exists");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
const ui = buildReportUi(scoreObj);
assert(typeof ui.headline === "string" && ui.headline.length > 10, "ui.headline");
assert(Array.isArray(ui.glossary) && ui.glossary.length >= 5, "ui.glossary");
assert(ui.verdict && typeof ui.verdict.ready_label === "string", "ui.verdict");

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-report-"));
fs.mkdirSync(path.join(tmpRoot, ".cursor"), { recursive: true });
fs.writeFileSync(
  path.join(tmpRoot, ".cursor/harness-meta.yaml"),
  "repo_name: fixture-demo\nladder: L2\nskill_version: \"0.2.12\"\nlast_mode: pipeline\n",
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
assert(html.includes("formula_ceiling"), "HTML embeds formula_ceiling");
assert(html.includes('"overall":72') || html.includes('"overall": 72'), "HTML embeds overall");
assert(html.includes("\"ui\"") || html.includes('"ui"'), "HTML embeds ui");
assert(html.includes("headline"), "HTML embeds headline");
assert(html.includes("api") && html.includes("redis"), "HTML mentions domains");
assert(!html.includes("{{REPORT_JSON}}"), "placeholder replaced");
assert(/id="report-data">\s*\{/.test(html), "report-data script has JSON object");

const mixed = path.join(tmpRoot, "score-mixed.txt");
fs.writeFileSync(
  mixed,
  fs.readFileSync(fixture, "utf8") + "\n\n—— fill-score 摘要 ——\noverall: 72%\n",
  "utf8"
);
const mixedRun = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/fill-report-html.mjs"),
    "--root",
    tmpRoot,
    "--score",
    mixed,
    "--out",
    path.join(tmpRoot, "docs/harness-eng/from-mixed.html"),
    "--no-score-copy",
  ],
  { encoding: "utf8" }
);
assert(mixedRun.status === 0, "parses score+summary stdout");
assert(fs.existsSync(path.join(tmpRoot, "docs/harness-eng/from-mixed.html")), "mixed out written");

try {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);
