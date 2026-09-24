---
name: harness-eng
description: >-
  施工仪式：把 Agent Harness 工程化落地到目标仓库——生成/补齐 AGENTS.md、AI 编码规则
  （如 .cursor/rules）、契约文档（func/api/db/redis/jobs）、hooks、MCP 配置、知识回流与规划目录。
  用户点名 harness-eng，或说开干 / 落地 / 形态 / 覆盖 / 贴顶 / gate / 打分 / 审计 / 续跑 / 流水线 / 升阶 / 填充，
  或要求生成 AGENTS.md / 仓库工程化 / AI 协作规则 / 文档与代码同步，
  或定时 / Cron / Scheduler / jobs 契约填充时使用。
---

# harness-eng

Skill = **施工仪式**；目标仓 `AGENTS` / `.cursor/rules` / `docs` = 持久约束。  
旁路规格只在需要时 Read。对用户优先中文；术语见 [glossary.md](glossary.md)。  
**Agent 热路径 · 读侧路由 SSOT**：[AGENT-INDEX.md](AGENT-INDEX.md)（先索引再 Read，勿扫根目录全部 md）。  
拓扑：`modes/` 模式规格 · `fill/` 填充家族 · `host/` 多宿主。  
一页纸：[QUICKSTART.md](QUICKSTART.md)。人读手册：[使用手册.html](使用手册.html) / [使用手册.md](使用手册.md)。施工产物默认 `docs/harness-eng/`。

**确认闸门 / 预授权**词表 SSOT：[write-plan.md](modes/write-plan.md)。  
**全部推荐**协议 SSOT：[recommended-profile.md](modes/recommended-profile.md)。他处只指针。

## 流程

