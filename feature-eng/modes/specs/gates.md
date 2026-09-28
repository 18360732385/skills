# gates — 环间 L1 / L2 / 硬闸

环间 **L1（形状）** + **L2（语义）** + 硬闸（原 artifacts + gates-review + gates-common）。环节/绑定见 [flow.md](flow.md)。  
**消歧**：此处 L1/L2 **≠** 工程化仓阶梯 L1/L2（契约骨架 / 知识回流）。环 5「计划 Go 闸」**≠** 仓库开干（`ai_coding_ready`）。

## Part A — 产物契约（环间 L1）


本页 = **环间 L1 机械/形状**勾选。语义必过项见下文 Part B（**环间 L2**）。`advance` 须 **L1 ∧ L2**（适用时）都过才推进。

控制器校验时：**只 Read 当前 `progress.stage` 对应一节**（不要整页通读）。

通过条件（L1）：该节每一项均为 ✓（文件存在、字段非空、或链接可打开）。缺任一项 → 不过，并列缺失项。闸通过条件仍见下文 Part C。

**主题根**：进行中为 `docs/runs/active/<slug>/`；收口后为 `docs/runs/archive/<slug>/`。下文 `runs/…` 均指当前主题根。

**回写规则**：写入 `progress.yaml` / `回链.md` / `artifacts.*` / gates.* 均由 **advance（或 start/close/handoff/proto-bridge/domain-bridge）** 执行；子 skill 只产出领域文件并**回报路径**；L2 审核只写 `审核-<stage>.md`。

**键 ↔ 文件**：`artifacts.context_delta` → 主题根 `术语增量.md`（历史英文名 `context-delta.md` 已弃用，见 CHANGELOG 0.2.1 脚注）。模板：[`templates/术语增量.md.tmpl`](../../templates/术语增量.md.tmpl)。

---

## triage（环 0）

- [ ] `docs/runs/active/<slug>/progress.yaml` 存在
- [ ] `path` 为 `spike|bounded|full`（用户已确认后写入）
- [ ] `run_mode` 为 `guided|express|unattended`；`invoke` 为 `strict|inline`
- [ ] `handoff_policy` 为 `auto|confirm`；`review_policy` 为 `subagent|inline`
- [ ] 若 `run_mode=unattended`：回链「仪式与降级」含集中降级备注；硬闸 `authorized_by` 为 `user_task_<id>` 或 `policy_exception`
- [ ] `chef_mode` 为 `bound|controller_proxy`（start 探测后写入）
- [ ] `sibling_repos` 为 `null` 或非空列表（用户提跨仓配对时非空；见 O8）
- [ ] `layout` 为 `null|monorepo|multi_repo`；`packages` 为 `null` 或 `[{ path, role: api|web|other }]`；`docs_root` 默认 `docs/`（M1）
- [ ] 若 `layout=monorepo`：`packages` 建议非空；**禁止** sibling_repos 指向与 packages 同仓同路径
- [ ] `stage` 已设
- [ ] `docs/runs/active/<slug>/回链.md` 存在

## grill（环 1）

- [ ] 用户显式确认可进设计（同义可）→ advance 写 `gates.shared_understanding`
- [ ] 若产出术语/ADR 草稿：厨师回报路径 → advance 写入 `回链.md`（无草稿则注明「本环无落盘」）；**禁止**写仓库根 `CONTEXT.md`
- [ ] 若用户提到配对后端/前端：`sibling_repos` 至少一条，且回链「跨仓」节已填（O8）
- [ ] 若确认同仓 FE+BE：`layout=monorepo` + `packages` + 回链「同仓布局」已填（M1）
- [ ] `express`：可与 design 同轮；总确认一次即可同时满足本项与 design 的确认项

## design（环 2）

- [ ] 用户显式 yes（B：短设计一次；F：整体一次，或分段清单每段一次；`express`：与 grill 合并的一次总 yes）→ advance 写 `gates.design_confirmed`
- [ ] 设计确认摘要可指认：聊天结论复述，或 `设计笔记.md` 非空
- [ ] → 通过后进入 [bridges.md](bridges.md)（勿直接假定进 domain）

