## 探测结果 Fingerprint

| 信号 | 是/否 | 备注 |
|---|---|---|
| `S_GIT` | 是 | git 根 `/tmp/skill-up-1739498757` |
| `S_EMPTY` | **近空** | 有 `pom.xml`（Maven 标识），但无 `src/`、无 Java 源码、无 harness 指纹 |
| `S_STACK` | 是 | Maven (`pom.xml`)；`artifactId=fixture-new-code` |
| `S_SPRING` | 否 | pom.xml 无 `spring-boot` 依赖 |
| `S_SLF4J` | 否 | 无 Java 源码可扫描 |
| `S_AGENTS_ROOT` | 否 | 无根 `AGENTS.md` |
| `S_RULES` | 否 | 无 `.cursor/rules`、`.claude/rules` 等任何宿主规则 |
| `S_HOOKS` | 否 | 无 hooks 配置 |
| `S_MCP` | 否 | 无 `mcp.json` / `mcp.json.example` |
| `S_FUNC` / `S_API` / `S_DB` / `S_REDIS` / `S_JOBS` | 否 | 无契约目录 |
| `S_FRONTEND` | 否 | 无前端包 |
| `S_HARNESS_META` | 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| `S_AGENT_CONFIG` | 否 | 无 `docs/agent-config/` |
| `S_MULTI_TOOL` | 否 | 仅 `.claude/` 为 skill 工作区，非宿主入口 |
| `S_SECRETS_LEAK` | 否 | 无命中 |
| `S_SQL_DIR` | 否 | 无手写 SQL 目录 |
| `S_ENV_PROFILES` | `[local]` | 无 `application-*.yml` 等 profile 文件，默认 local |

**仓库类型判定**：`NEW_CODE_NO_HARNESS`（有栈标识、无 harness 信号）→ 全量 scaffold。

---

## 推荐包 RecommendedProfile

- **模式**: `land` — 全量脚手架
- **目标阶梯**: **L5（配置 SSOT 管线）** — 用户指定
- **契约域**: `func, api, db` — Maven 默认；近空仓可后续随源码扩张再补 redis/jobs
- **分册**: `solo`（单仓无子模块）
- **glob**: `wide`（小仓/空仓）
- **Rule14 / Rule21 / Rule17 / 安全预填**: 是 / 否 / 否 / 是
- **AI 工具面**: `cursor` + `codex` — 用户指定
  - **Codex = 高（推荐纪律 B）**：`sync.mjs` 发出原生 Starlark rules / hooks / MCP toml / skills；**不做** `.mdc` 镜像
- **MCP 跟踪策略**: `example_only`（无明文密文入库）
- **agent_config**: **是** — L5 配置 SSOT 管线；多工具仓推荐
- **hooks 家族**: `commit-gate-extended, after-edit`（L3+ 默认）
- **fill**: 空仓暂无 db/redis 实据，暂不触发 `fill-mcp` 矩阵闸；MCP 仅装 example
- **gate_profile**: `strict`
- **ready_coverage**: `0.8`

---

## 提问批次（≤5）

| # | 问题 | 推荐选项 |
|---|---|---|
| Q1 | **domains 确认**：当前近空仓，是否仍保留 `func, api, db` 三域骨架？（后续源码扩张可直接填入） | 【推荐】保留三域；若只想最小集可回复 `func,api` 或 `func` |
| Q2 | **预授权**：是否确认预授权后续 `resume` / `fill-*` 轮次自动写盘？ | 否（默认逐轮确认） |

可直接回复：**全部推荐**（= 保留三域、不预授权）。  
或回复：**确认**（若对以上推荐无异议，直接进入 WritePlan）。

---

## WritePlan 预览

### 白话摘要

