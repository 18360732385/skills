# gates-common — 各环硬闸

> 闸概念聚拢：绑定闸定义在 [binding.md](binding.md)（lookup 缺失/未安装 → 阻断）；本页收其余各闸。每闸 = **通过条件** + **失败时行为**。控制器只校验、不代做。

## 分诊闸（环 0）

- 通过：Agent 提议 S/B/F 并给依据；用户显式确认其一。
- 失败：停在 start；不得创建 `runs/` 下游产物。

## 共享理解闸（环 1 末）

- 通过：用户显式确认可进设计（同义表述可接受）；advance 写 `gates.shared_understanding` 时间戳。
- 失败：继续澄清；不得进环 2。
- `express`：可与设计确认闸合并为**一次总 yes**（同时写两闸时间戳）；仍须用户显式确认，不得默认静默通过。

## 设计确认闸（环 2 末）

- 通过：B = 短设计获用户显式 yes；F = 整体方案获用户显式 yes，或分段清单**每一段**获 yes；`express` = 与 grill 合并的一次总 yes。advance 写 `gates.design_confirmed` 时间戳。
- 失败：回到设计；不得进环 3/4。

## 开干闸（环 5 末，计划侧）

- 通过（三问全过）：①任务依赖无环 ②契约变更（types/api-client/docs/api 等）已列入首批任务 ③每任务有可测验收。
- 失败：补 plan；不得进 Proto 桥。

## Proto 桥（环 5→6）

- 规则见 [proto-bridge.md](proto-bridge.md)；桥本身不写码，只决定 `proto=skipped|skipped_by_user|entered`（含跨仓前端提示）。

## Pre-Impl 闸（环 7b）

- F 通过：[artifacts.md](artifacts.md) 中 proto（若 entered）与 testdesign 两节勾选全过。
- B 通过：proto（若 entered）勾选全过；**无** TestDesign 要求。
- 失败：停；按勾选表列缺失项；不得进环 8。

## Gate 闸（环 9）

- 通过：[artifacts.md](artifacts.md) gate 节勾选全过（机械轨 + 语义轨无未决 blocker）。
- 失败：回环 8 修；不得进环 10 / 10′。

## Verify 闸（环 10，仅 F）

- 通过：[artifacts.md](artifacts.md) verify 节勾选全过（含每条用例结论与残留规则）。
- 失败：进环 10b 排障（先复现再改），修完回本环复测失败项。

## Close 闸（环 11）

- 通过条件正文见 [close.md](close.md)（skill 内收口规则；契约目录 / pitfalls lint 为可选增强）。
- 失败：列缺项；不得宣称交付。