## domain-bridge（环 2→3）

- [ ] `domain` 为 `skipped|skipped_by_user|entered` 之一（控制器写入）
- [ ] 结论块已向用户展示（见 domain-bridge）；`skipped` 可推翻、非强制二选一
- [ ] `skipped` / `skipped_by_user` 时 progress 或 `回链.md` 有一句理由
- [ ] `entered` 时下一 stage 为 `domain`；否则 F→`spec`（B 按裁剪表）

## domain（环 3，仅 `domain=entered`）

- [ ] 若有不可逆决策：至少 1 个 ADR 路径在 `artifacts.adr`（advance 回写），且文件存在于 `docs/adr/`
- [ ] 若改了术语：`术语增量.md` 非空，或 Spec 内术语小节可指认，且 `回链.md` 有指针（advance 回写）
- [ ] **未**将本主题术语写入仓库根 `CONTEXT.md`

## spec（环 4，仅 F）

- [ ] `docs/superpowers/specs/YYYY-MM-DD-<主题>-设计.md` 存在
- [ ] `artifacts.spec` 指向该文件（advance 回写）
- [ ] 文内含可指认的验收标准小节（非空）
- [ ] **跨仓 web（O8）**：若 `sibling_repos` 含 `role=api` 且本仓为 web → Spec 有「消费契约」小节或指向 api Spec/OpenAPI 的链接
- [ ] **同仓 monorepo profile（M3）**：若 `layout=monorepo`（或 packages 含 api+web）→ Spec **单文件**须含可指认章节：
  - [ ] `## API`（或等价「后端 / 接口」）— 含后端路径或声明（如 `backend/src/...`）
  - [ ] `## UI`（或等价「前端 / 页面」）— 含前端路径或声明（如 `frontend/src/...`）
  - [ ] `## 测试矩阵` — 两侧验收/用例映射可指认
  - L1：两侧路径**或**声明至少各一；缺一侧 → 不过 design_confirmed / 不得宣称 Spec 完备
- [ ] **web+auth（O13）**：若 Spec 含登录/鉴权/会话 → 必填会话存储枚举一行：`memory | sessionStorage | localStorage(+风险注)`（默认可建议 `memory` 或 `sessionStorage`；`localStorage` 须风险注）

## plan（环 5）

- [ ] F：`docs/superpowers/plans/*-实施计划.md`（或约定名）存在；`artifacts.plan` 已填（advance）
- [ ] B（若进入）：checklist 或计划文件存在且非空
- [ ] 计划 Go 闸三问已过 → advance 写 `gates.go`（条件见下文 Part C）
- [ ] 计划中「每任务 commit」若存在：视为 optional；未授权则可不执行（见 [flow.md](flow.md) 宿主 commit 策略）

## proto-bridge（环 5→6）

- [ ] `proto` 为 `skipped|skipped_by_user|entered` 之一（控制器写入）
- [ ] 结论块已向用户展示（见 [bridges.md](bridges.md)）；不需要时非强制二选一、可推翻
- [ ] `skipped` / `skipped_by_user` 时 progress 或 `回链.md` 有一句理由
- [ ] 若判定为「本仓无前端但 Spec/Plan 含菜单或页面」或边界模糊：理由须含 **跨仓提示**（若适用）

## proto（环 6，仅 `proto=entered`）

### 标准（bound + proto skill 可调）

- [ ] 可打开的原型或线框（目录/文件路径非空）→ `artifacts.proto`（advance）
- [ ] 主路径交互说明（同目录文档或 `回链.md` 指针）非空
- [ ] 用户「原型确认」已记录（advance 写入 progress / `回链.md` / 或确认原型目录标记）

### 轻量降级（O12：`proto.skill` null 或 `chef_mode=controller_proxy`）

- [ ] 官方降级产物：`设计笔记.md`（或等价路径写入 `artifacts.proto`）存在
- [ ] 含 **交互草图**（ASCII/Mermaid/文字线框均可）
- [ ] 含 **主路径 ≥3 步**
- [ ] 含关键状态机/状态枚举可指认
- [ ] 用户确认已记录；**不要求**可点击 HTML（见下文 Part C O12）

