# release-eng CHANGELOG

版本策略：对外权威号**只认** [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`。自 `0.3.x` 起补丁序递增（勿跳升次版本号 unless 明确要求）。  
版本明细见 [`../_log/release-eng/`](../_log/release-eng/)（按 `major.minor` 分目录；`-dev` / RED 压测在 [`archive/`](../_log/release-eng/archive/)）。本表为索引。

## 现行（0.3.23+）

| 版本 | 日期 | 说明 |
|---|---|---|
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
