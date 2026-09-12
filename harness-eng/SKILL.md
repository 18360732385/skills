---
name: harness-eng
description: >-
  施工仪式：开干闸、形态诊断、覆盖打分、审计、落地、续跑、流水线、升阶、填充（MCP/精填）、报告。
  用户点名 harness-eng，或说开干 / 形态 / 覆盖 / 贴顶 / gate / 打分，
  或定时 / Cron / Scheduler / jobs 契约填充时使用。
---

# harness-eng

Skill = **施工仪式**；目标仓 `AGENTS` / `.cursor/rules` / `docs` = 持久约束。  
旁路规格只在需要时 Read。对用户优先中文；术语见 [glossary.md](glossary.md)。  
一页纸：[QUICKSTART.md](QUICKSTART.md)。人读手册：[使用手册.html](使用手册.html) / [使用手册.md](使用手册.md)。施工产物默认 `docs/harness-eng/`。

**确认闸门 / 预授权**词表 SSOT：[write-plan.md](write-plan.md)。  
**全部推荐**协议 SSOT：[recommended-profile.md](recommended-profile.md)。他处只指针。

## 流程

1. **探测 → 推荐包 → 提问 → WritePlan → 确认闸门 → 才写盘**（预授权例外见 write-plan）。
2. 只渲染 [templates/](templates/) 与 fill 规格允许的本仓抽取；密文只从本仓已有文件抽取（[fill.md](fill.md)）。
3. `MATURE` 默认 **audit**；写盘模式须用户点名 land / upgrade / resume / pipeline / fill-*。
4. 每批提问展示【推荐】；`全部推荐` 只收齐答题（[recommended-profile.md](recommended-profile.md)）。
5. Windows JSON 传参：见 [write-plan.md](write-plan.md#windows-json-传参gotcha-ssot)。
6. **工程轮**回复末尾附可视化**会话仪表盘**（四台 + mermaid；何时 SHOW/HIDE 见 [session-dashboard.md](session-dashboard.md)）；有目标根时优先 `node scripts/session-dash.mjs --root <TARGET> --intent engineering`。纯 meta / 版本 / 手册问答**不附**整块。

## 模式分流

| 意图（一支） | 模式 | 规格 |
|---|---|---|
| **落地** | `land` | 下文 |
| **续跑** | `resume` | [resume.md](resume.md) |
| **流水线** | `pipeline` | [pipeline.md](pipeline.md) → Done 后 [pipeline-fill.md](pipeline-fill.md) |
| **审计** | `audit` | [audit-report.md](audit-report.md) · [ladder.md](ladder.md) |
| **升阶** | `upgrade` | [upgrade.md](upgrade.md) |
| **补空壳真相** | `seed-truths` | [seed-truths.md](seed-truths.md) |
| **打分家族** | `fill-score`（默认双轴）· `fill-morph` · `fill-gate` | [fill-score.md](fill-score.md) · [fill-morph.md](fill-morph.md) · [fill-gate.md](fill-gate.md) |
| **填充计划** | `fill-plan` | [fill-plan.md](fill-plan.md) |
| **多 Agent 精填** | `fill-truths-agents` | [fill-truths-agents.md](fill-truths-agents.md) |
| **契约填充** | `fill-truths` | [fill.md](fill.md) |
| **MCP 装配** | `fill-mcp` | [fill-mcp.md](fill-mcp.md) |

legacy / 脚本：`fill-truths-auto` · `fill-calibrate-live` · `fill-report-html` → 见「分支 → Read」与 [fill.md](fill.md)。

未指定：`MATURE`→audit；`PARTIAL`/已有 meta 未满阶→**resume**；**大仓首次**→**pipeline**（L4，`fill_engine=agents`）；否则→land（大仓默认 L4）。  
阶梯：L0 协作入口 · L1 契约骨架 · L2 知识回流 · L3 规划与软门禁 · L4 工具连接样例 · L5 配置 SSOT 管线（详 [glossary.md](glossary.md) / [ladder.md](ladder.md)）。

## land

### Done

1. `docs/harness-eng/harness-meta.yaml` 存在且 `skill_version` 与 manifest、`ladder`/`domains` 正确（读侧可回退遗留 `.cursor/harness-meta.yaml`）
2. 目标阶 [ladder.md](ladder.md) 必备项勾选通过（本轮 create/skip/merge 已执行）
3. 分级移交 TODO 已打印

### 步骤

```
- [ ] 1 定根 + Fingerprint（detect.md）；多根则确认 Q_TARGET_ROOT
- [ ] 2 判定类型；输出 RecommendedProfile（recommended-profile.md）
- [ ] 3 条件提问（优先 questions-next.mjs + questions.yaml；失败再 Read questions.md；每批≤5；可「全部推荐」）
- [ ] 4 WritePlan（白话摘要 + 预览）— 等待确认（闸门见 write-plan.md）
- [ ] 5 确认后 scripts/render.mjs；空仓 on_exists=fail；半成品改 resume 语义 on_exists=skip
- [ ] 6 ladder 自检；写/合并 harness-meta（skill_version 与 manifest 一致）
- [ ] 7 分级移交 TODO
```

细节链：Read [detect.md](detect.md) → [questions.yaml](questions.yaml) / [questions.md](questions.md) → [write-plan.md](write-plan.md) + [prefill.md](prefill.md) → render → [ladder.md](ladder.md)。

## 硬闸门（正目标）

- 写盘前拿到确认闸门等价词（或已预授权后续轮次）
- 只写入已确认的 `Q_TARGET_ROOT`
- 本 skill 只写目标仓 `AGENTS` / `.cursor/rules` / `docs`（及 fill-mcp 经确认的 `mcp.json`）
- MCP 真密：仅 fill-mcp 经确认写入；含密 `mcp.json` 只留在目标仓、不随技能分发
- AGENTS：merge 只追加缺章节；已有同名章节正文保留（[conflict-policy.md](conflict-policy.md)）
- README 疑似密钥：只检测 + 移交人工
- SSOT promote：仅过 acceptance；heuristic 标 `quality: heuristic` 且留在 `.fill-work`；宣称可 AI coding 仅看 `ai_coding_ready`
- **填充 MCP 闸**：域/栈需 db·redis 时，矩阵+（烟测∨calibrate-live）达标后才进入填充（[fill-mcp.md](fill-mcp.md)）

## 分支 → Read

| 何时 | Read |
|---|---|
| 写盘确认 / 预授权 / Windows JSON | [write-plan.md](write-plan.md) |
| 探测 / 指纹 | [detect.md](detect.md) |
| 推荐包 / 全部推荐 | [recommended-profile.md](recommended-profile.md) |
| 升阶 | [upgrade.md](upgrade.md) |
| 冲突 / merge / mcp | [conflict-policy.md](conflict-policy.md) |
| 流水线骨架战役 | [pipeline.md](pipeline.md) |
| 流水线填充战役（骨架 Done 后） | [pipeline-fill.md](pipeline-fill.md) |
| 填充总则与子模式 | [fill.md](fill.md) |
| 打分 / score-policy / 覆盖裁决 | [fill-score.md](fill-score.md) · [glossary.md](glossary.md)「覆盖裁决」 |
| 形态诊断 | [fill-morph.md](fill-morph.md) · glossary 形态轴 |
| 开干闸 | [fill-gate.md](fill-gate.md) · glossary 开干轴 |
| 深·真·全 / draft vs SSOT | [truth-quality.md](truth-quality.md) |
| 多 Agent worker | [fill-workers.md](fill-workers.md) · [fill-truths-agents.md](fill-truths-agents.md) |
| 加契约域 / packs / morph | [domain-extend.md](domain-extend.md) · `templates/_meta/domains.yaml` · `domain-packs.yaml` · `morph-required.yaml` |
| AI 工具面 | [ai-tools.md](ai-tools.md) · [sync-hosts.md](sync-hosts.md) · `templates/ai-tools/adapters/` |
| 自动填充（legacy） | [fill-truths-auto.md](fill-truths-auto.md) |
| live 校准 | `scripts/fill-calibrate-live.mjs`（`--help`） |
| HTML 报告 | `scripts/fill-report-html.mjs`（`--help`）；score 后【推荐】 |
| 会话仪表盘 | [session-dashboard.md](session-dashboard.md) · `scripts/session-dash.mjs`（工程轮末尾；meta 轮省略） |
| 模板清单 / 版本 | [templates/_meta/manifest.yaml](templates/_meta/manifest.yaml) · [CHANGELOG.md](CHANGELOG.md) |
| 渲染脚本 | `scripts/render.mjs`（`--help` / 目录即环境） |