控制器不规定视觉工具。

## testdesign（环 7，仅 F）

落盘 `测试用例.md`（可用 [`templates/测试用例.md.tmpl`](../../templates/测试用例.md.tmpl)）。**每条用例**下列字段均非空：

- [ ] 用例 ID
- [ ] 模块/场景
- [ ] 前置
- [ ] 步骤
- [ ] 数据
- [ ] 期望
- [ ] 优先级
- [ ] 关联需求/任务 ID

文档级：

- [ ] `artifacts.testcases` 已填（advance）
- [ ] Spec 每条验收标准至少映射 1 条用例（覆盖自查勾选）
- [ ] 无单测/实现级用例混入（定位集成测试）

## pre-impl（环 7b）

- [ ] 若 `proto=entered`：环 6 勾选表全过（含 O12 降级条件若适用）
- [ ] F：环 7 勾选表全过
- [ ] B：无 TestDesign 要求；Proto 规则同上
- [ ] **Full+UI（O9）**：`integration_ready` ∈ `cors_ready|proxy_ready|accepted_blocked`（回链或 progress 旁注）
- [ ] **O8**：跨仓 web 消费契约已满足（若适用）
- [ ] → 通过后 `stage=implement`，advance 写 `gates.pre_impl`

## implement（环 8）

### code_complete（本环必过）

- [ ] 本主题相关业务代码已落盘（可指认路径；commit 非必须）
- [ ] 单测已存在，或用户显式接受「本环无单测」→ advance 记入 `回链.md` / progress
- [ ] S 仅 throwaway：笔记路径已记；不要求入库代码

### env_verified / `env_notes`（可选；O4 / O11 / O14）

- [ ] 本机/CI 可编译或关键冒烟通过的证据路径（可选）；未做不阻断本环
- [ ] 未做时 advance 可在 `回链.md` 注明 `env_verified=skipped`
- [ ] **F 路径**：环境证据改在 **verify** 环强制（见下节）
- [ ] 前端：推荐在实现期就把 `api_base_mode` / `pinned_deps` 写入 `env_notes`（verify 再核）

## handoff（环 8b，旁路）

- [ ] `交接.md` 存在且含 path / stage / 已完成 / 未决 / 下一步 / 产物指针（见 [handoff.md](handoff.md)）

## gate（环 9）

- [ ] `门禁清单.md` 存在（或 `回链.md` 指向等价清单）
- [ ] 机械轨已处理（hooks 结果可指认）
- [ ] 语义轨：绑定 review skill 结论无未决 blocker（或 blocker 列表为空）
- [ ] **Full+UI（O9）**：`integration_ready` 仍成立
- [ ] → advance 写 `gates.gate`

## verify（环 10，仅 F）

落盘 `测试报告.md`（可用 [`templates/测试报告.md.tmpl`](../../templates/测试报告.md.tmpl)）：

- [ ] `artifacts.test_report` 已填（advance）
- [ ] **每条** `测试用例.md` 用例有一行结果，且结果为 `pass|fail|blocked` 之一（非空）
- [ ] 凡 `fail` / `blocked`：证据链接非空
- [ ] 汇总：总数 / pass / fail / blocked / 通过率 均非空
- [ ] **环境证据**：至少一项可指认；纯「代码已写」不算过 Verify
- [ ] **`env_notes`（O4/O11/O14/M2/M5）**：
  - 若 runtime ≠ target：含 `runtime` / `target` / `mismatch_reason`
  - 前端：粘贴 **`api_base_mode: proxy|absolute`**（VITE_*/API 基址策略）
  - 若钉了测试 DOM/工具链：`pinned_deps: [{ name, version, reason }]`（如 jsdom@^24）
  - 自检建议：`node -v` 对照 `package.json#engines`；已知坏组合见 VERIFY「Node×jsdom」
  - **同仓多命令（M2）**：若 `layout=monorepo` 或 `verify_commands` 非空 → **每条** `env_notes.verify_commands[]` 须已执行且 **exit 0**，报告中粘贴命令+退出码；缺一不得写 `gates.verify`
  - **workdir（M5）**：`workdir_policy` 缺省/`repo_root` 时，报告与文档中的命令从仓根书写（`mvn -f backend …` / `npm --prefix frontend …` 或文档内一致的 `cd frontend &&`）
