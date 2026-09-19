# binding — 环节 ↔ skill 解耦与 lookup

## 原则

- 流程只定义环节、硬闸（见 [stages.md](stages.md)、[gates-common.md](gates-common.md)）；产物形状见 [artifacts.md](artifacts.md)；语义见 [gates-review.md](gates-review.md)；**不写死**环节用哪个 skill。
- 运行时环节执行者只来自 `config/stage-bindings.yaml`（SSOT；sync 后工作副本在 `.cursor/skills/feature-eng/config/`）。
- 绑定**入库**，团队共用一套映射；个人差异走 `rebind` 提 MR，不改本地副本。
- **推荐 ≠ 强制**：`config/stage-bindings.yaml` 与推荐包 SSOT [`config/stage-bindings.example.yaml`](../config/stage-bindings.example.yaml) 里的 skill 名都是建议，不是死绑；init/rebind **首问**须用户选（一键采用推荐 / 逐环改 / 指定其他 skill）。

## 可绑环节（键名固定）

`grill` · `design` · `domain` · `spec` · `plan` · `proto` · `testdesign` · `implement` · `review` · `verify` · `diagnose`

控制器自有环节（不绑子 skill）：`triage` · `domain-bridge` · `proto-bridge` · `go` · `pre-impl` · `handoff` · `advance` · `close`。  
说明：`advance` 内含 L1/L2 调度与按 `handoff_policy` 主动调起（不单独绑审核 skill；见 [gates-review.md](gates-review.md)）。

## 宿主调起策略 `invoke`

读自本主题 `progress.invoke`（`start` 写入；缺省时读 `stage-bindings.yaml` 的 `defaults.invoke`，再缺省则 **`strict`**）。

| 值 | 行为 |
|---|---|
| **`strict`** | **控制器主动**开 Task/子代理调起绑定 skill；父会话贴指针后停在调度，等子 skill 结束再进步骤 5。**仅当宿主无法开子代理**时，才退回「请用户新会话点名 + 复制指针卡片」 |
| **`inline`** | **控制器主动**在同会话执行：贴指针卡片 → 明示「本段戴厨师帽」→ 只写领域产物 → 结束回报路径列表 → **仍由 advance 写 progress/links** |

两种策略下控制器都**不**代写领域正文。用户不是默认路由器；`inline` 不是「调度员进厨房写业务」的许可证。写盘权责见 [SKILL.md](../SKILL.md)。

### 环间交接策略 `handoff_policy`

读自 `progress.handoff_policy`（缺省：`express`→`auto`，`guided`→`confirm`，或 `defaults.handoff_policy`）。

| 值 | 行为 |
|---|---|
| **`auto`** | advance / 桥结束后 **立即** lookup 下一需 skill 的环 |
| **`confirm`** | 短确认卡片后再 lookup；用户否 → `pending_invoke` |

### 指针卡片（调起前固定输出）

```text
【feature-eng 指针】
- slug / runs: docs/runs/active/<slug>/
- path / stage / run_mode / invoke / handoff_policy: …
- 绑定 skill: <name>
- 上一环产物: <paths>
- 上一环 L2 结论: …/审核-<prev>.md（若有）
- 本环产物期望: 见 artifacts.md「<stage>」勾选（L1）
- 本环语义期望: 见 gates-review.md「离开 <stage>」
- 截断/回退: <design|spec 截断或 implement 回退要点>
- 厨师结束请回报: 产物路径列表（勿改 progress.yaml / 回链.md）
```

`strict` 且无 Task 时提示用户复制本卡片到新会话；其余情况由控制器主动调起。

## lookup（每个需子 skill 的环节通用）

### 绑定 skill 可调起（预检 checklist）

调起前**逐项**核对；任一项失败 → **阻断**，把对应失败文案原样贴给用户（可附推荐包替代名）：

| # | 检查 | 失败时复制给用户 |
|---|---|---|
| A | `config/stage-bindings.yaml` 存在且含 `stages.<环节>` 键 | 「绑定配置缺失或无此环节键，请运行 feature-eng init 或检查 stage-bindings.yaml」 |
| B | `stages.<环节>.skill` 非 `null`、非空 | 「该环节未绑定 skill，请运行 feature-eng init 或 rebind」 |
| C | 绑定 skill **当前宿主可调起**（已安装 / 可点名） | 「绑定 skill `<name>` 当前不可调起（未安装或宿主无法点名）。请安装（须用户同意）或 rebind；推荐包见 `config/stage-bindings.example.yaml`」 |
| D | 若本环为 `design`/`spec` 且与同 skill 多环：已读截断契约并写入指针卡片 | 「缺少 design/spec 截断指令：见 [config/truncate-contracts.yaml](../config/truncate-contracts.yaml) 与下节『同 skill 多环』」 |
| E | 若本环为 `implement`：已完成回退询问（SDD / executing-plans） | 「implement 未确认执行 skill：见下节『implement 回退』」 |

