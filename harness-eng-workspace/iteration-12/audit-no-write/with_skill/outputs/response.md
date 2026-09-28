# harness-eng audit — fixture-new-code

目标根: `/tmp/skill-up-3960442283`  
类型: **NEW_CODE_NO_HARNESS**（仅有 `pom.xml`，无任何 harness 指纹）  
meta: **无 meta**

---

## Fingerprint 信号表

| 信号 | 结果 | 备注 |
|---|---|---|
| `S_GIT` | 是 | git 仓 |
| `S_EMPTY` | 近似是 | 仅有 `pom.xml`，无 `src/` 等源码入口 |
| `S_AGENTS_ROOT` | **否** | 根无 `AGENTS.md` |
| `S_AGENTS_MOD` | 否 | 无分册 `AGENTS.md` |
| `S_RULES` | **否** | 无任何宿主 rules 目录（`.cursor`/`.claude`/`.qoder`/`.trae`/`.codebuddy`） |
| `S_00` | 否 | 无 `00-*.mdc` |
| `S_KARPATHY` | 否 | 无 karpathy 规则 |
| `S_FUNC` | **否** | 无 `docs/func/` |
| `S_API` | **否** | 无 `docs/api/` |
| `S_DB` | **否** | 无 `docs/db/` |
| `S_REDIS` | **否** | 无 `docs/redis/` |
| `S_JOBS` | **否** | 无 `docs/jobs/`，源码无调度指纹 |
| `S_RELEASES` | 否 | 无 |
| `S_FRONTEND` | 否 | 无 `package.json` / frontend 目录 |
| `S_KB` | **否** | 无 `docs/agent-kb/` |
| `S_SP` | 否 | 无 `docs/superpowers/` |
| `S_RUNS` | 否 | 无 `docs/runs/` |
| `S_HOOKS` | **否** | 无 hooks 文件（任何宿主 + `.githooks`） |
| `S_MCP` | **否** | 无 `mcp.json` 或 `.example` |
| `S_CLAUDE` | 否 | `.claude/` 仅含 skill 目录（`skills/harness-eng`），非项目配置 |
| `S_STACK` | 是 | `pom.xml`（Maven/Java） |
| `S_HARNESS_META` | **否** | 无 `harness-meta.yaml` |
| `S_SECRETS_LEAK` | 否 | 未命中 |
| `S_SQL_DIR` | 否 | 无手写 SQL 目录 |
| `S_NO_FLYWAY` | 是 | 无 Flyway 迁移树 |
| `S_AGENT_CONFIG` | **否** | 无 L5 配置管线 |
| `S_MULTI_TOOL` | 0 | 仅 skill 目录，无项目级 AI 工具入口 |

---

## 已具备

> 仓库为 **NEW_CODE_NO_HARNESS** 空壳，仅含一个 `pom.xml`。  
> **L0–L5 无任何必备项已满足。**

### L0 协作入口
- [ ] 根 `AGENTS.md`
- [ ] `karpathy-guidelines.mdc`（alwaysApply）
- [ ] `00-project-docs-overview.mdc`（alwaysApply）
- [ ] `harness-meta.yaml`
- [ ] rule 21 / rule 17（可选行为/前端包）

### L1 契约骨架
- [ ] `docs/func/` + rule 11
- [ ] `docs/api/` + rule 12
- [ ] `docs/db/` + rule 13
- [ ] `docs/redis/` + rule 16
- [ ] `docs/jobs/` + rule 20

### L2 知识回流
- [ ] `docs/agent-kb/` 四文件（README / architecture-overview / pitfalls / accepted-gaps）
- [ ] `19-agent-kb.mdc`

### L3 规划与软门禁
- [ ] `docs/superpowers/` README/ARCHIVE
- [ ] `18-superpowers-corpus.mdc`
- [ ] hooks（任何宿主）
- [ ] `.githooks/pre-commit`

