# release-eng 验收记录（0.3.33）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.33**（EVAL 实战缺口：`ON UPDATE`/`ON DELETE` 误杀、note-merge 失败回滚、freeze 排除 `docs/releases/`、prod `__hash` 放行、增量父键 isLeaf、docs/jobs seed、孤立安装 selfcheck 双态）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.33 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（393/393 整仓；孤立安装仓外钉 skip 仍 exit 0） | 有 |
| manifest / 文档钉头 **0.3.33**；monorepo 下 `sync-skill-version --check` | 有 |
| `detectMixedDdlDml`：`ON UPDATE`/`ON DELETE` 非 mixed；真 CREATE+INSERT 仍 mixed | 有（selfcheck A） |
| note-merge sql-bundle 失败 → `resetBundleKindDirs` 回滚附属 | 有（selfcheck F） |
| freeze `excludeReleasePackageFiles` 跳过 `docs/releases/**` | 有（selfcheck C） |
| `isProdConfigPath` 放行 `application-prod__<hex>.yml`；seal-check 不误报 | 有（selfcheck B/H） |
| 增量父键 `isLeaf:false` 不进 draft.config；docs/jobs 无 SyncTaskCode 可进 draft.jobs | 有（selfcheck D/E） |
| fixtures 无 `.cursor/skills` 断链；QUICKSTART bare/无 web URL 预期 | 有（selfcheck G） |
| 仍标明非 harness land | 有 |

## 继承基线（摘要）

行为断言由 `scripts/selfcheck.mjs` 覆盖（不在此复述历史表）：`identityFromBranch` · `截断5` · `artifacts.json` 形 · `release.mjs` modes/转发 · push-gate 临时仓 · seal-check · note-merge / sql-bundle · 0.3.32 ①–⑪ 等。明细见 `_log` 各版与 CHANGELOG。

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
# 逐条断言：node scripts/selfcheck.mjs --verbose
# 孤立安装：仅拷贝 release-eng/ 后同命令；仓外 _log/仓根 README 断言 skip
```
