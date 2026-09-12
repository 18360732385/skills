# Adapter: Trae

对齐程度：**中高**（L3+ 全量 rules 镜像 + Claude 族 hooks；MCP 走 `.trae/mcp.json`）。L3+ / L5 不再另写冗余 `1x-contract-sync`。矩阵见 [ai-tools.md](../../../ai-tools.md)。

- **目录**: `.trae/`
- **Rules**: `.trae/rules/*.md`（strip frontmatter；可嵌套子目录）
- **Hooks**: `.trae/hooks.json`（`version` + Claude 系嵌套 `hooks`）
  - 事件：`PreToolUse` · `PostToolUse` · `Stop` 等
  - 脚本：`.trae/hooks/*.js` + `claude-adapter.js`
- **MCP**: `.trae/mcp.json`（需启用项目 MCP / Beta 时以官方为准）
- **Skills**: `.trae/skills/`（若宿主支持）
- **禁止**: 勿用 Cursor `beforeShellExecution` 顶层扁平 hooks.json
