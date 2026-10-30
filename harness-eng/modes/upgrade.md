# upgrade（升阶）

## 旗标消歧（勿混用）

| 旗标 / CLI | 作用对象 | 说明 |
|---|---|---|
| `--migrate-docs[=auto\|dry-run\|off]` | 真相文档 `docs/{api,func,db,redis,jobs}` | 薄仓默认 **auto**；**厚仓 / MATURE 默认 dry-run**（0.7.48）；写真相须显式 `--migrate-docs=auto`；`--no-migrate-docs` 仅 `doc_todos` 移交 |
| `fill-score --migrate-policy` | `score-policy.yaml` 字段（如 `morph_floor`） | **≠** `--migrate-docs`；不写真相文档 |
| `--check-meta-stable [--baseline]` | `harness-meta.yaml` | CI 稳态；默认忽略 `last_mode`（跨 mode **accepted residual**） |
| `--migrate-coverage[=off\|append\|dry-run]` | 覆盖类 blocker（`coverage_ready` / `covered_gt`） | **默认 off**；`append` 只补缺页/缺节；`covered_gt` 仍移交、不删文档；**≠** `--migrate-docs` |

## Done

1. 本轮 WritePlan 所列升阶缺口已 `create` / `skip` / `merge`（`on_exists=skip`）
2. `docs/harness-eng/harness-meta.yaml` 的 `ladder` 已升到目标阶，`last_mode=upgrade`，`skill_version` 与 manifest 一致（若仅有遗留 `.cursor/` meta：先迁到新路径再写）
3. 目标阶 [ladder.md](ladder.md) 必备项勾选通过；分级移交 TODO 已打印
4. **升版后必跑升严差分 + acceptance 摘要**  
   - `harness --mode upgrade` 成功收尾写 `docs/harness-eng/upgrade-diff.json`（stderr 摘要）；对照升前 `score-latest.json` 的 blockers  
   - **migrate-docs**：薄仓默认 auto；厚仓默认 **dry-run**（仍出 `migrate-docs-report.json`）；显式 `--migrate-docs=auto` 才写真相；`--no-migrate-docs` 仅 `doc_todos` 移交  

   - `coverage` / `covered_gt` **默认不自动改文档**（`--migrate-coverage` 默认 **off**）。可选 `append` 只补缺页/缺节；`covered_gt` 仍移交、**不删**用户文档。残留 TODO 见 stderr  
   - 仍建议：`node scripts/acceptance-check.mjs --root <TARGET> [--gold]`（或 `fill-plan --residual [--gold]`）  
   - 仅 warnings 且批次已关：走 `fill-plan --residual` 清残项
   - 旧仓若仍有 `fill-score-ready.mjs` / `cold-bootstrap*.mjs`：upgrade/refresh stderr 会打 **【旧仓升级】** warn（必看，含可复制退役命令）；`--retire-wrappers` 或 `HARNESS_RETIRE_WRAPPERS=1` 移到 `scripts/agent-kb/_obsolete/`。**`refresh-score.mjs` 是标准入口，勿删**
   - CI 跨 mode meta：`harness --check-meta-stable --root <TARGET> [--baseline <meta.yaml>]`（默认忽略 `last_mode`；**accepted residual**）

当前阶梯已齐、只要再升阶时使用。默认 **完整阶 +1**；用户书面「升到 Ln」可一次覆盖中间阶缺口。

## 触发

- **升阶**（upgrade）
- meta 已齐当前阶，用户只要更高阶（未指定则 +1）
- 用户书面「升到 L3 / L4」且当前低于目标（可与 resume 二选一，见下表）

## 流水线

```
- [ ] 1 定根 + 读 harness-meta（先 `docs/harness-eng/harness-meta.yaml`，无则回退 `.cursor/`；当前 ladder / domains / skill_version）
- [ ] 2 定目标阶：默认 current+1；书面指定则用书面阶
- [ ] 3 对照 ladder.md + manifest，列出「当前阶已有 / 升阶缺口」
- [ ] 4 条件提问（升阶相关；可「全部推荐」）— 每批≤5；若仓已有 score-policy，确认 **`Q_GATE_PROFILE`**（推荐 strict；要兼容则 legacy）
- [ ] 5 WritePlan：仅缺口路径；注明跳阶依据（默认 +1 或用户书面）；含 score-policy `gate_profile` / `coverage_mode` 若需升档
- [ ] 6 确认闸门后 `scripts/harness.mjs --mode upgrade`（非 L5 委托 render；L5 走 sync）：params.on_exists=skip
- [ ] 7 自检 + 更新 meta.ladder / last_mode=upgrade / skill_version + 移交 TODO
- [ ] 8 **acceptance 摘要**（`--root` + 可选 `--gold`）；blockers>0 写入移交；warnings → `fill-plan --residual`
```

