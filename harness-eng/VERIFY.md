# harness-eng 验收记录（0.5.6）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.5.6**。报告壳 `ui.version`（0.2.24）≠ `skill_version`。

## 0.5.6 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.2.mjs` exit 0 | 烟测 |
| manifest `harness-meta` / `mcp-readme` target → `docs/harness-eng/` | 有 |
| 读侧回退 `.cursor/harness-meta.yaml`（及 `.yml`） | 有 |
| L0 不要求 meta **只能**在 `.cursor/` | 有 |
| resume/upgrade 仅旧 meta 时迁到新路径、不删旧文件 | 有 |

## 0.5.5 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.2.mjs` exit 0 | 烟测 |
| 安装一句话 / CLI 不默认 `~/.cursor/skills/harness-eng` 或 `--agent cursor` | 有 |
| 手册 md+html 安装节对齐：宿主用户 skills 目录 + 多宿主示例 | 有 |

## 0.5.4 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.2.mjs` exit 0 | 烟测 |
| [session-dashboard.md](session-dashboard.md) SHOW/HIDE 触发 | 有 |
| 工程轮脚注「详情请查询仪表盘」+ 使用手册.html#s6 | 有 |
| 纯 meta 轮省略整个 `## harness-eng 会话仪表盘` 块 | 有 |

## 0.5.3 增量验收

| 检查 | 结果 |
|---|---|
| [session-dashboard.md](session-dashboard.md) + `session-dash.mjs` | 有 |
| 工程轮脚注「详情请查询仪表盘」+ 使用手册.html#s6 | 有 |

## 0.5.2 增量验收

| 检查 | 结果 |
|---|---|
| `mcp-paths.mjs` + calibrate 多路径 | 有 |
| CodeBuddy：settings hooks 全家桶 + 根 mcp example | 有 |
| Claude：`.claude/rules/*.md` 镜像 | 有 |
| `sync-hosts.md` + adapters/* | 有 |

## 继承

| 版 | 指针 |
|---|---|
| 0.5.1 | Qoder/Trae Claude 系 hooks + rules 镜像 |
| 0.5.0 | L5 / hooks 家族 / pitfalls lint |
| ≤0.4.0 | 见 CHANGELOG |
