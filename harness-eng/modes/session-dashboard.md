# 会话仪表盘（工程轮回复末尾）

> SSOT：仅当**本轮**在做目标仓 harness 施工（或用户本轮明确要读数）时，对用户可见回复的**固定结尾**。纯 meta / 跑题 / 非工程对话**整块省略**。与 `docs/harness-eng/report-latest.html`（施工 HTML 四台）互补：HTML 是持久产物；本节是**会话内**快照。

## Done

**SHOW**（本轮判定为工程轮时）：

1. 回复正文之后、无其它内容之前，附上「## harness-eng 会话仪表盘」块（含四台表 + 可选纯文本态势）
2. 已知 `--root` / `Q_TARGET_ROOT` 时，优先跑 `scripts/session-dash.mjs` 渲染（可 `--json` 自检；`--intent engineering`；`--help` 看选项；无 score 时精简一行）
3. 尚无目标根时：**仅**本轮正在 detect / 定根 / land 提问 → 输出精简仪表盘（任务台写「待确认目标根」）；否则 **HIDE**（勿空表凑脚注）

**HIDE**（本轮判定为非工程轮时）：

- **省略**整个 `## harness-eng 会话仪表盘` 块（含四台、纯文本态势、脚注）
- 不要为了「凑脚注」去跑 session-dash；若脚本自检可用 `--intent meta`（无 markdown 输出）

## 触发

Agent 每轮先判定 SHOW / HIDE，再决定是否附仪表盘。脚本只负责渲染，**不**推断意图。  
**判定粒度 = 本轮用户意图 + 本轮 Agent 动作**，不是「本会话是否曾点名 harness-eng / 是否曾施工」。

### 判定顺序（先命中先定）

1. **先查 HIDE**：命中任一条 → 整块省略，不再看 SHOW  
2. **再查 SHOW**：命中至少一条 → 附仪表盘  
3. **其余含糊 → HIDE**（默认）

### HIDE（省略整块）— 优先

本轮**不在**做目标仓 harness 施工，例如：

- 当前 skill 版本号 / changelog / 怎么安装 / 术语表 / 只读 handbook·QUICKSTART
- 纯聊 skill 设计、改 skill 源码仓、或其它非目标仓话题
- 业务写码 / 排错 / Review / 其它 skill，即便本会话早先跑过 land/audit
- 仅因 description 关键词匹配加载了 harness-eng，但本轮未进入任何模式步骤、也未要读数
- 工程会话中途跑题或纯 meta（版本、安装、术语），**本轮**未推进施工、未要状态/打分/审计读数

### SHOW（附仪表盘）— 须本轮成立

本轮须满足**至少一条**（缺则 HIDE）：

- **模式步进**：本轮执行或推进了 `land` / `resume` / `pipeline` / `audit` / `upgrade` / `fill-*` / `fill-score` / `fill-mcp` / `detect` / WritePlan / render / ladder / `seed-truths`（含：出计划等确认、确认后写盘、出审计/打分结论、清残项）
- **改盘意图**：本轮正在改（或经确认将改）目标仓 harness 产物——AGENTS、rules、`docs/harness-eng`、meta、项目 MCP 接线；**仅口头讨论概念不够**
- **显式读数**：用户本轮明确要开干闸 / 完整度 / 会话仪表盘 / `report-latest` 读数 / 「现在能不能开干」

**不够 SHOW 的常见误判**（一律 HIDE）：

- 「会话里曾经 land 过」或「目标仓已有 `harness-meta.yaml`」
- 「正等 WritePlan 确认」但用户本轮问的是版本/安装/无关问题
- 点名了 harness-eng 但只问「这是干什么的」

### 边角

| 情形 | 判定 |
|---|---|
| 正等 WritePlan 确认，用户本轮问「当前版本号多少」/ 安装 / 术语 | **HIDE**（本轮 meta，不附） |
| 正等 WritePlan 确认，用户本轮说「确认」/ 改计划 / 继续施工 | **SHOW** |
| 首条只问「当前版本号多少」 | **HIDE** |
| 同会话先 audit 再聊无关业务 bug | 业务轮 **HIDE**；若再回到 audit/fill 则该轮 **SHOW** |
| 含糊：无本轮模式步进、无改盘意图、无显式读数 | **HIDE**（默认） |

