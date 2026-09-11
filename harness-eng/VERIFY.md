# harness-eng 验收记录（0.5.1）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.5.1**。报告壳 `ui.version`（0.2.24）≠ `skill_version`。

## 0.5.1 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.1.mjs` exit 0 | 烟测 |
| Qoder：`.qoder/settings.json` Claude 系 hooks；无 Cursor 式 `.qoder/hooks.json` | 有 |
| Trae：`.trae/hooks.json` + `.trae/mcp.json.example` | 有 |
| L3+ rules 镜像：qoder/trae `.md`；L5 sync 分发对齐 | 有 |
| MCP：claude/qoder → 根 `.mcp.json`；trae → `.trae/mcp.json` | 有 |

## 0.5.0 增量验收

| 检查 | 结果 |
|---|---|
| L5 阶梯：render `LADDER_ORD` 含 L5；`Q_AGENT_CONFIG` 入 questions | 有 |
| `templates/agent-config/`：sync.mjs.tmpl + hooks.config + README | 有 |
| hooks 家族 4 模板；`CONTRACT_CHECKS_JS` 由 domains.yaml `hook:` 段驱动 | 有 |
| pitfalls 模板 7 列 + lint-pitfalls | 有 |
| meta 模板含 `agent_config` 字段 | 有 |

## 继承

| 版 | 指针 |
|---|---|
| 0.4.0 | 前端协作包 / 分册变体 / merge 预览 / manual_sql |
| 0.3.10 | 行为包（rule 21） |
| ≤0.3.9 | 见 archive / CHANGELOG |
