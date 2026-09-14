# harness-eng CHANGELOG（至 0.4.x）

> **归档**。0.5.0 起见仓库根 [CHANGELOG.md](../CHANGELOG.md)。本文件保留 0.4.0 及更早条目，供对照，不在技能热路径。

## 0.4.0 — 2026-08-24（包模型：前端协作包 / 分册变体 / merge 预览 / 迁移模式）

### 产品

- **前端协作包落地**：`templates/rules/17-frontend-web.mdc.tmpl`（去域化：契约同步 + 禁用清单 + 改动路径；`{{GLOB_FRONTEND}}` / `{{FRONTEND_DIR}}`）；manifest `rule-17`（optional）；`Q_FRONTEND_RULE`（`recommended_when: S_FRONTEND`）；`domains.yaml` packs.frontend 去 `sms-ai-web` 专名 + `detect: [S_FRONTEND]`
- **backend-spring 分册变体**：`templates/agents/AGENTS.module.spring.md.tmpl`（Maven 根执行 / `-am` 禁令 / 迁移纪律 / 分层约定）；render 新增 `params.module_agents_template`；`Q_MODULE_AGENTS`（`S_SPRING` 推荐）
- **resume 章节级 merge 预览**：render.mjs 新增 `previewMarkdownMerge`；`--dry-run` 与真实 merge 日志均回写 `mergePreview.append / .keep`（H2 级）；resume.md / write-plan.md 要求 WritePlan 列「将追加章节」
- **manual_sql 迁移模式**：`Q_DB_MIGRATION`（flyway / manual_sql / none；`S_NO_FLYWAY` 荐 manual_sql）；rule 13 模板 +「迁移模式」节；db 索引模板 +「迁移模式」声明行（`{{DB_MIGRATION_MODE}}`）；domains.yaml db 记 `migration_modes`

### 版本钉

- manifest / meta / questions / domains / README / QUICKSTART / VERIFY → `0.4.0`
- detect：`S_SPRING` 信号 + `GLOB_FRONTEND` 默认 + manual_sql 映射；推荐包 +rule17 / module_agents / db_migration 行；glossary +分册变体 / manual_sql
- selfcheck → `selfcheck-0.4.0.mjs`；`0.3.10` → archive

## 0.3.10 — 2026-08-24（行为包：rule 21）

### 产品

- 新增 **行为包**（`domains.yaml` packs `kind: behavior`）：非契约的行为约束规则，不进 fill-score 权重、不配 morph / acceptance；首包 = **rule 21 后端可观测与注释**
- `templates/rules/21-observability-comments.mdc.tmpl`：源仓 rule 21 去域化（SLF4J 步骤日志 + Throwable 最后一参 + Java/yml 增量中文注释；`{{GLOB_OBSERVABILITY}}` 占位）
- detect：`S_SLF4J` 信号 + `GLOB_OBSERVABILITY` Java 默认 globs；非 Java 栈不装
- questions：`Q_RULE21`（batch-1-new-b / batch-1-partial；`recommended_when: S_SLF4J`）；推荐包推断规则 +rule21 行
- 00 薄片新增「日志/注释」槽；ladder L0 / audit L0 行为包勾选行；glossary +行为包
- manifest：rule-21（optional，随 `include_optional` 装配，同 rule-14 机制）+ `GLOB_OBSERVABILITY` 占位符

### 版本钉

- manifest / meta / questions / domains / README / QUICKSTART / VERIFY → `0.3.10`
- selfcheck → `selfcheck-0.3.10.mjs`；`0.3.9` → archive

## 0.3.9 — 2026-08-24（源仓纪律回灌）

### 产品

- 根 AGENTS 模板（solo / modules）：Repo structure / 文档优先级 / rules 行补 **jobs、releases**（0.3.4 加域后模板未跟上的欠账）
- 00 模板：新增「**提交门禁**」节（superpowers 收口 + `Pn` 回流两句；源仓 alwaysApply 已验证形态）
- rule 19 模板：回灌「**文档职责**」+「**回流（强制）**」表；回流门禁补充「path-scoped 不自动注入」说明
- audit：反模式新增 **`pitfalls.md` Pn 重号**；L2 允许 agent-kb 扩展文档（playbook 不记缺口）；建议下一阶新增 **write-meta-only**（MATURE 无 meta 时仅写 meta 快照，不渲染模板）
- questions：batch-3-l3l4 新增 **`Q_MCP_TRACKING`**（L4）；`vendored_shared` 从脚注进提问（recommended-profile 加指针）
- glossary：+`write-meta-only`

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.9`
- selfcheck → `selfcheck-0.3.9.mjs`；`0.3.8` → archive

## 0.3.8 — 2026-08-14（writing-for-agents P0–P3）

### 产品

- **P0**：热路径统一 `fill-merge.mjs --domain <id>`（pipeline-fill / workers / agents / truths）；api 专属 `--enrich-dto`/`--module` 仍脚注 `fill-merge-api`；QUICKSTART jobs 去重；README 只钉当前版
- **P1**：`templates/_meta/morph-required.yaml` 外置 TEMPLATE_REQUIRED；`scripts/lib/morph-required.mjs` + `NAMED_TESTS`；[domain-extend.md](domain-extend.md) 诚实边界更新
- **P2**：SKILL 模式表压出 legacy/脚本；glossary 报告字段 disclose → fill-score「报告字段速查」
- **P3**：`四域`→契约域；merge 薄包装 compat 头注；archive OPTIMIZATION **非路线图**

### 版本钉

- manifest / meta / questions / domains / packs / score-policy / README / QUICKSTART / VERIFY → `0.3.8`
- selfcheck → `selfcheck-0.3.8.mjs`；`0.3.7` → archive

## 0.3.7 — 2026-08-14（域名单去硬编码）

### 产品

- **名单 SSOT**：`defaultContractDomains` / `knownContractDomainIds` 驱动 acceptance `all`、fill-plan / seed / auto 默认、ai-coding-gate、todo 扫描路径、report-ui 域循环
- **路径**：`truthsPath` / `fillWorkPath` / `scan_fill_work`（domains.yaml）；`domainLabel` 供 merge
- **acceptance**：`ACCEPTANCE_BY_DOMAIN` 分发；加域注册 checker，不再改 `if/else` 链
- **`fill-merge.mjs --domain <id>`** 统一入口（旧 `fill-merge-*` 薄包装保留）
- [domain-extend.md](domain-extend.md) 对齐 0.3.7 诚实边界（morph 仍要码）

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.7`
- selfcheck → `selfcheck-0.3.7.mjs`；`0.3.6` → archive

