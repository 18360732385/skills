# advance — 环末推进

当前环声称完成时运行。`start`/`resume` 之后用户说本环做完即走本页，不必点名 `advance`。

## 口令协议

| 用户说 | 含义 |
|---|---|
| `环 N 完成` / `本环完成` | 走本页 advance |
| `本环返工：…` | 不推进；回到当前环厨师 |
| `暂停` | 建议写 `交接.md`；stage 不变 |

模糊口令：先复述「我按 advance 环 \<当前 stage\> 理解，对吗？」再写盘。

## 目标回路

```text
厨师结束 → 回报路径
  → L1（gates Part A）→ L2（gates Part B；subagent 优先）
  → 用户硬闸短确认（若需要）
  → 写 progress.yaml / 回链.md / gates → 推进 stage
  → 按 handoff_policy 主动调起下一环
```

## 步骤

1. 读主题根 `docs/runs/active/<slug>/progress.yaml`（及 `handoff_policy` / `review_policy`）。
2. 收取厨师**产物路径列表**；本页回写 `回链.md` / `artifacts.*`。
3. **L1**：只 Read [gates.md](specs/gates.md) 当前 stage 节。不过 → 停。
4. **L2**（适用时）：按 [gates.md](specs/gates.md) 调起审核；收取 `审核-<stage>.md`；fail → 停。桥/triage/pre-impl/handoff 可跳过完整 L2。
5. **用户硬闸短确认**（见 [gates.md](specs/gates.md) Part C）：未确认不得写 gates 时间戳。
6. **过** → 写 gates、下一 stage、updated_at；算下一环。环数 ≥5 或上下文过长 → 提议 [handoff.md](specs/handoff.md)。
7. **主动进入下一环**（`handoff_policy`）：
   - 下一环是桥/闸 → 直接跑对应文件
   - 需 skill：先过 [flow.md](specs/flow.md)「绑定 skill 可调起」预检 A–E；`auto` 立即 lookup；`confirm` 短卡片后再 lookup；用户否 → `回链.md` 记 `pending_invoke`
8. **不过** → stage 不变。

## 硬约束

- L1∧L2（适用时）未过不推进。
- 仅控制器改 `progress.yaml` / `回链.md`。
- 审核员只写 `审核-<stage>.md`。
- 自动调起 ≠ 替用户 yes 硬闸。
- 设计确认后 → [bridges.md](specs/bridges.md)；开干后 → [bridges.md](specs/bridges.md)。
- **证据条**：写 `gates.*` ISO 前，回链 `authorized_by` 合法且适用环 `审核-<stage>.md` 已落盘且 **`result: pass`**（`chef_mode=controller_proxy` 不豁免；proxy 须「仪式与降级」非空）。机检：`node scripts/gate-evidence.mjs` 或 `node scripts/feature.mjs gate-evidence`。
