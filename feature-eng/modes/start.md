# start — 新主题开工

## 前置

- 无 `config/stage-bindings.yaml` → 硬闸：先走 [init.md](init.md)（含推荐包首问）。
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
2. **绑定就绪检查 + chef_mode 探测**：读 `stage-bindings.yaml`。按即将分诊的路径，标出关键环若为 `null` 的缺口（见下表）。有缺口 → **红字提示**（失败文案见 [binding.md](binding.md)「绑定 skill 可调起」预检 A/B），建议先 `rebind`/`init`；用户坚持继续则仅能跑到第一个未绑环前。首个执行环调起前再跑完整预检 A–E。
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
   - 本仓为 web 且声明了 api sibling → 后续 Spec 须有「消费契约」小节或链接（闸见 [gates-common.md](gates-common.md)）。
   - 未提配对 → `sibling_repos: null` 即可。
6. **仪式选项（可与分诊同屏确认）**：
   - **`run_mode`**：`guided`（默认）| `express`
   - **`invoke`**：`strict`（默认）| `inline`（见 [binding.md](binding.md)）。缺省可跟 `defaults.invoke`。
   - **`handoff_policy`**：`auto` | `confirm`。未指定时：`express`→`auto`，`guided`→`confirm`。
   - **`review_policy`**：`subagent`（默认）| `inline`。
   - **review_policy 宿主探测（O5）**：若用户选/默认 `subagent`，但宿主 **无 Task/子代理能力** → **自动降级**为 `inline`，并在 `回链.md`「仪式与降级」与门禁备注写明「review_policy: subagent→inline（宿主无 Task）」——**禁止静默改值**。
7. **建过程态**：
   - 确保 `docs/runs/active/`（及可选 `docs/runs/README.md`，可用 `templates/runs-README.md.tmpl`）
   - 创建 `docs/runs/active/<slug>/`
   - 写 `progress.yaml`（自 `templates/progress.yaml.tmpl`；写入已探测的 `chef_mode` / 可能降级后的 `review_policy` / 可选 `sibling_repos`）
   - 写 `回链.md`（自 `templates/回链.md.tmpl`；同步 chef_mode / review_policy 降级备注 / 跨仓表）
   - 可选：在 `docs/runs/README.md` 进行中表插入一行
8. **登记索引**（仅 F，或用户要求登记时）：`docs/superpowers/README.md` 进行中表按日期倒序插入主题行（Spec/Plan 列先 `—`，环 4/5 产出后回写）。无 README 则跳过并说明。
9. **进入下一环**：**控制器主动**按 [binding.md](binding.md) lookup 调起首个执行环。若 `chef_mode=controller_proxy`，本环由控制器戴厨师帽产出领域产物，仍经 advance 写盘。若 `handoff_policy=confirm`，先短确认卡片再调起。用户声称本环完成 → [advance.md](advance.md)。

## grill 补充（O8）

澄清环若用户**新**提及配对仓，而 progress 仍 `sibling_repos: null` → advance 离开 grill 前须补填至少一条，并回写「跨仓」节。

## `express` 硬边界

**不跳过**：分诊确认、开干闸、Pre-Impl、Verify（F）、Close。  
**可压缩**：grill+design 同轮；共享理解闸 + 设计确认闸可用**一次总 yes**。  
**仍分环**：spec 与 plan；design 后仍跑 **domain-bridge**；proto 桥规则不变。  
**编排**：默认 `handoff_policy=auto`。

## 硬闸

- 用户未确认分诊前，禁止创建 runs 目录与调起任何子 skill。
- 控制器只建目录与模板文件；澄清/设计正文由子 skill 产出（`chef_mode=bound`）。`controller_proxy` 时须已警告用户，兼代产出仍经 advance 写 progress/回链。
- 换绑走 rebind；implement 回退询问见 [binding.md](binding.md)。
- 仪式字段写入后本主题沿用；中途改须用户显式确认并只改 progress。
- `review_policy` 因宿主能力降级必须落盘备注，禁止静默。
- empty-ish 仓不得假装已有业务骨架；须先本地脚手架（见步骤 1）。
- 用户已提跨仓配对却未填 `sibling_repos` → 不得宣称 start/grill 完成。
