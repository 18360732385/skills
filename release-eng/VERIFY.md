# release-eng 验收记录（0.3.32）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.32**（修复轮：`_change.sql` 剔除/nacos prod 判定、prior-since 新式身份、状态精确匹配、seal 事务性与尾注、BOM 统一、`--overdue-waived` 落点、repo-profile 外置、conventions SSOT）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.32 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（369/369） | 有 |
| manifest / 文档钉头 **0.3.32**；`sync-skill-version --check` | 有 |
| 新增 selfcheck 断言组 ①–⑪（sql-bundle `_change.sql`+D7 保旧 · nacos prod 判定 · enrich prodPath · prior-since 新式身份 · seal `--apply` 事务性 · 状态精确匹配 · BOM · `--overdue-waived` · repo-profile · prodConfigKeyCount · conventions SSOT） | 有（selfcheck） |
| conventions.md 约定 SSOT + 入口索引去重（SKILL/AGENT-INDEX/QUICKSTART/README 引用不复述） | 有 |
| repo-profile 外置（`scripts/lib/repo-profile.mjs`：深合并覆盖 + 纯函数可选参注入；坏 JSON 回退 DEFAULT） | 有（selfcheck） |
| seal `--apply` 事务顺序（先 gitMv 后写 patched；sql-bundle 失败路径保留旧整理文件） | 有（selfcheck） |
| note-merge `--overdue-waived`（硬闸未 waived 拒绝写盘；waived 落 `artifacts.json.overdueWaived{reason,date}`） | 有（selfcheck） |
| 仍标明非 harness land | 有 |

## 继承基线（摘要）

行为断言由 `scripts/selfcheck.mjs` 覆盖（不在此复述历史表）：`identityFromBranch` · `截断5` · `artifacts.json` 形 · `release.mjs` modes/转发 · push-gate 临时仓 · seal-check · note-merge / sql-bundle 等。明细见 `_log` 各版与 CHANGELOG。

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
# 逐条断言：node scripts/selfcheck.mjs --verbose
```
