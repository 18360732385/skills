---

## 定根

`git rev-parse --show-toplevel` → `//wsl.localhost/Ubuntu/tmp/skill-up-709474557`  
单根，无多工作区歧义。

---

## Fingerprint 信号表

| 信号 | 是/否 | 备注 |
|---|---|---|
| S_GIT | ✅ 是 | |
| S_EMPTY | ❌ 否 | 有 `pom.xml` |
| S_AGENTS_ROOT | ❌ 否 | 无根 `AGENTS.md` |
| S_AGENTS_MOD | ❌ 否 | |
| S_RULES | ❌ 否 | 无 `.cursor/rules/*`、`.claude/rules/*` 等 |
| S_00 | ❌ 否 | |
| S_FUNC / S_API / S_DB / S_REDIS / S_JOBS | ❌ 否 | 无 `docs/` 契约目录 |
| S_KB / S_SP | ❌ 否 | |
| S_HOOKS / S_MCP | ❌ 否 | |
| S_CLAUDE | ⚠️ 是 | `.claude/` 存在，但仅含 `skills/harness-eng/` skill 自身文件，**非项目 AI 配置** |
| S_STACK | ✅ 是 | `pom.xml`（Maven/Java） |
| S_HARNESS_META | ❌ 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| S_SECRETS_LEAK | ❌ 否 | |
| S_NO_FLYWAY | ✅ 是 | 无 `db/migration/**`、无 flyway 配置 |
| S_SQL_DIR | ❌ 否 | |
| S_DB_ENGINE | — | 空集（无 JDBC 依赖/配置） |
| S_STACK_REDIS | ❌ 否 | |
| S_SLF4J | ❌ 否 | 无 Java 源码 |
| S_SPRING | ❌ 否 | `pom.xml` 无 `spring-boot` |
| S_AGENT_CONFIG | ❌ 否 | |
| S_MULTI_TOOL | ❌ 否 | |
| S_ENV_PROFILES | `[local]` | 无 profile 文件，默认 local |

**MCP 矩阵**：无引擎 × 无凭证 → 无应有 server 集合。

---

## 类型判定

**NEW_CODE_NO_HARNESS**（有代码栈 `pom.xml`，无 `AGENTS.md`，无 rules，无契约目录）

---

## 推荐包 RecommendedProfile

- **模式**: `land` — 理由：NEW_CODE_NO_HARNESS，用户已点名落地
- **目标阶梯**: `L4` — 理由：小仓默认一次到位（hooks/MCP example）；您说"至少 L0"，如只想先 `L1/L2` 可改
- **契约域**: `func, api, db` — 理由：Java/Maven 默认骨架；无 Redis/Jobs 信号
- **分册**: `solo` — 理由：单模块，无子模块结构
- **glob 档位**: `wide` — 理由：小仓/单模块，当前无源码
- **Rule14 / Rule21 / Rule17**: `是 / 否 / 否` — 理由：S_SLF4J 否；S_FRONTEND 否
- **AI 工具面**: `[]`（未探测到）— 理由：无 `.cursor/rules`、无 `CLAUDE.md`；`.claude/` 仅含 skill 文件，非项目配置
- **MCP 跟踪策略**: `example_only`
- **db 迁移模式**: `manual_sql` — 理由：S_NO_FLYWAY
- **安全预填 (seed)**: `是`
- **L5 配置 SSOT 管线**: `否` — 理由：单工具面，S_MULTI_TOOL 否
- **开干覆盖率**: `0.8`
- **gate_profile**: `strict`

> 不确定怎么选？可直接回复：**全部推荐**  
> （或逐题选 A/B…；自定义工具请写「工具名=…; 入口路径=…」；写盘前仍需对 WritePlan 回复「确认」等）

---

## 条件提问（第 1 批，≤5）

基于 `batch-1-new` + `batch-1-new-b` 合并，当前仓库无源码、无多模块，以下问题需要您确认：

**1. 目标阶梯 `Q_LADDER`**  
您希望落地到哪一阶？  
A. `L0` — 仅协作入口（AGENTS + 根规则索引）  
B. `L1` — 契约骨架（+ func/api/db 目录与规则）  
C. `L2` — 知识回流（+ agent-kb）  
D. `L3` — 规划与软门禁（+ hooks）  
E. `L4` — 工具连接样例（+ MCP example）【推荐】  
F. `L5` — 配置 SSOT 管线（多工具仓；本仓暂不推荐）

**2. AI 工具面 `Q_AI_TOOL`**（必选，影响生成的入口适配文件）  
本仓要用哪些 AI 编程工具？（可多选）  
A. `cursor` — Cursor  
B. `claude` — Claude Code  
C. `codex` — Codex（高 · 不做 `.mdc` 镜像）  
D. `qoder` — Qoder  
E. `trae` — Trae（高）  
F. `workbuddy` — WorkBuddy  
G. 不装任何工具面适配，仅落 `docs/` 与 `AGENTS`（纯文档骨架）

**3. 仓库短名 `Q_NAME`**  
推荐：`fixture-new-code`（来自 `pom.xml` `<artifactId>`）  
是否采用？或改为：

**4. 一句话职责 `Q_DESC`**  
推荐：`harness-eng NEW_CODE_NO_HARNESS fixture`（来自 `pom.xml` `<description>`）  
是否采用？或改为：

**5. db 迁移模式 `Q_DB_MIGRATION`**  
当前无 Flyway、无手写 SQL 目录。db 域骨架的迁移模式：  
A. `manual_sql`（人工按序执行）【推荐】  
B. `none`（无迁移脚本）  
C. `flyway`

---

请回复选项（如 `1-E, 2-A, 3-推荐, 4-推荐, 5-A`），或回复 **全部推荐**。收齐后我输出 **WritePlan**（白话摘要 + 预览），经您确认闸门后再写盘。
