#!/usr/bin/env node
/**
 * Codex Stop soft checklist — fail-open observation only.
 * Aligns with stop-delivery-checklist.js.tmpl (stderr reminders; never block).
 * Codex stdout must stay `{}` (adapter / Stop contract).
 *
 * 渲染占位：DB_MIGRATION_DIR、MIGRATION_ENVS（空串=关闭）、CODE_PREFIXES。
 */
const { execSync } = require("child_process");

const MIGRATION_PREFIX = "";
const MIGRATION_ENVS = "";

const CODE_PREFIXES = ""
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        process.stdin.pause();
      } catch {
        /* ignore */
      }
      resolve(Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, ""));
    };
    const timer = setTimeout(done, 2000);
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c, "utf8")));
    process.stdin.on("end", done);
    process.stdin.on("error", done);
  });
}

function outEmpty() {
  process.stdout.write("{}");
  process.exit(0);
}

function git(cmd, cwd) {
  return execSync(cmd, {
    encoding: "utf8",
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000,
    windowsHide: true,
  });
}

(async () => {
  try {
    await readStdin();

    let root;
    try {
      root = git("git rev-parse --show-toplevel", process.cwd()).trim();
    } catch {
      outEmpty();
    }

    let status;
    try {
      status = git("git status --porcelain", root);
    } catch {
      outEmpty();
    }
    const files = status
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => l.slice(3).trim().replace(/\\/g, "/"))
      .filter(Boolean);
    if (files.length === 0) outEmpty();

    const lines = [];
    const migrations = files.filter(
      (f) => MIGRATION_PREFIX && f.startsWith(MIGRATION_PREFIX) && f.endsWith(".sql")
    );
    if (MIGRATION_ENVS && migrations.length) {
      lines.push(
        `未提交的 migration：${migrations.join("、")} —— 交付前人工同步到 ${MIGRATION_ENVS}，勿只合代码`
      );
    }
    const plansUntracked = files.filter((f) => f.startsWith("docs/superpowers/plans/"));
    const indexTouched = files.some(
      (f) =>
        f === "docs/superpowers/README.md" ||
        f === "docs/superpowers/ARCHIVE.md" ||
        f.startsWith("docs/superpowers/archive/")
    );
    if (plansUntracked.length && !indexTouched) {
      lines.push("superpowers 有未收口 plan：交付时须徽章 + git mv archive + 写入 ARCHIVE（rule 18）");
    }

    const prefixes =
      CODE_PREFIXES.length > 0
        ? CODE_PREFIXES
        : ["src/", "backend/", "frontend/", "apps/", "packages/"];
    const codeChanged = files.some((f) => prefixes.some((p) => f.startsWith(p)));
    if (codeChanged) {
      lines.push("业务代码有改动：按 agent-kb 三问自检 pitfalls 回流；核对契约同步");
    }

    if (lines.length) {
      const msg = [
        "【交付收口清单（Codex Stop·观察向·不阻断）】",
        ...lines.map((l) => `- ${l}`),
        "- 未获用户明确确认前，不要 git commit / push",
      ].join("\n");
      try {
        process.stderr.write(msg + "\n");
      } catch {
        /* ignore */
      }
    }
    outEmpty();
  } catch {
    outEmpty();
  }
})();
