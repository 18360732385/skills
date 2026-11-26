# release-eng 验收记录（0.4.4）

> 静态对照 + `scripts/selfcheck.mjs`。**非 harness land**。历史见 [CHANGELOG.md](CHANGELOG.md) / [`../_log/release-eng/`](../_log/release-eng/)。

## 版本

当前 **0.4.4**（首次使用记录 SQL 目录与格式，之后按记录扫描）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.4.4 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| `--layer unit` / `--layer contract` exit 0 | 有 |
| `releases.md`「SQL 扫描」记目录 + 格式；缺一即首次使用 | 有 |
| 首次使用首问必答；`sql-profile --apply` 才写入索引 | 有 |
| 已记录后 `isMigrationSql` 按目录 + `flyway`/glob 扫描；不传则仍是 `db/migration` + Flyway | 有 |
| 无完整记录时 prepare exit 1（`sql_profile_unrecorded`） | 有 |

## 0.4.3 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 有 |
| `--layer unit` / `--layer contract` exit 0 | 有 |
| `scripts/release-note-html.mjs` 存在且可 CLI 渲染样张 | 有（selfcheck 043） |
| note-merge 定版自动生成 `<identity>.html`；`--no-html` 关闭 | 有 |
| seal `--apply` 归档侧按「已上线」重渲 html | 有（source 断言 + 结果 `html` 字段） |
| `release.mjs note-html` 别名转发 | 有 |
| fixtures 样张 `templates/release-note-sample.{md,html}` | 有 |
| md 为 SSOT：colophon 声明 / 勾选不入档 | 有（渲染落款） |

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
