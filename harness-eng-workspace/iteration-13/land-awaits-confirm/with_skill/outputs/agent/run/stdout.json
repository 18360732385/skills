---

## WritePlan（写盘前计划）

### 白话摘要

确认后仓库会获得以下能力：

1. **AI 协作入口**（L0）：根 `AGENTS.md` 提供 Commands、Never do 红线、文档优先级与改动路径速查；Karpathy 总览 + 项目文档索引 alwaysApply。
2. **契约骨架**（L1）：`docs/func`、`docs/api`、`docs/db` 三域索引 + 真相子目录 + 模板；配套 Cursor path rules（11/12/13），改代码前须先读对应真相。
3. **知识回流**（L2）：`docs/agent-kb` 四件套（architecture / pitfalls / accepted-gaps / delivery-checklist）+ rule 19 + pitfalls lint 脚本。
4. **规划与软门禁**（L3）：`docs/superpowers` 进行中表 + ARCHIVE + rule 18；`.githooks/pre-commit` 兜底软提醒（fail-open，不拦截提交）。
5. **工具连接样例**（L4）：`.cursor/mcp.json.example`（无密）+ `docs/harness-eng/mcp-usage-guide.md`；`.gitignore` 追加忽略真密 `mcp.json`。

> 本仓未探测到任何 AI 工具入口（`ai_tools=[]`），因此 L3 不生成 Cursor/Claude/Trae 等**宿主原生 hooks**；仅保留 `.githooks/` 兜底。后续若启用某宿主，可 `upgrade` 或 `resume` 补装。

---

### 技术摘要

```text
仓库类型: NEW_CODE_NO_HARNESS
目标根: /tmp/skill-up-299053562
模式: land
目标阶梯: L4（工具连接样例）
契约域: func, api, db
agents_variant: solo
glob_profile: wide
on_exists: fail（空仓，全部新建）
Q_SEED: 是
将新建: 42 | 合并: 0 | 跳过: 0 | 备份后创建: 0
风险: 将改 alwaysApply=00/karpathy；将新增 hooks=githooks 兜底；触及 MCP=example_only（无密）
S_SECRETS_LEAK: 否
db 迁移模式: manual_sql（S_NO_FLYWAY）
```

---

### 文件动作表

