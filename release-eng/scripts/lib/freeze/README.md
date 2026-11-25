# lib/freeze — 定版采集模块边界（0.4.2+）

| 模块 | 职责 |
|---|---|
| [io.mjs](io.mjs) | `readText` · `normPath` · `baseName` |
| [paths.mjs](paths.mjs) | `pathBucket` · `excludeReleasePackageFiles` |
| [catalog.mjs](catalog.mjs) | confidence · 配置/jobs catalog · SyncTaskCode · `extractTaskCodesFromJavaDiff` |
| [prior.mjs](prior.mjs) | artifacts prior · 逾期扫描 · 索引漂移 |
| [change-objects.mjs](change-objects.mjs) | `buildChangeObjects` · `buildArtifactsJson` · `computeJobsConfigGaps` |
| [preview.mjs](preview.mjs) | `toDraftPreviewMd` · `toFreezeSummary` · `toAuditFreezeSummary` |
| [../safe-out.mjs](../safe-out.mjs) | Win32 json 默认落临时文件 |

编排：

- `scripts/release-freeze.mjs` — git 采集 + CLI
- `scripts/release-freeze-enrich.mjs` — `enrichFreezePayload` + draft 私有辅助；**再导出**上表公共 API（selfcheck / note-merge 路径不变）
