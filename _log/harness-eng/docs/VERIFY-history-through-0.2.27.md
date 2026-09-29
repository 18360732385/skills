# harness-eng 验收记录（0.2.27）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本递进

`0.2.1 → … → 0.2.26 → 0.2.27 → … → 0.3.0`（补丁列车；本文件随当前 version 更新标题）。

## 0.2.27 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.2.27.mjs` exit 0 | 烟测 |
| manifest / skill_version = 0.2.27 | 有 |
| `score-policy.yaml.tmpl` + `loadScorePolicy` / `evaluateCoverageReady` | 有 |
| dens-examples / dens-comment / dens-ttl | 有 |
| acceptance db-no-comment / redis-no-example / func-empty-desc | 有 |

## 0.2.26 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.2.26.mjs` exit 0 | 烟测 |
| manifest / skill_version = 0.2.26 | 有 |
| meta `ready_coverage: 0.8` / `fill_mcp_profile: test` | 有 |
| `Q_READY_COVERAGE` / `Q_FILL_MCP_PROFILE` | 有 |
| acceptance `api-empty-examples` + good fixture 含示例值 | 有 |
| glossary「两轴勿混」 | 有 |

## 0.2.25 增量验收

| 检查 | 结果 |
|---|---|
| SKILL description 一支一词、无 scaffold 同义堆叠 | selfcheck |
| SKILL `## 流程` + land Done→步骤；无「必读纪律」分叉 | selfcheck |
| write-plan 独占 Windows JSON gotcha；pipeline/SKILL 只指针 | selfcheck |
| glossary 分层 ready 收纳 formula/形态分；无重复 ready.ok 否定句 | selfcheck |
| `node scripts/selfcheck-0.2.25.mjs` exit 0 | 烟测 |
| manifest / skill_version = 0.2.25 | 有 |

## 0.2.18 增量验收

| 检查 | 结果 |
|---|---|
| `truth-quality.md` 存在（深真全 + draft/SSOT） | 有 |
| `scripts/acceptance-check.mjs` + fixtures good/bad | 有 |
| 差 fixture exit 1；好 fixture exit 0 | 烟测 |
| `fill-merge-api --write` 未过 acceptance → fail；`--force-write` 警告 | 规格 |
| `fill-plan --init --gold` 产出 `sample_n` + 强化 acceptance | 烟测 |
| fill-score 输出 `gold_ratio`；报告 KPI「金标达标率」 | 有 |
| `node scripts/selfcheck-0.2.18.mjs` exit 0 | 烟测 |
| manifest / skill_version = 0.2.18 | 有 |

## 0.2.15 增量验收

| 检查 | 结果 |
|---|---|
| `QUICKSTART.md` 存在且链到 SKILL | 有 |
| `progress-log.mjs` / `progress-file.mjs` | 有 |
| inventory/auto/score 支持 `--quiet`；score/auto 支持 `--write-progress` | 有 |
| fill-score 输出 `suggest_upgrade`；决策台 `upgrade-line` | 有 |
| `render --backup` + 空 files → 默认 manifest | 有 |
| `node scripts/selfcheck-0.2.15.mjs` exit 0 | 烟测 |
| manifest = 0.2.15 | 有 |

## 0.2.14 增量验收

| 检查 | 结果 |
|---|---|
| `scripts/lib/score-history.mjs` 存在 | 有 |
| `fill-report-html` 默认追加 `score-history.jsonl` | 烟测 |
| 模板含 `sec-trend`；ui 含 `trend` / `diff` / `run_timeline` | 有 |
| 二次渲染后 jsonl ≥2 行且 HTML 含趋势数据 | 烟测 |
| `node scripts/selfcheck-0.2.14.mjs` exit 0 | 版本断言可能需 0.2.15 脚本 |
| manifest = 0.2.14 | 已被 0.2.15 覆盖 |

## 0.2.13 增量验收

| 检查 | 结果 |
|---|---|
| `templates/report/harness-report.html.tmpl` 含 `sec-decision` / `sec-diagnose` / `sec-tasks` | 有 |
| `report-ui` 含 `gap_to_ready` / `domain_stories` / `miss_top` / `chart_domains` | 有 |
| `next_actions[].command` / `shards[].command` 可执行文案 | 有 |
| fixture score → HTML 含 gap_to_ready / domain_stories / fill-truths-auto | 烟测 |
| `node scripts/selfcheck-0.2.13.mjs` exit 0 | 版本断言可能需 0.2.14 脚本 |
| manifest / skill_version = 0.2.13 | 已被 0.2.14 覆盖 |
| README 版本号与 manifest 一致 | 有 |

