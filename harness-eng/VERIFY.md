# harness-eng 验收记录（0.7.48）

> **维护者验收**（非上手教程）。静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。上手见 [QUICKSTART.md](QUICKSTART.md) / [guide/使用手册.md](guide/使用手册.md)。

## 版本

当前 **0.7.48**（厚仓加固；其上 0.7.47 e2e-19 · …）。报告对照 **`skill_version` + `report_schema`**（**0.4.0**；**报告壳 ≠ skill**）。Trae 对齐见 [host/TRAE-PARITY.md](host/TRAE-PARITY.md)；P0 实证全文见仓库 [`_log/harness-eng/docs/TRAE-P0-EVIDENCE.md`](../_log/harness-eng/docs/TRAE-P0-EVIDENCE.md)。

## 0.7.48 增量验收（厚仓加固）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.48` | 有 |
| 厚仓 / thickTruths 未显式指定时 `migrate-docs` 默认 **dry-run**；显式 `auto` 可写盘 | 有 |
| `parseDocFieldNames` 精确 `## 字段` + CREATE TABLE 回退；`--inventory-mode`；redis/jobs 噪声 | 有 |
| acceptance 忽略 code fence 内 `\|`；`mature_compat` 档 drift 不阻断开干 | 有 |
| `score-latest.prev.json` 备份；`ensureDbMdMaintenance` 按 manual_sql/flyway | 有 |
| upgrade `## 0.7.47 → 0.7.48`；CHANGELOG / `_log/0.7/0.7.48.md` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.47 增量验收（e2e-19）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.47` | 有 |
| `--migrate-coverage` 默认 **off**；`append` 只补缺页/缺节；`covered_gt` 无 delete op | 有 |
| upgrade 文首消歧含 `--migrate-coverage`；`## 0.7.46 → 0.7.47` | 有 |
| selfcheck 夹具 `e2e-19-longjump` / `e2e-19-cold` PASS；实仓 A/H 无金仓则 `_log/.../e2e-19-verify.md` 写明 SKIP | 有 |
| 跨 mode `last_mode` 仍为 accepted residual；宿主 Trae/Codex/CodeBuddy **不改代码**（人验日期保鲜 2026-10-14） | 有 |
| CHANGELOG 索引含 0.7.47 且存在 `_log/harness-eng/0.7/0.7.47.md` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.46 增量验收（e2e-18 P3）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.46`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade 文首「旗标消歧」含 migrate-docs / migrate-policy / check-meta-stable | 有 |
| 0.7.41 节标注历史口径 +「0.7.44+」；VERIFY 0.7.41 行含历史注 | 有 |
| glossary：migrate-docs / migrate-policy / last_mode accepted residual | 有 |
| AGENT-INDEX + QUICKSTART 含升严 CLI 与消歧 | 有 |
| fill-score `--migrate-policy` 旁注 ≠ migrate-docs | 有 |
| CHANGELOG 索引含 0.7.46 且存在 `_log/harness-eng/0.7/0.7.46.md`；upgrade `## 0.7.45 → 0.7.46` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.45 增量验收（e2e-17 P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.45`；templates / meta / questions / sync tmpl 一致 | 有 |
| `meta-stable.mjs` strip `last_mode`；`--check-meta-stable --baseline` 仅 mode 差 exit 0 | 有 |
| wrappers warn 含可复制 retire 命令；`HARNESS_RETIRE_WRAPPERS=1` 可退役；勿删 refresh-score | 有 |
| `classifyDdlDiff`：宽度+charset 风格 → style；列增删 → structural | 有 |
| calibrate 纯风格不因 `db_diff` exit2（`db_style_warn`） | 有 |
| CHANGELOG 索引含 0.7.45 且存在 `_log/harness-eng/0.7/0.7.45.md`；upgrade `## 0.7.44 → 0.7.45` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.44 增量验收（e2e-16 P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.44`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade 默认 migrate-docs=auto；path/field/schedule 漂移可结构化消 | 有 |
| `--no-migrate-docs` 不改真相文档，仍出 `doc_todos` | 有 |
| `covered_gt` / coverage 类 blocker 不删用户文档 | 有 |
| `migrate-docs-report.json` 落盘；upgrade-diff 含 `migrate_docs` | 有 |
| `--migrate-policy` ≠ `--migrate-docs`（文档区分） | 有 |
| CHANGELOG 索引含 0.7.44 且存在 `_log/harness-eng/0.7/0.7.44.md`；upgrade `## 0.7.43 → 0.7.44` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.43 增量验收（e2e-15 P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.43`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade×3 meta 字节稳定；文档写明跨 mode `last_mode` CI 可忽略 | 有 |
| obsolete wrappers stderr 含 **【旧仓升级】**；refresh-score 标准入口勿删 | 有 |
| selfcheck `(score→re→up)×2` 排除 last_mode 后 hash 稳定 | 有 |
| CHANGELOG 索引含 0.7.43 且存在 `_log/harness-eng/0.7/0.7.43.md`；upgrade `## 0.7.42 → 0.7.43` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.42 增量验收（e2e-15 P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.42`；templates / meta / questions / sync tmpl 一致 | 有 |
| 仓外 `skill_root` → `env:HARNESS_ENG_ROOT`；值未变跳过写盘；`HARNESS_ENG_ROOT` 可 resolve | 有 |
| `normalizeDdlForCompare` 忽略 int/varchar 宽度；列集合差仍可区分 | 有 |
| refresh-score tmpl 跳过 env 哨兵 | 有 |
| CHANGELOG 索引含 0.7.42 且存在 `_log/harness-eng/0.7/0.7.42.md`；upgrade `## 0.7.41 → 0.7.42` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.41 增量验收（e2e-15 P0）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.41`；templates / meta / questions / sync tmpl 一致 | 有 |
| `upgrade-diff.json` 的 `skill_version` === manifest（无硬编码 0.7.38） | 有 |
| 升严 `doc_todos` / `ready_regressed`；stderr 打印移交；不自动改用户文档（**历史**；现默认见 0.7.44 migrate-docs / 0.7.45 meta-stable） | 有 |
| CHANGELOG 索引含 0.7.41 且存在 `_log/harness-eng/0.7/0.7.41.md`；upgrade `## 0.7.40 → 0.7.41` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.40 增量验收（e2e-14 P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.40`；templates / meta / questions / sync tmpl 一致 | 有 |
| yaml-keys merge 相同则 noop 不写盘；二次 upgrade `last_mode` 不空写 | 有 |
| upgrade 补齐 `db.md`「维护约定」；不改用户索引 | 有 |
| MCP example vs live / `fill_mcp_profile` 只提示不改密 | 有 |
| selfcheck `rf→re→up` ×2 meta hash 稳定 | 有 |
| CHANGELOG 索引含 0.7.40 且存在 `_log/harness-eng/0.7/0.7.40.md`；upgrade `## 0.7.39 → 0.7.40` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.39 增量验收（e2e-14 P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.39`；templates / meta / questions / sync tmpl 一致 | 有 |
| obsolete wrappers 检测+`--retire-wrappers`；不删 `refresh-score.mjs` | 有 |
| fill-score 默认写 `score-latest.json`；`--no-write` 不写；upgrade-diff 带 `--no-write` | 有 |
| 仓内 `skill_root` 相对；`HARNESS_ENG_ROOT` 优先；refresh-score 按仓根 resolve | 有 |
| CHANGELOG 索引含 0.7.39 且存在 `_log/harness-eng/0.7/0.7.39.md`；upgrade `## 0.7.38 → 0.7.39` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.38 增量验收（e2e-14 P0）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.38`；templates / meta / questions / sync tmpl 一致 | 有 |
| `scanApiInventoryMemory` 带 `git_head`；与 HEAD 比不 stale | 有 |
| `detectDbFieldDrift` 优先 live inv；磁盘旧 inv 不挡住新列 drift | 有 |
| upgrade 收尾 `upgrade-diff.json`；升严不自动改用户文档 | 有 |
| CHANGELOG 索引含 0.7.38 且存在 `_log/harness-eng/0.7/0.7.38.md`；upgrade `## 0.7.37 → 0.7.38` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.37 增量验收（e2e-13）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.37`；templates / meta / questions / sync tmpl 一致 | 有 |
| `collectDocApiPaths` 认 `**接口地址：**`（无反引号）；改 path 出 `doc_path_drift` | 有 |
| 根 Commands 预填：`-f backend/pom.xml -pl … -am`；无 Boot 无 `spring-boot:run` | 有 |
| live 扫描成功 → 不记 `missing_inventory`；冷 clone 建议 refresh | 有 |
| func inventory 排除 entity/mapper；soft-gate hook 收窄 `Service.java` | 有 |
| CHANGELOG 索引含 0.7.37 且存在 `_log/harness-eng/0.7/0.7.37.md`；upgrade `## 0.7.36 → 0.7.37` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.36 增量验收（e2e-12 P0/P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.36`；templates / meta / questions / sync tmpl 一致 | 有 |
| `mergeApiInventories` 保留一致 `git_head`；无 stamp 时 stamp 当前 HEAD | 有 |
| `fill-score` live 经 `inventoryArgv` 回放 `sql_root` / controller_root / func modules | 有 |
| api `doc_path_drift`；jobs `doc_schedule_drift`；redis Cache/KEY → redis_true | 有 |
| mysql-guard `mcp=mysql` → local\|dev；api `--modules` 禁止仓根 controller 回退 | 有 |
| 裸模块名 LD-3 → `-f backend/pom.xml -pl …` | 有 |
| CHANGELOG 索引含 0.7.36 且存在 `_log/harness-eng/0.7/0.7.36.md`；upgrade `## 0.7.35 → 0.7.36` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.35 增量验收（e2e-11 P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.35`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade 内容相同 → 无新 `.bak-harness-*`；gitignore 含 bak 模式 | 有 |
| `.codex/hooks` 等写盘后 chmod 0755（sync 同） | 有 |
| meta `skill_root` + refresh-score 非默认路径可 resolve | 有 |
| `--mode backfill --findings` stdout WritePlan，不写盘 | 有 |
| frontend func 文档不计 covered_gt_code | 有 |
| db merge 有 `_change.sql` stub；索引 inventory 序 | 有 |
| resume `gate_profile=gold` → score-policy 落盘 gold | 有 |
| Codex soft-gate stdout JSON 含 `agent_message`，stderr 仍有提醒 | 有 |
| CHANGELOG 索引含 0.7.35 且存在 `_log/harness-eng/0.7/0.7.35.md`；upgrade `## 0.7.34 → 0.7.35` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.34 增量验收（e2e-11 P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.34`；templates / meta / questions / sync tmpl 一致 | 有 |
| inventory 缺/旧 `git_head` → `inventory_stale`，`ai_coding_ready=false` | 有 |
| redis/jobs docs>code → `covered_gt_code`；未文档化 `@Cacheable`/`@Scheduled` → drift | 有 |
| 嵌套 reactor：`mvn -f backend/pom.xml -pl order-service`，不含裸 `-f backend/order-service/pom.xml` | 有 |
| `JOBS_YML_RE` 命中 `application.yml` / `application-dev.yml` | 有 |
| 480 字业务说明仍拿 morph business 分、不报偏薄 | 有 |
| 仅有 `OrderTimeoutJob` → `S_JOBS=true`；`ladder:L5` → `Q_AGENT_CONFIG` recommended | 有 |
| CHANGELOG 索引含 0.7.34 且存在 `_log/harness-eng/0.7/0.7.34.md`；upgrade `## 0.7.33 → 0.7.34` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.33 增量验收（e2e-11 P0）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.33`；templates / meta / questions / sync tmpl 一致 | 有 |
| 嵌套 `backend/` reactor：无 `--modules` 也能扫到 services，并写 `inventory.func.modules` | 有 |
| `refresh` 回放 func `--modules` | 有 |
| L5+codex+mysql-guard：mysql-guard target 不双写；land 不 `create refused` | 有 |
| `mcp: ["mysql"]` → `MYSQL_GUARD_SERVERS=mysql-local`；`mysql-` 渲染报错；meta 持久化 | 有 |
| `*Job.java` + `@Scheduled` → jobs inventory ≥1 | 有 |
| inventory tasks=[] 时 merge 非零且不写空 SSOT | 有 |
| CHANGELOG 索引含 0.7.33 且存在 `_log/harness-eng/0.7/0.7.33.md`；upgrade `## 0.7.32 → 0.7.33` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.32 增量验收（e2e P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.32`；templates / meta / questions / sync tmpl 一致 | 有 |
| 根 AGENTS 无未装 redis/jobs skill；domains 裁剪 docs 树 | 有 |
| `MIGRATION_HEADER_KEYS` 默认 `[]`；`bad_name.sql` 触发命名提醒 | 有 |
| `MYSQL_GUARD_SERVERS` 含 `mysql-local` | 有 |
| func `svc.class` + preserve-order 发现序 | 有 |
| 缺/空 inventory + `--write-ddl` → empty_inventory，不写空 JSON、不改表文档 | 有 |
| resume 强制 `last_mode`；YAML 同值保留引号 | 有 |
| L3/L4 Codex 无 mysql MCP 时 hooks.json 无 `mcp__mysql` | 有 |
| upgrade fix-hook replace 有 `.bak-harness-*`；freshness 可提示手工 replace | 有 |
| api `--module` 过滤 endpoints 再算 missing | 有 |
| §7 #4/#9 工具侧：见 0.7.31 FC-9 / SG-1（本版不回归） | 有 |
| CHANGELOG 索引含 0.7.32 且存在 `_log/harness-eng/0.7/0.7.32.md`；upgrade `## 0.7.31 → 0.7.32` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.31 增量验收（e2e P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.31`；templates / meta / questions / sync tmpl 一致 | 有 |
| 缺 db/func inventory → `missing_inventory:*`，pass=false | 有 |
| `refresh --no-write` / inventory `--no-write` 不改盘 | 有 |
| DDL normalize + compare `db_diff>0` → exit 2；write-ddl 文案纠正 | 有 |
| 跨文件 DTO；api ratio 0.15；注解参数 ≥1 阻断；func 0.25 | 有 |
| resume + land fail → skip；错误 JSON | 有 |
| sync bareRe 匹配带引号 command | 有 |
| `.fill-work/project` update-index 命中 docs/api/api.md | 有 |
| CHANGELOG 标题 `## 0.7.31`；upgrade `## 0.7.30 → 0.7.31` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.30 增量验收（e2e P0 热修）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.30`；templates / meta / questions / sync tmpl 一致 | 有 |
| yaml 引号 key 解析为无引号；`module_roots` 双写不膨胀 | 有 |
| `--gate-profile gold` 在 strict 缺省文件上得到 morph 95 / tc 95 / harness_docs / coverage 1.0 | 有 |
| frontend「常用命令」预填成表，不覆盖 api-client 契约表 | 有 |
| fill-score 落盘 `root` 为 `.`；skill CWD 仍报 `entry_todo` | 有 |
| soft-gate `--codex` 时 `agent_message` 走 stderr | 有 |
| CHANGELOG 标题 `## 0.7.30`；upgrade `## 0.7.29 → 0.7.30` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.29 增量验收（e2e P2）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.29`；templates / meta / questions / sync tmpl 一致 | 有 |
| calibrate：compare 有 DDL diff；`--write-ddl` 保留说明；`tables:[]` → empty_inventory | 有 |
| inventory-db 保发现序；`--update-index` 进「表文档」节；缺索引 exit 1 | 有 |
| 预填匹配「常用命令」；未解析占位不写盘；YAML 布尔保型 | 有 |
| report 不 churn score-latest；inventory `--out` 相对 root；`--gate-profile` | 有 |
| api requestFields + func method drift；README/AGENTS SSOT + githooks tip | 有 |
| CHANGELOG 标题 `## 0.7.29`；upgrade `## 0.7.28 → 0.7.29` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.28 增量验收（e2e P1）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.28`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade 默认 replace hook 家族脚本；`upgrade_fix_hooks: false` 可关 | 有 |
| `--controller-root` 写 `module_roots` 不覆盖全仓根 | 有 |
| `covered_gt_code` → coverage_ready=false | 有 |
| `acceptance_warnings_max: null` 不 explicit；gold warnings=0 | 有 |
| doc-density 窄表头；HS-4 docs/ 前缀 docsGuard | 有 |
| 缺 inventory 时 `pass=false` | 有 |
| CHANGELOG 标题 `## 0.7.28`；upgrade `## 0.7.27 → 0.7.28` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.27 增量验收（e2e P0 热修）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.27` | 有 |
| CHANGELOG 标题 `## 0.7.27` | 有 |
| `buildSpringDbBlock` 可调用；无 `SPRING_DB_BLOCK_ENABLED` 引用 | 有 |
| sync 按 SSOT 接线 soft-gate；无 mysql-guard 时不硬编码 mysql matcher | 有 |
| `passesWhenGates` 在 expand 循环中调用 | 有 |
| `DB_MIGRATION_DIR` 经 ensure→hook 链路带尾斜杠 | 有 |
| 中文「常用命令」TODO 可被 `checkEntryReady` 检出 | 有 |
| fill-score `report.root` 为绝对路径 | 有 |
| upgrade `## 0.7.26 → 0.7.27` | 有 |
| sync tmpl id `0.7.27` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.26 增量验收（e2e P2）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.26` | 有（历史钉；现行见 0.7.27） |
| CHANGELOG 标题 `## 0.7.26` | 有 |
| resume/upgrade 默认 `on_exists=skip`；meta `last_mode` | 有 |
| gitignore 含 report-latest / run-latest / score-history | 有 |
| score/inventory `root` 为 `"."`（0.7.26；0.7.27 fill-score 改绝对路径） | 有 |
| fill-merge `--split-by table`；func `unit=services` | 有 |
| DU-4 stdout 可 JSON.parse；LT-11 未解析占位非 0 | 有 |
| upgrade `## 0.7.25 → 0.7.26` | 有 |
| sync tmpl id `0.7.26` | 有（历史钉；现行见 0.7.27） |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.25 增量验收（e2e P1）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.25` | 有（历史钉；现行见 0.7.26） |
| CHANGELOG 标题 `## 0.7.25` | 有 |
| db inventory 叠加 ALTER；`doc_field_drift` strict blocker | 有 |
| morph 业务说明捕获正确；score-policy `morph_floor: null`；gold 门槛 95 | 有 |
| 分册按目录选模板；Q_SEED 预填 Commands | 有 |
| 迁移命名默认 Flyway；rule13 / db.md SSOT | 有 |
| questions `remaining`/`truncated`；land 问 `Q_GATE_PROFILE` | 有 |
| upgrade `## 0.7.24 → 0.7.25` | 有 |
| sync tmpl id `0.7.25` | 有（历史；现行 `0.7.26`） |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.24 增量验收（e2e P0）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.24` | 有（历史钉；现行见 0.7.26） |
| CHANGELOG 标题 `## 0.7.24` | 有 |
| `fill-score --json --output` stdout 可 parse | 有 |
| refresh `loadDomains` 含 db（meta 有 domains 时） | 有 |
| `globListToCodePreds(**/*Controller.java)` 命中嵌套包 | 有 |
| calibrate 默认不写盘；`--write-ddl` 仅换 DDL 块 | 有 |
| sync tmpl `checkHookRefsExist`；codex hooks `when_agent_config: false` | 有 |
| upgrade `## 0.7.23 → 0.7.24` | 有 |
| sync tmpl id `0.7.24` | 有（历史；现行 `0.7.26`） |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.23 增量验收（P3/P4）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.23` | 有 |
| CHANGELOG 标题 `## 0.7.23` | 有 |
| soft-gate 含 `listActiveTopicRuns`；无 `listActiveFeatureRuns` | 有 |
| detect `S_RUNS` 含「外部控制器可选」 | 有 |
| checklist §2 只写 `eng_snapshot`（无「双写」要求） | 有 |
| 无 `conventions/repo-layout.md` / `_contracts/repo-layout.md` | 有 |
| upgrade `## 0.7.22 → 0.7.23` | 有 |
| sync tmpl id `0.7.23` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.22 增量验收（P0/P1/P2 解耦）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.22` | 有 |
| CHANGELOG 标题 `## 0.7.22`（及历史 `## 0.7.21`） | 有 |
| `templates/scripts/refresh-score.mjs.tmpl` + manifest `kb-refresh-score` | 有 |
| `delivery-checklist` §2 含 `scripts/agent-kb/refresh-score.mjs` 与 `eng_snapshot` | 有 |
| rules/checklist 用户文案含「主题收口」或「宣称交付」；无硬钉「须点名 feature-eng」 | 有 |
| SKILL「可选接力（主题流程）」；移交 P1 主题流程为可选别名 | 有 |
| upgrade `## 0.7.21 → 0.7.22` | 有 |
| sync tmpl id `0.7.22` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.21 增量验收（协议解耦文案）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.21` | 有（历史钉；现行见 0.7.22） |
| SKILL「可选接力（主题流程）」；glossary「与主题流程控制器易混词」 | 有 |
| 移交 P1 主题流程为可选；feature-eng 仅为别名 | 有 |
| hooks/rules/delivery-checklist 用户文案含「主题收口」或「宣称交付」；无硬钉「须点名 feature-eng」 | 有 |
| upgrade `## 0.7.20 → 0.7.21` | 有 |

