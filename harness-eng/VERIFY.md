# harness-eng 验收记录（0.6.9）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.6.9**（Codex → **高** · 推荐纪律 B；其上为 0.6.8-dev P0 解冻 / 0.6.7 Pn 回流；含 session-dashboard）。报告对照 **`skill_version` + `report_schema`**（0.2.26；**报告壳 ≠ skill**）。实证见 [host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。

## 0.6.9 增量验收（Codex 高）

| 检查项 | 期望 |
|---|---|
| manifest / meta 为 `0.6.9` | 有 |
| CHANGELOG 标题 `## 0.6.9` | 有 |
| `host/CODEX-PARITY.md` · `CODEX-MANUAL.md`；适配卡 **高** | 有 |
| `codex-mcp-toml.mjs`；sync 发 toml/rules/hooks/skills | 有 |
| `codex-adapter.js`；hooks `Stop` + `^Bash$` | 有 |
| `l5-sync-codex` fixture `--check` | 有 |
| upgrade `## 0.6.8-dev → 0.6.9` | 有 |
| 安装 URL 仍 `main`；Trae / CodeBuddy 不回退 | 有 |
| 会话仪表盘：里程碑 SHOW（实质产出 / 闸门决策 / 显式读数）；提问批次·定根前·等确认空轮 **HIDE**（`session-dashboard.md`） | 有 |

## 0.6.8-dev 增量验收（Codex P0）

| 检查项 | 期望 |
|---|---|
| CHANGELOG 标题 `## 0.6.8-dev`（中文要点） | 有 |
| `templates/ai-tools/codex-config.toml.tmpl`；manifest → `.codex/config.toml.example` | 有 |
| upgrade `## 0.6.7 → 0.6.8-dev` | 有 |

## 0.6.7 增量验收（正式钉号 · Pn 回流 + 前后端契约门禁）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `node scripts/selfcheck-render.mjs` | 烟测 |
| manifest / meta / questions 为 `0.6.7`（无 `-dev`） | 有 |
| CHANGELOG 正式标题 `## 0.6.7`（非 `## 0.6.7-dev`） | 有 |
| VERIFY / README / QUICKSTART / 手册当前钉 **0.6.7** | 有 |
| api `hook_code` 含 `packages/api-client|types|queries` **regex**；nested path 可命中 | 有 |
| `S_FRONTEND`+api：detect/recommended GLOB_API 前端契约包剖面；rule 12 消费层门禁 | 有 |
| 根 AGENTS「踩坑回流」；pitfalls 路径速查骨架；lint Never do↔Pn warn | 有 |
| upgrade `## 0.6.6 → 0.6.7`；tmpl / golden `HARNESS_SYNC_TMPL_ID=0.6.7` | 有 |
| 根 `_meta/manifest.yaml` 存在且 version 与 `templates/_meta/manifest.yaml` 一致 | 有 |
| 安装 URL 仍 `main`；Trae / CodeBuddy / Codex / 0.6.6 钉号不回退 | 有 |

## 0.6.6 增量验收（正式钉号 · OpenAPI 闭环 + 分册厚 SSOT）

| 检查 | 结果 |
|---|---|
| CHANGELOG 正式标题 `## 0.6.6` | 有 |
| `templates/scripts/apifox/` 去域化；`Q_APIFOX`；`OPENAPI_BRIDGE_TIP` | 有 |
| 分册厚模板 module / spring / frontend；根「分册真相」 | 有 |
| upgrade `## 0.6.5 → 0.6.6` | 有 |

## 0.6.5 增量验收（正式钉号 · API 字段表 + sync EOL）

| 检查 | 结果 |
|---|---|
| CHANGELOG 正式标题 `## 0.6.5` | 有 |
| api-doc / api-index 模板默认 7 列；旧 5 列兼容说明 | 有 |
| acceptance：`api-empty-desc` · `api-empty-enum-remark`；good/bad 夹具金标 | 有 |
| fill-auto-api 7 列 + `quality: heuristic` | 有 |
| sync.mjs.tmpl `sameText` EOL-agnostic；`l5-sync-golden --check` 绿 | 有 |
| upgrade `## 0.6.4 → 0.6.5` | 有 |

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
| 报告壳叙事认 `report_schema`（**报告壳 ≠ skill**） | 有 |
| upgrade `## 0.6.2 → 0.6.3`：meta · 三步（main → check-freshness → 刷新 sync）· 报告壳 | 有 |

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