## 0.2.12 增量验收

| 检查 | 结果 |
|---|---|
| `templates/report/harness-report.html.tmpl` 存在且含 `{{REPORT_JSON}}` | 有 |
| `scripts/lib/report-ui.mjs` 存在 | 有 |
| `templates/docs/harness-eng/README.md` 存在 | 有 |
| `fill-report-html.mjs --help` 可用 | 烟测 |
| fixture score → HTML 含 formula_ceiling / ready / 四域 / ui.headline | 烟测 |
| 默认 out：`docs/harness-eng/report-latest.html` | 规格 |
| 默认 score 副本：`docs/harness-eng/score-latest.json` | 规格 |
| `node scripts/selfcheck-0.2.12.mjs` exit 0 | 烟测（版本断言可能需 0.2.13 脚本） |
| `Q_REPORT_HTML` recommended true；路径为 docs/harness-eng/ | 有 |
| manifest / skill_version = 0.2.12 | 已被 0.2.13 覆盖 |
| pipeline：score 后必 report（推荐） | 有 |

## 0.2.11 增量验收（已覆盖）

| 检查 | 结果 |
|---|---|
| HTML 报告首次落地 | 有（默认路径已迁至 docs/harness-eng） |
| manifest 0.2.11 | 已被 0.2.12 覆盖 |

## 0.2.10 增量验收

| 检查 | 结果 |
|---|---|
| fill-inventory-redis 默认多模块；Constants `REDIS_*` 可 redis:true | 烟测 |
| fill-truths-auto redis 真相均含 `## TTL` | 烟测 |
| fill-dto-batch 默认可跨模块解析 DTO | 规格 |
| fill-score 摘要含 `formula_ceiling` / 天花板说明 | 烟测 |
| `fill-calibrate-live.mjs --help` 可用 | 烟测 |
| questions：large_repo → recommended pipeline | 烟测 |
| manifest / skill_version = 0.2.10 | 有（已被 0.2.11 覆盖） |
| pipeline / fill-mcp 记载 MCP 回退与「继续」= score→calibrate→score | 有 |

## 0.2.9 增量验收

| 检查 | 结果 |
|---|---|
| `fill-truths-auto --merge` 二次跑输出 `unchanged`/`merged` | 烟测 |
| inventory-db 从 sample-create.sql 抽出 COMMENT → columnComments | 烟测 |
| inventory-redis 可产出 ttl/value 元数据（有证据时） | 烟测 |
| fill-score：含字段说明的 db 样例 score &gt; 60 | 烟测 |
| fill-score：含 Value/TTL 的 redis 样例 score &gt; 55 | 烟测 |
| fill-score `--verbose` 输出 `[OK]`/`[MISS]` + miss_histogram | 烟测 |
| inventory-api 无 Controller 模块 `skip: no controllers`；exit 2 | 烟测 |
| inventory 退出码：成功 0 / 有 warning 2 / 硬错 1 | 规格 |
| func `--shard-size` 大模块产生 part 文件 | 规格 |
| pipeline.md 规定第二轮 `--merge` + 收益递减早停 | 有 |
| manifest / skill_version = 0.2.9 | 有（已被 0.2.10 覆盖） |

## 0.2.8 增量验收

| 检查 | 结果 |
|---|---|
| fill-inventory-func.mjs 存在 | 有 |
| fill-score next_shards 仅 id/path | 烟测 |
| pipeline.md + Q_PREAUTH | 有 |
| Redis 前缀分组多文件 | 有 |
| `--summary-only` | 有 |

## 0.2.7 增量验收

| 检查 | 结果 |
|---|---|
| `include_optional: true` dry-run 展开 rule-14（selfcheck） | 烟测 |
| `fill-truths-auto.mjs --help` / `--dry-run` 可跑 | 烟测 |
| inventory 默认写出 `docs/<domain>/.fill-work/inventory.json` | 烟测 |
| fill-score 无 `--inventory` 时能读默认路径 coverage | 烟测 |
| fill-merge-api `--auto-fill` 缺 work 时可生成 shard | 烟测 |
| yaml.mjs `stringify([a,b])` → `[a, b]` | 烟测 |
| seed-truths `--max-db 0` 不截断 | 规格 |
| `all_modules: true` 扫 pom modules | 规格 |
| fill-dto-batch.mjs 存在 | 有 |
| manifest / skill_version = 0.2.7 | 有 |

