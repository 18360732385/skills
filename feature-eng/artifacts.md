# artifacts — 产物契约（控制器校验 SSOT）

控制器只认本页勾选表。`advance` / `status` / lookup 校验时：**只 Read 当前 `progress.stage` 对应一节**（不要整页通读）。

通过条件：该节每一项均为 ✓（文件存在、字段非空、或链接可打开）。缺任一项 → 不过，并列缺失项。闸通过条件仍见 [gates-common.md](gates-common.md)；本页只管**产物形状**。

路径 / 目录约定摘要见 [stages.md](stages.md) 环节表；字段级苛求以本页为准。

---

## triage（环 0）

- [ ] `runs/<slug>/progress.yaml` 存在
- [ ] `path` 为 `spike|bounded|full`（用户已确认后写入）
- [ ] `stage` 已设
- [ ] `runs/<slug>/links.md` 存在

## grill（环 1）

- [ ] 用户显式确认可进设计（同义可）→ 对应闸写 `gates.shared_understanding`
- [ ] 若产出术语/ADR 草稿：路径已写入 `links.md` 或 `artifacts` 注释区（无草稿则注明「本环无落盘」）

## design（环 2）

- [ ] 用户显式 yes（B：短设计一次；F：整体一次，或分段清单每段一次）→ `gates.design_confirmed`
- [ ] 设计确认摘要可指认：聊天结论复述，或 `runs/<slug>/design-notes.md` 非空

## domain（环 3）

- [ ] 若有不可逆决策：至少 1 个 ADR 路径在 `artifacts.adr`，且文件存在
- [ ] 若无不可逆决策：progress / links 注明「本环跳过 ADR」且用户已知晓
- [ ] 若改了术语：`CONTEXT.md`（或团队等价）已更新且 links 有指针

## spec（环 4，仅 F）

- [ ] `docs/superpowers/specs/YYYY-MM-DD-<主题>-设计.md` 存在
- [ ] `artifacts.spec` 指向该文件
- [ ] 文内含可指认的验收标准小节（非空）

## plan（环 5）

- [ ] F：`docs/superpowers/plans/*-实施计划.md`（或约定名）存在；`artifacts.plan` 已填
- [ ] B（若进入）：checklist 或计划文件存在且非空
- [ ] 开干闸三问已过 → `gates.go`（条件见 gates-common）

## proto-bridge（环 5→6）

- [ ] `proto` 为 `skipped|skipped_by_user|entered` 之一
- [ ] `skipped` / `skipped_by_user` 时 progress 或 links 有一句理由

## proto（环 6，仅 `proto=entered`）

- [ ] 可打开的原型或线框（目录/文件路径非空）→ `artifacts.proto`
- [ ] 主路径交互说明（同目录文档或 links 指针）非空
- [ ] 用户「原型确认」已记录（progress / links / 原型目录标记三选一，非空）
- 控制器不规定视觉工具。

## testdesign（环 7，仅 F）

落盘 `runs/<slug>/testcases.md`（可用 `templates/testcases.md.tmpl`）。**每条用例**下列字段均非空：

- [ ] 用例 ID
- [ ] 模块/场景
- [ ] 前置
- [ ] 步骤
- [ ] 数据
- [ ] 期望
- [ ] 优先级
- [ ] 关联需求/任务 ID

文档级：

- [ ] `artifacts.testcases` 已填
- [ ] Spec 每条验收标准至少映射 1 条用例（覆盖自查勾选）
- [ ] 无单测/实现级用例混入（定位集成测试）

## pre-impl（环 7b）

- [ ] 若 `proto=entered`：环 6 勾选表全过
- [ ] F：环 7 勾选表全过
- [ ] B：无 TestDesign 要求；Proto 规则同上
- [ ] → 通过后 `stage=implement`，写 `gates.pre_impl`

## implement（环 8）

- [ ] 本主题相关业务代码已落盘（可指认路径或 commit）
- [ ] 单测已存在，或用户显式接受「本环无单测」并记入 links/progress
- [ ] S 仅 throwaway：笔记路径已记；不要求入库代码

## handoff（环 8b，旁路）

- [ ] `runs/<slug>/handoff.md` 存在且含 path / stage / 已完成 / 未决 / 下一步 / 产物指针（见 [handoff.md](handoff.md)）

## gate（环 9）

- [ ] `runs/<slug>/gate-checklist.md` 存在（或 links 指向等价清单）
- [ ] 机械轨已处理（hooks 结果可指认）
- [ ] 语义轨：绑定 review skill 结论无未决 blocker（或 blocker 列表为空）
- [ ] → `gates.gate` 时间戳

## verify（环 10，仅 F）

落盘 `runs/<slug>/test-report.md`（可用 `templates/test-report.md.tmpl`）：

- [ ] `artifacts.test_report` 已填
- [ ] **每条** `testcases.md` 用例有一行结果，且结果为 `pass|fail|blocked` 之一（非空）
- [ ] 凡 `fail` / `blocked`：证据链接非空
- [ ] 汇总：总数 / pass / fail / blocked / 通过率 均非空
- [ ] 无未接受 `fail`，或 `accepted_residual` 已填用户接受说明
- [ ] → `gates.verify`

## smoke（环 10′，非 F 可选）

- [ ] 若执行：runs 内有冒烟记录指针；未执行则不阻断

## diagnose（环 10b，按需）

- [ ] 复现笔记路径非空（runs 或 links）
- [ ] 先复现再改的结论可指认

## close（环 11）

- [ ] 收口步骤与勾选见 [close.md](close.md)（本页不复述）
- [ ] → `gates.close`；`stage=done`
