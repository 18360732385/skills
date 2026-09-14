# harness-eng 验收记录（0.6.3-dev）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.6.3-dev**（Trae **高**；会话仪表盘无 mermaid / 无分精简；session-dashboard；sync.mjs freshness gate）。报告对照 **`skill_version` + `report_schema`**（JSON 仍暴露 `ui.version` 0.2.24；**报告壳版本 ≠ skill**）。实证见 [host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。

## 0.6.3-dev 增量验收（sync freshness · 安装 URL · 热路径去污）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.3-dev` | 有 |
| tmpl + golden 含 `HARNESS_SYNC_TMPL_ID`；stale fixture `--check-freshness` 非 0 | 有 |
| 安装 URL 指向 `main`（非 `V0.6.X`） | 有 |
| 公开入口文案统一为 `harness.mjs`（无「确认后 render」主路径） | 有 |
| `host/ai-tools.md` / 手册矩阵标题为 0.6.x | 有 |
| QUICKSTART / 手册含 Trae skills 路径示例（示例≠唯一） | 有 |
| 历史增量表迁 `archive/VERIFY-history-through-0.6.0.md`；热路径 VERIFY 留桩 | 有 |
| `session-dash.mjs --help` 退出 0 | 有 |
| 无 score 时仪表盘精简（含「精简」） | 有 |

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

完整表见 [archive/VERIFY-history-through-0.6.0.md](archive/VERIFY-history-through-0.6.0.md)。

| 里程碑 | 关键词（selfcheck 对照） | 归档 |
|---|---|---|
| **0.6.1** Trae P0 / mature-trae | Trae P0 · mature-trae | 同上「0.6.1」节 |
| **0.6.0 M4** 发包 · legacy | M4 · legacy · 发包 | 同上「M4」节 |
| **0.6.0-dev M3** 黄金集 | M3 · l5-sync-golden · 黄金 | 同上「M3」节 |
| **0.6.0-dev M2** 文档拓扑 | M2 · 根目录 | 同上「M2」节 |
| 0.6.1-dev / 0.5.10…0.5.2 | 见归档全文 | 同上 |