## 0.7.20 增量验收（批 E）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.20` | 有（历史钉；现行见 0.7.22） |
| CHANGELOG 标题 `## 0.7.20`（E1/E2/E7/E8） | 有 |
| `stack-monorepo-fe-be` → `S_STACK`/`S_SPRING`/`S_FRONTEND` | 有 |
| strict `entry_todo`；`buildContractChecksJs`∪GLOB；sp skip 既有表 | 有 |
| upgrade `## 0.7.19 → 0.7.20` | 有 |
| sync tmpl id `0.7.20` | 有（历史；现行 `0.7.22`） |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.19 增量验收（批 D2–D4）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.19` | 有（历史钉；现行见 0.7.20） |
| CHANGELOG 标题 `## 0.7.19`（delivery-checklist / refresh / rule 18） | 有 |
| `templates/docs/agent-kb/delivery-checklist.md` + manifest `kb-delivery-checklist` | 有 |
| rule 00/18/19、AGENTS 指针到 delivery-checklist | 有 |
| `harness.mjs --mode refresh`（exit 0/2/1） | 有 |
| upgrade `## 0.7.18 → 0.7.19` | 有 |
| sync tmpl id `0.7.19`（历史）/ 现行 `0.7.20` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.18 增量验收（批 B：分发安全 + 就绪可信）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.18` | 有（历史钉；现行见 0.7.20） |
| CHANGELOG 标题 `## 0.7.18`（C1/C9/F14） | 有 |
| sync skills 目录：`harness-managed.json` + unmanaged 不删 | 有 |
| `fill-score` `coverage_source`；缺 inventory 可 rescanned | 有 |
| `--output` 相对 `--root` | 有 |
| upgrade `## 0.7.17 → 0.7.18` | 有 |
| sync tmpl id `0.7.18`（历史）/ 现行 `0.7.20` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.17 增量验收（批 A：L5/land 独立 P0）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.17` | 有 |
| CHANGELOG 标题 `## 0.7.17`（F3/F9/F10/F15/F17） | 有 |
| `ladderOrd` 含 L5；未知阶抛错 | 有 |
| manifest `files` 含 `score-policy`（L1）；meta 有 `gate_profile` | 有 |
| `extractEvidence` 认全角 `evidence：` | 有 |
| render 对 `.githooks/*` 调 `chmodSync`；ladder 查可执行位 | 有 |
| Spring 分册 `mavenCmdsForModule`：无根聚合 → `mvn -f` | 有 |
| upgrade `## 0.7.16 → 0.7.17` | 有 |
| sync tmpl id `0.7.17` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.16 增量验收（docs/runs 入图 + rule 18 中途 commit）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.16` | 有 |
| AGENTS tmpl（root + solo）含 `docs/runs` | 有 |
| rule 00 含 `docs/runs` 与交付双归档 / 中途 commit | 有 |
| rule 18 含进行中可中途 commit、禁止假收口、交付双归档 | 有 |
| upgrade `## 0.7.15 → 0.7.16` | 有 |

