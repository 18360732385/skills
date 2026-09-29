---
name: harness-eng
description: >-
  Use when the user names harness-eng, or says 落地 / land, 续跑 / resume,
  升阶 / upgrade, 流水线 / pipeline, 审计 / audit, 填充 / fill, 打分 / score,
  形态 / morph, 贴顶 / 覆盖 / gate, 会话自证 / session-live, 开干,
  or asks for Agent Harness engineering on a target repo;
  also when Cron / Scheduler / jobs 契约 work is requested.
  Description is triggers only — read SKILL.md body before acting.
---

# harness-eng

Skill = **施工仪式**；目标仓 `AGENTS` / `.cursor/rules` / `docs` = 持久约束。  
旁路规格只在需要时 Read。对用户优先中文；术语见 [glossary.md](glossary.md)。  
**Agent 热路径 · 读侧路由 SSOT**：[AGENT-INDEX.md](AGENT-INDEX.md)（先索引再 Read，勿扫根目录全部 md）。  
拓扑：`modes/` 模式规格 · `fill/` 填充家族 · `host/` 多宿主。  
一页纸：[QUICKSTART.md](QUICKSTART.md)。人读手册：[guide/使用手册.html](guide/使用手册.html) / [guide/使用手册.md](guide/使用手册.md)。施工产物默认 `docs/harness-eng/`。

**确认闸门 / 预授权**词表 SSOT：[write-plan.md](modes/write-plan.md)。  
**全部推荐**协议 SSOT：[recommended-profile.md](modes/recommended-profile.md)。他处只指针。

## 可选接力（主题流程）

- **独立优先**：本 skill 可完整落地脚手架与契约；**不依赖**任何主题流程控制器。
- **本 skill 不做**：不调度 `docs/runs`、不跑主题 advance/close、不代写业务主题 Spec/Plan。
- **若团队使用主题流程控制器**（常见别名：`feature-eng`）：工程化完成后**新会话**再点名其 `init` / `start`；**同会话勿并行**点名两者。
- **续跑**：用户说「续跑」且语境是 harness 半成品 → 本 skill `resume`（续跑工程化）；主题过程态（`docs/runs/active`）→ 请用户点名其主题流程 skill（若有）。
- **开干**：本 skill「开干 / 可 AI coding」仅指仓库级 `ai_coding_ready`，**≠** 主题环「计划 Go 闸」（如 `gates.go`）。易混词见 [glossary.md](glossary.md)。

## 流程

