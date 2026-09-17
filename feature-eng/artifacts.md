# artifacts — 产物契约（L1 形状 SSOT）

本页 = **L1 机械/形状**勾选。语义必过项见 [gates-review.md](gates-review.md)（**L2**）。`advance` 须 **L1 ∧ L2**（适用时）都过才推进。

控制器校验时：**只 Read 当前 `progress.stage` 对应一节**（不要整页通读）。

通过条件（L1）：该节每一项均为 ✓（文件存在、字段非空、或链接可打开）。缺任一项 → 不过，并列缺失项。闸通过条件仍见 [gates-common.md](gates-common.md)。

**主题根**：进行中为 `docs/runs/active/<slug>/`；收口后为 `docs/runs/archive/<slug>/`。下文 `runs/…` 均指当前主题根。

**回写规则**：写入 `progress.yaml` / `回链.md` / `artifacts.*` / gates.* 均由 **advance（或 start/close/handoff/proto-bridge/domain-bridge）** 执行；子 skill 只产出领域文件并**回报路径**；L2 审核只写 `审核-<stage>.md`。

---

## triage（环 0）

- [ ] `docs/runs/active/<slug>/progress.yaml` 存在
- [ ] `path` 为 `spike|bounded|full`（用户已确认后写入）
- [ ] `run_mode` 为 `guided|express`；`invoke` 为 `strict|inline`
- [ ] `handoff_policy` 为 `auto|confirm`；`review_policy` 为 `subagent|inline`
- [ ] `stage` 已设
- [ ] `docs/runs/active/<slug>/回链.md` 存在

## grill（环 1）

- [ ] 用户显式确认可进设计（同义可）→ advance 写 `gates.shared_understanding`
- [ ] 若产出术语/ADR 草稿：厨师回报路径 → advance 写入 `回链.md`（无草稿则注明「本环无落盘」）；**禁止**写仓库根 `CONTEXT.md`
- [ ] `express`：可与 design 同轮；总确认一次即可同时满足本项与 design 的确认项

## design（环 2）

- [ ] 用户显式 yes（B：短设计一次；F：整体一次，或分段清单每段一次；`express`：与 grill 合并的一次总 yes）→ advance 写 `gates.design_confirmed`
- [ ] 设计确认摘要可指认：聊天结论复述，或 `设计笔记.md` 非空
- [ ] → 通过后进入 [domain-bridge.md](domain-bridge.md)（勿直接假定进 domain）

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

## plan（环 5）

- [ ] F：`docs/superpowers/plans/*-实施计划.md`（或约定名）存在；`artifacts.plan` 已填（advance）
- [ ] B（若进入）：checklist 或计划文件存在且非空
- [ ] 开干闸三问已过 → advance 写 `gates.go`（条件见 gates-common）
- [ ] 计划中「每任务 commit」若存在：视为 optional；未授权则可不执行（见 binding 宿主 commit 策略）

## proto-bridge（环 5→6）

- [ ] `proto` 为 `skipped|skipped_by_user|entered` 之一（控制器写入）
- [ ] 结论块已向用户展示（见 [proto-bridge.md](proto-bridge.md)）；不需要时非强制二选一、可推翻
- [ ] `skipped` / `skipped_by_user` 时 progress 或 `回链.md` 有一句理由
- [ ] 若判定为「本仓无前端但 Spec/Plan 含菜单或页面」或边界模糊：理由须含 **跨仓提示**（若适用）

## proto（环 6，仅 `proto=entered`）

- [ ] 可打开的原型或线框（目录/文件路径非空）→ `artifacts.proto`（advance）
- [ ] 主路径交互说明（同目录文档或 `回链.md` 指针）非空
- [ ] 用户「原型确认」已记录（advance 写入 progress / `回链.md` / 或确认原型目录标记）
- 控制器不规定视觉工具。

## testdesign（环 7，仅 F）

落盘 `测试用例.md`（可用 `templates/测试用例.md.tmpl`）。**每条用例**下列字段均非空：

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

- [ ] 若 `proto=entered`：环 6 勾选表全过
- [ ] F：环 7 勾选表全过
- [ ] B：无 TestDesign 要求；Proto 规则同上
- [ ] → 通过后 `stage=implement`，advance 写 `gates.pre_impl`

## implement（环 8）

### code_complete（本环必过）

- [ ] 本主题相关业务代码已落盘（可指认路径；commit 非必须）
- [ ] 单测已存在，或用户显式接受「本环无单测」→ advance 记入 `回链.md` / progress
- [ ] S 仅 throwaway：笔记路径已记；不要求入库代码

### env_verified（可选）

- [ ] 本机/CI 可编译或关键冒烟通过的证据路径（可选）；未做不阻断本环
- [ ] 未做时 advance 可在 `回链.md` 注明 `env_verified=skipped`
- [ ] **F 路径**：环境证据改在 **verify** 环强制（见下节）

## handoff（环 8b，旁路）

- [ ] `交接.md` 存在且含 path / stage / 已完成 / 未决 / 下一步 / 产物指针（见 [handoff.md](handoff.md)）

## gate（环 9）

- [ ] `门禁清单.md` 存在（或 `回链.md` 指向等价清单）
- [ ] 机械轨已处理（hooks 结果可指认）
- [ ] 语义轨：绑定 review skill 结论无未决 blocker（或 blocker 列表为空）
- [ ] → advance 写 `gates.gate`

## verify（环 10，仅 F）

落盘 `测试报告.md`（可用 `templates/测试报告.md.tmpl`）：

- [ ] `artifacts.test_report` 已填（advance）
- [ ] **每条** `测试用例.md` 用例有一行结果，且结果为 `pass|fail|blocked` 之一（非空）
- [ ] 凡 `fail` / `blocked`：证据链接非空
- [ ] 汇总：总数 / pass / fail / blocked / 通过率 均非空
- [ ] **环境证据**：至少一项可指认；纯「代码已写」不算过 Verify
- [ ] 无未接受 `fail`，或 `accepted_residual` 已填用户接受说明
- [ ] → advance 写 `gates.verify`

## smoke（环 10′，非 F 可选）

- [ ] 若执行：runs 内有冒烟记录指针；未执行则不阻断

## diagnose（环 10b，按需）

- [ ] 复现笔记路径非空（runs 或 `回链.md`）
- [ ] 先复现再改的结论可指认

## close（环 11）

- [ ] 收口步骤与勾选见 [close.md](close.md)（含 active→archive）
- [ ] → advance/close 写 `gates.close`；`stage=done`；主题目录在 `docs/runs/archive/<slug>/`
