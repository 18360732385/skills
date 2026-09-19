# feature-eng selfcheck fixtures

供 `scripts/selfcheck.mjs` 行为断言使用；**不是**消费仓过程态。

| 夹具 | 用途 |
|---|---|
| `init-skeleton/` | start 建盘后的最小骨架：`docs/runs/active/<slug>/{progress.yaml,回链.md}` + runs 索引 |
| `progress-bad/` | 缺关键字段的 progress，供负例（形状契约） |

勿把本目录当真实主题 resume/close。