- [ ] 无未接受 `fail`，或 `accepted_residual` 已填用户接受说明
- [ ] → advance 写 `gates.verify`

## smoke（环 10′，非 F 可选）

- [ ] 若执行：runs 内有冒烟记录指针；未执行则不阻断

## diagnose（环 10b，按需）

- [ ] 复现笔记路径非空（runs 或 `回链.md`）
- [ ] 先复现再改的结论可指认

## close（环 11）

- [ ] 收口步骤与勾选见 [close.md](../close.md)（含 active→archive）
- [ ] **根 README SSOT（M4）**：若 `layout=monorepo` → 仓库根 `README.md` 含 backend **与** frontend 启动命令；子包 README 仅短链到根（见 close L1）
- [ ] → advance/close 写 `gates.close`；`stage=done`；主题目录在 `docs/runs/archive/<slug>/`

## env_notes（O4 + O11 + O14 + M2 + M5，伴生字段）

当 `env_verified` 非 null 且运行时工具链 ≠ 项目声明目标时，`progress.env_notes` 须含：

- `runtime`：实际运行版本（如 OpenJDK 21 / Node 20.11）
- `target`：声明目标（如 `pom.xml` `java.version=17` / `engines.node`）
- `mismatch_reason`：差异原因（如 apt 无对应包）

前端扩展（与 O4 同字段，勿另开平行结构）：

- `api_base_mode`：`proxy` | `absolute`（O14；verify 清单要求粘贴）
- `pinned_deps`：`[{ name, version, reason }]`（O11；如钉 jsdom 避开 Node20×jsdom30）

同仓扩展：

- `verify_commands`：`string[]`（M2；monorepo 双端验收命令；每条 exit 0 才允许 `gates.verify`）
- `workdir_policy`：`repo_root`（M5；monorepo 默认；文档命令从仓根书写）

同步在 `回链.md`「其他」写一行。无差异且无前端基址/钉依赖/多命令时可 `env_notes: null`。

## layout / packages / docs_root（M1，伴生字段）

- `layout`：`monorepo` | `multi_repo` | `null`（缺省≈`multi_repo`）
- `packages`：`[{ path, role: api|web|other }]` 或 `null`；同仓 FE+BE 时填写
- `docs_root`：默认 `"docs/"`（典礼在仓库根，勿放子包）
- **冲突禁令**：`layout=monorepo` 时，`sibling_repos` 不得指向与 `packages[].path` 同仓同路径（用 packages，勿伪跨仓）
- 回链「同仓布局」节同步。形状由 selfcheck 夹具覆盖。

## sibling_repos（O8，伴生字段）

可选列表：`[{ url, role: api|web, spec_path }]`。用户提跨仓配对时强制非空；回链「跨仓」节同步。形状由 selfcheck 夹具覆盖。与 M1 冲突禁令见上。


---

## Part B — 环间 L2 语义审核


本页是 **L2 语义闸**标准。形状勾选见上文 Part A（**L1**）。`advance` 须 **L1 ∧ L2** 都过才写盘推进（桥类环节见下例外）。

控制器只调度审核、读结论；**不**让审核员代写 `progress.yaml` / 改领域正文。

主题根：`docs/runs/active/<slug>/`。

## 调起方式（`progress.review_policy`）

| 值 | 行为 |
|---|---|
| **`subagent`**（默认） | 开 Task/子代理；只传产物路径 + 本页当前离开环节节 + 禁止清单。无 Task → **自动降级** `inline`，且须在 `回链.md`/门禁写明（见 [start.md](../start.md)、下文 Part C；禁止静默） |
| **`inline`** | 本会话换「审核帽」：只读标准与产物，不写业务 |

## 审核输入（指针）

