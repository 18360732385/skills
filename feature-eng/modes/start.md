# start — 新主题开工

## 前置

- 绑定解析序见 [init.md](init.md)：优先 `docs/runs/stage-bindings.yaml`；无则回退技能包 `config/stage-bindings.yaml`（须注明回退）；二者皆无 → 硬闸：先走 [init.md](init.md)。
- 已有未完成 `docs/runs/active/<slug>/` 且用户意图是续跑 → 转 [resume.md](resume.md)。

## 步骤

1. **repo_bootstrap 预检（空仓 / SCM 400 / 非空目录脚手架）**：探测目标仓是否「几乎空」。
   - **判定**：远程/工作区除 GitHub 模板文件外无业务骨架 → 视为 **empty-ish**。模板文件典型：`LICENSE`、`LICENSE.*`、`.gitignore`、可选 `README.md`（仅徽章/占位、无业务说明）。**GitHub 模板文件 ≠ 业务骨架**。
   - **empty-ish 时**：Cloud Agent / SCM 常对空仓报 **400**；指引改为 **本地脚手架 → 首批业务文件 commit → push**，再继续 feature-eng。不得假装「已有工程」而跳过脚手架。
   - **绿地前端 / 非空目录（O10）**：若根目录**仅有** VCS（`.git`）/ `LICENSE*` / `.gitignore`（及可选占位 README）且 **无 `package.json`**，而用户要起 Vite/Next 等脚手架：
     - **勿**直接在仓根跑 `npm create vite@latest .`（工具常因目录非空而 cancelled）。
     - **提示**临时目录配方（完整见 [QUICKSTART.md](../QUICKSTART.md)「绿地前端」）：`scaffold_dir=$(mktemp -d) && npm create vite@latest "$scaffold_dir" -- --template <tpl> && cp -a "$scaffold_dir"/. .`
     - init/start **提示配方**，不要只报「目录非空」就失败。
   - **非 empty-ish**：正常继续。预检结论可写入 `回链.md`「其他」一行。
1b. **eng_probe（软·不阻断）**：只读探测仓库工程化状态；**禁止**因结果拒绝 start / 分诊。
   - 探测序：① `docs/harness-eng/harness-meta.yaml` ② 无则遗留 `.cursor/harness-meta.yaml`。二者皆无 → **静默跳过**（零噪音）。
   - **有 meta** → 尝试读 `docs/harness-eng/run-latest.json`、同目录 score/report JSON，或 `report-latest.html` 内嵌的 `ai_coding_ready`（有则 YES/NO，找不到则「未知」）。对用户展示短块后继续：
     ```text
     【工程化探测】（软·不阻断）
     - meta: 有
     - 仓库开干 ai_coding_ready: YES | NO | 未知
     - 提示：NO/未知时可先工程化打分（fill-score / refresh-score），或继续本主题（独立模式）
     ```
   - 结论写入 `回链.md`「仪式与降级」一行：`eng_probe: meta=有 · ai_coding_ready=…`（无 meta 时不写）。读侧：无 `eng_probe` 时可认旧键 `harness_probe`。
2. **绑定就绪检查 + chef_mode 探测**：按解析序读绑定（优先目标仓 `docs/runs/stage-bindings.yaml`）。按即将分诊的路径，标出关键环若为 `null` 的缺口（见下表）。有缺口 → **红字提示**（失败文案见 [flow.md](specs/flow.md)「绑定 skill 可调起」预检 A/B），建议先 `rebind`/`init`；用户坚持继续则仅能跑到第一个未绑环前。首个执行环调起前再跑完整预检 A–E。
   - 任意路径常用：`grill` / `design`（按需）  
   - B/F：`implement`、`review`；条件 `proto` / `domain`（仅 entered 时才调起）  
   - **仅 F**：`spec`、`plan`、`testdesign`、`verify` 不应为 null（否则 Full 跑不通）
   - **chef_mode**：对路径所需非 null 绑定 skill 做「当前宿主可调起」探测（预检 C）。
     - 全部可调 → 写 `chef_mode: bound`
     - 任一关键绑定不可调 → **强制** `chef_mode: controller_proxy`，**红字警告**：「绑定厨师 skill 不可调起，将以控制器兼代（controller_proxy）；边界易糊，见 QUICKSTART『无厨师也能跑完 Full』」。不得静默兼代。
