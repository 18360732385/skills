## 模式判定：**`resume`**（续跑补齐）

### 现状探测结果

| 检查项 | 状态 |
|---|---|
| `AGENTS.md` | ✅ 存在（仅 11 行，极简占位） |
| `docs/harness-eng/harness-meta.yaml` | ❌ 缺失 |
| `.cursor/rules` | ❌ 缺失 |
| `.cursor/harness-meta.yaml`（遗留） | ❌ 缺失 |
| `docs/harness-eng/` 目录 | ❌ 缺失 |
| `.claude/` | 仅有 `skills/`（本 skill 自身） |

### 缺口清单

1. **元数据与阶梯记录**：无 `harness-meta.yaml`，无法判定 `ladder` 等级与 `skill_version`。
2. **AI 编码规则**：无 `.cursor/rules`，Agent 缺乏结构化编码约束。
3. **契约文档**：无 `func/api/db/redis/jobs` 等契约目录与文件。
4. **Hooks / MCP**：无 `.claude/settings.json` hooks、无 MCP 配置。
5. **知识回流与规划目录**：无 `docs/harness-eng/` 体系。
6. **AGENTS.md 待补齐**：现有 11 行属占位级，需按 merge 策略扩充章节（`## Never do`、`## Commands` 等），不覆盖已有正文。

### 默认分流依据

按 skill 未指定模式时的分流规则：  
- 非 **MATURE**（无 meta）  
- 非 大仓首次（体量小，不触发 pipeline）  
- 已有 `AGENTS.md` 但工程化未满阶 → 落入 **PARTIAL** → 默认 **`resume`**

---

```
┌─────────────────────────────────────────┐
│  阶段   │  探测与模式判定（Done）          │
│  现状   │  已有 AGENTS.md 占位，meta/rules │
│         │  /契约/钩子全线缺失，不可 AI coding│
│  工作   │  探测仓库 → 判定 resume → 列缺口 │
│  下一步 │  等用户确认「resume」后进入提问  │
│         │  → WritePlan → 确认闸门 → 写盘  │
└─────────────────────────────────────────┘
```

请确认按 **`resume`** 模式续跑补齐，或改指 **`land`**（重建）/ **`upgrade`**（升阶）/ **`pipeline`**（流水线）。
