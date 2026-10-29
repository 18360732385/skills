# release-eng CHANGELOG

版本策略：对外权威号**只认** [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`。自 `0.3.x` 起补丁序递增（勿跳升次版本号 unless 明确要求）。  
版本明细见 [`../_log/release-eng/`](../_log/release-eng/)（按 `major.minor` 分目录，一版本一文件，如 `0.3/0.3.23.md`）。本表为索引。

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
| [0.3.22-dev](../_log/release-eng/0.3/0.3.22-dev.md) | 2026-10-15 | D1 never-pushed fail；D2 首次 inventory 空层可观测 |
| [0.3.21-dev](../_log/release-eng/0.3/0.3.21-dev.md) | 2026-09-29 | 纪律 bulletproof（Red Flags / 借口表；RED→GREEN 4/4） |
| [0.3.20-dev](../_log/release-eng/0.3/0.3.20-dev.md) | 2026-09-28 | 版本单点维护：manifest SSOT + sync-skill-version |
| [0.3.19-dev](../_log/release-eng/0.3/0.3.19-dev.md) | 2026-09-19 | 统一薄入口 release.mjs + 模式 md 迁入 modes/ |
| [0.3.18-dev](../_log/release-eng/0.3/0.3.18-dev.md) | 2026-09-19 | P0 门禁包 / selfcheck |
| [0.3.17](../_log/release-eng/0.3/0.3.17.md) | 2026-08-25 | 摘要分支聚合 / 身份分支化 / jobs 汇总单文件 / 渲染细节 |
| [0.3.16](../_log/release-eng/0.3/0.3.16.md) | 2026-08-24 | 双轨研判加固 / 预填来源透明化 / 问卷形态 |
| [0.3.15](../_log/release-eng/0.3/0.3.15.md) | 2026-08-24 | 防自误伤 / 摘要可用性 / 跨平台落盘 |
| [0.3.14](../_log/release-eng/0.3/0.3.14.md) | 2026-08-24 | 配置采集真实性 / 校验补强 |
| [0.3.13](../_log/release-eng/0.3/0.3.13.md) | 2026-08-21 | 目录包仅本版新增制品 |
| [0.3.12](../_log/release-eng/0.3/0.3.12.md) | 2026-08-21 | 发版单可读性二轮 |
| [0.3.11](../_log/release-eng/0.3/0.3.11.md) | 2026-08-21 | 双轨研判仪式 / ai-track 脚本 |
| [0.3.10](../_log/release-eng/0.3/0.3.10.md) | 2026-08-21 | 变更对象 / 双源 / artifacts / 双轨 stub |
| [0.3.9](../_log/release-eng/0.3/0.3.9.md) | 2026-08-21 | 发版单可读性 / 中国时区 / YAML / 链接 |
| [0.3.8](../_log/release-eng/0.3/0.3.8.md) | 2026-08-20 | 发版日期算法 / 截断5 / mergeSources / 目录包 |
| [0.3.7](../_log/release-eng/0.3/0.3.7.md) | 2026-08-14 | note-merge / seal-check |
| [0.3.6](../_log/release-eng/0.3/0.3.6.md) | 2026-08-14 | draft-md 预览 / audit prior·freeze |
| [0.3.5](../_log/release-eng/0.3/0.3.5.md) | 2026-08-14 | prior去重 / confidence |
| [0.3.4](../_log/release-eng/0.3/0.3.4.md) | 2026-08-14 | jobs交叉 / 配置说明 / draft |
| [0.3.3](../_log/release-eng/0.3/0.3.3.md) | 2026-08-14 | 键级diff / 首次发版-manual / SQL 收紧 |
| [0.3.2](../_log/release-eng/0.3/0.3.2.md) | 2026-08-14 | 发版日期 / 截断10 / prod / SQL序 |
| [0.3.0](../_log/release-eng/0.3/0.3.0.md) | 2026-08-14 | 首次发版 / 基线=无 |
| [0.2.1](../_log/release-eng/0.2/0.2.1.md) | 2026-08-14 | P2.7 / 8 / 10 |
| [0.2.0](../_log/release-eng/0.2/0.2.0.md) | 2026-08-14 | P0+P1 writing-for-agents |
| [0.1.0](../_log/release-eng/0.1/0.1.0.md) | 2026-08-14 | 首发 |