## 0.3.6 — 2026-08-14（指针 / scheduler_link / 加域 recipe）

### 产品

- **P0**：SKILL description 含 Cron/jobs；分支表 → [domain-extend.md](domain-extend.md)；QUICKSTART jobs 场景；glossary packs / scheduler_link；措辞改为 L1 packs **数据展开**（非零代码）
- **P1**：`fill-inventory-jobs` 输出 `scheduler_link`/`cron_link`（exact|heuristic|none）；多任务争用 method → heuristic + warning；acceptance `jobs-heuristic-unmarked` / `jobs-heuristic-in-ssot`
- **P2**：[domain-extend.md](domain-extend.md) checklist；fill-workers / fill-plan「四域」→「契约域」

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.6`
- selfcheck → `selfcheck-0.3.6.mjs`；`0.3.5` → archive

## 0.3.5 — 2026-08-14（域包 packs + jobs inventory）

### 产品

- **L1 文件包**：`templates/_meta/domain-packs.yaml`；`render` 经 `expandDomainPackEntries` 展开；manifest 不再罗列 L1（加新域优先改 packs + 模板目录）
- **jobs inventory**：`fill-inventory-jobs.mjs`（`SyncTaskCode` / `@Scheduled` / yml cron）→ `docs/jobs/.fill-work/inventory.json`
- **jobs worker 链**：`fill-merge-jobs` · acceptance `--domain jobs` · fill-workers / fill-truths-agents 文档
- fill-score jobs 覆盖优先读 inventory.tasks

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.5`
- selfcheck → `selfcheck-0.3.5.mjs`；`0.3.4` → archive

## 0.3.4 — 2026-08-14（jobs 域 + 域注册表）

### 产品

- 新增可选契约域 **`jobs`**（Cron / Scheduler）：索引 + `tasks/` + rule **20** + 去域化模板
- **`templates/_meta/domains.yaml`** + `scripts/lib/domains.mjs`：域列表驱动；fill-score / seed / plan 不再写死四域
- detect：`S_JOBS` / `S_RELEASES` / `S_FRONTEND`；RecommendedProfile 遇 Scheduler 指纹【推荐】纳入 jobs
- audit / ladder / glossary：按 meta∪磁盘动态勾选；过程包 / 协作包脚注；**mcp_tracking** `example_only` \| `vendored_shared`
- fill-score：`--domains`；jobs morph（标识/Cron/Scheduler/锚点；禁止 OpenAPI 抄入）；jobs coverage 按索引表行
- 00 模板文档优先级含 jobs / releases

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.4`
- selfcheck → `selfcheck-0.3.4.mjs`；`0.3.3` → archive

## 0.3.3 — 2026-08-13（gold 开干档）

### 产品

- 新增 **`gate_profile: gold`**（独立档）：覆盖强制 **100%**（`code>0` 域）· 分域形态 ≥**90** · `template_completeness` ≥**95** · `todo_scan=harness_docs`（B：真相+索引+AGENTS+agent-kb+rules）· `acceptance_blockers_max=0` · **`acceptance_warnings_max=0`**
- gold 语义收紧：`generic_logic≤0` ∧ `dto_unbound≤0` ∧ tc≥95
- **全局【推荐】仍 `strict`**；`Q_GATE_PROFILE` 增加 gold 选项；新仓模板默认仍 strict
- `todo_scan`: `truths` \| `harness_docs` \| `all`

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.3`
- selfcheck → `selfcheck-0.3.3.mjs`；`0.3.2` → archive

## 0.3.2 — 2026-08-13（writing-for-agents 收口）

### 产品

- 诊断台：`morph_strip` 仅形态；新增 `coverage_strip`（三词名实）
- `bump-run-round.mjs` + agents/pipeline-fill Done：批次收口 round 单调 +1
- `lib/ai-coding-gate.mjs` 抽出；selfcheck 可测 strict 开干=NO（morph_floor / harness_todo）
- SKILL 指针 / fill-score Done / glossary 三词正写（承接 0.3.1 后诊断落地）

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.2`
- selfcheck → `selfcheck-0.3.2.mjs`；`0.3.1` → archive

## 0.3.1 — 2026-08-13（Phase C · 同构 / 仪表降权 / morph·gate）

### 计分↔模板同构（redis/db）

- morph：`## Value` ≡ `## Value 结构`；TTL 与 dens `redisHasTtlContent` 对齐
- db：`req-fields` / morph COMMENT 接受仅 DDL `COMMENT '`；`has-business-desc` 测业务说明章
- 模板薄注双形态；workers/fill-score 一句同步

### 仪表参考分降权

- 报告「综合评分」残留清除；**仪表参考分**移入趋势台次区；进度卡只留流水线

### 模式拆分

