#!/usr/bin/env node
/**
 * Codex hook adapter (harness-eng).
 *
 * Usage: node codex-adapter.js <mode> <script>
 * Modes:
 *   commit-gate  — PreToolUse Bash → spawn sibling with --codex
 *   mcp-guard    — PreToolUse mcp__* → Cursor-shaped payload; soft (stderr only)
 *   stop-check   — Stop → spawn sibling (optional); always fail-open
 *
 * Soft gates: never deny via stdout. On errors emit {} and exit 0.
 * Child stderr is forwarded; ask/deny messages from mcp-guard go to stderr.
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

/** Codex / Claude-like: mcp__<server>__<tool> or nested tool_input. */
function extractMcp(payload) {
  if (!payload || typeof payload !== "object") {
    return { mcp_server_name: "", tool_name: "", tool_input: {} };
  }
  const toolName = String(payload.tool_name || payload.toolName || "");
  if (toolName.startsWith("mcp__")) {
    const parts = toolName.split("__");
    return {
      mcp_server_name: parts[1] || "",
      tool_name: parts.slice(2).join("__") || "",
      tool_input: payload.tool_input || payload.arguments || payload.input || {},
    };
  }
  return {
    mcp_server_name:
      payload.mcp_server_name ||
      payload.server_name ||
      payload.server ||
      "",
    tool_name: payload.tool_name || payload.tool || "",
    tool_input: payload.tool_input || payload.arguments || payload.input || {},
  };
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
  if (r.error) {
    try {
      process.stderr.write(`[codex-adapter] spawn failed: ${r.error.message}\n`);
    } catch {
      /* ignore */
    }
    return null;
  }
  if (r.stderr) {
    try {
      process.stderr.write(r.stderr);
    } catch {
      /* ignore */
    }
  }
  if (r.status !== 0 && r.status != null) {
    try {
      process.stderr.write(
        `[codex-adapter] ${script} exited ${r.status} (fail-open; not denying)\n`
      );
    } catch {
      /* ignore */
    }
  }
  let parsed = null;
  try {
    parsed = JSON.parse((r.stdout || "").trim() || "null");
  } catch {
    parsed = null;
  }
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "", parsed };
}

function softMcpHint(parsed) {
  if (!parsed || typeof parsed !== "object") return;
  const perm = parsed.permission;
  if (perm !== "ask" && perm !== "deny") return;
  const msg =
    parsed.user_message ||
    parsed.agent_message ||
    parsed.message ||
    `MCP MySQL guard: ${perm}`;
  try {
    process.stderr.write(`[codex-adapter·mcp-guard·${perm}] ${msg}\n`);
  } catch {
    /* ignore */
  }
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
      out({});
      return;
    }

    if (mode === "mcp-guard") {
      const cursorish = extractMcp(payload);
      const r = runScript(script, cursorish, []);
      softMcpHint(r && r.parsed);
      // Codex fail-open: never deny via adapter stdout
      out({});
      return;
    }

    if (mode === "stop-check") {
      runScript(script, payload, []);
      out({});
      return;
    }

    out({});
  } catch (e) {
    try {
      process.stderr.write(`[codex-adapter] ${e && e.message ? e.message : e}\n`);
    } catch {
      /* ignore */
    }
    out({});
  }
})();
