# e2e-16 验证记录（0.7.44）

> tip：`harness-eng` **0.7.44** · 时间：Asia/Shanghai · 2026-10-14  
> 范围：P1-A 默认 migrate-docs + P1-B 0.7.41–43 待复验项

## 结论

| 口径 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` | **PASS** |
| in-repo 矩阵（等价场景） | **10 PASS / 2 SKIP / 0 FAIL** |
| 实仓 0.7.32 金仓长跳 | **SKIP**（本 workspace 无金仓） |

0.7.41–43「已修待复验」项在 tip + selfcheck + 本矩阵均已复验通过；唯一产品缺口 **ready-regress 无自动文档迁移** 已由 0.7.44 默认 AUTO migrate-docs 关闭（可用 `--no-migrate-docs` 退出）。

## 矩阵

| # | 场景 | 结果 | 证据 |
|---|---|---|---|
| A | 长跳 0.7.32→tip | SKIP | 无外部金仓 |
| B | ver-pin | PASS | `emitUpgradeStrictnessDiff` dry-run `skill_version===0.7.44`，无钉死 `0.7.38` |
| C | skill_root 可移植 | PASS | meta=`env:HARNESS_ENG_ROOT`；设 env 可 resolve |
| D | calibrate DDL 宽度 | PASS | `normalizeDdlForCompare` int/varchar 宽度等价 |
| E | wrappers【旧仓升级】 | PASS | stderr 含前缀；retire 列表非空 |
| F | last_mode 同 mode×3 | PASS | mergeYamlMaps 字节稳定 |
| G | 多批 strip last_mode | PASS | hash 稳定 |
| NEW | migrate-docs AUTO | PASS | path drift → rewrite → `detectApiFieldDrift` 清零 |
| NEW | `--no-migrate-docs` | PASS | mode=off；计划仍可生成、不强制写盘 |
| H | 冷 clone | SKIP | 实仓未跑；既有 selfcheck/VERIFY 覆盖 |
| I | 四域漂移回归 | PASS | selfcheck 0.7.36–38 + 0.7.44 |
| L | selfcheck 全绿 | PASS | exit 0 |

## 实现锚点

- `scripts/lib/migrate-docs.mjs` — plan/apply/report
- `scripts/lib/upgrade-diff.mjs` — 默认 AUTO；迁移后重跑 fill-score
- `scripts/harness.mjs` — `--migrate-docs` / `--no-migrate-docs`
- 文档：`modes/upgrade.md` `## 0.7.43 → 0.7.44` · `VERIFY.md` · `_log/harness-eng/0.7/0.7.44.md`

## 后续（非本轮）

- 有 0.7.32 金仓时补跑 A/H 实仓长跳与冷 clone
- P2：跨 mode last_mode CI strip、wrappers UX、calibrate 引擎噪
