# 会话仪表盘（每轮回复末尾）

> SSOT：harness-eng 对话**每一轮**对用户可见回复的**固定结尾**。与 `docs/harness-eng/report-latest.html`（施工 HTML 四台）互补：HTML 是持久产物；本节是**会话内**快照。

## Done

1. 回复正文之后、无其它内容之前，附上「## harness-eng 会话仪表盘」块（含四台表 + 条件 mermaid）
2. 已知 `--root` / `Q_TARGET_ROOT` 时，优先跑 `scripts/session-dash.mjs` 渲染（可 `--json` 自检）
3. 尚无目标根时，仍输出仪表盘，但决策/诊断/趋势台标「—」或「未探测」，任务台写当前阶段

## 触发

- 用户点名 **harness-eng** / `/harness-eng` 的会话内**每一轮** Agent 回复（含 audit 只读、提问、WritePlan、执行中进度）

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
  [--pending "等待确认"] [--next "确认后 render"] [--json]
```

- 只读；不写盘
- 无 score 时不报错，趋势台写「暂无 score」
- 脚注固定以 **详情请查询仪表盘** 开头；链到目标仓 `report-latest.html`（已生成）+ skill 内 [使用手册.html#s6](使用手册.html#s6)

## 与 HTML 报告关系

| 场景 | 会话仪表盘 | report-latest.html |
|---|---|---|
| 探测 / 提问 / 未打分 | 会话态 + 阶梯/meta | 可能不存在 |
| fill-score 后 | 三词 + 四台摘要 | 【推荐】同步生成，脚注链过去 |
| audit 只读 | 缺口摘要进任务台 | 不强制生成 |

开干结论**两处一致**：只看 `ai_coding_ready`（见 [glossary.md](glossary.md)）。
