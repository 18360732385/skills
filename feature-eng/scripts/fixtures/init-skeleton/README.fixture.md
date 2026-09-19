# init-skeleton fixture

模拟 `start` 在用户确认分诊后写出的最小过程态：

- `docs/runs/README.md`
- `docs/runs/active/<slug>/progress.yaml`（关键字段齐全，枚举合法）
- `docs/runs/active/<slug>/回链.md`（含决策与术语/规划/原型/测试/其他节）

`path: bounded` · `stage: triage` · `run_mode: guided`。供 selfcheck 与 `status-scan.mjs` 烟测。