- **模式**: 全新落地 `land` — 仓库从无 harness 工程化骨架到完整 L5。
- **阶梯**: 直达 **L5（配置 SSOT 管线）** — 契约真相、软门禁、MCP 样例、多工具配置管线一次装齐。
- **AI 工具面**: 同时托管 **Cursor**（原生 `.mdc` rules + hooks）与 **Codex**（Starlark rules + TOML MCP + skills）— 两者共用同一份 `AGENTS.md` + `docs/**` 契约真相。
- **SSOT 机制**: 不再直渲 `.cursor/rules` 或 `.codex/rules`；所有宿主配置以 `docs/agent-config/` 为唯一真相源，经 `sync.mjs` 幂等分发到各工具目录，漂移可检。
- **风险**: 近空仓，大量占位符将写为 `TODO(harness-eng)`；P0 移交需人工核实红线与 Commands。

### 技术摘要

```
仓库类型: NEW_CODE_NO_HARNESS
目标根: /tmp/skill-up-1739498757
模式: land
目标阶梯: L5（配置 SSOT 管线）
契约域: func, api, db
agents_variant: solo
glob_profile: wide
on_exists: fail（空仓）
Q_SEED: 是
ai_tools: [cursor, codex]
agent_config: true
将新建: ~25（SSOT + L0–L5 骨架） | 合并: 0 | 跳过: 0
风险: 触及 MCP=是（example_only）；S_SECRETS_LEAK=否；Codex=高·纪律B
```

### hooks / rules 如何经 SSOT 与 sync 落地（L5 核心机制）

| 层级 | 内容 | 说明 |
|---|---|---|
| **SSOT 真相源** | `docs/agent-config/` | `rules/`（含 `00-harness-ssot.mdc`、`11/12/13/16-*-sync*.mdc`）、`hooks/hooks.config.json`、MCP settings |
| **分发引擎** | `scripts/agent-config/sync.mjs` | 幂等脚本；从 SSOT 读取规格 → 按 `ai_tools` 列表生成各宿主目录 |
| **Cursor 侧生成物** | `.cursor/rules/*.mdc`、`.cursor/hooks.json` | 由 sync 分发；带 `GENERATED` 标记；**勿手改**（手改会被 `--check` 标漂移） |
| **Codex 侧生成物** | `.codex/rules/*.star`（Starlark）、`.codex/hooks.json`、`.codex/config.toml.example`、`.agents/skills/` | 原生 Codex 协议；**不做** `.mdc` 镜像；纪律 B |
| **hooks 统一协议** | `docs/agent-config/hooks/hooks.config.json` 驱动 | Cursor 族直用；Claude 族经 `claude-adapter.js`；Codex 族经 `codex-adapter.js` 转译事件 |
| **漂移校验** | `node scripts/agent-config/sync.mjs --check` | 比对生成物与 SSOT；不一致时报错；CI/本地可挂 |
| **变更流程** | 改 `docs/agent-config/` → 跑 `sync.mjs` → 各工具目录同步更新 | 禁止直接改 `.cursor/rules` 或 `.codex/rules`；防止「宿主孤儿」与 SSOT 分叉 |

**所有权声明**：L5 下，`.cursor/rules/`、`.codex/rules/` 等宿主目录属 `sync.mjs` 托管；land 过程先写 SSOT + sync 脚本，随后触发一次 sync 完成首次分发。

### 拟装文件预览（SSOT 侧）

