# Codex → 官方对齐清单（0.6.9 · 高）

harness-eng **0.6.9** 将 Codex 升为矩阵 **高**：分轨 SSOT（共享 mcp/hooks/skills + Starlark `codex/rules`），推荐纪律 **B**（探测或显式勾选）。  
**仍不做** Cursor `.mdc` 全量镜像。

交叉：[adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [ai-tools.md](ai-tools.md) · [CODEX-MANUAL.md](CODEX-MANUAL.md) · [CHANGELOG.md](../CHANGELOG.md)。

## 官方参考

- AGENTS.md：<https://developers.openai.com/codex/guides/agents-md>
- MCP（`config.toml`）：<https://developers.openai.com/codex/mcp>
- Hooks：<https://developers.openai.com/codex/hooks>
- Skills（`.agents/skills`）：<https://developers.openai.com/codex/skills>
- Rules（Starlark，experimental）：以官网 Rules 文档为准

## 对齐矩阵

| 维度 | 官方 Codex | harness 0.6.9 | 判定 |
|---|---|---|---|
| **Instructions** | 分层 AGENTS | 根/目录 `AGENTS.md` + 薄 `.codex/harness.md` | **PASS** |
| **Command policy** | `.codex/rules/*.rules` | SSOT → sync/land 种子 `repository.rules` | **PASS**（experimental） |
| **Config** | trusted 项目 `config.toml` | `config.toml.example` 从 MCP SSOT 生成 | **PASS** |
| **MCP** | `[mcp_servers.*]` | 同上；默认 `enabled=false`；无密钥 | **PASS** |
| **Hooks** | `hooks.json` + trust | `PreToolUse(^Bash$)` + `Stop` + `codex-adapter.js` | **PASS** |
| **Skills** | `.agents/skills` | L5 全量分发 + GENERATED 标记 | **PASS** |

## 非目标

- **不做** `.mdc` → Codex rules 镜像
- **不**把根 `.mcp.json` 当 Codex MCP SSOT
- **不**在无探测时默认把 Codex 塞进「全部推荐」
- **不**改 Trae / CodeBuddy 矩阵
- P1：更多 hook 事件、mcp-policy.yaml 精细开关

## 人验

见 [CODEX-MANUAL.md](CODEX-MANUAL.md)。
