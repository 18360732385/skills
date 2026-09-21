# init — 初始化环节绑定

首次使用 feature-eng、或绑定文件缺失时运行。目标：产出可用的 `config/stage-bindings.yaml`。

## 原则（最高优先级）

- 推荐包 SSOT：[`config/stage-bindings.example.yaml`](../config/stage-bindings.example.yaml)。「推荐 ≠ 强制」见 [binding.md](binding.md)。
- **首问**必停：先展示固定表（中文名 + skill + 产物），再让用户选择；未选不写盘。
- 用户可选：①一键采用全部推荐 ②逐环改绑 ③某环指定其他已装/待装 skill ④某环暂不绑定（`null`）。

## repo_bootstrap（与 start 共用）

若目标仓 **empty-ish**（仅有 `LICENSE` / `.gitignore` 等 GitHub 模板、无业务骨架）：init 仍可写绑定，但 **start 前**须完成本地脚手架 + push（Cloud/SCM 对空仓常 400）。判定规则见 [start.md](start.md) 步骤 1。**模板文件 ≠ 业务骨架**。

### 绿地前端非空目录（O10）

若根目录仅有 VCS / `LICENSE*` / `.gitignore`（及可选占位 README）且 **无 `package.json`**，而用户要 `create-vite` / `create-next-app`：

- **不要**只报「目录必须为空」就失败。
- **提示**临时目录配方（见 [QUICKSTART.md](../QUICKSTART.md)「绿地前端」）：`mktemp -d` → create → `cp -a` 回仓根。
- init 本身仍只写绑定；脚手架动作留给 start / 用户确认后的 bootstrap。

## 步骤

1. **扫描**：列出当前环境可调起的相关 skill（按能力粗分：澄清 / 设计 / 定稿 / 规格 / 计划 / 原型 / 测设 / 实现 / 评审 / 验证 / 排障）。宿主无法枚举时，允许用户手工填写 skill 名。
   - 完成标准：11 个可绑环节每个至少有 1 个候选，或显式标注「无候选」。
2. **首问（推荐包表）**：Read `config/stage-bindings.example.yaml` 与 [stages.md](stages.md)「可绑环节中文名与产物一句话」。**一键采用前也必须先展示下表**，再停下问用户：

   | 环 | 中文名 | 键名 | 推荐 skill | 安装 | 主要产物（一句话） |
   |---|---|---|---|---|---|
   | 1 | 澄清 | grill | （example） | 已装/未装/无候选 | （stages 一句话） |
   | … | … | … | … | … | … |

   - 中文名、产物一句话：以 [stages.md](stages.md) 该节为 SSOT，勿自撰别名。
   - 推荐 skill / 安装列：来自 example + 步骤 1 扫描。

   选项至少包括：
   - **采用推荐包**（未装项进入步骤 4 安装确认）
   - **逐环调整**（进入步骤 3）
   - **全部自行指定**（进入步骤 3，无默认预填）

   同屏可问（可默认）：`defaults.invoke`（`strict`|`inline`）、`defaults.commit_policy`（`user_authorized`|`follow_plan`）、`defaults.handoff_policy`（`auto`|`confirm`）、`defaults.review_policy`（`subagent`|`inline`）。用户跳过则写 example 默认值。
3. **逐环提问**（仅当用户未一键采用时）：对 11 个可绑环节依次展示：
   - **中文名 + 键名** + 职责（引 [stages.md](stages.md)）+ 产物勾选摘要（引 [artifacts.md](artifacts.md) 对应节，不展开全文）
   - example 中的推荐 skill + 扫描候选
   - 用户选定，或「暂不绑定」（`skill: null`）
   - 可选：该环 `input_contract`（薄 skill 建议补必传字段；可跳过）
4. **安装缺失**：选中但当前环境没有的 skill，给出安装方式并**经用户同意**后执行；安装失败则该环写 `null` 并说明。
   - 完成标准：每个非 null 绑定能在已安装列表中**按名命中**；未命中 → 改 `null`。
5. **预览 diff**：写盘前展示新旧绑定对照（含 `defaults`；环节列带中文名）；用户确认后写入 `config/stage-bindings.yaml`。
6. **生成**：默认代跑 `node scripts/agent-config/sync.mjs`；失败则提示用户手工执行。
7. **收尾**：提示「后续 start/resume 沿用本绑定；改映射用 rebind。推荐包只是起点（见 [binding.md](binding.md)）。start 可按主题覆盖 `invoke` / `run_mode` / `handoff_policy` / `review_policy`。过闸后由控制器主动调起下一 skill（见 advance）。domain 为条件环，多数主题会跳过。」

## 硬闸

- 未完成「首问」用户选择前**不写盘**。
- 首问未展示含中文名的推荐包表前，不得视为已完成首问。
- 安装动作**必须**用户显式同意；禁止静默安装。
- `testdesign` / `verify` 也参与问卷（调起时机见 [stages.md](stages.md) 裁剪表）。

## 幂等

已有绑定文件时进入 init：先用同一固定表展示现状与 `config/stage-bindings.example.yaml` 对照，首问改为「保持现状 / 重置为推荐包 / 逐环改」；只改用户确认要改的环。
