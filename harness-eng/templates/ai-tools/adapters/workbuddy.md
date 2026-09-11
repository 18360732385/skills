# Adapter: WorkBuddy / CodeBuddy

- **目录**: `.codebuddy/` + 根 `CODEBUDDY.md`
- **Rules**: `.codebuddy/rules/<name>/RULE.mdc`（可保留 Cursor 风格 frontmatter）
- **Hooks**: `.codebuddy/settings.json` 的 `hooks` 段（0.5.2+ 全家桶）
  - 事件：Claude 系；脚本 `.codebuddy/hooks/*.js` + `claude-adapter.js`
- **MCP**: 根 `.mcp.json`（官方推荐项目级）
- **Skills**: `.codebuddy/skills/`
- **禁止**: 勿停在仅基础 commit 门禁（除非用户显式只要 `commit-gate`）
