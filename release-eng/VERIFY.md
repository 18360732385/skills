# release-eng 验收记录（0.3.35）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.35**（本版修复：`db/migration` 中文名 SQL 漏检——git 路径列举改 `-z`，绕开 `core.quotepath` 转义；发版单抽取统一支持新轨 `_0/_1` + 中文描述）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.35 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（432/432 整仓） | 有 |
| manifest / 文档钉头 **0.3.35**；monorepo 下 `sync-skill-version --check` | 有 |
| `isMigrationSql` / `classifyMigrationKindByFilename` 识别中文新轨名 `V{ts}_{0|1}__{作者}__{中文}.sql` | 有（selfcheck 035） |
| `extractMigrationNames` 从发版单表格抽取中文新轨名；prior md 启发式命中 | 有（selfcheck 035） |
| 临时 git 仓：首次发版（`ls-tree`）与增量（`diff --name-only`）均发现中文名 migration 并进 `draft.sql` | 有（selfcheck 035） |
| 实仓 `c-be-sms-ai`：`8bc7bde0~1..8bc7bde0` 收录 `V261106100154556_1__chenpeng5__危险源填写模型订正.sql` | 有（手工回归） |
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
