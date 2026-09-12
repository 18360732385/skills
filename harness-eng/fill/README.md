# fill 索引

填充家族的**先读页**。总则仍是 [fill.md](fill.md)；不要从 SKILL 直接跳进某一份 fill-*.md。  
骨架（land / resume / seed-truths）完成后再填。目标：`ai_coding_ready`。

## 规格

| 中文 | 模式 / 规格 | 说明 |
|---|---|---|
| 总则 | [fill.md](fill.md) | Done、引擎、闸门、与 seed 边界 |
| 完整度打分 | [fill-score.md](fill-score.md) | 双轴 + score-policy 裁决 |
| 形态诊断 | [fill-morph.md](fill-morph.md) | overall / 域分 / ceiling |
| 开干闸 | [fill-gate.md](fill-gate.md) | `ai_coding_ready` / blockers |
| 填充计划 | [fill-plan.md](fill-plan.md) | 批次 / 金标 |
| 多 Agent 精填 | [fill-truths-agents.md](fill-truths-agents.md) | 【推荐】按 Plan |
| 契约填充 | [fill-truths.md](fill-truths.md) | 完整档；默认 agents |
| workers | [fill-workers.md](fill-workers.md) | fragment / 域约定 |
| 深真全 | [truth-quality.md](../modes/truth-quality.md) | draft vs SSOT |
| MCP 装配 | [fill-mcp.md](fill-mcp.md) | 填充硬前置（需 db·redis） |
| 流水线填充战役 | [pipeline-fill.md](../modes/pipeline-fill.md) | 骨架 Done 之后 |
| 自动填充 | [fill-truths-auto.md](../fill-truths-auto.md) → [archive/fill-truths-auto/](../archive/fill-truths-auto/INDEX.md) | **仅脚本、对话不推荐** |

## 脚本（规范入口）

**只认统一 CLI**（按 `--domain`；域脚本是 **弃用别名 / 薄包装**，只转发 argv）：

```bash
node scripts/fill-inventory.mjs --domain <api|func|db|redis|jobs> --root <TARGET> [域参数…]
node scripts/fill-merge.mjs --domain <api|func|db|redis|jobs> --inventory <inv.json> --work-dir <dir> --check
node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --target <ssot.md> --write
node scripts/fill-merge.mjs --domain api ... --write --enrich-dto --source-root <java-root>
```

实现在 `scripts/lib/inventory-<id>.mjs` 与 `scripts/lib/merge-domain.mjs` / `merge-api.mjs`。

| 脚本 | 用途 |
|---|---|
| `fill-inventory.mjs` | **规范** inventory 入口（`--domain`） |
| `fill-inventory-{api,func,db,redis,jobs}.mjs` | **弃用** shim；只转发 `--domain`，无扫描逻辑 |
| `fill-merge.mjs` | **规范** merge 入口（`--domain`）；api 旗标 `--enrich-dto` / `--module` / `--auto-fill` |
| `fill-merge-{api,func,db,redis,jobs}.mjs` | **弃用** shim；只转发 argv（api shim 保留 enrich 旗标） |
| `fill-score.mjs` | 打分 |
| `fill-plan.mjs` | 计划 |
| `acceptance-check.mjs` | 语义闸 |
| `fill-report-html.mjs` | HTML 报告 |
| `fill-calibrate-live.mjs` | MCP 不可用时直连 |
| `fill-truths-auto.mjs` | 薄转调 archive；**仅脚本、对话不推荐** |
| `fill-dto-fields.mjs` | api merge `--enrich-dto` 辅助 |

## 推荐最短填充

`fill-score` →（需 db·redis 则）`fill-mcp` 过闸 → **`fill-inventory.mjs --domain`** → `fill-plan` → WritePlan → agents → `acceptance-check` → **`fill-merge.mjs --domain`** → `fill-score` → 打开 `report-latest.html`。
