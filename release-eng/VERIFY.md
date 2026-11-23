# release-eng 验收记录（0.3.34）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.34**（本版新增：SQL 统计文档 `sql/README.md`——DDL/DML 文件数与语句数、按提交人分组、文件名链接到整理文件对应行）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.34 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（423/423 整仓） | 有 |
| manifest / 文档钉头 **0.3.34**；monorepo 下 `sync-skill-version --check` | 有 |
| `countSqlStatements`：多语句计数、纯注释 0 条、字符串内分号不切断 | 有（selfcheck 034 A） |
| `buildSqlStatsMarkdown`：总览文件/语句数、按提交人分组、`#L` 锚点与行号文字兜底 | 有（selfcheck 034 B） |
| `runSqlBundle` 落地 `sql/README.md`；锚点行号与整理文件 `-- >>> begin:` 一致；无 git 记「未识别」 | 有（selfcheck 034 C） |
| note-merge 将 `sql/README.md` 登记进「包内附属文件」并输出 `sqlStats` | 有 |
| 仍标明非 harness land | 有 |

## 继承基线（摘要）

行为断言由 `scripts/selfcheck.mjs` 覆盖（不在此复述历史表）：`identityFromBranch` · `截断5` · `artifacts.json` 形 · `release.mjs` modes/转发 · push-gate 临时仓 · seal-check · note-merge / sql-bundle / sql-stats · 0.3.33 A–H 等。明细见 `_log` 各版与 CHANGELOG。

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
# 逐条断言：node scripts/selfcheck.mjs --verbose
# 孤立安装：仅拷贝 release-eng/ 后同命令；仓外 _log/仓根 README 断言 skip
```
