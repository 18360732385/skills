# fill-plan（契约域填充任务计划）

把「填真相」从分数早停，改成 **可关闭的目标批次**。  
状态文件：目标仓 `docs/harness-eng/fill-plan.yaml`（施工产物，非契约 SSOT）。  
质量规格：[truth-quality.md](../modes/truth-quality.md)（0.2.18+ 深·真·全）。

## 触发

- pipeline 在 inventory 之后【推荐】
- **填充计划**（fill-plan）
- fill-score 显示 `ai_coding_ready=false` 且需继续 agents
- 大仓【推荐】**金标**：`--gold --sample-n 30`

## 目标模型

```yaml
version: "0.2.18"
goal: "P0 金标域闭环（深真全 + acceptance 过闸）"
domains: [api, func, db, redis, jobs]
done_when:
  - skeleton_ready
  - coverage_ready
  - semantic_ready
  - plan_batches_closed
  - gold_batches_closed
batches:
  - id: api-01-gold
    domain: api
    modules: [sms-entrance]
    status: open   # open | in_progress | closed | blocked
    tier: gold
    acceptance:
      - "每接口有 evidence path#method"
      - "请求参数类型 ∈ 方法签名 / 请求体类型声明"
      - "功能逻辑非通用四步模板"
      - "深真全：见 skill truth-quality.md"
      - "acceptance-check 无 blocker 方可 close"
    sample_n: 30  # 大仓金标强制非 null
```

## Done 条件（机器可检 + 人工抽检）

| 域 | 关闭批次前至少满足 |
|---|---|
| api | evidence；入参绑定；禁通用四步/路径回声/假导出；`acceptance-check` 无 blocker；dto-batch 无新增 `dto-unbound` |
| func | 方法说明含业务谓词；结案范围以 Plan `sample_n`/`deferred` 为准 |
| db | 完整 DDL；COMMENT 或显式未知 |
| redis | Key 模式 + Value + TTL + 读写方 |
| jobs | task_code / Cron / Scheduler 入口 / 代码锚点；heuristic 不得升 SSOT |

**`ai_coding_ready`**：分层 ready 全真且开放批次=0。大仓另看 **`gold_ratio`**（局部金标闭环即可）。

## 主 Agent 流水线

```
- [ ] 1 fill-plan.mjs --init [--gold --sample-n 30]
- [ ] 2 展示开放批次；选 ≤并发上限 的 open → in_progress
- [ ] 3 按 fill-workers 开 agents，只处理本批次（写 .fill-work）
- [ ] 4 acceptance-check；merge --check/--write；dto-batch；fill-score
- [ ] 5 过闸 → --close；否则 blocked（或 --force-close 移交）
- [ ] 6 重复至开放批次=0 或达 max-rounds → 移交
- [ ] 7 批次全关后若仍有 acceptance warnings：`fill-plan --residual`（或看 score `warning_shards`）清残项
```

## 命令

```bash
node scripts/fill-plan.mjs --root <TARGET> --init --gold --sample-n 30 --domains api,func,db,redis,jobs --modules sms-entrance
node scripts/fill-plan.mjs --root <TARGET> --status
node scripts/fill-plan.mjs --root <TARGET> --set <batch-id> --batch-status in_progress
node scripts/acceptance-check.mjs --root <TARGET> --domain api [--gold]
node scripts/fill-plan.mjs --root <TARGET> --close <batch-id>
# 金标批次已关、开干已 YES 但仍有 warnings：
node scripts/fill-plan.mjs --root <TARGET> --residual [--gold]
# 移交例外：
node scripts/fill-plan.mjs --root <TARGET> --close <batch-id> --force-close
```

## 残项清理（`--residual`）

金标批次已关后，acceptance 仍可能剩 **warnings**（非 blocker）。`--residual` 扫 plan 域（或 `--domains`），输出：

- `warning_shards` / `blocker_shards`（按文件聚合）
- exit：blockers→1 · 仅 warnings→2 · 干净→0

与 `fill-score` 的 `warning_shards` 同源思路；score 建议下一步会指向本命令。

## 纪律

- 大仓默认金标 + `sample_n`；精填完成以 Plan 批次关闭 + acceptance 为准
- close 前跑 acceptance；失败标 `blocked`
- 金标 close 只接受过 acceptance 的批次；heuristic 草稿保持 draft
- 开干 YES 不等于零 warning；残项用 `--residual` 清