## 0.7.15 增量验收（与主题流程消歧与接力）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.15` | 有 |
| SKILL 接力节；glossary 易混词；移交含主题流程指针（0.7.22 起可选） | 有 |
| 仓库开干 ≠ 计划 Go；续跑工程化 ≠ 续跑主题 | 有 |
| upgrade `## 0.7.14 → 0.7.15` | 有 |

## 0.7.14 增量验收（报告壳 0.4.0 · 五台 + 宿主面）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.14` | 有 |
| `ui.report_schema === "0.4.0"`；含 `go_nogo` / `tasks` / `ladder_progress` / `host_surface` | 有 |
| HTML 模板五 Tab（含宿主台）+ 双轴进度 + 顶栏 capsule | 有 |
| 趋势 `incomparable` 灰显不连线 | 有 |
| 会话仪表盘可出宿主面一行；脚注「五台读法」 | 有 |
| 开干只看 `ai_coding_ready`；宿主面不否决开干 | 有 |
| upgrade `## 0.7.13 → 0.7.14` | 有 |

## 0.7.13 增量验收（使用手册大段改写）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.13` | 有 |
| 手册对外四支 / 三档；`#s6` / 公开 CLI / 4.4 / 协议族 | 有 |
| upgrade `## 0.7.12 → 0.7.13` | 有 |

