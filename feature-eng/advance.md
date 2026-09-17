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

## 步骤

1. 读 `progress.yaml` 当前 stage。
2. 若刚结束的是子 skill 环：收取厨师回报的**产物路径列表**；由**本页**回写 `links.md` / `artifacts.*`（厨师不得已改 progress/links）。
3. 按 [gates-common.md](gates-common.md) 查该环对应的闸：
   - 需子 skill 的环：先按 [binding.md](binding.md) 确认已调起，再 **只 Read** [artifacts.md](artifacts.md) 中**当前 stage 那一节**，逐项勾选校验（每项 ✓ 才过）
   - 闸类环节：直接校验通过条件；若该环在 artifacts 有对应节，一并勾选
4. **过** → progress 写：本环 gates 时间戳、下一 stage、updated_at；按 [stages.md](stages.md) 路径裁剪表算下一环（含跳过逻辑：Proto 桥、B 跳 7/10 等）；提示下一环动作；若累计已完成环数 ≥ 5 或上下文明显过长 → 主动提议 [handoff.md](handoff.md)。
5. **不过** → 停；按 artifacts 勾选表列缺失项（哪一项未 ✓）；stage 不变。

## 硬约束

- 产物勾选未全过则不推进。
- **仅** start / advance / close / handoff / proto-bridge 可改 `progress.yaml` / `links.md`。
- 越界判定以 SKILL.md 控制器边界节为准，本页不复述。
- 下一环若是 Proto 桥，按 [proto-bridge.md](proto-bridge.md) 自判规则执行。
