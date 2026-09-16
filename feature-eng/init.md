# init — 初始化环节绑定

首次使用 feature-eng、或绑定文件缺失时运行。目标：产出可用的 `config/stage-bindings.yaml`。

## 原则（最高优先级）

- 推荐包 SSOT：[`config/stage-bindings.example.yaml`](config/stage-bindings.example.yaml)。「推荐 ≠ 强制」见 [binding.md](binding.md)。
- **首问**必停：Read example 展示推荐包，让用户选择；未选不写盘。
- 用户可选：①一键采用全部推荐 ②逐环改绑 ③某环指定其他已装/待装 skill ④某环暂不绑定（`null`）。

## 步骤

1. **扫描**：列出当前环境可调起的相关 skill（按能力粗分：澄清 / 设计 / 领域 / 规格 / 计划 / 原型 / 测设 / 实现 / 评审 / 验证 / 排障）。宿主无法枚举时，允许用户手工填写 skill 名。
   - 完成标准：11 个可绑环节每个至少有 1 个候选，或显式标注「无候选」。
2. **首问（推荐包）**：Read `config/stage-bindings.example.yaml`，用一张表展示推荐包 + 扫描命中情况（已装 / 未装 / 无候选）。**必须停下来问用户**，选项至少包括：
   - **采用推荐包**（未装项进入步骤 4 安装确认）
   - **逐环调整**（进入步骤 3）
   - **全部自行指定**（进入步骤 3，无默认预填）
3. **逐环提问**（仅当用户未一键采用时）：对 11 个可绑环节依次展示：
   - 环节职责（引 [stages.md](stages.md)）+ 产物勾选摘要（引 [artifacts.md](artifacts.md) 对应节，不展开全文）
   - example 中的推荐 skill + 扫描候选
   - 用户选定，或「暂不绑定」（`skill: null`）
4. **安装缺失**：选中但当前环境没有的 skill，给出安装方式并**经用户同意**后执行；安装失败则该环写 `null` 并说明。
   - 完成标准：每个非 null 绑定能在已安装列表中**按名命中**；未命中 → 改 `null`。
5. **预览 diff**：写盘前展示新旧绑定对照；用户确认后写入 `config/stage-bindings.yaml`。
6. **生成**：默认代跑 `node scripts/agent-config/sync.mjs`；失败则提示用户手工执行。
7. **收尾**：提示「后续 start/resume 沿用本绑定；改映射用 rebind。推荐包只是起点（见 [binding.md](binding.md)）。」

## 硬闸

- 未完成「首问」用户选择前**不写盘**。
- 安装动作**必须**用户显式同意；禁止静默安装。
- `testdesign` / `verify` 也参与问卷（调起时机见 [stages.md](stages.md) 裁剪表）。

## 幂等

已有绑定文件时进入 init：先展示现状与 `config/stage-bindings.example.yaml` 对照，首问改为「保持现状 / 重置为推荐包 / 逐环改」；只改用户确认要改的环。
