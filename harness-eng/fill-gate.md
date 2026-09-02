# fill-gate（开干闸）

## Done

1. 已跑 `scripts/fill-score.mjs --root <TARGET> --focus gate`（JSON 完整；摘要偏开干）
2. 中文摘要含三词里的**开干** YES|NO，以及清单 / gate_profile / blockers / coverage_mode
3. 【推荐】`fill-report-html` 已写出；用户焦点 = **决策台** + 红项下一步

只看开干。形态 → [fill-morph.md](fill-morph.md)；双轴 → [fill-score.md](fill-score.md)。

## 触发

- **开干闸**（fill-gate / ai_coding_ready / gate_profile / 能否开干）
- 用户说「能不能开干」「gate 红项」「升 gold」

## 流水线

```
- [ ] 1 定根；读 score-policy（gate_profile / coverage_mode / gate.*）与 fill-plan
- [ ] 2 若未答过：确认 Q_GATE_PROFILE（【推荐】strict；贴顶后可选 gold）
- [ ] 3 node scripts/fill-score.mjs --root <TARGET> --focus gate [--summary-only] [--output score-latest.json]
- [ ] 4 展示开干 YES/NO + blockers；映射到 fill-plan / agents 下一步
- [ ] 5 【推荐】fill-report-html → 打开报告「决策台」
```

### gate_profile 速查

| 档 | 覆盖 | 形态地板 | 完成度 | TODO 扫面 | 金标 | 语义 |
|---|---|---|---|---|---|---|
| legacy | ready_coverage | — | — | — | — | 宽松 |
| strict【推荐】 | policy targets（常 0.8） | 60 | 可选 | truths | blockers≤0 | 宽松 |
| gold | **1.0**（code>0 域） | **90** | **≥95** | **harness_docs** | blockers≤0 且 **warnings≤0** | generic/unbound=0 且 tc≥95 |

阈值以目标仓 `score-policy.yaml` + `fill-score` 输出为准。

引擎与 [fill-score.md](fill-score.md) 相同；`--focus gate` 仅裁剪摘要字段。
