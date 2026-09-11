# Adapter: Trae

- **目录**: `.trae/`
- **Rules**: `.trae/rules/*.md`（strip frontmatter；可嵌套子目录）
- **Hooks**: `.trae/hooks.json`（`version` + Claude 系嵌套 `hooks`）
  - 事件：`PreToolUse` · `PostToolUse` · `Stop` 等
  - 脚本：`.trae/hooks/*.js` + `claude-adapter.js`
- **MCP**: `.trae/mcp.json`（需启用项目 MCP / Beta 时以官方为准）
- **Skills**: `.trae/skills/`（若宿主支持）
- **禁止**: 勿用 Cursor `beforeShellExecution` 顶层扁平 hooks.json
