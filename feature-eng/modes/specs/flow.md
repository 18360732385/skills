# flow — 环节表与绑定

环节表 + 绑定 lookup SSOT（原 stages.md + binding.md）。产物/闸门见 [gates.md](gates.md)；桥见 [bridges.md](bridges.md)。

## Part A — 环节表与路径裁剪


本页是 feature-eng 的**流程正文**：路径定义、环节顺序、进入条件、路径裁剪。产物形状与校验勾选见 [gates.md](gates.md)。执行者一律写「绑定 skill」或「控制器」；具体 skill 名见目标仓 `docs/runs/stage-bindings.yaml`（解耦规则见下文 Part B）。

## 路径

| 路径 | 适用 | 文档厚度 |
|---|---|---|
| **S Spike** | 可行性探查；结论是答案不是入库代码 | 无 spec/plan；可选 throwaway 笔记 |
| **B Bounded** | 仓库已有可改流程的小变更 | 聊天短设计；可无独立 spec |
| **F Full** | 新子系统、改公共接口、需 ADR 的决策 | 条件 ADR + Spec + Plan + 集成用例 + 测试报告 + 收口 |

## 过程态目录（与 superpowers 平级）

```text
docs/runs/
  README.md                 # 过程态导航（可选）
  active/<slug>/            # 进行中
  archive/<slug>/           # close 后移入
docs/superpowers/           # Spec/Plan 语料 + README/ARCHIVE（不变）
```

主题目录内常用文件：`progress.yaml`（机读 SSOT）、`回链.md`、`测试用例.md`、`测试报告.md`、`交接.md`、`术语增量.md`、`设计笔记.md`、`门禁清单.md`、`审核-<stage>.md`（stage 为英文键）。

## 可绑环节中文名与产物一句话（init / rebind / status SSOT）

| 环 | 中文名 | 键名 | 主要产物（一句话） |
|---|---|---|---|
| 1 | 澄清 | `grill` | 共享理解确认；可选术语/ADR 草稿（随 runs） |
| 2 | 设计 | `design` | 设计确认摘要（聊天或 `设计笔记.md`） |
| 3 | 定稿 | `domain` | 条件进入：ADR（`docs/adr/`）与/或 `术语增量.md` |
| 4 | 规格 | `spec` | Spec 设计文档（`docs/superpowers/specs/`） |
| 5 | 计划 | `plan` | 实施计划 / checklist（`docs/superpowers/plans/`） |
| 6 | 原型 | `proto` | 原型 + 交互说明 + 用户确认（仅 `proto=entered`） |
| 7 | 测试设计 | `testdesign` | 集成用例 `测试用例.md`（仅 F） |
| 8 | 实现 | `implement` | 业务代码 + 单测（code_complete） |
| 9 | 评审 | `review` | 语义轨评审结论（门禁用） |
| 10 | 验证 | `verify` | 测试报告 `测试报告.md`（仅 F） |
| 10b | 排障 | `diagnose` | 复现笔记（按需） |

## 环节表

