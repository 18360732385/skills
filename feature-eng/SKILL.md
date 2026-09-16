---
name: feature-eng
description: >-
  开发流程控制器：分诊 S/B/F · 按环节调度已绑定子 skill · 维护 runs 进度 · 验产物过闸。
  本身不做具体开发工作。仅用户点名使用。
disable-model-invocation: true
---

# feature-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。

Skill = **开发流程仪式（控制器）**。流程定稿与产物契约见 [stages.md](stages.md)；环节与 skill **解耦**，运行时只读 [config/stage-bindings.yaml](config/stage-bindings.yaml)（值为**推荐选用结果**，init/rebind 首问可改）。过程态在 `docs/superpowers/runs/<slug>/`（非契约 SSOT）。对用户优先中文。

## 控制器边界（最高优先级）

一句话：**调度员不进厨房**——feature-eng 是调度员，子 skill 是厨师。各模式文件的越界判定均回本节，不各自复述。

| 允许 | 禁止 |
|---|---|
| 分诊路径、维护 progress、判断下一环 | 改业务代码 / 写测试实现 / 画原型正文 / 写用例正文 |
| 检查硬闸（产物存在、用户已确认） | 改写、截断、覆盖子 skill 的**领域**运行逻辑 |
| 调起绑定到的子 skill 并传入输入指针与环截断指令 | 在子 skill 执行中途插嘴、替它做领域决策 |
| 子 skill 结束后校验约定产物并 advance | 把子 skill 职责内联重做一遍冒充完成 |
| 记录环节状态与回链 | 跳过硬闸、伪造产物勾选 |
| init/rebind 展示推荐包并请用户选择 | 静默按推荐包写盘、未问用户就改绑 |

说明：对 `brainstorming`（design/spec）传入「截断到本环」是控制器职责，**不是**改写子 skill 正文；见 [binding.md](binding.md)。

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 首次使用 / 初始化绑定 | `init` | [init.md](init.md) |
| 改环节↔skill 映射 | `rebind` | [rebind.md](rebind.md) |
| 新主题开工 | `start` | [start.md](start.md) |
| 续跑进行中主题 | `resume` | [resume.md](resume.md) |
| 只读看进度 | `status` | [status.md](status.md) |
| 当前环完成、推进下一环 | `advance` | [advance.md](advance.md) |
| 收口归档 | `close` | [close.md](close.md) |

未指定：无 `config/stage-bindings.yaml` → `init`；有未完成 `runs/` → `resume`；否则问用户。

## 硬闸（闸名索引；通过条件正文只活在指针文件）

| 闸 | 触发时机 | 正文 |
|---|---|---|
| 绑定闸 | 需子 skill 的环节调起前 | [binding.md](binding.md) |
| 分诊闸 | `start` | [gates-common.md](gates-common.md) |
| Proto 桥 | 环 5 结束 | [proto-bridge.md](proto-bridge.md) |
| Pre-Impl 闸 | 进实现前 | [gates-common.md](gates-common.md) |
| Verify 闸（仅 F） | 环 10 末 | [gates-common.md](gates-common.md) |
| Close 闸 | 环 11 | [close.md](close.md) |

闸不过：停并列缺失项；禁止跳过闸或伪造产物勾选。

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 环节表 / S·B·F 裁剪 / 产物契约 | [stages.md](stages.md) |
| 各环硬闸通过条件 | [gates-common.md](gates-common.md) |
| 5→6 Proto 自判与询问 | [proto-bridge.md](proto-bridge.md) |
| 绑定 lookup / 推荐包 / 截断与回退 | [binding.md](binding.md) |
| 会话过长 / 中断续跑 | [handoff.md](handoff.md) |
| 进度 / 回链 / 用例 / 报告格式 | `templates/`（progress.yaml · links.md · testcases.md · test-report.md） |
| 追溯设计依据（默认勿打开） | [docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md](../../../docs/superpowers/archive/specs/2026-09-04-feature-eng开发流程控制器-设计.md) |
