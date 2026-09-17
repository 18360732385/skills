# resume — 续跑进行中主题

## 步骤

1. 列 `docs/runs/active/` 下主题（读各目录 `progress.yaml`，`stage != done`）；多个时让用户选。  
   - **兼容**：若存在旧路径 `docs/superpowers/runs/<slug>/` 且 active 无对应项 → 列入候选并提示「建议迁到 docs/runs/active/（须确认后搬，勿静默）」。
2. 读该主题 `progress.yaml`：path、run_mode、invoke、handoff_policy、review_policy、stage、domain、proto、gates、artifacts。缺字段时按 start 推导 / defaults 对待并建议补写；缺 `domain`/`proto` 且 stage 已过对应桥则建议按 `回链.md` 理由回填。
3. 若存在 `交接.md` → 先读它恢复上下文。
4. 向用户播报：当前环（附中文名）、仪式字段、domain/proto、已完成产物、未过闸、`pending_invoke`（若有）、下一步动作（字段同 [status.md](status.md) 第 3 点）。
5. 按当前 stage 继续：
   - `domain-bridge` / `proto-bridge` → 按对应桥文件执行
   - `回链.md` 有 `pending_invoke` → 按 [binding.md](binding.md) **主动** lookup
   - 当前环需子 skill → **主动** lookup（尊重 `progress.invoke`）
   - 当前环是闸 → 按 [gates-common.md](gates-common.md) 校验
   - 用户声称本环完成 → [advance.md](advance.md)
6. 满足任一则先建议走 [handoff.md](handoff.md) 再续：用户表示接不上当前上下文；或无 `交接.md` 且 `updated_at` 距今 ≥ 7 天；或播报后用户否认准确性；或已完成环数 ≥ 5 且尚无交接。

## 约束

- 只续跑、不重分诊；用户要求改路径（如 B→F）时，说明为**升级**：回 start 的分诊闸重新确认，progress 记 `path` 变更。
- 降级（F→B）不允许在 resume 中静默发生。
- 默认不扫描 `docs/runs/archive/`（除非用户显式要看归档）。
