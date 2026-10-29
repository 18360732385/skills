# writing-skills P1 证据（feature-eng）

日期：2026-09-29。方法：Task 单次子代理 fresh-context；每样本独立 prompt。  
Iron Law：先 RED；**control 不失败则不写 GREEN**。承接 [WRITING-SKILLS-P0.md](WRITING-SKILLS-P0.md)。  
对称档案：[harness-eng WRITING-SKILLS-P1](../../harness-eng/docs/WRITING-SKILLS-P1.md)（仓库侧同题）。

范围：主题侧易混词与工程化接力（开干 / 续跑+顺便 harness / 同会话并行）。不含 description SDO、闸门演剧（见 P0）。

## P1-A — 「开干」易混（无 skill control）

**场景**：本会话已点名 feature-eng；active 在 plan 待 Go；仓上 `ai_coding_ready=YES`。用户只说「开干」。  
A=主题计划 Go / 推进本 run · B=转 harness 仓库开干/land · C=同会话双线。

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1 | A | 中途主题 + plan 待 Go →「开干」= plan-Go，非 harness |
| 2 | A | 已在活跃主题上等 Go，非 pivot |
| 3 | A | 同上；与 harness 轨分离 |
| 4 | A | harness 已 ready，更非 pivot |
| 5 | A | bare「开干」= 本主题 Go，非双轨 |

**Control 失败率：0/5。** → **跳过 P1-A GREEN。**

## P1-B — 「续跑，顺便 harness」+ 同会话并行（无 skill control）

**场景**：本会话已点名 feature-eng；有未完成 `docs/runs/active`；盘上 harness PARTIAL。用户：「续跑，顺便把 harness 也补上」。  
A=本会话只续主题；harness 请新会话；禁并行 · B=同会话双线 · C=本会话改去做 harness。

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1 | A | 会话已绑主题；harness 另开，避免混轨 |
| 2 | A | 同上 |
| 3 | A | harness PARTIAL 过重，不能当同会话顺便 |
| 4 | A | 同上 |
| 5 | A |「续跑」主轨是主题；「顺便」不授权并行 |

**Control 失败率：0/5。** → **跳过 P1-B GREEN。**

## GREEN

两场景 control 均 **5/5** 选 A（≥4/5 频率）→ **不改** [`feature-eng/SKILL.md`](../../../feature-eng/SKILL.md)「可选接力（工程化仓）」；现行「同会话勿并行 / 续跑≠工程化续跑 / 计划 Go≠仓库开干」足够。

## 与 harness P1 对照

| 侧 | 开干 bare | 续跑歧义/并行 |
|---|---|---|
| harness-eng P1 | control 0/5 失败 | control 0/5 失败 |
| feature-eng P1（本档） | control 0/5 失败 | control 0/5 失败 |

双边均未在无 skill 下暴露失败 → 接力消歧文案属**预防性对齐**，本轮不追加禁止清单。

## VERIFY

- GREEN 复测：N/A。
- 本轮未改热路径；P0 结论不变。
