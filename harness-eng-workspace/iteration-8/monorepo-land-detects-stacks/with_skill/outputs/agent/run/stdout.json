## 探测结果 — Fingerprint

| 信号 | 是/否 | 备注 |
|---|---|---|
| S_GIT | 是 | 全新仓库，零提交 |
| S_STACK | 是 | `backend/pom.xml` + `frontend/package.json` |
| S_SPRING | 是 | Spring Boot 3.3.4 |
| S_FRONTEND | 是 | React 18 + Vite 5 |
| S_EMPTY | 否 | 有栈入口文件（虽无 `src/`） |
| S_AGENTS_ROOT | 否 | 无根 `AGENTS.md` |
| S_RULES | 否 | 无 `.cursor/rules` 等 |
| S_FUNC / S_API / S_DB / S_REDIS / S_JOBS | 否 | 无契约目录与调度指纹 |
| S_HARNESS_META | 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| S_NO_FLYWAY | 是 | 无 Flyway 目录/配置 |
| S_SQL_DIR | 否 | 无手写 SQL |
| S_DB_ENGINE | — | 无 JDBC 依赖（空 POM） |
| S_STACK_REDIS | 否 | 无 Redis 依赖 |
| S_SLF4J | 否 | 无 Java 源码（Spring Boot 默认带，但 detect 按源码命中） |
| S_SECRETS_LEAK | 否 | `README.fixture.md` 无密 |
| S_CLAUDE | 是 | `.claude/` 存在（**注**：为 harness-eng skill 安装目录，非项目级外源配置） |
| S_MULTI_TOOL | 否 | 未探测到项目级 AI 工具入口 |
| S_ENV_PROFILES | [local] | 无 `application-*.yml`，默认 local |

**MCP 矩阵**：无 db/redis 引擎，暂无需 server 集合。  
**类型判定**：`NEW_CODE_NO_HARNESS`（有源码信号，无任何 harness 产物）。

---

## 推荐包 RecommendedProfile

- **模式**: `land` — 有代码无 harness，全量 scaffold
- **目标阶梯**: `L1`（契约骨架）— 满足「至少 L1」；空壳仓库 L3+ hooks/MCP 暂无实质 commit 可监视，建议先到 L1，有代码后再 `upgrade`
- **契约域**: `func, api, db` — Java/Maven 默认；无 Redis/Jobs 信号
- **分册**: `modules(all)` — 根薄 + `backend/` + `frontend/` 各一份分册
- **glob**: `wide`（小仓/空壳）
- **Rule14（中文文档）/ Rule17（前端协作）/ Rule21（可观测）**: 是 / 是 / **否**（无 SLF4J 源码命中，建议有代码后补装）
- **db 迁移模式**: `manual_sql`（无 Flyway）
- **安全预填 Q_SEED**: 是
- **AI 工具面**: `[]`（未探测到任何宿主；须你确认）
- **L5 SSOT 管线**: 否（单工具仓默认否）
- **Gate profile**: `strict`

> 不确定请回复：**全部推荐**（采用上表；收齐后出 WritePlan，写盘仍须确认）。

---

## 关键问题：前后端分册怎么处理？

本仓是**前后端分离 monorepo**，但 skill 的 `module_agents_template` 只能**全局设一个值**（`spring` / `frontend` / `default`），render 时**所有模块分册用同一个模板**。这导致：

| 方案 | backend/AGENTS.md | frontend/AGENTS.md | 评价 |
|---|---|---|---|
| A. `default`（通用分册） | 中性模板，留 TODO | 中性模板，留 TODO | ✅ 无错配，最干净 |
| B. `spring` | 专业 Spring 分册（Maven 纪律、DB Block、分层约定） | ❌ 也生成 Spring 分册（内容错配） | 后端收益高，但 frontend 需手工替换 |
| C. `frontend` | ❌ 生成前端分册 | 专业前端分册 | 后端错配 |
| D. `solo`（不分册） | — | — | 根 AGENTS 厚写，放弃「根薄分册厚」 |

**我的推荐**：选 **A（modules + default 通用分册）**。理由：
1. 空壳仓库无实际代码，通用分册的 TODO 占位符正好对应未来填充；
2. 避免 frontend 被强行塞入 Maven/Spring 内容；
3. 等 backend 有实体代码后，可 `upgrade` 为 `spring` 专业分册；frontend 同理可换 `frontend` 分册。

若你坚持 backend 现在就落专业 Spring 分册，可选 **B**，但需接受 `frontend/AGENTS.md` 首轮内容错配、后续手工替换。

---

## 提问（请回复编号或「全部推荐」）

### 第一批（全局与目标）

1. **Q_TARGET_ROOT**：`/tmp/skill-up-1720389881` — 确认？
2. **Q_MODE**：`land`（落地）— 确认？
3. **Q_LADDER**：`L1`（契约骨架）— 或你希望直接 `L2` / `L4`？
4. **Q_CONTRACT**：`func, api, db` — 或加减某个域？
5. **Q_NAME**：`stack-monorepo-fe-be`（取自 README）— 或有其他短名？

### 第二批（分册与栈）

6. **Q_MODULES**：`all`（根 + backend + frontend 各一份 AGENTS）— 或 `solo` / `few`？
7. **Q_MODULE_AGENTS**：`default`（通用分册）— 或你选 `spring` / `frontend`？（见上文分析）
8. **Q_STACK**：Spring Boot 3.3.4 + React 18 + Vite 5 — 确认？
9. **Q_GLOBS**：`stack_default`（栈默认 globs）— 确认？

### 第三批（规则与工具）

10. **Q_RULE14**：安装中文文档规则 — **是**？
11. **Q_RULE17**：安装前端协作规则 — **是**？
12. **Q_RULE21**：安装后端可观测/注释规则 — **否**？（Spring Boot 默认带 SLF4J，但无源码，建议暂缓）
13. **Q_DB_MIGRATION**：`manual_sql`（无 Flyway）— 确认？
14. **Q_AI_TOOL**：本仓要用哪些 AI 编程工具？（多选）
    - `cursor` / `claude` / `codex`（高·不做 .mdc 镜像）/ `qoder` / `trae`（高）/ `workbuddy` / 自定义

---

请回复**全部推荐**（按上表推荐值直接收齐），或逐题回答。收齐后我出 **WritePlan**（含文件清单与渲染预览），你再回复 **确认** 才进入写盘。
