# 会话仪表盘（工程轮回复末尾）

> SSOT：仅当**本轮**有目标仓 harness **实质施工产出**、**闸门决策点**、或用户**显式要读数**时，对用户可见回复的**固定结尾**。默认 **HIDE**。提问批次 / 定根前 / 等确认空轮 / 改 skill / 纯 meta **整块省略**。与 `docs/harness-eng/report-latest.html`（施工 HTML 五台 · `report_schema` 0.4.0）互补：HTML 是持久产物；本节是**会话内**快照。

## Done

**SHOW**（本轮命中里程碑时）：

1. 回复正文之后、无其它内容之前，附上「## harness-eng 会话仪表盘」块（含四台表 + 可选宿主面一行 + 可选纯文本态势；无 score 时精简）
2. 已知 `--root` / `Q_TARGET_ROOT` 时，优先跑 `scripts/session-dash.mjs` 渲染（可 `--json` 自检；`--intent engineering`；`--help` 看选项）
3. **尚无目标根 → 一律 HIDE**（勿空表凑脚注；定根后再 SHOW）

**HIDE**（本轮未命中里程碑时）：

- **省略**整个 `## harness-eng 会话仪表盘` 块（含四台、纯文本态势、脚注）
- 不要为了「凑脚注」去跑 session-dash；若脚本自检可用 `--intent meta`（无 markdown 输出）

## 触发

Agent 每轮先判定 SHOW / HIDE，再决定是否附仪表盘。脚本只负责渲染，**不**推断意图。  
**判定粒度 = 本轮用户意图 + 本轮 Agent 动作**，不是「本会话是否曾点名 harness-eng / 是否曾施工」。  
**策略 = 里程碑 SHOW**（实质产出 / 闸门决策 / 显式读数）；沾过模式名不够。

### 判定顺序（先命中先定）

1. **先查 HIDE**：命中任一条 → 整块省略，不再看 SHOW  
2. **再查 SHOW**：命中至少一条 → 附仪表盘  
3. **其余含糊 → HIDE**（默认）

### HIDE（省略整块）— 优先

例如：

- 当前 skill 版本号 / changelog / 怎么安装 / 术语表 / 只读 handbook·QUICKSTART
- 分析 / 设计 / 改 **harness-eng skill 源码**、样式选型、规格讨论
- 业务写码 / 排错 / Review / 其它 skill，即便本会话早先跑过 land/audit
- 仅因 description 关键词匹配加载了 harness-eng；本轮只 Read 模式文档、无实质产出、未要读数
- 提问批次 / `questions-next` / RecommendedProfile / fingerprint 说明
- 仅 detect / 定根讨论、**尚无 `Q_TARGET_ROOT`**
- 正等 WritePlan 确认、用户本轮无确认且无改计划（含沉默续聊施工概念）
- 仅口头「打算改」目标仓产物，未确认且未写盘
- 工程会话中途跑题或纯 meta（版本、安装、术语）

### SHOW（附仪表盘）— 须本轮成立

本轮须满足**至少一条**（缺则 HIDE）：

- **实质产出**：本轮已跑并汇报 `harness.mjs` / `land` / `render` / `audit` / `fill-score` / `fill-report-html` / `fill-plan`（关批或写盘）/ `fill-*` 写盘 / `upgrade` / `seed-truths` / `pipeline` 落盘步骤；**或**本轮给出审计结论 / 打分结论 / 开干闸结论（含只读 audit 出缺口清单）
- **闸门决策点**：**出示 WritePlan** 等确认的那一轮；用户本轮说 **确认** / 改计划后继续 / 继续施工（含预授权后续轮的首写盘轮）
- **显式读数**：用户本轮明确要开干闸 / 完整度 / 会话仪表盘 / `report-latest` 读数 / 「现在能不能开干」（须已有目标根）

**不够 SHOW 的常见误判**（一律 HIDE）：

- 「会话里曾经 land 过」或「目标仓已有 `harness-meta.yaml`」
- 「正等 WritePlan 确认」但用户本轮无确认、无改计划（含问版本/安装/无关问题）
- 点名了 harness-eng 但只问「这是干什么的」
- 把提问批次 / RecommendedProfile / 仅 Read `detect.md` 当成「模式步进」
- 无目标根仍附精简仪表盘

### 边角

