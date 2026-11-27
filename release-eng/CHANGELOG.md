# release-eng CHANGELOG

版本策略：对外权威号**只认** [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`。  
版本明细见 [`../_log/release-eng/`](../_log/release-eng/)（按 `major.minor` 分目录；`-dev` / RED 压测在 [`archive/`](../_log/release-eng/archive/)）。本表为索引。

## 现行（0.4+）

| 版本 | 日期 | 说明 |
|---|---|---|
| [0.4.7](../_log/release-eng/0.4/0.4.7.md) | 2026-11-27 | 定版缺口：Spring JDBC 占位、任务候选、已归档身份、经典 Flyway 启发式、样表类型与说明口径 |
| [0.4.6](../_log/release-eng/0.4/0.4.6.md) | 2026-11-27 | 读取发版单、索引、freeze JSON、SQL 与配置时接受 UTF-8 与 UTF-16（PowerShell `>` 的 BOM）。写出仍是 UTF-8 |
| [0.4.5](../_log/release-eng/0.4/0.4.5.md) | 2026-11-26 | 合并来源只算对比版本之后新增；SQL/定时任务章前 5 条；包内附属逐项清单；HTML 视觉与附件链接；修 note-merge 索引回写与 freeze 合并来源的未定义变量 |
| [0.4.4](../_log/release-eng/0.4/0.4.4.md) | 2026-11-26 | 首次使用把 SQL 目录与格式写入 `releases.md`；之后 freeze 只按这两条扫描 |
| [0.4.3](../_log/release-eng/0.4/0.4.3.md) | 2026-11-25 | 发版单同名 `.html` 只读渲染：`release-note-html.mjs` · note-merge/seal 自动重建 · `note-html` 别名 · fixtures 样张 |
| [0.4.2](../_log/release-eng/0.4/0.4.2.md) | 2026-11-25 | enrich 外提 catalog/prior/change-objects；编排层 ~718 行 |
| [0.4.1](../_log/release-eng/0.4/0.4.1.md) | 2026-11-25 | P3：lib/freeze 拆分 · Win32 safe-out · selfcheck `--layer unit|contract|e2e` |
| [0.4.0](../_log/release-eng/0.4/0.4.0.md) | 2026-11-25 | 半自动 prepare；身份 `release-V{yyMMdd}`；resume→prepare；cancel；快照对账；删 notes/ 兼容；ai-track 默认跳过 |

## 0.3.x（归档索引）

| 版本 | 日期 | 说明 |
|---|---|---|
| [0.3.38](../_log/release-eng/0.3/0.3.38.md) | 2026-11-24 | 发版单续简：jobs/附属摘要化；整理文件 `[库名]-V*`；sql/README 写执行库 |
| [0.3.37](../_log/release-eng/0.3/0.3.37.md) | 2026-11-23 | 发版单精简：SQL 章改为链到 `sql/README.md`；取消「十一、附录」→ 10 章 |
| [0.3.36](../_log/release-eng/0.3/0.3.36.md) | 2026-11-23 | 修复 `jobs/README.md` 引用链接多一层 `../`：按真实包目录 `path.relative` 计算（标准 3 层 / 旧 notes 4 层） |
| [0.3.35](../_log/release-eng/0.3/0.3.35.md) | 2026-11-23 | 修复 `db/migration` 中文名 SQL 漏检：git 路径列举改 `-z`（core.quotepath 转义回归）；发版单抽取统一支持新轨 `_0/_1` + 中文 |
| [0.3.34](../_log/release-eng/0.3/0.3.34.md) | 2026-11-23 | SQL 统计文档 `sql/README.md`：DDL/DML 文件数与语句数、按提交人分组展示执行序、文件名链接到整理文件对应行 |
| [0.3.33](../_log/release-eng/0.3/0.3.33.md) | 2026-10-29 | EVAL：ON UPDATE/DELETE 误杀、note-merge 失败回滚、freeze 排除 releases、prod__hash、isLeaf、docs/jobs seed、孤立 selfcheck 双态 |
| [0.3.32](../_log/release-eng/0.3/0.3.32.md) | 2026-10-29 | 修复轮：_change.sql/nacos prod 判定、prior-since、状态精确匹配、seal 事务性、BOM、--overdue-waived、repo-profile 外置、conventions SSOT |
| [0.3.31](../_log/release-eng/0.3/0.3.31.md) | 2026-10-28 | N14 收口：docs-hit fixedDelay/非 cron 不误报 cronExpressionMissing |
| [0.3.30](../_log/release-eng/0.3/0.3.30.md) | 2026-10-28 | N11 值变更不 suppress；N12 完整记录入 auto:git；N7 top-level 桶；N13/N14/N1 父级注释 |
| [0.3.29](../_log/release-eng/0.3/0.3.29.md) | 2026-10-28 | N1–N4/N7–N10：注释采集、SyncTaskCode 可发现、draft 剔父级、seal 一键、BOM、首次问卷 |
| [0.3.28](../_log/release-eng/0.3/0.3.28.md) | 2026-10-28 | sql/refs + release-V*-DDL\|DML 整理与静态校验（sql-classify/sql-bundle） |
| [0.3.27](../_log/release-eng/0.3/0.3.27.md) | 2026-10-28 | 去掉 notes/；进行中目录包直接挂在 docs/releases/<slug>/ |
| [0.3.26](../_log/release-eng/0.3/0.3.26.md) | 2026-10-26 | P2：mergeSources noise 折叠；摘要跳过环境支；SQL 包体 40/100 warning |
| [0.3.25](../_log/release-eng/0.3/0.3.25.md) | 2026-10-26 | P1：ai-track tagged；索引表头自适应；jobsConfigGaps 收窄本版 draft |
| [0.3.24](../_log/release-eng/0.3/0.3.24.md) | 2026-10-26 | P0：Flyway `Vdddd_d__` + rename-alias；增量配置仅 prod；seal-check 非 prod fail |
| [0.3.23](../_log/release-eng/0.3/0.3.23.md) | 2026-10-15 | P3：D3 recentFirst；D4 远端宿主；D5 索引回写（起本版无 -dev） |

## 归档索引

| 范围 | 说明 |
|---|---|
| [0.3.18-dev … 0.3.22-dev](../_log/release-eng/archive/0.3/) | 门禁包 / 薄入口 / 版本 SSOT / 纪律 Red Flags / never-pushed（含 `0.3.18-dev.md` · `0.3.19-dev.md` 等） |
| [RED 压测](../_log/release-eng/archive/RED-baseline-pressure.md) | RED→GREEN 硬闸 4/4 |
| [0.3.0 … 0.3.17](../_log/release-eng/0.3/) | 首次发版·键级diff·截断5·双轨·目录包等稳定演进明细 |
| [0.2.x](../_log/release-eng/0.2/) · [0.1.0](../_log/release-eng/0.1/0.1.0.md) | 早期 writing-for-agents / 首发 |
