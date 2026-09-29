# writing-skills P2 证据（harness-eng）

日期：2026-09-29。方法：Task 单次子代理 fresh-context。  
Iron Law：先 RED；control 不失败则不写对应 GREEN。承接 P0/P1。

范围：会话仪表盘 SHOW/HIDE 形状（正向 recipe，不堆「不要附」）。

## P2-A — 提问轮应 HIDE（无 dashboard 规格 control）

| Rep | CHOICE |
|---|---|
| 1–5 | A HIDE（5/5） |

**失败率 0/5 → 跳过 P2-A GREEN。**

## P2-B — 等确认 / 只问版本应 HIDE

| Rep | CHOICE |
|---|---|
| 1–5 | A HIDE（5/5） |

**失败率 0/5 → 跳过 P2-B GREEN。**

## P2-C — 出示 WritePlan 应 SHOW

借口模式（verbatim）：「等用户确认后再附」。

| Rep | CHOICE |
|---|---|
| 1–5 | C HIDE（5/5） |

**失败率 5/5 → GREEN：闸门决策点合同（出示 WritePlan ⇒ SHOW）。**

## GREEN 变更

1. [`modes/session-dashboard.md`](../../harness-eng/modes/session-dashboard.md)：SHOW 闸门决策点拆成可观察谓词 + 合同句「出示轮即决策点」；边角表注明即使尚未写盘/未确认仍 SHOW。
2. [`SKILL.md`](../../harness-eng/SKILL.md) 流程 §6：先判 SHOW|HIDE 合同；示例含「出示 WritePlan（不必等确认/写盘）」。不复述 HIDE 禁令列表。
3. [`scripts/lib/selfcheck/checks-0.5.mjs`](../../harness-eng/scripts/lib/selfcheck/checks-0.5.mjs)：断言对齐新措辞（实质产出 + 闸门决策 + SHOW|HIDE）。

## GREEN 复测（P2-C + recipe 摘录）

| Rep | CHOICE |
|---|---|
| 1–3 | A SHOW（3/3） |

## VERIFY

`node scripts/selfcheck.mjs` → **PASS**（2026-09-29）。
