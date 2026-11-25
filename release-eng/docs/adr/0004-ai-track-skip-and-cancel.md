# ai-track 默认跳过；取消发版为一等命令

半自动编排默认不跑双轨研判（ai-track）；用户点名或 freeze 标高噪声时再启用。未 seal 的进行中目录包支持正式 `cancel`（删包 + 清索引），与 seal/archive 区分，并配合「同日一包」避免半截包挡新版。

**Status**: accepted

**Considered Options**:
- 编排默认跑 ai-track、空则 skip → 拒绝（拉长直达 WritePlan 路径）
- 取消只靠手册手工删 → 拒绝（sms-ai 已有整夹清除先例，易残留）

**Consequences**:
- prepare 编排步骤不含 ai-track，除非显式打开
- 需 `release.mjs cancel`（或等价）与索引对账；取消 ≠ seal
