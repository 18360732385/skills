# fill-truths-agents（多 Agent 按模板精填真相）

## Done

1. 本轮 `in_progress` 批次的 `.fill-work` fragment 已落盘
2. `acceptance-check` 已跑；仅过闸才 merge / `--write`
3. fill-plan 批次状态已更新为 closed 或 blocked（含失败原因）
4. 关闭本轮批次后执行：`node scripts/bump-run-round.mjs --root <TARGET> --note fill-truths-agents`（round 单调 +1）
5. 再跑 fill-score → fill-report-html

主 Agent 编排 + 多会话 worker 对照**目标仓 templates 完整档**写真相。  
**0.2.17+ 默认填充路径**；`fill-truths-auto` 为 legacy。  
**0.2.18+**：须过 [truth-quality.md](../modes/truth-quality.md) / `acceptance-check` 才可 promote SSOT。  
须配合 [fill-plan.md](fill-plan.md) 批次关闭；执行契约见 [fill-workers.md](fill-workers.md)。

## 触发

- **多 Agent 精填**（fill-truths-agents / 按模板填真相）
- pipeline / fill 且 `Q_FILL_ENGINE=agents|hybrid`（默认 agents）
- fill-score：`ai_coding_ready=false` / `semantic_ready=false` / Plan 仍有开放批次 / **gold_ratio 低**

## 前置

1. 已跑 inventory（api / db / redis / func / **jobs** → `docs/<domain>/.fill-work/inventory*.json`）。jobs：认 `scheduler_link`；`heuristic` 须 `quality: heuristic`，不得无标升 SSOT
2. 【推荐】`fill-plan` 已 init；大仓【推荐】**`--gold --sample-n 30`**；本轮只处理 `in_progress` 批次
3. 域/栈需 db·redis：**填充 MCP 闸**已过（[fill-mcp.md](fill-mcp.md)）；未过则停留骨架（过闸后再本模式）
4. WritePlan 确认（或已预授权）
5. 大仓：只处理 Plan 当前 `in_progress` 批次；结案范围以 Plan `sample_n` / `deferred` 为准

## 引擎关系（0.2.18）

```text
inventory（脚本；jobs=`fill-inventory.mjs --domain jobs`）
  → fill-plan init [--gold]
  → fill-truths-agents（本模式）按批次 + 模板完整档 → 只写 .fill-work
  → acceptance-check（深真全闸；含 jobs）
  → fill-merge.mjs --domain <id> --check → --write（过闸才写；api 专属 --enrich-dto/--module 挂统一 CLI）
  → dto-batch（接口绑定；api）
  → fill-calibrate-live（db/redis 实据）
  → fill-score（ai_coding_ready + semantic + gold_ratio + plan）
  → fill-plan --close（acceptance 失败 → blocked）
```

| `Q_FILL_ENGINE` | 行为 |
|---|---|
| `agents`【推荐】 | 跳过 auto SSOT，直接 agents |
| `hybrid` | 可选 `--work-only` 草稿 → agents |
| `auto` | legacy；仅无多会话时 |

## 主 Agent 流水线

```
- [ ] 1 读 fill-plan + meta.ai_tools；按 fill-workers「启动表」准备 worker
- [ ] 2 将开放批次标 in_progress；按批次切 shard → docs/<domain>/.fill-work/<shard-id>.json
- [ ] 3 串行（兜底）或并行 ≤3（大仓额度紧时）启动 worker；各贴答案卡 + acceptance
- [ ] 4 收盘：只认磁盘 fragment；usage limit/超时 → 批次 blocked；启发式只标 `quality: heuristic` 留在 `.fill-work`
- [ ] 5 acceptance-check.mjs；`fill-merge.mjs --domain <id> --check` → `--write`；api 需 enrich-dto 时加在统一 CLI；fill-dto-batch
- [ ] 6 各契约域过闸后并入 SSOT
- [ ] 7 fill-score + fill-report-html；过闸则 fill-plan --close
```

## 失败协议（0.2.18）

| 情况 | 动作 |
|---|---|
| worker usage limit / 超时 | 批次 `blocked`；只重跑失败 shard；父会话只编排重跑，不写 SSOT |
| 启发式草稿 | 文首 `quality: heuristic`；仅可留在 `.fill-work` |
| acceptance blockers | 只 promote 过闸 fragment；`--force-write` / `--force-close` 仅移交 |

## 域 checklist（worker 必达 · 深真全）

完整反例与答案卡：[truth-quality.md](../modes/truth-quality.md) · [fill-workers.md](fill-workers.md)。

### api

| 必填 | 要求 |
|---|---|
| 功能描述 | `[角色]在[场景]做[动作]，得到[结果]`（反例见 truth-quality） |
| 接口地址 / 请求方式 | 与代码一致 |
| evidence | `path#method` |
| 功能逻辑 | ≥2 有效步；含分支/约束/落库/错误码之一；反例见 acceptance / truth-quality |
| 请求参数 | 表；有 DTO 则展开 |
| 响应参数 | **展开 data 字段**或标明 stream/void |

### func / db / redis

同 [truth-quality.md](../modes/truth-quality.md) 表格；db 须完整 DDL；redis 须 TTL+读写方。

## 纪律

- worker 只写 `docs/<domain>/.fill-work/`；SSOT 仅经 acceptance → merge
- 无 evidence → `TODO(harness-eng)`；字段/URL 只从本仓证据抽取
- 索引只导航
- 并发建议 2～3（大仓）；DTO 重时降到 2

## 与其它模式

| 模式 | 角色 |
|---|---|
| fill-truths-auto | 薄底 / 回退；仅 `.fill-work` 草稿 |
| fill-truths-agents | **深度与模板对齐【推荐】** |
| acceptance-check | promote / close 语义闸 |
| fill-calibrate-live | db/redis 实据 |
| fill-score | 看 `gold_ratio` + **`ai_coding_ready`**；贴 ceiling 则继续 agents 或移交 |

## 早停

Plan 金标未关或 `gold_ratio` 低 → 继续精修；可 AI coding **仅**当 `ai_coding_ready=true`。
