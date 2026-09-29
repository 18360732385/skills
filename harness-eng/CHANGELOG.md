# harness-eng CHANGELOG

版本策略（自 **0.1.2** 起）：对外 `manifest.version` / `harness-meta.skill_version` 使用本组号。  
**列车**：当前 **0.7.32**。报告对照 **`skill_version` + `report_schema`**（**0.4.0**；**报告壳 ≠ skill**；`ui.version` 兼容别名）。  
版本明细见 [`../_log/harness-eng/`](../_log/harness-eng/)（一版本一文件）。非版本档案见 [`docs/`](../_log/harness-eng/docs/) · [`selfcheck-legacy/`](../_log/harness-eng/selfcheck-legacy/)。

| 版本 | 日期 | 说明 |
|---|---|---|
| [0.7.32](../_log/harness-eng/0.7.32.md) | 2026-09-28 | e2e P2：冷启动文案 · 空 inventory · Codex matcher · upgrade 备份 |
| [0.7.31](../_log/harness-eng/0.7.31.md) | 2026-09-28 | e2e P1：假 ready · --no-write · DDL · DTO 漂移 · resume · bareRe · update-index |
| [0.7.30](../_log/harness-eng/0.7.30.md) | 2026-09-28 | e2e P0 热修：meta 引号 · 假 gold · 预填跨节 · score root · Codex soft-gate |
| [0.7.29](../_log/harness-eng/0.7.29.md) | 2026-09-28 | e2e P2：填契约 / 幂等 / UX |
| [0.7.28](../_log/harness-eng/0.7.28.md) | 2026-09-28 | e2e P1：upgrade hooks · inventory meta · 评分假绿 |
| [0.7.27](../_log/harness-eng/0.7.27.md) | 2026-09-28 | e2e P0 热修：阻断崩溃 · 门禁真接线 · when_* 接通 |
| [0.7.26](../_log/harness-eng/0.7.26.md) | 2026-09-28 | e2e P2：幂等·路径 · fill-merge · L 级收口 |
| [0.7.25](../_log/harness-eng/0.7.25.md) | 2026-09-28 | e2e P1：漂移 / morph·gold / 分册·seed / 迁移 SSOT / 问答 |
| [0.7.24](../_log/harness-eng/0.7.24.md) | 2026-09-28 | e2e P0：refresh / L5 hooks / glob / calibrate |
| [0.7.23](../_log/harness-eng/0.7.23.md) | 2026-09-28 | P3/P4：soft-gate 去品牌 + eng_snapshot 单写 |
| [0.7.22](../_log/harness-eng/0.7.22.md) | 2026-09-28 | P0/P1/P2：协议解耦 + 中性 refresh |
| [0.7.21](../_log/harness-eng/0.7.21.md) | 2026-09-28 | docs-only：协议解耦文案 |
| [0.7.20](../_log/harness-eng/0.7.20.md) | 2026-09-27 | 批 E：monorepo detect · entry_ready · GLOB hooks · sp skip |
| [0.7.19](../_log/harness-eng/0.7.19.md) | 2026-09-27 | 批 D2–D4：收口清单 + refresh |
| [0.7.18](../_log/harness-eng/0.7.18.md) | 2026-09-27 | 批 B：分发安全 + 就绪可信；+ D1 soft-gate |
| [0.7.17](../_log/harness-eng/0.7.17.md) | 2026-09-27 | 批 A：L5/land 独立 P0 |
| [0.7.16](../_log/harness-eng/0.7.16.md) | 2026-09-27 | docs/runs 入图 + rule 18 中途 commit |
| [0.7.15](../_log/harness-eng/0.7.15.md) | 2026-09-27 | 与 feature-eng 消歧与接力 |
| [0.7.14](../_log/harness-eng/0.7.14.md) | 2026-09-26 | 报告壳 0.4.0 · 五台 + 宿主面 |
| [0.7.13](../_log/harness-eng/0.7.13.md) | 2026-09-26 | 使用手册大段改写 |
| [0.7.12](../_log/harness-eng/0.7.12.md) | 2026-09-26 | guide/ 手册搬家 |
| [0.7.11](../_log/harness-eng/0.7.11.md) | 2026-09-26 | 入口双写去重 |
| [0.7.10](../_log/harness-eng/0.7.10.md) | 2026-09-26 | 热路径编排压缩 |
| [0.7.9](../_log/harness-eng/0.7.9.md) | 2026-09-24 | 可选 L4 rulehook 适配器 |
| [0.7.8](../_log/harness-eng/0.7.8.md) | 2026-09-24 | calibrate 读 Codex TOML |
| [0.7.7](../_log/harness-eng/0.7.7.md) | 2026-09-24 | Codex MCP policy 精细开关 |
| [0.7.6](../_log/harness-eng/0.7.6.md) | 2026-09-24 | Codex 域 skills：redis / jobs / frontend |
| [0.7.5](../_log/harness-eng/0.7.5.md) | 2026-09-24 | Codex Skills 种子 · 行为承接 |
| [0.7.4](../_log/harness-eng/0.7.4.md) | 2026-09-24 | Codex hooks 家族 / Windows cmd / MCP 路径 |
| [0.7.3](../_log/harness-eng/0.7.3.md) | 2026-09-24 | Codex hooks 生效链 PR1 |
| [0.7.2](../_log/harness-eng/0.7.2.md) | 2026-09-24 | 日落 CLI shim |
| [0.7.1](../_log/harness-eng/0.7.1.md) | 2026-09-23 | 热路径瘦身 |
| [0.7.0](../_log/harness-eng/0.7.0.md) | 2026-09-23 | 形态重标定 · gold 可达 · ready 废弃 |
| [0.6.9](../_log/harness-eng/0.6.9.md) | 2026-09-22 | Codex → 高：分轨 SSOT · 纪律 B |
| [0.6.8-dev](../_log/harness-eng/0.6.8-dev.md) | 2026-09-19 | Codex P0 增量解冻：PARITY + config.toml + hooks |
| [0.6.7](../_log/harness-eng/0.6.7.md) | 2026-09-18 | 正式钉号：Pn 回流运营 + 前后端契约门禁剖面 |
| [0.6.6](../_log/harness-eng/0.6.6.md) | 2026-09-18 | 正式钉号：OpenAPI 闭环 + 分册厚 SSOT |
| [0.6.5](../_log/harness-eng/0.6.5.md) | 2026-09-17 | 正式钉号：API 字段表金标 + sync EOL |
| [0.6.4](../_log/harness-eng/0.6.4.md) | 2026-09-16 | 正式钉号：CodeBuddy/WorkBuddy 官方对齐 |
| [0.6.3](../_log/harness-eng/0.6.3.md) | 2026-09-14 | 正式钉号：freshness · 热路径 · Trae P2 · 报告壳叙事 |
| [0.6.2](../_log/harness-eng/0.6.2.md) | 2026-09-14 | 会话仪表盘去掉 mermaid |
| [0.6.1](../_log/harness-eng/0.6.1.md) | 2026-09-14 | Trae 高：P0/P1 收口 · 正式钉号 |
| [0.6.0](../_log/harness-eng/0.6.0.md) | 2026-09-12 | M1–M4：统一入口 · 文档拓扑 · fill 内聚 · 发包减脂 · 正式钉号 |
| [0.5.10](../_log/harness-eng/0.5.10.md) | 2026-09-12 | audit P2：Codex 不默认 · 报告壳叙事 · 皆无探测 ≠ Cursor · 归档 |
| [0.5.9](../_log/harness-eng/0.5.9.md) | 2026-09-12 | audit P1：热路径索引 · land 入口 · fill CLI · fixture |
| [0.5.8](../_log/harness-eng/0.5.8.md) | 2026-09-12 | detect 多宿主诚实 + selfcheck 稳定名 + Codex P2 期望 |
| [0.5.7](../_log/harness-eng/0.5.7.md) | 2026-09-12 | 契约 sync 指针去 Cursor 唯权威 + 减少冗余 1x |
| [0.5.6](../_log/harness-eng/0.5.6.md) | 2026-09-12 | 施工 meta 迁入 docs/harness-eng |
| [0.5.5](../_log/harness-eng/0.5.5.md) | 2026-09-12 | 安装说明 · 宿主无关 |
| [0.5.4](../_log/harness-eng/0.5.4.md) | 2026-09-12 | 会话仪表盘 · 仅工程轮 SHOW |
| [0.5.3](../_log/harness-eng/0.5.3.md) | 2026-09-11 | 会话仪表盘 · 每轮回复末尾 |
| [0.5.2](../_log/harness-eng/0.5.2.md) | 2026-09-11 | 多宿主对等 P0 + sync-hosts 规格 |
| [0.5.1](../_log/harness-eng/0.5.1.md) | 2026-09-11 | 多宿主对齐：Qoder/Trae hooks·MCP·rules |
| [0.5.0](../_log/harness-eng/0.5.0.md) | 2026-08-31 | 配置 SSOT 管线 L5 / hooks 家族 / pitfalls 工程化 |
| [0.4.0](../_log/harness-eng/0.4.0.md) | 2026-08-24 | 包模型：前端协作包 / 分册变体 / merge 预览 / 迁移模式 |
| [0.3.10](../_log/harness-eng/0.3.10.md) | 2026-08-24 | 行为包：rule 21 |
| [0.3.9](../_log/harness-eng/0.3.9.md) | 2026-08-24 | 源仓纪律回灌 |
| [0.3.8](../_log/harness-eng/0.3.8.md) | 2026-08-14 | writing-for-agents P0–P3 |
| [0.3.7](../_log/harness-eng/0.3.7.md) | 2026-08-14 | 域名单去硬编码 |
| [0.3.6](../_log/harness-eng/0.3.6.md) | 2026-08-14 | 指针 / scheduler_link / 加域 recipe |
| [0.3.5](../_log/harness-eng/0.3.5.md) | 2026-08-14 | 域包 packs + jobs inventory |
| [0.3.4](../_log/harness-eng/0.3.4.md) | 2026-08-14 | jobs 域 + 域注册表 |
| [0.3.3](../_log/harness-eng/0.3.3.md) | 2026-08-13 | gold 开干档 |
| [0.3.2](../_log/harness-eng/0.3.2.md) | 2026-08-13 | writing-for-agents 收口 |
| [0.3.1](../_log/harness-eng/0.3.1.md) | 2026-08-13 | Phase C · 同构 / 仪表降权 / morph·gate |
| [0.3.0](../_log/harness-eng/0.3.0.md) | 2026-08-13 | Phase B · 严格开干 |
| [0.2.29](../_log/harness-eng/0.2.29.md) | 2026-08-13 | Phase A · 开干闸/报告接线 |
| [0.2.28](../_log/harness-eng/0.2.28.md) | 2026-08-12 | writing-for-agents W5 · 剪枝闭环 |
| [0.2.27](../_log/harness-eng/0.2.27.md) | 2026-08-12 | score-policy · 列密度 · 四域对称闸 |
| [0.2.26](../_log/harness-eng/0.2.26.md) | 2026-08-12 | 开干阈值 · 示例闸 · MCP 主环境 |
| [0.2.25](../_log/harness-eng/0.2.25.md) | 2026-08-11 | writing-for-agents · 顶层剪枝 |
| [0.2.24](../_log/harness-eng/0.2.24.md) | 2026-08-10 | 报告 UX · 指挥台升级 |
| [0.2.23](../_log/harness-eng/0.2.23.md) | 2026-08-10 | 报告 UX · ui 投影 |
| [0.2.22](../_log/harness-eng/0.2.22.md) | 2026-08-10 | 不把 L4 并入 L0；阶梯语义不变 |
| [0.2.21](../_log/harness-eng/0.2.21.md) | 2026-08-10 | 新增 [upgrade.md](upgrade.md)（Done + 与 land/resume 边界） |
| [0.2.20](../_log/harness-eng/0.2.20.md) | 2026-08-10 | W0：SKILL frontmatter；瘦身脚本墙；确认闸门 / 预授权词表 SSOT → [write-plan.md](write-plan.md) |
| [0.2.19](../_log/harness-eng/0.2.19.md) | 2026-08-07 | P0 修复 fill-merge-api 多模块合并阻断：新增 --module 参数；自动按 inventory 证据集过滤 work-dir fragmen |
| [0.2.18](../_log/harness-eng/0.2.18.md) | 2026-08-07 | 新增 [truth-quality.md](truth-quality.md)：深/真/全操作定义、反例表、.fill-work draft vs docs/  |
| [0.2.17](../_log/harness-eng/0.2.17.md) | 2026-08-07 | 大仓 / pipeline 默认目标阶 = L4；推荐包不再默认停 L2（L2 仅「只要协作+索引、明确不深填」子集） |
| [0.2.16](../_log/harness-eng/0.2.16.md) | 2026-08-07 | 默认填充引擎 hybrid：inventory / calibrate / dto 仍用脚本；真相完整档走 fill-truths-agents（多会话按模板精 |
| [0.2.15](../_log/harness-eng/0.2.15.md) | 2026-08-06 | QUICKSTART.md：一页纸入口（场景表 + 写盘闸门 + 最短路径） |
| [0.2.14](../_log/harness-eng/0.2.14.md) | 2026-08-06 | score-history.jsonl：fill-report-html 默认追加 docs/harness-eng/score-history.jsonl（- |
| [0.2.13](../_log/harness-eng/0.2.13.md) | 2026-08-06 | HTML 报告分区升级：决策台 / 诊断台 / 任务台 / 技术细节（默认折叠） |
| [0.2.12](../_log/harness-eng/0.2.12.md) | 2026-08-06 | 默认落点改为 docs/harness-eng/（与 docs/agent-kb 知识回流分离） |
| [0.2.11](../_log/harness-eng/0.2.11.md) | 2026-08-06 | 新增 templates/report/harness-report.html.tmpl：自包含仪表盘（overall / ready / formula_ce |
| [0.2.10](../_log/harness-eng/0.2.10.md) | 2026-08-06 | P0 fill-inventory-redis：默认扫描全部 */src/main/java；REDIS_* / SMS: / dict/captcha 可 p |
| [0.2.9](../_log/harness-eng/0.2.9.md) | 2026-08-06 | P1 fill-truths-auto --merge：增量合并真相；输出 stats.written/merged/unchanged；pipeline 第二 |
| [0.2.8](../_log/harness-eng/0.2.8.md) | 2026-08-05 | P0 fill-inventory-func.mjs：Service/Component inventory → func 真相可系统化填充 |
| [0.2.7](../_log/harness-eng/0.2.7.md) | 2026-08-05 | P0 fill-truths-auto.mjs + [fill-truths-auto.md](fill-truths-auto.md)：四域从 invento |
| [0.2.6](../_log/harness-eng/0.2.6.md) | 2026-08-05 | 新增 scripts/lib/yaml.mjs（vendored，无 npm）；render.mjs / questions-next.mjs 改用标准解析（报 |
| [0.2.5](../_log/harness-eng/0.2.5.md) | 2026-08-05 | fill-score.mjs：db/redis 不按模块名过滤；有索引时域分 Math.max(15, avg) 保底（避免 seed 空壳后分数反降） |
| [0.2.4](../_log/harness-eng/0.2.4.md) | 2026-08-05 | 重写 [fill-workers.md](fill-workers.md)：默认串行；并行仅为可选适配表（Cursor / Claude / Codex / Q |
| [0.2.3](../_log/harness-eng/0.2.3.md) | 2026-08-05 | 新增 scripts/fill-merge-api.mjs（--check / --write；missing/dup 门禁）+ merge fixture |
| [0.2.2](../_log/harness-eng/0.2.2.md) | 2026-08-05 | 推荐序：fill-score → fill-mcp（mysql/redis） → fill-truths → 再 score；跳过 MCP 不硬拦但须声明 |
| [0.2.1](../_log/harness-eng/0.2.1.md) | 2026-08-05 | 版本递进约定：自 0.2.1 起按 0.2.1 → 0.2.2 → … → 0.3.0 补丁推进（本版为 fill 首发） |
| [0.2.0](../_log/harness-eng/0.2.0.md) | 2026-08-05 | 新增 [ai-tools.md](ai-tools.md)：Cursor / Claude / Codex / Qoder / Trae / WorkBuddy |
| [0.1.2](../_log/harness-eng/0.1.2.md) | 2026-08-05 | 新增 [glossary.md](glossary.md)：阶梯 L0–L4、模式、常用词中文说明 |
