# harness-eng 验收记录（0.6.1-dev）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.6.1-dev**（Trae P0 spike）。报告对照 **`skill_version` + `report_schema`**（JSON 仍暴露 `ui.version` 0.2.24；**报告壳版本 ≠ skill**）。实证见 [host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。

## 0.6.1-dev 增量验收（Trae P0）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.1-dev` | 有 |
| [TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md) T-P0-1…4 状态表 | 有 |
| Trae 镜像保留 `alwaysApply` / `globs`；Claude/Qoder 仍 strip | 有 |
| `mature-trae` 无 `.cursor/rules` 仍 MATURE | 有 |
| 适配卡去掉「若宿主支持」；矩阵 Trae 仍 **中高** | 有 |
| 未改矩阵 中高→高 | 有 |

## 0.6.0 增量验收（M4）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 恰好 `0.6.0`（无 `-dev`） | 有 |
| 根 md ≤20 | 有 |
| `archive/selfcheck/legacy/` 热树只留 INDEX；无 `.mjs` 体积 | 有 |
| `.skillignore` + archive README「安装 ≠ 全仓」 | 有 |
| 近期 0.4/0.5 归档 selfcheck 可保留；`fill-truths-auto` 仍归档 | 有 |
| G6 Codex P2 冻结文案仍一致（无新 Codex 能力） | 有 |
| `harness.mjs --help` 可跑 | 有 |

## 0.6.0-dev 增量验收（M3）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| `fill-inventory.mjs --help` / `--domain`（≥2 域）与 `fill-merge.mjs --help` | 有 |
| 域脚本为弃用 shim（≤~30 行，只转发 argv）；实现在 lib | 有 |
| `l5-sync-golden` 上 `sync.mjs --check` 绿 | 有 |
| `multi-host-hooks` 多宿主 hooks 信号（S_HOOKS） | 有 |
| mature-claude / mature-trae / qoder-hooks / stack-node 仍绿 | 有 |
| 版本仍为 `0.6.0-dev`（未钉 0.6.0）；根 md ≤20 | 有 |

## 0.6.0-dev 增量验收（M2）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| 根目录 `harness-eng/*.md` ≤ 20（现 15） | 有 |
| `modes/` · `fill/` · `host/` 规格已搬家 | 有 |
| 热路径旧路径薄 stub（write-plan / detect / fill / pipeline / fill-truths-auto） | 有 |
| AGENT-INDEX 必读 ≤ 8；SKILL / QUICKSTART 路径已改 | 有 |
| 版本仍为 `0.6.0-dev`（未钉 0.6.0） | 有 |

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
| fixture：`mature-claude` / `mature-trae` / `qoder-hooks` / `stack-node` | 有 |
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
| [session-dashboard.md](modes/session-dashboard.md) SHOW/HIDE 触发 | 有 |
| 工程轮脚注「详情请查询仪表盘」+ 使用手册.html#s6 | 有 |
| 纯 meta 轮省略整个 `## harness-eng 会话仪表盘` 块 | 有 |

## 0.5.3 增量验收

| 检查 | 结果 |
|---|---|
| [session-dashboard.md](modes/session-dashboard.md) + `session-dash.mjs` | 有 |
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