- 新增 `fill-morph` / `fill-gate`（文档级；引擎 `fill-score.mjs --focus morph|gate|full`）
- Q_MODE / SKILL / glossary / fill.md / README 注册

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.1`
- selfcheck → `selfcheck-0.3.1.mjs`；`0.3.0` → archive

## 0.3.0 — 2026-08-13（Phase B · 严格开干）

### 破坏性 / 迁移

- **有** `docs/harness-eng/score-policy.yaml` 但未写 `gate_profile` → 运行时按 **`strict`**（存量升档）
- **无** score-policy 文件 → 仍 **legacy**（同 0.2.28 开干公式）
- 显式 `gate_profile: legacy` 可回退
- strict 缺省门槛：`morph_floor=60`、`forbid_harness_todo=true`、`acceptance_blockers_max=0`（可在 YAML 覆盖）
- 提问：`Q_GATE_PROFILE`（全部推荐 / upgrade / resume / pipeline）

### 产品

- 报告：gate 红项映射到 fill 任务建议；headline 正写「开干=YES|NO」
- 「综合评分」→ **仪表参考分**（≠开干）
- 新模板仍默认 `all_domains` + `strict`

### 版本钉

- manifest / meta / questions / README / QUICKSTART / VERIFY → `0.3.0`
- selfcheck → `selfcheck-0.3.0.mjs`；`0.2.29` → archive

## 0.2.29 — 2026-08-13（Phase A · 开干闸/报告接线）

### 开干与词表

- 对用户正写三词：**覆盖 / 形态 / 开干**；开干仅绑 `ai_coding_ready`
- `score-policy`：`gate_profile` + `gate.*`；**缺省/旧仓=legacy**（=0.2.28）；新模板默认 `strict` + `coverage_mode=all_domains`
- strict 可并：`morph_floor` / `forbid_harness_todo` / `acceptance_blockers_max`（等）

### 计分诚实

- API inventory merge **按 evidence 去重**
- `hasRealApiPath` 接受反引号路径 `` `/x` ``

### 报告接线

- fill-report-html：无 `--compare` 时用 history 补「相对上次」
- 默认加载/写入 `docs/harness-eng/run-latest.json`（`round` 入 history）
- fill-plan `--close`：sample 批次优先 `--work-dir`（P1）

### 迁移

- 升到 0.2.29 后旧仓未写 `gate_profile` → 开干结论应不变
- 若写入 `gate_profile: strict`，开干可能 YES→NO；看 `ai_coding_ready.blockers` / `gate`

### 版本钉

- manifest / meta tmpl / questions / README / QUICKSTART → `0.2.29`
- selfcheck → `selfcheck-0.2.29.mjs`；`0.2.28` → `archive/selfcheck/`

## 0.2.28 — 2026-08-12（writing-for-agents W5 · 剪枝闭环）

### 覆盖裁决 SSOT

- glossary / fill-score：**`coverage_ready` 以 score-policy 为准**；域目标缺省回退 `meta.ready_coverage` / CLI；无文件则 overall+ready_coverage
- SKILL 模式表 +「分支 → Read」挂 score-policy / 覆盖裁决
- score-policy 模板注释写明裁决

### 文档剪枝

- glossary：两轴 + 覆盖裁决并表；`ui.version` ≠ skill_version
- fill-score.md：抽出版本史 sediment（→ CHANGELOG）；步骤含读 score-policy
- README：文首/文末版本钉一致；要点只留当前版 + CHANGELOG 指针
- 热路径正写：填充 MCP 闸 →「过闸后再… / 未过停留骨架」（QUICKSTART / README / fill-mcp / pipeline* / fill-truths*）

### 沉积归档

- 旧 `selfcheck-0.2.10`…`0.2.27` → `archive/selfcheck/`；热路径仅 `selfcheck-0.2.28.mjs`
- VERIFY 历史增量表 → `archive/VERIFY-history-through-0.2.27.md`；VERIFY.md 只留当前阶

### 版本同步

- manifest / meta tmpl / questions / README / QUICKSTART → `0.2.28`
- selfcheck → `selfcheck-0.2.28.mjs`

## 0.2.27 — 2026-08-12（score-policy · 列密度 · 四域对称闸）

### score-policy（开干策略可配置）

- 目标仓 `docs/harness-eng/score-policy.yaml`（模板 `templates/docs/harness-eng/score-policy.yaml.tmpl`）
- `coverage_mode`: `overall`（默认）/ `all_domains` / `weighted`
- `coverage_targets` 分域目标；`coverage_ready.gaps` 写入 score JSON
- **与 `domain_caps` 无关**

### template_completeness 列密度

- `dens-examples`（api 示例值占比）
- `dens-method-desc`（func 功能说明）
- `dens-comment`（db COMMENT）
- `dens-ttl` / `dens-example`（redis）
- 实现：`scripts/lib/doc-density.mjs`

### 四域 acceptance 对称（金标）

- `func-empty-desc` · `db-no-comment` · `redis-no-example`（金标 blocker；非金标 warning）

### 版本同步

- manifest / meta tmpl / questions / README / QUICKSTART → `0.2.27`
- selfcheck → `selfcheck-0.2.27.mjs`

## 0.2.26 — 2026-08-12（开干阈值 · 示例闸 · MCP 主环境）

### 开干轴（与形态上限解耦）

- **`ready_coverage` 默认 0.8**（80%）；`harness-meta` 可固化 `ready_quality` / `ready_coverage`
- `fill-score.mjs`：CLI 未显式传入时读 meta；叙事强调 **`domain_caps` / `formula_ceiling` ≠ `ai_coding_ready`**
- 提问：`Q_READY_COVERAGE`（推荐 0.8）

### API 示例值闸

- 金标：**请求/响应参数表须有「示例值」列**；空单元格 = blocker；显式 `未知` / `—` / `N/A` 算已填
- `acceptance-check` 新增 `api-empty-examples`；truth-quality / fill-workers 答案卡同步
- 目标仓与技能 api 模板：示例值标为金标必填

### MCP 主环境

- 填充烟测 / live 实据主环境默认 **`test`**（原优先 dev）
- 提问：`Q_FILL_MCP_PROFILE`；meta：`fill_mcp_profile`
- 矩阵仍可装配多环境；主环境与装配全集分离

### 版本同步

- manifest / harness-meta tmpl / questions.yaml / README / QUICKSTART → `0.2.26`
- selfcheck → `selfcheck-0.2.26.mjs`

## 0.2.25 — 2026-08-11（writing-for-agents · 顶层剪枝）

### SKILL / 指针

- **description** 瘦身：一支一词（审计 / 落地 / 续跑 / 流水线 / 升阶 / 填充 / 打分与报告）；去掉 scaffold 等同义堆叠
- **必读纪律 ∩ 硬闸门** 合并：顶层改「流程」；闸门只留正目标；「与 Java plugin 无关」→「本 skill 只写目标仓 AGENTS/rules/docs」
- **land** 对齐 resume：`## land` → Done → 步骤（去掉空 heading / `Done（land）` 分叉）
- live / HTML 报告模式行改指 `scripts/* --help`（环境 SSOT）

