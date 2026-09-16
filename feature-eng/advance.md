# advance — 环末推进

当前环声称完成时运行。

## 步骤

1. 读 `progress.yaml` 当前 stage。
2. 按 [gates-common.md](gates-common.md) 查该环对应的闸：
   - 需子 skill 的环：先按 [binding.md](binding.md) 确认已调起，再按 [stages.md](stages.md) 产物契约校验产物存在且形状正确
   - 闸类环节：直接校验通过条件
3. **过** → progress 写：本环 gates 时间戳、下一 stage、updated_at；按路径裁剪表算下一环（含跳过逻辑：Proto 桥、B 跳 7/10 等）；提示下一环动作。
4. **不过** → 停；列缺失项（缺哪个产物 / 哪个确认 / 哪个用例结论）；stage 不变。

## 硬约束

- 禁止「产物没有但先推进再说」。
- 越界判定（如代写用例、代画原型）以 SKILL.md 控制器边界节为准，本页不复述。
- 下一环若是 Proto 桥，按 [proto-bridge.md](proto-bridge.md) 自判规则执行。