### L4 工具连接样例
- [ ] `mcp.json.example`
- [ ] `mcp-usage-guide.md`

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/`
- [ ] `scripts/agent-config/sync.mjs`

---

## 缺口

| 阶梯 | 缺失路径 | 建议动作 |
|---|---|---|
| L0 | `AGENTS.md` | `land` 生成根 AGENTS（solo 或分册） |
| L0 | `.cursor/rules/karpathy-guidelines.mdc` | `land` 渲染 alwaysApply 规则 |
| L0 | `.cursor/rules/00-project-docs-overview.mdc` | `land` 渲染 alwaysApply 规则 |
| L0 | `docs/harness-eng/harness-meta.yaml` | `land` 写入 meta（或单独 `write-meta-only`） |
| L1 | `docs/func/`、`docs/api/`、`docs/db/` 等 | `land` 按探测域生成契约骨架；本仓为 Maven/Java，建议至少生成 `func` + `api` + `db` 域（若有源码后补真相） |
| L1 | `11-func-sync.mdc`、`12-api-sync.mdc`、`13-db-sync.mdc` 等 | `land` 渲染对应 sync rules |
| L2 | `docs/agent-kb/` 四文件 | `land` 或 `resume` 补齐 |
| L2 | `19-agent-kb.mdc` | `land` 渲染 |
| L3 | `docs/superpowers/` | `land` 生成 README/ARCHIVE |
| L3 | `18-superpowers-corpus.mdc` | `land` 渲染 |
| L3 | `.cursor/hooks.json` / `.githooks/pre-commit` | `land` 生成软提醒 hooks |
| L4 | `.cursor/mcp.json.example` | `land` 生成 example（无密） |
| L4 | `docs/harness-eng/mcp-usage-guide.md` | `land` 生成使用说明 |
| L5 | `docs/agent-config/` + `scripts/agent-config/sync.mjs` | 若需多宿主/L5 管线，后续 `upgrade` 到 L5 |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 / 整份 pitfalls alwaysApply | **不适用**（无 rules） |
| plan / archive 当契约 SSOT | **不适用**（无 superpowers） |
| `.cursor/mcp.json` 含明文密且被跟踪 | **不适用**（无 MCP 文件） |
| `S_SECRETS_LEAK`（README/yml） | **未命中** |
| 根 AGENTS 与分册严重漂移 | **不适用**（无 AGENTS） |
| 分册 AGENTS 空壳 | **不适用**（无分册） |
| Never do 无 Pn 回链 | **不适用**（无 AGENTS） |
| 路径速查空壳 | **不适用** |
| meta.ai_tools 与入口/镜像 rules 不一致 | **不适用**（无 meta） |
| pitfalls 稳定 ID 重号 | **不适用** |
| L5 仓生成物漂移 / 手改生成物 | **不适用**（非 L5） |
| L5 与直渲混用 | **不适用**（非 L5） |
| 把 Codex `.mdc` 镜像当成已支持 | **不适用** |
| 把旧 `ready.ok` / 形态分当真「可 AI coding」 | **不适用** |
| 默认 auto / 启发式脚本写 SSOT | **不适用**（无内容） |

---

## 建议下一阶

- **当前最高完整阶**：无（低于 L0）
- **仓库特征**：Maven/Java 空壳（`pom.xml` 自描述为 `fixture-new-code`），无源码、无契约、无规则、无文档
- **建议**：
  - 若需启用 harness-eng → 直接 **`land`**（全量 scaffold）到目标阶（建议 L4；若多宿主则 L5）
  - 若只想先打标记 → **`write-meta-only`**（仅写 `harness-meta.yaml` 快照）
  - 本仓为 fixture/示例性质，如用于测试 harness-eng skill → `land` 后可验证 L0–L4 齐套

---

## L3/L4 烟测

- **不适用**：当前无任何 L3/L4 产物，无需烟测。

## 会话自证【推荐】L3+

- **未跑**：当前低于 L0，不满足 session-live 前提。

---

**结论**：这是一个 **零产物** 的 Maven 空壳仓库，阶梯 L0–L5 全部缺失。如需补齐，最小动作为 **`land`** 生成完整脚手架（AGENTS + rules + docs + hooks + MCP example）。
