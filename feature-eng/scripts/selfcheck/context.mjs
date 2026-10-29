import fs from "fs";
import path from "path";

export const MODES = [
  "modes/init.md", "modes/rebind.md", "modes/start.md", "modes/resume.md",
  "modes/status.md", "modes/advance.md", "modes/close.md",
];
export const MODE_EXTRAS = [
  "modes/specs/flow.md", "modes/specs/gates.md", "modes/specs/bridges.md",
  "modes/specs/handoff.md", "modes/README.md",
];
export const FLAT_SPEC_LEAKS = [
  "modes/binding.md", "modes/stages.md", "modes/artifacts.md",
  "modes/gates-common.md", "modes/gates-review.md", "modes/domain-bridge.md",
  "modes/proto-bridge.md", "modes/handoff.md",
];
export const ROOT_MODE_LEAKS = [
  "init.md", "rebind.md", "start.md", "resume.md", "status.md", "advance.md", "close.md",
  "binding.md", "stages.md", "artifacts.md", "gates-common.md", "gates-review.md",
  "domain-bridge.md", "proto-bridge.md", "handoff.md",
];
export const BINDING_KEYS = [
  "grill", "design", "domain", "spec", "plan", "proto",
  "testdesign", "implement", "review", "verify", "diagnose",
];
export const TEMPLATES = [
  "templates/progress.yaml.tmpl", "templates/回链.md.tmpl",
  "templates/测试用例.md.tmpl", "templates/测试报告.md.tmpl",
  "templates/runs-README.md.tmpl", "templates/交接.md.tmpl",
  "templates/术语增量.md.tmpl", "templates/设计笔记.md.tmpl",
  "templates/审核-stage.md.tmpl", "templates/门禁清单.md.tmpl",
];

export function stageSkillMap(yamlText) {
  const map = {};
  if (!yamlText) return map;
  for (const k of BINDING_KEYS) {
    const re = new RegExp(
      `^\\s*${k}\\s*:\\s*\\{[^}]*skill:\\s*([^}\\s,]+)`,
      "m"
    );
    const m = yamlText.match(re);
    if (m) {
      map[k] = m[1].replace(/^["']|["']$/g, "");
      continue;
    }
    const blockRe = new RegExp(`^\\s*${k}\\s*:\\s*\\n\\s+skill:\\s*(\\S+)`, "m");
    const bm = yamlText.match(blockRe);
    if (bm) map[k] = bm[1].replace(/^["']|["']$/g, "");
  }
  return map;
}

export const FIX_GOOD = "scripts/fixtures/init-skeleton";
export const FIX_BAD = "scripts/fixtures/progress-bad";
export const FIX_SLUG = "2026-09-19-fixture-demo";
export const FIX_ADV = "scripts/fixtures/advance-gate";
export const ADV_SLUG = "2026-09-19-advance-gate-demo";
export const FIX_CLOSE = "scripts/fixtures/close-ready";
export const CLOSE_SLUG = "2026-09-19-close-ready-demo";
export const FIX_THEATER = "scripts/fixtures/gate-theater-bad";
export const THEATER_SLUG = "2026-09-27-gate-theater-bad";
export const FIX_L2FAIL = "scripts/fixtures/gate-l2-fail-bad";
export const L2FAIL_SLUG = "2026-09-27-gate-l2-fail-bad";
export const FIX_MID = "scripts/fixtures/midstage-l2-bad";
export const MID_SLUG = "2026-09-29-midstage-l2-bad";

export function changelogIndexed(PIN) {
  const recent = [
    PIN,
    "0.2.26",
    "0.2.25",
    "0.2.24",
    "0.2.23-dev",
    "0.2.22",
    "0.2.21",
    "0.2.20-dev",
  ];
  return [...new Set(recent)];
}

export function attachLogHelpers(ctx) {
  const { skillRoot, path, fs, noLog, strictLog, assert, read, PIN } = ctx;
  const logRoot = path.resolve(skillRoot, "..", "_log", "feature-eng");
  const logRootPresent = fs.existsSync(logRoot);

  function logFile(ver) {
    const m = String(ver).match(/^(\d+\.\d+)\./);
    const hot = m
      ? path.join(logRoot, m[1], `${ver}.md`)
      : path.join(logRoot, `${ver}.md`);
    if (fs.existsSync(hot)) return hot;
    for (const sub of ["0.2-early", "0.1"]) {
      const arch = path.join(logRoot, "_archive", sub, `${ver}.md`);
      if (fs.existsSync(arch)) return arch;
    }
    return hot;
  }
  function logExists(ver) {
    return fs.existsSync(logFile(ver));
  }
  function readLog(ver) {
    const p = logFile(ver);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8");
  }
  function collectVersionLogs(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md") && /^\d+\.\d+\.\d/.test(e.name))
      .map((e) => path.join(dir, e.name));
  }
  function listVersionLogFiles(root) {
    if (!fs.existsSync(root)) return [];
    const out = [];
    for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
      if (ent.name === "docs") continue;
      if (ent.isDirectory() && /^\d+\.\d+$/.test(ent.name)) {
        out.push(...collectVersionLogs(path.join(root, ent.name)));
      } else if (ent.isDirectory() && ent.name === "_archive") {
        const arch = path.join(root, "_archive");
        for (const sub of fs.readdirSync(arch, { withFileTypes: true })) {
          if (sub.isDirectory()) out.push(...collectVersionLogs(path.join(arch, sub.name)));
        }
      } else if (ent.isFile() && ent.name.endsWith(".md") && /^\d+\.\d+\.\d/.test(ent.name)) {
        out.push(path.join(root, ent.name));
      }
    }
    return out;
  }

  const CHANGELOG_INDEXED = changelogIndexed(PIN);
  const RETAINED_LOGS = [...CHANGELOG_INDEXED];
  const checkLogs = !noLog && (logRootPresent || strictLog);
  const logCorpusAvailable = logRootPresent && !noLog;

  if (strictLog && !logRootPresent) {
    assert(false, "_log/feature-eng missing (--strict-log)");
  } else if (!logRootPresent && !noLog) {
    console.warn(
      "warn: ../_log/feature-eng missing — skipping version-log retention (use --strict-log to fail)"
    );
  } else if (noLog) {
    console.warn("warn: --no-log — skipping _log retention and corpus keyword checks");
  }

  Object.assign(ctx, {
    logRoot, logRootPresent, logFile, logExists, readLog, listVersionLogFiles,
    CHANGELOG_INDEXED, RETAINED_LOGS, checkLogs, logCorpusAvailable,
    changelogIndex: read("CHANGELOG.md"),
    changelog: logCorpusAvailable
      ? listVersionLogFiles(logRoot).map((p) => fs.readFileSync(p, "utf8")).join("\n")
      : "",
  });
}