### 0.3.0 开干档迁移（upgrade / resume）

若目标仓已有 `docs/harness-eng/score-policy.yaml` 且未写 `gate_profile`，**运行时已按 strict**。升阶时应：

1. 提问 `Q_GATE_PROFILE`（【推荐】**strict**）
2. WritePlan 写明将写入的 `gate_profile` / `coverage_mode=all_domains`（大仓）
3. 用户要兼容旧开干结论时写 `gate_profile: legacy`

细节：闸门 [write-plan.md](write-plan.md)；探测 [detect.md](detect.md)；阶梯 [ladder.md](ladder.md)。

## 与 land / resume 边界

| 场景 | 用 |
|---|---|
| 无任何 harness 指纹 | `land` |
| 有部分文件或 meta 未满**当前目标**阶 | `resume` |
| meta 已齐当前完整阶，只要再 +1 或书面到 Ln | `upgrade` |
| 只想看报告 | `audit` |

用户书面「升到 L4」且当前 L2：`resume` / `upgrade` 均可；WritePlan 须含 L3+L4 缺口，并写明跳阶依据为用户书面要求。

## render 参数

与 resume 相同骨架：`on_exists=skip`，`expandFromManifest: true`，`ladder` = 目标阶。示例见 [resume.md](resume.md)。
**例外**：L5 `agent-config-sync`（`scripts/agent-config/sync.mjs`）即使 `on_exists=skip` 也从 skill tmpl **replace**，避免消费仓脚本静默过期。升级 L5 后须刷新 `sync.mjs`，再 `node scripts/agent-config/sync.mjs`。对照：`node scripts/harness.mjs --check-freshness --root <TARGET>`。

## 0.7.59 → 0.7.60 迁移要点

1. **meta**：`skill_version` → `0.7.60`
2. **报告壳**：`report_schema` **0.4.1**（首屏 gap/headline 人话化；宿主三态 `status_zh`；0.4.x 趋势仍可比）
3. **重渲报告**：`node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json`
4. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.60`）后再 sync（若仅升报告壳、未改 sync 语义，仍建议对齐 tmpl id）

## 0.7.58 → 0.7.59 迁移要点

1. **meta**：`skill_version` → `0.7.59`
2. **L5 skills 投影**：契约种子 **仅** 写入 Codex `.agents/skills/`；不再镜像到 `.cursor|.qoder|.claude|.trae|.codebuddy/skills`
3. **legacy prune**：刷新 `sync.mjs` 后跑 sync，按各目录 `.harness-managed.json` 清理曾托管的契约 skills（用户自建 skill 保留）
4. **Cursor 族**：契约纪律继续走 rules（`.mdc`/`.md`）；宿主 `*/skills/` 留给用户/项目 skills
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.59`）后再 sync

## 0.7.57 → 0.7.58 迁移要点

1. **meta**：`skill_version` → `0.7.58`；upgrade **保留** `installed_at`，回写 `upgraded_at`（tmpl 新增该键）
2. **hooks 审计**：`hooks-fix-skip.json` 含 `hooks_reviewed` / `hooks_not_in_write_set`（解释相对旧版 skip 变窄）
3. **CLI**：`questions-next --root`；`bump-run-round --dry-run`；`calibrate-live` → `fill-calibrate-live` 别名
4. **开干归因**：upgrade-diff `summary_zh` + stderr `【开干归因】`
5. **acceptance 口径**：fill-score `gold_ratio` / blockers 改为全域（同 CLI `--domain all`）；gold 闸可能变严
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.58`）后再 sync

## 0.7.56 → 0.7.57 迁移要点

1. **meta**：`skill_version` → `0.7.57`
2. **dry-run hooks**：`--dry-run` 与真写共用 `decideFixHookAction`；结构定制预告进 `hooks_skipped_custom`（勿再误信 dry-run 必 replace）
3. **人话审计**：skip / `capability_lost: hooks_behavior_patch_skipped` 时 stderr 列未落地占位与 replace/手改建议
4. **报告口径**：HTML / fill-report-html 主 chip 与摘要只看 `ai_coding_ready`；旧 `ready.ok` 降为 deprecated 副标
5. **redis inventory**：Lua 脚本体（`redis.call` / KEYS+ARGV）不再进 `doc_key_drift` / migrate-docs 预览
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.57`）后再 sync

## 0.7.55 → 0.7.56 迁移要点

