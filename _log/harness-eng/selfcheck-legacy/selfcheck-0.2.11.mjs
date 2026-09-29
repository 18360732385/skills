#!/usr/bin/env node
/**
 * Lightweight 0.2.11 selfcheck for fill-report-html.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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
assert(fs.readFileSync(tmpl, "utf8").includes("{{REPORT_JSON}}"), "template has REPORT_JSON");

const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.11"/.test(manifest), "manifest 0.2.11");

const questions = fs.readFileSync(path.join(skillRoot, "questions.yaml"), "utf8");
assert(questions.includes("Q_REPORT_HTML"), "Q_REPORT_HTML present");

const help = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-report-html.mjs"), "--help"], {
  encoding: "utf8",
});
assert(help.status === 0 && /Usage/.test(help.stdout || ""), "fill-report-html --help");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
assert(fs.existsSync(fixture), "score fixture exists");

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-report-"));
fs.mkdirSync(path.join(tmpRoot, "docs/agent-kb"), { recursive: true });
fs.mkdirSync(path.join(tmpRoot, ".cursor"), { recursive: true });
fs.writeFileSync(
  path.join(tmpRoot, ".cursor/harness-meta.yaml"),
  "repo_name: fixture-demo\nladder: L2\nskill_version: \"0.2.11\"\nlast_mode: pipeline\n",
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
assert(/harness-report-latest\.html/.test(dry.stdout || ""), "dry-run mentions default out");

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
const outHtml = path.join(tmpRoot, "docs/agent-kb/harness-report-latest.html");
assert(fs.existsSync(outHtml), "HTML written");
const html = fs.readFileSync(outHtml, "utf8");
assert(html.includes("formula_ceiling"), "HTML embeds formula_ceiling");
assert(html.includes('"overall":72') || html.includes('"overall": 72'), "HTML embeds overall");
assert(html.includes("ready"), "HTML mentions ready");
assert(html.includes("api") && html.includes("redis"), "HTML mentions domains");
assert(!html.includes("{{REPORT_JSON}}"), "placeholder replaced");
assert(/id="report-data">\s*\{/.test(html), "report-data script has JSON object");

// score with trailing Chinese summary (like fill-score stdout)
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
    path.join(tmpRoot, "docs/agent-kb/from-mixed.html"),
  ],
  { encoding: "utf8" }
);
assert(mixedRun.status === 0, "parses score+summary stdout");
assert(fs.existsSync(path.join(tmpRoot, "docs/agent-kb/from-mixed.html")), "mixed out written");

try {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);
