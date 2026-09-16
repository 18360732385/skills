# Adapter: WorkBuddy / CodeBuddy

对齐程度：**高**（L3+ rules 镜像 + hooks 全家桶）。L3+ / L5 不再另写冗余 `1x-contract-sync`。矩阵见 [ai-tools.md](../../../host/ai-tools.md)。  
官方对齐说明：[CODEBUDDY-PARITY.md](../../../host/CODEBUDDY-PARITY.md) · 人验：[CODEBUDDY-P0-MANUAL.md](../../../host/CODEBUDDY-P0-MANUAL.md)。

- **目录**: `.codebuddy/` + 根 `CODEBUDDY.md`
- **Rules**: `.codebuddy/rules/<stem>.md`（**扁平**；保留 Cursor 风格 `alwaysApply` / `globs` / `description` frontmatter，策略同 Trae）。旧 `<name>/RULE.mdc` 布局由 sync 托管前缀 prune
- **Hooks**: `.codebuddy/settings.json` 的 `hooks` 段（0.5.2+ 全家桶）
  - 事件：Claude 系；matcher 终端工具为 **Bash**（保持 CLAUDE_STYLE）
  - 脚本：`.codebuddy/hooks/*.js` + `claude-adapter.js`；命令可用 `$CODEBUDDY_PROJECT_DIR`
  - **热加载**：改 `settings.json` 后须在 IDE **`/hooks` 面板**确认/应用（仅保存文件 ≠ 会话已生效）
- **MCP**: 根 `.mcp.json`（官方推荐项目级）。首次连接需审批；范围优先级 **local > project > user**；密钥用 `${VAR}`，勿把真密写进 SSOT
- **permissions / settings 优先级**: CLI > `.codebuddy/settings.local.json` > `.codebuddy/settings.json` > `~/.codebuddy/settings.json`。sync 仅在缺省时合并最小 `permissions`（不 wipe）。**不**生成 `settings.local.json`
- **Skills**: `.codebuddy/skills/`
- **非目标**: `.codebuddy/agents/`（不由 harness 生成）
- **禁止**: 勿停在仅基础 commit 门禁（除非用户显式只要 `commit-gate`）；勿再写 RULE.mdc 目录布局
