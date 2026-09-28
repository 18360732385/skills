好的，按 `harness-eng` 默认分流执行。

---

## 探测结果 — Fingerprint

| 信号 | 状态 | 备注 |
|---|---|---|
| `S_GIT` | ✅ | git 仓 |
| `S_EMPTY` | ❌ | 有 AGENTS.md、docs、.claude/rules |
| `S_AGENTS_ROOT` | ✅ | 根 `AGENTS.md` |
| `S_AGENTS_MOD` | ❌ | 无子目录 AGENTS |
| `S_RULES` | ✅ | `.claude/rules/00-overview.md`（非仅 Cursor） |
| `S_00` | ✅ | `.claude/rules/00-overview.md` |
| `S_FUNC` | ❌ | 无 `docs/func/` |
| `S_API` | ✅ | `docs/api/api.md` |
| `S_DB` | ❌ | 无 `docs/db/` |
| `S_REDIS` | ❌ | 无 |
| `S_JOBS` | ❌ | 无 |
| `S_KB` | ✅ | `docs/agent-kb/README.md` |
| `S_SP` | ❌ | 无 |
| `S_HOOKS` | ❌ | 无 |
| `S_MCP` | ❌ | 无 |
| `S_CLAUDE` | ✅ | `.claude/` |
| `S_STACK` | ❌ | 无 pom.xml / package.json / go.mod 等 |
| `S_HARNESS_META` | ❌ | 无 `harness-meta.yaml` |
| `S_SECRETS_LEAK` | ❌ | 无 |
| `S_MULTI_TOOL` | ❌ | 仅 `.claude/` |
| `S_ENV_PROFILES` | `[local]` | 无 profile 文件，默认 local |

**类型判定：MATURE**  
（`S_AGENTS_ROOT` + `S_RULES` + `S_API` + `S_KB` 齐套）

---

## RecommendedProfile

- **模式**: `audit`（MATURE 默认）
- **目标阶梯**: —（audit 只读不写盘）
- **契约域**: `api`（探测到 `docs/api/`；无栈信号，不扩 db/func）
- **分册**: `solo`（无模块分册信号）
- **glob**: `wide`（小仓）
- **Rule14 / Rule21 / 前端协作包**: 默认否 / 否 / 否
- **AI 工具面**: `claude`（探测到 `.claude/rules/`）
- **MCP 跟踪策略**: —（无 L4）
- **fill**: —（audit 不触发）

---

# harness-eng audit — skill-up-1749826826

**目标根**: `\\wsl.localhost\Ubuntu\tmp\skill-up-1749826826`  
**类型**: MATURE（Claude-only fixture）  
**meta**: 无 meta

---

## 已具备

### L0 协作入口
- [x] 根 `AGENTS.md`（fixture-mature-claude；含 Commands / Never do）
- [ ] `docs/harness-eng/harness-meta.yaml` ❌ **缺口**
- [ ] `karpathy-guidelines.mdc`（alwaysApply）❌ **缺口**（本仓无 `.cursor/rules`）
- [x] `00` 总览 alwaysApply（`.claude/rules/00-overview.md`）
- [ ] rule 21 行为包 — 不适用（非 Java / 无 SLF4J）
- [ ] rule 17 前端协作包 — 不适用（无前端信号）

### L1 契约骨架
- [ ] `docs/func/` + rule 11 — 不适用（域不含 func）
- [x] `docs/api/api.md`（非空）
- [ ] `docs/api/templates/` ❌ **缺口**
- [ ] `docs/api/modules/README` 或真相子目录 ❌ **缺口**
- [ ] rule 12（api sync）❌ **缺口**
- [ ] `docs/db/` / `docs/redis/` / `docs/jobs/` — 不适用

### L2 知识回流
- [x] `docs/agent-kb/README.md`
- [ ] `architecture-overview.md` ❌ **缺口**
- [ ] `pitfalls.md` ❌ **缺口**
- [ ] `accepted-gaps.md` ❌ **缺口**
- [ ] rule 19（agent-kb sync）❌ **缺口**

### L3 规划与软门禁
- [ ] `docs/superpowers/README.md` ❌ **缺口**
- [ ] rule 18 ❌ **缺口**
- [ ] hooks.json / `.githooks/pre-commit` ❌ **缺口**

### L4 工具连接样例
- [ ] `mcp.json.example` ❌ **缺口**
- [ ] `mcp-usage-guide.md` ❌ **缺口**

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/` + `sync.mjs` ❌ **缺口**

---

## 缺口

| 项 | 建议动作 |
|---|---|
| `harness-meta.yaml` | `write-meta-only` 快照（ladder/domains/ai_tools）或 `resume` 补齐 |
| `docs/api/templates/` + 真相子目录 | `land` / `resume` 补 api 域骨架 |
| `rule 12`（api sync） | 随 api 域一起落地 |
| `docs/agent-kb/architecture-overview.md`、`pitfalls.md`、`accepted-gaps.md` | `resume` 补 L2 |
| `rule 19` | 随 agent-kb 一起落地 |
| `docs/superpowers/` + `rule 18` + hooks | `upgrade` 到 L3 |
| `mcp.json.example` + 说明 | `upgrade` 到 L4 |
| Karpathy alwaysApply | 若本仓期望 Cursor 镜像则补；Claude-only 可豁免（detect 已诚实） |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 | ❌ 未发现（仅 1 条 rule） |
| plan/archive 当契约 SSOT | ❌ 未发现 |
| `.cursor/mcp.json` 含明文密 | — 无 mcp.json |
| `S_SECRETS_LEAK` | ❌ 未发现 |
| 根 AGENTS 与分册漂移 | — 无分册 |
| 分册 AGENTS 空壳 | — 无分册 |
| **Never do 无 Pn 回链** | ⚠️ `AGENTS.md` 有「Never do」但无 `→ Pn`（fixture 级 minimal；若为真实仓需补） |
| 路径速查空壳 | ⚠️ AGENTS.md 无「改动路径速查」实表 |
| meta.ai_tools 与入口不一致 | — 无 meta |
| pitfalls 未过 lint | — 无 pitfalls |
| L5 生成物漂移/手改 | — 非 L5 |
| Codex `.mdc` 镜像误认 | — 无 Codex 信号 |
| 旧 `ready.ok` 形态分 | — 未发现 |

---

## 建议下一阶

- **当前最高完整阶**: L0（有 AGENTS + 00 总览），但缺 `harness-meta.yaml` 与 Karpathy
- **L1 部分具备**: api 域有 `api.md` 但缺 templates / sync rule / 真相子目录
- **建议**:  
  - 若仅想给本 fixture 补 meta 快照 → `write-meta-only`（不写盘，audit 范围）  
  - 若继续补齐 → `resume`（补 L0 meta + L1 api 完整骨架 + L2 agent-kb）  
  - 若升阶 → `upgrade` 到 L3/L4

---

**audit 完成。本模式未写盘。**  
如需补齐，可回复 `resume`、`upgrade L3` 或 `全部推荐`。