1. **探测 → 推荐包 → 提问 → WritePlan → 确认闸门 → 才写盘**（预授权例外见 write-plan）。最短路径见 QUICKSTART。
2. 只渲染 [templates/](templates/) 与 fill 规格允许的本仓抽取；密文只从本仓已有文件抽取（先 [fill/README.md](fill/README.md)）。
3. `MATURE` 默认 **audit**；写盘须点名 land / upgrade / resume / pipeline / fill-*。写盘入口优先 `scripts/harness.mjs`（0.7.2 起无 `land.mjs`）。
4. 每批提问展示【推荐】；`全部推荐` 只收齐答题（[recommended-profile.md](modes/recommended-profile.md)）。
5. Windows JSON 传参：见 [write-plan.md](modes/write-plan.md#windows-json-传参gotcha-ssot)。
6. 会话仪表盘：先按 [session-dashboard.md](modes/session-dashboard.md) 判定 **SHOW|HIDE**，**仅 SHOW 时**附四边框块（【阶段】【现状】【工作】【下一步建议】；现状仅 AI coding 可否）。可观察 SHOW 例：本轮完整出示 WritePlan（闸门决策点，**不必等确认/写盘**）；实质产出结论；用户显式读数。有目标根时优先 `node scripts/session-dash.mjs --root <TARGET> --intent engineering`。判定按**本轮**里程碑，不按「会话曾点名」。HTML 五台（`report_schema` 0.4.0）另见手册。

## 模式分流（对外四支）

| 支 | 含模式（内部 ID） | 规格入口 |
|---|---|---|
| **施工** | `land` · `resume` · `upgrade` · `seed-truths` | 下文 · [resume.md](modes/resume.md) · [upgrade.md](modes/upgrade.md) · [seed-truths.md](modes/seed-truths.md) |
| **流水线** | `pipeline` → Done 后 `pipeline-fill` | [pipeline.md](modes/pipeline.md) → [pipeline-fill.md](modes/pipeline-fill.md) |
| **审计 / 自证** | `audit` · `session-live` | [audit-report.md](modes/audit-report.md) · [ladder.md](modes/ladder.md) · [session-live.md](modes/session-live.md) |
| **填充** | `fill-score` / `fill-morph` / `fill-gate` · `fill-plan` · `fill-truths-agents` · `fill-truths` · `fill-mcp` | [fill/README.md](fill/README.md) · [fill-score.md](fill/fill-score.md) |

legacy / 脚本：`fill-truths-auto`（**仅脚本、对话不推荐** → [archive/fill-truths-auto/](archive/fill-truths-auto/INDEX.md)）· `fill-calibrate-live` · `fill-report-html` → 见 [AGENT-INDEX.md](AGENT-INDEX.md) 与 [fill/README.md](fill/README.md)。

未指定：`MATURE`→audit；`PARTIAL`/已有 meta 未满阶→**resume**；**大仓首次**→**pipeline**（L4，`fill_engine=agents`）；否则→land（大仓默认 L4）。  
**对外三档**阶梯：**协作入口**(L0) · **契约与回流**(L1–L2) · **门禁·工具·SSOT**(L3–L5)；细阶 L0–L5 见 [glossary.md](glossary.md) / [ladder.md](modes/ladder.md)。

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
- [ ] 7 分级移交 TODO（P1：若团队有主题流程控制器 → 新会话其 init/start（别名如 feature-eng），否则本 skill Done 即可；P1：精填分册 AGENTS；P1：Pn 回流 / 路径速查 / Never do↔Pn；若 Q_APIFOX：设 APIFOX_PROJECT_ID）
```

细节链：Read [detect.md](modes/detect.md) → [questions.yaml](questions.yaml) / [questions.md](modes/questions.md) → [write-plan.md](modes/write-plan.md) + [prefill.md](modes/prefill.md) → **harness.mjs** → [ladder.md](modes/ladder.md)。

## 硬闸门（正目标）

**违反确认闸门的字面 = 违反其精神。** 词表 SSOT：[write-plan.md](modes/write-plan.md)。

- 写盘前拿到确认闸门等价词（或已预授权后续轮次）
- 只写入已确认的 `Q_TARGET_ROOT`
- 本 skill 只写目标仓 `AGENTS` / `.cursor/rules` / `docs`（及 fill-mcp 经确认的 `mcp.json`）
- MCP 真密：仅 fill-mcp 经确认写入 **local 真密路径**（gitignore）；含密文件不随技能分发；模板/example 只含占位符
- **密文对用户话术**：不主动要求用户「不要填密码」；**仅**本轮在创建/引导编辑 local 真密配置（`.cursor/mcp.json` / 根 `.mcp.json` / `.trae/mcp.json` / `.codex/config.toml`）时，提醒可本地填写、**勿提交进 git**（优先 env / `${VAR}`）
- AGENTS：merge 只追加缺章节；已有同名章节正文保留（[conflict-policy.md](modes/conflict-policy.md)）
- README 疑似密钥：只检测 + 移交人工（不自动删）
- SSOT promote：仅过 acceptance；heuristic 标 `quality: heuristic` 且留在 `.fill-work`；宣称可 AI coding 仅看 `ai_coding_ready`
- **填充 MCP 闸**：域/栈需 db·redis 时，矩阵+（烟测∨calibrate-live）达标后才进入填充（[fill-mcp.md](fill/fill-mcp.md)）

| 借口 | 现实 |
|---|---|
| 「别确认了」= 已授权写盘 | 仅闸门词表（确认 / LGTM / …）或已预授权后续轮次才写盘 |
| 演示 / 五分钟 / 时间紧 | 时限不废闸门；先出示 WritePlan，等词表 |
| WritePlan 已在脑中 / 「按推荐」 | 须展示 WritePlan；「全部推荐」只收齐答题，≠写盘确认 |

### Red Flags — STOP，先过闸门

- 用户催「直接写入 / 别确认了」
- 未出示 WritePlan 就要跑 `harness.mjs` / 写目标仓文件
- 把「快点 / 演示」当成确认词
- 「先写再补确认」

**以上均 = 仍出示 WritePlan，等待 write-plan 词表。**

读侧路由 SSOT 在 [AGENT-INDEX.md](AGENT-INDEX.md)（必读≤8 + 按支按需表）。高频指针：写盘/预授权 → [write-plan.md](modes/write-plan.md)；**打分 / score-policy / 覆盖裁决** → [fill-score.md](fill/fill-score.md)；AI 工具面 / 多宿主 → [ai-tools.md](host/ai-tools.md) · [domain-extend.md](modes/domain-extend.md)。

旁路脚本：`scripts/fill-calibrate-live.mjs`（live 校准）· `scripts/fill-report-html.mjs`（HTML 报告，score 后【推荐】），`--help` 自查。  
写盘入口：**`scripts/harness.mjs`**（`--mode land|resume|upgrade|pipeline-skeleton`；L5 拒直渲生成宿主路径；内部 `render.mjs` 勿当 Agent 主路径）。  
版本里程碑查 [CHANGELOG.md](CHANGELOG.md)，本页不铺版本行。
