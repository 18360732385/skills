探测完成。以下是当前仓库的 **Fingerprint 信号表**：

---

## 🔍 Fingerprint 信号表

| 信号 | 值 | 备注 |
|---|---|---|
| `S_GIT` | ✅ | `.git` 存在 |
| `S_AGENTS_ROOT` | ✅ | 根 `AGENTS.md` |
| `S_RULES` | ✅ | `.claude/rules/00-overview.md` 非空（`.claude/rules`，非仅 Cursor） |
| `S_00` | ❌ | 无 `00-*.mdc`（当前为 `.md`） |
| `S_FUNC` | ❌ | 无 `docs/func/` |
| `S_API` | ✅ | `docs/api/api.md` 非空 |
| `S_DB` | ❌ | 无 `docs/db/` |
| `S_REDIS` | ❌ | 无 `docs/redis/` |
| `S_JOBS` | ❌ | 无 `docs/jobs/` |
| `S_KB` | ✅ | `docs/agent-kb/README.md` 非空 |
| `S_SP` | ❌ | 无 `docs/superpowers/` |
| `S_RUNS` | ❌ | 无 `docs/runs/` |
| `S_HOOKS` | ❌ | 无 hooks 配置 |
| `S_MCP` | ❌ | 无 mcp.json |
| `S_CLAUDE` | ✅ | `.claude/` 存在 |
| `S_STACK` | ❌ | 无技术栈文件（pom.xml / package.json / go.mod 等） |
| `S_HARNESS_META` | ❌ | 无 `docs/harness-eng/harness-meta.yaml` |
| `S_SECRETS_LEAK` | ❌ | 无密文泄露 |
| `S_FRONTEND` | ❌ | 无前端工程 |
| `S_MULTI_TOOL` | ❌ | 仅 `.claude/` 一个 AI 工具入口 |
| `S_AGENT_CONFIG` | ❌ | 无 L5 配置管线 |
| `S_ENV_PROFILES` | `[local]` | 无 profile 文件，默认 local |

---

## 🏷️ 类型判定

**MATURE** — 根 `AGENTS.md` + 任一宿主 `rules`（`.claude/rules`）+ 至少一个契约域（`S_API`）+ 知识回流（`S_KB`）齐套。  
⚠️ 但缺少 `S_HARNESS_META`（无 `docs/harness-eng/harness-meta.yaml`），且仅有 `api` 一个契约域，`func/db/redis/jobs` 均缺失。

---

## 📦 推荐包 RecommendedProfile

- **模式**: `audit`（MATURE 默认分流）— 理由：已有 AGENTS + rules + api + kb，先审计缺口
- **目标阶梯**: 若补齐/升级则 **L4 工具连接样例** — 理由：小仓默认直达 hooks/MCP example
- **契约域**: `api`（已有）；`func, db, redis, jobs` 均缺失
- **分册**: `solo`（无子模块）
- **glob**: `wide`（小仓/无源码）
- **Rule14 / Rule21 / Rule17 / 安全预填**: 是 / 否 / 否 / 是
- **AI 工具面**: `claude` — 理由：探测到 `.claude/`
- **MCP 跟踪策略**: `example_only`（L4 理想态）
- **L5 配置 SSOT 管线**: 否（单工具仓，无 `S_MULTI_TOOL`）
- **hooks 家族**: `commit-gate-extended, after-edit`（若升至 L3+）

> 不确定怎么选？可直接回复：**全部推荐**（采用上表；收齐参数后仍出 WritePlan，写盘过闸门）。

---

## ❓ 本轮动作（MATURE 仓库）

1. **先审计**（默认）— 输出缺口清单、反模式、覆盖评分
2. **补齐**（resume）— 补齐缺失的 harness-meta、func/db/redis/jobs 契约骨架等
3. **升阶**（upgrade）— 从当前状态升级到更高阶梯（如 L3 hooks / L4 MCP）

请回复选项编号（1/2/3），或回复 **全部推荐**。
