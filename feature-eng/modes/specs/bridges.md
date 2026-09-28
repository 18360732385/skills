# bridges — 定稿桥与 Proto 桥

定稿桥 + Proto 桥（原 domain-bridge.md + proto-bridge.md）。绑定 lookup 见 [flow.md](flow.md)；校验见 [gates.md](gates.md)。

## Part A — domain-bridge（环 2→3）


**仅控制器执行**，在设计确认闸通过之后、进入 domain / spec（或 B 的后续环）之前运行。

目标：多数主题**跳过**定稿环，F 默认 **design → spec**；仅在有不可逆决策 / 新子域 / 公共契约边界时才进入 `domain`。

## 步骤

1. **自判**：读设计确认摘要 / `设计笔记.md` / 聊天已确认方案，是否含以下任一：
   - 不可逆架构或产品决策（值得独立 ADR）
   - 新子域 / **新限界上下文**
   - **破坏性变更**（含破坏兼容的公共契约）、**跨模块共享模型**、跨模块术语边界
   - **默认 skipped（不进定稿）**：仅新增 REST/接口且目标仓已有 `docs/api`（或存在契约同步脚本/管线信号）→ 由契约同步覆盖，不因「改了 API」单独进 `domain`
2. **始终展示结论块**：
   ```text
   【定稿桥结论】
   - 需要独立定稿（ADR / 术语增量）：是 | 否
   - 依据：…
   - 建议：skipped | entered（待确认）
   - 推翻方式：说「要进定稿」或「确认跳过定稿」
   ```
3. **按结论采纳（可推翻）**：
   - **不需要**：默认写 `domain=skipped`（progress / `回链.md` 一句理由）→ **不问**二选一 → 下一环：
     - F → `spec`
     - B（无 spec）→ 按裁剪表进 plan 或后续
     - 提示「无异议则继续；若要写 ADR/术语定稿请说」
     - 随后按 `progress.handoff_policy`：**auto** 则立即 [flow.md](flow.md) lookup 下一需 skill 的环；**confirm** 则短确认后再调起
   - **需要**：结论块后 **必须**用户显式同意才 `domain=entered` → **主动** lookup 调起 `domain` 绑定 skill（不要求用户手切）。
     - 用户否 → `domain=skipped_by_user` → 同上「下一环」+ handoff_policy
     - 用户是 → `domain=entered` → 调起后按 advance（L1+L2）校验，再进 spec（F）或后续
4. express：同样跑本桥；默认仍常 `skipped`，除非自判「需要」且用户确认。

## 产物落点（进入 domain 时告知厨师）

- ADR → `docs/adr/`
- 术语增量 → `docs/runs/active/<slug>/术语增量.md`（或 Spec 术语小节）
- **禁止**写入仓库根 `CONTEXT.md`

## 硬约束

- 自判「不需要」时禁止强制「是否跳过定稿」二选一；必须展示结论并可推翻。
- 自判「需要」时禁止静默 `entered`。
- 控制器不代写 ADR / `术语增量.md` 正文。
- 只写 `progress.domain` 与 `回链.md` 理由；不写领域正文。


---

## Part B — proto-bridge（环 5→6）


**仅控制器执行**，在 Plan（或 B 的 checklist）过**计划 Go 闸**之后、进入环 7/7b 之前运行。

## 步骤

1. **自判**：读 Spec/短设计/Plan 任务，是否含以下任一：
   - 新页面 / 新前端路由
   - 改布局、改主交互流程
   - 改前端组件呈现或视觉
2. **跨仓前端**（补充自判，不改变「本仓是否进环 6」的主结论）：
   - 若 Spec/Plan 写了菜单、页面、路由或权限可见性，但**本仓无明显前端树**（无典型 `src` 前端应用、无 UI 包、团队约定「前端另仓」）→ 倾向本仓 `skipped`，理由须含跨仓提示（禁止静默假装 UI 已覆盖）。
   - 菜单 DML / 后端权限码 alone **不**构成「本仓需要原型」。
3. **边界模糊**（标记，不强制硬问）：仅有菜单 DML、或 Spec 提了页面但本仓无前端 → 结论块标「边界模糊」；默认 `skipped` + 跨仓提示（若适用），用户可推翻。
4. **始终展示结论块**（再推进）：
   ```text
   【Proto 桥结论】
   - 本仓需要原型：是 | 否
   - 边界模糊：是 | 否
   - 依据：…
   - 建议：skipped | entered（待确认）
   - 跨仓提示：（若有）前端仓另开 feature-eng 主题…
   - 推翻方式：说「要进原型」或「确认跳过原型」
   ```
5. **按结论采纳（可推翻）**：
   - **不需要（本仓）**：默认写 `proto=skipped`（附理由；含跨仓/边界模糊若适用）→ 提示「无异议则进测设/Pre-Impl；若要进原型请说」→ **不**强制「是否跳过？」二选一。用户说要进 → 改按「需要」走步骤 6。无异议则按 `handoff_policy` 主动进下一环（F→testdesign；B→pre-impl）。
   - **需要（本仓）**：结论块展示后 **必须**等用户显式同意才写 `proto=entered`（避免误进原型环）。
     - 用户否 / 强制跳过 → `proto=skipped_by_user`（可带风险备注）→ 按 `handoff_policy` 进下一环
     - 用户是 → `proto=entered` → 步骤 6
6. **主动调起原型 skill**：按 [flow.md](flow.md) lookup（控制器主动；不要求用户手切）。未绑 → 推荐 1～3 个候选（首选 `prototype`）由用户点名（可顺手 rebind）。
7. 子 skill 结束后走 [advance.md](../advance.md)（L1+L2）；通过后按 `handoff_policy` 进测设/Pre-Impl。


## 绑定缺失时的轻量契约（O12）

步骤 6 若 `stages.proto.skill` 为 `null`，或宿主不可调起且已 `chef_mode=controller_proxy`：

1. **不要**空等可点击 HTML 原型。
2. 按 [flow.md](flow.md)「Proto 轻量降级」落盘 `设计笔记.md`：交互草图 + 主路径 3 步 + 状态机。
3. advance 校验走 [gates.md](gates.md) proto「轻量降级」勾选与 [gates.md](gates.md) O12。
4. 仍须用户「原型确认」（对草图确认即可）。

## 硬约束

- 自判「本仓不需要」时：**禁止**强制二选一「是否跳过」；**必须**展示结论块并允许推翻；**允许**一句跨仓提示。
- 自判「本仓需要」时：**禁止**静默 `entered`；须用户显式同意。
- 控制器**不**代画原型、不改子 skill 输出。
- S 路径不运行本桥。
- 只改 `progress.proto` 与理由字段/links 一句；不写领域正文。
