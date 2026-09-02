# harness-eng 快速开始

一页纸入口。详细闸门与模式见 [SKILL.md](SKILL.md)、[glossary.md](glossary.md)。

## 你要做什么？

| 场景 | 对 Agent 说 | 结果 |
|---|---|---|
| 大仓第一次上 harness | **流水线** / pipeline | audit → **L4** land → **MCP 矩阵** → inventory → **fill-plan --gold** → **agents** → acceptance → score → **HTML 报告** |
| 只看缺口、不写盘 | **审计** / audit | 对照 L0–L4，默认不写文件 |
| 半成品接着补 | **续跑** / resume | 只补缺口，`on_exists=skip` |
| 按模板深填契约 | **多 Agent 填充** / fill-truths-agents | 须过 **填充 MCP 闸** → Plan 批次 → acceptance → merge → score |
| 含 Cron / Scheduler | 域含 **jobs** + inventory | `fill-inventory-jobs` → `.fill-work` → acceptance → `fill-merge.mjs --domain jobs`（heuristic 不得无标升 SSOT） |
| 建填充目标/批次 | **填充计划** / fill-plan | `docs/harness-eng/fill-plan.yaml`（大仓 gold+sample_n） |
| 仅脚本薄草稿（不推荐） | **自动填充** / fill-truths-auto | 仅 `--work-only` → `.fill-work`（legacy；仅 draft） |
| 看能不能开 AI 改业务 | **完整度打分** / fill-score | **ai_coding_ready** / **gold_ratio** / 分层 ready / 报告 |

## 写盘闸门（必记）

确认 / 预授权词表：[write-plan.md](write-plan.md)。「全部推荐」协议：[recommended-profile.md](recommended-profile.md)。最短路径：全部推荐 → 确认预授权 → 确认。

需 db·redis 实据时另过 **填充 MCP 闸**（[fill-mcp.md](fill-mcp.md)）：仓库 profile 自动发现 → `{engine}-{profile}` 矩阵 +（烟测 ∨ calibrate-live）；**过闸后再** inventory / agents；未过则停留骨架。

## 推荐最短路径（大仓）

```text
1. 点名 harness-eng → 流水线（目标 L4 · fill_engine=agents · gold）
2. 全部推荐 → 确认预授权 → 确认
3. 骨架战役（audit→L4→fill-mcp 矩阵）过闸后 → 填充战役见 pipeline-fill.md
4. acceptance-check → fill-merge.mjs --domain <id>（过闸）→ 打开 docs/harness-eng/report-latest.html
5. 看 **ai_coding_ready** + **gold_ratio**（不是旧 ready.ok）；heuristic 只留 `.fill-work`
6. Plan 未关或金标低 → 继续 agents；早停看 Plan 关闭 + `ai_coding_ready` / `gold_ratio`
```

## 本地脚本（可选）

```bash
node scripts/fill-plan.mjs --root <TARGET> --init --gold --sample-n 30
node scripts/acceptance-check.mjs --root <TARGET> --domain api
node scripts/fill-score.mjs --root <TARGET>
node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json
node scripts/selfcheck-0.5.0.mjs
```

版本见 [CHANGELOG.md](CHANGELOG.md)（当前 **0.5.0**）。
