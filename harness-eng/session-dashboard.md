# 会话仪表盘（工程轮回复末尾）

> SSOT：仅当本轮是**目标仓施工 / harness 工程**时，对用户可见回复的**固定结尾**。纯 meta / 信息问答**整块省略**。与 `docs/harness-eng/report-latest.html`（施工 HTML 四台）互补：HTML 是持久产物；本节是**会话内**快照。

## Done

**SHOW**（本轮判定为工程轮时）：

1. 回复正文之后、无其它内容之前，附上「## harness-eng 会话仪表盘」块（含四台表 + 条件 mermaid）
2. 已知 `--root` / `Q_TARGET_ROOT` 时，优先跑 `scripts/session-dash.mjs` 渲染（可 `--json` 自检；`--intent engineering`）
3. 尚无目标根时，仍输出仪表盘，但决策/诊断/趋势台标「—」或「未探测」，任务台写当前阶段

**HIDE**（本轮判定为 meta 时）：

- **省略**整个 `## harness-eng 会话仪表盘` 块（含四台、mermaid、脚注）
- 不要为了「凑脚注」去跑 session-dash；若脚本自检可用 `--intent meta`（无 markdown 输出）

## 触发

Agent 每轮先判定 SHOW / HIDE，再决定是否附仪表盘。脚本只负责渲染，**不**推断意图。

### SHOW（附仪表盘）

本轮涉及目标仓施工 / 跑 harness 模式，例如：

- `land` / `resume` / `pipeline` / `audit` / `upgrade` / `fill-*` / `fill-score` / `fill-mcp` / `detect` / WritePlan / render / ladder 工作
- 讨论或改目标仓 harness 产物（AGENTS、rules、`docs/harness-eng`、meta、项目 MCP 接线）
- 续跑中的工程会话：已有确认的目标根 + 进行中的模式

### HIDE（省略整块）

本轮是纯 meta / 信息问答、且不施工目标仓，例如：

- 当前 skill 版本号 / changelog
- harness-eng 是做什么的 / 怎么安装 / 术语表
- 只读 handbook / QUICKSTART、未定目标仓
- 纯聊 skill 本身，无 land/audit/pipeline/fill 意图、无目标根工程动作

### 边角

| 情形 | 判定 |
|---|---|
| 工程模式仍在进行（例如正等 WritePlan 确认），用户中途问一句 meta | **SHOW**（工程上下文未结束） |
| 首条只问「当前版本号多少」 | **HIDE** |
| 含糊：无进行中的工程模式、无已确认的 `Q_TARGET_ROOT` 施工、无明确工程动词 | **HIDE**（默认） |

有进行中的工程模式、已确认的 `Q_TARGET_ROOT` 施工、或明确工程动词 → SHOW。

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

（有 score 时附 quadrantChart mermaid）

**详情请查询仪表盘** → 目标仓 [`docs/harness-eng/report-latest.html`](…)（已生成时给 file 链接） · [四台读法（使用手册.html#s6）](使用手册.html#s6)

（尚未生成报告时：脚注写预期路径 +「完整度打分」提示，手册链接仍必带。）
---
```

**禁止**：把仪表盘插在正文中间；省略四台之一；用 `ready.ok` / overall / 参考分替代「开干」结论。

## 数据优先级

| 台 | 来源（高→低） |
|---|---|
| 决策台 | `score-latest.json` → `ai_coding_ready` + `buildReportUi` verdict |
| 诊断台 | `.cursor/harness-meta.yaml` + score 的 skeleton/semantic/gold |
| 任务台 | CLI `--pending`/`--next` → 会话上下文 → `fill-plan.yaml` → `next_shards` |
| 趋势台 | score 的 coverage / overall / ui.composite |

会话字段（模式/阶段/预授权）由 Agent 从当轮上下文填入；脚本 `--mode` / `--phase` / `--preauth` 可覆盖。

## 脚本

```bash
node scripts/session-dash.mjs --root <TARGET> \
  --mode pipeline --phase "WritePlan 待确认" --preauth no \
  [--pending "等待确认"] [--next "确认后 render"] [--json] \
  [--intent engineering|meta]
```

- 只读；不写盘
- Agent 按本页触发规则决定是否调用；`--intent engineering`（默认）渲染仪表盘；`--intent meta` 不输出 markdown（`--json` 时写 `{ omitted: true, reason: "meta" }`）
- 无 score 时不报错，趋势台写「暂无 score」
- 脚注固定以 **详情请查询仪表盘** 开头；链到目标仓 `report-latest.html`（已生成）+ skill 内 [使用手册.html#s6](使用手册.html#s6)

## 与 HTML 报告关系

| 场景 | 会话仪表盘 | report-latest.html |
|---|---|---|
| 探测 / 提问 / 未打分（工程轮） | 会话态 + 阶梯/meta | 可能不存在 |
| 纯 meta / 版本 / 手册问答 | **省略** | 不涉及 |
| fill-score 后 | 三词 + 四台摘要 | 【推荐】同步生成，脚注链过去 |
| audit 只读 | 缺口摘要进任务台 | 不强制生成 |

开干结论**两处一致**：只看 `ai_coding_ready`（见 [glossary.md](glossary.md)）。
