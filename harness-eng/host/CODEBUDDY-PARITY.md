# CodeBuddy / WorkBuddy → 官方对齐清单（0.6.4）

harness-eng **0.6.4** 把 WorkBuddy（目录名 `.codebuddy`）生成物对齐官方 CodeBuddy CLI / IDE 文档，同时**不假装**走 Cursor 协议（hooks 仍是 Claude 族；MCP 仍走仓库根 `.mcp.json`）。

交叉：[adapters/workbuddy.md](../templates/ai-tools/adapters/workbuddy.md) · [ai-tools.md](ai-tools.md) · [CODEBUDDY-P0-MANUAL.md](CODEBUDDY-P0-MANUAL.md) · [CHANGELOG.md](../CHANGELOG.md)。

官方参考（摘要，以官网为准）：

- 目录结构：<https://www.codebuddy.ai/docs/cli/codebuddy-dir>
- Rules / Memory：<https://www.codebuddy.ai/docs/cli/memory>
- Settings / 优先级：<https://www.codebuddy.ai/docs/cli/settings>
- Hooks：<https://www.codebuddy.ai/docs/cli/hooks>
- Permissions：<https://www.codebuddy.ai/docs/cli/permissions>

## 目标定义

「对齐」= 磁盘生成物路径与官方推荐一致，且文档写清**真人会话**必做步骤（面板审批、热加载）。磁盘有文件 ≠ 会话已生效。

| 维度 | 0.6.3 基线 | **0.6.4** |
|---|---|---|
| Rules | `.codebuddy/rules/<name>/RULE.mdc` | **扁平** `.codebuddy/rules/<stem>.md`；**保留** `alwaysApply` / `globs` / `description`（Cursor FM；策略同 Trae）。官方 CLI 亦支持 `paths` |
| Hooks | `.codebuddy/settings.json` + Claude 系 Bash | **保持** Bash matcher + `$CODEBUDDY_PROJECT_DIR`；文档强调 **`/hooks` 面板**应用（save ≠ live） |
| MCP | 根 `.mcp.json` | **保持**；首次连接需审批；local > project > user；密钥 `${VAR}` |
| permissions | 无默认 | 缺省时合并最小 `permissions`（不 wipe）；**不**生成 `settings.local.json` |
| agents | — | **非目标**：不生成 `.codebuddy/agents/` |

## 已落地（本版）

- `sync.mjs.tmpl` / L3+ `render.mjs` 镜像：workbuddy → `.codebuddy/rules/*.md` + preserve FM
- 托管前缀故意 prune 旧 `RULE.mdc` 文件与空目录
- settings 优先级写进适配卡 / MANUAL：CLI > `settings.local.json` > `settings.json` > `~/.codebuddy/settings.json`
- selfcheck 钉扁平路径 + FM 保留 + Bash matcher 不回退

## 非目标 / 禁止

- **不**改 Trae 矩阵；**不**重开 Codex
- **不**把 IDE GUI「每规则一文件夹 RULE.mdc」当作 harness 默认写出路径（GUI 可另建；sync 以官方 CLI 扁平 `.md` 为准）
- **不**生成 `settings.local.json`（本地覆盖留给用户；gitignore 由宿主/官方处理）
- **不**生成 `.codebuddy/agents/`

## P0 人验

见 [CODEBUDDY-P0-MANUAL.md](CODEBUDDY-P0-MANUAL.md)。升级消费仓后务必 `--check-freshness` 并刷新实例化 `sync.mjs`。
