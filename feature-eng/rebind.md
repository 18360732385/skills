# rebind — 修改环节绑定

改 `config/stage-bindings.yaml` 的映射；**不跑**业务流程、**不动** `runs/` 进度。推荐包 SSOT：[`config/stage-bindings.example.yaml`](config/stage-bindings.example.yaml)；「推荐 ≠ 强制」见 [binding.md](binding.md)。

## 步骤

1. 读现有绑定并展示（环节 → skill，标出 null；含 `defaults.invoke` / `defaults.commit_policy`）；并排展示 example.yaml 推荐包（便于对照）。
2. **首问**：全量重选（走 [init.md](init.md) 从推荐包首问起）还是**单环修改**；也可「重置为推荐包」或「只改 defaults」；（仍须用户确认后写盘）。
3. 单环修改：指定环节 → 展示推荐 + 候选 + 当前值 → 用户选定（可指定任意其他 skill 名；可选补 `input_contract`）→ 必要时协助安装（须同意）。
4. 预览 diff → 用户确认 → 写盘 → 提示跑 `node scripts/agent-config/sync.mjs`。

## 约束

- 改绑定不影响进行中主题的进度；但**下一环**起按新绑定调起。
- 改 `defaults.invoke` **不**自动改已有 `progress.invoke`；进行中主题仍以 progress 为准，除非用户要求同步改写。
- 若进行中主题的**当前环**尚未调起子 skill，换绑后按新 skill 调起；已调起并完成的不追溯。
- 未完成「首问」前不按推荐包覆盖用户已选绑定。