1. **meta**：`skill_version` → `0.7.56`
2. **superpowers**：README 增「约定」薄段；活跃 `plans/`、`specs/` 落地短 README（替代仅 `.gitkeep`）
3. **rules / AGENTS**：00 高频避坑薄片落地；rule 18「AI 提交门禁」判断表；根 AGENTS 补 Planning corpus；rule 19 一行一错 + 双速查同步
4. **hooks tip**：契约提醒强调只认真相子目录（`modules|table|keys|tasks`）；domains `hook_tip` 同口径
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.56`）后再 sync

## 0.7.54 → 0.7.55 迁移要点

1. **meta**：`skill_version` → `0.7.55`
2. **ARCHIVE 权威路径**：`docs/superpowers/archive/ARCHIVE.md`（对齐 sms-ai 活跃/归档物理隔离）；land/upgrade 经 `migrateSuperpowersArchiveIfNeeded` 把遗留根级 `docs/superpowers/ARCHIVE.md` **复制**到新路径（不删旧文件）
3. **索引列**：ARCHIVE 表头与 README/rule 18 统一为 `日期 | 用户 | 主题 | Spec | Plan | Commit`；勿再新建根级 stub ARCHIVE
4. **双文件态**（根 stub + archive 真表，如 sms-ai）：以 `archive/ARCHIVE.md` 为准；根 stub 可人工删除或留作兼容
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.55`）后再 sync；rule 18 / 00 会随 replace/merge 更新路径话术

## 0.7.53 → 0.7.54 迁移要点

1. **meta**：`skill_version` → `0.7.54`
2. **upgrade_fix_hooks 默认 `auto`**（不再硬默认 `true`）：剥常量后正文≠模板 → 该 hook **skip** 并 stderr；适配器/`codex-hook.cmd` 在 auto 下仍 replace；显式 `replace`|`true` 强制盖；`skip`|`false` 全关
3. **审计**：`docs/harness-eng/hooks-fix-skip.json` sidecar；upgrade-diff 含 `hooks_fix_policy` / `hooks_skipped_custom` / `capability_lost: hooks_behavior_patch_skipped`
4. **≠ hook_profile**：`mature` 仅影响 autorun/门闩；无结构差时 auto 仍可 replace 修行为
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.54`）后再 sync

## 0.7.52 → 0.7.53 迁移要点

1. **meta**：`skill_version` → `0.7.53`
2. **P0 hooks**：禁止 `**/db/migration/` 写入 hook 常量（`startsWith` 非 glob）；`inventory.db.sql_root` / 旧 hook 刮取 / `apply_env_migrations.py`·`new_migration.py` 探测回填厚仓旋钮
3. **hook_profile**：`mature`|`thin`（**≠** `gate_profile: mature_compat`）；探测到 lint-pitfalls / apply_env_migrations / `docs/agent-config` 默认 mature——soft-gate 真跑 lint/sync --check；stop 开指纹去重与 status/loop 门闩
4. **CONTRACT_CHECKS**：不再把 `GLOB_*` 并进 code pred（rules 仍用宽 glob）
5. **db.md**：维护约定禁止虚构 `0001_DDL_xxx`；以本仓 AGENTS / rule 13 为准
6. **upgrade-diff**：增加 `hooks_placeholder_delta` / `capability_lost[]`
7. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.53`）后再 sync；hooks replace 前占位须已回填

## 0.7.51 → 0.7.52 迁移要点

1. **meta**：`skill_version` → `0.7.52`
2. **P0**：`questions-next` 用 `isCliMain`；四处动态 `String.replace` 改 replacer；`rule-17`/`rule-17-full` 互斥预检；`mature_compat` 进题库与 fill-gate
3. **文档/脚本**：六 mode 口径；CRLF/BOM/maxBuffer；yaml 块标量抛错；尸体清理；`skill_patch` 去掉；包内 score-latest 剔除
4. **结构**：`RENDER-REGISTRIES.md`；upgrade/VERIFY 近窗 + 仓库级历史档案；`parseFillScoreJson` 抽公共；`evals/` 已从 skill 树移除（改以 selfcheck 回归）
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.52`）后再 sync

## 0.7.50 → 0.7.51 迁移要点

1. **meta**：`skill_version` → `0.7.51`
2. **soft-gate 双轨**：默认行为不变（`MIGRATION_OLD_NAME_RE=null` 单轨）；厚 manual_sql 仓在 `domains.yaml` `db.hook_old_name_re` 或 params `migration_old_name_re` 下发存量旧格式正则后，commit 软提醒区分「仍用旧格式」与「不合规」；命名检查扩展到改名（R）
3. **可选包**：`include_optional` 加 `migration-naming-lib` + `new-migration-py` 得发号 CLI（`scripts/new_migration.py --type DDL|DML "说明"` / `--pair`）；`soft-gate` `hook_new_script` 可指向它
4. **最高号禁令**：rule 13 / db.md 新增「勿把当前最高号/最新时间戳写死进 AGENTS/README/db.md」——存量仓若已写死须人工移除（migration 目录即清单）
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.51`）后再 sync

