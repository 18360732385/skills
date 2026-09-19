# advance-gate fixture

模拟 bounded 路径已过 design 确认、domain 桥 skipped、落在 **plan** 环末、**即将 advance** 的过程态：

- 若干 gates 已有 ISO 时间戳（`triage` / `shared_understanding` / `design_confirmed`）
- L1 产物指针已填（`artifacts.spec` / `artifacts.plan`）
- `gates.go` 仍为 null（advance 通过开干闸后才写）
- `stage: plan` · `domain: skipped` · `proto: null`

供 selfcheck 校验「可推进」形状（时间戳 / 产物指针 / 枚举），**不是**真实主题。
