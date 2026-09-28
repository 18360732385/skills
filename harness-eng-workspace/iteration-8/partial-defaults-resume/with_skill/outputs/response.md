## 模式判定

按 **harness-eng** 默认分流规则：

| 条件 | 结果 |
|---|---|
| 已有 `AGENTS.md`（骨架级） | ✅ |
| 无 `docs/harness-eng/harness-meta.yaml` | ✅ |
| 无 `.cursor/rules`、无契约文档、无回流目录 | ✅ |

**判定模式：`resume`**（半成品续跑工程化）

> 注：当前仓库不是大仓，且已有 PARTIAL 的 `AGENTS.md`，故走 `resume` 而非 `land` / `pipeline`。

---

## 当前缺口

| 层级 | 项 | 状态 |
|---|---|---|
| **元数据** | `docs/harness-eng/harness-meta.yaml`（skill_version、ladder、domains） | ❌ 缺失 |
| **AGENTS.md** | 目录、角色、工作流、约定、SSOT、层级路由等完整章节 | ⚠️ 仅有 `Never do` + `Commands` |
| **AI 编码规则** | `.cursor/rules` / `.cursor/rules.md` | ❌ 缺失 |
| **契约文档** | `docs/harness-eng/` 下 func / api / db / redis / jobs 等分册 | ❌ 缺失 |
| **知识回流** | `docs/plans/`、`docs/runs/` 规划目录 | ❌ 缺失 |
| **Hooks / MCP** | `.claude/settings.json` hooks、MCP 配置 | ❌ 缺失 |

当前约为 **L0 偏下**（仅有骨架级 AGENTS.md），距离可宣称 `ai_coding_ready` 尚需补齐 L1–L2 必备项。

---

## 下一步建议

1. **定根确认**：目标根即 `/tmp/skill-up-2415912961`（单根小仓），是否以此为准？
2. **类型判定**：从现有文件看，本仓为通用脚手架/Fixture 类（无业务代码栈），推荐走 **轻量 resume**（无需 db/redis/jobs 等重型契约）。
3. **提问批次**：确认根后，我会按 `questions.yaml` 发起 ≤5 条条件提问（可一键「全部推荐」）。
4. **WritePlan → 确认闸门 → 写盘**。

请确认：
- **目标根** 是否为 `/tmp/skill-up-2415912961`？
- 是否接受 **resume** 模式、轻量阶梯（无需 db/redis/jobs）？

确认后即进入提问批次。