## 0.2.6 增量验收

| 检查 | 结果 |
|---|---|
| `scripts/lib/yaml.mjs` 解析 manifest.files 完整 | 烟测 |
| questions-next 用 yaml lib 输出 Q_MODE | 烟测 |
| `ai_tools:[claude]` dry-run 含 `.claude/settings.json` + gate，不含 cursor hooks | 烟测 |
| `ai_tools:[cursor,workbuddy]` 两者 hooks 皆有 | 烟测 |
| settings.json merge 保留无关 key + 追加 hooks | 烟测 |
| manifest / skill_version = 0.2.6 | 有 |

## 0.2.5 增量验收

| 检查 | 结果 |
|---|---|
| fill-score：`--modules` 时 db/redis truths 仍计入（不过滤） | 烟测 |
| fill-score：有索引时空壳域分 ≥15 | 烟测 |
| seed-truths.mjs `--dry-run` 产出计划 JSON | 烟测 |
| questions-next.mjs 对 NEW_CODE land 输出 batch-0 | 烟测 |
| render dry-run 含 preview / unresolvedPlaceholders | 烟测 |
| manifest mcp-readme → mcp-usage-guide.md | 有 |
| L3：when_ai_tools cursor 过滤 + `.githooks/pre-commit` | 有 |
| manifest / skill_version = 0.2.5（已被 0.2.6 取代） | 历史 |

## 0.2.4 增量验收

| 检查 | 结果 |
|---|---|
| fill-workers：**默认串行**；并行仅适配表；无「必须 Cursor Task」 | 有 |
| fill-inventory-redis fixture ≥1 key | 烟测 |
| fill-score JSON 含 `ready`；`--ready-quality` / `--ready-coverage` | 有 |
| fill-merge-api `--enrich-dto --source-root` | 规格 + 脚本 |
| manifest / skill_version = 0.2.4（已被 0.2.5 取代） | 历史 |

## 0.2.3 增量验收

| 检查 | 结果 |
|---|---|
| fill-merge-api `--check` 对 fixtures/fill-merge | 烟测 OK |
| fill-workers.md + fill-progress.yaml.tmpl | 有 |
| gitignore snippet 含 `.fill-work/` | 有 |
| fill-dto-fields / fill-inventory-db fixture | 烟测有字段/表 |
| fill-score filter_notes（模块过滤） | 有 |
| SKILL 链路 inventory→workers→merge→score | 有 |
| manifest / skill_version = 0.2.3（已被 0.2.4 取代） | 历史 |

## 0.2.2 增量验收

| 检查 | 结果 |
|---|---|
| 推荐序 score→mcp→truths 写入 SKILL/fill.md | 有 |
| Q_FILL_MCP_FIRST + 完整档（无精简档） | questions / fill-truths |
| fill-score 识别 `**接口地址：** /path`（fixture） | 烟测：temp root + fill-api-sample → 无「缺少真实接口路径」 |
| fill-score `--inventory` / `--compare` | 规格 + 脚本参数 |
| fill-inventory-api.mjs `--help` + 模块扫 Controllers | 烟测（sms-entrance ≈399 ep） |
| manifest / harness-meta.tmpl skill_version = 0.2.2（已被后续取代） | 历史 |

## 0.2.1 增量验收

| 检查 | 结果 |
|---|---|
| fill.md / fill-score / fill-truths / fill-mcp | 有 |
| fill-score.mjs 可对目标仓跑出 overall | 烟测 |
| 密文：仓内可读可入库 写入 fill.md + conflict-policy | 有 |
| manifest.version = 0.2.1（已被 0.2.2 取代） | 历史 |

## 0.2.0 增量验收

| 检查 | 结果 |
|---|---|
| ai-tools.md + 六内置适配模板 + custom-entry | 有 |
| render `ai_tools` + `ai_tools_custom` dry-run | selfcheck `ai-tools-adapters-custom` |
| Q_AI_TOOL 含 Cursor/Claude/Codex/Qoder/Trae/WorkBuddy/自定义 | questions.md |
| manifest.version = 0.2.0 | 有 |

## 0.1.2 增量验收

| 检查 | 结果 |
|---|---|
| glossary / recommended-profile / resume 存在 | 有 |
| 「全部推荐」协议写在 questions + recommended-profile | 有 |
| WritePlan 白话摘要要求 | 有 |
| render `on_exists=skip` 对已存在目标 dry-run 为 skip | 烟测通过（sms2023-backend L4） |
| manifest.version = 0.1.2（已被 0.2.0 取代） | 历史 |
| selfcheck-render.mjs | 须保持 ok |

