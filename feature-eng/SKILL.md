---
name: feature-eng
description: >-
  开发流程控制器：分诊 S/B/F · 按环节调度已绑定子 skill · 维护 runs 进度 · 验产物过闸。
  本身不做具体开发工作。仅用户点名使用。
disable-model-invocation: true
---

# feature-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。

Skill = **开发流程仪式（控制器）**。流程定稿见 [stages.md](stages.md)；产物形状见 [artifacts.md](artifacts.md)（L1）；环间语义见 [gates-review.md](gates-review.md)（L2）；环节与 skill **解耦**，运行时只读 [config/stage-bindings.yaml](config/stage-bindings.yaml)（init/rebind **首问**可改；见 [binding.md](binding.md)）。过程态在 `docs/superpowers/runs/<slug>/`（非契约 SSOT）。对用户优先中文。

## 控制器边界（最高优先级）

一句话：**调度员不进厨房**——feature-eng 是调度员，子 skill 是厨师。各模式文件的越界判定均回本节，不各自复述。

只做：分诊与下一环判断；维护 `progress.yaml` / `links.md`；L1 勾选 + 调度 L2 审核；按 `invoke` **主动**调起绑定 skill（只传指针与截断）；子 skill 结束后 advance；按 `handoff_policy` 过闸后主动进下一环；init/rebind **首问**展示中文名推荐包表并写用户所选绑定；`start` 首问可定 `run_mode` / `invoke` / `handoff_policy` / `review_policy`；跑 domain-bridge / proto-bridge。

### 写盘权责（SSOT）

| 谁 | 可写 | 不可写 |
|---|---|---|
| **控制器**（start / advance / close / handoff / proto-bridge / domain-bridge） | `progress.yaml`、`links.md`、runs 模板骨架、`handoff.md`、gates 时间戳、`artifacts.*` 指针字段 | 领域产物正文、业务代码、仓库根 `CONTEXT.md` |
| **子 skill（厨师）** | ADR / Spec / Plan / 原型 / testcases / `context-delta.md` / 代码 / 单测等**领域文件** | `progress.yaml`、`links.md`、gates 时间戳、仓库根 `CONTEXT.md`（主题术语） |
| **L2 审核（子代理或审核帽）** | 仅 `runs/<slug>/review-<stage>.md` | `progress.yaml`、`links.md`、领域正文、业务代码 |

子 skill 结束标准：回报**产物路径列表**；真正 ✓/✗ 与回写 progress/links **仅 advance**（含 L1∧L2）。审核员不得推进 stage。

硬轨（不可改写为正述时保留）：改业务代码或子 skill 领域产物正文；跳过硬闸或伪造产物/L2 勾选；未完成首问就写盘/改绑；**子 skill / 审核员代写 `progress.yaml` / `links.md`**；**替用户 yes 硬闸**。

说明：对 `brainstorming`（design/spec）传入「截断到本环」是控制器职责（传指针与截断），见 [binding.md](binding.md)。自动调起 ≠ 跳过硬闸。

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
| 定稿桥 | 设计确认闸刚过 | [domain-bridge.md](domain-bridge.md) |
| Proto 桥 | 环 5 结束 | [proto-bridge.md](proto-bridge.md) |
| 环间 L1 | advance | [artifacts.md](artifacts.md) |
| 环间 L2 | advance | [gates-review.md](gates-review.md) |
| Pre-Impl 闸 | 进实现前 | [gates-common.md](gates-common.md) |
| Verify 闸（仅 F） | 环 10 末 | [gates-common.md](gates-common.md) |
| Close 闸 | 环 11 | [close.md](close.md) |

闸不过：停并列缺失项。硬轨见上节。

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 环节表 / S·B·F 裁剪 | [stages.md](stages.md) |
| 当前环产物勾选（L1） | [artifacts.md](artifacts.md)（只读当前 stage 节） |
| 环间语义审核（L2） | [gates-review.md](gates-review.md) |
| 各环硬闸通过条件 / 短确认卡片 | [gates-common.md](gates-common.md) |
| 2→3 定稿自判（可推翻） | [domain-bridge.md](domain-bridge.md) |
| 5→6 Proto 自判（可推翻） | [proto-bridge.md](proto-bridge.md) |
| 绑定 lookup / 主动调起 / `invoke` / `handoff_policy` / 指针卡片 | [binding.md](binding.md) |
| 会话过长 / 中断续跑 | [handoff.md](handoff.md) |
| 进度 / 回链 / 用例 / 报告格式 | `templates/`（progress.yaml · links.md · testcases.md · test-report.md） |
| 追溯设计依据（默认勿打开） | [docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md](../../../docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md) |
