# AI 编程工具面（Q_AI_TOOL）

真相与契约仍在 `AGENTS.md` + `docs/**`（**一份 SSOT**）。各工具生成**入口适配 + 宿主对齐交付**（rules 镜像 / hooks / MCP example）；业务 Never do / Pn 只留在 SSOT。

宿主路径细节见适配卡：[templates/ai-tools/adapters/](../templates/ai-tools/adapters/) · 生成引擎见 [sync-hosts.md](sync-hosts.md)。

**0.7.0**：Codex 升 **高**（原生全家桶）；推荐纪律 **B**（探测或显式勾选）。**仍不做** Cursor `.mdc` 全量镜像。跟踪 [CODEX-PARITY.md](CODEX-PARITY.md) · [CODEX-MANUAL.md](CODEX-MANUAL.md)。

## 内置工具

| ID | 中文名 | 探测信号 | 生成入口（适配） |
|---|---|---|---|
| `cursor` | Cursor | `.cursor/` | 已由 L0 rules/AGENTS 覆盖；另写 `.cursor/rules/00-harness-ssot.mdc` 指针（可选加强） |
| `claude` | Claude Code | `CLAUDE.md` / `.claude/` | 根 `CLAUDE.md` + L3+ 全量 `.claude/rules/*.md` 镜像 |
| `codex` | Codex（**高** · 推荐纪律 B） | `.codex/` | 根 `AGENTS.md` + Starlark `.codex/rules` + `config.toml.example` + hooks/adapter + L5 `.agents/skills`；探测或勾选才进「全部推荐」；**不做** `.mdc` 镜像 |
| `qoder` | Qoder | `.qoder/` | `.qoder/rules/00-harness-ssot.md` + L3+ 全量 rules 镜像（`.md`） |
| `trae` | Trae | `.trae/` | `.trae/rules/00-harness-ssot.md` + L3+ 全量 rules 镜像（`.md`） |
| `workbuddy` | WorkBuddy / CodeBuddy | `.codebuddy/` / `CODEBUDDY.md` | `CODEBUDDY.md` + rules 镜像 + L3+ Claude 系 hooks 全家桶 |

## 自定义

用户选「自定义」或回复形如：

```text
自定义: 工具名=FooAgent; 入口路径=.foo/RULES.md
```

或 JSON 友好：

```json
{ "id": "fooagent", "label": "FooAgent", "entry": ".foo/RULES.md" }
```

写入该路径一份指针模板（`templates/ai-tools/custom-entry.md.tmpl`）。  
入口路径须用户给出或确认。

## 提问展示（强制）

```text
Q_AI_TOOL — 本仓要用哪些 AI 编程工具？（可多选）
  A) Cursor【推荐：已探测 .cursor】
  B) Claude Code
  C) Codex（高 · 探测或勾选；不做 .mdc 镜像）
  D) Qoder
  E) Trae
  F) WorkBuddy
  G) 自定义（请写：工具名=…; 入口路径=…）
不确定请回复：全部推荐（= 仅已探测项；无探测则空，追问一次，不默认 Cursor；Codex 仅探测到 .codex/ 或显式勾选才纳入）
```

## 对齐矩阵（0.7.0）

契约 SSOT 始终是根 `AGENTS.md` + `docs/**`。下表只描述**宿主脚手架对齐程度**。

| 工具 | 对齐程度 | 说明 |
|---|---|---|
| `cursor` | **高** | 原生 `11\|12\|13\|16-*-sync*` rules + hooks 家族 |
| `claude` | **高** | L3+ 全量 `.claude/rules/*.md` 镜像 + Claude 族 hooks |
| `qoder` | **高** | L3+ 全量 `.qoder/rules/*.md` 镜像 + Claude 族 hooks |
| `workbuddy` | **高** | L3+ 扁平 `.codebuddy/rules/*.md`（保留 FM）+ CodeBuddy hooks 全家桶；见 [CODEBUDDY-PARITY.md](CODEBUDDY-PARITY.md) |
| `trae` | **高** | L3+ 全量 rules 镜像 + Claude 族 hooks；MCP 走 `.trae/mcp.json` **+ IDE Settings 开关启用**。跟踪 [TRAE-PARITY.md](TRAE-PARITY.md) |
| `codex` | **高**（推荐纪律 B） | 原生 Starlark rules + TOML MCP + hooks/adapter + L5 skills；**不做** `.mdc` 镜像。见 [CODEX-PARITY.md](CODEX-PARITY.md) |

自定义入口-only 工具：只保证入口指针（及同目录 `1x` 指针），不装 hooks/MCP。

## 纪律

- 多选时**都**生成对应适配；未选的不删已有用户文件（resume 时 skip）
- 适配正文只含：指向根 AGENTS、docs 优先级；**勿**在适配/规则文件粘贴明文密文
- `ai_tools` 写入 `docs/harness-eng/harness-meta.yaml`（YAML 列表；读侧可回退 `.cursor/`）
- **契约 sync 指针（0.5.7 收窄）**：只给**拿不到全量 `*-sync*` 镜像**的宿主（`when_full_rules_mirror: false`）；指针含契约域 packs / globs，不复制 Never do / Pn
  - **仍写 `1x`**：自定义入口-only、以及 L0–L2 尚未全量镜像的 claude/qoder/trae/workbuddy、**L0–L2 的 `codex`**
  - **跳过 / 不另写 `1x`**：L3+ 全量镜像或 L5 `sync.mjs` 分发规则的 claude / qoder / trae / workbuddy；**L3+/L5 的 `codex`**（Starlark+hooks+config 管线）
  - **Cursor**：不另写 `1x`（已有真实 `11\|12\|13\|16`）
  - L5（`agent_config: true`）下，全量镜像宿主与 Codex **omit** 冗余 1x/contract-sync
