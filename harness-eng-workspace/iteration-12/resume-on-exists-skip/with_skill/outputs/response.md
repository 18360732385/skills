## Fingerprint 探测结果

| 信号 | 状态 | 备注 |
|---|---|---|
| `S_GIT` | ✅ 是 | git 仓库 |
| `S_AGENTS_ROOT` | ✅ 是 | 根 `AGENTS.md`（极简：仅 Never do + Commands） |
| `S_RULES` | ❌ 否 | 无 `.cursor/rules` / `.claude/rules` 等任何宿主规则 |
| `S_00` / `S_KARPATHY` | ❌ 否 | 无 alwaysApply 总览、无 Karpathy 规则 |
| `S_FUNC/API/DB/REDIS/JOBS` | ❌ 否 | 无 `docs/{domain}/` 目录 |
| `S_KB` | ❌ 否 | 无 `docs/agent-kb/` |
| `S_SP` | ❌ 否 | 无 `docs/superpowers/` |
| `S_HOOKS` | ❌ 否 | 无 `.cursor/hooks.json` / `.githooks` 等 |
| `S_MCP` | ❌ 否 | 无 `mcp.json` / example |
| `S_HARNESS_META` | ❌ 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| `S_STACK` | ❌ 否 | 无 `pom.xml` / `package.json` / `go.mod` 等源码入口 |
| `S_EMPTY` | ✅ 是 | 近空仓库，无常见源码 |
| `S_SECRETS_LEAK` | ❌ 否 | 暂无所见 |

**仓库类型判定：** `PARTIAL`（有 harness 信号 `S_AGENTS_ROOT`，但无 rules / 契约 / meta / kb，未达 MATURE）

---

## 推荐包 RecommendedProfile

- **模式**：resume（续跑）— 已有 AGENTS 雏形，差分补齐
- **目标阶梯**：L4（工具连接样例）— 空仓/小仓默认骨架一次到位
- **契约域**：**`func, api, db`** — 推荐（空仓通用骨架；无栈信号，待您确认或调整）
- **分册**：solo
- **glob**：wide（空仓默认）
- **Rule14 / Rule21 / Rule17 / 安全预填**：是 / 否 / 否 / 是
- **AI 工具面**：**`cursor`** — 推荐（未探测到任何工具入口；请确认或换 `claude` / `codex` 等）
- **MCP 跟踪策略**：example_only
- **agent_config (L5)**：否（单工具仓默认；若选多工具可升 L5）
- **fill 参数**：深度=完整档 · 引擎=agents · 金标+sample_n=是 · ready_coverage=0.8

> 不确定请回复：**全部推荐**
> （或逐题调整：阶梯 / 域 / AI 工具 / 其他）

---

## WritePlan（续跑 — 补齐 L0→L4 缺口）

### 白话摘要
- **模式**：续跑 — 只补缺；已有 `AGENTS.md` 的 `Never do` / `Commands` 章节正文**保留**，缺失章节追加
- **阶梯**：补齐到 **L4** — L0 协作入口 → L1 契约骨架 → L2 知识回流 → L3 规划与软门禁 → L4 工具连接样例
- **契约域**：按 `func, api, db` 骨架铺设（若您确认其他域，再追加/删减）
- **本轮**：仅装 `mcp.json.example`（无密），不触及真密；新增 hooks 一律 fail-open
- **注意**：空仓无源码，契约 globs 先写宽口径占位，待有栈后再收窄

### 技术摘要
```text
仓库类型: PARTIAL
目标根: /tmp/skill-up-3959359128
模式: resume
目标阶梯: L4
契约域: func, api, db（待最终确认）
agents_variant: solo
glob_profile: wide
on_exists: skip
seed: 是
将新建: 约 25+ 文件 | 合并: 2（AGENTS.md, .gitignore） | 跳过: 已有同名正文
风险: S_SECRETS_LEAK=否；触及 MCP=example_only；将新增 hooks=是（软提醒）
AI 工具: [cursor]（待最终确认）
```

### 文件动作表（按阶梯）