## 0.7.12 增量验收（guide/ 手册搬家）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.12` | 有 |
| `guide/使用手册.md` · `.html` · `使用手册-摘要.md` 存在 | 有 |
| 根目录无三份手册；无 `docs/harness-eng/README.md` 技能树样例 | 有 |
| `ROOT_KEEP` 不含手册；`modes/`/`fill/`/`host/` 仍在 | 有 |
| upgrade `## 0.7.11 → 0.7.12` | 有 |

## 0.7.11 增量验收（入口双写去重）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.11` | 有 |
| write-plan Windows 示例钉版；QUICKSTART 只指针 | 有 |
| SKILL 无「分支 → Read」迷你表；有 score-policy 字面 | 有 |
| upgrade `## 0.7.10 → 0.7.11` | 有 |

## 0.7.10 增量验收（热路径编排压缩）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.10` | 有 |
| `SKILL.md` 对外四支 + 三档；细阶仍指 ladder | 有 |
| `AGENT-INDEX` 按四支分组；必读 ≤8 | 有 |
| upgrade `## 0.7.9 → 0.7.10` | 有 |

## 0.7.9 增量验收（可选 L4 rulehook）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.9` | 有 |
| CHANGELOG 标题 `## 0.7.9` | 有 |
| `templates/agent-config/rulehook/rulehook.toml` ≤10 rules | 有 |
| sync `mergeRulehookCodexHooks` / tmpl id `0.7.9` | 有 |
| upgrade `## 0.7.8 → 0.7.9` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.8 增量验收（calibrate 读 toml）

