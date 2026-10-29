# release-eng 验收记录（0.3.32）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。

## 版本

当前 **0.3.32**（修复轮：`_change.sql` 剔除/nacos prod 判定、prior-since 新式身份、状态精确匹配、seal 事务性与尾注、BOM 统一、`--overdue-waived` 落点、repo-profile 外置、conventions SSOT）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)（明细 [`../_log/release-eng/`](../_log/release-eng/)）。

## 0.3.32 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（367/367） | 有 |
| manifest / 文档钉头 **0.3.32**；`sync-skill-version --check` | 有 |
| 新增 selfcheck 断言组 ①–⑪（sql-bundle `_change.sql`+D7 保旧 · nacos prod 判定 · enrich prodPath · prior-since 新式身份 · seal `--apply` 事务性 · 状态精确匹配 · BOM · `--overdue-waived` · repo-profile · prodConfigKeyCount · conventions SSOT） | 有（selfcheck） |
| conventions.md 约定 SSOT + 入口索引去重（SKILL/AGENT-INDEX/QUICKSTART/README 引用不复述） | 有 |
| repo-profile 外置（`scripts/lib/repo-profile.mjs`：深合并覆盖 + 纯函数可选参注入；坏 JSON 回退 DEFAULT） | 有（selfcheck） |
| seal `--apply` 事务顺序（先 gitMv 后写 patched；sql-bundle 失败路径保留旧整理文件） | 有（selfcheck） |
| note-merge `--overdue-waived`（硬闸未 waived 拒绝写盘；waived 落 `artifacts.json.overdueWaived{reason,date}`） | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.31 增量验收（历史补录）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（历史 298/298） | 烟测（历史补录） |
| N14 收口 docs-hit fixedDelay / 非 cron（`scheduleType` + `intervalKeys`，不误报 cron 缺口） | 有（selfcheck N14 实仓形状夹具） |
| selfcheck 实仓形状夹具（`cronKey=null` + taskCode 回退路径） | 有（selfcheck） |
| manifest / 文档钉头 **0.3.31**（历史钉；现行见 0.3.32）；当时 `sync-skill-version --check` | 有（历史补录） |
| 仍标明非 harness land | 有 |

## 0.3.30 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| manifest / 文档钉头 **0.3.30**；`sync-skill-version --check` | 有 |
| N11 值变更 `changed` 进 draft + `旧→新`；身份 suppress 仍有效 | 有（selfcheck） |
| N12 `完整记录` 在 auto:git 内 / 旧壳空行兜底 | 有（selfcheck） |
| N7 `pathBucket` top-level + inferServices | 有（selfcheck） |
| N13 未跟踪 `gitMv` → fs-rename 无 fatal warning | 有（selfcheck） |
| N14 interval 伴键覆盖 cron 交叉 | 有（selfcheck） |
| N1 叶子继承父级 map 注释 | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.29 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有（271/271，历史） |
| manifest / 文档钉头 **0.3.29**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.30） |
| N1 `flattenYamlKeys` 上一行优先 / 行尾兜底 / 空行隔离 | 有（selfcheck） |
| N2 `findSyncTaskCodeFiles` + 无冒号 task_code | 有（selfcheck） |
| N4 draft/changeObjects 剔除父级键 | 有（selfcheck） |
| N9 `release-seal.mjs` dry-run + index/ARCHIVE helpers | 有（selfcheck） |
| N10 `stripBom` | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.28 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有（248/248，历史） |
| manifest / 文档钉头 **0.3.28**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.29） |
| `classifyMigrationKindByFilename` 双轨 + 旧四位子号不误判 | 有（selfcheck） |
| `runSqlBundle` 生成 `release-V*-DDL\|DML`；缺侧不落盘；篡改检测 | 有（selfcheck） |
| note-merge → `sql/refs/` + `sqlBundles`；seal-check 硬校验 | 有 |
| 仍标明非 harness land | 有 |

## 0.3.27 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（历史） |
| manifest / 文档钉头 **0.3.27**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.28） |
| 进行中路径 = `docs/releases/<slug>/`；fixtures 无 `notes/` | 有 |
| note-merge / seal-check / overdue 扫新路径；兼容旧 notes/ | 有 |
| 仍标明非 harness land | 有 |

## 0.3.26 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（历史） |
| manifest / 文档钉头 **0.3.26**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.27） |
| `isMergeSourceNoise`；summary 跳过 test/uat；折叠行合计 | 有（selfcheck） |
| `bundleSqlVolumeWarning` 40/100 阈值 | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.25 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（历史） |
| manifest / 文档钉头 **0.3.25**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.26） |
| mergeAiTrack → `status=tagged`（非 filled）；prompt 含 rename / per-reason 约束 | 有（selfcheck） |
| upsert 兼容「版本身份\|发版日期\|…\|路径」表头 | 有（selfcheck） |
| `computeJobsConfigGaps` 主列表仅 draft.jobs；附录独立 | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.24 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（历史） |
| manifest / 文档钉头 **0.3.24**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.25） |
| `isMigrationSql` 认 `Vn__` / `Vn_0__` / `Vn_1__`；canonical `Vn__`≡`Vn_0__` | 有（selfcheck） |
| prior/baseline rename-alias 抑制（`suppressReason=rename-alias`） | 有（逻辑 + aliasSet 断言） |
| 增量配置仅 prod；非 prod → layerSuppressed；seal-check 非 prod exit 1 | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 0.3.23 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（PASS 171/171） | 烟测（历史） |
| manifest / 文档钉头 **0.3.23**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.24） |
| D3：`mergeSources=[]` 时 summary recentFirst（非最旧 Initial） | 有（selfcheck） |
| D4：GitHub/GitLab browse URL + 宿主文案 | 有（selfcheck） |
| D5：`upsertReleasesIndexRow` 写入进行中表并清占位 | 有（selfcheck） |
| note-merge 默认回写索引；`--no-update-index` 可关 | 有 |
| 仍标明非 harness land | 有 |