```text
【L2 审核指针】
- slug / runs: docs/runs/active/<slug>/
- 离开环节: <stage 中文名 + 英文键>
- 产物路径: <厨师回报列表>
- 标准: gates.md Part B「离开 <stage>」节
- 禁止: 改 progress.yaml / 回链.md / 改 Spec·Plan·代码正文；仅可写 审核-<stage>.md
```

## 审核输出（固定）

落盘 `docs/runs/active/<slug>/审核-<stage>.md`（**stage 用英文键**，如 `审核-spec.md`）：

```markdown
# L2 review — <stage> — <slug>

- result: pass | fail
- summary: …
- defects:（fail 时逐条；pass 可空）
  - …
```

`回链.md` 由 advance 回写该路径。`result=fail` → advance **不**推进 stage。

## 离开各环：语义必过项

审核员只 Read 本离开环对应小节。

### 离开 grill

- [ ] 共享理解足以进入设计（核心未决已清空或显式推迟）
- [ ] 若有术语/ADR 草稿：路径可指认且未写入仓库根 `CONTEXT.md`

### 离开 design

- [ ] 用户确认范围覆盖已选方案关键点
- [ ] 未越界落盘 Spec / 调起 writing-plans / 写业务代码

### 离开 domain（仅 `domain=entered`）

- [ ] 若有 ADR：确属不可逆/边界级
- [ ] 若有术语：`术语增量.md`（或 Spec 术语节）与设计一致；**未**写根 `CONTEXT.md`

### 离开 spec（仅 F）

- [ ] 验收标准可测
- [ ] 与设计确认结论一致

### 离开 plan

- [ ] 计划 Go 三问语义成立
- [ ] 任务拆分可支撑实现

### 离开 proto（仅 `proto=entered`）

- [ ] 主路径交互可走通
- [ ] 用户原型确认可指认

### 离开 testdesign（仅 F）

- [ ] Spec 验收映射覆盖成立
- [ ] 无单测/实现级步骤冒充集成用例

### 离开 implement

- [ ] 落盘代码范围与本主题一致
- [ ] 单测存在，或「无单测」接受记录可指认

### 离开 gate

- [ ] 语义轨无未决 blocker

### 离开 verify（仅 F）

- [ ] 用例结论与证据匹配
- [ ] 环境证据真实可指认

## 桥类与闸类例外

| 环节 | L2 |
|---|---|
| `triage` / `domain-bridge` / `proto-bridge` / `pre-impl` / `handoff` | 无完整 L2 |
| 用户硬闸 | L2 pass 后仍须短确认卡片 |

## 硬约束

- 审核员不得推进 `stage`、不得写 gates 时间戳。
- 伪造 `审核-*.md` 的 pass = 跳过硬闸，禁止。
- L1 未过则不必跑 L2。


---

## Part C — 各环硬闸


> 闸概念聚拢：绑定闸定义在 [flow.md](flow.md)（lookup 缺失/未安装 → 阻断）；本页收其余各闸。每闸 = **通过条件** + **失败时行为**。  
> **L1** 形状：上文 Part A；**L2** 语义：上文 Part B。advance 适用时须 L1∧L2；用户硬闸另需短确认卡片。控制器只校验/调度、不代做领域工作、**不替用户 yes**。

## 用户硬闸短确认卡片（模板）

凡需用户显式确认的闸，贴出后等待，不得静默通过：

```text
【硬闸确认 · <闸名>】
依据：…
请回复：确认 / 返工：…
```

进入下一环且 `handoff_policy=confirm` 时，用同款短卡片（「进入〈中文名〉…」）。

## 硬闸授权 `authorized_by`（O3）

凡用户硬闸（分诊 / 共享理解 / 设计确认 / 计划 Go / Pre-Impl / Gate / Verify / Close 等需显式确认者），在 `回链.md`「硬闸授权」表记录：

| 合法取值 | 含义 |
|---|---|
| `user_chat` | 本会话真实用户确认（短确认卡片回复） |
| `user_task_<id>` | 任务级授权码（如 `user_task_2026-09-21`）；批量/无人值守任务用此，**不**伪造聊天 |
| `policy_exception` | 策略例外（须在备注写清依据） |

