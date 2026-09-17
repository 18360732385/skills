# binding — 环节 ↔ skill 解耦与 lookup

## 原则

- 流程只定义环节、硬闸（见 [stages.md](stages.md)、[gates-common.md](gates-common.md)）；产物形状见 [artifacts.md](artifacts.md)；**不写死**环节用哪个 skill。
- 运行时环节执行者只来自 `config/stage-bindings.yaml`（SSOT；sync 后工作副本在 `.cursor/skills/feature-eng/config/`）。
- 绑定**入库**，团队共用一套映射；个人差异走 `rebind` 提 MR，不改本地副本。
- **推荐 ≠ 强制**：`config/stage-bindings.yaml` 与推荐包 SSOT [`config/stage-bindings.example.yaml`](config/stage-bindings.example.yaml) 里的 skill 名都是建议，不是死绑；init/rebind **首问**须用户选（一键采用推荐 / 逐环改 / 指定其他 skill）。

## 可绑环节（键名固定）

`grill` · `design` · `domain` · `spec` · `plan` · `proto` · `testdesign` · `implement` · `review` · `verify` · `diagnose`

控制器自有环节（不绑子 skill）：`triage` · `proto-bridge` · `go` · `pre-impl` · `handoff` · `advance` · `close`。

## 宿主调起策略 `invoke`

读自本主题 `progress.invoke`（`start` 写入；缺省时读 `stage-bindings.yaml` 的 `defaults.invoke`，再缺省则 **`strict`**）。

| 值 | 行为 |
|---|---|
| **`strict`** | 必须子代理（Task）或**新会话**点名绑定 skill；父会话只输出指针卡片后停在调度，等子 skill 结束后再进 lookup 步骤 5 |
| **`inline`** | 允许**同会话**执行绑定 skill，但须：先贴指针卡片 → 明示「本段戴厨师帽」→ 只写领域产物 → 结束回报路径列表 → **仍由 advance 写 progress/links** |

两种策略下控制器都**不**代写领域正文。`inline` 不是「调度员进厨房写业务」的许可证，只是承认同会话上下文；写盘权责见 [SKILL.md](SKILL.md)。

### 指针卡片（调起前固定输出）

```text
【feature-eng 指针】
- slug / runs: docs/superpowers/runs/<slug>/
- path / stage / run_mode / invoke: …
- 绑定 skill: <name>
- 上一环产物: <paths>
- 本环产物期望: 见 artifacts.md「<stage>」勾选
- 截断/回退: <design|spec 截断或 implement 回退要点>
- 厨师结束请回报: 产物路径列表（勿改 progress.yaml / links.md）
```

提示用户可整段复制到新会话（`strict`）或确认后同会话继续（`inline`）。

## lookup（每个需子 skill 的环节通用）

```text
1. 读 stage-bindings.yaml 中 stages.<环节>.skill
2. skill 为 null / 键缺失
   → 阻断：提示「该环节未绑定 skill，请运行 feature-eng init 或 rebind」
3. skill 已填但当前环境不可调起（未安装）
   → 阻断：协助安装（须用户同意）或提示 rebind；可提示推荐包中的替代名
4. 按 progress.invoke（或 defaults.invoke）调起：
   - 输出指针卡片（上节）
   - strict → 子代理或请用户新会话点名该 skill；父会话停在调度
   - inline → 同会话执行该 skill（仍只传指针与截断；戴厨师帽）
   另附：本环截断/回退指令（见下节「同 skill 多环」与「implement 回退」）
   若 stages.<环节> 含 input_contract：把必传字段一并写入指针卡片
5. 子 skill 结束后：收取「产物路径列表」→ 控制器回写 links / artifacts.* →
   只 Read artifacts 当前节勾选 → 全 ✓ 则 [advance.md](advance.md)；缺则停并列缺失项
```

切断完成标准（`strict`）：子 skill 在子代理或新会话中跑完；父会话在步骤 5 才读产物。  
`inline` 完成标准：同会话厨师段结束并回报路径；步骤 5 仍由控制器校验与 advance。越界判定见 SKILL.md 控制器边界节。

## 同 skill 多环（brainstorming × design / spec）

`design` 与 `spec` 推荐都绑 `brainstorming`（Superpowers 无独立 writing-specs）。调起时**必须**附加截断指令，避免一口气写到 plan：

| 当前环 | 允许做到 | 禁止 |
|---|---|---|
| design | 澄清问题、方案对比；聊天内设计须用户 yes（F 可分段，每段 yes） | 写 `docs/superpowers/specs/`；调起 `writing-plans`；写业务代码 |
| spec | 将已确认设计落盘为 `docs/superpowers/specs/YYYY-MM-DD-<主题>-设计.md`；自审；等用户审 Spec | 调起 `writing-plans`；实现；重开整段设计访谈（除非用户要求返工） |

域定稿（ADR/CONTEXT）仍走 `domain` 绑定，不由 brainstorming 代做。

`run_mode: express` 时 grill+design 可同轮产出，但仍须一次总确认后才由 advance 写 `shared_understanding` + `design_confirmed`；spec 与 plan **仍分环**（见 [start.md](start.md)）。

## implement 回退（与 Superpowers 同款询问）

1. 读绑定：推荐为 `subagent-driven-development`。
2. 调起前向用户确认（可短问）：
   - **优先**：有子代理能力 → `subagent-driven-development`
   - **其次**：无子代理或用户选择 → `executing-plans`
3. 用户也可指定其他实现类 skill（须已装或同意安装）。
4. 选定后写入本轮会话选用；**不**因单次选择改 yaml（改默认用 rebind）。
5. 实现 skill 内部的 TDD / review 由其自行决定；控制器只按 [artifacts.md](artifacts.md) implement 节勾选校验。

### 宿主 commit 策略（Global）

默认 **不**自动 `git commit`。plan / 实现类 skill 文中「每任务 commit」视为 **optional / 需用户授权**。用户未显式要求 commit 时，跳过并在回报里注明「未 commit（宿主策略）」。`defaults.commit_policy` 见 example yaml（`user_authorized` | `follow_plan`）。

## 临时覆盖

默认**不允许**「本次任务静默换 skill」。确需换默认：先 `rebind`。单次 `implement` 在 SDD / executing-plans 间选择属上节允许的询问，不算污染全局映射。  
单次改 `invoke`（如本环临时 strict）：问用户后只改本主题 `progress.invoke`，不改 yaml。

## 仅 F 环节

`testdesign` / `verify` 的调起时机由路径裁剪决定（SSOT 见 [stages.md](stages.md)）；init 时仍建议预绑，避免 Full 主题跑到一半才发现未绑。

## input_contract（可选）

`stages.<环节>` 可带 `input_contract`（必传字段名列表）与 `output_hint`（期望产物路径模式）。lookup 步骤 4 写入指针卡片，减少薄 skill 发挥空间。未配置则不加字段，不阻断。