| 目标路径 | 动作 | 模板源 | 阶梯 | 备注 |
|---|---|---|---|---|
| `AGENTS.md` | create | `agents/AGENTS.root.solo.md.tmpl` | L0 | solo 厚节（定位/速查/ Never do） |
| `docs/harness-eng/harness-meta.yaml` | create | `meta/harness-meta.yaml.tmpl` | L0 | skill_version / ladder / domains |
| `docs/harness-eng/score-policy.yaml` | create | `docs/harness-eng/score-policy.yaml.tmpl` | L1 | strict / all_domains / 0.8 |
| `docs/harness-eng/README.md` | create | `docs/harness-eng/README.md` | L2 | 施工现场说明 |
| `docs/harness-eng/mcp-usage-guide.md` | create | `mcp/mcp-usage-guide.md.tmpl` | L4 | 含「勿提交真密」约定 |
| `.cursor/rules/00-project-docs-overview.mdc` | create | `rules/00-project-docs-overview.mdc.tmpl` | L0 | alwaysApply: true |
| `.cursor/rules/karpathy-guidelines.mdc` | create | `rules/karpathy-guidelines.mdc` | L0 | alwaysApply: true |
| `.cursor/rules/14-chinese-skill-docs.mdc` | create | `rules/14-chinese-skill-docs.mdc.tmpl` | L0 | Q_RULE14=是 |
| `.cursor/rules/11-func-sync-rules.mdc` | create | `rules/11-func-sync.mdc.tmpl` | L1 | globs 见下预览 |
| `.cursor/rules/12-api-doc-sync-rules.mdc` | create | `rules/12-api-doc-sync.mdc.tmpl` | L1 | globs 见下预览 |
| `.cursor/rules/13-db-doc-sync-rules.mdc` | create | `rules/13-db-doc-sync.mdc.tmpl` | L1 | globs 见下预览 |
| `.cursor/rules/19-agent-kb.mdc` | create | `rules/19-agent-kb.mdc.tmpl` | L2 | agent-kb 同步 |
| `.cursor/rules/18-superpowers-corpus.mdc` | create | `rules/18-superpowers-corpus.mdc.tmpl` | L3 | 规划语料约束 |
| `docs/func/func.md` | create | `docs/func/func.md.tmpl` | L1 | 索引 + 导航 |
| `docs/func/modules/README.md` | create | `docs/func/modules/README.md` | L1 | 真相子目录 |
| `docs/func/templates/func-template.md` | create | `docs/func/templates/func-template.md` | L1 | 模块真相模板 |
| `docs/func/templates/func-index-template.md` | create | `docs/func/templates/func-index-template.md` | L1 | 索引模板 |
| `docs/api/api.md` | create | `docs/api/api.md.tmpl` | L1 | 索引 + 导航 |
| `docs/api/modules/README.md` | create | `docs/api/modules/README.md` | L1 | 真相子目录 |
| `docs/api/templates/api-doc-template.md` | create | `docs/api/templates/api-doc-template.md` | L1 | API 真相模板 |
| `docs/api/templates/api-index-template.md` | create | `docs/api/templates/api-index-template.md` | L1 | 索引模板 |
| `docs/db/db.md` | create | `docs/db/db.md.tmpl` | L1 | 索引 + 迁移模式声明 |
| `docs/db/table/README.md` | create | `docs/db/table/README.md` | L1 | 真相子目录 |
| `docs/db/templates/db-table-template.md` | create | `docs/db/templates/db-table-template.md` | L1 | 表真相模板 |
| `docs/db/templates/db-index-template.md` | create | `docs/db/templates/db-index-template.md` | L1 | 索引模板 |
| `docs/agent-kb/README.md` | create | `docs/agent-kb/README.md` | L2 | — |
| `docs/agent-kb/architecture-overview.md` | create | `docs/agent-kb/architecture-overview.md` | L2 | — |
| `docs/agent-kb/pitfalls.md` | create | `docs/agent-kb/pitfalls.md` | L2 | 表头含域列 |
| `docs/agent-kb/accepted-gaps.md` | create | `docs/agent-kb/accepted-gaps.md` | L2 | — |
| `docs/agent-kb/delivery-checklist.md` | create | `docs/agent-kb/delivery-checklist.md` | L2 | 交付收口 |
| `scripts/agent-kb/refresh-score.mjs` | create | `scripts/refresh-score.mjs.tmpl` | L2 | 刷新打分 |
| `scripts/agent-kb/lint-pitfalls.mjs` | create | `scripts/lint-pitfalls.mjs.tmpl` | L2 | pitfalls lint |
| `docs/superpowers/README.md` | create | `docs/superpowers/README.md.tmpl` | L3 | 进行中表 |
| `docs/superpowers/ARCHIVE.md` | create | `docs/superpowers/ARCHIVE.md.tmpl` | L3 | 归档 |
| `docs/superpowers/plans/.gitkeep` | create | `docs/superpowers/plans/.gitkeep` | L3 | — |
| `docs/superpowers/specs/.gitkeep` | create | `docs/superpowers/specs/.gitkeep` | L3 | — |
| `docs/superpowers/archive/plans/.gitkeep` | create | `docs/superpowers/archive/plans/.gitkeep` | L3 | — |
| `docs/superpowers/archive/specs/.gitkeep` | create | `docs/superpowers/archive/specs/.gitkeep` | L3 | — |
| `.githooks/superpowers-commit-gate.js` | create | `hooks/superpowers-commit-gate.js.tmpl` | L3 | 软提醒 gate（空 CODE_PREFIXES） |
| `.githooks/pre-commit` | create | `hooks/githooks-pre-commit.tmpl` | L3 | fail-open；建议 core.hooksPath |
| `.cursor/mcp.json.example` | create | `mcp/mcp.json.example` | L4 | 含 mysql/redis/browser 占位 |
| `.gitignore` | merge-append | `gitignore/harness.gitignore.snippet` | L4 | 追加 snippet（不覆盖整文件） |