| # | 中文名 | 环节键 | 执行者 | 进入条件 | 主要产物 | 目录 |
|---|---|---|---|---|---|---|
| 0 | 分诊 | `triage` | 控制器提议，**用户确认** | 每次 start | `progress.yaml` | `docs/runs/active/<slug>/` |
| 1 | 澄清 | `grill` | 绑定 skill | S 轻；B 按需；F 必 | 共享理解；可选草稿 | runs active |
| 2 | 设计 | `design` | 绑定 skill | S 探查计划；B 短设计；F 完整 | 设计确认摘要 | 可选 `设计笔记.md` |
| 2→3 | 定稿桥 | `domain-bridge` | **仅控制器** | 设计确认闸刚过 | `progress.domain=*` | runs |
| 3 | 定稿 | `domain` | 绑定 skill | **仅** `domain=entered` | ADR；`术语增量.md` | `docs/adr/`；runs |
| 4 | 规格 | `spec` | 绑定 skill | **仅 F**（domain 跳过或完成后） | Spec 设计 md | `docs/superpowers/specs/` |
| 5 | 计划 | `plan` | 绑定 skill | F 必；B 可选 checklist | 实施计划 | `docs/superpowers/plans/` |
| 5→6 | 原型桥 | `proto-bridge` | **仅控制器** | 5 刚结束 | `progress.proto=*` | runs |
| 6 | 原型 | `proto` | 绑定 skill | 自判需 UI **且**用户同意 | 原型 + 交互说明 | `docs/ui-prototypes/<slug>/` 或 runs |
| 7 | 测试设计 | `testdesign` | 绑定 skill | **仅 F** | `测试用例.md` | runs active |
| 7b | 实现前闸 | `pre-impl` | 控制器 | B/F | `stage=implement` | runs |
| 8 | 实现 | `implement` | 绑定 skill（+可选子代理） | B/F；S 仅 throwaway | 代码 + 单测 | 业务树 |
| 8b | 交接 | `handoff` | 旁路 | 按需 | `交接.md` | runs |
| 9 | 门禁 | `gate` | 仓库 hooks + 绑定 review | B/F | `门禁清单.md` | runs |
| 10 | 验证 | `verify` | 绑定 skill | **仅 F** | `测试报告.md` | runs |
| 10′ | 冒烟 | `smoke` | 可选 | B 建议、不强制 | 可选记录 | runs |
| 10b | 排障 | `diagnose` | 绑定 skill | 按需；先复现再改 | 复现笔记 | runs |
| 11 | 收口 | `close` | 控制器（见 [close.md](../close.md)） | 验证策略满足或接受残留 | 归档、pitfalls 三问 | superpowers + `runs/archive/` |

**术语落盘**：禁止主题术语写入仓库根 `CONTEXT.md`。增量用 `术语增量.md`（或 Spec 内术语小节，由 `回链.md` 指认）。

## 路径裁剪

| 环节 | S | B | F |
|---|---|---|---|
| 0–2 | 轻/按需 | 轻/按需 | ✓ |
| 2→3 定稿桥 | 按需 | 按需 | ✓（默认常 skipped） |
| 3 Domain | 仅 entered | 仅 entered | 仅 entered |
| 4 Spec | ✗ | ✗ | ✓ |
| 5 Plan | ✗ | 可选 | ✓ |
| 5→6 Proto 桥 | ✗ | ✓ | ✓ |
| 6 Proto | ✗ | 仅 entered | 仅 entered |
| 7 TestDesign | ✗ | **✗ 永不进入** | **✓ 必进** |
| 8 实现 | throwaway | ✓ | ✓ |
| 9 Gate | ✗ | ✓ | ✓ |
| 10 Verify | ✗ | **✗ 永不进入** | **✓ 必进** |
| 10′ 冒烟 | ✗ | 建议 | 可并入 10 |
| 11 收口 | 记结论 | 精简 | ✓ |

F 默认链路：design 确认 → **domain-bridge**（多数 `skipped`）→ **spec**。

## progress.yaml 字段

字段 SSOT 为 [`templates/progress.yaml.tmpl`](../../templates/progress.yaml.tmpl)；本页不复述。L1/L2 见 [gates.md](gates.md)；调起与交接见下文 Part B / [advance.md](../advance.md)；express 边界见 [start.md](../start.md)。


---

## Part B — 环节 ↔ skill 解耦与 lookup


## 原则

- 流程只定义环节、硬闸（见上文 Part A、[gates.md](gates.md)）；产物形状与语义见 [gates.md](gates.md)；**不写死**环节用哪个 skill。
- **运行时绑定 SSOT**：目标仓 `docs/runs/stage-bindings.yaml`。解析序：目标仓 → 技能包 `config/stage-bindings.yaml`（回退）→ 皆无则 init。
- **禁止**代跑目标仓 `scripts/agent-config/sync.mjs`（若存在）来「同步」本绑定；本控制器与 L5 配置 sync **解耦**。技能本体推荐**用户级**安装，勿依赖项目级 `.cursor/skills/` 托管。
- 绑定写入**目标仓**并由团队 MR 共用；个人差异走 `rebind`。
- **推荐 ≠ 强制**：目标仓绑定与推荐包种子 [`config/stage-bindings.example.yaml`](../../config/stage-bindings.example.yaml) 里的 skill 名都是建议，不是死绑；init/rebind **首问**须用户选（一键采用推荐 / 逐环改 / 指定其他 skill）。

