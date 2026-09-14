# selfcheck 分包

- 入口仍是 [`../../selfcheck.mjs`](../../selfcheck.mjs)（`node scripts/selfcheck.mjs`）。
- [`helpers.mjs`](helpers.mjs)：`assert` / `runNode` / `readDoc` 工厂（可选复用）。
- [`checks-0.5.mjs`](checks-0.5.mjs)：0.5.2–0.5.10 套件。
- [`checks-0.6.mjs`](checks-0.6.mjs)：0.6.x 套件（M1–M4 · Trae 高 · 仪表盘 · freshness）。

更早 0.2–0.4 断言仍在入口文件前半；历史整文件 selfcheck 在仓库 `_history/harness-eng-selfcheck-legacy/`。
