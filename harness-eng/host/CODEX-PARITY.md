# Codex → 官方对齐清单（0.6.8-dev · P0）

harness-eng **0.6.8-dev** 对 Codex 做 **P0 增量解冻**：补齐官方路径文档、项目 `config.toml` 模板、hooks matcher 正则、skills 路径说明与人验清单。  
**仍不默认**进「全部推荐」（未探测 `.codex/` 不勾）；**不全量**把 Cursor `.mdc` / Claude 全家桶事件镜像进 Codex。

交叉：[adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [ai-tools.md](ai-tools.md) · [CODEX-P0-MANUAL.md](CODEX-P0-MANUAL.md) · [CHANGELOG.md](../CHANGELOG.md)。

## 官方参考（以官网为准）

- AGENTS.md 层级：<https://developers.openai.com/codex/guides/agents-md>
- 定制概念：<https://developers.openai.com/codex/concepts/customization>
- MCP（`config.toml`）：<https://developers.openai.com/codex/mcp>
- Hooks：<https://developers.openai.com/codex/hooks>
- Skills（`.agents/skills`）：<https://developers.openai.com/codex/skills>

## 目标定义

「对齐」= 磁盘生成物与**官方 Codex 路径/语义**一致，且文档写清真人会话必做步骤（trust 项目、`/hooks`、`/mcp`）。  
磁盘有文件 ≠ 会话已生效。  
**不做** Cursor `.mdc` 全量镜像到 Codex rules（官方指令链是 `AGENTS.md` / `AGENTS.override.md`，不是 `.mdc`）。

## 对齐矩阵（P0）

| 维度 | 官方 Codex | harness 现状（0.6.8-dev P0） | 判定 |
|---|---|---|---|
| **Instructions** | 全局 `~/.codex/AGENTS(.override).md` + 项目根→cwd 每层至多一份；合并至 `project_doc_max_bytes`（默认 ~32KiB） | 根 `AGENTS.md` 为 SSOT；薄指针 `.codex/harness.md` + 始终保留 `.codex/contract-sync.md` | **PASS**（薄指针 + 根 AGENTS；**不做** `.mdc` 全量镜像） |
| **Config** | `~/.codex/config.toml` + **trusted** 项目 `.codex/config.toml` | 模板 `templates/ai-tools/codex-config.toml.tmpl` → 落地 `.codex/config.toml.example`（注释示例；无密钥） | **PASS**（example；真文件由用户信任后拷贝/编辑） |
| **MCP** | `[mcp_servers.<name>]`：stdio `command`/`args` 或 http `url`；项目层仅 trusted | 同上 config 模板；**勿**假设根 `.mcp.json` 对 Codex 生效 | **PASS**（文档 + example）；会话启用须 `/mcp` |
| **Hooks** | `.codex/hooks.json` 或 inline `[hooks]`；matcher 为 **regex**；非托管 hooks 须 `/hooks` trust | `.codex/hooks.json`：`PreToolUse` + matcher `^Bash$` + `--codex` gate；**不**发明 Cursor-only 事件 | **PARTIAL**（仅基础 commit gate；未补全家桶） |
| **Skills** | 仓库 `.agents/skills/`（及用户 `~/.agents/skills`）；`SKILL.md` 标准 | 文档 + L5 sync **轻指针** `.agents/skills/GENERATED.md`（**不全量**拷贝 SSOT skills） | **PARTIAL**（路径已知；不分发巨型副本） |

## 已落地（本版 P0）

- [CODEX-PARITY.md](CODEX-PARITY.md) · [CODEX-P0-MANUAL.md](CODEX-P0-MANUAL.md)
- 适配卡 / `ai-tools.md`：去掉「0.6.x 整列冻结 P2」措辞 → **P0 增量解冻 / 仍不默认**
- `templates/ai-tools/codex-config.toml.tmpl` + manifest 落地 `.codex/config.toml.example`
- `templates/hooks/codex-hooks.json` matcher → `^Bash$`（Codex regex）
- L5 sync：Codex 选中时写 `.agents/skills/GENERATED.md` 指针（不 prune 用户 skills）

## 非目标 / 禁止（P0 与后续仍适用）

- **不做** Cursor `.mdc` → Codex 全量 rules 镜像（官方不是 `.mdc` 协议）
- **不做** Claude/Cursor hooks 全家桶事件对等（缺事件仍靠 `.githooks`）
- **不做** 根 `.mcp.json` 当作 Codex MCP SSOT
- **不**默认把 Codex 塞进「全部推荐」
- **不**改 Trae / CodeBuddy 矩阵与生成路径
- 生产装/升 URL 仍 **`main`**（勿钉 `V0.6.X`）

## P1 候选（本版不做）

- 更多 hook 事件（如 `Stop` / `SessionStart`）经官方实测后再扩
- L5 sync 可选把 `docs/agent-config/skills` 选择性同步到 `.agents/skills`（仍非巨型默认同构）
- fill-mcp / calibrate 对 `config.toml` `[mcp_servers]` 的只读探测（不写密钥）

## P0 人验

见 [CODEX-P0-MANUAL.md](CODEX-P0-MANUAL.md)。