| 目标路径 | 动作 | 模板源 | 阶梯 |
|---|---|---|---|
| `AGENTS.md` | create | `templates/agents/AGENTS.root.solo.md.tmpl` | L0 |
| `docs/harness-eng/harness-meta.yaml` | create | `templates/_meta/harness-meta.yaml.tmpl` | L0 |
| `.cursor/rules/karpathy-guidelines.mdc` | **sync 生成** | `templates/rules/karpathy-guidelines.mdc` → 经 sync | L0 |
| `.cursor/rules/00-project-docs-overview.mdc` | **sync 生成** | `templates/rules/00-project-docs-overview.mdc` → 经 sync | L0 |
| `docs/agent-config/README.md` | create | `templates/agent-config/README.md.tmpl` | L5 |
| `docs/agent-config/rules/00-harness-ssot.mdc` | create | `templates/agent-config/rules/00-harness-ssot.mdc.tmpl` | L5 |
| `docs/agent-config/rules/11-func-sync.mdc` | create | `templates/agent-config/rules/11-func-sync.mdc.tmpl` | L1 |
| `docs/agent-config/rules/12-api-sync.mdc` | create | `templates/agent-config/rules/12-api-sync.mdc.tmpl` | L1 |
| `docs/agent-config/rules/13-db-sync.mdc` | create | `templates/agent-config/rules/13-db-sync.mdc.tmpl` | L1 |
| `docs/agent-config/rules/14-security.mdc` | create | `templates/agent-config/rules/14-security.mdc.tmpl` | L0 |
| `docs/agent-config/rules/16-kb-sync.mdc` | create | `templates/agent-config/rules/16-kb-sync.mdc.tmpl` | L2 |
| `docs/agent-config/hooks/hooks.config.json` | create | `templates/agent-config/hooks/hooks.config.json.tmpl` | L3 |
| `scripts/agent-config/sync.mjs` | create | `templates/agent-config/sync.mjs` | L5 |
| `.cursor/hooks.json` | **sync 生成** | 由 `sync.mjs` 从 `hooks.config.json` 分发 | L3 |
| `.codex/hooks.json` | **sync 生成** | 由 `sync.mjs` 从 `hooks.config.json` 经 `codex-adapter.js` 分发 | L3 |
| `.codex/config.toml.example` | **sync 生成** | 由 `sync.mjs` 分发（MCP example，无密） | L4 |
| `.githooks/pre-commit` + gate | create | `templates/githooks/pre-commit` / `gate.mjs` | L3 |
| `docs/func/func.md` + `templates/` + `modules/README.md` | create | `templates/docs/func/` | L1 |
| `docs/api/api.md` + `templates/` + `modules/README.md` | create | `templates/docs/api/` | L1 |
| `docs/db/db.md` + `templates/` + `table/README.md` | create | `templates/docs/db/` | L1 |
| `docs/agent-kb/`（4 文件） | create | `templates/docs/agent-kb/` | L2 |
| `docs/superpowers/README.md` + `ARCHIVE.md` | create | `templates/docs/superpowers/` | L3 |
| `docs/harness-eng/mcp-usage-guide.md` | create | `templates/docs/harness-eng/mcp-usage-guide.md` | L4 |
| `.cursor/mcp.json.example` / `.mcp.json.example` | create | `templates/mcp/mcp.json.example` | L4 |
| `.gitignore` snippet（建议忽略真密 mcp.json） | merge | snippet | L4 |

> 注：L5 下 `.cursor/rules/*.mdc`、`.codex/rules/*.star`、`.codex/hooks.json`、`.agents/skills/` 等**不**由 land 直渲，而由 `sync.mjs` 首次运行生成；写入后可通过 `node scripts/agent-config/sync.mjs --check` 验漂移。

### 装后烟测（L3+ / L4 / L5）

- **hooks**：`.cursor/hooks.json` + `.codex/hooks.json` + `.githooks/pre-commit` 均 fail-open（软提醒，不拦截提交）。
- **MCP**：仅 `.cursor/mcp.json.example` / `.mcp.json.example` / `.codex/config.toml.example`；真密不入库。
- **sync**：跑 `node scripts/agent-config/sync.mjs --check` 应无漂移报错。
- **gitignore**：建议追加 `.cursor/mcp.json`、`.mcp.json`、`.trae/mcp.json`。

---

## 确认闸门

请回复 **确认**（或 `按计划执行` / `LGTM`）后开始写入。  
多轮可回复 **确认预授权**（后续 `resume` / `fill-*` 自动写盘，无需再等闸门）。

**硬闸**：在未收到上述确认前，本 skill **不会**写入任何文件，也不会直接往 `.codex/hooks` 落最终脚本。