## 0.7.49 → 0.7.50 迁移要点

1. **meta**：`skill_version` → `0.7.50`
2. **运行时 `_log` 零依赖**：`scripts/fill-truths-auto.mjs` stub 已删（0.5.10 起该 stub 因路径与 lib 依赖实际不可运行；历史规格/全文为仓库级档案，见仓根 README「仓库级档案与发版」节）；随包文档零 `_log` 路径，一律以「仓库级档案」指代
3. **双态 selfcheck**：新增 `hasLogRoot` 检测——无 `_log`（install 态）时档案断言自动跳过并提示；全仓 dev 态全量真跑。**约定：新增档案断言必须以 `hasLogRoot` 门禁包裹**
4. **`Q_FILL_ENGINE=auto`**：已归档移除（脚本下线）；仅 `agents`【推荐】/ `hybrid`
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.50`）后再 sync

## 0.7.48 → 0.7.49 迁移要点

1. **meta**：`skill_version` → `0.7.49`
2. **rule-17 二选一**：默认薄指针（正文 SSOT=前端分册 AGENTS）；无前端分册仓改 `include_optional` 加 `rule-17-full`（同 target，勿同装）
3. **soft-gate 新占位**：`MIGRATION_ENV_STATUS_CMD`（dev 账本自动 --status；非零退出码带回输出；超时/依赖缺失降级）与 `MIGRATION_NEW_SCRIPT`（新增迁移命名软提醒）；均默认空=禁用；厚 manual_sql 仓可在 domains.yaml `db.hook_env_status_cmd` / `db.hook_new_script` 或 params 下发
4. **vendored_shared**：SKILL.md 硬闸门与 fill-mcp.md 话术已补例外（真密入 `docs/agent-config/mcp/servers.json` + sync 分发，勿 gitignore）；消费仓 meta 已声明该档的，`--check-freshness` 后刷新 `sync.mjs` 即可
5. **superpowers 索引**：表列变 `日期 | 用户 | 主题 | Spec | Plan | Commit`（用户=代表性实现 commit 作者；Commit=代表性实现 commit 非 MR）；存量表可保持旧列，新行按新列
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.49`）后再 sync

## 0.7.47 → 0.7.48 迁移要点

1. **meta**：`skill_version` → `0.7.48`
2. **厚仓 migrate-docs**：MATURE / 已有非空真相时**默认 dry-run**（仍写 `migrate-docs-report.json`）；写真相文档须显式 `--migrate-docs=auto`
3. **API 挂接**：缺端点按路径前缀匹配模块；无匹配则新建页，禁止一律 append 到第一个 md
4. **drift**：`## 字段` 精确标题；CREATE TABLE 可作字段 SSOT；`--inventory-mode file|live|hybrid`；redis/jobs 噪声过滤；schedule `${prop:default}` 归一化
5. **开干档**：厚成熟仓可用 `gate_profile: mature_compat`（acceptance 金标 + strict 形态；drift 不阻断）
6. **卫生**：覆盖 `score-latest` 前备份 `score-latest.prev.json`；尺度变更 stderr 提示「尺度不可比」；`db.md` 维护约定按 `manual_sql`/`flyway` 渲染
7. **acceptance**：参数表解析忽略 code fence 内的 `|`

## 0.7.46 → 0.7.47 迁移要点

1. **meta**：`skill_version` → `0.7.47`
2. **migrate-coverage（默认 off）**：`--migrate-coverage=append|dry-run` 只补 `docs/{api,func,db,redis,jobs}` 缺页/缺节；`covered_gt` 仍移交，禁止删文档灌水。与 `--migrate-docs`（path/field/task/schedule/key）正交
3. **验证**：selfcheck 夹具覆盖长跳（`e2e-19-longjump`）与冷 clone（`e2e-19-cold`）；实仓记录见仓库级档案 `e2e-19-verify.md`（不随安装分发）
4. **残留**：跨 mode `last_mode` 仍是 **accepted residual**（`--check-meta-stable`）
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.47`）后再 sync


## 更早迁移

0.7.45 及更早全文见仓库级档案 `upgrade-history-through-0.7.51.md`（安装包不随附；dev 全仓 `hasLogRoot` 门禁可读）。

