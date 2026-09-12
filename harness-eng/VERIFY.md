# harness-eng 验收记录（0.6.0-dev）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.6.0-dev**。报告对照 **`skill_version` + `report_schema`**（JSON 仍暴露 `ui.version` 0.2.24；**报告壳版本 ≠ skill**）。0.6.0 计划见 [ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。

## 0.6.0-dev 增量验收（M1）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `scripts/harness.mjs`：`--mode land\|resume\|upgrade\|pipeline-skeleton` | 有 |
| `land.mjs` 薄别名；`render.mjs --help` 指向 harness | 有 |
| L5/`agent_config` 不经 render 写 `.cursor/rules` | 有 |
| ROADMAP + G6「0.6.x 冻结 P2，全量对等另立项」 | 有 |
| manifest / meta 钉 `0.6.0-dev` | 有 |

## 0.5.10 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| Codex「部分对齐·不默认」；未探测不进「全部推荐」 | 有 |
| 皆无探测 `ai_tools: []`，不默认 Cursor | 有 |
| glossary / 报告页脚：`skill_version` + `report_schema` | 有 |
| CHANGELOG 0.4.x 归档；fill-truths-auto 迁 archive | 有 |

## 0.5.9 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `AGENT-INDEX.md` + `fill/README.md`；SKILL 填充行先指向索引 | 有 |
| `land.mjs`：L5/`agent_config` 不经 render 写 `.cursor/rules` | 有 |
| `fill-inventory.mjs --domain` + `fill-merge.mjs --domain` 为规范入口 | 有 |
| fixture：`mature-claude` / `qoder-hooks` / `stack-node` | 有 |
| `_meta` schema_version 注释（≠ skill_version）含 morph / score-policy | 有 |

## 0.5.8 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `S_RULES` / `S_HOOKS` / `MATURE` 按多宿主计（非仅 Cursor） | 有 |
| 热路径 `scripts/selfcheck.mjs`；archive README 不再写 `selfcheck-0.3.*` | 有 |
| Codex + L5：WritePlan / audit / ladder / sync-hosts 可见 **P2 / 部分对齐**（sync 不全量分发） | 有 |

## 0.5.7 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `contract-sync-mirror` 不以 `.cursor/rules/11\|12\|13\|16` 为全宿主唯一权威 | 有 |
| 对齐矩阵：Cursor/Claude/Qoder/WorkBuddy 高；Trae 中高；Codex 部分（P2） | 有 |
| L3+ / L5 全量镜像宿主跳过冗余 `1x`；Codex 仍写 `contract-sync.md` | 有 |

## 0.5.6 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest `harness-meta` / `mcp-readme` target → `docs/harness-eng/` | 有 |
| 读侧回退 `.cursor/harness-meta.yaml`（及 `.yml`） | 有 |
| L0 不要求 meta **只能**在 `.cursor/` | 有 |
| resume/upgrade 仅旧 meta 时迁到新路径、不删旧文件 | 有 |

## 0.5.5 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| 安装一句话 / CLI 不默认 `~/.cursor/skills/harness-eng` 或 `--agent cursor` | 有 |
| 手册 md+html 安装节对齐：宿主用户 skills 目录 + 多宿主示例 | 有 |

## 0.5.4 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
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