| 项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.8` | 有 |
| CHANGELOG 标题 `## 0.7.8` | 有 |
| `parseCodexMcpToml` / `codexTomlToMcpDoc` | 有 |
| `loadMcpCredentials` 回退 `.codex/config.toml` | 有 |
| upgrade `## 0.7.7 → 0.7.8` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.7.7 增量验收（MCP policy）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.7` | 有 |
| `templates/agent-config/mcp/policy.json` | 有 |
| sync tmpl 读 `policy.json` → `enabled` / `approval_mode` | 有 |
| upgrade `## 0.7.6 → 0.7.7` | 有 |

## 0.7.6 增量验收（redis / jobs / frontend skills）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.6` | 有 |
| `templates/agent-config/skills/{redis,jobs}-doc-sync` + `frontend-web` | 有 |
| fixture `.agents/skills/redis-doc-sync` / `jobs-doc-sync` / `frontend-web` | 有 |
| upgrade `## 0.7.5 → 0.7.6` | 有 |

## 0.7.5 增量验收（Codex Skills 种子）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.5` | 有 |
| `templates/agent-config/skills/{contract,api,db}-doc-sync` 或 contract-sync | 有 |
| fixture `.agents/skills/contract-sync/SKILL.md` | 有 |
| upgrade `## 0.7.4 → 0.7.5` | 有 |

