# harness-eng 验收记录（0.5.0）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.5.0**。报告壳 `ui.version`（0.2.24）≠ `skill_version`。

## 0.5.0 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.0.mjs` exit 0 | 烟测 |
| L5 阶梯：render `LADDER_ORD` 含 L5；`Q_AGENT_CONFIG` 入 questions | 有 |
| `templates/agent-config/`：sync.mjs.tmpl 去域化（无 sms-ai 专名）+ hooks.config + README | 有 |
| hooks 家族 4 模板去域化；`CONTRACT_CHECKS_JS` 由 domains.yaml `hook:` 段驱动 | 有 |
| pitfalls 模板 7 列 + 路径速查 + 已根治留档；`lint-pitfalls.mjs.tmpl` 占位化词表 | 有 |
| meta 模板含 `agent_config` 字段 | 有 |

## 0.4.0 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.4.0.mjs` exit 0 | 烟测 |
| rule 17 模板去域化（无 sms-ai-web / Clinical Calm 专名） | 有 |
| manifest 含 rule-17 + `GLOB_OBSERVABILITY/FRONTEND` 占位 | 有 |
| `AGENTS.module.spring.md.tmpl` + render `module_agents_template` | 有 |
| render `previewMarkdownMerge`：dry-run 与 merge 日志回写 `mergePreview` | 有 |
| `Q_FRONTEND_RULE` / `Q_MODULE_AGENTS` / `Q_DB_MIGRATION` 入 questions | 有 |
| rule 13 + db 索引模板「迁移模式」；domains db `migration_modes` | 有 |

## 继承

| 版 | 指针 |
|---|---|
| 0.3.10 | 行为包（rule 21 日志/注释 + S_SLF4J + Q_RULE21） |
| 0.3.9 | 源仓纪律回灌（jobs/releases 进根模板 · 00 提交门禁 · 19 回流表 · write-meta-only · Q_MCP_TRACKING） |
| 0.3.8 | fill-merge --domain 热路径 · morph-required 外置 |
| 0.3.7 | domains.yaml 名单去硬编码 · ACCEPTANCE_BY_DOMAIN |
| 0.3.6 | scheduler_link · domain-extend · heuristic 闸 |
| 0.3.5 | domain-packs + jobs inventory/merge |
| 0.3.4 | jobs 域 + domains.yaml 注册表 |
| 0.3.3 | gold 开干档 |
