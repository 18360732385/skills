---
name: feature-eng
description: >-
  Use when the user explicitly names feature-eng, or asks to run
  init/start/resume/advance/close for a docs/runs topic under this skill.
disable-model-invocation: true
---

# feature-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（当前 **0.2.13-dev**；变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。  
**Agent 热路径**：[AGENT-INDEX.md](AGENT-INDEX.md)（先索引再 Read，勿扫根目录全部 md）。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)；烟测：`node scripts/selfcheck.mjs`。薄 CLI：`node scripts/feature.mjs`（`modes` / `status` / `gate-evidence` / `close-check`）。闸门证据：`node scripts/gate-evidence.mjs`。

Skill = **开发流程仪式（控制器）**。须**点名**本 skill（`disable-model-invocation: true`，不自动加载）。流程与绑定见 [flow.md](modes/specs/flow.md)；L1/L2/硬闸见 [gates.md](modes/specs/gates.md)；桥见 [bridges.md](modes/specs/bridges.md)；运行时只读 [config/stage-bindings.yaml](config/stage-bindings.yaml)（init/rebind **首问**可改）。过程态在 `docs/runs/{active|archive}/<slug>/`（与 `docs/superpowers/` 平级；非契约 SSOT）。对用户优先中文。  
拓扑：`modes/` 7 入口 · `modes/specs/` 4 手册 · `config/` · `templates/` · `scripts/feature.mjs`。

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

### 闸门证据条（0.2.11）

写任何 `gates.*` ISO 时间戳之前须同时成立：

1. 回链「硬闸授权」表有对应行，且 `authorized_by` 仅为 `user_chat` | `user_task_<id>` | `policy_exception`（禁止 `user_task_fixture|auto|todo|…` 占位）
2. 适用环已落盘 `审核-<stage>.md` 且含 **`result: pass`**（映射见 [gates.md](modes/specs/gates.md) / `scripts/gate-evidence.mjs`）
3. `chef_mode=controller_proxy` 时回链「仪式与降级」非空

`chef_mode=controller_proxy` **不豁免**上述证据条——与 `bound` 同级。机检：`node scripts/gate-evidence.mjs --cwd <仓根> --slug <slug>`（或 `node scripts/feature.mjs gate-evidence …`）。

### 红旗 — STOP

- 把「用户：确认」多轮假对话写入 `authorized_by`
- 自造 `user_task_fixture` / `user_task_auto` 等占位 task id
- 声称环完成但跳过 L2 / 不写 `审核-<stage>.md` / `result: fail` 仍写推进闸
- `controller_proxy` 当作可跳过 advance / 硬闸的许可证
- 只读 YAML `description` 或 SKILL 前几段就开干，不 Read `modes/`
- 金样/旧夹具「审核文件可不落盘」——已废除；以本版证据条为准

**出现任一条：停写 gates；先补证据。**

### 合理化表

| 借口 | 现实 |
|---|---|
| 「赶时间，L2 以后补」 | 无 `审核-<stage>.md` + `result: pass` 不得写推进闸时间戳 |
| 「用户肯定会同意，先填确认」 | 假 transcript 非法；等真实短确认或真实 `user_task_<id>` |
| 「fixture/auto 先顶上」 | 占位 task id 非法；须用户或跑批真实 id |
| 「proxy 模式我兼代厨师，闸也可以省」 | proxy 只改厨师帽；证据条与 bound 相同 |
| 「description 已经写了流程」 | description 只触发加载；流程以 modes 为准 |
| 「夹具说审核文件可不落盘」 | 0.2.10 起金样必须落盘；`result: fail` 仍写 ISO 亦 FAIL |
| 「express 就跳过 Pre-Impl」 | express 只压缩 grill+design 确认节奏；Pre-Impl / Gate 仍按路径适用 |
| 「inline 我就一边写代码一边改 progress」 | inline 只改调起形态；progress/回链/gates 仍只由 advance 写 |
| 「B 路径 close 不用双归档」 | Bounded 仍须 active→archive；superpowers/archive 按 close L1 勾选，不得静默省略 runs 归档 |

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 首次使用 / 初始化绑定 | `init` | [init.md](modes/init.md) |
| 改环节↔skill 映射 | `rebind` | [rebind.md](modes/rebind.md) |
| 新主题开工 | `start` | [start.md](modes/start.md) |
| 续跑进行中主题 | `resume` | [resume.md](modes/resume.md) |
| 只看进度 | `status` | [status.md](modes/status.md) |
| 声称当前环完成 | `advance` | [advance.md](modes/advance.md) |
| 收口归档 | `close` | [close.md](modes/close.md) |

`start`/`resume` 之后用户声称当前环完成 → [advance.md](modes/advance.md)。  
未指定：无绑定 → `init`；有 `docs/runs/active/` 未完成 → [status.md](modes/status.md)；否则问 `start` 还是 `init`。

## 硬闸（闸名索引）

| 闸 | 触发时机 | 正文 |
|---|---|---|
| 绑定闸 | 调起前 | [flow.md](modes/specs/flow.md) |
| 分诊 / Pre-Impl / Verify 等 | 对应环 | [gates.md](modes/specs/gates.md) |
| 定稿桥 / Proto 桥 | 设计确认后 / 环 5 末 | [bridges.md](modes/specs/bridges.md) |
| 环间 L1/L2 | advance | [gates.md](modes/specs/gates.md) |
| Close | 收口 | [close.md](modes/close.md) · [gates.md](modes/specs/gates.md) |

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 环节 / 绑定 / 截断 | [flow.md](modes/specs/flow.md) · [truncate-contracts.yaml](config/truncate-contracts.yaml) |
| L1 / L2 / 硬闸卡片 | [gates.md](modes/specs/gates.md) |
| 定稿桥 / Proto 桥 | [bridges.md](modes/specs/bridges.md) |
| 交接 | [handoff.md](modes/specs/handoff.md) |
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 模板 | `templates/` |