1. **探测 → 推荐包 → 提问 → WritePlan → 确认闸门 → 才写盘**（预授权例外见 write-plan）。最短路径见 QUICKSTART。
2. 只渲染 [templates/](templates/) 与 fill 规格允许的本仓抽取；密文只从本仓已有文件抽取（先 [fill/README.md](fill/README.md)）。
3. `MATURE` 默认 **audit**；写盘须点名 land / upgrade / resume / pipeline / fill-*。写盘入口优先 `scripts/harness.mjs`（0.7.2 起无 `land.mjs`）。
4. 每批提问展示【推荐】；`全部推荐` 只收齐答题（[recommended-profile.md](modes/recommended-profile.md)）。
5. Windows JSON 传参：见 [write-plan.md](modes/write-plan.md#windows-json-传参gotcha-ssot)。
6. **本轮实质施工产出、闸门决策点（出示 WritePlan / 用户确认）、或显式读数**时回复末尾附可视化**会话仪表盘**（四台摘要 + 可选纯文本态势；何时 SHOW/HIDE 见 [session-dashboard.md](modes/session-dashboard.md)）；有目标根时优先 `node scripts/session-dash.mjs --root <TARGET> --intent engineering`。提问批次 / 定根前 / 等确认空轮 / 纯 meta / 版本 / 手册 / 跑题 / 改 skill **不附**整块（判定按本轮里程碑，不按「会话曾点名」）。

## 模式分流

| 意图（一支） | 模式 | 规格 |
|---|---|---|
| **落地** | `land` | 下文 |
| **续跑** | `resume` | [resume.md](modes/resume.md) |
| **流水线** | `pipeline` | [pipeline.md](modes/pipeline.md) → Done 后 [pipeline-fill.md](modes/pipeline-fill.md) |
| **审计** | `audit` | [audit-report.md](modes/audit-report.md) · [ladder.md](modes/ladder.md) |
| **升阶** | `upgrade` | [upgrade.md](modes/upgrade.md) |
| **补空壳真相** | `seed-truths` | [seed-truths.md](modes/seed-truths.md) |
| **打分家族** | `fill-score`（默认双轴）· `fill-morph` · `fill-gate` | [fill-score.md](fill/fill-score.md) · [fill-morph.md](fill/fill-morph.md) · [fill-gate.md](fill/fill-gate.md) |
| **填充计划** | `fill-plan` | [fill-plan.md](fill/fill-plan.md) |
| **多 Agent 精填** | `fill-truths-agents` | [fill-truths-agents.md](fill/fill-truths-agents.md) |
| **契约填充** | `fill-truths` | [fill/README.md](fill/README.md) → [fill.md](fill/fill.md) |
| **MCP 装配** | `fill-mcp` | [fill/README.md](fill/README.md) → [fill-mcp.md](fill/fill-mcp.md) |

legacy / 脚本：`fill-truths-auto`（**仅脚本、对话不推荐** → [archive/fill-truths-auto/](archive/fill-truths-auto/INDEX.md)）· `fill-calibrate-live` · `fill-report-html` → 见「分支 → Read」与 [fill/README.md](fill/README.md)。

未指定：`MATURE`→audit；`PARTIAL`/已有 meta 未满阶→**resume**；**大仓首次**→**pipeline**（L4，`fill_engine=agents`）；否则→land（大仓默认 L4）。  
阶梯：L0 协作入口 · L1 契约骨架 · L2 知识回流 · L3 规划与软门禁 · L4 工具连接样例 · L5 配置 SSOT 管线（详 [glossary.md](glossary.md) / [ladder.md](modes/ladder.md)）。

## land

### Done

1. `docs/harness-eng/harness-meta.yaml` 存在且 `skill_version` 与 manifest、`ladder`/`domains` 正确（读侧可回退遗留 `.cursor/harness-meta.yaml`）
2. 目标阶 [ladder.md](modes/ladder.md) 必备项勾选通过（本轮 create/skip/merge 已执行）
3. 分级移交 TODO 已打印

### 步骤

```
- [ ] 1 定根 + Fingerprint（detect.md）；多根则确认 Q_TARGET_ROOT
- [ ] 2 判定类型；输出 RecommendedProfile（recommended-profile.md）
- [ ] 3 条件提问（优先 questions-next.mjs + questions.yaml；失败再 Read questions.md；每批≤5；可「全部推荐」）
- [ ] 4 WritePlan（白话摘要 + 预览）— 等待确认（闸门见 write-plan.md）
- [ ] 5 确认后 `scripts/harness.mjs`（`--mode land`；L5/`agent_config` 走 sync，勿直渲生成宿主路径；非 L5 委托 render）；空仓 on_exists=fail；半成品改 resume 语义 on_exists=skip
- [ ] 6 ladder 自检；写/合并 harness-meta（skill_version 与 manifest 一致）
- [ ] 7 分级移交 TODO（P1：精填分册 AGENTS；P1：Pn 回流 / 路径速查 / Never do↔Pn；若 Q_APIFOX：设 APIFOX_PROJECT_ID）
```

细节链：Read [detect.md](modes/detect.md) → [questions.yaml](questions.yaml) / [questions.md](modes/questions.md) → [write-plan.md](modes/write-plan.md) + [prefill.md](modes/prefill.md) → **harness.mjs** → [ladder.md](modes/ladder.md)。

## 硬闸门（正目标）

- 写盘前拿到确认闸门等价词（或已预授权后续轮次）
- 只写入已确认的 `Q_TARGET_ROOT`
- 本 skill 只写目标仓 `AGENTS` / `.cursor/rules` / `docs`（及 fill-mcp 经确认的 `mcp.json`）
- MCP 真密：仅 fill-mcp 经确认写入 **local 真密路径**（gitignore）；含密文件不随技能分发；模板/example 只含占位符
- **密文对用户话术**：不主动要求用户「不要填密码」；**仅**本轮在创建/引导编辑 local 真密配置（`.cursor/mcp.json` / 根 `.mcp.json` / `.trae/mcp.json` / `.codex/config.toml`）时，提醒可本地填写、**勿提交进 git**（优先 env / `${VAR}`）
- AGENTS：merge 只追加缺章节；已有同名章节正文保留（[conflict-policy.md](modes/conflict-policy.md)）
- README 疑似密钥：只检测 + 移交人工（不自动删）
- SSOT promote：仅过 acceptance；heuristic 标 `quality: heuristic` 且留在 `.fill-work`；宣称可 AI coding 仅看 `ai_coding_ready`
- **填充 MCP 闸**：域/栈需 db·redis 时，矩阵+（烟测∨calibrate-live）达标后才进入填充（[fill-mcp.md](fill/fill-mcp.md)）

## 分支 → Read

读侧路由 SSOT 在 [AGENT-INDEX.md](AGENT-INDEX.md)（必读≤8 + 按需表；本页不再铺全量，防双表漂移）。高频三条指针：

| 何时 | Read |
|---|---|
| 写盘确认 / 预授权 / Windows JSON | [write-plan.md](modes/write-plan.md) |
| 打分 / score-policy / 覆盖裁决 | [fill-score.md](fill/fill-score.md) |
| AI 工具面 / 多宿主 / 加契约域 | [ai-tools.md](host/ai-tools.md) · [domain-extend.md](modes/domain-extend.md) |

旁路脚本：`scripts/fill-calibrate-live.mjs`（live 校准）· `scripts/fill-report-html.mjs`（HTML 报告，score 后【推荐】），`--help` 自查。  
写盘入口：**`scripts/harness.mjs`**（`--mode land|resume|upgrade|pipeline-skeleton`；L5 拒直渲生成宿主路径；内部 `render.mjs` 勿当 Agent 主路径）。  
版本里程碑（0.6.x 各行：Trae 高 / CodeBuddy / freshness / Codex P0…）查 [CHANGELOG.md](CHANGELOG.md)，本页不铺版本行。