| 情形 | 判定 |
|---|---|
| 尚无 `Q_TARGET_ROOT`（含 detect / 定根讨论） | **HIDE** |
| 提问批次 / RecommendedProfile / fingerprint | **HIDE** |
| 出示 WritePlan 等确认（该轮） | **SHOW** |
| 正等 WritePlan 确认，用户本轮无确认且无改计划 | **HIDE** |
| 正等 WritePlan 确认，用户本轮说「确认」/ 改计划 / 继续施工 | **SHOW** |
| 本轮跑 audit/fill-score 并出结论 | **SHOW** |
| 首条只问「当前版本号多少」 | **HIDE** |
| 同会话先 audit 再聊无关业务 bug | 业务轮 **HIDE**；再回到 audit/fill 出结论则该轮 **SHOW** |
| 含糊：无实质产出、无闸门决策、无显式读数 | **HIDE**（默认） |

## 格式（固定）

### 全量（有 score / 有诊断信号）

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

宿主面：cursor live · hooks✓ mcp✓ · trae 未自证

（有 `host_surface` 磁盘或 live 数据时一行；全 absent 则省略。磁盘≠生效；不否决开干。）

**详情请查询仪表盘** → 目标仓 [`docs/harness-eng/report-latest.html`](…)（已生成时给 file 链接） · [五台读法（使用手册 · 第6章）](../guide/使用手册.html#s6)

（尚未生成报告时：脚注写预期路径 +「完整度打分」提示，手册链接仍必带。）
---
```

### 精简（无 score 且诊断空 · 减噪）

```markdown
---
## harness-eng 会话仪表盘（精简） · 未打分

**目标** `…` · **模式** … · **阶段** … · **预授权** 是|否

下一动作：…

**详情请查询仪表盘** → …（与全量同一脚注契约：已生成 file 链 / 未生成预期路径 · 手册 #s6）
---
```

**禁止**：把仪表盘插在正文中间；省略四台之一（全量）；精简省略「详情请查询仪表盘」脚注；用 `ready.ok` / overall / 参考分替代「开干」结论；把宿主 live 绑进开干判定。

## 数据优先级

| 台 | 来源（高→低） |
|---|---|
| 决策台 | `buildReportUi.go_nogo`（← `ai_coding_ready`） |
| 诊断台 | `ui.ladder_progress` / meta ladder + score skeleton/semantic/gold |
| 任务台 | CLI `--pending`/`--next` → `ui.tasks[0]` → `fill-plan.yaml` → `next_shards` |
| 趋势台 | `ui` coverage / morph / composite（参考分≠开干） |
| 宿主面一行 | `buildHostSurface`（磁盘+session-live）；无数据则省略 |

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
- 脚注固定以 **详情请查询仪表盘** 开头；链到目标仓 `report-latest.html`（已生成）+ skill 内 [使用手册.html `#s6`](../guide/使用手册.html#s6)（无 HTML 时回退 [使用手册.md 第6章](../guide/使用手册.md#60-对话内会话仪表盘工程轮末尾)）

## 与 HTML 报告关系

| 场景 | 会话仪表盘 | report-latest.html |
|---|---|---|
| 探测 / 提问 / 定根前 / 等确认空轮 | **省略** | 可能不存在 |
| 出示 WritePlan / 确认后写盘 / 实质产出 | 会话态快照 | 可能不存在 |
| 纯 meta / 版本 / 手册 / 跑题 / 改 skill | **省略** | 不涉及 |
| fill-score 后 | 三词 + 四台摘要 + 可选宿主面一行 | 【推荐】同步生成五台 HTML，脚注链过去 |
| audit 只读出结论 | 缺口摘要进任务台 | 不强制生成 |

开干结论**两处一致**：只看 `ai_coding_ready`（见 [glossary.md](../glossary.md)）。

## CLI

`node scripts/session-dash.mjs --help` 列出选项。`--intent meta` 省略输出。目标仓无 `score-latest.json` 且诊断空时，默认输出**精简**仪表盘（标题带「未打分」、下一动作行、与全量同款「详情请查询仪表盘」脚注；非空四台表），减噪；有 score 仍四台全量。

## Trae / 多宿主缺口用语

工程轮若触及 Trae：诊断/任务台可读 `.trae/rules` · `.trae/hooks.json` · `.trae/mcp.json`。  
**未生成** ≠ **未实证**（后者文件可能已在，只是 IDE 未开或未人验）。详 [audit-report.md](audit-report.md) · [TRAE-PARITY.md](../host/TRAE-PARITY.md)。
