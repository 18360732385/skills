# gates-common — 各环硬闸

> 闸概念聚拢：绑定闸定义在 [binding.md](binding.md)（lookup 缺失/未安装 → 阻断）；本页收其余各闸。每闸 = **通过条件** + **失败时行为**。  
> **L1** 形状：[artifacts.md](artifacts.md)；**L2** 语义：[gates-review.md](gates-review.md)。advance 适用时须 L1∧L2；用户硬闸另需短确认卡片。控制器只校验/调度、不代做领域工作、**不替用户 yes**。

## 用户硬闸短确认卡片（模板）

凡需用户显式确认的闸，贴出后等待，不得静默通过：

```text
【硬闸确认 · <闸名>】
依据：…
请回复：确认 / 返工：…
```

进入下一环且 `handoff_policy=confirm` 时，用同款短卡片（「进入〈中文名〉…」）。

## 分诊闸（环 0）

- 通过：Agent 提议 S/B/F 并给依据；用户显式确认其一（短确认卡片）。
- 失败：停在 start；不得创建 `runs/` 下游产物。

## 共享理解闸（环 1 末）

- 通过：L1+L2（离开 grill）过；用户显式确认可进设计（同义可）；advance 写 `gates.shared_understanding`。
- 失败：继续澄清；不得进环 2。
- `express`：可与设计确认闸合并为**一次总 yes**（同时写两闸时间戳）；仍须用户显式确认，不得默认静默通过。

## 设计确认闸（环 2 末）

- 通过：L1+L2（离开 design）过；B = 短设计获用户显式 yes；F = 整体或每段 yes；`express` = 与 grill 合并的一次总 yes。advance 写 `gates.design_confirmed`。
- 失败：回到设计；不得进定稿桥 / spec。
- 通过后 → 跑 [domain-bridge.md](domain-bridge.md)（默认常 skipped，再进 spec 或 domain）。

## 定稿桥（环 2→3）

- 规则见 [domain-bridge.md](domain-bridge.md)；桥本身不写 ADR，只决定 `domain=skipped|skipped_by_user|entered`（展示结论可推翻）。结束后按 `handoff_policy` 主动进下一环。

## 开干闸（环 5 末，计划侧）

- 通过：L1+L2（离开 plan）过；三问语义成立：①任务依赖无环 ②契约变更已列入首批 ③每任务有可测验收；用户短确认（若尚未在 plan 审中显式 yes）。
- 失败：补 plan；不得进 Proto 桥。

## Proto 桥（环 5→6）

- 规则见 [proto-bridge.md](proto-bridge.md)；决定 `proto=*`（展示结论可推翻；需 UI 须显式同意）。结束后按 `handoff_policy` 主动进下一环。

## Pre-Impl 闸（环 7b）

- F 通过：artifacts 中 proto（若 entered）与 testdesign 两节 L1 勾选全过；testdesign/proto 适用时 L2 已过。
- B 通过：proto（若 entered）勾选全过；**无** TestDesign 要求。
- 失败：停；按勾选表列缺失项；不得进环 8。
- 通过后按 `handoff_policy` 主动调起 implement。

## Gate 闸（环 9）

- 通过：artifacts gate 节 L1 全过 + L2（离开 gate）过（机械轨 + 语义轨无未决 blocker）。
- 失败：回环 8 修；不得进环 10 / 10′。

## Verify 闸（环 10，仅 F）

- 通过：artifacts verify 节 L1 全过 + L2（离开 verify）过（含每条用例结论与残留规则）。
- 失败：进环 10b 排障（先复现再改），修完回本环复测失败项。

## Close 闸（环 11）

- 通过条件正文见 [close.md](close.md)（skill 内收口规则；契约目录 / pitfalls lint 为可选增强）。
- 失败：列缺项；不得宣称交付。
