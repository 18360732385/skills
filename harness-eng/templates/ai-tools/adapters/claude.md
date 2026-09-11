# Adapter: Claude Code

- **目录**: `.claude/` + 根 `CLAUDE.md`
- **Rules**: `.claude/rules/*.md`（strip Cursor frontmatter；`globs`→正文「适用路径」）
- **Hooks**: `.claude/settings.json` 的 `hooks` 段 + `.claude/hooks/*.js` + `claude-adapter.js`
  - 事件：`PreToolUse` · `PostToolUse` · `Stop`
  - 路径可用 `${CLAUDE_PROJECT_DIR}/.claude/hooks/...`
- **MCP**: 根 `.mcp.json`（与 Qoder/CodeBuddy 共享）
- **Skills**: `.claude/skills/`
- **禁止**: 勿写 Cursor 式 `.claude/hooks.json` / `beforeShellExecution`
