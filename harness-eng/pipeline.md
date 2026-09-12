# pipeline（流水线 · 骨架战役）

一次确认后跑 harness 全链路。本文件只覆盖 **骨架战役**；填充战役默认不在首轮上下文。

## Done（骨架战役）

全部为真才允许 Read 填充战役规格：

1. audit 报告已输出（已具备 / 缺口 / 反模式 / 建议下一阶）
2. 目标 **L4** 骨架齐：`docs/harness-eng/harness-meta.yaml`（无则回退 `.cursor/`）的 `ladder`≥L4（或本轮 land/resume 已装齐 L4 必备文件）
3. **填充 MCP 闸**已过（见 [fill-mcp.md](fill-mcp.md)）：域/栈需 db·redis 时，矩阵 +（MCP 烟测 ∨ calibrate-live）；仅书面跳过 MCP 且无 calibrate-live → 本项为假（停留骨架）
4. 若不做填充、只要骨架：WritePlan 标注 `fill_deferred=true`，则第 3 项可记「延期」；**本轮不** Read [pipeline-fill.md](pipeline-fill.md)

**骨架 Done 且非 fill_deferred** 后再 Read [pipeline-fill.md](pipeline-fill.md)。第 3 项为真后再展开填充步骤。

## 触发

- **流水线**（pipeline）
- 首次落地大仓且用户同意「预授权」后续 fill 轮次
- RecommendedProfile / questions：`large_repo` →【推荐】**pipeline**

## 骨架步骤（1–3）

```text
1. audit（只读指纹 + MCP 矩阵）→ [audit-report.md](audit-report.md) · [detect.md](detect.md)
2. land 或 resume（骨架目标 **L4**：hooks + mcp.example + gitignore）
   → 确认后 `scripts/harness.mjs --mode pipeline-skeleton`（仅骨架写盘，不跑 fill-* / 不 Read pipeline-fill）
3. fill-mcp（多环境矩阵；烟测或 calibrate-live）→ [fill-mcp.md](fill-mcp.md)
```

写盘走公开入口 `scripts/harness.mjs`（`land.mjs` 薄别名），**不要**把 `render.mjs` 当 Agent 主路径。`pipeline-skeleton` 只覆盖本文件骨架战役；填充战役仍在骨架 Done 且非 `fill_deferred` 后再 Read [pipeline-fill.md](pipeline-fill.md)。

引擎默认：`Q_FILL_ENGINE=agents`（填充战役用）。hybrid/auto 见 [pipeline-fill.md](pipeline-fill.md) · [fill.md](fill.md)。

## 确认与预授权

闸门词表 / 预授权语义 SSOT：[write-plan.md](write-plan.md)。

1. **首轮**：完整 WritePlan 须同时声明骨架战役 + 填充战役范围（即使填充细节在过闸后再 Read）
2. **预授权**（`Q_PREAUTH`）：过闸后同会话后续 resume / fill **自动写盘**
3. 未预授权：每轮 fill 仍须确认
4. Windows JSON 传参：见 [write-plan.md](write-plan.md#windows-json-传参gotcha-ssot)

## 交接

骨架 Done ∧ 填充 MCP 闸过 → Read [pipeline-fill.md](pipeline-fill.md) → 填充战役 → 其 Done 为整条 pipeline 收口。  
闸未过 → 打印矩阵缺口并停；用户补 MCP / calibrate-live 后再续。
