# release-eng 验收记录（0.3.38）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。  
> 历史增量验收不在此堆积；见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/release-eng/`](../_log/release-eng/) 明细。

## 版本

当前 **0.3.38**（本版：jobs/附属摘要化；整理文件 `[库名]-V{yyMMdd}-*`；`sql/README` 总览写执行库与脱敏连接串）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.3.38 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| manifest / 文档钉头 **0.3.38**；`sync-skill-version --check` | 有 |
| `releaseSqlBundleName(..., "sms_db_prod")` → `[sms_db_prod]-V…-DDL.sql` | 有（selfcheck 038） |
| 无库名回落 `release-V*`；`sanitizeJdbcUrl` 去凭据 | 有（selfcheck 038） |
| jobs / bundle 章无明细表、有 README 链接或一行摘要 | 有（selfcheck 038） |
| `sql/README` 总览含执行库 / 连接串 | 有（selfcheck 038） |
| 仍标明非 harness land | 有 |

## 继承基线（摘要）

行为断言由 `scripts/selfcheck.mjs` 覆盖（不在此复述历史表）：`identityFromBranch` · `截断5` · `artifacts.json` 形 · `release.mjs` modes/转发 · push-gate · seal-check · note-merge / sql-bundle / sql-stats · 发版单精简与库名整理文件等。明细见 `_log` 各版与 CHANGELOG。

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help && node scripts/release.mjs modes
```
