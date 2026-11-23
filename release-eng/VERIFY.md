# release-eng 验收记录（0.3.36）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.36**（本版修复：`jobs/README.md` 引用链接多一层 `../`——改为按真实包目录 `path.relative` 计算，标准目录包 3 层、旧 notes 目录包 4 层）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.36 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（435/435 整仓） | 有 |
| manifest / 文档钉头 **0.3.36**；monorepo 下 `sync-skill-version --check` | 有 |
| `buildJobsSummaryMd` 标准目录包链接为 `../../../jobs/tasks/x.md`，不再出现四层 | 有（selfcheck 036） |
| 旧 `notes/` 目录包链接仍为 `../../../../jobs/tasks/x.md`（兼容） | 有（selfcheck 036） |
| 临时 git 仓端到端：`release-note-merge --freeze-json` 生成 `jobs/README.md`，链接可解析到真实真相文件 | 有（手工回归） |
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
