# harness-eng 验收记录（0.5.2）

> 静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。

## 版本

当前 **0.5.2**。报告壳 `ui.version`（0.2.24）≠ `skill_version`。

## 0.5.2 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck-0.5.2.mjs` exit 0 | 烟测 |
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