### SSOT / glossary

- Windows「UTF-8 无 BOM」收束到 [write-plan.md](write-plan.md) gotcha；SKILL / pipeline / fill-score 只指针
- glossary：`ready.ok` / 形态分 / 覆盖 / 公式上限 / 模板完整度 去重并入「分层 ready」
- 填充 MCP 闸常用词改为正目标表述（未过则停留骨架）

### 版本同步

- manifest / harness-meta / questions.yaml / README / QUICKSTART → `0.2.25`
- selfcheck → `selfcheck-0.2.25.mjs`

## 0.2.24 — 2026-08-10（报告 UX · 指挥台升级）

### 报告页

- 时间：`Asia/Shanghai`，格式 `YYYY-MM-DD HH:mm:ss`
- 术语悬停：正文 glossary 词虚线标记 + tip
- 去掉顶部 sticky 重复条
- 决策/诊断/任务/趋势 → Tab + 左右切换
- 明暗模式按钮（右上，localStorage）
- 综合评分 + 流水线六步进度（`composite_score` / `pipeline_progress`）
- 名词解释 / 技术细节 → 顶栏按钮 + 弹层（替代页底折叠）
- **视觉**：接入 CYBERPUNK TERMINAL 风格（Orbitron + JetBrains Mono、CRT 扫描线、角标霓虹、默认暗色）
- `ui.version` → `0.2.24`

## 0.2.23 — 2026-08-10（报告 UX · ui 投影）

### 决策台瘦身

- 徽章仅二态：`建议可以开干` / `建议暂缓`（形态就绪中间态只进 hint）
- 决策台 KPI → `decision_kpis`：`ai_coding_ready` + 有 SSOT 时 `gold_ratio`
- 形态分 / 覆盖 / 上限 / 模板完整度 → 诊断台 `morph_strip`
- 四域故事卡默认关（`show_domain_cards`）；改为一行 `domain-summary`；图保留
- 无 shards 时任务台不展示（原逻辑保留）
- `ui.version` → `0.2.23`；模板 Dashboard v2.23

## 0.2.22 — 2026-08-10

### 填充 MCP 闸 · 多环境矩阵（profile 自动发现）

- **不**把 L4 并入 L0；阶梯语义不变
- detect：`S_DB_ENGINE` / `S_STACK_REDIS` / `S_ENV_PROFILES` + **MCP 矩阵**（`{engine}-{profile}`，环境以仓库 profile 自动发现）
- fill-mcp：多环境 Done；**填充 MCP 闸**——需 db·redis 时须矩阵 +（MCP 烟测 ∨ calibrate-live）；仅书面跳过 MCP → **禁止进入填充**
- pipeline / pipeline-fill：骨架 Done 收紧；填充战役前置硬闸；`fill_deferred` 可只做骨架
- example / mcp-usage-guide：多环境占位命名；glossary 增 **MCP 矩阵** / **填充 MCP 闸**
- 版本号同步：manifest / harness-meta / questions.yaml / README / QUICKSTART → `0.2.22`
- selfcheck → `selfcheck-0.2.22.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；AST 级签名闸；全链路 VERIFY 深化；pipeline 一键 CLI

## 0.2.21 — 2026-08-10

### writing-for-agents W4 残差剪枝

- 新增 [upgrade.md](upgrade.md)（Done + 与 land/resume 边界）
- 「全部推荐」协议 SSOT → [recommended-profile.md](recommended-profile.md)；确认/预授权仍 → [write-plan.md](write-plan.md)
- 删 SKILL「其它模式」复述；land 标题收束；fill 推荐切入改指针表；write-plan 写入方式瘦身为 `--help` + 要点
- 版本号同步：manifest / harness-meta / questions.yaml / README / QUICKSTART → `0.2.21`
- selfcheck → `selfcheck-0.2.21.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；AST 级签名闸；全链路 VERIFY 深化；pipeline 一键 CLI

## 0.2.20 — 2026-08-10

### writing-for-agents 文档专项（W0–W3）

- **W0**：SKILL frontmatter；瘦身脚本墙；确认闸门 / 预授权词表 SSOT → [write-plan.md](write-plan.md)
- **W1**：各模式 **Done** 谓词；pipeline 拆 [pipeline.md](pipeline.md) 骨架战役 + [pipeline-fill.md](pipeline-fill.md) 填充战役；glossary `ready` 双义消除
- **W2**：热路径软禁止改正目标；模式「意图（一支）」；分支 → Read 锐化
- **W3**：README 版本对齐 manifest；[OPTIMIZATION-PROPOSAL](archive/OPTIMIZATION-PROPOSAL-0.2.x.md) 迁入 `archive/`；selfcheck 文档漂移断言
- **明确不做（本版）**：不拆 `harness-audit` / `harness-fill` 独立技能（单技能 + 分战役指针已够用）
- 版本号同步：manifest / harness-meta / questions.yaml / README / QUICKSTART → `0.2.20`
- selfcheck → `selfcheck-0.2.20.mjs`

