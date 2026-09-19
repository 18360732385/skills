# feature-eng CHANGELOG

## 0.2.6-dev — 2026-09-19

V0.6.X 开发钉。相对 0.2.5-dev：**不**改环节语义与默认绑定 skill 名；`harness_land` 仍 false；`feature.mjs` 不写盘。叠在 #39（0.2.5-dev 夹具/自检）之上。

- **modes/**：模式与契约 md 迁入 `modes/`（init/rebind/start/resume/status/advance/close/binding/stages/artifacts/gates-*/domain-bridge/proto-bridge/handoff）；根目录只留入口与索引；`modes/README.md` 索引表
- **薄 CLI**：`scripts/feature.mjs`（`help` / `modes` / `status`→status-scan）；调度员不进厨房——不写 progress、不调子 skill、不代答硬闸
- **加厚夹具**：`scripts/fixtures/advance-gate/`（plan 环末、gates ISO 时间戳 + L1 产物已填）；`bindings-bad/`（null-skill / missing-key 负例）；`close-ready/`（archive · stage=done · gates.close）
- **行为自检**：`scripts/selfcheck.mjs` 对上述夹具做形状/时间戳/绑定完整性断言（非仅文件存在）；status-scan / feature.mjs status 对 advance-gate 烟测
- **文档**：SKILL / AGENT-INDEX / QUICKSTART / README / VERIFY / selfcheck 全量改链；钉 **0.2.6-dev**

| 版本 | 日期 | 说明 |
|---|---|---|
| 0.2.6-dev | 2026-09-19 | modes/ + feature.mjs + 加厚 fixtures/selfcheck；V0.6.X 开发钉 |

## 0.2.5-dev — 2026-09-19

V0.6.X 开发钉。相对 0.2.4：**不**改环节语义与默认绑定 skill 名。

- **P0 夹具**：`scripts/fixtures/init-skeleton/`（start 建盘后 triage 态：`progress.yaml` + `回链.md` + runs README）与 `scripts/fixtures/progress-bad/`（缺字段负例）
- **行为自检**：`scripts/selfcheck.mjs` 校验 progress 模板/夹具顶层键、artifacts/gates 子键、枚举字段；模板↔夹具契约对齐；`status-scan.mjs` 对夹具根 exit 0 并打印 slug/stage/path；负例须被形状校验拒绝
- **文档**：VERIFY / README / SKILL / AGENT-INDEX / manifest 钉 **0.2.5-dev**

| 版本 | 日期 | 说明 |
|---|---|---|
| 0.2.5-dev | 2026-09-19 | 夹具 + 行为自检；V0.6.X 开发钉（不改默认绑定 skill 名） |
## 0.2.4 — 2026-09-17

正式钉号。相对 0.2.3：**不**改环节语义与默认 skill 名。

- **P0**：AGENT-INDEX 热路径索引；VERIFY 验收桩；`scripts/selfcheck.mjs` 最小静态断言
- **P1**：lookup「绑定 skill 可调起」预检 checklist + 失败文案（binding / start / advance）；`config/truncate-contracts.yaml` design/spec 截断契约；`QUICKSTART.md` 一页纸
- **P2**：`scripts/status-scan.mjs` 扫描 active progress；`defaults.close_pitfalls`（off|optional|on，默认 optional 不强制）写入 bindings / close 文档

| 版本 | 日期 | 说明 |
|---|---|---|
| 0.2.6-dev | 2026-09-19 | modes/ + feature.mjs + 加厚 fixtures/selfcheck；V0.6.X 开发钉 |
| 0.2.5-dev | 2026-09-19 | 夹具 + 行为自检；V0.6.X 开发钉（不改默认绑定 skill 名） |
| 0.2.4 | 2026-09-17 | 正式钉号；P0 索引/selfcheck + P1 预检/截断/QUICKSTART + P2 status-scan / close_pitfalls（不改默认绑定 skill 名） |
| 0.2.3 | 2026-09-17 | 过程态迁至 `docs/runs/{active\|archive}/`（与 superpowers 平级）；close 物理归档；人读文件中文短名（回链/测试用例/测试报告/交接/术语增量等），机读保留 `progress.yaml`；L2 为 `审核-<stage>.md`；旧 `docs/superpowers/runs` 兼容提示 |
| 0.2.2 | 2026-09-17 | 过闸后按 `handoff_policy`（auto\|confirm）**主动**调起下一 skill；advance 拆 L1（artifacts）/ L2（新建 gates-review.md，subagent 优先）；硬闸短确认卡片；用户不再默认手切 skill |
| 0.2.1 | 2026-09-17 | init/rebind/status 首问固定中文名+skill+产物表；Proto 桥改为展示结论可推翻（需 UI 仍硬问）；新增 domain-bridge（默认 design→spec，条件进定稿）；禁止主题术语写根 CONTEXT.md，改 `context-delta.md` |
| 0.2.0 | 2026-09-17 | 宿主适配与仪式加速：`invoke` strict\|inline + 指针卡片；`run_mode` guided\|express；progress/links **仅控制器**写、厨师回报路径；advance 口令协议；Proto 跨仓前端提示；implement 分 code_complete / 可选 env_verified，Verify 强制环境证据；handoff 环≥5 主动提议；defaults.commit_policy / 可选 input_contract |
| 0.1.6 | 2026-09-16 | writing-for-agents P2：lookup 切断调起（子代理/新会话）；人侧入口收为 start/resume/close/init\|rebind（未指定走 status；环完成挂 advance）；README 瘦成指针 |
| 0.1.5 | 2026-09-16 | writing-for-agents P1：产物契约拆至 artifacts.md（按环勾选、advance 只读当前节）；抬高校验 demand；控制器边界改正述+三条硬轨；gates Pre-Impl/Gate/Verify 回链 artifacts |
| 0.1.4 | 2026-09-16 | writing-for-agents P0：stages/close 去 rule 18/19 沉积；推荐包单源改 `stage-bindings.example.yaml`（删 init 表）；「推荐≠强制」收束至 binding.md；锐化共享理解闸 / 设计确认闸 / resume 腐烂条件 |
| 0.1.3 | 2026-09-16 | 推荐包对齐 Superpowers：grill→grill-me；design/spec→brainstorming（截断）；plan→writing-plans；implement 优先 SDD 其次 executing-plans（调起时询问）；proto→prototype；testdesign→lynxce-test-cases；diagnose→systematic-debugging。init/rebind **首问必选推荐包**。close 内化收口/pitfalls，去 rule 18/19 编号依赖。start/status 绑定缺口红字提示。 |
| 0.1.2 | 2026-09-04 | writing-for-agents 评审修订（P2–P5）：边界节提炼 leading word「调度员不进厨房」，binding/advance 越界表述改回链；init 扫描与安装补可检查完成标准、sync 步骤拆分支；gates-common 文首聚拢绑定闸指针；progress 模板 stage 枚举补 diagnose 旁态注释；status 删 no-op |
| 0.1.1 | 2026-09-04 | writing-for-agents 评审修订（P0+P1）：修 SKILL.md 旁路 spec 断链（→archive，默认勿打开）；progress 字段 SSOT 归 templates；「仅 F 调起」归 stages.md 裁剪表；SKILL.md 硬闸节压缩为闸名索引，规则正文去重 |
| 0.1.0 | 2026-09-04 | 初始骨架：模式 init/rebind/start/resume/status/advance/close；环节表 v0.3 + 绑定 v0.4；config/stage-bindings.yaml 入库；templates 4 件 |
