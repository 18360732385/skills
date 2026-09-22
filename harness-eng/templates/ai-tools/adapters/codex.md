# Adapter: Codex（高 · 原生全家桶 · 推荐纪律 B）

对齐程度：**高**（与 Cursor / Claude / Qoder / WorkBuddy / Trae 同级矩阵档）。**不做** Cursor `.mdc` 全量镜像——Codex 用分层 `AGENTS.md` + Starlark `.codex/rules/*.rules` + TOML MCP + 原生 hooks。矩阵见 [ai-tools.md](../../../host/ai-tools.md) · [CODEX-PARITY.md](../../../host/CODEX-PARITY.md)。

**推荐纪律 B**：探测到 `.codex/` 或用户显式勾选才进「全部推荐」；无探测**不**默认塞入。

- **目录**: `.codex/`；主指令优先根/目录级 `AGENTS.md`（官方层级合并；~32KiB）
- **Command policy (rules)**: `docs/agent-config/codex/rules/*.rules` → `.codex/rules/`（Starlark；**experimental**）；**禁止**把 `.mdc` 转成 `.rules`
- **Config / MCP**: `.codex/config.toml.example`（由 `mcp/servers*.json` 脱敏生成）；本机 trusted 后 `.codex/config.toml`（建议 gitignore）；会话 `/mcp`
- **Hooks**: `.codex/hooks.json` — `PreToolUse` matcher **`^Bash$`** + `Stop`；经 `codex-adapter.js`；须 `/hooks` 信任；fail-open；`.githooks` 仍兜底
- **Skills**: L5 全量 `docs/agent-config/skills/` → `.agents/skills/`（不 prune 用户自建）
- **contract-sync**: 仅 L0–L2 写 `.codex/contract-sync.md`；L3+/L5 omit
- **人验**: [CODEX-MANUAL.md](../../../host/CODEX-MANUAL.md)
