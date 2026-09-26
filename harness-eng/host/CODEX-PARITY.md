# Codex → 官方对齐清单（0.7.14 · 高）

harness-eng 将 Codex 标为矩阵 **高**：分轨 SSOT（共享 mcp/hooks/skills + Starlark `codex/rules`），推荐纪律 **B**（探测或显式勾选）。  
**仍不做** Cursor `.mdc` 全量镜像。

交叉：[adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [ai-tools.md](ai-tools.md) · [CODEX-MANUAL.md](CODEX-MANUAL.md) · [CHANGELOG.md](../CHANGELOG.md)。

## 官方参考

- AGENTS.md：<https://developers.openai.com/codex/guides/agents-md>
- MCP（`config.toml`）：<https://developers.openai.com/codex/mcp>
- Hooks：<https://developers.openai.com/codex/hooks>（含 `commandWindows`）
- Skills（`.agents/skills`）：<https://developers.openai.com/codex/skills>
- Rules（Starlark，experimental）：以官网 Rules 文档为准
- 可选 L4：[rulehook](https://github.com/xwk-911/rulehook)（NL deny；非默认）

## 对齐矩阵（脚手架 vs 行为生效）

| 维度 | 脚手架 | 行为生效 | 判定 |
|---|---|---|---|
| **Instructions** | 根/目录 `AGENTS.md` + 薄 `.codex/harness.md` | AGENTS 含 Codex「Rules 索引」；不依赖 `.mdc` 自动加载 | **PASS** |
| **NL 域规则** | 不做 `.mdc` 镜像（故意） | AGENTS 索引 + L5 skills（`contract-sync` / `api|db|redis|jobs-doc-sync` / `frontend-web`） | **PASS**（薄种子；非全量 mdc 对等） |
| **Command policy** | `.codex/rules/*.rules` 种子（含 force-push / clean -xfd） | experimental；≠ 自然语言规范 | **PASS** |
| **Config / MCP example** | `config.toml.example` + `mcp/policy.json`（脱敏；写库默认关） | 须 trust + 本机 `config.toml` + `/mcp`；policy 可建议开安全工具；**calibrate** 可读 toml/`env_vars` | 脚手架 **PASS** / 会话 **PARTIAL** |
| **Hooks** | `^Bash$` + `mcp__mysql` + `Stop` + `commandWindows`（`codex-hook.cmd`）+ adapter；可选 rulehook 合并 | 须 `/hooks` trust；fail-open；Stop/mcp 写 stderr；Win 上部分 `unified_exec` 可能绕过 PreToolUse（见 MANUAL） | **PASS**（人验；Win shell 覆盖 **PARTIAL**） |
| **Skills** | L5 → `.agents/skills/` | `/skills` 可发现 | **PASS** |
| **L4 rulehook（可选）** | `.rulehook/rulehook.toml` 种子（≤10 deny）；`Q_RULEHOOK` / 探测才落盘；sync 合并 | 须本机 `rulehook` CLI + trust；**不**默认依赖 | 脚手架 **PASS** / 行为 **PARTIAL**（人验） |

## 自然语言规则：分层（优于「只靠 AGENTS」或「只靠 hook 裁判」）

| 层 | 载体 | 职责 | 典型内容 |
|---|---|---|---|
| **L0 SSOT** | 根/分册 `AGENTS.md` + `docs/**` | 权威正文；禁止双写业务 Never do | 命令、红线一句 + Pn、契约真相 |
| **L1 发现** | `.agents/skills/*`（本 skill 种子） | 域工作流引导；`/skills` 可发现 | 契约读序、api/db/redis/jobs sync、frontend |
| **L2 命令** | `.codex/rules/*.rules`（Starlark） | 沙箱外命令 allow/prompt/forbidden | `git push --force`、destructive clean |
| **L3 软门禁** | harness hooks（fail-open） | 提醒不阻断 | commit-gate、Stop 清单、mcp-mysql stderr |
| **L4 可选强制** | [rulehook](https://github.com/xwk-911/rulehook)（`.rulehook/` + sync 合并） | 少量不可协商 NL 红线；**非**默认装入 | 「勿削弱测试过关」；须 `/hooks` trust |

- **Skills ≠ rulehook**：前者教「怎么做」；后者在工具调用时裁判「违不违规」。域 sync 用 L1；短硬 Never do 才考虑 L4。
- **不做** `.mdc` 全量进 rulehook（贵、慢、误拦）；**不**把 L4 当安全边界（官方 hooks 亦非安全边界）。
- **Opt-in**：`Q_RULEHOOK` / meta `rulehook: true` / 已有 `.rulehook/rulehook.toml`；sync 在生成 hooks 时合并 `rulehook hook --target codex`，避免被 harness 覆盖。
- Win 上部分 `unified_exec` 可能绕过 PreToolUse：L4 与 L3 均受影响；`.githooks` / Starlark 仍兜底。

## 非目标

- **不做** `.mdc` → Codex rules 镜像
- **不**把根 `.mcp.json` 当 Codex MCP SSOT
- **不**在无探测时默认把 Codex 塞进「全部推荐」
- **不**改 Trae / CodeBuddy 矩阵
- **不**默认 vendoring / 强制依赖 rulehook（可选增强，见上表 L4）
- ~~可选 L4 适配器（探测/勾选）~~ → **0.7.9**
- ~~mcp-policy 精细开关~~ → **0.7.7**（`mcp/policy.json`）
- ~~calibrate 读 toml~~ → **0.7.8**（`fill-calibrate-live` / `mcp-paths`）

## 人验

见 [CODEX-MANUAL.md](CODEX-MANUAL.md)。回传须含 trust / hooks / Stop stderr / `/mcp`；若启用 rulehook 另含 CLI 与试拦。
