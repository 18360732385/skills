# Adapter: Trae

对齐程度：**中高**（L3+ 全量 rules 镜像 + Claude 族 hooks；MCP 走 `.trae/mcp.json`）。L3+ / L5 不再另写冗余 `1x-contract-sync`（sync 清掉宿主 1x 是对的）。L5 的 alwaysApply 指针活在 **`docs/agent-config/rules/00-harness-ssot.mdc`**，再 sync 到 `.trae/rules/`；勿 git restore 宿主 00 孤儿。矩阵见 [ai-tools.md](../../../host/ai-tools.md)。P0 官方实证（2026-09-12）：[TRAE-P0-EVIDENCE.md](../../../host/TRAE-P0-EVIDENCE.md)。同级跟踪：[TRAE-PARITY.md](../../../host/TRAE-PARITY.md)。**未**把矩阵改成高。

- **目录**: `.trae/`
- **Rules**: `.trae/rules/*.md`（**官方原生 frontmatter**：`alwaysApply` / `globs` / `description`；可嵌套最多 3 层）。harness 镜像**保留** FM（不再 strip）。**消费仓**：升级 skill 后须再 land/render L5 **刷新**实例化 `scripts/agent-config/sync.mjs`，否则仍会剥 FM。2026-09-12 Round A（c-be-sms-ai）刷新后磁盘+行为 PASS（13 份、认 `globs`）。另可导入根 `AGENTS.md` / `CLAUDE.md`（官方开关）
- **Hooks**: `.trae/hooks.json`（`version` + Claude 系嵌套 `hooks`；路径已官方确认）
  - 事件：官方含 `SessionStart` · `UserPromptSubmit` · `PreToolUse` · `PostToolUse` · `Stop` · `Notification`
  - 脚本：`.trae/hooks/*.js` + `claude-adapter.js`
  - **matcher（T-P1-2）**：官方终端 `tool_name` 为 **`RunCommand`**。`HOOK_DEFS.events.trae` 走 `TRAE_STYLE`：提交门禁 `Bash|RunCommand`；mysql-guard `mcp__mysql.*`；after-edit `Edit|Write|MultiEdit`。Claude/Qoder 仍 `Bash`。Round C 本机 FAIL **很可能是 matcher 误诊**（当时写 `Bash`，永不匹配 `RunCommand`）。消费仓须 sync + **Settings → Hooks 启用项目 hooks** + **新会话**复测；未 PASS **不**升矩阵。`.githooks` 仍兜底。人验**只认** `.trae/hooks.json`，**勿**用 `.cursor/hooks.json` `beforeShellExecution`。见 [TRAE-P0-MANUAL.md](../../../host/TRAE-P0-MANUAL.md)
- **MCP**: `.trae/mcp.json`（**磁盘产物 + 必须在 IDE Settings → Add MCP servers / 项目 MCP 启用**；未开面板 ≠ 已接入）
- **Skills**: `.trae/skills/`（**一等公民**，按需加载）。可选 `.agents/skills/`
- **禁止**: 勿用 Cursor `beforeShellExecution` 顶层扁平 hooks.json
