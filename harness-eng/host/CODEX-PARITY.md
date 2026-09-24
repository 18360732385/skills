# Codex → 官方对齐清单（0.7.5 · 高）

harness-eng 将 Codex 标为矩阵 **高**：分轨 SSOT（共享 mcp/hooks/skills + Starlark `codex/rules`），推荐纪律 **B**（探测或显式勾选）。  
**仍不做** Cursor `.mdc` 全量镜像。

交叉：[adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [ai-tools.md](ai-tools.md) · [CODEX-MANUAL.md](CODEX-MANUAL.md) · [CHANGELOG.md](../CHANGELOG.md)。

## 官方参考

- AGENTS.md：<https://developers.openai.com/codex/guides/agents-md>
- MCP（`config.toml`）：<https://developers.openai.com/codex/mcp>
- Hooks：<https://developers.openai.com/codex/hooks>（含 `commandWindows`）
- Skills（`.agents/skills`）：<https://developers.openai.com/codex/skills>
- Rules（Starlark，experimental）：以官网 Rules 文档为准

## 对齐矩阵（脚手架 vs 行为生效）

| 维度 | 脚手架 | 行为生效 | 判定 |
|---|---|---|---|
| **Instructions** | 根/目录 `AGENTS.md` + 薄 `.codex/harness.md` | AGENTS 含 Codex「Rules 索引」；不依赖 `.mdc` 自动加载 | **PASS** |
| **NL 域规则** | 不做 `.mdc` 镜像（故意） | AGENTS 索引 + L5 skills 种子（`contract-sync` / `api-doc-sync` / `db-doc-sync`） | **PASS**（薄种子；非全量 mdc 对等） |
| **Command policy** | `.codex/rules/*.rules` 种子（含 force-push / clean -xfd） | experimental；≠ 自然语言规范 | **PASS** |
| **Config / MCP example** | `config.toml.example` 脱敏、`enabled=false` | 须 trust + 本机 `config.toml` + `/mcp` | 脚手架 **PASS** / 会话 **PARTIAL** |
| **Hooks** | `^Bash$` + `mcp__mysql` + `Stop` + `commandWindows`（`codex-hook.cmd`）+ adapter | 须 `/hooks` trust；fail-open；Stop/mcp 写 stderr；Win 上部分 `unified_exec` 可能绕过 PreToolUse（见 MANUAL） | **PASS**（人验；Win shell 覆盖 **PARTIAL**） |
| **Skills** | L5 → `.agents/skills/` | `/skills` 可发现 | **PASS** |

## 非目标

- **不做** `.mdc` → Codex rules 镜像
- **不**把根 `.mcp.json` 当 Codex MCP SSOT
- **不**在无探测时默认把 Codex 塞进「全部推荐」
- **不**改 Trae / CodeBuddy 矩阵
- P1：更多域 skills（redis/jobs/frontend）；mcp-policy 精细开关；calibrate 直接读 toml

## 人验

见 [CODEX-MANUAL.md](CODEX-MANUAL.md)。回传须含 trust / hooks / Stop stderr / `/mcp`。