| 目标路径 | 动作 | 说明 | 阶梯 |
|---|---|---|---|
| `AGENTS.md` | **merge** | 保留现有 Never do / Commands；追加 Critical / 文档优先级 / 红线骨架 | L0 |
| `docs/harness-eng/harness-meta.yaml` | create | skill_version / ladder / domains / ai_tools 等元数据 | L0 |
| `.cursor/rules/karpathy-guidelines.mdc` | create | alwaysApply: true | L0 |
| `.cursor/rules/00-project-docs-overview.mdc` | create | alwaysApply: true；文档索引总览 | L0 |
| `.cursor/rules/21-observability-comments.mdc` | create | 行为包 Rule 21（可选，默认装） | L0 |
| `docs/func/func.md` | create | 功能契约索引骨架 | L1 |
| `docs/func/templates/` | create | 真相模板目录 | L1 |
| `docs/func/modules/README.md` | create | 真相子目录指引 | L1 |
| `.cursor/rules/11-func-sync.mdc` | create | globs 待按栈确认（宽口径占位） | L1 |
| `docs/api/api.md` | create | 接口契约索引骨架 | L1 |
| `docs/api/templates/` | create | 真相模板目录 | L1 |
| `docs/api/paths/README.md` | create | 真相子目录指引 | L1 |
| `.cursor/rules/12-api-sync.mdc` | create | globs 待按栈确认（宽口径占位） | L1 |
| `docs/db/db.md` | create | 库表契约索引骨架 | L1 |
| `docs/db/templates/` | create | 真相模板目录 | L1 |
| `docs/db/tables/README.md` | create | 真相子目录指引 | L1 |
| `.cursor/rules/13-db-sync.mdc` | create | globs 待按栈确认（宽口径占位） | L1 |
| `docs/agent-kb/README.md` | create | 知识回流入口 | L2 |
| `docs/agent-kb/architecture-overview.md` | create | 架构速查 | L2 |
| `docs/agent-kb/pitfalls.md` | create | 翻车记录（表头含「域」列） | L2 |
| `docs/agent-kb/accepted-gaps.md` | create | 已接受的缺口 | L2 |
| `.cursor/rules/19-agent-kb.mdc` | create | agent-kb 同步规则 | L2 |
| `docs/superpowers/README.md` | create | 含进行中表 | L3 |
| `.cursor/rules/18-superpowers-corpus.mdc` | create | superpowers 规则 | L3 |
| `.githooks/pre-commit` | create | 软提醒门禁（echo 提示 + exit 0，不拦截） | L3 |
| `.cursor/hooks.json` | create | Cursor 原生 hooks（failClosed 不设强拦） | L3 |
| `.cursor/mcp.json.example` | create | MCP 配置样例（**无密**，仅占位） | L4 |
| `docs/harness-eng/mcp-usage-guide.md` | create | 使用说明 + 「勿提交真密」约定 | L4 |
| `.gitignore` | **merge** | 追加 `.cursor/mcp.json` / `.mcp.json` 等 ignore 片段 | L4 |

> 若最终确认**不含**某个域（如不含 `db`），对应行自动 skip；若追加 `redis`/`jobs`，再补充对应目录与 rule。

### 渲染预览（安全预填）

**AGENTS.md 追加后预览（前段）：**
```markdown
# fixture-partial — AGENTS.md

## Never do

- CUSTOM_NEVER_DO_LINE_DO_NOT_DROP

## Critical（红线）

- TODO(harness-eng): 补充本仓真实红线…

## 文档优先级

1. `docs/func/func.md` → 功能契约
2. `docs/api/api.md` → 接口契约
3. `docs/db/db.md` → 库表契约
4. `docs/agent-kb/README.md` → 知识回流
5. `docs/superpowers/README.md` → 规划与进行中的决策

## Commands

| Task | Command |
|---|---|
| existing | echo ok |
```

**Sync rule globs 预览（以 `11-func-sync` 为例）：**
```yaml
globs:
  - "**/src/main/java/**/*.java"
  - "docs/func/**"
```
> 空仓无源码，globs 先写宽口径；待栈确定后收窄。

### 装后烟测（L3+L4）
- **hooks**：`.githooks/pre-commit` 仅软提醒（`exit 0`），不拦截提交；Cursor `hooks.json` `failClosed` 不设强拦
- **MCP**：仅写入 `.cursor/mcp.json.example`，无真密入库；`.gitignore` 已建议忽略真密路径
- **自检**：按 [ladder.md](ladder.md) 清单执行，列出通过/待补项

---

### 待您最终确认的参数
1. **契约域** `domains`：维持 `func, api, db` 还是调整？
2. **AI 工具** `ai_tools`：维持 `cursor` 还是换 `claude` / `codex` / 多选？
3. **目标阶梯**：维持 L4 还是只到 L2/L3？

> 请回复 **确认**（或 按计划执行 / LGTM）后开始写入。也可先调整上述参数，我再精调 WritePlan。多轮可回复 **确认预授权**。

---

```
┌─────────────────────────────────────────┐
│  会话仪表盘（harness-eng）               │
├─────────────────────────────────────────┤
│ 阶段: WritePlan 待确认                   │
│ 现状: 半成品（PARTIAL），暂不可 AI coding │
│ 工作: 已探测指纹、列出 L0–L4 全量缺口    │
│ 下一步: 用户确认参数与 WritePlan 后写盘  │
└─────────────────────────────────────────┘
```
