#!/usr/bin/env node
/**
 * Lightweight 0.2.15 selfcheck: QUICKSTART, progress, suggest_upgrade, render --backup.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildReportUi } from "./lib/report-ui.mjs";
import { createProgress } from "./lib/progress-log.mjs";
import { writeProgress, readProgress, PROGRESS_REL } from "./lib/progress-file.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

assert(fs.existsSync(path.join(skillRoot, "QUICKSTART.md")), "QUICKSTART.md");
const qs = fs.readFileSync(path.join(skillRoot, "QUICKSTART.md"), "utf8");
assert(/确认/.test(qs) && /SKILL\.md/.test(qs), "QUICKSTART mentions gate + SKILL");

assert(fs.existsSync(path.join(skillRoot, "scripts/lib/progress-log.mjs")), "progress-log.mjs");
assert(fs.existsSync(path.join(skillRoot, "scripts/lib/progress-file.mjs")), "progress-file.mjs");

const manifest = fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8");
assert(/version:\s*"0\.2\.15"/.test(manifest), "manifest 0.2.15");

const metaTmpl = fs.readFileSync(path.join(skillRoot, "templates/meta/harness-meta.yaml.tmpl"), "utf8");
assert(/skill_version:\s*"0\.2\.15"/.test(metaTmpl), "harness-meta skill_version 0.2.15");

const tmpl = fs.readFileSync(path.join(skillRoot, "templates/report/harness-report.html.tmpl"), "utf8");
assert(tmpl.includes('id="upgrade-line"'), "template upgrade-line");
assert(tmpl.includes("suggest_upgrade"), "template suggest_upgrade");

const scoreSrc = fs.readFileSync(path.join(skillRoot, "scripts/fill-score.mjs"), "utf8");
assert(scoreSrc.includes('"--quiet"') || scoreSrc.includes("'--quiet'"), "fill-score --quiet");
assert(scoreSrc.includes("write-progress") && scoreSrc.includes("suggest_upgrade"), "fill-score progress+upgrade");
assert(scoreSrc.includes("buildSuggestUpgrade"), "fill-score buildSuggestUpgrade");

const autoHelp = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-truths-auto.mjs"), "--help"], {
  encoding: "utf8",
});
assert(autoHelp.status === 0, "auto help exit 0");
assert(/--quiet/.test(autoHelp.stdout || ""), "auto --quiet");
assert(/write-progress/.test(autoHelp.stdout || ""), "auto --write-progress");

const invHelp = spawnSync(process.execPath, [path.join(skillRoot, "scripts/fill-inventory-api.mjs"), "--help"], {
  encoding: "utf8",
});
assert(invHelp.status === 0, "inventory-api help exit 0");
assert(/--quiet/.test(invHelp.stdout || ""), "inventory-api --quiet");

const renderSrc = fs.readFileSync(path.join(skillRoot, "scripts/render.mjs"), "utf8");
assert(renderSrc.includes('"--backup"') || renderSrc.includes("'--backup'"), "render --backup");
assert(/empty files|DEFAULT_MANIFEST|0\.2\.15/.test(renderSrc), "render default manifest");

const fixture = path.join(skillRoot, "scripts/fixtures/score-sample.json");
const scoreObj = JSON.parse(fs.readFileSync(fixture, "utf8"));
const withSuggest = {
  ...scoreObj,
  suggest_upgrade: {
    next_ladder: "L3",
    skill_patch: "0.2.15",
    reason: "ready=true；可考虑 upgrade 下一阶或精修其它域",
  },
};
const ui = buildReportUi(withSuggest);
assert(ui.version === "0.2.15", "ui.version");
assert(ui.suggest_upgrade && ui.suggest_upgrade.next_ladder === "L3", "ui.suggest_upgrade");
assert(ui.glossary.some((g) => g.id === "suggest_upgrade"), "glossary suggest_upgrade");

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-015-"));
fs.mkdirSync(path.join(tmpRoot, ".cursor"), { recursive: true });

const progFile = writeProgress(tmpRoot, {
  domain: "api",
  last_mode: "fill-score",
  last_score_overall: 72,
  notes: "selfcheck",
});
assert(progFile.includes(PROGRESS_REL.replace(/\\/g, "/")) || progFile.includes("progress.yaml"), "progress path");
const readBack = readProgress(tmpRoot);
assert(readBack && readBack.last_mode === "fill-score", "progress read");
assert(readBack.last_score_overall === 72, "progress overall");

let stderrBits = "";
const origWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, ...rest) => {
  stderrBits += String(chunk);
  return origWrite(chunk, ...rest);
};
try {
  const progress = createProgress({ quiet: false, label: "selfcheck" });
  progress.log("hello");
  progress.step(1, 2, "api");
  progress.done("ok");
  createProgress({ quiet: true, label: "q" }).log("silent");
} finally {
  process.stderr.write = origWrite;
}
assert(/\[selfcheck\] hello/.test(stderrBits), "progress-log stderr");
assert(!/silent/.test(stderrBits), "quiet suppresses");

const paramsPath = path.join(tmpRoot, "params.json");
fs.writeFileSync(
  paramsPath,
  JSON.stringify({
    ladder: "L0",
    agents_variant: "solo",
    domains: ["api", "func", "db", "redis"],
    placeholders: {
      REPO_NAME: "fixture-demo",
      REPO_DESC: "selfcheck",
      MODULE_DIRS: "app",
      MODULE_NAME: "app",
      MODULE_DIR: "app",
      GLOB_FUNC: "docs/func/**",
      GLOB_API: "docs/api/**",
      GLOB_DB: "docs/db/**",
      GLOB_REDIS: "docs/redis/**",
      CODE_PREFIXES: "com.example",
      BASE_PACKAGE: "com.example",
      LADDER_TARGET: "L0",
      DATE: "2026-08-06",
      AGENTS_VARIANT: "solo",
      GLOB_PROFILE: "default",
      DOMAINS_YAML: "- api",
      LAST_MODE: "land",
      AI_TOOLS_YAML: "- cursor",
    },
    files: [],
    default_action: "create",
    on_exists: "skip",
  }) + "\n",
  "utf8"
);

const existing = path.join(tmpRoot, "AGENTS.md");
fs.writeFileSync(existing, "# old agents\n", "utf8");

const render = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/render.mjs"),
    "--root",
    tmpRoot,
    "--params",
    paramsPath,
    "--backup",
    "--dry-run",
  ],
  { encoding: "utf8" }
);
assert(render.status === 0, "render dry-run exit 0");
let renderJson = {};
try {
  renderJson = JSON.parse(render.stdout || "{}");
} catch {
  const m = (render.stdout || "").match(/\{[\s\S]*\}\s*$/);
  if (m) {
    try {
      renderJson = JSON.parse(m[0]);
    } catch {
      /* ignore */
    }
  }
}
assert(renderJson.backup === true || /"backup":\s*true/.test(render.stdout || ""), "render backup flag");
assert(
  renderJson.expandedFromManifest === true ||
    /expandedFromManifest["']?\s*:\s*true/.test(render.stdout || "") ||
    /AGENTS/.test(render.stdout || ""),
  "render expands default manifest when files empty"
);

const scorePath = path.join(tmpRoot, "score.json");
fs.writeFileSync(scorePath, JSON.stringify(withSuggest, null, 2) + "\n", "utf8");
fs.writeFileSync(
  path.join(tmpRoot, ".cursor/harness-meta.yaml"),
  'repo_name: fixture-demo\nladder: L2\nskill_version: "0.2.15"\nlast_mode: pipeline\n',
  "utf8"
);
const reportRun = spawnSync(
  process.execPath,
  [
    path.join(skillRoot, "scripts/fill-report-html.mjs"),
    "--root",
    tmpRoot,
    "--score",
    scorePath,
    "--no-history-append",
  ],
  { encoding: "utf8" }
);
assert(reportRun.status === 0, "report html exit 0");
const html = fs.readFileSync(path.join(tmpRoot, "docs/harness-eng/report-latest.html"), "utf8");
assert(html.includes("upgrade-line") || html.includes("建议升阶"), "HTML upgrade");
assert(html.includes("L3") || html.includes("suggest_upgrade"), "HTML has suggest payload");

try {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok: ok.length, fail: fail.length, ok_msgs: ok, fail_msgs: fail }, null, 2));
process.exit(fail.length ? 1 : 0);