**禁止**：把「看起来像对话」的假 transcript / 占位笔录（含伪造的「用户：确认」多轮对话）写入授权证据。校验器 / selfcheck / `scripts/gate-evidence.mjs` 拒绝此类占位。  
**禁止自造** `user_task_fixture|auto|todo|placeholder|test|dummy` 等占位 id；`user_task_<id>` 须来自用户或任务跑批真实 id。

**证据机检（0.2.11）**：凡 `progress.gates.<name>` 为 ISO，回链本表须有对应行且 `authorized_by` 合法；下列闸另须主题根存在审核文件且含 **`result: pass`**（`fail` 不得推进）——`shared_understanding`→`审核-grill.md`，`design_confirmed`→`审核-design.md`，`go`→`审核-plan.md`，`gate`→`审核-gate.md`，`verify`→`审核-verify.md`。`triage` / `pre_impl` / `close` 不要求完整 L2 文件，但仍要合法授权。`policy_exception` 不豁免 L2 pass。`controller_proxy` 不豁免；proxy 且存在任一 ISO gate 时回链「仪式与降级」须非空。

## review_policy 降级备注（O5）

`start` 若将 `review_policy` 从 `subagent` 降为 `inline`（宿主无 Task），须在本主题 `回链.md`「仪式与降级」与门禁清单写明，**禁止静默**。L2 仍按上文 Part B 执行。

## 跨仓契约闸（O8）

适用：`progress.sibling_repos` 非空，且本仓条目（或唯一条目）`role=web`，并声明了至少一条 `role=api` 的 sibling。

- **通过**：Spec（`artifacts.spec`）内有可指认的 **「消费契约」** 小节，**或** 明确链接到 api sibling 的 Spec/OpenAPI（路径或 URL 非空）。回链「跨仓」表已填。
- **失败**：列缺失；不得过 Shared Understanding 后假装契约已对齐；不得进 Pre-Impl（F+跨仓 web）。

## 同仓 layout / Spec 章节闸（M1 / M3）

适用：`progress.layout=monorepo`，或 `packages` 同时含 `role=api` 与 `role=web`。

- **M1**：`packages` 已填；`docs_root` 默认 `docs/`；**禁止** `sibling_repos` 指向与 `packages[].path` 同仓同路径。
- **M3**：单 Spec 含可指认 `## API` / `## UI` / `## 测试矩阵`（或等价标题）；两侧路径或声明至少各一。
- **通过**：上述 L1 勾选成立（见上文 Part A spec 节）。
- **失败**：缺章节或仅一侧 → 不得写 `gates.design_confirmed` 完备宣称；F 路径不得进 Pre-Impl 假装双端已设计。

## 联调矩阵 CORS / Dev Proxy（O9）

适用：**Full + UI**（本仓有前端树，或 `sibling_repos` 含 web，或 Spec 含页面/联调）。在 **Pre-Impl** 与 **Gate** 检查 `integration_ready`（可写 progress 旁注或 `回链.md`「其他」）：

| 取值 | 含义 |
|---|---|
| `cors_ready` | 后端 CORS 已配（如 Spring `CorsConfigurationSource`）且可被浏览器直连验证 |
| `proxy_ready` | 前端 Dev Proxy 已配（如 Vite `server.proxy['/api']`）且同源联调可通 |
| `accepted_blocked` | 联调暂不可用；用户显式接受残留（须写入 `accepted_residual` / 回链备注） |

- **通过**：三者之一已记录。
- **失败**：sibling 后端 CORS 未就绪 **且** 前端未配 proxy，又无 `accepted_blocked` → Pre-Impl/Gate 失败。
- Snippet 见 [QUICKSTART.md](../../QUICKSTART.md)「CORS 或 Dev Proxy」。

## Proto 轻量降级通过条件（O12）

适用：`proto=entered` 且（`stages.proto.skill` 为 null **或** `chef_mode=controller_proxy`）。

