# domain-bridge — 环 2→3 定稿分诊桥

**仅控制器执行**，在设计确认闸通过之后、进入 domain / spec（或 B 的后续环）之前运行。

目标：多数主题**跳过**定稿环，F 默认 **design → spec**；仅在有不可逆决策 / 新子域 / 公共契约边界时才进入 `domain`。

## 步骤

1. **自判**：读设计确认摘要 / `design-notes.md` / 聊天已确认方案，是否含以下任一：
   - 不可逆架构或产品决策（值得独立 ADR）
   - 新子域 / 新限界上下文
   - 改公共契约、共享模型或跨模块术语边界
2. **始终展示结论块**：
   ```text
   【定稿桥结论】
   - 需要独立定稿（ADR / 术语增量）：是 | 否
   - 依据：…
   - 建议：skipped | entered（待确认）
   - 推翻方式：说「要进定稿」或「确认跳过定稿」
   ```
3. **按结论采纳（可推翻）**：
   - **不需要**：默认写 `domain=skipped`（progress / links 一句理由）→ **不问**二选一 → 下一环：
     - F → `spec`
     - B（无 spec）→ 按裁剪表进 plan 或后续
     - 提示「无异议则继续；若要写 ADR/术语定稿请说」
     - 随后按 `progress.handoff_policy`：**auto** 则立即 [binding.md](binding.md) lookup 下一需 skill 的环；**confirm** 则短确认后再调起
   - **需要**：结论块后 **必须**用户显式同意才 `domain=entered` → **主动** lookup 调起 `domain` 绑定 skill（不要求用户手切）。
     - 用户否 → `domain=skipped_by_user` → 同上「下一环」+ handoff_policy
     - 用户是 → `domain=entered` → 调起后按 advance（L1+L2）校验，再进 spec（F）或后续
4. express：同样跑本桥；默认仍常 `skipped`，除非自判「需要」且用户确认。

## 产物落点（进入 domain 时告知厨师）

- ADR → `docs/adr/`
- 术语增量 → `docs/superpowers/runs/<slug>/context-delta.md`（或 Spec 术语小节）
- **禁止**写入仓库根 `CONTEXT.md`

## 硬约束

- 自判「不需要」时禁止强制「是否跳过定稿」二选一；必须展示结论并可推翻。
- 自判「需要」时禁止静默 `entered`。
- 控制器不代写 ADR / context-delta 正文。
- 只写 `progress.domain` 与 links 理由；不写领域正文。
