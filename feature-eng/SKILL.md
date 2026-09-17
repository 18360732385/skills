---
name: feature-eng
description: >-
  开发流程控制器：分诊 S/B/F · 按环节调度已绑定子 skill · 维护 runs 进度 · 验产物过闸。
  本身不做具体开发工作。仅用户点名使用。
disable-model-invocation: true
---

# feature-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。

Skill = **开发流程仪式（控制器）**。流程定稿见 [stages.md](stages.md)；产物校验见 [artifacts.md](artifacts.md)；环节与 skill **解耦**，运行时只读 [config/stage-bindings.yaml](config/stage-bindings.yaml)（init/rebind **首问**可改；见 [binding.md](binding.md)）。过程态在 `docs/superpowers/runs/<slug>/`（非契约 SSOT）。对用户优先中文。

## 控制器边界（最高优先级）

一句话：**调度员不进厨房**——feature-eng 是调度员，子 skill 是厨师。各模式文件的越界判定均回本节，不各自复述。

只做：分诊与下一环判断；维护 `progress.yaml` / `links.md`；按 [artifacts.md](artifacts.md) 当前环勾选表验产物；按 `invoke` 策略调起绑定 skill（只传指针与截断）；子 skill 结束后 advance；init/rebind **首问**展示推荐包并写用户所选绑定；`start` 首问可定 `run_mode` / `invoke`。

### 写盘权责（SSOT）

| 谁 | 可写 | 不可写 |
|---|---|---|
| **控制器**（start / advance / close / handoff / proto-bridge） | `progress.yaml`、`links.md`、runs 模板骨架、`handoff.md`、gates 时间戳、`artifacts.*` 指针字段 | 领域产物正文、业务代码 |
| **子 skill（厨师）** | ADR / Spec / Plan / 原型 / testcases / 代码 / 单测等**领域文件** | `progress.yaml`、`links.md`、gates 时间戳 |

子 skill 结束标准：回报**产物路径列表**（可选自检建议）；真正 ✓/✗ 与回写 progress/links **仅 advance**（或 start/close/handoff/proto-bridge 自有步骤）。

硬轨（不可改写为正述时保留）：改业务代码或子 skill 领域产物正文；跳过硬闸或伪造产物勾选；未完成首问就写盘/改绑；**子 skill 代写 `progress.yaml` / `links.md`**。

说明：对 `brainstorming`（design/spec）传入「截断到本环」是控制器职责（传指针与截断），见 [binding.md](binding.md)。

## 模式分流

人侧记住四类：`start` · `resume` · `close` · `init`/`rebind`。

| 意图 | 模式 | Read |
|---|---|---|
| 首次使用 / 初始化绑定 | `init` | [init.md](init.md) |
| 改环节↔skill 映射 | `rebind` | [rebind.md](rebind.md) |
| 新主题开工 | `start` | [start.md](start.md) |
| 续跑进行中主题 | `resume` | [resume.md](resume.md) |
| 收口归档 | `close` | [close.md](close.md) |

`start`/`resume` 之后用户声称当前环完成 → Read [advance.md](advance.md)（不必点名 `advance`）。  
未指定：无 `config/stage-bindings.yaml` → `init`；有未完成 `runs/` → [status.md](status.md)；否则问用户（`start` 还是 `init`）。点名 `status`/`advance` 仍走对应文件。

## 硬闸（闸名索引；通过条件正文只活在指针文件）

| 闸 | 触发时机 | 正文 |
|---|---|---|
| 绑定闸 | 需子 skill 的环节调起前 | [binding.md](binding.md) |
| 分诊闸 | `start` | [gates-common.md](gates-common.md) |
| Proto 桥 | 环 5 结束 | [proto-bridge.md](proto-bridge.md) |
| Pre-Impl 闸 | 进实现前 | [gates-common.md](gates-common.md) |
| Verify 闸（仅 F） | 环 10 末 | [gates-common.md](gates-common.md) |
| Close 闸 | 环 11 | [close.md](close.md) |

闸不过：停并列缺失项。硬轨见上节（跳过闸 / 伪造勾选）。

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 环节表 / S·B·F 裁剪 | [stages.md](stages.md) |
| 当前环产物勾选 | [artifacts.md](artifacts.md)（只读当前 stage 节） |
| 各环硬闸通过条件 | [gates-common.md](gates-common.md) |
| 5→6 Proto 自判与询问 | [proto-bridge.md](proto-bridge.md) |
| 绑定 lookup / 推荐包 / 截断 / `invoke` / 指针卡片 | [binding.md](binding.md) |
| 会话过长 / 中断续跑 | [handoff.md](handoff.md) |
| 进度 / 回链 / 用例 / 报告格式 | `templates/`（progress.yaml · links.md · testcases.md · test-report.md） |
| 追溯设计依据（默认勿打开） | [docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md](../../../docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md) |