## 情景 1：空仓 NEW_EMPTY → land L2

| 检查 | 结果 |
|---|---|
| detect.md 可判 NEW_EMPTY | 有 |
| questions 含 Q_NAME/LADDER/CONTRACT/Q_SEED/Q_GLOB_PROFILE | 有 |
| WritePlan 闸门等价词 | SKILL + write-plan |
| L0–L2 模板齐全（含 solo AGENTS、harness-meta） | 有 |
| 确认前禁止写入 | SKILL 纪律第 1 条 |

## 情景 2：NEW_CODE_NO_HARNESS

| 检查 | 结果 |
|---|---|
| S_STACK + 无 AGENTS/rules | detect 类型 4 |
| 栈默认 globs + 手写 SQL 变体 + glob 档位 | detect.md |
| Q_STACK / Q_GLOBS / Q_GLOB_PROFILE | questions.md |
| fixture | `scripts/fixtures/new-code/pom.xml` |

## 情景 3：PARTIAL merge

| 检查 | 结果 |
|---|---|
| Q_AGENTS merge/skip/backup | questions.md |
| merge 只追加缺章节 | conflict-policy + render.mjs |
| fixture Never do 行 | `CUSTOM_NEVER_DO_LINE_DO_NOT_DROP` |
| selfcheck | `node scripts/selfcheck-render.mjs` |

## 情景 4：对本仓（c-be-sms-ai）audit

| 信号 | 本仓 |
|---|---|
| S_AGENTS_ROOT / S_RULES / S_00 / S_KARPATHY | 是 |
| S_FUNC/API/DB/REDIS / S_KB / S_SP / S_HOOKS / S_MCP | 是 |

预期：L0–L3 具备；L4 若含密 mcp 被跟踪 → 反模式；按 [audit-report.md](audit-report.md) 输出；默认不写盘。

## 情景 5（examples #4）：兄弟仓 land + 含密 README + solo + focused

| 检查 | 结果 |
|---|---|
| Q_TARGET_ROOT | questions / SKILL |
| S_SECRETS_LEAK → 移交 P0 | detect + write-plan |
| agents_variant solo 模板 | `AGENTS.root.solo.md.tmpl` |
| focused globs | detect glob 档位 |

## 运行时 fixture

目录：`scripts/fixtures/`

| 目录 | 用途 |
|---|---|
| `new-empty/` | 近空（仅说明文件） |
| `new-code/` | 假 pom → NEW_CODE_NO_HARNESS |
| `partial-agents/` | 仅根 AGENTS（含自定义 Never do） |

断言（selfcheck）：

1. dry-run 对 new-code 列出将写 `AGENTS.md` + `.cursor/harness-meta.yaml`
2. dry-run 对 partial 动作为 merge；磁盘 Never do 自定义行仍在
3. 写入 `.cursor/mcp.json` 被拒绝（非零退出）
4. **meta YAML 键级 merge**：保留 `custom_user_key`，更新 `ladder`
5. **manifest 展开**：`files:[]` + `--manifest` + L0/solo/无 optional → 含 AGENTS/meta/00/karpathy，不含 rule-14 与 `docs/`

```bash
node scripts/selfcheck-render.mjs
```

## 模板卫生抽检

| 项 | 结果 |
|---|---|
| pitfalls 无业务 Pn 数据行 | 仅 Docs 通用示例 |
| mcp.json.example 占位密 | YOUR_PASSWORD 类 |
| 无参考仓 Agent 码写入模板 | 是 |
| SKILL.md 行数 | < 500 |
| scripts/render.mjs 无 npm 依赖 | 是 |
| YAML meta merge + manifest 展开 | 1.1.1 selfcheck |

## create-skill / 1.1.1 收口

| 检查 | 结果 |
|---|---|
| `disable-model-invocation: true` | 是 |
| description 含 seed-truths 触发词 | 是 |
| examples 四情景 + 兄弟仓 | 是 |
| manifest version | 1.1.1 |
| 有 scripts/（render + selfcheck） | 是 |

## 结论

P0–P2 文档与脚本已就绪；1.1.1 补齐 meta YAML 键合并与 manifest 展开。跑通 `selfcheck-render.mjs` 后视为渲染层验收通过。Agent land 仍须遵守确认闸门与去域化纪律。