## 可绑环节（键名固定）

`grill` · `design` · `domain` · `spec` · `plan` · `proto` · `testdesign` · `implement` · `review` · `verify` · `diagnose`

控制器自有环节（不绑子 skill）：`triage` · `domain-bridge` · `proto-bridge` · `go` · `pre-impl` · `handoff` · `advance` · `close`。  
说明：`advance` 内含 L1/L2 调度与按 `handoff_policy` 主动调起（不单独绑审核 skill；见 [gates.md](gates.md)）。

## 宿主调起策略 `invoke`

读自本主题 `progress.invoke`（`start` 写入；缺省时读 `stage-bindings.yaml` 的 `defaults.invoke`，再缺省则 **`strict`**）。

| 值 | 行为 |
|---|---|
| **`strict`** | **控制器主动**开 Task/子代理调起绑定 skill；父会话贴指针后停在调度，等子 skill 结束再进步骤 5。**仅当宿主无法开子代理**时，才退回「请用户新会话点名 + 复制指针卡片」。`run_mode=unattended` 时须已降为 `inline`，禁止卡在「请开新会话」。 |
| **`inline`** | **控制器主动**在同会话执行：贴指针卡片 → 明示「本段戴厨师帽」→ 只写领域产物 → 结束回报路径列表 → **仍由 advance 写 progress/links** |

两种策略下控制器都**不**代写领域正文（`chef_mode=controller_proxy` 的显式兼代除外）。用户不是默认路由器；`inline` 不是「调度员进厨房写业务」的许可证。写盘权责见 [SKILL.md](../../SKILL.md)。

### 厨师模式 `chef_mode`（O1）

读自本主题 `progress.chef_mode`（`start` 写入；合法值 **`bound`** | **`controller_proxy`**）。

| 值 | 含义 |
|---|---|
| **`bound`** | 路径所需绑定 skill 当前宿主可调起；控制器只调度，厨师写领域产物 |
| **`controller_proxy`** | 关键绑定 skill 不可调起（未安装 / 宿主无法点名）；**显式降级**：控制器兼代厨师角色落盘产物，并在 `回链.md` 写明。须先警告用户，禁止静默兼代 |

探测时机：`start` 步骤「绑定就绪检查 + chef_mode 探测」；预检 C 失败且用户坚持继续 Full → 强制 `controller_proxy`。lookup 预检 C 在 `bound` 下仍适用（单环缺失仍阻断或再提示）。无厨师跑 Full 的最小清单见 [QUICKSTART.md](../../QUICKSTART.md)。

### Proto 轻量降级产物（O12）

当 `proto=entered` 且（`stages.proto.skill` 为 `null` **或** `chef_mode=controller_proxy`）时，**禁止**假装已有可点击原型。官方降级产物：

- 落盘 `设计笔记.md`（主题 runs 根，或路径写入 `artifacts.proto`；骨架 [`templates/设计笔记.md.tmpl`](../../templates/设计笔记.md.tmpl)）
- **必须**含：交互草图 + 主路径 ≥3 步 + 关键状态机/状态枚举
- 闸通过条件见 [gates.md](gates.md)「Proto 轻量降级」——**草图+状态机**即过，**不要求**可点击 HTML
- `bound` 且 proto skill 可调起时：仍优先可打开原型（见 [gates.md](gates.md)）


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
- 本环产物期望: 见 [gates.md](gates.md) Part A「<stage>」勾选（L1）
- 本环语义期望: 见 [gates.md](gates.md) Part B「离开 <stage>」
- 截断/回退: <design|spec 截断或 implement 回退要点>
- 厨师结束请回报: 产物路径列表（勿改 progress.yaml / 回链.md）
```

`strict` 且无 Task 时提示用户复制本卡片到新会话；其余情况由控制器主动调起。

## lookup（每个需子 skill 的环节通用）

### 绑定 skill 可调起（预检 checklist）

调起前**逐项**核对；任一项失败 → **阻断**，把对应失败文案原样贴给用户（可附推荐包替代名）：

| # | 检查 | 失败时复制给用户 |
|---|---|---|
| A | 解析序下绑定文件存在且含 `stages.<环节>` 键（优先 `docs/runs/stage-bindings.yaml`） | 「绑定配置缺失或无此环节键，请运行 feature-eng init 或检查 `docs/runs/stage-bindings.yaml`」 |
| B | `stages.<环节>.skill` 非 `null`、非空 | 「该环节未绑定 skill，请运行 feature-eng init 或 rebind」 |
| C | 绑定 skill **当前宿主可调起**（已安装 / 可点名） | 「绑定 skill `<name>` 当前不可调起（未安装或宿主无法点名）。请安装（须用户同意）或 rebind；推荐包见 `config/stage-bindings.example.yaml`」 |
| D | 若本环为 `design`/`spec` 且与同 skill 多环：已读截断契约并写入指针卡片 | 「缺少 design/spec 截断指令：见 [config/truncate-contracts.yaml](../../config/truncate-contracts.yaml) 与下节『同 skill 多环』」 |
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
   另附：本环截断/回退指令（见下节「同 skill 多环」与「implement 回退」；机读 [config/truncate-contracts.yaml](../../config/truncate-contracts.yaml)）
   若 stages.<环节> 含 input_contract：把必传字段一并写入指针卡片
5. 子 skill 结束后：收取「产物路径列表」→ 进入 [advance.md](../advance.md)
   （L1 → L2 → 硬闸 → 写盘 → handoff_policy 调下一环）
```

