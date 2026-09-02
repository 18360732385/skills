#!/usr/bin/env node
/**
 * Claude Code hook 协议适配器（SSOT：docs/agent-config/hooks/，各工具目录为生成物）。
 *
 * 用法：node claude-adapter.js <mode> <script>
 * Claude 与 Cursor 的 hook 输入/输出协议不同，本适配器做双向翻译后调用仓内统一脚本：
 * - shell-gate    PreToolUse(Bash)      → {command} → {permission, agent_message}
 * - mcp-guard     PreToolUse(mcp__*)    → {mcp_server_name, tool_name, tool_input} → {permission, ...}
 * - edit-reminder PostToolUse(Edit|Write|MultiEdit) → {file_path, edits} → {additional_context}
 * - stop-check    Stop                  → {status, loop_count} → {followup_message}
 * 任何异常一律静默放行（{}），避免 hook 故障阻塞开发。
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
      resolve(Buffer.concat(chunks).toString("utf8").replace(/^﻿/, ""));
    };
    const timer = setTimeout(done, STDIN_TIMEOUT_MS);
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c, "utf8")));
    process.stdin.on("end", done);
    process.stdin.on("error", done);
  });
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

/** 以 Cursor 协议运行目标脚本，返回其 stdout 解析结果（失败返回 null） */
function runScript(script, payload) {
  const scriptPath = path.join(__dirname, script);
  const r = spawnSync(process.execPath, [scriptPath], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
  });
  if (r.error || r.status !== 0 || !r.stdout) return null;
  try {
    return JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
  } catch {
    return null;
  }
}

const PERMISSION_MAP = { allow: "allow", ask: "ask", deny: "deny" };

function toPreToolUse(reply) {
  if (!reply) return {};
  const decision = PERMISSION_MAP[reply.permission] || "allow";
  const reason = reply.user_message || reply.agent_message || "";
  if (decision === "allow") {
    // 软提醒：不阻塞，仅以 systemMessage 透传给用户可见
    return reason ? { systemMessage: String(reason) } : {};
  }
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: String(reason),
    },
  };
}

const MODES = {
  "shell-gate": {
    toPayload: (p) => ({ command: p?.tool_input?.command || "" }),
    fromReply: toPreToolUse,
  },
  "mcp-guard": {
    toPayload: (p) => {
      // Claude 工具名形态：mcp__<server>__<tool>
      const parts = String(p?.tool_name || "").split("__");
      return {
        mcp_server_name: parts[1] || "",
        tool_name: parts.slice(2).join("__") || "",
        tool_input: p?.tool_input,
      };
    },
    fromReply: toPreToolUse,
  },
  "edit-reminder": {
    toPayload: (p) => ({
      file_path: p?.tool_input?.file_path || "",
      workspace_roots: [p?.cwd || process.cwd()],
      edits: [{ new_string: p?.tool_input?.new_string ?? p?.tool_input?.content ?? "" }],
    }),
    fromReply: (reply) =>
      reply && reply.additional_context
        ? {
            hookSpecificOutput: {
              hookEventName: "PostToolUse",
              additionalContext: String(reply.additional_context),
            },
          }
        : {},
  },
  "stop-check": {
    toPayload: (p) => ({
      status: "completed",
      // Claude 以 stop_hook_active 防循环，等价于 Cursor 的 loop_limit=1
      loop_count: p?.stop_hook_active ? 1 : 0,
    }),
    fromReply: (reply) =>
      reply && reply.followup_message
        ? { decision: "block", reason: String(reply.followup_message) }
        : {},
  },
};

(async () => {
  try {
    const [mode, script] = process.argv.slice(2);
    const m = MODES[mode];
    if (!m || !script) out({});
    const raw = await readStdin();
    let payload = {};
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      out({});
    }
    const reply = runScript(script, m.toPayload(payload));
    out(m.fromReply(reply));
  } catch {
    out({});
  }
})();
