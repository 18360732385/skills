# Adapter: Qoder

对齐程度：**高**（L3+ 全量 rules 镜像）。L3+ / L5 不再另写冗余 `1x-contract-sync`。矩阵见 [ai-tools.md](../../../ai-tools.md)。

- **目录**: `.qoder/`
- **Rules**: `.qoder/rules/*.md`（官方为 Markdown；strip frontmatter）
- **Hooks**: `.qoder/settings.json` 的 `hooks` 段（**不是** `.qoder/hooks.json`）
  - 事件：Claude 系 `PreToolUse` · `PostToolUse` · `Stop`
  - 脚本：`.qoder/hooks/*.js` + `claude-adapter.js`
- **MCP**: 根 `.mcp.json`
- **Skills**: `.qoder/skills/`
- **禁止**: 勿生成 Cursor 事件名进 `.qoder/hooks.json`；勿写 `.qoder/mcp.json` 作主路径