3. **定 slug**：`YYYY-MM-DD-<主题短名>`（中文可；与 superpowers 文件命名一致）。
4. **分诊**：读需求描述 + 仓库现状，提议 S/B/F 并给依据（改动面、是否新子系统、是否改公共接口、是否需 ADR）。**用户确认**其一。
5. **跨仓配对探测（O8 sibling_repos）**：若用户提到「配对后端 / 配对前端 / 跨仓 API / sibling」等：
   - **强制**在 `progress.sibling_repos` 填至少一条 `{ url, role: api|web, spec_path }`（`spec_path` 可先占位，spec 环后回写）。
   - 在 `回链.md`「跨仓」节展示同表。
   - 本仓为 web 且声明了 api sibling → 后续 Spec 须有「消费契约」小节或链接（闸见 [gates.md](specs/gates.md)）。
   - 未提配对 → `sibling_repos: null` 即可。
5b. **同仓布局探测（M1 layout / packages）**：若仓根同时有 `backend/`+`frontend/`（或用户声明 monorepo）：
   - 写 `layout: monorepo`；`packages: [{ path, role: api|web|other }]`（至少 api+web 各一为宜）；`docs_root: "docs/"`（默认）。
   - 回链「同仓布局」节同步。
   - **禁止** `sibling_repos` 指向与 `packages[].path` **同仓同路径**（伪跨仓）；同仓包只用 `packages`。真跨仓另仓仍可用 sibling_repos。
   - 非同仓 → `layout: null`（≈ multi_repo）或显式 `multi_repo`；`packages: null` 即可。
5c. **monorepo_bootstrap 剥离（M6）**：合并旧双仓树 / `cp` 进 monorepo 时，检查并**剥离**子包级 `docs/runs`、`docs/superpowers`（典礼只留仓库根 `docs_root`）。可选在根 `docs/HISTORY-split-repos.md` 记旧仓指针。清单勾选见 init「monorepo_bootstrap」。
6. **仪式选项（可与分诊同屏确认）**：
   - **`run_mode`**：`guided`（默认）| `express` | **`unattended`**（无人值守 / 批跑；见下）
   - **`invoke`**：`strict`（默认）| `inline`（见 [flow.md](specs/flow.md)）。缺省可跟 `defaults.invoke`。
   - **`handoff_policy`**：`auto` | `confirm`。未指定时：`express`/`unattended`→`auto`，`guided`→`confirm`。
   - **`review_policy`**：`subagent`（默认）| `inline`。
   - **`unattended` 集中降级（须一次性落盘备注）**：若用户选 / 任务声明 `run_mode: unattended`：
     1. `invoke: strict` → **`inline`**（禁止卡在「请开新会话点名」）
     2. `review_policy: subagent` → **`inline`**（无 Task 亦可）
     3. `handoff_policy` → **`auto`**
     4. 硬闸 `authorized_by` **必须**为真实 `user_task_<id>`（任务码）或显式 `policy_exception`；**禁止**伪造 `user_chat` 笔录
     5. 回链「仪式与降级」写明上述降级清单；`progress.run_mode: unattended`
   - **review_policy 宿主探测（O5）**：若用户选/默认 `subagent`（且非 unattended 已降），但宿主 **无 Task/子代理能力** → **自动降级**为 `inline`，并在 `回链.md`「仪式与降级」与门禁备注写明「review_policy: subagent→inline（宿主无 Task）」——**禁止静默改值**。
   - **`close_pitfalls`（有 lint 脚本时收紧）**：
     - 探测目标仓是否存在 `scripts/agent-kb/lint-pitfalls.mjs`（或团队文档注明的等价路径）。
     - 用户本轮**显式**指定 `off|optional|on` → 以用户为准，写入 `progress.close_pitfalls`。
     - 否则：若**有** lint 脚本 → 写 `progress.close_pitfalls: on`，回链「仪式与降级」注明「有 lint-pitfalls → on」；若**无** → 跟 `defaults.close_pitfalls`（缺省 `optional`），可不写 progress 字段。