---

### 渲染预览

#### 1) 拟写入 `AGENTS.md` 的前 20 行（预填后）

```markdown
# fixture-new-code — AGENTS.md

> AI 协作总入口。本仓**暂无**分册 `AGENTS.md`；契约真相见 `docs/func|api|db|redis|jobs`（按已启用域）。  
> **solo 模式**：定位 / 改动路径等「厚」约定写在本文件下方，勿写「见分册」。

## Critical

TODO(harness-eng): 写明本仓最易踩的构建/运行命令红线（例：必须在仓库根执行某工具）。

## 模块定位（solo 厚节）

| 项 | 说明 |
|---|---|
| 职责 | TODO(harness-eng): harness-eng NEW_CODE_NO_HARNESS fixture |
| 边界 | TODO(harness-eng): 本仓做什么 / 不做什么 |
| 技术栈 | TODO(harness-eng) |
| 入口 / 端口 | TODO(harness-eng) |

## Commands

| Task | Command |
|---|---|
| TODO | TODO(harness-eng): 填真实命令 |
```

#### 2) 拟写入各 sync rule 的 `globs:` 行

```yaml
# .cursor/rules/11-func-sync-rules.mdc
globs: **/src/main/java/**/*.java,docs/func/**

# .cursor/rules/12-api-doc-sync-rules.mdc
globs: **/controller/**/*.java,docs/api/**

# .cursor/rules/13-db-doc-sync-rules.mdc
globs: **/db/migration/**,docs/db/**,**/entity/**/*.java
```

> 空仓暂无手写 SQL 目录，采用 Maven 标准 globs；`docs/db/db.md` 将声明 `migration_mode: manual_sql`。

#### 3) 装后烟测（L3 + L4）

| 项 | 预期 | 验证方式 |
|---|---|---|
| githooks | `.githooks/pre-commit` 调用 gate 脚本后 `exit 0`（不拦截） | `git commit --allow-empty -m "test"` 看是否仅提醒、不失败 |
| MCP | `.cursor/mcp.json.example` 无密；说明文档提醒「勿提交真密」 | 检查 `.cursor/mcp.json.example` 无 `password` 明文 |
| gitignore | 追加 snippet：建议忽略 `.cursor/mcp.json` | 检查 `.gitignore` 未整文件覆盖 |

---

### 分级移交 TODO（写盘 Done 后打印）

**P0 — 空转阻断**
1. 核实根 `AGENTS.md`「Commands」与 Critical 红线（预填骨架须人工跑通）
2. 确认写入根路径 `/tmp/skill-up-299053562` 无误

**P1 — 契约可协作**
3. 若团队有主题流程控制器（别名如 feature-eng）：**新会话**点名其 `init` / `start`；**勿在本会话**继续 land/fill 代跑主题
4. 为 `func/api/db` 各域补充首个 `01-*.md` 真相，或跑 `seed-truths`
5. 填写 `AGENTS.md`「Never do」**域**红线（鉴权、迁移边界等；只写本仓真实约束）

**P2 — 知识回流**
6. 按域追加真实 `Pn`（有翻车后再写）
7. 将稳定高频翻车压缩进 `00` 薄片表

---

> 请回复 **确认**（或 `按计划执行` / `LGTM`）后开始写入。多轮可回复 **确认预授权**。`全部推荐` 只收齐答题；写盘仍须本确认。

---

```
╔══════════════════════════════════════════════════════════════════╗
║  会话仪表盘                                                        ║
╠══════════════════════════════════════════════════════════════════╣
║  【阶段】WritePlan 待确认                                           ║
║  【现状】仓库无 harness；落地 L4 后可达 ai_coding_ready 骨架态       ║
║  【工作】已出示 42 项文件动作表 + 预填预览 + 烟测 + 移交 TODO         ║
║  【下一步建议】回复「确认」过闸门后写盘；或回复「只执行 L0」降级       ║
╚══════════════════════════════════════════════════════════════════╝
```