## 格式（固定）

```markdown
---
## harness-eng 会话仪表盘

**目标** `…` · **模式** … · **阶段** … · **预授权** 是|否

| 台 | 读数 |
|:---|:---|
| **决策台** | 开干 YES|NO · 建议可以开干|建议暂缓 · blockers（若有） |
| **诊断台** | L* · 骨架/语义 · 金标 · 域列表 |
| **任务台** | 下一动作 / pending / fill-plan / next_shards |
| **趋势台** | 覆盖 ████ · 形态 ████ · 参考分（≠开干） |

施工态势：覆盖 80% × 形态 74%（Q2 理想区）

（有覆盖+形态时一行；缺任一轴则整行省略。象限阈值 0.5：Q1 补形态 / Q2 理想区 / Q3 起步 / Q4 补覆盖）

**详情请查询仪表盘** → 目标仓 [`docs/harness-eng/report-latest.html`](…)（已生成时给 file 链接） · [四台读法（使用手册.html#s6）](../使用手册.html#s6)

（尚未生成报告时：脚注写预期路径 +「完整度打分」提示，手册链接仍必带。）
---
```

**禁止**：把仪表盘插在正文中间；省略四台之一；用 `ready.ok` / overall / 参考分替代「开干」结论。

## 数据优先级

| 台 | 来源（高→低） |
|---|---|
| 决策台 | `score-latest.json` → `ai_coding_ready` + `buildReportUi` verdict |
| 诊断台 | `docs/harness-eng/harness-meta.yaml`（无则回退 `.cursor/`）+ score 的 skeleton/semantic/gold |
| 任务台 | CLI `--pending`/`--next` → 会话上下文 → `fill-plan.yaml` → `next_shards` |
| 趋势台 | score 的 coverage / overall / ui.composite |

会话字段：
- **模式**：以本轮 intent / CLI `--mode` 为准（fill-score、audit、pipeline…）；**勿**默认钉死 `meta.last_mode`
- `meta.last_mode` 仅作脚注（与本轮模式不同时括号注明）
- 阶段 / 预授权由 Agent 从当轮上下文填入；脚本 `--phase` / `--preauth` 可覆盖

## 脚本

```bash
node scripts/session-dash.mjs --root <TARGET> \
  --mode fill-score --phase "清残项" --preauth yes \
  [--pending "fill-plan --residual"] [--next "确认后 harness.mjs"] [--json] \
  [--intent engineering|meta]
```

- 只读；不写盘
- Agent 按本页触发规则决定是否调用；**工程轮务必传 `--mode`（本轮动作）**；`--intent engineering`（默认）渲染仪表盘；`--intent meta` 不输出 markdown（`--json` 时写 `{ omitted: true, reason: "meta" }`）
- 无 score 时不报错，趋势台写「暂无 score」
- 脚注固定以 **详情请查询仪表盘** 开头；链到目标仓 `report-latest.html`（已生成）+ skill 内 [使用手册.html#s6](../使用手册.html#s6)

## 与 HTML 报告关系

| 场景 | 会话仪表盘 | report-latest.html |
|---|---|---|
| 探测 / 提问 / 未打分（工程轮） | 会话态 + 阶梯/meta | 可能不存在 |
| 纯 meta / 版本 / 手册 / 跑题问答 | **省略** | 不涉及 |
| fill-score 后 | 三词 + 四台摘要 | 【推荐】同步生成，脚注链过去 |
| audit 只读 | 缺口摘要进任务台 | 不强制生成 |

开干结论**两处一致**：只看 `ai_coding_ready`（见 [glossary.md](../glossary.md)）。

## CLI

`node scripts/session-dash.mjs --help` 列出选项。`--intent meta` 省略输出。目标仓无 `score-latest.json` 且诊断空时，默认输出**精简**仪表盘（非空四台表），减噪；有 score 仍四台全量。

## Trae / 多宿主缺口用语

工程轮若触及 Trae：诊断/任务台可读 `.trae/rules` · `.trae/hooks.json` · `.trae/mcp.json`。  
**未生成** ≠ **未实证**（后者文件可能已在，只是 IDE 未开或未人验）。详 [audit-report.md](audit-report.md) · [TRAE-PARITY.md](../host/TRAE-PARITY.md)。
