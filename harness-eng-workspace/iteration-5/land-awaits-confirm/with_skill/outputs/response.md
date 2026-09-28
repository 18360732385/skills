## 探测结果：Fingerprint

| 信号 | 状态 | 备注 |
|---|---|---|
| `S_GIT` | ✅ | 有 `.git` |
| `S_STACK` | ✅ | `pom.xml` — Maven/Java |
| `S_EMPTY` | ❌ | 有 `pom.xml`，非空 |
| `S_AGENTS_ROOT` | ❌ | 无根 `AGENTS.md` |
| `S_RULES` | ❌ | 无 `.cursor/rules`、`.claude/rules` 等 |
| `S_FUNC/S_API/S_DB/S_REDIS/S_JOBS` | ❌ | 无契约目录 |
| `S_KB` | ❌ | 无 `docs/agent-kb/` |
| `S_HARNESS_META` | ❌ | 无 harness 元数据 |
| `S_SPRING` | ❌ | `pom.xml` 无 `spring-boot` |
| `S_SLF4J` | ❌ | 无源码 |
| `S_NO_FLYWAY` | ✅ | 无 Flyway 目录/配置 |
| `S_FRONTEND` | ❌ | 无前端工程 |
| `S_MULTI_TOOL` | ❌ | 无 AI 工具面 |
| `S_ENV_PROFILES` | `[local]` | 无 profile 文件，默认 local |
| `S_SECRETS_LEAK` | ❌ | 未检出 |

**类型判定**：`NEW_CODE_NO_HARNESS`（有 Maven 骨架，无 harness 任何信号）  
**定根**：单根 `//wsl.localhost/Ubuntu/tmp/skill-up-508534743`，无需额外确认。

---

## 推荐包 RecommendedProfile

- **模式**: `land` — 理由：新代码无 harness，用户已点名落地
- **目标阶梯**: **L4 工具连接样例** — 理由：小仓默认一次到位 hooks/MCP；您说"至少 L0"，骨架可直达 L4
- **契约域**: `func, api, db` — 理由：Java/Maven 默认三域；无 Redis/Scheduler 指纹
- **分册**: `solo`（仅根 AGENTS）— 理由：单模块小仓
- **glob**: `wide`（全仓）— 理由：小仓
- **Rule14 / Rule21 / 前端协作**: **是 / 否 / 否** — 理由：无 SLF4J 源码、无前端工程
- **db 迁移模式**: `manual_sql` — 理由：无 Flyway，后续手写 SQL 场景
- **AI 工具面**: `[]`（未探测到）— 理由：无 `.cursor/`、`.claude/` 等入口
- **MCP 跟踪策略**: `example_only`
- **安全预填**: 推荐 **是**
- **L5 SSOT 管线**: 推荐 **否** — 理由：单工具面未探测到

不确定请回复：**全部推荐**  
（或逐题选答；自定义工具请写「工具名=…; 入口路径=…」）

---

## 提问（第 1 批，≤5 题）

1. **Q_LADDER — 目标阶梯？**  
   推荐 **L4**（L0 协作入口 → L1 契约骨架 → L2 知识回流 → L3 规划与软门禁 → **L4 工具连接样例**）。您说"至少 L0"，是否按 L4 推进，或只要 L0/L1/L2/L3？

2. **Q_CONTRACT — 启用哪些契约域？**（若阶梯 ≥ L1 时生效）  
   推荐多选：`func` + `api` + `db`

3. **Q_NAME — 仓库短名？**  
   推荐：`fixture-new-code`

4. **Q_DESC — 一句话职责？**  
   推荐：`harness-eng NEW_CODE_NO_HARNESS fixture`

5. **Q_MODULES — AGENTS 分册策略？**  
   推荐：`solo`（仅根一份 AGENTS，不分模块）

请回复您的选择，或回复 **全部推荐**。收齐后我将出示 WritePlan（白话摘要 + 产物预览），**经您确认闸门后才写盘**。
