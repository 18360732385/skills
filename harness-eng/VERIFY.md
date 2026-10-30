# harness-eng 验收记录（0.7.56）

> **维护者验收**（非上手教程）。静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。上手见 [QUICKSTART.md](QUICKSTART.md) / [guide/使用手册.md](guide/使用手册.md)。

## 版本

当前 **0.7.56**（sms-ai P0/P1/#9 回流；其下 0.7.55 ARCHIVE 路径 · 0.7.54 upgrade_fix_hooks=auto · …）。报告对照 **`skill_version` + `report_schema`**（**0.4.0**；**报告壳 ≠ skill**）。Trae 对齐见 [host/TRAE-PARITY.md](host/TRAE-PARITY.md)；Qoder 见 [host/QODER-PARITY.md](host/QODER-PARITY.md)；P0 实证全文为仓库级档案 `TRAE-P0-EVIDENCE.md`（不随安装分发）。

## 0.7.56 增量验收（sms-ai P0/P1/#9）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.56` | 有 |
| superpowers README 含「约定」；plans/specs 有 README.tmpl；manifest `sp-readme-active-*` | 有 |
| 00 无薄片 TODO；高频避坑 ≥5 行；agent-kb README 路径速查优先 | 有 |
| rule 18 含判断表（进行中/宣称交付）；AGENTS.root 含 Planning corpus | 有 |
| rule 19 一行一错 + 双速查；domains/soft-gate tip 含「真相」口径 | 有 |
| upgrade `## 0.7.55 → 0.7.56`；CHANGELOG 0.7.56；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.55 增量验收（sms-ai ARCHIVE 对标）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.55` | 有 |
| `sp-archive` target = `docs/superpowers/archive/ARCHIVE.md`；无根级 `ARCHIVE.md.tmpl` | 有 |
| README / rule 18 / 00 链到 `archive/ARCHIVE.md`；表头含「用户」列 | 有 |
| `migrateSuperpowersArchiveIfNeeded` + `looksLikeSuperpowersThemeTable`（认用户列） | 有 |
| upgrade `## 0.7.54 → 0.7.55`；CHANGELOG 0.7.55；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.54 增量验收（upgrade_fix_hooks=auto）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.54` | 有 |
| upgrade 默认 `upgrade_fix_hooks=auto`；显式 `replace`/`skip`/`true`/`false` | 有 |
| 结构定制 soft-gate → skip + sidecar；纯常量差 → replace；adapter 始终 replace | 有 |
| upgrade-diff：`hooks_fix_policy` / `hooks_skipped_custom` / `hooks_behavior_patch_skipped` | 有 |
| upgrade `## 0.7.53 → 0.7.54`；CHANGELOG 0.7.54；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.53 增量验收（厚仓 hooks 加固）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.53` | 有 |
| `normalizeMigrationDir` 拒绝 `**/…`；默认 `db/migration/`；inventory `sql_root` 回填 | 有 |
| `hook-backfill.mjs`：脚本探测 + 旧 soft-gate 刮取；`hook_profile` mature/thin（≠ gate mature_compat） | 有 |
| `buildContractChecksJs` 只用 `hook_code`，不并 GLOB | 有 |
| soft-gate mature 真跑 lint/sync --check；stop 指纹 + loop_count | 有 |
| `ensureDbMdMaintenance` manual_sql 无 `0001_DDL` 虚构样例 | 有 |
| upgrade-diff 含 `hooks_placeholder_delta` / `capability_lost` | 有 |
| upgrade `## 0.7.52 → 0.7.53`；CHANGELOG 0.7.53 索引行；仓库级版本要点档案 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.52 增量验收（全量修复列车）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.52` | 有 |
| `questions-next` 用 `isCliMain`；四处 replace→replacer；rule-17 互斥；`mature_compat` 题库+fill-gate | 有 |
| 六 mode / report_schema 0.4.0 / 会话四句块 / dual-manifest 权威口径一致 | 有 |
| CRLF/BOM/maxBuffer/yaml 块标量抛错；孤儿清理；无包内 `score-latest.json`；无 `skill_patch: 0.2.16` | 有 |
| `templates/_meta/RENDER-REGISTRIES.md`；upgrade/VERIFY 近窗 + 仓库级历史档案；无 `evals/`（skill-up 评测套件已移除） | 有 |
| upgrade `## 0.7.51 → 0.7.52`；CHANGELOG 0.7.52 索引行；仓库级版本要点档案 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`selfcheck-render.mjs` ok；`sync-skill-version --check` ok | 有 |