## 0.2.19 — 2026-08-07

### 多模块合并修复 · 四域统一 merge · inventory 路径修复 · 输出标准化

依据 sms2023-backend 四轮 pipeline 实战评估（10 痛点 + 10 优化建议）：

- **P0** **修复 `fill-merge-api` 多模块合并阻断**：新增 `--module` 参数；自动按 inventory 证据集过滤 work-dir fragment，跨模块 evidence 不再产生 dups/missing；`--force-write` 跳过 missing 检查（dups 仍阻断）
- **P0** **新增 `fill-merge-db.mjs` / `fill-merge-redis.mjs` / `fill-merge-func.mjs`**：参照 fill-merge-api 模式，四域统一过闸合并；共享逻辑抽取到 `scripts/lib/merge-domain.mjs`（`extractInventoryEvidence` + `mergeDomain` 通用函数）
- **P1** **修复 `fill-inventory-api` Controller 路径推断偏差**：新增 `CONTROLLER_DIR_NAMES`（controller/controllers/web/api/endpoint/rest/restcontroller）；模块级 fallback：无 controller 目录时扫描整个 `src/main/java` 的 `*Controller.java`
- **P1** **统一变体命名**：`questions.yaml` Q_MODULES 新增 `meta` 字段标注 `agents_variant` 映射（solo→solo, few→modules(subset), all→modules(all)），消除 few/modules 混淆
- **P2** **`fill-score` 输出标准化**：新增 `--output <path>`（JSON 写文件，stdout 仅摘要）和 `--json`（stdout 仅 JSON，抑制摘要文本）
- **P2** **`fill-plan --status` 增强**：新增 `shard_progress` 字段，检查 `.fill-work/*.md` 文件数和行数，展示每批次的 shard 级完成度
- 版本号同步：manifest / harness-meta / questions.yaml / fill-plan / SKILL → `0.2.19`
- selfcheck → `selfcheck-0.2.19.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；AST 级签名闸；全链路 VERIFY 深化；pipeline 一键 CLI

## 0.2.18 — 2026-08-07

### 深·真·全 · acceptance 语义闸 · 金标批次 · draft/SSOT

- **新增** [truth-quality.md](truth-quality.md)：深/真/全操作定义、反例表、`.fill-work` draft vs `docs/` SSOT 两级产物
- **新增** `scripts/acceptance-check.mjs` + fixtures：反例正则 + 必填章；exit `0`/`2`/`1`；输出 `gold_pass_ratio`
- **`fill-merge-api`**：`--write`/`--check` 前跑 acceptance；blocker → fail；`--force-write` 仅移交（stderr 警告）
- **大仓 Plan**：`fill-plan --init --gold` / large 默认强制 `sample_n`；`--close` 过 acceptance，失败写 `blocked`
- **Agents/Workers**：答案卡 + 失败协议（usage limit → `blocked`；禁止启发式升格 SSOT；仅 draft + `quality: heuristic`）
- **Score/报告**：`gold_ratio` / `draft_vs_ssot`；决策台金标 KPI；`suggest_next` 优先金标/acceptance
- 文档：SKILL / pipeline / fill / fill-plan / fill-score / glossary / QUICKSTART / audit-report / questions
- selfcheck → `selfcheck-0.2.18.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；AST 级签名闸；全链路 VERIFY 深化

## 0.2.17 — 2026-08-07

### 默认 L4 + agents · Plan 填充 · 分层 ready · dto 绑定闸

- **大仓 / pipeline 默认目标阶 = L4**；推荐包不再默认停 L2（L2 仅「只要协作+索引、明确不深填」子集）
- **默认 `Q_FILL_ENGINE=agents`**；`hybrid` 降为可选；**`auto` 标 legacy**：禁止默认写入 SSOT（仅 `--work-only` / `.fill-work` 草稿）
- **新增** [fill-plan.md](fill-plan.md) + `scripts/fill-plan.mjs`：目标 / 批次 / Done 条件；pipeline 早停看 Plan 关闭率，勿仅贴 `formula_ceiling`
- **分层 ready**：`skeleton_ready` / `coverage_ready` / `semantic_ready` / **`ai_coding_ready`**；仪表盘「建议可以开干」**仅**绑 `ai_coding_ready`
- 旧 `ready.ok` 保留为形态+覆盖兼容字段，**不再**驱动开干文案
- **`fill-dto-batch`**：按接口块绑定 bodyType/返回类型；禁止整文件 DTO 堆到每个「请求参数」下；错挂记 `dto-unbound`
- **语义启发式**：通用四步逻辑模板计入 miss；`suggest_next` / next_actions 优先 agents + fill-plan
- 文档：SKILL / pipeline / fill / recommended-profile / questions / glossary / QUICKSTART / fill-score / fill-workers / report-ui
- selfcheck → `selfcheck-0.2.17.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化；语义闸加深（签名 AST）

## 0.2.16 — 2026-08-07

### 多 Agent 精填 + 宿主对齐 + 模板完整度

- **默认填充引擎 `hybrid`**：inventory / calibrate / dto 仍用脚本；真相完整档走 **fill-truths-agents**（多会话按模板精填）
- **新增** [fill-truths-agents.md](fill-truths-agents.md)；扩展 [fill-workers.md](fill-workers.md) 四域 + 按 `ai_tools` 启动（禁写死 Cursor Task）
- **pipeline / fill / SKILL / glossary / QUICKSTART / recommended-profile**：推荐序改为 agents/hybrid；auto 标为薄底/回退
- **`Q_FILL_ENGINE`**：`hybrid`【大仓推荐】/ `agents` / `auto`
- **宿主对齐**：非 cursor 工具生成契约 sync 镜像（`1x-contract-sync.md`）；audit 反模式「meta.ai_tools 与入口/镜像不一致」
- **`template_completeness`**：fill-score JSON + 报告 KPI；`missing-req-section`；**不改** ready 公式；贴顶且完整度低 → 建议 agents
- **修顺带**：`fill-calibrate-live` Redis 前缀文件名消毒（`*` → 安全字符）已在树中
- selfcheck → `selfcheck-0.2.16.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.15 — 2026-08-06

