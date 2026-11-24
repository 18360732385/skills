# release-eng 验收记录（0.3.37）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.37**（本版：发版单 SQL 章精简为链到 `sql/README.md`；取消「十一、附录」→ 10 章）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.37 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| manifest / 文档钉头 **0.3.37**；monorepo 下 `sync-skill-version --check` | 有 |
| `buildSqlSection` 无执行序表；有 SQL 时写条数 + `sql/README.md` 链接 | 有（selfcheck 037） |
| 模板 / 新骨架无「十一、附录」；标明 10 章 | 有（selfcheck 037） |
| seal-check 优先对照 `sql/README.md` 校验脚本名 | 有 |
| WritePlan / `draft-md` 仍可展示完整 SQL 候选表 | 有（未改 freeze draft-md） |
| 仍标明非 harness land | 有 |

## 继承基线（摘要）

行为断言由 `scripts/selfcheck.mjs` 覆盖（不在此复述历史表）：`identityFromBranch` · `截断5` · `artifacts.json` 形 · `release.mjs` modes/转发 · push-gate 临时仓 · seal-check · note-merge / sql-bundle / sql-stats · jobs 链接相对路径 · 0.3.33 A–H 等。明细见 `_log` 各版与 CHANGELOG。

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
# 逐条断言：node scripts/selfcheck.mjs --verbose
# 孤立安装：仅拷贝 release-eng/ 后同命令；仓外 _log/仓根 README 断言 skip
```