- **通过**：`设计笔记.md`（或 `artifacts.proto` 指向的等价笔记）含 **交互草图** + **主路径 ≥3 步** + 关键状态机/状态枚举可指认。**不要求**可点击 HTML。
- **失败**：仅有空标题或口头描述无落盘 → 不过 proto 闸。
- `bound` 且 proto skill 可调起时：仍按上文 Part A proto 节（可打开原型优先）。

## 分诊闸（环 0）

- 通过：Agent 提议 S/B/F 并给依据；用户显式确认其一（短确认卡片）。
- 失败：停在 start；不得创建 `runs/` 下游产物。

## 共享理解闸（环 1 末）

- 通过：L1+L2（离开 grill）过；用户显式确认可进设计（同义可）；advance 写 `gates.shared_understanding`。若用户已提跨仓配对 → `sibling_repos` 至少一条。
- 失败：继续澄清；不得进环 2。
- `express`：可与设计确认闸合并为**一次总 yes**（同时写两闸时间戳）；仍须用户显式确认，不得默认静默通过。

## 设计确认闸（环 2 末）

- 通过：L1+L2（离开 design）过；B = 短设计获用户显式 yes；F = 整体或每段 yes；`express` = 与 grill 合并的一次总 yes。advance 写 `gates.design_confirmed`。
- 失败：回到设计；不得进定稿桥 / spec。
- 通过后 → 跑 [bridges.md](bridges.md)（默认常 skipped，再进 spec 或 domain）。

## 定稿桥（环 2→3）

- 规则见 [bridges.md](bridges.md)；桥本身不写 ADR，只决定 `domain=skipped|skipped_by_user|entered`（展示结论可推翻）。结束后按 `handoff_policy` 主动进下一环。

## 计划 Go 闸（环 5 末，计划侧）

- 通过：L1+L2（离开 plan）过；三问语义成立：①任务依赖无环 ②契约变更已列入首批 ③每任务有可测验收；用户短确认（若尚未在 plan 审中显式 yes）。写 `gates.go`。
- 失败：补 plan；不得进 Proto 桥。
- **≠** 仓库开干（`ai_coding_ready`；工程化仓口径）。

## Proto 桥（环 5→6）

- 规则见 [bridges.md](bridges.md)；决定 `proto=*`（展示结论可推翻；需 UI 须显式同意）。结束后按 `handoff_policy` 主动进下一环。

## Pre-Impl 闸（环 7b）

- F 通过：上文 Part A 中 proto（若 entered）与 testdesign 两节 L1 勾选全过；testdesign/proto 适用时 L2 已过；适用时 O8 消费契约 / O9 联调矩阵 / M3 monorepo Spec 章节已满足。
- B 通过：proto（若 entered）勾选全过；**无** TestDesign 要求；适用时 O9 同上。
- 失败：停；按勾选表列缺失项；不得进环 8。
- 通过后按 `handoff_policy` 主动调起 implement。

## Gate 闸（环 9）

- 通过：上文 Part A gate 节 L1 全过 + L2（离开 gate）过（机械轨 + 语义轨无未决 blocker）；Full+UI 时 O9 `integration_ready` 仍成立（或 `accepted_blocked`）。
- 失败：回环 8 修；不得进环 10 / 10′。

## Verify 闸（环 10，仅 F）

- 通过：上文 Part A verify 节 L1 全过 + L2（离开 verify）过（含每条用例结论与残留规则）；`env_notes` 适用时含 `api_base_mode`（O14）与必要的 `pinned_deps`（O11）。
- **M2**：若 `layout=monorepo` 或 `env_notes.verify_commands` 非空 → **每一条** verify_commands 已 exit 0（报告可指认），缺一不得写 `gates.verify`。
- **M5**：命令按 `workdir_policy`（默认 `repo_root`）从仓根书写。
- 失败：进环 10b 排障（先复现再改），修完回本环复测失败项。

## Close 闸（环 11）

- 通过条件正文见 [close.md](../close.md)（skill 内收口规则；契约目录 / pitfalls lint 为可选增强）。
- 失败：列缺项；不得宣称交付。
