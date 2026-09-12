# fill（契约/MCP 填充 · 总则）

## Done（一次 fill 会话）

1. 本轮目标 shards 已过 `acceptance-check` 并 merge，或 Plan 标 `blocked` 并移交
2. `docs/harness-eng/score-latest.json` 已更新；摘要含 **`ai_coding_ready`** / `gold_ratio`
3. 【推荐】`report-latest.html` 路径已回复用户

骨架（land / resume / seed-truths）完成后使用。目标：把空壳补到「**ai_coding_ready**」。  
**不**并入 land。对用户中文名见 [glossary.md](../glossary.md)。

## 子模式

| 中文 | 模式 | 说明 | 规格 |
|---|---|---|---|
| 完整度打分 | `fill-score` | quality/coverage/**分层 ready**/**ai_coding_ready**/**gold_ratio**/**formula_ceiling**/**template_completeness** | [fill-score.md](fill-score.md) |
| 形态诊断 | `fill-morph` | overall / 域分 / ceiling / template_completeness（≠开干） | [fill-morph.md](fill-morph.md) |
| 开干闸 | `fill-gate` | ai_coding_ready / gate_profile / blockers / coverage_mode | [fill-gate.md](fill-gate.md) |
| 填充计划 | `fill-plan` | 目标/批次/Done；大仓 **gold + sample_n** | [fill-plan.md](fill-plan.md) |
| 语义验收 | `acceptance-check` | 深真全闸；merge/close 前置 | `scripts/acceptance-check.mjs` · [truth-quality.md](../modes/truth-quality.md) |
| MCP 装配 | `fill-mcp` | 多环境 **MCP 矩阵**；填充硬前置 | [fill-mcp.md](fill-mcp.md) |
| live 校准 | `fill-calibrate-live` | MCP 不可用时直连；可按引擎过 **填充 MCP 闸** | `scripts/fill-calibrate-live.mjs` |
| HTML 报告 | `fill-report-html` | score → Dashboard；「开干」绑 ai_coding_ready | `scripts/fill-report-html.mjs` |
| 多 Agent 精填 | `fill-truths-agents` | 按模板完整档 + Plan 批次【推荐】 | [fill-truths-agents.md](fill-truths-agents.md) |
| 自动填充 | `fill-truths-auto` | **仅脚本、对话不推荐** | [fill-truths-auto.md](../fill-truths-auto.md) → [archive/fill-truths-auto/](../archive/fill-truths-auto/INDEX.md) |
| 契约填充 | `fill-truths` | 完整档；默认 agents | [fill-truths.md](fill-truths.md) · [fill-workers.md](fill-workers.md) |

## 填充引擎 `Q_FILL_ENGINE`

| 值 | 含义 | 何时 |
|---|---|---|
| **agents**【推荐】 | 多 Agent + fill-plan；跳过 auto SSOT | 默认 |
| `hybrid` | 可选 `--work-only` 薄草稿 + agents | 用户明确要草稿加速 |
| `auto` | **legacy** 仅脚本 | 无多会话；WritePlan 须显式写出 |

## 与 seed 边界

| seed-truths | fill-* |
|---|---|
| 索引导航 + 空壳 TODO | 有 evidence 的正文 / 打分 / MCP |
| 不展开字段表 | **完整档**：有证据则展开 |

## 闸门

0. **填充 MCP 闸**（需 db·redis 时硬拦；见 [fill-mcp.md](fill-mcp.md)）· 1. **确认闸** · 2. **证据闸** · 3. **覆盖闸** · 4. **范围闸**（一次确认全部 shards）· 5. **密文闸** · 6. **语义闸**（DTO 绑定 / 禁模板逻辑 / Plan 验收）· 7. **acceptance 闸**（深真全；只 promote 过闸 fragment）

## 推荐切入

| 场景 | 路径 |
|---|---|
| **大仓首次** | [pipeline.md](../modes/pipeline.md) 骨架 Done ∧ 填充 MCP 闸 → [pipeline-fill.md](../modes/pipeline-fill.md) |
| **单域补齐** | fill-score → fill-mcp（过闸）→ inventory → fill-plan → WritePlan → agents → acceptance → merge → score |
| **继续**（已预授权） | 确认闸仍成立 → score → 读 fill-plan 下一批 → agents/calibrate/merge → score |

## 规范 CLI（0.5.9+）

inventory / merge **优先**统一入口（域脚本是别名，见 [fill/README.md](README.md)）：

```bash
node scripts/fill-inventory.mjs --domain <api|func|db|redis|jobs> --root <TARGET>
node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --check
node scripts/fill-merge.mjs --domain <id> --inventory <inv.json> --work-dir <dir> --target <ssot.md> --write
```

`fill-inventory-*.mjs` / `fill-merge-*.mjs` 仅作兼容别名（api merge 的 `--enrich-dto` / `--module` / `--auto-fill` 仍走 `fill-merge-api.mjs`）。

workers：[fill-workers.md](fill-workers.md) · [ai-tools.md](../host/ai-tools.md)。  
质量：[truth-quality.md](../modes/truth-quality.md)。
