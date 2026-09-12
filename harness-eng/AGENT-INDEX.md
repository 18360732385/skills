# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读一页纸：[QUICKSTART.md](QUICKSTART.md)。闸门词表：[write-plan.md](modes/write-plan.md)。

**拓扑（0.6.0-dev M2）**：`modes/` 模式规格 · `fill/` 填充家族 · `host/` 多宿主。根目录只留入口、手册与热路径 stub。

## 必读（写盘前）≤8

| 何时 | Read / 跑 |
|---|---|
| 闸门 / 预授权 / Windows JSON | [modes/write-plan.md](modes/write-plan.md) |
| 探测 / 指纹 / MATURE | [modes/detect.md](modes/detect.md) |
| 推荐包 / 全部推荐 | [modes/recommended-profile.md](modes/recommended-profile.md) |
| **写盘入口**（land / resume / upgrade / pipeline-skeleton） | **`node scripts/harness.mjs`**（`land.mjs` 薄别名；L5/`agent_config` 走 sync，**勿**直渲生成宿主路径） |
| 填充家族（先索引） | [fill/README.md](fill/README.md) |
| 冲突 / merge / L5 互斥 | [modes/conflict-policy.md](modes/conflict-policy.md) |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 续跑 | [modes/resume.md](modes/resume.md) |
| 升阶 | [modes/upgrade.md](modes/upgrade.md) |
| 流水线骨架 → 填充 | [modes/pipeline.md](modes/pipeline.md) → [modes/pipeline-fill.md](modes/pipeline-fill.md) |
| 审计 | [modes/audit-report.md](modes/audit-report.md) · [modes/ladder.md](modes/ladder.md) |
| 打分 / 形态 / 开干闸 | [fill/fill-score.md](fill/fill-score.md) · [fill/fill-morph.md](fill/fill-morph.md) · [fill/fill-gate.md](fill/fill-gate.md) |
| 契约填充 / workers | [fill/fill.md](fill/fill.md) · [fill/fill-truths-agents.md](fill/fill-truths-agents.md) · [fill/fill-workers.md](fill/fill-workers.md) |
| MCP / live 校准 | [fill/fill-mcp.md](fill/fill-mcp.md) · `scripts/fill-calibrate-live.mjs --help` |
| AI 工具面 / 多宿主 | [host/ai-tools.md](host/ai-tools.md) · [host/sync-hosts.md](host/sync-hosts.md) |
| 加域 / packs / morph | [modes/domain-extend.md](modes/domain-extend.md) · `templates/_meta/` |
| 会话仪表盘 | [modes/session-dashboard.md](modes/session-dashboard.md) |
| 版本 / 模板清单 | [CHANGELOG.md](CHANGELOG.md) · [templates/_meta/manifest.yaml](templates/_meta/manifest.yaml) |
| 0.6.0 计划 | [ROADMAP-0.6.0.md](ROADMAP-0.6.0.md) |
| L5 / 多宿主黄金夹具 | `scripts/fixtures/l5-sync-golden` · `scripts/fixtures/multi-host-hooks` |

## 写盘纪律（一行）

确认闸门之后：优先 `scripts/harness.mjs --root <TARGET> --params <params.json> [--mode land|resume|upgrade|pipeline-skeleton]`（`land.mjs` 薄别名）。  
非 L5 委托 `render.mjs`；`agent_config: true` 只渲 SSOT，生成 `.cursor/rules` 等由目标仓 `node scripts/agent-config/sync.mjs` 发出。勿直接把 `render.mjs` 当 Agent 主路径。
