# harness-eng 验收记录（0.6.4）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.6.4**（CodeBuddy 扁平 rules+FM；Trae **高**；会话仪表盘无 mermaid / 无分精简；session-dashboard；sync.mjs freshness gate）。报告对照 **`skill_version` + `report_schema`**（0.2.24；**报告壳 ≠ skill**）。实证见 [host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。

## 0.6.4 增量验收（正式钉号 · CodeBuddy / WorkBuddy 官方对齐）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.4`（无 `-dev`） | 有 |
| CHANGELOG 正式标题 `## 0.6.4`（非 `## 0.6.4-dev`）；含「由 **0.6.4-dev** 钉号」 | 有 |
| VERIFY / README / QUICKSTART / 手册当前钉 **0.6.4** | 有 |
| workbuddy rules → `.codebuddy/rules/<stem>.md` 且保留 FM | 有 |
| hooks matcher 仍 Bash；文档含 `/hooks` 面板 + `$CODEBUDDY_PROJECT_DIR` | 有 |
| 根 `.mcp.json`；permissions 合并不 wipe；不生成 settings.local / agents | 有 |
| settings 优先级：CLI > local > project > user | 有 |
| `host/CODEBUDDY-PARITY.md` · `CODEBUDDY-P0-MANUAL.md` 基线 **0.6.4** | 有 |
| upgrade `## 0.6.3 → 0.6.4`：meta · 扁平 rules+FM · `/hooks` · L5 三步（main → check-freshness → 刷新 sync） | 有 |
| 安装 URL 仍 `main`；Trae 矩阵不改；Codex 不重开 | 有 |

## 0.6.3 增量验收（正式钉号 · freshness · 报告壳）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.3` | 有 |
| tmpl + golden 含 `HARNESS_SYNC_TMPL_ID`；stale fixture `--check-freshness` 非 0 | 有 |
| 安装 URL 指向 `main`（非 `V0.6.X`） | 有 |
| 公开入口文案统一为 `harness.mjs`（无「确认后 render」主路径） | 有 |
| `host/ai-tools.md` / 手册矩阵标题为 0.6.x | 有 |
| QUICKSTART / 手册含 Trae skills 路径示例（示例≠唯一） | 有 |
| 历史增量表迁 `_history/.../VERIFY-history-through-0.6.0.md`；热路径 VERIFY 留桩 | 有 |
| ROADMAP / Trae EVIDENCE / CHANGELOG 0.5.x 热路径减脂 | 有 |
| 报告页脚 / 文档以 `report_schema` 为主；`ui.version` 仅为别名 | 有 |
| 升级三步写入 upgrade（check-freshness → 刷新 sync） | 有 |
| `session-dash.mjs --help` 退出 0 | 有 |
| 无 score 时仪表盘精简（含「精简」） | 有 |
| `lib/selfcheck/checks-0.6.mjs` 承接 0.6.x；入口仍 `selfcheck.mjs` | 有 |
| archive/selfcheck 仅指针；0.4/0.5 bulk 在 `_history` | 有 |
| Trae T-P2-2…4（脚注·交叉链·未生成/未实证） | 有 |
| `lib/selfcheck/checks-0.5.mjs` + `checks-0.6.mjs` | 有 |

## 0.6.2 增量验收（会话仪表盘去掉 mermaid）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / meta / questions 为 `0.6.2` | 有 |
| session-dash stdout 无 mermaid 围栏 / `quadrantChart` | 有 |
| 有 score 时纯文本「施工态势」 | 有 |

## 0.6.1 增量验收（Trae 高）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| （历史）manifest / meta / questions 曾钉 `0.6.1` | 有 |
| [TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md) T-P0-1…4 状态表；T-P0-2 MCP 面板 PASS | 有 |
| Trae 镜像保留 `alwaysApply` / `globs`；Claude/Qoder 仍 strip | 有 |
| `mature-trae` 无 `.cursor/rules` 仍 MATURE；L5 sync 路径已钉 | 有 |
| 适配卡去掉「若宿主支持」；矩阵 Trae **高** | 有 |
| 矩阵 中高→高（T-P1-5） | 有 |
| L5 计划含 SSOT `00-harness-ssot.mdc`（含 Trae-only）；1x 仍 omit | 有 |

## 历史增量（已归档）

完整表见仓库 [`_history/harness-eng-docs-archive/VERIFY-history-through-0.6.0.md`](../_history/harness-eng-docs-archive/VERIFY-history-through-0.6.0.md)。

| 里程碑 | 关键词（selfcheck 对照） | 归档 |
|---|---|---|
| **0.6.1** Trae P0 / mature-trae | Trae P0 · mature-trae | 同上「0.6.1」节 |
| **0.6.0 M4** 发包 · legacy | M4 · legacy · 发包 | 同上「M4」节 |
| **0.6.0-dev M3** 黄金集 | M3 · l5-sync-golden · 黄金 | 同上「M3」节 |
| **0.6.0-dev M2** 文档拓扑 | M2 · 根目录 | 同上「M2」节 |
| 0.6.1-dev / 0.5.10…0.5.2 | 见归档全文 | 同上 |

