# Adapter: Codex（高 · 原生全家桶 · 推荐纪律 B）

对齐程度：**高**（与 Cursor / Claude / Qoder / WorkBuddy / Trae 同级矩阵档）。**不做** Cursor `.mdc` 全量镜像——Codex 用分层 `AGENTS.md` + Starlark `.codex/rules/*.rules` + TOML MCP + 原生 hooks。矩阵见 [ai-tools.md](../../../host/ai-tools.md) · [CODEX-PARITY.md](../../../host/CODEX-PARITY.md)。

**推荐纪律 B**：探测到 `.codex/` 或用户显式勾选才进「全部推荐」；无探测**不**默认塞入。

- **目录**: `.codex/`；主指令优先根/目录级 `AGENTS.md`（官方层级合并；~32KiB）
- **Command policy (rules)**: `docs/agent-config/codex/rules/*.rules` → `.codex/rules/`（Starlark；**experimental**）；**禁止**把 `.mdc` 转成 `.rules`
- **Hooks**: `.codex/hooks.json` — `PreToolUse` **`^Bash$`** + **`mcp__mysql`** + `Stop`；含 **`commandWindows`**（`codex-hook.cmd`）；经 `codex-adapter.js`（含 `mcp-guard` 软提醒）；须 `/hooks` 信任；fail-open；`.githooks` 仍兜底
- **Config / MCP**: `.codex/config.toml.example`（由 `mcp/servers*.json` 脱敏 + **`mcp/policy.json`** 决定 `enabled`/`approval_mode`）；本机 trusted 后 `.codex/config.toml`（**gitignore**）；会话 `/mcp`
- **Skills**: L5 `docs/agent-config/skills/` → `.agents/skills/`（种子：`contract-sync` / `api|db|redis|jobs-doc-sync` / `frontend-web`；不 prune 用户自建）
- **NL 分层**：AGENTS+docs（SSOT）→ Skills（域引导）→ Starlark（命令）→ harness soft hooks → **可选** rulehook/deny（短硬红线）；详 [CODEX-PARITY.md](../../../host/CODEX-PARITY.md)
- **入库**：hooks / rules / `config.toml.example` / `docs/agent-config/codex/**` 应提交；**勿**提交 `.codex/config.toml`
- **contract-sync**: 仅 L0–L2 写 `.codex/contract-sync.md`；L3+/L5 omit
- **人验**: [CODEX-MANUAL.md](../../../host/CODEX-MANUAL.md)
