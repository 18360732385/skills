# feature-eng 一页纸

点名本 skill → 按意图走模式。热路径索引：[AGENT-INDEX.md](AGENT-INDEX.md)。验收：`node scripts/selfcheck.mjs`。

## 主循环

```text
init（首次绑 11 环）
  → start（分诊 S/B/F · 建 docs/runs/active/<slug>/）
    → 子 skill 干活（lookup / 指针卡片）
      → advance（L1→L2→写盘→按 handoff_policy 调下一环）
        → … 循环至收口
          → close（active → archive）
```

续跑：`resume`。只看进度：`status`（`node scripts/feature.mjs status`）。改绑：`rebind`。列模式：`node scripts/feature.mjs modes`。

## 路径一句话

| 路径 | 一句话 |
|---|---|
| **S** Spike | 可行性探查；结论是答案，不入库代码 |
| **B** Bounded | 小变更；聊天短设计，可无独立 Spec |
| **F** Full | 新子系统 / 改公共接口 / 需 ADR；Spec+Plan+集成用例+测试报告+收口 |

## 三条硬规则

1. **调度员不进厨房**——控制器不写领域正文 / 业务代码。
2. **progress / 回链 仅控制器写**——厨师只回报产物路径列表。
3. **自动调起 ≠ 替用户 yes 硬闸**。

详情：[SKILL.md](SKILL.md) · [binding.md](modes/binding.md) · [stages.md](modes/stages.md)
