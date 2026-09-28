# harness-eng audit — skill-up-3717837903

**目标根:** `/tmp/skill-up-3717837903`  
**类型:** `NEW_CODE_NO_HARNESS`（有栈线索，无任何 harness 资产）  
**meta:** 无 meta

---

## Fingerprint 摘要

| 信号 | 结果 | 备注 |
|---|---|---|
| `S_GIT` | 是 | git 仓库 |
| `S_STACK` | 是 | `pom.xml`（Maven，非 Spring Boot） |
| `S_SPRING` | 否 | pom.xml 无 `spring-boot` 依赖 |
| `S_EMPTY` | 否 | 有 pom.xml |
| `S_AGENTS_ROOT` | 否 | 根无 AGENTS.md |
| `S_AGENTS_MOD` | 否 | 无子目录 AGENTS.md |
| `S_RULES` | 否 | 无任何宿主 rules（.cursor/.claude/.qoder/.trae/.codebuddy） |
| `S_00` | 否 | 无 00-*.mdc |
| `S_KARPATHY` | 否 | 无 karpathy-guidelines.mdc |
| `S_FUNC` / `S_API` / `S_DB` / `S_REDIS` / `S_JOBS` | 否 | 无契约目录 |
| `S_KB` | 否 | 无 docs/agent-kb/ |
| `S_SP` | 否 | 无 docs/superpowers/ |
| `S_HOOKS` | 否 | 无 hooks 文件 |
| `S_MCP` | 否 | 无 mcp.json / mcp.json.example |
| `S_HARNESS_META` | 否 | 无 harness-meta.yaml |
| `S_AGENT_CONFIG` | 否 | 无 L5 管线 |
| `S_SECRETS_LEAK` | 否 | pom.xml 无密文信号 |
| `S_MULTI_TOOL` | 否 | 仅探测到 skill 安装目录 `.claude/`，非项目资产 |
| `S_FRONTEND` | 否 | 无前端线索 |
| `S_SLF4J` | 否 | 无 Java 源码 |
| `S_RELEASES` | 否 | 无 docs/releases/ |

---

## 已具备（按阶梯）

### L0 协作入口
- [ ] 根 `AGENTS.md`
- [ ] `docs/harness-eng/harness-meta.yaml`
- [ ] `.cursor/rules/karpathy-guidelines.mdc` alwaysApply
- [ ] `.cursor/rules/00-project-docs-overview.mdc` alwaysApply
- [ ] （可选行为包）`21-observability-comments.mdc`（`S_SLF4J=否`，不强制）
- [ ] （可选前端协作包）`17-frontend-web.mdc`（`S_FRONTEND=否`，不强制）

### L1 契约骨架
- [ ] `docs/func/` + rule `11`
- [ ] `docs/api/` + rule `12`
- [ ] `docs/db/` + rule `13`
- [ ] `docs/redis/` + rule `16`
- [ ] `docs/jobs/` + rule `20`

### L2 知识回流
- [ ] `docs/agent-kb/` 四文件（README / architecture-overview / pitfalls / accepted-gaps）
- [ ] `pitfalls.md` 表头含「域」列
- [ ] rule `19`

### L3 规划与软门禁
- [ ] `docs/superpowers/README.md`（含进行中表）
- [ ] rule `18`
- [ ] 任一宿主 hooks / `.githooks/pre-commit`

### L4 工具连接样例
- [ ] `mcp.json.example`（任一宿主路径）
- [ ] `docs/harness-eng/mcp-usage-guide.md`
- [ ] `.gitignore` 建议忽略真密 mcp.json

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/README.md`
- [ ] `scripts/agent-config/sync.mjs`
- [ ] 生成物带 GENERATED 标记

---

## 缺口

| 阶 | 缺什么 | 建议动作 |
|---|---|---|
| L0 | 根 AGENTS.md、meta.yaml、karpathy、00-overview、全部 rules | `land` 或 `pipeline` 渲染 L0 骨架 |
| L1 | 全部契约域目录（func/api/db/redis/jobs）及对应 sync rules | 按探测栈确认 `domains` 后补齐 |
| L2 | agent-kb 四文件 + rule 19 | 随 L0–L1 一并 scaffold |
| L3 | superpowers + rule 18 + hooks | 升阶时补齐 |
| L4 | mcp.json.example + 使用说明 | 升阶时补齐 |
| L5 | agent-config/ + sync.mjs + SSOT 管线 | 多工具仓或稳定后再落地 |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 | 不适用（无 rules） |
| plan/archive 当契约 SSOT | 不适用（无 superpowers） |
| `.cursor/mcp.json` 含明文密且被跟踪 | 不适用（无 mcp 文件） |
| `S_SECRETS_LEAK` | 否 |
| 根 AGENTS 与分册漂移 | 不适用（无 AGENTS） |
| 分册 AGENTS 空壳 | 不适用 |
| Never do 无 Pn 回链 | 不适用 |
| 路径速查空壳 | 不适用 |
| meta.ai_tools 与入口不一致 | 不适用（无 meta） |
| pitfalls 稳定 ID 重号 | 不适用 |
| L5 漂移/手改生成物 | 不适用 |
| L5 与直渲混用 | 不适用 |
| Codex `.mdc` 镜像当成已支持 | 不适用 |
| 旧 `ready.ok` / 形态分当真 | 不适用 |

---

## 建议下一阶

- **当前最高完整阶：** 无（无任何阶梯交付物）
- **建议：** 首次落地走 **`land`**（默认 L4）；若为大型仓库（多模块、Controller 百级+）可走 **`pipeline`**（L4 骨架 + fill_engine=agents 精填）
- **栈适配：** Maven/Java，非 Spring Boot；glob 建议 `wide`（单模块小仓）或用户确认模块前缀后 `focused`
- **domains：** 需用户确认契约域（func/api/db/redis/jobs）；当前磁盘无源码可供自动推断
- **ai_tools：** 当前无信号，须追问 `Q_AI_TOOL`；不默认 `[cursor]`
