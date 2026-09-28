# harness-eng audit — fixture-new-code

目标根: `/tmp/skill-up-1727576492`  
类型: `NEW_CODE`（Maven/Java；完全未落地）  
meta: **无 meta**

---

## 已具备

### L0 协作入口
- [x] 无（根 `AGENTS.md` 缺失）
- [x] 无（`.cursor/rules/karpathy-guidelines.mdc` 缺失）
- [x] 无（`.cursor/rules/00-project-docs-overview.mdc` 缺失）
- [x] 无（`docs/harness-eng/harness-meta.yaml` 缺失；也无遗留 `.cursor/harness-meta.yaml`）
- [x] 无（rule 21 / rule 17 均未生成）

### L1 契约骨架
- [x] 无（`docs/func/` 缺失 + rule 11 缺失）
- [x] 无（`docs/api/` 缺失 + rule 12 缺失）
- [x] 无（`docs/db/` 缺失 + rule 13 缺失）
- [x] 无（`docs/redis/` 缺失 + rule 16 缺失）
- [x] 无（`docs/jobs/` 缺失 + rule 20 缺失）

### L1 超集 / 过程包
- [x] 无（`docs/releases` 缺失）
- [x] 无（前端协作包未生成）

### L2 知识回流
- [x] 无（`docs/agent-kb/` 四文件全部缺失）
- [x] 无（rule 19 缺失）

### L3 规划与软门禁
- [x] 无（`docs/superpowers/README.md` 缺失）
- [x] 无（rule 18 缺失）
- [x] 无（hooks 全缺失：无 `.cursor/hooks.json`、无 `.githooks/pre-commit`、无 `.claude/settings.json` hooks 等）

### L4 工具连接样例
- [x] 无（`mcp.json.example` 缺失）
- [x] 无（`docs/harness-eng/mcp-usage-guide.md` 缺失）

### L5 配置 SSOT 管线
- [x] 无（`docs/agent-config/` 缺失）
- [x] 无（`scripts/agent-config/sync.mjs` 缺失）

---

## 缺口

| 阶梯 | 缺失路径 / 文件 | 建议动作 |
|---|---|---|
| **L0** | 根 `AGENTS.md` | `land` 或 `pipeline` 补齐 |
| **L0** | `docs/harness-eng/harness-meta.yaml` | `land` 写入 meta 快照 |
| **L0** | `.cursor/rules/karpathy-guidelines.mdc` | `land` 渲染 alwaysApply rule |
| **L0** | `.cursor/rules/00-project-docs-overview.mdc` | `land` 渲染 alwaysApply rule |
| **L1** | `docs/func/` + `11-func-sync.mdc` | 按探测域选择后 `land` |
| **L1** | `docs/api/` + `12-api-sync.mdc` | 按探测域选择后 `land` |
| **L1** | `docs/db/` + `13-db-sync.mdc` | 按探测域选择后 `land` |
| **L1** | `docs/redis/` + `16-redis-sync.mdc` | 按探测域选择后 `land` |
| **L1** | `docs/jobs/` + `20-jobs-sync.mdc` | 若探测到 jobs 域则 `land` |
| **L2** | `docs/agent-kb/` 四文件 + `19-agent-kb.mdc` | `land` 或 `upgrade` 到 L2 |
| **L3** | `docs/superpowers/README.md` + `18-superpowers-corpus.mdc` | `upgrade` 到 L3 |
| **L3** | `.cursor/hooks.json` / `.githooks/pre-commit` / `.claude/settings.json` hooks | `upgrade` 到 L3 |
| **L4** | `.cursor/mcp.json.example` + `mcp-usage-guide.md` | `upgrade` 到 L4 |
| **L5** | `docs/agent-config/` + `scripts/agent-config/sync.mjs` | `upgrade` 到 L5（多工具仓推荐） |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 / 整份 pitfalls alwaysApply | **不涉及**（无 rules） |
| plan / archive 当契约 SSOT | **不涉及**（无 superpowers） |
| `.cursor/mcp.json` 含明文密且被跟踪 | **不涉及**（无 MCP 文件） |
| `S_SECRETS_LEAK`（README/yml） | 未发现（仅 pom.xml，无密文） |
| 根 AGENTS 与分册严重漂移且无冲突裁决 | **不涉及**（无 AGENTS） |
| 分册 AGENTS 空壳 | **不涉及**（无分册） |
| Never do 无 Pn 回链 | **不涉及**（无 AGENTS） |
| 路径速查空壳 | **不涉及**（无 AGENTS） |
| meta.ai_tools 与入口/镜像 rules 不一致 | **不涉及**（无 meta） |
| pitfalls 稳定 ID 重号 | **不涉及**（无 pitfalls） |
| pitfalls 未过 lint | **不涉及**（无 lint 脚本） |
| L5 仓生成物漂移 / 手改生成物 | **不涉及**（非 L5） |
| L5 与直渲混用 | **不涉及**（非 L5） |
| 把 Codex `.mdc` 镜像当成已支持 | **不涉及**（无 Codex 资产） |
| 把旧 `ready.ok` / 形态分当真「可 AI coding」 | **不涉及**（无 ready.ok） |
| 把形态覆盖 / inventory 覆盖当真「深真全」 | **不涉及**（未跑 fill） |
| 默认 auto / 启发式脚本写 SSOT | **不涉及**（无 SSOT） |

---

## 建议下一阶

- **当前最高完整阶**：无（低于 L0）
- **仓库特征**：Maven/Java 空壳项目；无业务代码；无现成文档
- **建议**：
  - 若这是**新仓库/教学 fixture**：直接 `land` 到 **L2**（协作入口 + 契约骨架 + 知识回流），或 `pipeline`（大仓首次推荐，默认 L4）
  - 若暂时不想写盘：可先做 `write-meta-only`（仅写 `docs/harness-eng/harness-meta.yaml` 快照，记录 ladder / domains / ai_tools，零模板渲染）
  - 后续填充契约深度：`fill-plan --gold` → `fill-truths-agents` → acceptance → merge；**开干只看 `ai_coding_ready` + `gold_ratio`**

---

## 会话仪表盘

```
┌─────────────────────────────────────────┐
│ 阶段：audit（审计完成）                  │
│ 现状：不可 AI coding（低于 L0）          │
│ 工作：对照 L0–L5 全阶梯逐项勾选，零命中  │
│ 下一步：land 补齐 L0–L2，或 pipeline 到  │
│         L4（大仓首次推荐）               │
└─────────────────────────────────────────┘
```