## 0.7.4 增量验收（Codex hooks PR1）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.4` | 有 |
| `codex-hooks.json` 含 `commandWindows` / `codex-hook.cmd` | 有 |
| gitignore snippet 含 `.codex/config.toml` | 有 |

## 0.7.2 增量验收（日落 CLI shim）

| 项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.7.2` | 有 |
| `scripts/land.mjs` 缺席 | 有 |
| 域 `fill-inventory-*` / `fill-merge-*` shim 缺席 | 有 |
| upgrade `## 0.7.1 → 0.7.2` | 有 |
| `使用手册.html` 存在且钉版本 / `#s6` / 统一 CLI | 有 |

## 0.7.1 增量验收（热路径瘦身）

| 检查项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.1` | 有 |
| CHANGELOG 标题 `## 0.7.1` | 有 |
| 无根 stub / 无 host TRAE evidence stub（`使用手册.html` 已于 0.7.2 还原） | 有 |
| archive 正文与 Codex 设计稿在 `_log/harness-eng` | 有 |
| upgrade `## 0.7.0 → 0.7.1` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |

## 0.7.0 增量验收（形态 · gate · report）

| 检查项 | 期望 |
|---|---|
| manifest / meta / questions 为 `0.7.0` | 有 |
| CHANGELOG 标题 `## 0.7.0` | 有 |
| `morph_cap=100`；`morph_scale`；`report_schema` 0.3.0 | 有 |
| strict `morph_floor` 75；gold 95；ready deprecated | 有 |
| `score-policy-migrate` / `--migrate-policy` | 有 |
| upgrade `## 0.6.9 → 0.7.0` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |

