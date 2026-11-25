# release-eng 验收记录（0.4.2）

> 静态对照 + `scripts/selfcheck.mjs`。**非 harness land**。历史见 [CHANGELOG.md](CHANGELOG.md) / [`../_log/release-eng/`](../_log/release-eng/)。

## 版本

当前 **0.4.2**（enrich → lib/freeze 模块化）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.4.2 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| `--layer unit` / `--layer contract` exit 0 | 有 |
| `lib/freeze/{io,catalog,prior,change-objects,preview,paths}.mjs` 存在 | 有（selfcheck 042） |
| enrich 再导出 `enrichFreezePayload` / `buildArtifactsJson` / preview | 有 |
| 中文 migration freeze 不漏检（035） | 有 |
| `identityFromBranch` · `截断5` · `artifacts.json` 基线 | 有 |

## 烟测

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/selfcheck.mjs --layer unit
node scripts/selfcheck.mjs --layer contract
node scripts/release.mjs --help && node scripts/release.mjs modes
```
