# RecommendedProfile（推荐包）

detect 结束后、提问开始前，必须向用户展示一块 **推荐包**，并固定引导：

> 不确定怎么选？可直接回复：**全部推荐**（采用下表；收齐参数后仍出 WritePlan，写盘过 [write-plan.md](write-plan.md) 闸门）。

## 推断规则（结合仓库）

| 字段 | 规则 |
|---|---|
| `mode` | `MATURE`→`audit`；`PARTIAL` 或已有 `S_HARNESS_META` 但未满目标阶→`resume`；有代码无 harness→`land`；用户已说「落地/升到 Ln」→尊从；大仓首次→【推荐】**pipeline** |
| `ladder` | 大仓（多模块或 Controller≥50）或 pipeline → 默认 **L4**；小仓默认 L4（骨架一次到位）；用户书面「只要 L2 / 不要 hooks·MCP」才推荐 L2 |
| `domains` | Java/Maven 默认 `func,api,db`；探测到 redis 目录/依赖再加 `redis`；**`S_JOBS` 或 Scheduler 指纹再加 `jobs`**【0.3.4】；手写 SQL→务必含 `db`。域注册表见 `templates/_meta/domains.yaml` |
| `agents_variant` | 模块≥5 → `modules`+`few`（入口+核心业务模块）；否则 `solo`；`S_FRONTEND` 时脚注前端分册 |
| `glob_profile` | 大仓 → `focused`；小仓 → `wide` |
| `rule14` | 默认 **是** |
| `rule21` | 探测到 `S_SLF4J`（Java + SLF4J）→ 【推荐】**是**；非 Java 栈默认否（行为包，非契约域） |
| `rule17` | 探测到 `S_FRONTEND` → 【推荐】**是**；否则默认否（前端协作包，非契约域） |
| `module_agents_template` | 分册且探测到 `S_SPRING` → 【推荐】`spring`；否则 `default` |
| `db_migration` | db 域且 `S_NO_FLYWAY` / `S_SQL_DIR` → 【推荐】`manual_sql`；否则 `flyway` |
| `agent_config` | `S_MULTI_TOOL`（AI 工具 ≥2）或 `S_AGENT_CONFIG` → 【推荐】**是**（L5 配置 SSOT 管线；`Q_AGENT_CONFIG`）；单工具仓默认否 |
| `hooks_family` | L3+ 默认 `commit-gate-extended, after-edit, stop-checklist`；装配 mysql MCP 再加 `mysql-guard`（`Q_HOOKS_FAMILY`；extended 与基础 commit 门禁互斥） |
| `seed` | 默认 **是**（安全预填） |
| `name` / `desc` | 来自 pom / package.json（无密） |
| `ai_tools` | 探测到 `.cursor`→含 `cursor`；`CLAUDE.md`→`claude`；`.codex`→`codex`；`.qoder`→`qoder`；`.trae`→`trae`；`.codebuddy`/`CODEBUDDY.md`→`workbuddy`；皆无则 `[cursor]`。自定义不进「全部推荐」除非用户已写路径 |
| `mcp_tracking` | 已跟踪含密 `mcp.json`（团队共享）→ 脚注 **`vendored_shared`**；否则【推荐】**`example_only`**（L4 理想态）；提问见 `Q_MCP_TRACKING` |
| `fill_mcp_first` | 用户走 fill / pipeline / 含 db·redis 域 → 默认 **是**（先装配 MCP 再 fill-truths） |
| `fill_mcp_profile` | 填充实据主环境默认 **`test`**（`Q_FILL_MCP_PROFILE`）；无 test 凭证再回退 dev |
| `ready_coverage` | 开干覆盖率缺省 **0.8**（`Q_READY_COVERAGE`）；写入 meta；有 score-policy 时作域目标回退（见 glossary「覆盖裁决」）；**与 `domain_caps` 无关** |
| `gate_profile` | 大仓 / pipeline /「全部推荐」→ **strict**（`Q_GATE_PROFILE`）；契约贴顶后可显式 **gold**；演示/兼容 → `legacy`；**0.3.0**：已有 score-policy 未写本字段 → 运行时按 **strict** |
| `score_policy` | 大仓【推荐】写入 `docs/harness-eng/score-policy.yaml`（`coverage_mode=all_domains`，targets=0.8，`gate_profile=strict`）；**coverage_ready / 开干 gate 以此为准** |
| `fill_depth` | 恒为 **完整档**（无选项） |
| `fill_engine` | 默认 **agents**（多 Agent + fill-plan）；`hybrid` 仅用户要薄草稿时；`auto` **不**进「全部推荐」 |
| `fill_gold` | 大仓 / pipeline → 默认 **是**（金标批次 + 强制 `sample_n`） |
| 宿主对齐 | 已选 `ai_tools` 与入口/镜像交叉校验；缺失时推荐包脚注「补 render / land 镜像」 |

## 展示格式（强制）

```text
## 推荐包 RecommendedProfile
- 模式: 流水线 (pipeline) — 理由：大仓首次，L4 骨架+MCP+Plan 填充一次串联
- 目标阶梯: L4 工具连接样例 — 理由：大仓默认直达 hooks/MCP example，再开展真相填充
- 契约域: func, api, db, redis, jobs — 理由：…
- 分册: few（sms-entrance, …）
- glob: focused
- Rule14 / Rule21 / 安全预填: 是 / 是(S_SLF4J) / 是
- AI 工具面: cursor — 理由：探测到 .cursor
- MCP 跟踪策略: example_only（或 vendored_shared 脚注）
- fill: MCP先行=是 · **主环境=test** · 深度=完整档 · **引擎=agents** · **fill-plan=是** · **金标+sample_n=是** · **ready_coverage=0.8** — 理由：多 Agent 按批次精填；acceptance 过闸才 SSOT；开干看覆盖率非形态上限
- 旁注（若探测）: releases→release-eng；frontend→rule 17 协作包（非 fill-score 契约域）

不确定请回复：全部推荐
（或逐题选 A/B…；自定义工具请写「工具名=…; 入口路径=…」；写盘前仍需对 WritePlan 回复「确认」等）
```

## 「全部推荐」协议（SSOT）

本文件为「全部推荐」协议唯一正文；questions / SKILL / QUICKSTART 只指针到此。

1. 用户回复 `全部推荐` / `全用推荐` / `全部选择推荐选项` → 本批**未回答**题采用推荐包；已明确回答的题不覆盖。
2. 只收齐答题；写盘仍须 WritePlan，并过 [write-plan.md](write-plan.md) 闸门。
3. 若推荐包某字段无法推断 → 该字段仍须单题追问（≤5/批）。
