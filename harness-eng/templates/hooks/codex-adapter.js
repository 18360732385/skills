#!/usr/bin/env node
/**
 * Codex hook adapter (harness-eng).
 *
 * Usage: node codex-adapter.js <mode> <script>
 * Modes:
 *   commit-gate  — PreToolUse Bash → spawn sibling script with --codex
 *   stop-check   — Stop → spawn sibling (optional); always fail-open
 *
 * Codex stdin/stdout fields may evolve; on any error emit {} and exit 0.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const STDIN_TIMEOUT_MS = 2000;

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
    const timer = setTimeout(done, STDIN_TIMEOUT_MS);
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c, "utf8")));
    process.stdin.on("end", done);
    process.stdin.on("error", done);
  });
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj == null ? {} : obj));
  process.exit(0);
}

function extractCommand(payload) {
  if (!payload || typeof payload !== "object") return "";
  const ti = payload.tool_input || payload.arguments || payload.input || {};
  return (
    ti.command ||
    payload.command ||
    (typeof ti === "string" ? ti : "") ||
    ""
  );
}

function runScript(script, payload, extraArgs) {
  const scriptPath = path.join(__dirname, script);
  const args = [scriptPath, ...(extraArgs || [])];
  const r = spawnSync(process.execPath, args, {
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
    env: { ...process.env, HARNESS_HOOK_MODE: "codex" },
  });
  if (r.error) return null;
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

(async () => {
  try {
    const [mode, script] = process.argv.slice(2);
    if (!mode || !script) out({});
    const raw = await readStdin();
    let payload = {};
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      out({});
    }

    if (mode === "commit-gate") {
      const command = extractCommand(payload);
      const cursorish = {
        tool_input: { command },
        command,
        cwd: payload.cwd || payload.workspace_root || process.cwd(),
      };
      runScript(script, cursorish, ["--codex"]);
      // commit-gate is soft: never deny via adapter
      out({});
      return;
    }

    if (mode === "stop-check") {
      runScript(script, payload, []);
      out({});
      return;
    }

    out({});
  } catch {
    out({});
  }
})();
