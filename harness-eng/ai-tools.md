# AI 编程工具面（Q_AI_TOOL）

真相与契约仍在 `AGENTS.md` + `docs/**`（**一份 SSOT**）。各工具生成**入口适配 + 宿主对齐交付**（rules 镜像 / hooks / MCP example）；业务 Never do / Pn 只留在 SSOT。

## 内置工具

| ID | 中文名 | 探测信号 | 生成入口（适配） |
|---|---|---|---|
| `cursor` | Cursor | `.cursor/` | 已由 L0 rules/AGENTS 覆盖；另写 `.cursor/rules/00-harness-ssot.mdc` 指针（可选加强） |
| `claude` | Claude Code | `CLAUDE.md` / `.claude/` | 根 `CLAUDE.md` → 指向 AGENTS + docs |
| `codex` | Codex | `.codex/` | 根 `AGENTS.md` 已够用；另写 `.codex/harness.md` 指针说明 |
| `qoder` | Qoder | `.qoder/` | `.qoder/rules/00-harness-ssot.md` + L3+ 全量 rules 镜像（`.md`） |
| `trae` | Trae | `.trae/` | `.trae/rules/00-harness-ssot.md` + L3+ 全量 rules 镜像（`.md`） |
| `workbuddy` | WorkBuddy / CodeBuddy | `.codebuddy/` / `CODEBUDDY.md` | `CODEBUDDY.md` + `.codebuddy/rules/00-harness-ssot.md` + L3+ rules 镜像 |

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
  C) Codex
  D) Qoder
  E) Trae
  F) WorkBuddy
  G) 自定义（请写：工具名=…; 入口路径=…）
