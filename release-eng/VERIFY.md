# release-eng 验收记录（0.4.5）

> 静态对照 + `scripts/selfcheck.mjs`。**非 harness land**。历史见 [CHANGELOG.md](CHANGELOG.md) / [`../_log/release-eng/`](../_log/release-eng/)。

## 版本

当前 **0.4.5**（合并来源按对比版本之后新增；SQL/定时任务章前 5 条；包内附属逐项清单；HTML 视觉与附件链接）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。

## 0.4.5 增量验收

| 检查 | 结果 |
|---|---|
| `parseNoteHeadRef` 解析 `a..b` / `首次发版:b` / 表格行 | 有（selfcheck） |
| freeze 合并来源取 archive 最新发版单 head；不可解析时回落并 warning | 有（`mergeScope`） |
| SQL 章 >5 条只展示 5 行，其余注明详见 `sql/README.md` | 有（selfcheck 045） |
| 定时任务章 >5 条只展示 5 行，其余注明详见 `jobs/README.md` | 有（selfcheck 045） |
| 「七、包内附属文件」逐项清单（SQL 原件 / 整理 / 配置 / 任务） | 有（`buildBundleSection`） |
| 方括号文件名链接可渲染、新窗口打开 | 有（selfcheck 045 + 样张 HTML） |
| 发版单 HTML 视觉更新（抬头 / 章节 / 表格 / 清单 / 响应式 / 打印） | 有（`release-note-sample.html` 重渲） |
| `--layer unit` / `--layer contract` | unit 56/56；contract 除受限沙箱本地 CLI 6 项外全过 |
| `note-merge` 索引已存在时默认回写（`up` 回归） | 有（selfcheck 043b） |
| `freeze --first-release` 合并来源 `git log --merges` 取 `args.root` | 有（selfcheck 035） |
| guide md/html：版本、`release-V{yyMMdd}`、无 resume / 旧 notes 口径 | 有（contract 守卫） |
| 无系统 temp 时 selfcheck 回退仓内临时目录或 SKIP，不抛栈 | 有（`RELEASE_ENG_TMP` 可覆盖） |

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
