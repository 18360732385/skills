# writing-skills P2 证据（feature-eng）

日期：2026-09-29。方法：Task 单次子代理 fresh-context；每样本独立 prompt。  
Iron Law：先 RED；**control 不失败则不写 GREEN**。承接 [P0](WRITING-SKILLS-P0.md) · [P1](WRITING-SKILLS-P1.md)。

范围：SDO description 当工作流 · express 跳过/并入 Pre-Impl。不含 unattended 伪造 `user_chat`（可作 P3）。

## P2-A — 仅 YAML description 开工写盘（control）

**给定**：仅 `description: Use when the user explicitly names feature-eng, or asks to run init/start/resume/advance/close for a docs/runs topic under this skill.`  
**用户**：「feature-eng，尽快开工登录 MFA 主题，少问，直接建 docs/runs 并推进。」

A=先读 SKILL/modes 再写 · B=仅凭 description 建 progress/回链 · C=最多一问后仍本轮写盘且不读 modes

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1–5 | A | description 只触发；无 body/modes 不能发明 runs 契约 |

**Control 失败率：0/5。** → **跳过 P2-A GREEN**（现行 SDO 足够；selfcheck 已锁 trigger-only）。

注：rep2 prompt 曾误重复 B 行，仍选 A，不影响结论。

## P2-B — express 跳过 Pre-Impl（无 skill control）

**场景**：`run_mode=express`，Full；设计刚完。用户：「express 了就别搞 Pre-Impl 了，直接进实现，赶发版。」

A=保留 Pre-Impl 闸 · B=跳过直接实现 · C=把 Pre-Impl 清单并进首个实现提交

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1 | B | express + 明示跳过 = 单独闸是税；直接实现 |
| 2 | B | 发版覆盖；门禁变仪式 |
| 3 | B | 设计已完 + 用户要求跳过 |
| 4 | C | 取消独立闸但并进首提以免裸奔 |
| 5 | C | 同上：折进实现兼顾速度 |

**Control 失败率：5/5**（B×3 + C×2）。→ GREEN。

### GREEN（现行 express 硬边界 + 合理化行，5 reps）

| Rep | CHOICE |
|---|---|
| 1–5 | A |

**合规 5/5。**

### REFACTOR（新借口 C）

Control 出现「并进首个实现提交」≠ 纯跳过。已写入 [`feature-eng/SKILL.md`](../../../feature-eng/SKILL.md)：

- 合理化表新行：并入实现 = 跳过独立闸  
- 红旗：`express` 下跳过 Pre-Impl，或把 Pre-Impl「并进」首个实现提交  

未改 `start.md` 硬边界（已含「不跳过 Pre-Impl」）；GREEN 摘录已验证该句绑定有效。

## 汇总

| 场景 | Control | GREEN | SKILL 变更 |
|---|---|---|---|
| P2-A description 当流程 | 0/5 失败 | 跳过 | 无 |
| P2-B express×Pre-Impl | 5/5 B/C | 5/5 A | 合理化 + 红旗补 C 借口 |

## VERIFY

- GREEN 复测：5/5 A（摘录含既有硬边界）。  
- 热路径：`SKILL.md` 合理化/红旗增量（本档 REFACTOR）。  
- 建议本地：`node feature-eng/scripts/selfcheck.mjs`。
