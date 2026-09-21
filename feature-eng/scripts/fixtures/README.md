# feature-eng selfcheck fixtures

供 `scripts/selfcheck.mjs` 行为断言使用；**不是**消费仓过程态。

| 夹具 | 用途 |
|---|---|
| `init-skeleton/` | start 建盘后的最小骨架：`docs/runs/active/<slug>/{progress.yaml,回链.md}` + runs 索引 |
| `progress-bad/` | 缺关键字段的 progress，供负例（形状契约） |
| `advance-gate/` | plan 环末、gates 时间戳 + L1 产物已填、即将 advance |
| `bindings-bad/` | 破损 stage-bindings 样本（null skill / 缺键），供绑定校验拒绝 |
| `close-ready/` | close 后 archive 形状（`stage=done` + `gates.close`） |

勿把本目录当真实主题 resume/close；`bindings-bad/` 更勿拷进消费仓当正式绑定。

## 0.2.7-dev 字段

progress 含 `chef_mode` / `env_notes`；回链可含「仪式与降级」。中文文件名（`回链.md` 等）为契约；脚本请 UTF-8 / `LC_ALL=C.UTF-8`。

