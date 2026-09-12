# Adapter: Codex（部分对齐 · P2）

对齐程度：**部分（P2）·不默认**。与 Cursor/Claude/Qoder/WorkBuddy（高）或 Trae（中高）不同，**不要**假设 Codex 已全量同步 rules / hooks / MCP / skills。**未探测到 `.codex/` 时不进「全部推荐」**；勿因习惯勾选。矩阵见 [ai-tools.md](../../../ai-tools.md)。

- **目录**: `.codex/`；主指令仍优先根 `AGENTS.md`
- **Rules**: 薄指针 `.codex/harness.md` + `contract-sync.md`（无全量镜像，故 **始终**保留该指针）；**暂不全量镜像** `.mdc`
- **Hooks**: `.codex/hooks.json` — 当前仅基础 `PreToolUse(Bash)` + `--codex` gate
  - 官方 hooks 语义与 Claude/Cursor 不完全同构；缺事件则依赖 `.githooks`
- **MCP**: 偏 `.codex/config.toml` `[mcp_servers.*]`（**勿**假设根 `.mcp.json` 一定生效）
- **Skills**: 官方可能用 `.agents/skills/`；harness L5 sync **尚未**分发
- **禁止**: 不要伪造 Cursor/Claude 全家桶事件；升级须对照官方文档后再扩 HOOK_DEFS