## 0.3.22-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（PASS 153/153） | 烟测（历史） |
| manifest / 文档钉头 **0.3.22-dev**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.23） |
| push-gate：仅本地支、无 `origin/<b>` → exit 2 / `pass=false` / `neverPushed` | 有（selfcheck 临时仓） |
| push-gate：origin 与本地同 tip → exit 0；本地超前 → exit 2 `unpushed>0` | 有（selfcheck） |
| git-gates：缺 origin = 未通过（废除 local fallback pass） | 有 |
| `enrichFirstReleaseLayerObservability`：空层 → `layerEmpty` + warnings | 有（selfcheck） |
| freeze inventory / questions：空层可观测字段与题面要求 | 有 |
| 仍标明非 harness land | 有 |

## 0.3.21-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（历史） |
| manifest / 文档钉头 **0.3.21-dev**；`sync-skill-version --check` | 有（历史钉；现行见 0.3.23） |
| SKILL：Red Flags + 借口表 + When NOT；description 为触发/症状（非流程摘要） | 有 |
| gates-common：口述回显首问；逾期无口头豁免 | 有 |
| git-gates：中止禁止评审落盘 | 有 |
| write-plan：非确认词黑名单 | 有 |
| RED→GREEN 记录 [`../_log/release-eng/RED-baseline-pressure.md`](../_log/release-eng/RED-baseline-pressure.md)：基线 4/4 B → VERIFY 4/4 A | 有 |
| 仍标明非 harness land；脚本契约未改 | 有 |

## 0.3.20-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.3.20-dev`（历史钉；现行见 0.3.23）；当时 SKILL / AGENT-INDEX / README / VERIFY + 仓根 README 钉头一致 | 有 |
| `node scripts/sync-skill-version.mjs --check` exit 0 | 有 |
| selfcheck `PIN` 读自 manifest | 有 |
| CHANGELOG 索引含 0.3.20-dev / 0.3.19-dev 且存在 `_log/release-eng/` 对应文件 | 有 |
| AGENT-INDEX 记载发版四步 | 有 |
| QUICKSTART 仍不钉号 | 有 |

## 0.3.19-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.3.19-dev** | 有（历史钉；现行见 0.3.23） |
| CHANGELOG 索引含 0.3.19-dev / 0.3.18-dev 且存在对应 `_log/release-eng/` 文件 | 有 |
| 模式 md 位于 `modes/`（prepare/resume/audit/seal/freeze/write-plan/gates-*/questions/ai-track/bootstrap/recommended/idempotency） | 有 |
| [modes/README.md](modes/README.md) 索引表存在 | 有 |
| SKILL / AGENT-INDEX / QUICKSTART 链接指向 `modes/` | 有 |
| `release.mjs` `modes` / 模式 `--help` 指向 `modes/*.md` | 有 |
| manifest `modes_dir: modes/` | 有 |
| 仍标明非 harness land | 有 |
| `scripts/release.mjs --help` / `modes` 列出 prepare/resume/audit/seal | 有 |
| `release.mjs` 可转发 seal-check / push-gate `--help` | 有 |


## 继承基线（0.3.18-dev）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| [AGENT-INDEX.md](AGENT-INDEX.md) 存在；含「必读」「按需」；标明非 harness land | 有 |
| [QUICKSTART.md](QUICKSTART.md) 一页纸；链 AGENT-INDEX；主循环 prepare→push-gate→freeze→WritePlan→seal | 有 |
| [SKILL.md](SKILL.md) 链到 AGENT-INDEX / VERIFY / QUICKSTART | 有 |
| [README.md](README.md) 含「如何烟测」；不再声称无 VERIFY/selfcheck | 有 |
| 关键脚本齐：release / format / push-gate / freeze / freeze-enrich / ai-track / note-merge / seal-check / selfcheck | 有 |
| fixtures 种子：`fixtures/docs/releases/`（releases.md · templates · `_example-artifacts.json` · archive） | 有 |
| selfcheck 行为断言：`identityFromBranch` · 截断5 常量 · `shortCommitHash` · artifacts.json 形 · seal-check `--help` | 有 |

## 继承基线（0.3.17）

| 检查 | 关键词 |
|---|---|
| 版本身份 = 发版分支归一化；发版日期解耦 | `identityFromBranch` · docs/releases/`<slug>`/`<slug>`.md |
| 截断5（前3后2、hash前8位） | `COMMIT_DISPLAY_*` · `shortCommitHash` |
| 合并来源 origin/ 归一 + 一句话 | `normalizeSourceBranch` · `branchOneLineSummary` |
| 目录包 artifacts.json SSOT；seal-check | note-merge · seal-check |
| jobs 汇总单文件；yml 注释键上一行 | jobs/README.md · `dumpYaml` |
| 双轨研判 / 逾期硬闸 / 首次发版基线=`无` | ai-track · gates-common · push-gate |

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
```
