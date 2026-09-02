# FOREIGN 并存 Playbook（Q_COEXIST）

适用：Fingerprint 类型 **FOREIGN**（有 `CLAUDE.md` / `.claude/`，无本 harness 的 `00`+契约索引+真相结构）。

**硬闸**：删除 `CLAUDE.md` / `.claude/` 须用户书面确认 — 正目标：保留或经确认迁移到 AGENTS 指针。

## 策略对照

| `Q_COEXIST` | 保留 CLAUDE | 写 AGENTS / rules | 写契约 docs | 写 agent-kb |
|---|---|---|---|---|
| A. 保留 CLAUDE 并存 | 是（不改） | 是（create/merge） | 按所选域 | 按阶梯 |
| B. 逐步迁 AGENTS | 是（暂留；可在 AGENTS 顶部注明「迁移中」） | 是 | 按所选域 | 按阶梯 |
| C. 只加契约+kb | 是（不改） | **否**（不装 00/Karpathy/根 AGENTS，除非用户改口） | 是 | L2 时是 |

## 文件级动作

### A — 并存

| 路径 | 动作 |
|---|---|
| `CLAUDE.md` / `.claude/**` | `skip` |
| `AGENTS.md` | `create`（若已有则 `merge`） |
| `.cursor/rules/**` | 按阶梯 create |
| `docs/func|api|db|redis|agent-kb` | 按契约域 / 阶梯 |
| WritePlan 风险栏 | 注明「双入口：CLAUDE + AGENTS；冲突以 AGENTS/契约为准（须在 AGENTS 写明）」 |

### B — 逐步迁 AGENTS

| 路径 | 动作 |
|---|---|
| `CLAUDE.md` | `skip`（本轮不删）；可选在根 AGENTS Critical 写「原 CLAUDE 待迁」 |
| 其余 | 同 land 全量（按阶梯） |
| 移交 P1 | 「将 CLAUDE 要点迁入 AGENTS / 分册后，再决定是否归档 CLAUDE」 |

### C — 只加契约+kb

| 路径 | 动作 |
|---|---|
| `AGENTS.md`、`00`、`karpathy`、`14` | `skip` |
| `docs/func|api|db|redis` | 按 `Q_CONTRACT` create |
| `docs/agent-kb` + rule 19 | 仅当目标阶梯 ≥ L2 |
| `harness-meta.yaml` | create（`ladder`/`domains` 如实；`agents_variant: none` 可写注释于移交） |

## WritePlan 必写

- 摘要「FOREIGN + 策略 A|B|C」
- 明确 CLAUDE 路径均为 skip
- 确认闸门通过后再写
