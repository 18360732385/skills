# stages — 环节表与路径裁剪（流程定稿 v0.3）

本页是 feature-eng 的**流程正文**：路径定义、环节顺序、进入条件、路径裁剪。产物形状与校验勾选见 [artifacts.md](artifacts.md)。执行者一律写「绑定 skill」或「控制器」；具体 skill 名见 `config/stage-bindings.yaml`（解耦规则见 [binding.md](binding.md)）。

## 路径

| 路径 | 适用 | 文档厚度 |
|---|---|---|
| **S Spike** | 可行性探查；结论是答案不是入库代码 | 无 spec/plan；可选 throwaway 笔记 |
| **B Bounded** | 仓库已有可改流程的小变更 | 聊天短设计；可无独立 spec |
| **F Full** | 新子系统、改公共接口、需 ADR 的决策 | ADR + Spec + Plan + 集成用例 + 测试报告 + 收口 |

## 环节表

| # | 环节 | 执行者 | 进入条件 | 主要产物 | 目录 |
|---|---|---|---|---|---|
| 0 | 分诊 Triage | 控制器提议，**用户确认** | 每次 start | `progress.yaml` | `docs/superpowers/runs/<slug>/` |
| 1 | 澄清 Grill | 绑定 skill | S 轻；B 按需；F 必 | 术语增量、ADR 草稿 | `CONTEXT.md`；草稿随 runs |
| 2 | 设计 Design | 绑定 skill | S 探查计划；B 短设计；F 完整 | 设计确认摘要 | runs（可选 `design-notes.md`） |
| 3 | 定稿 Domain | 绑定 skill | 有不可逆决策才写 ADR | 定稿 ADR、CONTEXT 更新 | `docs/adr/`；`CONTEXT.md` |
| 4 | 规格 Spec | 绑定 skill | **仅 F** | `YYYY-MM-DD-<主题>-设计.md` | `docs/superpowers/specs/` |
| 5 | 计划 Plan | 绑定 skill | F 必；B 可选 checklist | `*-实施计划.md`；可选 `tickets.yaml` | `docs/superpowers/plans/`；runs |
| 5→6 | Proto 分诊桥 | **仅控制器** | 5 刚结束 | progress 字段 `proto=*` | runs |
| 6 | 原型 Proto | 绑定 skill（用户点名） | 自判需 UI **且**用户同意 | 原型 + 交互说明 + 用户确认 | `docs/ui-prototypes/<slug>/` 或 runs `proto/` |
| 7 | 测试设计 TestDesign | 绑定 skill | **仅 F** | 集成测试用例文档 | runs `testcases.md` |
| 7b | 实现前闸 Pre-Impl | 控制器 | B/F | `stage=implement` | runs |
| 8 | 实现 Implement | 绑定 skill（+可选子代理） | B/F；S 仅 throwaway | 代码 + 单测 | 业务树 |
| 8b | 交接 Handoff | 旁路 | 按需 | `handoff.md` | runs |
| 9 | 门禁 Gate | 仓库 hooks + 绑定 review skill | B/F | `gate-checklist.md` | runs |
| 10 | 验证 Verify | 绑定 skill + 按用例逐项 | **仅 F** | 测试报告（用例 pass/fail/blocked） | runs `test-report.md` |
| 10′ | 冒烟（非 F） | 可选 quick QA | B 建议、不强制 | 可选记录 | runs |
| 10b | 排障 Diagnose | 绑定 skill | 按需；先复现再改 | 复现笔记 | runs |
| 11 | 收口 Close | 控制器（收口正文见 [close.md](close.md)） | 验证策略满足或用户接受残留 | superpowers 归档、pitfalls 三问 | `docs/superpowers/` 等 |

## 路径裁剪

| 环节 | S | B | F |
|---|---|---|---|
| 0–3 | 轻/按需 | 轻/按需 | ✓ |
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

## progress.yaml 字段

字段 SSOT 为 `templates/progress.yaml.tmpl`（含 `path` / `run_mode` / `invoke` / `env_verified` 等注释）；本页不复述。校验勾选见 [artifacts.md](artifacts.md)。调起策略见 [binding.md](binding.md)；express 边界见 [start.md](start.md)。