### 工程体验（QUICKSTART / 进度 / 升阶建议 / render）

- **`QUICKSTART.md`**：一页纸入口（场景表 + 写盘闸门 + 最短路径）
- **stderr 进度**：`progress-log.mjs`；`fill-inventory-api` / `fill-truths-auto` / `fill-score` 支持 `--quiet`
- **`progress.yaml`**：`progress-file.mjs` → `docs/harness-eng/progress.yaml`；`--write-progress` 挂钩 score/auto
- **`suggest_upgrade`**：fill-score JSON + 决策台展示下一阶建议；`report-ui` glossary
- **`render.mjs`**：`--backup`（create→backup-create）；空 `files` 默认展开 skill manifest
- 文档：SKILL / README / glossary / fill-score / OPTIMIZATION / VERIFY；selfcheck → `selfcheck-0.2.15.mjs`

### 后续（0.3.0）

- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.14 — 2026-08-06

### 历史与对比（趋势台）

- **`score-history.jsonl`**：`fill-report-html` 默认追加 `docs/harness-eng/score-history.jsonl`（`--no-history-append` 可关）
- **`scripts/lib/score-history.mjs`**：读写 / 趋势序列
- **报告趋势台**：overall/coverage 折线；`score.diff` 相对上次；`run` 轮次 timeline
- **`report-ui`**：`diff` / `trend` / `run_timeline`；`ui.version` = 0.2.14
- 文档：SKILL / glossary / fill-score / CHANGELOG / VERIFY / README；selfcheck → `selfcheck-0.2.14.mjs`

### 后续（P3 / 0.3.0）

- ~~0.2.15：QUICKSTART、stderr 进度、`suggest_upgrade`、`render --backup`~~ **已落地**
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.13 — 2026-08-06

### Report Dashboard v2（施工指挥台）

- **HTML 报告**分区升级：决策台 / 诊断台 / 任务台 / 技术细节（默认折叠）
  - sticky 摘要条：ready 徽章 + 仓名/模式
  - 决策台：`gap_to_ready` + KPI + 可执行 `next_actions[].command`
  - 诊断台：四域 quality vs cap SVG、miss 水平条、`domain_stories`、`gaps_top`
  - 任务台：`shards` 任务卡 + `fill-truths-auto --merge` 命令文案
- **`report-ui.mjs`**：`gap_to_ready` / `domain_stories` / `miss_top` / `gaps_top` / `chart_domains` / `lagging_domain`
- `fill-report-html`：stdout 增补拖后腿摘要与距门槛；`ui_version`
- fixture `score-sample.json` 补 `next_shards` / 多域 coverage
- 文档：SKILL / glossary / fill-score / fill / pipeline / README / VERIFY；selfcheck → `selfcheck-0.2.13.mjs`

### 后续（P3 / 0.3.0）

- ~~0.2.14：`score-history.jsonl` 趋势~~ **已落地**
- P3 / 0.2.15：QUICKSTART、stderr 进度、`render --backup` / 默认 manifest、`suggest_upgrade`
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.12 — 2026-08-06

### 施工目录 + 报告人话层

- **默认落点**改为 `docs/harness-eng/`（与 `docs/agent-kb` 知识回流分离）
  - `report-latest.html` · `score-latest.json` · 可选 `progress.yaml` · `history/`
  - L2 模板新增 `docs/harness-eng/README.md`
  - 兼容：旧 `docs/agent-kb/harness-report-latest.html` 仍可读；新写入不再默认写 kb
- **报告 UX**：`scripts/lib/report-ui.mjs` 生成 `ui` 投影（headline / 可编码建议 / 三 KPI / 下一步 / 四域中文 / 术语表）；技术字段折叠
- `fill-report-html`：默认 out 新路径；顺带写 score JSON；`--history` → `docs/harness-eng/history/`；缺 README 时从模板补一份
- 文档：SKILL / glossary / fill-score / fill / pipeline / questions / VERIFY / README；selfcheck → `selfcheck-0.2.12.mjs`

### 后续（P3 / 0.3.0）

- P3：QUICKSTART、stderr 进度、`render --backup` / 默认 manifest、`suggest_upgrade`
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.11 — 2026-08-06

### HTML 可视化报告

- **新增** `templates/report/harness-report.html.tmpl`：自包含仪表盘（overall / ready / formula_ceiling / 四域 / coverage / miss / gaps）
- **新增** `scripts/fill-report-html.mjs`：注入 fill-score JSON（+ 可选 meta/run）→ `docs/agent-kb/harness-report-latest.html`
- score 保持纯 stdout；pipeline / fill-score 后【推荐】显式调用 report；`Q_REPORT_HTML` 默认开
- 写盘仍受确认/预授权约束；audit 默认不写；不含密文
- 文档：SKILL / pipeline / fill-score / glossary / VERIFY

### 后续（P3 / 0.3.0）

- P3：QUICKSTART、stderr 进度、`render --backup` / 默认 manifest、`suggest_upgrade`
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.10 — 2026-08-06

### monorepo 扫描 · 公式天花板 · live 校准回退

依据 sms2023-backend 续跑实战（overall≈75% 触顶、redis_true=0、缺 ## TTL、MCP 未挂载、DTO 空跑、questions 与 Profile 摇摆）：