7. **建过程态**：
   - 确保 `docs/runs/active/`（及可选 `docs/runs/README.md`，可用 `templates/runs-README.md.tmpl`）
   - 创建 `docs/runs/active/<slug>/`
   - 写 `progress.yaml`（自 `templates/progress.yaml.tmpl`；含 `schema: topic-run/1`；写入已探测的 `chef_mode` / 可能降级后的 `review_policy` / 可选 `close_pitfalls` / `sibling_repos` / `layout`·`packages`·`docs_root`）。旧主题缺 `schema` 仍合法。
   - 写 `回链.md`（自 `templates/回链.md.tmpl`；同步 chef_mode / review_policy 降级备注 / eng_probe / close_pitfalls 收紧备注 / 跨仓表 / 同仓布局）
   - 可选：在 `docs/runs/README.md` 进行中表插入一行
8. **登记索引**（仅 F，或用户要求登记时）：`docs/superpowers/README.md` 进行中表按日期倒序插入主题行（Spec/Plan 列先 `—`，环 4/5 产出后回写）。无 README 则跳过并说明。
9. **进入下一环**：**控制器主动**按 [flow.md](specs/flow.md) lookup 调起首个执行环。若 `chef_mode=controller_proxy`，本环由控制器戴厨师帽产出领域产物，仍经 advance 写盘。若 `handoff_policy=confirm`，先短确认卡片再调起。用户声称本环完成 → [advance.md](advance.md)。

## grill 补充（O8 / M1）

澄清环若用户**新**提及配对仓，而 progress 仍 `sibling_repos: null` → advance 离开 grill 前须补填至少一条，并回写「跨仓」节。  
若澄清中确认同仓 FE+BE，而 `layout` 仍 null → 补 `layout: monorepo` + `packages`，并确认 sibling_repos 未指向本仓包路径。

## `express` 硬边界

**不跳过**：分诊确认、计划 Go 闸、Pre-Impl、Verify（F）、Close。  
**可压缩**：grill+design 同轮；共享理解闸 + 设计确认闸可用**一次总 yes**。  
**仍分环**：spec 与 plan；design 后仍跑 **domain-bridge**；proto 桥规则不变。  
**编排**：默认 `handoff_policy=auto`。

## `unattended` 硬边界

**不跳过**：与 Full/Bounded 路径相同的硬闸与 L1/L2（证据条仍生效）。  
**编排**：见步骤 6 集中降级；过闸后一律按 `handoff_policy=auto` 调下一环。  
**授权**：仅 `user_task_<id>` / `policy_exception`；任务结束须在回链可审计。  
**≠** `express`：express 仍可交互确认；unattended 假定任务预授权，禁止演「用户：确认」假对话。

## 硬闸

- 用户未确认分诊前，禁止创建 runs 目录与调起任何子 skill。
- 控制器只建目录与模板文件；澄清/设计正文由子 skill 产出（`chef_mode=bound`）。`controller_proxy` 时须已警告用户，兼代产出仍经 advance 写 progress/回链。
- 换绑走 rebind；implement 回退询问见 [flow.md](specs/flow.md)。
- 仪式字段写入后本主题沿用；中途改须用户显式确认并只改 progress。
- `review_policy` 因宿主能力降级必须落盘备注，禁止静默。
- empty-ish 仓不得假装已有业务骨架；须先本地脚手架（见步骤 1）。
- 用户已提跨仓配对却未填 `sibling_repos` → 不得宣称 start/grill 完成。
- `layout=monorepo` 且 sibling_repos 指向 `packages[].path` 同仓路径 → 不得宣称 start 完成（改用 packages）。
- monorepo 合并后子包仍残留 `docs/runs|superpowers` → 须先剥离（M6）再继续典礼。
- eng_probe 仅为软提示；`ai_coding_ready=NO|未知` **不得**阻断 start。
