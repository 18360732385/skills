# stages — 环节表与路径裁剪（流程定稿 v0.3.1）

本页是 feature-eng 的**流程正文**：路径定义、环节顺序、进入条件、路径裁剪。产物形状与校验勾选见 [artifacts.md](artifacts.md)。执行者一律写「绑定 skill」或「控制器」；具体 skill 名见 `config/stage-bindings.yaml`（解耦规则见 [binding.md](binding.md)）。

## 路径

| 路径 | 适用 | 文档厚度 |
|---|---|---|
| **S Spike** | 可行性探查；结论是答案不是入库代码 | 无 spec/plan；可选 throwaway 笔记 |
| **B Bounded** | 仓库已有可改流程的小变更 | 聊天短设计；可无独立 spec |
| **F Full** | 新子系统、改公共接口、需 ADR 的决策 | 条件 ADR + Spec + Plan + 集成用例 + 测试报告 + 收口 |

## 可绑环节中文名与产物一句话（init / rebind / status SSOT）

| 环 | 中文名 | 键名 | 主要产物（一句话） |
|---|---|---|---|
| 1 | 澄清 | `grill` | 共享理解确认；可选术语/ADR 草稿（随 runs） |
| 2 | 设计 | `design` | 设计确认摘要（聊天或 `design-notes.md`） |
| 3 | 定稿 | `domain` | 条件进入：ADR（`docs/adr/`）与/或 `context-delta.md` |
| 4 | 规格 | `spec` | Spec 设计文档（`docs/superpowers/specs/`） |
| 5 | 计划 | `plan` | 实施计划 / checklist（`docs/superpowers/plans/`） |
| 6 | 原型 | `proto` | 原型 + 交互说明 + 用户确认（仅 `proto=entered`） |
| 7 | 测试设计 | `testdesign` | 集成用例 `testcases.md`（仅 F） |
| 8 | 实现 | `implement` | 业务代码 + 单测（code_complete） |
| 9 | 评审 | `review` | 语义轨评审结论（门禁用） |
| 10 | 验证 | `verify` | 测试报告 `test-report.md`（仅 F） |
| 10b | 排障 | `diagnose` | 复现笔记（按需） |

## 环节表

| # | 中文名 | 环节键 | 执行者 | 进入条件 | 主要产物 | 目录 |
|---|---|---|---|---|---|---|
| 0 | 分诊 | `triage` | 控制器提议，**用户确认** | 每次 start | `progress.yaml` | `docs/superpowers/runs/<slug>/` |
| 1 | 澄清 | `grill` | 绑定 skill | S 轻；B 按需；F 必 | 共享理解；可选草稿 | runs |
| 2 | 设计 | `design` | 绑定 skill | S 探查计划；B 短设计；F 完整 | 设计确认摘要 | runs（可选 `design-notes.md`） |
| 2→3 | 定稿桥 | `domain-bridge` | **仅控制器** | 设计确认闸刚过 | `progress.domain=*` | runs |
| 3 | 定稿 | `domain` | 绑定 skill | **仅** `domain=entered` | ADR；`context-delta.md` | `docs/adr/`；runs |
| 4 | 规格 | `spec` | 绑定 skill | **仅 F**（domain 跳过或完成后） | Spec 设计 md | `docs/superpowers/specs/` |
| 5 | 计划 | `plan` | 绑定 skill | F 必；B 可选 checklist | 实施计划 | `docs/superpowers/plans/`；runs |
| 5→6 | 原型桥 | `proto-bridge` | **仅控制器** | 5 刚结束 | `progress.proto=*` | runs |
| 6 | 原型 | `proto` | 绑定 skill | 自判需 UI **且**用户同意 | 原型 + 交互说明 | `docs/ui-prototypes/<slug>/` 或 runs `proto/` |
| 7 | 测试设计 | `testdesign` | 绑定 skill | **仅 F** | 集成测试用例 | runs `testcases.md` |
| 7b | 实现前闸 | `pre-impl` | 控制器 | B/F | `stage=implement` | runs |
| 8 | 实现 | `implement` | 绑定 skill（+可选子代理） | B/F；S 仅 throwaway | 代码 + 单测 | 业务树 |
| 8b | 交接 | `handoff` | 旁路 | 按需 | `handoff.md` | runs |
| 9 | 门禁 | `gate` | 仓库 hooks + 绑定 review | B/F | `gate-checklist.md` | runs |
| 10 | 验证 | `verify` | 绑定 skill | **仅 F** | 测试报告 | runs `test-report.md` |
| 10′ | 冒烟 | `smoke` | 可选 | B 建议、不强制 | 可选记录 | runs |
| 10b | 排障 | `diagnose` | 绑定 skill | 按需；先复现再改 | 复现笔记 | runs |
| 11 | 收口 | `close` | 控制器（见 [close.md](close.md)） | 验证策略满足或接受残留 | 归档、pitfalls 三问 | `docs/superpowers/` 等 |

**术语落盘**：禁止主题术语写入仓库根 `CONTEXT.md`。增量用 `runs/<slug>/context-delta.md`（或 Spec 内术语小节，由 links 指认）。

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

F 默认链路：design 确认 → **domain-bridge**（多数 `skipped`）→ **spec**（不强制空跑 domain）。

## progress.yaml 字段

字段 SSOT 为 `templates/progress.yaml.tmpl`（含 `path` / `run_mode` / `invoke` / `handoff_policy` / `review_policy` / `domain` / `proto` / `env_verified` 等注释）；本页不复述。L1 见 [artifacts.md](artifacts.md)；L2 见 [gates-review.md](gates-review.md)；调起与交接见 [binding.md](binding.md) / [advance.md](advance.md)；express 边界见 [start.md](start.md)。
