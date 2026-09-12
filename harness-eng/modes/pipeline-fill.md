# pipeline-fill（流水线 · 填充战役）

**前置**：

1. 骨架战役 [pipeline.md](pipeline.md) 的 Done 已全部为真，且非 `fill_deferred`
2. **填充 MCP 闸**已过（[fill-mcp.md](../fill/fill-mcp.md)）：需 db·redis 实据时，过闸后再执行下列步骤 4+；未过则停留骨架

首轮只读骨架文件；骨架 Done 且闸过后再 Read 本文件。

## Done（填充战役）

1. `docs/harness-eng/fill-plan.yaml` 存在（大仓含 gold + `sample_n`）
2. 本轮开放批次已 agents 精填，或达 `--max-rounds` 且已移交说明
3. `acceptance-check` 已跑；过闸才 `fill-merge.mjs --domain <id>` / dto-batch
4. 每关一批次（或本战役收口）已 `bump-run-round`（`run-latest.json` round 递增）
5. `docs/harness-eng/score-latest.json` 与 `report-latest.html` 已写出
6. 早停成立：**Plan 开放批次=0** 且看开干（`ai_coding_ready`）/ 金标 / 语义；或达 max-rounds 并交出移交清单

宣称开干 **仅**当 `ai_coding_ready=true`（对用户摘要输出三词）。

## 填充步骤（4–12）

```text
4. fill-score（基线）
5. fill-inventory-*（api --all-modules · db · redis · func --all-modules）
6. fill-plan init【推荐】（大仓：--gold --sample-n 30）
7. fill-truths-agents【推荐】按 Plan 批次精填（fill-truths-agents.md / fill-workers.md / truth-quality.md）
8. acceptance-check → fill-merge.mjs --domain <id> --check → --write（含 jobs）；api 需 --enrich-dto/--module 时仍用 fill-merge-api；dto-batch（仅绑定当前接口类型）
9. 会话中途 MCP 掉线：先 reload；仍不可用则该引擎改 calibrate-live（须仍满足填充 MCP 闸）
10. fill-score（收口：分层 ready / ai_coding_ready / gold_ratio / formula_ceiling / semantic miss）
11. fill-report-html【推荐】→ docs/harness-eng/report-latest.html
12. 早停：Plan 开放批次=0 且语义/金标过阈 → 移交；或达 --max-rounds
```

`Q_FILL_ENGINE=agents`（默认）：跳过 fill-truths-auto。  
`hybrid`：可选薄 auto，仅 `--work-only` → `.fill-work/`；SSOT 只经 agents → acceptance → merge。
`auto`：legacy；WritePlan 须显式写出。

用户说「继续」且已预授权：先确认填充 MCP 闸仍成立 → `fill-score` → 读 fill-plan 下一批 → agents → acceptance → merge → score → report。  
usage-limit 后启发式只进 draft（`quality: heuristic`），见 [truth-quality.md](truth-quality.md)。

## 参数

| 参数 | 默认 | 说明 |
|---|---|---|
| 目标阶梯 | **L4** | 骨架战役已对齐 |
| `Q_FILL_ENGINE` | **agents** | agents【推荐】/ hybrid / auto（legacy） |
| `--ready-quality` | **80** | 形态 `ready.ok` 兼容（可读 meta） |
| `--ready-coverage` | **0.8** | 开干覆盖门槛（可读 meta.`ready_coverage`） |
| `--max-rounds` | 2 | fill 循环上限；Plan 未关时可继续（须说明） |
| 模块 | all / 梯队 | inventory `--all-modules`；agents 按 fill-plan 批次 |

## Agent 执行纪律

- 每步中文摘要：score / formula_ceiling / template_completeness / **ai_coding_ready** / plan open batches / writes / **MCP 矩阵覆盖**
- 每次 fill-score 后（`Q_REPORT_HTML` 默认开）：score JSON → `fill-report-html` → 回复 HTML 路径
- inventory 退出码：`0` 成功；`2` 有 skip/warning 可继续；`1` 硬错误须停
- agents 失败只重跑失败 shard；合并前 `fill-merge.mjs --domain <id> --check`（api 专属参数见 fill-merge-api）
- MCP 已写但工具列表无对应引擎 → reload 或 `fill-calibrate-live`；仍不过闸则 **停填充**
- **收益递减早停**：
  - Plan 开放批次 >0 → 不因贴 ceiling 停止
  - Plan 全关且 `semantic_ready` 假 → 移交人工修绑定/逻辑
  - 贴 ceiling 且 `template_completeness` 低 → 继续 agents
- 逐步过 **填充 MCP 闸** / 证据闸 / 密文闸 / 语义闸 / acceptance 闸

## 命令骨架

```bash
node scripts/fill-score.mjs --root <T> --ready-quality 80 --ready-coverage 0.8 --summary-only
node scripts/fill-report-html.mjs --root <T> --score score.json --mode pipeline
node scripts/fill-inventory-api.mjs --root <T> --all-modules
node scripts/fill-inventory-db.mjs --root <T>
node scripts/fill-inventory-redis.mjs --root <T>
node scripts/fill-inventory-func.mjs --root <T> --all-modules
node scripts/fill-plan.mjs --root <T> --init --domains api,func,db,redis
# 主 Agent 按 fill-plan / fill-truths-agents / fill-workers 开多会话精填并 merge
node scripts/fill-calibrate-live.mjs --root <T> --profile test
node scripts/fill-score.mjs --root <T> --ready-quality 80 --ready-coverage 0.8 --summary-only
node scripts/fill-report-html.mjs --root <T> --score score.json --mode pipeline
node scripts/fill-plan.mjs --root <T> --status
```
