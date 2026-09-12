# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读一页纸：[QUICKSTART.md](QUICKSTART.md)。闸门词表：[write-plan.md](write-plan.md)。

## 必读（写盘前）

| 何时 | Read / 跑 |
|---|---|
| 闸门 / 预授权 / Windows JSON | [write-plan.md](write-plan.md) |
| 探测 / 指纹 / MATURE | [detect.md](detect.md) |
| 推荐包 / 全部推荐 | [recommended-profile.md](recommended-profile.md) |
| **写盘入口**（land / resume / upgrade / pipeline-skeleton） | **`node scripts/harness.mjs`**（`land.mjs` 薄别名；L5/`agent_config` 走 sync，**勿**直渲生成宿主路径） |
| 填充家族（先索引） | [fill/README.md](fill/README.md) |
| 冲突 / merge / L5 互斥 | [conflict-policy.md](conflict-policy.md) |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 续跑 | [resume.md](resume.md) |
| 升阶 | [upgrade.md](upgrade.md) |
| 流水线骨架 → 填充 | [pipeline.md](pipeline.md) → [pipeline-fill.md](pipeline-fill.md) |
| 审计 | [audit-report.md](audit-report.md) · [ladder.md](ladder.md) |
| 打分 / 形态 / 开干闸 | [fill-score.md](fill-score.md) · [fill-morph.md](fill-morph.md) · [fill-gate.md](fill-gate.md) |
| 契约填充 / workers | [fill.md](fill.md) · [fill-truths-agents.md](fill-truths-agents.md) · [fill-workers.md](fill-workers.md) |
| MCP / live 校准 | [fill-mcp.md](fill-mcp.md) · `scripts/fill-calibrate-live.mjs --help` |
| AI 工具面 / 多宿主 | [ai-tools.md](ai-tools.md) · [sync-hosts.md](sync-hosts.md) |
| 加域 / packs / morph | [domain-extend.md](domain-extend.md) · `templates/_meta/` |
| 会话仪表盘 | [session-dashboard.md](session-dashboard.md) |
| 版本 / 模板清单 | [CHANGELOG.md](CHANGELOG.md) · [templates/_meta/manifest.yaml](templates/_meta/manifest.yaml) |
| 0.6.0 计划 | [ROADMAP-0.6.0.md](ROADMAP-0.6.0.md) |

## 写盘纪律（一行）

确认闸门之后：优先 `scripts/harness.mjs --root <TARGET> --params <params.json> [--mode land|resume|upgrade|pipeline-skeleton]`（`land.mjs` 薄别名）。  
非 L5 委托 `render.mjs`；`agent_config: true` 只渲 SSOT，生成 `.cursor/rules` 等由目标仓 `node scripts/agent-config/sync.mjs` 发出。勿直接把 `render.mjs` 当 Agent 主路径。