不确定请回复：全部推荐（= 仅已探测项；若无探测则默认 Cursor）
```

## 纪律

- 多选时**都**生成对应适配；未选的不删已有用户文件（resume 时 skip）
- 适配正文只含：指向根 AGENTS、docs 优先级、勿复制密文
- `ai_tools` 写入 `.cursor/harness-meta.yaml`（YAML 列表）
- **宿主对齐（0.2.16+）**：非 `cursor` 工具额外写入 **契约 sync 镜像**（`1x-contract-sync.md`），含契约域 packs / globs 指针，避免宿主读不到 `.cursor/rules/*.mdc`
- **全量 rules 镜像（0.5.1+）**：L3+（非 L5）把 `.cursor/rules/*.mdc` 镜像到 qoder/trae（`.md`，strip frontmatter）与 workbuddy（`RULE.mdc`）；L5 由 `sync.mjs` 分发
- audit / detect：若 meta.`ai_tools` 含某工具但入口或镜像缺失 → 记反模式 / 缺口

## 契约 sync 镜像路径

| `ai_tools` | 镜像路径 |
|---|---|
| `workbuddy` | `.codebuddy/rules/1x-contract-sync.md` |
| `claude` | `.claude/rules/1x-contract-sync.md` |
| `codex` | `.codex/contract-sync.md` |
| `qoder` | `.qoder/rules/1x-contract-sync.md` |
| `trae` | `.trae/rules/1x-contract-sync.md` |
| `cursor` | 不另镜；已有 `.cursor/rules/11|12|13|16-*.mdc` |

模板：[templates/ai-tools/contract-sync-mirror.md.tmpl](templates/ai-tools/contract-sync-mirror.md.tmpl)。占位符 `GLOB_*` 与 path-scoped rules 一致。

## 协议族（0.5.1+）

| 族 | 成员 | hooks 形态 | MCP 主路径 |
|---|---|---|---|
| **Cursor 族** | `cursor` | `.cursor/hooks.json`（`beforeShellExecution` / `afterFileEdit` / …） | `.cursor/mcp.json` |
| **Claude 族** | `claude` · `qoder` · `trae` | Claude 系事件（`PreToolUse` / `PostToolUse` / `Stop`）+ `claude-adapter.js` | 见下表 |
| **基础门禁** | `workbuddy` · `codex` | settings / hooks.json + `--codebuddy` / `--codex`（仅基础 commit 门禁） | 不自动装 |

**勿**把 Qoder 当成「小 Cursor」写 `beforeShellExecution` 进 `.qoder/hooks.json`——官方认的是 `.qoder/settings.json` 的 `hooks` 段。

## L3 软门禁（跨工具 · 按 ai_tools）

| `ai_tools` | 交付 |
|---|---|
| `cursor` | `.cursor/hooks.json` + `.cursor/hooks/*.js`（按 hooks 家族选择） |
| `claude` | `.claude/settings.json`（hooks 段 merge）+ `.claude/hooks/*.js` + `claude-adapter.js` |
| `qoder` | `.qoder/settings.json`（hooks 段 merge）+ `.qoder/hooks/*.js` + `claude-adapter.js`（Claude 系） |
| `trae` | `.trae/hooks.json`（Claude 系嵌套格式）+ `.trae/hooks/*.js` + `claude-adapter.js` |
| `workbuddy` | `.codebuddy/settings.json`（hooks 段 merge）+ `.codebuddy/hooks/... --codebuddy`（仅基础门禁） |
| `codex` | `.codex/hooks.json`（merge）+ `.codex/hooks/... --codex`（仅基础门禁） |
| 自定义 | 不自动装 hooks |
| L3 总是 | `.githooks/pre-commit` + gate `--git`（仓外直接 `git commit` 兜底；建议 `git config core.hooksPath .githooks`） |

软提醒永不拦截提交（fail-open）。settings.json **只 merge hooks**，保留用户其它顶层键。

### MCP example（L4 · 按 ai_tools）

| `ai_tools` | example 路径（真密不入库；gitignore 忽略对应真密） |
|---|---|
| `cursor` | `.cursor/mcp.json.example` → 真密 `.cursor/mcp.json` |
| `claude` / `qoder` | 根 `.mcp.json.example` → 真密 `.mcp.json` |
| `trae` | `.trae/mcp.json.example` → 真密 `.trae/mcp.json` |

### hooks 家族（L3 选装，0.5.0+）

`Q_HOOKS_FAMILY` 多选装配，全部 fail-open；脚本统一 **Cursor 协议**，Claude 族经 `claude-adapter.js` 双向翻译：

| ID | Cursor 事件 | Claude 族事件 | 作用 |
|---|---|---|---|
| `commit-gate-extended` | beforeShellExecution（git commit/merge） | PreToolUse(Bash) | 五合一软门禁；与基础 `commit-gate` **互斥**（codex/codebuddy 仍为基础门禁） |
| `mysql-guard` | beforeMCPExecution | PreToolUse(mcp__mysql) | 分环境 DDL/DML 护栏 |
| `after-edit` | afterFileEdit | PostToolUse(Edit\|Write\|…) | migration / jobs yml 即时提醒 |
| `stop-checklist` | stop（loop_limit=1） | Stop | 未提交改动收口盲区 |

render 由 `scripts/lib/hooks-checks.mjs` 计算占位（`HOOKS_CURSOR_EVENTS` / `HOOKS_CLAUDE_GROUPS` / `HOOKS_QODER_GROUPS` / `HOOKS_TRAE_GROUPS` / `HOOKS_CONFIG_ENTRIES` / …），登记表 `HOOK_DEFS`。

## L5 配置 SSOT 管线（0.5.0+）

`Q_AGENT_CONFIG`（或 `Q_LADDER=L5`）启用后：

- SSOT：`docs/agent-config/`（rules / hooks.config.json / mcp / settings / skills）
- 生成器：`scripts/agent-config/sync.mjs`；`--check` 漂移校验（CI / commit 前）
- 生成物（0.5.1+）：`.cursor/rules|hooks|skills`、`.qoder/rules|hooks|settings|skills`、`.claude/settings|hooks|skills`、`CLAUDE.md`、`.trae/rules|hooks|skills`、`.codebuddy/rules`、根 `.mcp.json`（claude/qoder）、`.trae/mcp.json`（带 GENERATED 标记，**勿手改**）
- 与 L3 直渲**互斥**：render 在 L5 下把 `.cursor/rules/*` 改投 SSOT、跳过 sync 托管目标的直渲
- MATURE 仓 adopt：先把现有 `.cursor/rules` 等**反向拷贝**进 `docs/agent-config/` 布局再跑 sync（见 upgrade.md）

## 与 fill 并行

fill-truths / fill-truths-agents 多 shard 见 [fill-workers.md](fill-workers.md)：

- **契约工具无关**（只认 `.fill-work/` + merge 脚本）
- **默认同会话串行**；并行按上表各宿主多会话
- 门禁以文件系统 + node 脚本为准；启动说明尊重 meta.`ai_tools`（例：仅 workbuddy → CodeBuddy 多会话）
