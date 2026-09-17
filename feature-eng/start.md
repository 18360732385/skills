# start — 新主题开工

## 前置

- 无 `config/stage-bindings.yaml` → 硬闸：先走 [init.md](init.md)（含推荐包首问）。
- 已有未完成 `docs/runs/active/<slug>/` 且用户意图是续跑 → 转 [resume.md](resume.md)。

## 步骤

1. **绑定就绪检查**：读 `stage-bindings.yaml`。按即将分诊的路径，标出关键环若为 `null` 的缺口（见下表）。有缺口 → **红字提示**，建议先 `rebind`/`init`；用户坚持继续则仅能跑到第一个未绑环前。
   - 任意路径常用：`grill` / `design`（按需）  
   - B/F：`implement`、`review`；条件 `proto` / `domain`（仅 entered 时才调起）  
   - **仅 F**：`spec`、`plan`、`testdesign`、`verify` 不应为 null（否则 Full 跑不通）
2. **定 slug**：`YYYY-MM-DD-<主题短名>`（中文可；与 superpowers 文件命名一致）。
3. **分诊**：读需求描述 + 仓库现状，提议 S/B/F 并给依据（改动面、是否新子系统、是否改公共接口、是否需 ADR）。**用户确认**其一。
4. **仪式选项（可与分诊同屏确认）**：
   - **`run_mode`**：`guided`（默认）| `express`
   - **`invoke`**：`strict`（默认）| `inline`（见 [binding.md](binding.md)）。缺省可跟 `defaults.invoke`。
   - **`handoff_policy`**：`auto` | `confirm`。未指定时：`express`→`auto`，`guided`→`confirm`。
   - **`review_policy`**：`subagent`（默认）| `inline`。
5. **建过程态**：
   - 确保 `docs/runs/active/`（及可选 `docs/runs/README.md`，可用 `templates/runs-README.md.tmpl`）
   - 创建 `docs/runs/active/<slug>/`
   - 写 `progress.yaml`（自 `templates/progress.yaml.tmpl`）
   - 写 `回链.md`（自 `templates/回链.md.tmpl`）
   - 可选：在 `docs/runs/README.md` 进行中表插入一行
6. **登记索引**（仅 F，或用户要求登记时）：`docs/superpowers/README.md` 进行中表按日期倒序插入主题行（Spec/Plan 列先 `—`，环 4/5 产出后回写）。无 README 则跳过并说明。
7. **进入下一环**：**控制器主动**按 [binding.md](binding.md) lookup 调起首个执行环。若 `handoff_policy=confirm`，先短确认卡片再调起。用户声称本环完成 → [advance.md](advance.md)。

## `express` 硬边界

**不跳过**：分诊确认、开干闸、Pre-Impl、Verify（F）、Close。  
**可压缩**：grill+design 同轮；共享理解闸 + 设计确认闸可用**一次总 yes**。  
**仍分环**：spec 与 plan；design 后仍跑 **domain-bridge**；proto 桥规则不变。  
**编排**：默认 `handoff_policy=auto`。

## 硬闸

- 用户未确认分诊前，禁止创建 runs 目录与调起任何子 skill。
- 控制器只建目录与模板文件；澄清/设计正文由子 skill 产出。
- 换绑走 rebind；implement 回退询问见 [binding.md](binding.md)。
- 仪式字段写入后本主题沿用；中途改须用户显式确认并只改 progress。
