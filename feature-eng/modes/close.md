# close — 收口（环 11）

本页正文即收口 SSOT（skill 内规则）。迁仓后仍可执行最小收口。若目标仓 hooks / alwaysApply 更严，以仓库为准，并在本环补齐更严项。

## 前置闸

- F：`测试报告.md` 无 `fail`，或用户显式接受残留（progress 记 `accepted_residual`）。
- B：Gate 已过；冒烟为建议项，不强制。
- S：只记结论，不走本页 superpowers 归档；若有 `docs/runs/active/<slug>/` 可直接移入 archive 或删除（与用户确认）。

## 步骤（B/F）

1. **契约同步（可选增强）**  
   若仓内存在 `docs/func` / `docs/api` / `docs/db` / `docs/redis` / `docs/jobs`（或团队等价契约目录）：逐项确认本主题变更已同步；未同步 → 列缺项，先补。  
   若无此类目录：记「本仓无契约文档树」并跳过，不阻断。

2. **superpowers 收口（skill 内最小集）**  
   - Spec/Plan（若存在）文首徽章改「已交付」  
   - `git mv` 入 `docs/superpowers/archive/specs|plans/`（目录不存在则先建；**未跟踪**则用普通 `mv`）  
   - 若有 `docs/superpowers/README.md` 进行中表：删本主题行 → 写入 `ARCHIVE.md`（日期倒序；「提交」列填代表性实现 commit 链接，若有）  
   - 若有变更记录文件：追加一行  
   - 无 README/ARCHIVE 约定：至少把 Spec/Plan 移入 archive，并向用户说明本仓索引约定缺失

3. **pitfalls 回流（skill 内三问）**  
   - 本轮是否修了/确认了智能体易再犯的错误做法？  
   - 若存在 `docs/agent-kb/pitfalls.md`（或等价台账）：已有 `Pn` → 落点是否仍准；根因消除 → 标「已根治」；无则按台账格式追加（域、触发路径必填）  
   - **pitfalls lint 开关** `close_pitfalls`（读自本主题 `progress.close_pitfalls`，缺省则 `defaults.close_pitfalls`，再缺省 **`optional`**）：  
     | 值 | 行为 |
     |---|---|
     | **`off`** | 不跑 `lint-pitfalls`；三问仍做 |
     | **`optional`**（默认） | 若存在 `node scripts/agent-kb/lint-pitfalls.mjs` 则改台账后代跑；失败列错并停；无脚本则跳过并注明 |
     | **`on`** | **要求**存在 lint 脚本且通过；无脚本或失败 → 阻断 close（用户可显式降为 optional/off 写入 progress 后重试） |
   - 无 pitfalls 台账：三问仍要口头/写入 runs 小结，并注明「本仓无 L2 pitfalls」；`on` 时仍须有脚本（否则阻断）

4. **runs 收尾与归档**  
   - `progress.yaml`：`stage=done` + updated_at；`回链.md` 补齐最终产物指针  
   - `git mv docs/runs/active/<slug> → docs/runs/archive/<slug>`（`archive/` 不存在则先建；**未跟踪**则用普通 `mv`，勿 `git mv`）  
   - 若有 `docs/runs/README.md` 进行中表：删本主题行  
   - 若主题仍在旧路径 `docs/superpowers/runs/<slug>/`：迁到 `docs/runs/archive/<slug>/` 并注明已从旧路径迁移

5. 输出交付摘要：路径、各环节产物、测试报告通过率（F）、残留风险、本仓跳过的可选增强项。

## 双归档 L1 检查单（O7，可勾选）

收口完成前逐项勾选（B/F）。未入库文件用普通 `mv`（勿对未跟踪路径 `git mv`，见摩擦 F9）。

### runs active → archive
- [ ] `progress.yaml`：`stage=done` + `gates.close` 已写 + updated_at
- [ ] `回链.md` 最终产物指针补齐（含 chef_mode / authorized_by / env_notes 若适用）
- [ ] `docs/runs/active/<slug>/` → `docs/runs/archive/<slug>/`（已跟踪用 `git mv`，否则 `mv`）
- [ ] 若有 `docs/runs/README.md` 进行中表：已删本主题行

### Spec/Plan → superpowers/archive
- [ ] Spec/Plan（若存在）文首徽章改「已交付」
- [ ] Spec → `docs/superpowers/archive/specs/`；Plan → `docs/superpowers/archive/plans/`（目录不存在则先建；未跟踪用 `mv`）
- [ ] 若有 `docs/superpowers/README.md` 进行中表：已删本主题行
- [ ] 若有 `docs/superpowers/ARCHIVE.md`：已按日期倒序追加（「提交」列填代表性 commit，若有）
- [ ] `progress.artifacts.spec|plan` 指针已改为 archive 路径（若原先指向非 archive）

### 一致性（可选机检）
- [ ] 可选：`node scripts/close-check.mjs --cwd <消费仓根> --slug <slug>`（校验 archive 存在、stage=done、gates.close、活跃目录已空）
- [ ] 交付摘要已输出

## 硬约束

- 在适用范围内，superpowers 最小收口未完成时，禁止宣称「已交付」。
- 实现已合入但索引仍标「进行中」（有 README 表时）= 漏收口；必须先补收口再当作交付完成。
- active 未移入 archive 视为 runs 收口未完成（B/F）。
