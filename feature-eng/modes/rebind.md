# rebind — 修改环节绑定

改目标仓 **`docs/runs/stage-bindings.yaml`** 的映射；**不跑**业务流程、**不动**各主题 `runs/.../progress.yaml`。推荐包种子：[`config/stage-bindings.example.yaml`](../config/stage-bindings.example.yaml)；「推荐 ≠ 强制」见 [flow.md](specs/flow.md)。

解析序同 [init.md](init.md)：目标仓优先；缺失则提示先 init（勿默默改技能包内 config）。

## 步骤

1. 读现有绑定并用**固定表**展示（与 [init.md](init.md) 首问同款列：环 / **中文名** / 键名 / skill / null 标记；含 `defaults.invoke` / `defaults.commit_policy` / `defaults.handoff_policy` / `defaults.review_policy`）；并排展示 example.yaml 推荐包（便于对照）。中文名 SSOT：[flow.md](specs/flow.md)「可绑环节中文名与产物一句话」。
2. **首问**：全量重选（走 [init.md](init.md) 从推荐包首问起）还是**单环修改**；也可「重置为推荐包」或「只改 defaults」；（仍须用户确认后写盘）。
3. 单环修改：指定环节（可用中文名或键名）→ 展示中文名 + 推荐 + 候选 + 当前值 + 产物一句话 → 用户选定（可指定任意其他 skill 名；可选补 `input_contract`）→ 必要时协助安装（须同意）。
4. 预览 diff → 用户确认 → 写入目标仓 **`docs/runs/stage-bindings.yaml`**。**禁止**代跑目标仓 `scripts/agent-config/sync.mjs`（若存在）。

## 约束

- 改绑定不影响进行中主题的进度；但**下一环**起按新绑定调起。
- 改 `defaults.invoke` **不**自动改已有 `progress.invoke`；进行中主题仍以 progress 为准，除非用户要求同步改写。
- 若进行中主题的**当前环**尚未调起子 skill，换绑后按新 skill 调起；已调起并完成的不追溯。
- 未完成「首问」前不按推荐包覆盖用户已选绑定。
