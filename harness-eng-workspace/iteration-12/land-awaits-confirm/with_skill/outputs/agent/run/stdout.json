## WritePlan — 白话摘要

- **模式**：全新落地 `land` — 仓库尚无 harness 形态，本次从零 scaffold
- **阶梯**：**L0 协作入口** — 只装最薄骨架，让新 Agent 快速找到命令入口、文档优先级与红线占位
- **交付后能力**：根 `AGENTS.md`（含 Commands / Never do / 文档优先级）、`harness-meta.yaml`（版本与阶梯 SSOT）、alwaysApply 双规则（Karpathy 行为基线 + 项目文档总览）、可选中文文档规则 `14`
- **本轮不触及**：契约域（func/api/db…）、hooks、MCP、agent-kb、superpowers — 均留待后续升阶
- **冲突裁决已写清**：以磁盘最新为准；契约真相在 `docs/**`；本文件为协作总入口

---

## 技术摘要

```text
仓库类型: NEW_CODE_NO_HARNESS
目标根: /tmp/skill-up-2235893677
模式: land
目标阶梯: L0（协作入口）
契约域: （L0 不装；升 L1 默认 func, api, db）
agents_variant: solo
glob_profile: wide
on_exists: fail（空仓全新创建）
Q_SEED: 是（安全预填）
ai_tools: []（未探测到项目级配置；L0 规则仍落默认路径 .cursor/rules/）
预授权: 否
将新建: 5 | 合并: 0 | 跳过: 0 | 备份后创建: 0
风险: 无密钥泄漏；不触及 MCP；不新增 hooks；alwaysApply 规则为新增
```

| 目标路径 | 动作 | 模板源 | 阶梯 | 备注 |
|---|---|---|---|---|
| `AGENTS.md` | create | `agents/AGENTS.root.solo.md.tmpl` | L0 | solo 厚节；预填 repo_name / desc |
| `docs/harness-eng/harness-meta.yaml` | create | `meta/harness-meta.yaml.tmpl` | L0 | skill_version=0.7.23; ladder=L0; domains=[] |
| `.cursor/rules/karpathy-guidelines.mdc` | create | `rules/karpathy-guidelines.mdc` | L0 | alwaysApply: true |
| `.cursor/rules/00-project-docs-overview.mdc` | create | `rules/00-project-docs-overview.mdc.tmpl` | L0 | alwaysApply: true |
| `.cursor/rules/14-chinese-skill-docs.mdc` | create | `rules/14-chinese-skill-docs.mdc.tmpl` | L0 | optional；Q_RULE14=yes |

> 注：L0 自检清单要求 `.cursor/rules/` 为默认规则宿主路径。若后续使用 Cursor/Claude/Trae 等其他工具，可 `resume` / `upgrade` 补对应镜像与 hooks。

---

## 渲染预览

### `AGENTS.md`（预填后，前 25 行）

```markdown
# fixture-new-code — AGENTS.md

> AI 协作总入口。本仓**暂无**分册 `AGENTS.md`；契约真相见 `docs/func|api|db|redis|jobs`（按已启用域）。  
> **solo 模式**：定位 / 改动路径等「厚」约定写在本文件下方，勿写「见分册」。

## Critical

TODO(harness-eng): 写明本仓最易踩的构建/运行命令红线（例：必须在仓库根执行某工具）。

## 模块定位（solo 厚节）

| 项 | 说明 |
|---|---|
| 职责 | TODO(harness-eng): harness-eng NEW_CODE_NO_HARNESS fixture |
| 边界 | TODO(harness-eng): 本仓做什么 / 不做什么 |
| 技术栈 | TODO(harness-eng) |
| 入口 / 端口 | TODO(harness-eng) |

## Commands

| Task | Command |
|---|---|
| TODO | TODO(harness-eng): 填真实命令 |
```

### `.cursor/rules/00-project-docs-overview.mdc`（前 10 行）

```markdown
---
description: 项目文档总入口与优先级（alwaysApply；细节见 AGENTS）
alwaysApply: true
---

# 项目文档总入口

细节与命令以根 `AGENTS.md`、分册 `**/AGENTS.md` 为准；**勿把本 rule 当契约正文**。
```

### `.cursor/rules/karpathy-guidelines.mdc`（前 10 行）

```markdown
---
description: Behavioral guidelines to reduce common LLM coding mistakes...
alwaysApply: true
---

# Karpathy behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes...
```

---

## 确认闸门

**请回复 `确认`（或 `按计划执行` / `LGTM`）后开始写入文件。**  
多轮协作可回复 **`确认预授权`**（首轮仍需本次确认，后续 resume/fill 自动写盘）。

回复前**不会创建或修改**任何文件。