- **P0** `fill-inventory-redis`：默认扫描全部 `*/src/main/java`；`REDIS_*` / `SMS:` / dict/captcha 可 promote `redis:true`
- **P0** `fill-truths-auto`（redis）：有 Key 时**始终**输出 `## TTL`；SCAN 实例 key 前缀归一
- **P0** `fill-dto-batch`：默认多模块 Java 根查找
- **P0** `fill-score`：摘要增加 `formula_ceiling` / `domain_caps`；pipeline 达标看 **ready@70**，勿空追 overall≥80
- **P0** 新增 `fill-calibrate-live.mjs`：MCP 不可用时直连 MySQL/Redis 校准（临时 mysql2/ioredis）
- **P0** `questions`：`large_repo` → 推荐 `pipeline`（与 RecommendedProfile 一致）
- Windows：answers JSON **UTF-8 无 BOM**；「继续」= 预授权下 score→calibrate→score
- 文档：SKILL / pipeline / fill-mcp / fill-score / fill-truths-auto / OPTIMIZATION / VERIFY

### 后续（P3 / 0.3.0）

- P3：QUICKSTART、stderr 进度、`render --backup` / 默认 manifest、`suggest_upgrade`
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.9 — 2026-08-06

### 质量天花板 · 增量合并 · 编排可靠性（任务三 P1+P2）

依据 sms2023-backend pipeline 实战（quality 66% 触顶、max-rounds 空转、幽灵端点）：

- **P1** `fill-truths-auto --merge`：增量合并真相；输出 `stats.written/merged/unchanged`；pipeline 第二轮强制 `--merge`
- **P1** DB：inventory 提取 SQL COMMENT / Entity `@TableField`·JavaDoc / Mapper XML；fill-score 字段说明加分（解锁 ~75+）
- **P1** Redis：推断 valueType / valueFields / TTL；降噪 `redis_false`；fill-score Value·TTL 加分（解锁 ~70+）
- **P2** inventory 退出码统一：`0` 成功 · `2` 有 warnings/skips · `1` 硬错误
- **P2** API：无 `@RestController`/`@Controller` 模块 skip；`--exclude-base-classes`（默认 BaseController…）
- **P2** Func：`--shard-size`（默认 80 方法）分片 partK
- **P2** fill-score：`--verbose` 检查项 + `miss_histogram`；建议下一步识别自动化天花板
- **P2** pipeline：收益递减早停（unchanged + overall Δ&lt;1%）
- 文档：pipeline / fill-truths-auto / fill-score / SKILL / VERIFY 同步

### 后续（P3 / 0.3.0）

- P3：QUICKSTART、stderr 进度、`render --backup` / 默认 manifest、`suggest_upgrade`
- 0.3.0：非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.8 — 2026-08-05

### sms2023-backend 实战收口（Task1–3）

依据 14 模块大仓 audit→land→2 轮 fill（quality 53% 未达标）与优化方案：

- **P0** `fill-inventory-func.mjs`：Service/Component inventory → func 真相可系统化填充
- **P0** `fill-score`：`next_shards.endpoints` 仅序列化 id/path（修 `[object Object]` + 体积膨胀）；跳过 API 分页空壳索引；func 打分兼容 `##/### 服务类|方法清单`
- **P0** `fill-truths-auto`：大模块只写 part 真相、不写空壳 modules 索引；func 标题对齐打分；优先读 func inventory
- **P1** Redis：按 key 前缀分组多文件；coverage 按文档化 key 数（非 md 文件数）
- **P1** `fill-inventory-api --all-modules` / 统一 `--modules`（兼容 `--module`）
- **P1** `pipeline` 模式 + `Q_PREAUTH` 预授权（首轮确认、后续自动）
- **P2** 跳过空模块（`<200B`）；`fill-score --summary-only`；detect 空壳 docs 目录不判 MATURE
- 文档：`pipeline.md` · SKILL / fill / detect / write-plan / questions 同步

### 0.3.0 预告

- 非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.7 — 2026-08-05

### 真相自动填充 · inventory 闭环 · 实战缺陷修复

依据 sms2023-backend 14 轮深度执行（骨架 15% → 深度填充 62%）：

- **P0** `fill-truths-auto.mjs` + [fill-truths-auto.md](fill-truths-auto.md)：四域从 inventory evidence 自动写有内容真相
- **P0** `include_optional: true` 归一化为 `["rule-14"]`（修复 `new Set(true)` 崩溃）
- **P1** inventory 默认写出 `docs/<domain>/.fill-work/`；`fill-score` 无 `--inventory` 时自动发现 + `coverage_by_domain`
- **P1** `fill-merge-api --auto-fill`：缺 worker 片段时自动生成 shard
- **P1** `yaml.mjs#stringify`；render 用合法 flow 列表填充 `DOMAINS_YAML` / `AI_TOOLS_YAML`
- **P2** Redis inventory 噪声过滤（`redis: true/false`）；seed `--max-db/redis` 默认 0=全量；`all_modules` 扫 pom；脚本统一 fs walk（中文路径）
- **P3** `fill-dto-batch.mjs` 批量 DTO 字段表
- 推荐序改为：inventory → **fill-truths-auto** → 可选 merge/workers

### 0.3.0 预告

- 非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.6 — 2026-08-05

### YAML 解析器 · 按 ai_tools 原生 Hooks

- 新增 `scripts/lib/yaml.mjs`（vendored，无 npm）；`render.mjs` / `questions-next.mjs` 改用标准解析（报告 5.7）
- L3 按 `ai_tools` 安装宿主 hooks：Cursor / Claude (`.claude/settings.json` merge) / WorkBuddy (`.codebuddy/`) / Codex (`.codex/hooks.json`)
- commit-gate 支持 `--claude` / `--codebuddy` / `--codex` / `--git`（一律 fail-open）
- settings/hooks JSON：`merge-json-hooks`（按 command 去重，保留用户其它键）
- 保留 `.githooks` 作仓外 commit 兜底；qoder/trae 不臆造宿主 hooks

