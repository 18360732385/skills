# advance — 环末推进

当前环声称完成时运行。`start`/`resume` 之后用户说本环做完即走本页，不必点名 `advance`。

## 步骤

1. 读 `progress.yaml` 当前 stage。
2. 按 [gates-common.md](gates-common.md) 查该环对应的闸：
   - 需子 skill 的环：先按 [binding.md](binding.md) 确认已调起，再 **只 Read** [artifacts.md](artifacts.md) 中**当前 stage 那一节**，逐项勾选校验（每项 ✓ 才过）
   - 闸类环节：直接校验通过条件；若该环在 artifacts 有对应节，一并勾选
3. **过** → progress 写：本环 gates 时间戳、下一 stage、updated_at；按 [stages.md](stages.md) 路径裁剪表算下一环（含跳过逻辑：Proto 桥、B 跳 7/10 等）；提示下一环动作。
4. **不过** → 停；按 artifacts 勾选表列缺失项（哪一项未 ✓）；stage 不变。

## 硬约束

- 产物勾选未全过则不推进。
- 越界判定以 SKILL.md 控制器边界节为准，本页不复述。
- 下一环若是 Proto 桥，按 [proto-bridge.md](proto-bridge.md) 自判规则执行。
