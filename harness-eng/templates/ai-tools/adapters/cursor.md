# Adapter: Cursor

对齐程度：**高**。不另写 `1x-contract-sync`（已有真实 `11|12|13|16-*-sync*`）。矩阵见 [ai-tools.md](../../../host/ai-tools.md)。

- **目录**: `.cursor/`
- **Rules**: `.cursor/rules/*.mdc`（保留 YAML frontmatter：`alwaysApply` / `globs` / `description`）
- **Hooks**: `.cursor/hooks.json` + `.cursor/hooks/*.js`
  - 事件：`beforeShellExecution` · `beforeMCPExecution` · `afterFileEdit` · `stop`
  - 脚本：Cursor 协议 stdin/stdout（无需 adapter）
- **MCP**: `.cursor/mcp.json`（example: `.cursor/mcp.json.example`）
- **Skills**: `.cursor/skills/`
- **禁止**: 无