完成标准：预检通过；子 skill 跑完并回报路径；父会话在 advance 中做 L1/L2。越界判定见 SKILL.md。

## 同 skill 多环（brainstorming × design / spec）

`design` 与 `spec` 推荐都绑 `brainstorming`（Superpowers 无独立 writing-specs）。调起时**必须**附加截断指令，避免一口气写到 plan。

**机读契约（SSOT）**：[config/truncate-contracts.yaml](../../config/truncate-contracts.yaml)（`stages.design` / `stages.spec` 的 allow/forbid；lookup 预检 D 项）。**勿在本页维护第二份 allow/forbid 表**——改契约只改 yaml。

域定稿（ADR / `术语增量.md`）仅在 `domain=entered` 时走 `domain` 绑定，不由 brainstorming 代做；默认经 [bridges.md](bridges.md) 跳过。禁止写仓库根 `CONTEXT.md`。

`run_mode: express` 时 grill+design 可同轮产出，但仍须一次总确认后才由 advance 写 `shared_understanding` + `design_confirmed`；随后仍跑 domain-bridge（多数 skipped）→ spec；spec 与 plan **仍分环**（见 [start.md](../start.md)）。

## implement 回退（与 Superpowers 同款询问）

1. 读绑定：推荐为 `subagent-driven-development`。
2. 调起前向用户确认（可短问）：
   - **优先**：有子代理能力 → `subagent-driven-development`
   - **其次**：无子代理或用户选择 → `executing-plans`
3. 用户也可指定其他实现类 skill（须已装或同意安装）。
4. 选定后写入本轮会话选用；**不**因单次选择改 yaml（改默认用 rebind）。
5. 实现 skill 内部的 TDD / review 由其自行决定；控制器按 [gates.md](gates.md)（L1 + L2）校验。

### 宿主 commit 策略（Global）

默认 **不**自动 `git commit`。plan / 实现类 skill 文中「每任务 commit」视为 **optional / 需用户授权**。用户未显式要求 commit 时，跳过并在回报里注明「未 commit（宿主策略）」。`defaults.commit_policy` 见 example yaml（`user_authorized` | `follow_plan`）。

## 临时覆盖

默认**不允许**「本次任务静默换 skill」。确需换默认：先 `rebind`。单次 `implement` 在 SDD / executing-plans 间选择属上节允许的询问，不算污染全局映射。  
单次改 `invoke` / `handoff_policy` / `review_policy`：问用户后只改本主题 progress，不改 yaml。

## 仅 F 环节

`testdesign` / `verify` 的调起时机由路径裁剪决定（SSOT 见上文 Part A）；init 时仍建议预绑，避免 Full 主题跑到一半才发现未绑。

## input_contract（可选）

`stages.<环节>` 可带 `input_contract`（必传字段名列表）与 `output_hint`（期望产物路径模式）。lookup 步骤 4 写入指针卡片，减少薄 skill 发挥空间。未配置则不加字段，不阻断。