预检通过后再进入调起步骤。`start` / `advance` 调下一环前同样适用本表。

```text
1. 读 stage-bindings.yaml 中 stages.<环节>.skill（跑上表 A–E）
2. A/B 失败 → 阻断（上表文案）
3. C 失败 → 阻断；协助安装（须用户同意）或提示 rebind；可提示推荐包替代名
4. 控制器主动调起（按 progress.invoke）：
   - 输出指针卡片（上节）
   - inline → 同会话戴厨师帽执行
   - strict → 主动 Task；仅无 Task 时退回用户新会话点名
   另附：本环截断/回退指令（见下节「同 skill 多环」与「implement 回退」；机读 [config/truncate-contracts.yaml](../config/truncate-contracts.yaml)）
   若 stages.<环节> 含 input_contract：把必传字段一并写入指针卡片
5. 子 skill 结束后：收取「产物路径列表」→ 进入 [advance.md](advance.md)
   （L1 → L2 → 硬闸 → 写盘 → handoff_policy 调下一环）
```

完成标准：预检通过；子 skill 跑完并回报路径；父会话在 advance 中做 L1/L2。越界判定见 SKILL.md。

## 同 skill 多环（brainstorming × design / spec）

`design` 与 `spec` 推荐都绑 `brainstorming`（Superpowers 无独立 writing-specs）。调起时**必须**附加截断指令，避免一口气写到 plan。

**机读契约**：[config/truncate-contracts.yaml](../config/truncate-contracts.yaml)（`stages.design` / `stages.spec` 的 allow/forbid；lookup 预检 D 项）。人读摘要：

| 当前环 | 允许做到 | 禁止 |
|---|---|---|
| design | 澄清问题、方案对比；聊天内设计须用户 yes（F 可分段，每段 yes） | 写 `docs/superpowers/specs/`；调起 `writing-plans`；写业务代码 |
| spec | 将已确认设计落盘为 `docs/superpowers/specs/YYYY-MM-DD-<主题>-设计.md`；自审；等用户审 Spec | 调起 `writing-plans`；实现；重开整段设计访谈（除非用户要求返工） |

域定稿（ADR / `术语增量.md`）仅在 `domain=entered` 时走 `domain` 绑定，不由 brainstorming 代做；默认经 [domain-bridge.md](domain-bridge.md) 跳过。禁止写仓库根 `CONTEXT.md`。

`run_mode: express` 时 grill+design 可同轮产出，但仍须一次总确认后才由 advance 写 `shared_understanding` + `design_confirmed`；随后仍跑 domain-bridge（多数 skipped）→ spec；spec 与 plan **仍分环**（见 [start.md](start.md)）。

## implement 回退（与 Superpowers 同款询问）

1. 读绑定：推荐为 `subagent-driven-development`。
2. 调起前向用户确认（可短问）：
   - **优先**：有子代理能力 → `subagent-driven-development`
   - **其次**：无子代理或用户选择 → `executing-plans`
3. 用户也可指定其他实现类 skill（须已装或同意安装）。
4. 选定后写入本轮会话选用；**不**因单次选择改 yaml（改默认用 rebind）。
5. 实现 skill 内部的 TDD / review 由其自行决定；控制器按 artifacts（L1）+ gates-review（L2）校验。

### 宿主 commit 策略（Global）

默认 **不**自动 `git commit`。plan / 实现类 skill 文中「每任务 commit」视为 **optional / 需用户授权**。用户未显式要求 commit 时，跳过并在回报里注明「未 commit（宿主策略）」。`defaults.commit_policy` 见 example yaml（`user_authorized` | `follow_plan`）。

## 临时覆盖

默认**不允许**「本次任务静默换 skill」。确需换默认：先 `rebind`。单次 `implement` 在 SDD / executing-plans 间选择属上节允许的询问，不算污染全局映射。  
单次改 `invoke` / `handoff_policy` / `review_policy`：问用户后只改本主题 progress，不改 yaml。

## 仅 F 环节

`testdesign` / `verify` 的调起时机由路径裁剪决定（SSOT 见 [stages.md](stages.md)）；init 时仍建议预绑，避免 Full 主题跑到一半才发现未绑。

## input_contract（可选）

`stages.<环节>` 可带 `input_contract`（必传字段名列表）与 `output_hint`（期望产物路径模式）。lookup 步骤 4 写入指针卡片，减少薄 skill 发挥空间。未配置则不加字段，不阻断。
