# fill-morph（形态诊断）

## Done

1. 已跑 `scripts/fill-score.mjs --root <TARGET> --focus morph`（JSON 完整；摘要偏形态）
2. 中文摘要含：**形态** overall / 域分 / ceiling / template_completeness
3. 【推荐】`fill-report-html` 已写出；用户焦点 = **诊断台**

只看形态（像不像模板 / 是否贴顶）。开干 → [fill-gate.md](fill-gate.md)；双轴 → [fill-score.md](fill-score.md)。

## 触发

- **形态诊断**（fill-morph / 形态分 / formula_ceiling / 贴顶）
- 用户说「分怎么不动」「像不像模板」

## 流水线

```
- [ ] 1 定根；读 meta / score-policy（形态轴不读 gate 作开干结论）
- [ ] 2 node scripts/fill-score.mjs --root <TARGET> --focus morph [--summary-only] [--output score-latest.json]
- [ ] 3 展示形态摘要（三词里的「形态」）
- [ ] 4 【推荐】fill-report-html → 打开报告「诊断台」
```

引擎与 [fill-score.md](fill-score.md) 相同；`--focus morph` 仅裁剪摘要字段。
