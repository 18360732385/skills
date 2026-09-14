# Fixture: MATURE Trae-only

根 AGENTS + `.trae/rules`（含 `alwaysApply` / `globs` frontmatter + 嵌套 `api/`）+ 最小 api 契约 + agent-kb。  
**无** `.cursor/rules`。用于 detect / MATURE 按宿主诚实。

L5 sync 路径（本夹具不另造黄金树；由 `sync.mjs.tmpl` + `selfcheck-render` `l5-trae-ssot-00-harness` 钉）：

- SSOT：`docs/agent-config/rules/00-harness-ssot.mdc` → sync 分发 `.trae/rules/*.md`
- hooks：`.trae/hooks.json`
- MCP：`.trae/mcp.json`（+ IDE Settings 开关）

