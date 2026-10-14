# e2e-19 验证记录（0.7.47）

> tip：`harness-eng` **0.7.47**（pin 前同口径 selfcheck 曾见 manifest **0.7.46**；门禁是 `skill_version ===` manifest）· 时间：Asia/Shanghai · 2026-10-14  
> 范围：P1 长跳 / 冷 clone（e2e-16 A/H）+ P2 coverage append（默认 off）

## 结论

| 口径 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` | **PASS**（含 0.7.47 块） |
| 实仓 A 长跳 / H 冷 clone | **SKIP** |
| 夹具代替 A/H | **PASS**（权威） |

**A/H 实仓 SKIP 原因**：本 workspace 没有 `inventory-order` 0.7.32 金仓（计划路径 `/workspace/e2e-15/inventory-order-fullstack` 不存在；`/workspace`、`/home/ubuntu`、`/opt`、`/tmp` 下亦无 `inventory-order*` / `e2e-15` 目录）。没有可 clone 的金仓 URL，因此不编造实仓结果。A/H 以 selfcheck 夹具为权威。

## 矩阵

| # | 场景 | 结果 | 证据 |
|---|---|---|---|
| A | 长跳 0.7.32→tip | SKIP 实仓；**PASS 夹具** | `scripts/fixtures/e2e-19-longjump`（meta `skill_version: 0.7.32`，ladder **L4** 契约满阶、非 L5，避免 upgrade 走 agent-config sync）。复制到 tmp 后 `harness.mjs --mode upgrade --root <tmp> --migrate-docs=auto` **exit 0**。`migrate-docs-report.json` **ops=1**（`api_rewrite_path`，`/api/old` → `/api/renamed`）。`upgrade-diff.json` `skill_version` 等于 manifest（pin 后 **0.7.47**；pin 前同断言为 0.7.46）。`migrate_coverage.mode=off`。真相文档已写成 `/api/renamed` |
| B | coverage `covered_gt` | **PASS** | `planCoverageAppend` 仅 `covered_gt` → **ops=0** 且 skipped；无 `delete` kind。已有业务说明 → `user content present`，mtime 不变 |
| H | 冷 clone 无 fill-work | SKIP 实仓；**PASS 夹具** | `scripts/fixtures/e2e-19-cold` 无 `.fill-work`。tmp 内 `git commit` 后 `scanApiInventoryMemory` 的 `git_head === HEAD` 且 endpoints≥1。stock `fill-score.mjs --json`：**inventory_stale=[]（不含 api）**；未创建 `.fill-work`。`ai_coding_ready` 仍 false（夹具无骨架/覆盖，不把整仓开干当本场景门禁；与 0.7.40+「冷仓不因 api memory git_head 强制 refresh」一致） |
| L | selfcheck | **PASS** | 断言 ID：`0.7.47 longjump migrate-docs` · `0.7.47 cold stock ready`（见 selfcheck 0.7.47 块） |

## 实现锚点

- `scripts/lib/migrate-docs.mjs` — `planCoverageAppend` / `applyCoverageAppend`；`covered_gt` 只 skipped
- `scripts/lib/upgrade-diff.mjs` — `migrate_coverage`；默认 off 不写缺页
- `scripts/harness.mjs` — `--migrate-coverage[=off|append|dry-run]` 默认 **off**
- 夹具：`scripts/fixtures/e2e-19-longjump/` · `scripts/fixtures/e2e-19-cold/`

## 非本轮

- 宿主人验（Trae / Codex / CodeBuddy）不改代码
- 跨 mode `last_mode` 保持 **accepted residual**
