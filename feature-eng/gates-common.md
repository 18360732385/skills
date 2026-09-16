# gates-common — 各环硬闸

> 闸概念聚拢：绑定闸定义在 [binding.md](binding.md)（lookup 缺失/未安装 → 阻断）；本页收其余各闸。每闸 = **通过条件** + **失败时行为**。控制器只校验、不代做。

## 分诊闸（环 0）

- 通过：Agent 提议 S/B/F 并给依据；用户显式确认其一。
- 失败：停在 start；不得创建 `runs/` 下游产物。

## 共享理解闸（环 1 末）

- 通过：grill 类 skill 自认 frontier 已空，且用户确认达成共享理解。
- 失败：继续澄清；不得进环 2。

## 设计确认闸（环 2 末）

- 通过：F 为分段确认完成；B 为短设计获用户显式 yes。
- 失败：回到设计；不得进环 3/4。

## 开干闸（环 5 末，计划侧）

- 通过（三问全过）：①任务依赖无环 ②契约变更（types/api-client/docs/api 等）已列入首批任务 ③每任务有可测验收。
- 失败：补 plan；不得进 Proto 桥。

## Proto 桥（环 5→6）

- 规则见 [proto-bridge.md](proto-bridge.md)；桥本身不写码，只决定 `proto=skipped|skipped_by_user|entered`。

## Pre-Impl 闸（环 7b）

- F 通过：Proto（若 entered）已获用户确认 **且** `testcases.md` 已落盘并覆盖验收项。
- B 通过：Proto 规则同上；**无** TestDesign 要求。
- 失败：停；列缺失产物；不得进环 8。

## Gate 闸（环 9）

- 通过：机械轨（仓库 hooks：SQL/收口/契约软提醒）已处理；语义轨（绑定 review skill）对照 Spec/短设计验收无未决 blocker。
- 失败：回环 8 修；不得进环 10 / 10′。

## Verify 闸（环 10，仅 F）

- 通过：`test-report.md` 每条用例有 `pass|fail|blocked` 结论；无 `fail`，或用户显式接受残留并记入 progress。
- 失败：进环 10b 排障（先复现再改），修完回本环复测失败项。

## Close 闸（环 11）

- 通过条件正文见 [close.md](close.md)（skill 内收口规则；契约目录 / pitfalls lint 为可选增强）。
- 失败：列缺项；不得宣称交付。