## 0.6.9 增量验收（Codex 高）

| 检查项 | 期望 |
|---|---|
| manifest / meta 为 `0.6.9`（历史钉） | 有 |
| `host/CODEX-PARITY.md` · `CODEX-MANUAL.md`；适配卡 **高** | 有 |
| `codex-mcp-toml.mjs`；sync 发 toml/rules/hooks/skills | 有 |
| `codex-adapter.js`；hooks `Stop` + `^Bash$` | 有 |
| `l5-sync-codex` fixture `--check` | 有 |
| upgrade `## 0.6.8-dev → 0.6.9` | 有 |
| 安装 URL 仍 `main`；Trae / CodeBuddy 不回退 | 有 |
| 会话仪表盘：里程碑 SHOW（实质产出 / 闸门决策 / 显式读数）；提问批次·定根前·等确认空轮 **HIDE**（`session-dashboard.md`） | 有 |

## 0.6.8-dev 增量验收（Codex P0）

| 检查项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.6.8-dev`（中文要点） | 有 |
| `templates/ai-tools/codex-config.toml.tmpl`；manifest → `.codex/config.toml.example` | 有 |
| upgrade `## 0.6.7 → 0.6.8-dev` | 有 |

## 0.6.7 增量验收（正式钉号 · Pn 回流 + 前后端契约门禁）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.7`（无 `-dev`） | 有 |
| CHANGELOG 正式标题 `## 0.6.7`（非 `## 0.6.7-dev`） | 有 |
| VERIFY / README / QUICKSTART / 手册当前钉 **0.6.7** | 有 |
| api `hook_code` 含 `packages/api-client|types|queries` **regex**；nested path 可命中 | 有 |
| `S_FRONTEND`+api：detect/recommended GLOB_API 前端契约包剖面；rule 12 消费层门禁 | 有 |
| 根 AGENTS「踩坑回流」；pitfalls 路径速查骨架；lint Never do↔Pn warn | 有 |
| upgrade `## 0.6.6 → 0.6.7`；tmpl / golden `HARNESS_SYNC_TMPL_ID=0.6.7` | 有 |
| 根 `_meta/manifest.yaml` 存在且 version 与 `templates/_meta/manifest.yaml` 一致 | 有 |
| 安装 URL 仍 `main`；Trae / CodeBuddy / Codex / 0.6.6 钉号不回退 | 有 |

## 0.6.6 增量验收（正式钉号 · OpenAPI 闭环 + 分册厚 SSOT）

