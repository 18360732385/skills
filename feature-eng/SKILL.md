---
name: feature-eng
description: >-
  开发流程控制器：分诊 S/B/F · 按环节调度已绑定子 skill · 维护 runs 进度 · 验产物过闸。
  本身不做具体开发工作。仅用户点名使用。
disable-model-invocation: true
---

# feature-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（当前 **0.2.6-dev**；变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。  
**Agent 热路径**：[AGENT-INDEX.md](AGENT-INDEX.md)（先索引再 Read，勿扫根目录全部 md）。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)；烟测：`node scripts/selfcheck.mjs`。薄 CLI：`node scripts/feature.mjs`（`modes` / `status`）。

Skill = **开发流程仪式（控制器）**。流程定稿见 [stages.md](modes/stages.md)；产物形状见 [artifacts.md](modes/artifacts.md)（L1）；环间语义见 [gates-review.md](modes/gates-review.md)（L2）；环节与 skill **解耦**，运行时只读 [config/stage-bindings.yaml](config/stage-bindings.yaml)（init/rebind **首问**可改；见 [binding.md](modes/binding.md)）。过程态在 `docs/runs/{active|archive}/<slug>/`（与 `docs/superpowers/` 平级；非契约 SSOT）。对用户优先中文。  
拓扑：`modes/` 模式规格 · `config/` 绑定 SSOT · `templates/` 过程态骨架 · `scripts/feature.mjs` 薄 CLI。

## 控制器边界（最高优先级）

一句话：**调度员不进厨房**——feature-eng 是调度员，子 skill 是厨师。各模式文件的越界判定均回本节，不各自复述。

只做：分诊与下一环判断；维护 `progress.yaml` / `回链.md`；L1 勾选 + 调度 L2 审核；按 `invoke` **主动**调起绑定 skill；子 skill 结束后 advance；按 `handoff_policy` 过闸后主动进下一环；init/rebind **首问**；`start` 仪式选项；跑 domain-bridge / proto-bridge；close 时 active→archive。

### 写盘权责（SSOT）

| 谁 | 可写 | 不可写 |
|---|---|---|
| **控制器** | `progress.yaml`、`回链.md`、runs 模板骨架、`交接.md`、gates 时间戳、`artifacts.*` | 领域产物正文、业务代码、仓库根 `CONTEXT.md` |
| **子 skill（厨师）** | ADR / Spec / Plan / 原型 / `测试用例.md` / `术语增量.md` / 代码等 | `progress.yaml`、`回链.md`、gates 时间戳、根 `CONTEXT.md` |
| **L2 审核** | 仅 `审核-<stage>.md` | `progress.yaml`、`回链.md`、领域正文、业务代码 |

硬轨：跳过硬闸或伪造勾选；未完成首问就写盘/改绑；厨师/审核员代写 progress/`回链.md`；替用户 yes 硬闸。自动调起 ≠ 跳过硬闸。

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 首次使用 / 初始化绑定 | `init` | [init.md](modes/init.md) |
| 改环节↔skill 映射 | `rebind` | [rebind.md](modes/rebind.md) |
| 新主题开工 | `start` | [start.md](modes/start.md) |
| 续跑进行中主题 | `resume` | [resume.md](modes/resume.md) |
| 收口归档 | `close` | [close.md](modes/close.md) |

`start`/`resume` 之后用户声称当前环完成 → [advance.md](modes/advance.md)。  
未指定：无绑定 → `init`；有 `docs/runs/active/` 未完成 → [status.md](modes/status.md)；否则问 `start` 还是 `init`。

## 硬闸（闸名索引）

| 闸 | 触发时机 | 正文 |
|---|---|---|
| 绑定闸 | 调起前 | [binding.md](modes/binding.md) |
| 分诊闸 | `start` | [gates-common.md](modes/gates-common.md) |
| 定稿桥 | 设计确认后 | [domain-bridge.md](modes/domain-bridge.md) |
| Proto 桥 | 环 5 结束 | [proto-bridge.md](modes/proto-bridge.md) |
| 环间 L1 | advance | [artifacts.md](modes/artifacts.md) |
| 环间 L2 | advance | [gates-review.md](modes/gates-review.md) |
| Pre-Impl / Verify / Close | 对应环 | [gates-common.md](modes/gates-common.md) / [close.md](modes/close.md) |

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 环节表 / 裁剪 / runs 目录约定 | [stages.md](modes/stages.md) |
| L1 勾选 | [artifacts.md](modes/artifacts.md) |
| L2 审核 | [gates-review.md](modes/gates-review.md) |
| 硬闸 / 短确认卡片 | [gates-common.md](modes/gates-common.md) |
| 定稿桥 / Proto 桥 | [domain-bridge.md](modes/domain-bridge.md) / [proto-bridge.md](modes/proto-bridge.md) |
| lookup / 主动调起 / 截断契约 | [binding.md](modes/binding.md) · [config/truncate-contracts.yaml](config/truncate-contracts.yaml) |
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 交接 | [handoff.md](modes/handoff.md) |
| 模板 | `templates/`（progress.yaml · 回链.md · 测试用例.md · 测试报告.md · runs-README.md） |
