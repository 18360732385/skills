# Adapter: Trae

对齐程度：**高**（L3+ 全量 rules 镜像 + Claude 族 hooks；MCP 走 `.trae/mcp.json` + IDE Settings 开关）。L3+ / L5 不再另写冗余 `1x-contract-sync`（sync 清掉宿主 1x 是对的）。L5 的 alwaysApply 指针活在 **`docs/agent-config/rules/00-harness-ssot.mdc`**，再 sync 到 `.trae/rules/`；勿 git restore 宿主 00 孤儿。矩阵见 [ai-tools.md](../../../host/ai-tools.md)。P0 官方实证（2026-09-12 / 2026-09-14）：[`_history/.../TRAE-P0-EVIDENCE.md`](../../../../_history/harness-eng-docs-archive/TRAE-P0-EVIDENCE.md)。同级跟踪：[TRAE-PARITY.md](../../../host/TRAE-PARITY.md)。**不假装** Cursor 协议。hooks PASS **单独不授权**升 **高**（本版另有 MCP 面板 PASS）。

- **目录**: `.trae/`
- **Rules**: `.trae/rules/*.md`（**官方原生 frontmatter**：`alwaysApply` / `globs` / `description`；可嵌套最多 3 层）。harness 镜像**保留** FM（不再 strip）。**消费仓**：升级 skill 后须再 land/render L5 **刷新**实例化 `scripts/agent-config/sync.mjs`，否则仍会剥 FM。2026-09-12 Round A（c-be-sms-ai）刷新后磁盘+行为 PASS（13 份、认 `globs`）。另可导入根 `AGENTS.md` / `CLAUDE.md`（官方开关）
- **Hooks**: `.trae/hooks.json`（`version` + Claude 系嵌套 `hooks`；路径已官方确认）
  - 事件：官方含 `SessionStart` · `UserPromptSubmit` · `PreToolUse` · `PostToolUse` · `Stop` · `Notification`
  - 脚本：`.trae/hooks/*.js` + `claude-adapter.js`
  - **Stop / stop-checklist**：观察向；adapter `stop-check` 恒 `{}`，**禁止** `decision: "block"`（避免 Hooks 强制续聊/自行提交）
  - **matcher（T-P1-2）**：官方终端 `tool_name` 为 **`RunCommand`**。`HOOK_DEFS.events.trae` 走 `TRAE_STYLE`：提交门禁 `Bash|RunCommand`；mysql-guard `mcp__mysql.*`；after-edit `Edit|Write|MultiEdit`。Claude/Qoder 仍 `Bash`。Round C 本机 FAIL 是 **matcher 误诊**（当时写 `Bash`，永不匹配 `RunCommand`）。**2026-09-14 Hooks live PASS**（c-be-sms-ai：Settings → Hooks 已开；`additionalContext` 注入；软 allow）。hooks PASS **单独不授权**升 **高**。`.githooks` 仍兜底。人验**只认** `.trae/hooks.json`，**勿**用 `.cursor/hooks.json` `beforeShellExecution`。见 [TRAE-P0-MANUAL.md](../../../host/TRAE-P0-MANUAL.md)
- **MCP**: `.trae/mcp.json`（**磁盘产物 + 必须在 IDE Settings 开关启用**）。2026-09-14 面板：**12** 台 workspace servers 都在；**ON** gitlab / Apifox 导入 / chrome-devtools；其余 **OFF via toggle**（在场、非缺失）。未开面板 ≠ 已接入；**不要**把 toggled-off 读成「启动缺失」
- **Skills**: `.trae/skills/`（**一等公民**，按需加载）。可选 `.agents/skills/`
- **禁止**: 勿用 Cursor `beforeShellExecution` 顶层扁平 hooks.json