### 0.3.0 预告

- 非 Java 通用 inventory；全链路 VERIFY 深化

## 0.2.5 — 2026-08-05

### fill-score 正确性 · seed/questions 自动化 · render DX · 跨工具 Hook

- `fill-score.mjs`：`db`/`redis` **不按模块名过滤**；有索引时域分 `Math.max(15, avg)` 保底（避免 seed 空壳后分数反降）
- 新增 `scripts/seed-truths.mjs`（空壳 + 索引导航；`--dry-run`）
- 新增 `questions.yaml` + `scripts/questions-next.mjs`；`questions.md` 收成摘要
- `render.mjs`：dry-run `preview`（前 20 行）+ `unresolvedPlaceholders`；写入后 warning 汇总
- L4 说明文件：`MCP使用说明.md` → `mcp-usage-guide.md`（旧中文名 skip 不删）
- L3 跨工具软门禁：Cursor hooks 仅当 `ai_tools` 含 cursor；通用 `.githooks/pre-commit` + gate `--git`（fail-open）

### 0.3.0 预告

- 非 Java 通用 inventory；全链路 VERIFY 深化；manifest 标准 YAML 解析器（可选）

## 0.2.4 — 2026-08-05

### 工具无关 workers · redis inventory · ready · merge enrich-dto

- 重写 [fill-workers.md](fill-workers.md)：**默认串行**；并行仅为可选适配表（Cursor / Claude / Codex / Qoder / Trae / WorkBuddy / 自定义）；禁止「必须 Cursor Task」
- 新增 `scripts/fill-inventory-redis.mjs` + fixture `SampleRedisKeys.java`
- `fill-score.mjs`：输出 `ready`；`--ready-quality` / `--ready-coverage`（默认 80 / 0.9）
- `fill-merge-api.mjs`：`--enrich-dto --source-root`（可选补请求参数字段表）
- glossary 增补 **ready**；fill / fill-truths / fill-score 交叉引用同步

### 0.3.0 预告（历史）

- 非 Java 通用 inventory；全链路 VERIFY 深化；其它吞吐项

## 0.2.3 — 2026-08-05

### 并行 Fill + Merge

- 新增 `scripts/fill-merge-api.mjs`（`--check` / `--write`；missing/dup 门禁）+ merge fixture
- 新增 [fill-workers.md](fill-workers.md)：并行填充手册（后由 0.2.4 改为工具无关）
- `fill-progress.yaml.tmpl`；gitignore 忽略 `docs/**/.fill-work/`
- 大文件拆页规则（≥200 接口 → partK）写入 fill-truths
- 新增 `fill-dto-fields.mjs`、`fill-inventory-db.mjs`
- fill-score：模块过滤导致 db/redis truths=0 时输出 `filter_notes`（非无真相）

## 0.2.2 — 2026-08-05

### fill 优化（MCP 先行 · 完整档 · inventory）

- **推荐序**：`fill-score` → **`fill-mcp`（mysql/redis）** → `fill-truths` → 再 score；跳过 MCP 不硬拦但须声明
- **完整档**唯一默认；取消精简档推荐路径
- **一次确认多 shard**：WritePlan 列出全部 shards；确认=执行全队列
- `fill-score.mjs`：兼容 `**接口地址：**` 模板写法；`--inventory` coverage；`--compare` diff；`next_shards`
- 新增 `scripts/fill-inventory-api.mjs` + fixture `scripts/fixtures/fill-api-sample.md`
- 子 agent 协议：只写 `docs/api/.fill-work/`（merge CLI 见 **0.2.3**）

## 0.2.1 — 2026-08-05

### fill 专项（规格 + fill-score）

- 版本递进约定：自 **0.2.1** 起按 `0.2.1 → 0.2.2 → … → 0.3.0` 补丁推进（本版为 fill 首发）
- 新增 [fill.md](fill.md) / [fill-score.md](fill-score.md) / [fill-truths.md](fill-truths.md) / [fill-mcp.md](fill-mcp.md)
- 新增 `scripts/fill-score.mjs`（契约完整度打分）
- **密文**：从本仓已有文件读取的密码允许写入 mcp/docs 并可入库（见 fill.md）；禁止编造
- fill-mcp 经确认可写 `.cursor/mcp.json`（非 fill 路径仍禁止静默覆盖）

## 0.2.0 — 2026-08-05

### 多 AI 工具面（P1）

- 新增 [ai-tools.md](ai-tools.md)：Cursor / Claude / Codex / Qoder / Trae / WorkBuddy + **自定义入口**
- 适配模板仅指针（非第二套 SSOT）；`render.mjs` 支持 `ai_tools` + `ai_tools_custom`
- `Q_AI_TOOL` 完整选项写入 questions；meta 记录 `ai_tools`
- detect 扩展 `.trae` / `.codebuddy` / `CODEBUDDY.md` 等信号

## 0.1.2 — 2026-08-05

### UX / 沟通

- 新增 [glossary.md](glossary.md)：阶梯 L0–L4、模式、常用词中文说明
- 提问须展示【推荐】与理由；正式支持用户回复 **`全部推荐`**
- WritePlan 须含「白话摘要」；确认闸门附中文提示

### 可续跑

- 新增模式 **`resume`（续跑）**：[resume.md](resume.md)
- `PARTIAL` / 半成品默认建议 resume 或 land+差分
- [scripts/render.mjs](scripts/render.mjs)：`on_exists: fail|skip|merge`（resume 默认 `skip`）

### 探测

- detect 结束输出 **RecommendedProfile**（见 [recommended-profile.md](recommended-profile.md)）

### 元数据

- `skill_version` → `0.1.2`
- meta 可选记录 `last_mode`
