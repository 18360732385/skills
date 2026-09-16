# resume — 续跑进行中主题

## 步骤

1. 列 `docs/superpowers/runs/` 下 `stage != done` 的主题；多个时让用户选。
2. 读该主题 `progress.yaml`：path、stage、gates、artifacts。
3. 若存在 `handoff.md` → 先读它恢复上下文。
4. 向用户播报：当前环、已完成产物、未过闸、下一步动作。
5. 按当前 stage 继续：
   - 当前环需子 skill → 按 [binding.md](binding.md) lookup 调起
   - 当前环是闸 → 按 [gates-common.md](gates-common.md) 校验
6. 上下文明显腐烂时，先建议走 [handoff.md](handoff.md) 再续。

## 约束

- 只续跑、不重分诊；用户要求改路径（如 B→F）时，说明为**升级**：回 start 的分诊闸重新确认，progress 记 `path` 变更。
- 降级（F→B）不允许在 resume 中静默发生。
