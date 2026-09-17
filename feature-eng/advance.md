# advance — 环末推进

当前环声称完成时运行。`start`/`resume` 之后用户说本环做完即走本页，不必点名 `advance`。

## 口令协议

环末请用户用明确口令（控制器也可在环末贴出模板）：

| 用户说 | 含义 |
|---|---|
| `环 N 完成` / `本环完成` | 走本页 advance |
| `本环返工：…` | 不推进；回到当前环厨师，附返工要点 |
| `暂停` | 建议 [handoff.md](handoff.md)；stage 不变 |

模糊口令（`ok` / `完成` / `继续` / `2` 等）：**先复述**「我按 advance 环 \<当前 stage\> 理解，对吗？」——用户确认后再写盘。`express` 下若控制器刚给出「默认采纳，回复即可」且用户短确认，可视为对本环推荐的确认，但仍须能指认是「本环完成」而非「下一项推荐」。

## 目标回路

```text
厨师结束 → 回报路径
  → L1 机械勾选（artifacts）
  → L2 语义审核（gates-review；subagent 优先）
       fail → 列缺陷，stage 不变
       pass → 若本环有用户硬闸 → 短确认卡片
       → 写 progress/links/gates，推进 stage
       → 按 handoff_policy 主动调起下一环
```

## 步骤

1. 读 `progress.yaml` 当前 stage；读 `handoff_policy` / `review_policy`（缺省按模板/defaults）。
2. 若刚结束的是子 skill 环：收取厨师回报的**产物路径列表**；由**本页**回写 `links.md` / `artifacts.*`（厨师不得改 progress/links）。
3. **L1 机械闸**：按 [gates-common.md](gates-common.md) 查该环对应闸；需子 skill 的环 **只 Read** [artifacts.md](artifacts.md) 当前 stage 节，逐项勾选（每项 ✓ 才过）。闸/桥类按各自文件。L1 不过 → 停并列缺失项；**不**跑 L2。
4. **L2 语义闸**（有离开环标准时，见 [gates-review.md](gates-review.md)）：
   - 按 `review_policy` 调起审核（`subagent` 优先；无 Task → `inline` 审核帽）
   - 收取 `runs/<slug>/review-<stage>.md`；回写 links
   - `result=fail` → 停；列 defects；stage 不变；**不**调下一厨师
   - 桥类 / triage / pre-impl / handoff：无完整 L2，跳过本步
5. **用户硬闸短确认**（若本环离开需要，见 gates-common「用户硬闸卡片」）：贴卡片，等 `确认` / `返工：…`。未确认不得写 gates 时间戳。
6. **过** → progress 写：本环 gates 时间戳、下一 stage、updated_at；按 [stages.md](stages.md) 路径裁剪算下一环（含定稿桥、Proto 桥、B 跳 7/10 等）。若累计已完成环数 ≥ 5 或上下文明显过长 → 主动提议 [handoff.md](handoff.md)。
7. **主动进入下一环**（`handoff_policy`，见下节）。
8. **不过**（L1/L2/硬闸任一）→ 停；stage 不变。

## 过闸后主动调起（`handoff_policy`）

算得下一 stage 后：

1. 若下一环是 **控制器桥**（`domain-bridge` / `proto-bridge`）或闸（`pre-impl` 等）→ **直接**跑对应文件，不 lookup。
2. 若下一环需子 skill：
   - **`auto`**：立即按 [binding.md](binding.md) **主动** lookup 调起（带上环产物 + 本环 L2 结论路径）。
   - **`confirm`**：短确认卡片「进入〈中文名〉（skill=…）？回复确认 / 暂不」；确认或默认采纳 → lookup；否 → stage 已推进但未调起，links 记 `pending_invoke: <stage>`，等用户再说「继续」再 lookup。
3. 用户**不是**默认路由器；仅当 `invoke=strict` 且宿主无法开 Task 时，lookup 才退回「复制指针 + 新会话点名」。

## 硬约束

- L1 与 L2（适用时）未全过则不推进。
- **仅** start / advance / close / handoff / proto-bridge / domain-bridge 可改 `progress.yaml` / `links.md`。
- 审核员只写 `review-*.md`；不得推进 stage。
- 自动调起 **≠** 替用户 yes 硬闸。
- 越界判定以 SKILL.md 控制器边界节为准。
- 设计确认闸刚过 → 下一动作为 [domain-bridge.md](domain-bridge.md)。
- 开干闸刚过 → 下一动作为 [proto-bridge.md](proto-bridge.md)。
