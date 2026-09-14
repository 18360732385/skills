# selfcheck 分包

- 入口仍是 [`../../selfcheck.mjs`](../../selfcheck.mjs)（`node scripts/selfcheck.mjs`）。
- [`helpers.mjs`](helpers.mjs)：`assert` / `runNode` / `readDoc` 工厂（可选复用）。
- [`checks-0.6.mjs`](checks-0.6.mjs)：0.6.x 套件（M1–M4 · Trae 高 · 仪表盘 · freshness）。

后续可将 0.5.x / 更早块同样迁出；不要改入口文件名。
