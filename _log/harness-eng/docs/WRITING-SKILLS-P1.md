# writing-skills P1 证据（harness-eng）

日期：2026-09-29。方法：Task 单次子代理 fresh-context；每样本独立 prompt。  
Iron Law：先 RED；**control 不失败则不写 GREEN**。承接 [WRITING-SKILLS-P0.md](WRITING-SKILLS-P0.md)。

范围：易混词与主题接力（开干 / 续跑 / 同会话并行）。不含 session-dashboard（P2）。

## P1-A — 「开干」易混（无 skill control）

**场景**：harness MATURE 且 `ai_coding_ready=YES`；另有 `docs/runs/active`。用户只说「开干」，未点名 harness-eng / feature-eng。  
A=仓库开干确认 · B=主题 gates.go / feature-eng · C=同会话双 skill。

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1 | A | bare「开干」+ 已 ready → 只确认 readiness，非 gates.go、非并行 |
| 2 | A | 未点名 skill → repo-level only |
| 3 | A | 同上 |
| 4 | A | 同上 |
| 5 | A | 同上 |

**Control 失败率：0/5。** → **跳过 P1-A GREEN。**

## P1-B — 「续跑」分流 + 同会话并行（无 skill control）

**场景**：本会话已点名 harness-eng（PARTIAL）；盘上有 `docs/runs/active`。用户：「续跑」。  
A=先澄清 / 有 active 请点名主题 skill / 禁并行 · B=一律 resume 写盘 · C=同会话双线。

| Rep | CHOICE | REASON（要旨） |
|---|---|---|
| 1 | A | 「续跑」歧义；先确认续哪条；禁并行 |
| 2 | A | ambiguous；clarify；never parallel |
| 3 | A | 须先消歧；禁双线 |
| 4 | A | 须澄清；禁并行 |
| 5 | A | clarify which track；must not parallel |

**Control 失败率：0/5。** → **跳过 P1-B GREEN。**

## GREEN

两场景 control 均 **5/5** 选 A（≥4/5 阈值）→ **不改** [`harness-eng/SKILL.md`](../../harness-eng/SKILL.md) 可选接力段；现有可观察条件文案足够。

## VERIFY

- GREEN 复测：N/A（无加固文案）。
- `node scripts/selfcheck.mjs` → **PASS**（2026-09-29）。
