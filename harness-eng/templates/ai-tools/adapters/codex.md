# Adapter: Codex（部分对齐 · P0 增量解冻 · 仍不默认）

对齐程度：**部分（P2 基线 + P0 增量）·不默认**。与 Cursor/Claude/Qoder/WorkBuddy/Trae（高）不同，**不要**假设 Codex 已全量同步 rules / hooks / MCP / skills。**未探测到 `.codex/` 时不进「全部推荐」**；勿因习惯勾选。矩阵见 [ai-tools.md](../../../host/ai-tools.md) · [CODEX-PARITY.md](../../../host/CODEX-PARITY.md)。

**0.6.8-dev P0 增量解冻**：补 PARITY/MANUAL、项目 `config.toml.example`、hooks matcher 正则、skills 路径说明。  
**仍不做**：Cursor `.mdc` 全量镜像、Claude/Cursor hooks 全家桶对等、`sync.mjs` 对 Codex rules/MCP/skills 巨型同构。全量 Cursor 级对等 **out of scope / 另立项**。

- **目录**: `.codex/`；主指令仍优先根 `AGENTS.md`（官方层级：全局 `~/.codex` + 项目根→cwd；`AGENTS.override.md` 优先；~32KiB）
- **Rules / Instructions**: 薄指针 `.codex/harness.md` + `contract-sync.md`（无全量镜像，故 **始终**保留该指针）；**不做** `.mdc` 全量镜像
- **Config**: `.codex/config.toml.example`（注释示例；trusted 后拷贝为 `.codex/config.toml`）；用户级 `~/.codex/config.toml`
- **Hooks**: `.codex/hooks.json` — `PreToolUse` matcher **`^Bash$`**（Codex **regex**）+ `--codex` gate
  - 非托管 hooks 须在会话里 **`/hooks` 信任**；缺事件则依赖 `.githooks`
  - **禁止**伪造 Cursor-only 事件名
- **MCP**: `[mcp_servers.*]` 写在 `config.toml`（stdio 或 http）；**勿**假设根 `.mcp.json` 一定生效；会话用 **`/mcp`** 查看
- **Skills**: 官方仓库路径 **`.agents/skills/`**（及 `~/.agents/skills`）；L5 sync 仅写轻指针 `GENERATED.md`，**不全量**分发 SSOT skills
- **人验**: [CODEX-P0-MANUAL.md](../../../host/CODEX-P0-MANUAL.md)
