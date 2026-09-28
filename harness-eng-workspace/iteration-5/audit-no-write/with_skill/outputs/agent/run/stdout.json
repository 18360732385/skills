# harness-eng audit — skill-up-2214127303

目标根: `/tmp/skill-up-2214127303`  
类型: **FOREIGN**（纯空仓，无 harness-eng 产物）  
meta: **无 meta**（未找到 `docs/harness-eng/harness-meta.yaml` 或 `.cursor/harness-meta.yaml`）  
探测到: Maven 项目（`pom.xml`）

---

## 已具备

### L0 协作入口
- [ ] 根 `AGENTS.md`
- [ ] `.cursor/rules/karpathy-guidelines.mdc`（alwaysApply）
- [ ] `.cursor/rules/00-project-docs-overview.mdc`（alwaysApply）
- [ ] `docs/harness-eng/harness-meta.yaml`
- [ ] （可选）rule 21 行为包
- [ ] （可选）rule 17 前端协作包

### L1 契约骨架
- [ ] `docs/func/` + rule 11
- [ ] `docs/api/` + rule 12
- [ ] `docs/db/` + rule 13
- [ ] `docs/redis/` + rule 16
- [ ] `docs/jobs/` + rule 20
- [ ] 真相子目录 README（modules / table / keys / tasks）

### L1 超集 / 过程包
- [ ] `docs/releases`
- [ ] 前端协作包

### L2 知识回流
- [ ] `docs/agent-kb/README.md`
- [ ] `docs/agent-kb/architecture-overview.md`
- [ ] `docs/agent-kb/pitfalls.md`（含「域」列）
- [ ] `docs/agent-kb/accepted-gaps.md`
- [ ] rule 19

### L3 规划与软门禁
- [ ] `docs/superpowers/README.md`（含进行中表）
- [ ] rule 18
- [ ] `.cursor/hooks.json` / 其他工具 hooks
- [ ] `.githooks/pre-commit` + gate

### L4 工具连接样例
- [ ] `.cursor/mcp.json.example`（或等价路径）
- [ ] `docs/harness-eng/mcp-usage-guide.md`
- [ ] `.gitignore` 建议含 `.cursor/mcp.json`

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/README.md`
- [ ] `scripts/agent-config/sync.mjs`
- [ ] `node scripts/agent-config/sync.mjs --check` 无漂移

---

## 缺口

| 阶梯 | 缺口项 | 建议动作 |
|---|---|---|
| L0 | 根 `AGENTS.md` | land / resume → 渲染根薄分册 |
| L0 | `karpathy-guidelines.mdc` + `00-project-docs-overview.mdc` | land → 写入 `.cursor/rules/` |
| L0 | `harness-meta.yaml` | land → 写入 `docs/harness-eng/`（或仅 write-meta-only） |
| L1 | 全部契约域（func/api/db/redis/jobs）| 提问确认 `domains` → land 渲染骨架 |
| L1 | 真相子目录 README | 后续 `fill-plan` / `fill-truths-agents` 精填 |
| L2 | `docs/agent-kb/` 四文件 + rule 19 | land / resume → 渲染骨架 |
| L3 | `docs/superpowers/` + rule 18 + hooks | upgrade 到 L3 |
| L4 | `mcp.json.example` + 使用说明 | upgrade 到 L4 |
| L5 | `docs/agent-config/` + `sync.mjs` | upgrade 到 L5（多工具仓推荐） |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 | **N/A**（无 rules 文件） |
| plan / archive 当契约 SSOT | **N/A** |
| `.cursor/mcp.json` 含明文密且被跟踪 | **N/A**（无 mcp.json） |
| `S_SECRETS_LEAK`（README/yml）| **未检出**（无 README，pom.xml 未检出密文） |
| 根 AGENTS 与分册严重漂移 | **N/A** |
| 分册 AGENTS 空壳 | **N/A** |
| Never do 无 Pn 回链 | **N/A** |
| 路径速查空壳 | **N/A** |
| meta.ai_tools 与入口/镜像 rules 不一致 | **N/A**（无 meta） |
| pitfalls 稳定 ID 重号 | **N/A** |
| L5 仓生成物漂移 / 手改生成物 | **N/A** |
| 把 Codex `.mdc` 镜像当成已支持 | **N/A** |
| 把旧 `ready.ok` / 形态分当真 | **N/A** |
| 默认 auto / 启发式脚本写 SSOT | **N/A** |

---

## 建议下一阶

- **当前最高完整阶**：**无**（低于 L0）
- **仓库特征**：Java/Maven（`pom.xml`），若含 SLF4J 等可后续考虑 rule 21 行为包
- **建议**：`land` 到 **L2** 或 **L4**（首次施工）；或先 **write-meta-only** 建立 `harness-meta.yaml` 快照
- 若为大仓/多模块：首次建议 `pipeline`（L4，`fill_engine=agents`）
