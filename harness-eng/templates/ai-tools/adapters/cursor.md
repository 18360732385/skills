# Adapter: Cursor

- **目录**: `.cursor/`
- **Rules**: `.cursor/rules/*.mdc`（保留 YAML frontmatter：`alwaysApply` / `globs` / `description`）
- **Hooks**: `.cursor/hooks.json` + `.cursor/hooks/*.js`
  - 事件：`beforeShellExecution` · `beforeMCPExecution` · `afterFileEdit` · `stop`
  - 脚本：Cursor 协议 stdin/stdout（无需 adapter）
- **MCP**: `.cursor/mcp.json`（example: `.cursor/mcp.json.example`）
- **Skills**: `.cursor/skills/`
- **禁止**: 无
