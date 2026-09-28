探测完毕。下面是完整的 **Fingerprint**、**类型判定** 与 **RecommendedProfile**；随后进入条件提问（每批 ≤5 题）。

---

## 🔍 Fingerprint 表

| 信号 | 值 | 备注 |
|---|---|---|
| `S_GIT` | ✅ | git 已初始化，尚无 commit |
| `S_EMPTY` | ✅ | 无 `src/`、无 harness 指纹 |
| `S_STACK` | ✅ | `pom.xml`（Maven） |
| `S_NO_FLYWAY` | ✅ | 无 Flyway 目录/配置 |
| `S_CLAUDE` | ⚠️ | `.claude/` 存在，但**此为 skill 自身安装目录，非用户既有 AI 工具配置** |
| `S_AGENTS_ROOT` | ❌ | 无 |
| `S_RULES` | ❌ | 无 |
| `S_FUNC` / `S_API` / `S_DB` / `S_REDIS` / `S_JOBS` | ❌ | 无契约目录 |
| `S_HOOKS` / `S_MCP` / `S_HARNESS_META` | ❌ | 无 |
| `S_SECRETS_LEAK` | ❌ | 无泄露线索 |
| `S_ENV_PROFILES` | `[local]` | 无 profile 文件，默认 local |
| `S_DB_ENGINE` / `S_STACK_REDIS` | — | 无依赖，未探测到引擎 |
| `S_SPRING` / `S_SLF4J` | ❌ | pom.xml 无相关依赖 |

**类型判定**: `NEW_CODE_NO_HARNESS`（有栈信号，无任何 harness 产物）

---

## 📦 RecommendedProfile

- **模式**: `land` — 理由：有代码（pom.xml）但无 harness，全量脚手架
- **目标阶梯**: `L4 工具连接样例` — 理由：小仓默认骨架一次到位；你要求"至少 L0"，L0–L4 均可，规范默认推 L4（如只想 L0/L1/L2 请在下方选）
- **契约域**: `func, api, db` — 理由：Java/Maven 默认三域；仓库当前为空，预建骨架待后续填充
- **分册**: `solo` — 理由：单模块/无模块
- **glob**: `wide` — 理由：小仓
- **Rule14 / Rule21 / 前端协作包 / 安全预填**: 是 / 否 / 否 / 是
- **AI 工具面**: `[]` — **未探测到任何 AI 工具配置，须至少选一项**
- **MCP 跟踪策略**: `example_only`（仅 example 入库，真密走 `.gitignore`）
- **db 迁移模式**: `manual_sql` — 推荐：无 Flyway，且为空仓
- **gate_profile**: `strict`

> 不确定请回复：**全部推荐**
> （或逐题选 A/B…；自定义工具请写「工具名=…; 入口路径=…」）

---

## ❓ 条件提问（第 1 批）

本仓当前无任何 AI 工具入口，以下问题需你确认：

1. **Q_LADDER — 目标阶梯？**
   - A. `L0` 协作入口（AGENTS + rules + meta，无契约骨架）
   - B. `L1` 契约骨架（+ func/api/db 索引与 sync rules）
   - C. `L2` 知识回流（+ agent-kb）
   - D. `L4` 工具连接样例（+ hooks 软提醒 + MCP example）⭐ **推荐**
   - E. `L5` 配置 SSOT 管线（多工具仓才推）

2. **Q_AI_TOOL — 本仓使用哪些 AI 编程工具？**（至少选一项，多选）
   - A. `cursor`
   - B. `claude`（Claude Code）
   - C. `codex`（高 · 纪律 B；不做 `.mdc` 镜像）
   - D. `qoder`
   - E. `trae`（高）
   - F. `workbuddy`
   - G. `自定义`（请写「工具名=…; 入口路径=…」）

3. **Q_NAME — 仓库短名？**
   - 推荐：`fixture-new-code`（来自 pom.xml `<artifactId>`）

4. **Q_DESC — 一句话职责？**
   - 推荐：`harness-eng NEW_CODE_NO_HARNESS fixture`（来自 pom.xml `<description>`）

5. **Q_DB_MIGRATION — db 域迁移模式？**（若选 L1+）
   - A. `manual_sql`（人工按序执行 SQL；无 Flyway）⭐ **推荐**
   - B. `flyway`
   - C. `none`

---

请回复题号+选项（如 `1-D, 2-A, 3-推荐, 4-推荐, 5-A`），或直接回复 **全部推荐**。收齐答题后，我将出示 **WritePlan**（白话摘要 + 文件预览），等你回复「确认」再写盘。