- **全量 rules 镜像（0.5.1+ / 0.5.2+ claude；**0.6.4** workbuddy 扁平）**：L3+ 镜像到 qoder/trae/claude/workbuddy（`.md`；trae/workbuddy **保留 FM**）；L5 由 `sync.mjs` 分发
- audit / detect：入口仍要在；`1x` 缺失不再作为 L3+/L5 全量镜像宿主的缺口（改看本宿主 `*-sync*`）；Codex 仍要 `contract-sync.md`

## 契约 sync 镜像路径

| `ai_tools` | 何时写 `1x` | 路径 |
|---|---|---|
| `codex` | 仅 L0–L2 | `.codex/contract-sync.md` |
| `claude` / `qoder` / `trae` / `workbuddy` | 仅 L0–L2（`when_full_rules_mirror: false`） | `.claude\|.qoder\|.trae/rules/1x-contract-sync.md`；workbuddy → `.codebuddy/rules/1x-contract-sync.md` |
| 自定义入口-only | 始终（与入口同目录） | `<entry-dir>/1x-contract-sync.md` |
| `cursor` | 不写 | 已有 `.cursor/rules/11\|12\|13\|16-*-sync*.mdc`（Cursor 示例，非全宿主唯一权威） |

## 协议族（0.5.1+ / 0.5.2 workbuddy）

| 族 | 成员 | hooks 形态 | MCP 主路径 |
|---|---|---|---|
| **Cursor 族** | `cursor` | `.cursor/hooks.json` | `.cursor/mcp.json` |
| **Claude 族** | `claude` · `qoder` · `trae` · `workbuddy` | Claude 系 + `claude-adapter.js` | 见下表 |
| **Codex 族** | `codex` | `.codex/hooks.json` + `codex-adapter.js` | `.codex/config.toml` |

## L3 软门禁（跨工具 · 按 ai_tools）

| `ai_tools` | 交付 |
|---|---|
| `cursor` | `.cursor/hooks.json` + `.cursor/hooks/*.js` |
| `claude` | `.claude/settings.json` + hooks + adapter |
| `qoder` | `.qoder/settings.json` + hooks + adapter |
| `trae` | `.trae/hooks.json` + hooks + adapter |
| `workbuddy` | `.codebuddy/settings.json` + hooks + adapter（全家桶） |
| `codex` | `.codex/hooks.json` + adapter + Stop + gate |
| L3 总是 | `.githooks/pre-commit` + gate `--git` |

### MCP example / 真密（L4+ · fill-mcp 0.5.2+）

| `ai_tools` | example | 真密 |
|---|---|---|
| `cursor` | `.cursor/mcp.json.example` | `.cursor/mcp.json` |
| `claude` / `qoder` / `workbuddy` | `.mcp.json.example` | `.mcp.json` |
| `trae` | `.trae/mcp.json.example` | `.trae/mcp.json` |
| `codex` | `.codex/config.toml.example` | `.codex/config.toml`（**trusted** 项目；`[mcp_servers.*]`） |

路径 SSOT：`scripts/lib/mcp-paths.mjs`（Claude/Cursor/Trae 的 `mcp.json`）；Codex 走 **config.toml**，见适配卡。calibrate-live：**JSON 真密优先**，其后回退项目 `.codex/config.toml` / `config.toml.example`（`env_vars`→本机环境变量）。  
**Trae**：磁盘写 `.trae/mcp.json` 后须在 IDE **Settings → MCP** 用开关启用；面板里 toggled-off 的 server **仍在场**（不是缺文件）。2026-09-14 实证见 [`_history/.../TRAE-P0-EVIDENCE.md`](../../_history/harness-eng-docs-archive/TRAE-P0-EVIDENCE.md)。  
**Codex**：项目 MCP 仅 trusted 加载；会话用 `/mcp`；**勿**假设根 `.mcp.json` 生效。人验见 [CODEX-MANUAL.md](CODEX-MANUAL.md)。

### hooks 家族

脚本统一 Cursor 协议；Claude 族经 `claude-adapter`；Codex 族经 `codex-adapter`。占位含 `HOOKS_*_GROUPS` / `HOOKS_CONFIG_ENTRIES`。登记表 `HOOK_DEFS`（含 workbuddy）。

## L5 配置 SSOT 管线

- 生成物：各 Claude 族目录含 rules/hooks/skills；CodeBuddy 含 hooks/settings/skills；根 `.mcp.json`（claude/qoder/workbuddy）；`.trae/mcp.json`；Codex：`.codex/{hooks,rules,config.toml.example}` + `.agents/skills/` 全量分发
- 默认生成器：`sync.mjs`；可选 Agent 生成见 [sync-hosts.md](sync-hosts.md)

## 与 fill 并行

契约工具无关；门禁以文件系统 + node 脚本为准；fill-mcp 多路径写入。

## 会话自证（session-live）

磁盘存在（detect `S_*`）≠ 当前会话已加载。当前宿主可跑 [session-live](../modes/session-live.md)：Agent 自证本会话 MCP/hooks/rules 可观测性；检查表 [session-live-checks.yaml](session-live-checks.yaml)。  
**与人验并行**：面板开关 / 热加载仍见各 P0 手册；`skipped_wrong_host` 表示须换到对应 IDE 再测。
