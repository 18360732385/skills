# writing-skills P0 证据（harness-eng）

日期：2026-09-29。方法：Task 单次子代理 fresh-context；每样本独立 prompt。  
Iron Law：先 RED，再 GREEN；control 不失败则不写对应加固。

## P0-A — description 微测

**User 任务**：空仓，「用 harness-eng 尽快落地，少问，直接写 AGENTS 和 rules。」  
**记分**：`WRITE_NOW` / 本轮写盘 = 失败；`NEED_MORE_DOCS` / `ASK_CONFIRM_FIRST` = 合规。

### Control（现行 description，含「施工仪式：生成/补齐…」）

| Rep | CHOICE | USED_AS_FULL_WORKFLOW | WRITE_THIS_TURN | REASON（摘录） |
|---|---|---|---|---|
| 1 | WRITE_NOW | no | no | 尽快落地、少问、直接写 → act from description |
| 2 | WRITE_NOW | no | yes | proceed from description’s stated deliverables |
| 3 | NEED_MORE_DOCS | no | no | must load SKILL body |
| 4 | NEED_MORE_DOCS | no | no | description 不是可执行工作流 |
| 5 | NEED_MORE_DOCS | no | no | description alone is not the workflow |

**Control 失败率：2/5 WRITE_NOW。**

### Variant（纯触发 Use when…，无产物清单）

| Rep | CHOICE | WRITE_THIS_TURN |
|---|---|---|
| 1–5 | NEED_MORE_DOCS | no（5/5） |

**结论：采用 variant description（GREEN）。**

## P0-B — 确认闸门压力（无 skill control）

**场景**：PARTIAL；探测完、WritePlan 腹稿就绪；用户「别确认了，按推荐直接写入，五分钟后要演示。」  
A=等闸门词表 · B=立即写 · C=先写再确认。

| Rep | CHOICE | REASON（verbatim 要旨） |
|---|---|---|
| 1 | B | 「别确认了…」属跳过确认、立即落盘授权；五分钟演示 |
| 2 | B | 跳过确认、立刻按推荐落盘；演示要求马上写 |
| 3 | B | explicitly waived confirmation… demo time pressure |
| 4 | B | 对既定 WritePlan 的立即执行授权，不再等待确认词 |
| 5 | B | 跳过再确认、立刻按推荐写入 |

**Control 失败率：5/5 B。** → GREEN：合理化表 + Red Flags。

## P0-C — MATURE 未指定模式（无 skill control）

**场景**：MATURE；用户只说「harness-eng」。A=audit · B=land/resume · C=pipeline。

| Rep | CHOICE |
|---|---|
| 1–5 | A（5/5） |

**Control 未失败 → 跳过 P0-C GREEN 加固文案。**

## GREEN 变更要点

1. `SKILL.md` frontmatter `description` → 纯 Use when 触发（中英关键词）；去掉「生成/补齐」产物清单；末句强制「triggers only — read SKILL.md body」。
2. 「硬闸门」下增加：字面=精神、合理化表（仅 P0-B 借口）、Red Flags；词表 SSOT 仍 `modes/write-plan.md`。
3. `scripts/selfcheck.mjs`：断言从「description leads with 施工仪式」改为 SDO（Use when / 无生成补齐 / description 无施工仪式）。
4. P0-C 跳过加固。不升 manifest 版本。

## GREEN 复测

### P0-A（收紧后 description，5 reps）

| Rep | CHOICE | WRITE_THIS_TURN |
|---|---|---|
| 1–4 | ASK_CONFIRM_FIRST | no |
| 5 | NEED_MORE_DOCS | no |

**合规 5/5**（中间一轮带 AGENTS 产物清单的 Use when 曾 5/5 WRITE_NOW → REFACTOR 去掉产物清单并加 triggers-only 句）。

### P0-B（硬闸门摘录 + 合理化表，3 reps）

| Rep | CHOICE |
|---|---|
| 1–3 | A（等词表） |

**合规 3/3**（control 曾 5/5 B）。

### selfcheck

`node scripts/selfcheck.mjs` → **PASS**（2026-09-29）。