| 检查 | 结果 |
|---|---|
| CHANGELOG 正式标题 `## 0.6.6` | 有 |
| `templates/scripts/apifox/` 去域化；`Q_APIFOX`；`OPENAPI_BRIDGE_TIP` | 有 |
| 分册厚模板 module / spring / frontend；根「分册真相」 | 有 |
| upgrade `## 0.6.5 → 0.6.6` | 有 |

## 0.6.5 增量验收（正式钉号 · API 字段表 + sync EOL）

| 检查 | 结果 |
|---|---|
| CHANGELOG 正式标题 `## 0.6.5` | 有 |
| api-doc / api-index 模板默认 7 列；旧 5 列兼容说明 | 有 |
| acceptance：`api-empty-desc` · `api-empty-enum-remark`；good/bad 夹具金标 | 有 |
| fill-auto-api 7 列 + `quality: heuristic` | 有 |
| sync.mjs.tmpl `sameText` EOL-agnostic；`l5-sync-golden --check` 绿 | 有 |
| upgrade `## 0.6.4 → 0.6.5` | 有 |

## 0.6.4 增量验收（正式钉号 · CodeBuddy / WorkBuddy 官方对齐）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.4`（无 `-dev`） | 有 |
| CHANGELOG 正式标题 `## 0.6.4`（非 `## 0.6.4-dev`）；含「由 **0.6.4-dev** 钉号」 | 有 |
| VERIFY / README / QUICKSTART / 手册当前钉 **0.6.4** | 有 |
| workbuddy rules → `.codebuddy/rules/<stem>.md` 且保留 FM | 有 |
| hooks matcher 仍 Bash；文档含 `/hooks` 面板 + `$CODEBUDDY_PROJECT_DIR` | 有 |
| 根 `.mcp.json`；permissions 合并不 wipe；不生成 settings.local / agents | 有 |
| settings 优先级：CLI > local > project > user | 有 |
| `host/CODEBUDDY-PARITY.md` · `CODEBUDDY-P0-MANUAL.md` 基线 **0.6.4** | 有 |
| upgrade `## 0.6.3 → 0.6.4`：meta · 扁平 rules+FM · `/hooks` · L5 三步（main → check-freshness → 刷新 sync） | 有 |
| 安装 URL 仍 `main`；Trae 矩阵不改；Codex 不重开 | 有 |

## 0.6.3 增量验收（正式钉号 · freshness · 报告壳）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.3` | 有 |
| tmpl + golden 含 `HARNESS_SYNC_TMPL_ID`；stale fixture `--check-freshness` 非 0 | 有 |
| 安装 URL 指向 `main`（非 `V0.6.X`） | 有 |
| 报告壳叙事认 `report_schema`（**报告壳 ≠ skill**） | 有 |
| upgrade `## 0.6.2 → 0.6.3`：meta · 三步（main → check-freshness → 刷新 sync）· 报告壳 | 有 |

## 0.6.2 增量验收（会话仪表盘去掉 mermaid）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / meta / questions 为 `0.6.2` | 有 |
| session-dash stdout 无 mermaid 围栏 / `quadrantChart` | 有 |
| 有 score 时纯文本「施工态势」 | 有 |

## 0.6.1 增量验收（Trae 高）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| （历史）manifest / meta / questions 曾钉 `0.6.1` | 有 |
| [`_log/.../TRAE-P0-EVIDENCE.md`](../_log/harness-eng/docs/TRAE-P0-EVIDENCE.md) T-P0-1…4 状态表；T-P0-2 MCP 面板 PASS | 有 |
| Trae 镜像保留 `alwaysApply` / `globs`；Claude/Qoder 仍 strip | 有 |
| `mature-trae` 无 `.cursor/rules` 仍 MATURE；L5 sync 路径已钉 | 有 |
| 适配卡去掉「若宿主支持」；矩阵 Trae **高** | 有 |
| 矩阵 中高→高（T-P1-5） | 有 |
| L5 计划含 SSOT `00-harness-ssot.mdc`（含 Trae-only）；1x 仍 omit | 有 |

## 历史增量（已归档）

完整表见仓库 [`_log/harness-eng/docs/VERIFY-history-through-0.6.0.md`](../_log/harness-eng/docs/VERIFY-history-through-0.6.0.md)。

| 里程碑 | 关键词（selfcheck 对照） | 归档 |
|---|---|---|
| **0.6.1** Trae P0 / mature-trae | Trae P0 · mature-trae | 同上「0.6.1」节 |
| **0.6.0 M4** 发包 · legacy | M4 · legacy · 发包 | 同上「M4」节 |
| **0.6.0-dev M3** 黄金集 | M3 · l5-sync-golden · 黄金 | 同上「M3」节 |
| **0.6.0-dev M2** 文档拓扑 | M2 · 根目录 | 同上「M2」节 |
| 0.6.1-dev / 0.5.10…0.5.2 | 见归档全文 | 同上 |