## 0.7.51 增量验收（SQL 迁移命名双轨）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.51` | 有 |
| soft-gate `MIGRATION_OLD_NAME_RE`（`null`=单轨默认）+ 新增(A)/改名(R) 双状态 + 「旧格式/不合规」文案分离（M 不刷屏） | 有 |
| `hooks-checks.mjs` `migration_old_name_re` 三通道注入 + `domains.yaml` `db.hook_old_name_re` 可选键 | 有 |
| 可选包 `migration-naming-lib` / `new-migration-py`（`MIGRATION_DIR_REL` / `MIGRATION_TZ` 占位；`render.mjs` 默认注入） | 有 |
| rule 13 / db.md「当前最高号/最新时间戳」禁令（目录即清单） | 有 |
| upgrade `## 0.7.50 → 0.7.51`；CHANGELOG 0.7.51 索引行；仓库级版本要点档案（不随包分发） | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.50 增量验收（运行时 _log 零依赖）

| 项 | 期望 |
|---|---|
| `scripts/fill-truths-auto.mjs` 不存在；archive INDEX 标「已归档 · 不可运行 · 对话不推荐」 | 有 |
| 随包树零 `_log` 引用（豁免仅 selfcheck 三件套：`selfcheck.mjs` / `lib/selfcheck/checks-0.5.mjs` / `checks-0.6.mjs`，内部均 hasLog 门禁） | 有 |
| CHANGELOG 索引行纯版本号格式（`| 0.7.50 |`）；头行「仓库级档案」措辞 | 有 |
| VERIFY / AGENT-INDEX / upgrade.md / host 家族 / archive 家族 / adapters / `.skillignore` 零 `_log` 路径 | 有 |
| selfcheck 双态：dev 全仓全绿；install 态模拟（无 `_log`、按 `.skillignore` 裁剪）exit 0 + 跳过提示 | 有 |
| 仓根 README 新增「仓库级档案与发版」节（布局 + 发版手册 + 门禁约定） | 有 |
| upgrade `## 0.7.49 → 0.7.50`；CHANGELOG 索引 0.7.50 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.49 增量验收（sms-ai 实践回流）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.49` | 有 |
| SKILL.md 硬闸门 / fill-mcp.md 含 `vendored_shared` 例外与 L5 `servers.json` 路径档 | 有 |
| rule-17 薄指针为默认；`rule-17-full` 厚正文可选（二选一）；17 模板保留「协作包」标记 | 有 |
| rule 18 / superpowers README 索引表含「用户」列与取值约定 | 有 |
| soft-gate 六合一：`MIGRATION_ENV_STATUS_CMD`（dev 账本 status + 降级）· `MIGRATION_NEW_SCRIPT`（命名软提醒）；hooks-checks 注入 + domains.yaml 可选键 | 有 |
| 00 rule 提交门禁含 Apifox 条；文档权威含第 9 位环境/部署文档（可选） | 有 |
| pitfalls 模板 ID 治理头部 + 「相关」段；`agent-config/mcp/README.md` 模板 + ADR 回链行 | 有 |
| agents 模板：root 环境变量节 · spring 变更记录/错误码速查/§4.x · frontend 变更记录 | 有 |
| apifox `upgrade-field-tables-to-7col.mjs`（去域化）+ `host/QODER-PARITY.md` + AGENT-INDEX 登记 | 有 |
| upgrade `## 0.7.48 → 0.7.49`；CHANGELOG 索引 0.7.49 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.48 增量验收（厚仓加固）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.48` | 有 |
| 厚仓 / thickTruths 未显式指定时 `migrate-docs` 默认 **dry-run**；显式 `auto` 可写盘 | 有 |
| `parseDocFieldNames` 精确 `## 字段` + CREATE TABLE 回退；`--inventory-mode`；redis/jobs 噪声 | 有 |
| acceptance 忽略 code fence 内 `\|`；`mature_compat` 档 drift 不阻断开干 | 有 |
| `score-latest.prev.json` 备份；`ensureDbMdMaintenance` 按 manual_sql/flyway | 有 |
| upgrade `## 0.7.47 → 0.7.48`；CHANGELOG 索引 0.7.48 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.47 增量验收（e2e-19）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.47` | 有 |
| `--migrate-coverage` 默认 **off**；`append` 只补缺页/缺节；`covered_gt` 无 delete op | 有 |
| upgrade 文首消歧含 `--migrate-coverage`；`## 0.7.46 → 0.7.47` | 有 |
| selfcheck 夹具 `e2e-19-longjump` / `e2e-19-cold` PASS；实仓 A/H 无金仓则 仓库级档案 `e2e-19-verify.md` 写明 SKIP | 有 |
| 跨 mode `last_mode` 仍为 accepted residual；宿主 Trae/Codex/CodeBuddy **不改代码**（人验日期保鲜 2026-10-14） | 有 |
| CHANGELOG 索引含 0.7.47 | 有 |
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
| CHANGELOG 索引含 0.7.46；upgrade `## 0.7.45 → 0.7.46` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |


## 更早增量验收（历史增量）

0.7.45 及更早见仓库级档案 `VERIFY-history-through-0.7.51.md`（安装包不随附）。  
更早窗口另见 `VERIFY-history-through-0.6.0.md` / `VERIFY-history-through-0.2.27.md`（均为仓库级档案）。

