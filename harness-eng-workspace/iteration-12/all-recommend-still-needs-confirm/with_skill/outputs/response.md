## Fingerprint 表

| 信号 | 状态 | 备注 |
|---|---|---|
| `S_GIT` | ✅ 是 | `/tmp/skill-up-2625236288` |
| `S_EMPTY` | ✅ 是 | 仅 `pom.xml`，无 `src/`、无源码入口、无 harness 指纹 |
| `S_AGENTS_ROOT` | ❌ 否 | — |
| `S_RULES` | ❌ 否 | 无 `.cursor/rules`、无 `.claude/rules` 等 |
| `S_FUNC` / `S_API` / `S_DB` / `S_REDIS` / `S_JOBS` | ❌ 否 | 无契约目录 |
| `S_FRONTEND` | ❌ 否 | — |
| `S_KB` | ❌ 否 | — |
| `S_HOOKS` | ❌ 否 | — |
| `S_MCP` | ❌ 否 | — |
| `S_CLAUDE` | ⚠️ 是 | `.claude/` 存在，**但为本次 skill 运行时产生**（`skills/harness-eng/` 等），非仓库原有资产 |
| `S_STACK` | ✅ 是 | `pom.xml`（Maven/Java） |
| `S_HARNESS_META` | ❌ 否 | — |
| `S_SECRETS_LEAK` | ❌ 否 | `pom.xml` 无密 |
| `S_SPRING` | ❌ 否 | `pom.xml` 无 `spring-boot` 依赖 |
| `S_SLF4J` | ❌ 否 | 无源码 |
| `S_MULTI_TOOL` | ❌ 否 | 仅 skill 运行时 `.claude/` |
| `S_AGENT_CONFIG` | ❌ 否 | — |

**MCP 矩阵**：无 db/redis 引擎信号，暂无需 MCP server。

---

## 类型判定

仓库近乎空仓（仅 `pom.xml` 骨架），无 harness 任何形态。`.claude/` 为本次 skill 运行时产生，**非仓库原有资产**；若排除该目录，本仓属 `NEW_CODE_NO_HARNESS`（有栈信号、无 harness）。

按您要求：**`mode=land`，目标阶梯 `L2`（知识回流）**。

---

## 推荐包 RecommendedProfile

- **模式**: `land` — 理由：用户明确"落地"
- **目标阶梯**: **L2** — 知识回流（含 L0 协作入口 + L1 契约骨架 + L2 agent-kb）
- **契约域**: `func, api` — 理由：Maven/Java 默认；`pom.xml` 空骨架，无 db/redis/jobs 信号
- **分册**: `solo`（单模块薄变体） — 理由：单模块、无子模块
- **glob**: `wide` — 理由：小仓
- **Rule14 / Rule21 / 安全预填**: **是** / 否 / **是**
- **AI 工具面**: `[]`（未探测到）— `.claude/` 为 skill 产物；须确认您实际使用的工具
- **MCP 跟踪策略**: `example_only`
- **fill**: MCP先行=否 · 深度=完整档 · 引擎=agents · 金标+sample_n=否 — 理由：无 db/redis 域，暂不进 fill
- **ready_coverage**: 0.8
- **gate_profile**: 不涉及（L2 无 hooks/MCP 硬门禁）

> 不确定请回复：**全部推荐**
> （或逐题选 A/B…；自定义工具请写「工具名=…; 入口路径=…」；写盘前仍需对 WritePlan 回复「确认」等）

---

## 提问（第 1 批，≤5 题）

| # | 问题 | 【推荐】 |
|---|---|---|
| **Q1** | **AI 工具面**：您使用哪个 AI 编程工具？（可多选）<br>A. Cursor　B. Claude Code（CLI/桌面）　C. Trae　D. Qoder　E. Codex（**高**·纪律 B）　F. 其他（请写入口路径） | 须您确认；**不**默认 Cursor |
| **Q2** | **契约域**：除 `func, api` 外，是否需要追加 `db` / `redis` / `jobs`？<br>（当前 `pom.xml` 为空骨架，无相关依赖信号） | `func, api` 保持；**不**追加 |
| **Q3** | **Rule 14**：是否安装代码质量红线（`14-code-quality-redline.mdc`）？ | **是** |
| **Q4** | **glob 档位**：`wide`（全仓默认）还是 `focused`（收窄到指定包前缀）？ | **wide**（小仓） |
| **Q5** | **并存确认**：`.claude/` 为本次 skill 运行时目录，**非**仓库原有资产。按 `NEW_CODE_NO_HARNESS` 直接 scaffold，无需 foreign 并存策略。是否同意？ | **同意** |

请回复题号+选项（如 `Q1=A,B`），或回复 **全部推荐**。收齐后我将出示 **WritePlan**（白话摘要 + 预览），等您确认闸门后再写盘。
