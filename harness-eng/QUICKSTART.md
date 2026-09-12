# harness-eng 快速开始

一页纸入口。详细闸门与模式见 [SKILL.md](SKILL.md)、[glossary.md](glossary.md)。  
人读完整说明：[使用手册.html](使用手册.html) / [使用手册.md](使用手册.md)；对外短文：[使用手册-摘要.md](使用手册-摘要.md)。

## 一句话安装 / 更新

```text
帮我把这个 skill 装到你当前 Agent 宿主的用户 skills 目录，地址：
https://github.com/18360732385/skills/tree/main/harness-eng
```

```bash
npx skills add https://github.com/18360732385/skills/tree/main/harness-eng -g
# 需要指定宿主时加上：--agent <host>
```

装完**新开会话**后点名 **harness-eng**。路径因宿主而异（Cursor：`~/.cursor/skills/` 或 `skills-cursor`；Claude Code：`~/.claude/skills/`；其他按该宿主文档）。更新同 URL 再执行一次即可。详情见手册「2. 如何安装和更新」。

## 你要做什么？

| 场景 | 对 Agent 说 | 结果 |
|---|---|---|
| 大仓第一次上 harness | **流水线** / pipeline | audit → **L4** land → **MCP 矩阵** → inventory → **fill-plan --gold** → **agents** → acceptance → score → **HTML 报告** |
| 只看缺口、不写盘 | **审计** / audit | 对照 L0–L5，默认不写文件 |
| 半成品接着补 | **续跑** / resume | 只补缺口，`on_exists=skip` |
| 按模板深填契约 | **多 Agent 填充** / fill-truths-agents | 须过 **填充 MCP 闸** → Plan 批次 → acceptance → merge → score |
| 含 Cron / Scheduler | 域含 **jobs** + inventory | `fill-inventory-jobs` → `.fill-work` → acceptance → `fill-merge.mjs --domain jobs`（heuristic 不得误标升 SSOT） |
| 建填充目标/批次 | **填充计划** / fill-plan | `docs/harness-eng/fill-plan.yaml`（大仓 gold+sample_n） |
| 仅脚本薄草稿（不推荐） | **自动填充** / fill-truths-auto | 仅 `--work-only` → `.fill-work`（legacy；仅 draft） |
| 看能不能开 AI 改业务 | **完整度打分** / fill-score | 打开 **report-latest.html** 决策台 |

## 能否 AI Coding（10 秒）

打开目标仓 `docs/harness-eng/report-latest.html`（施工仪表盘）：

| 决策台 | 结论 |
|---|---|
| 徽章 **「建议可以开干」** + 可 AI coding **YES** | 可以开干（仍须人工审） |
| 「建议暂缓」/ 开干 NO / blockers 非空 | 不可以 |
| 仅 overall / 金标 /「仪表参考分」高 | 不可以（参考分 ≠开干） |

四台读法见 [使用手册.html](使用手册.html) 首页示意与第 6 章。  
施工/审计等**工程轮**末尾另有**会话仪表盘**（四台摘要 + mermaid）；纯问版本 / 手册 / 技能本身则省略。见 [session-dashboard.md](session-dashboard.md)。

## 写盘闸门（必记）

确认 / 预授权词表：[write-plan.md](write-plan.md)。「全部推荐」协议：[recommended-profile.md](recommended-profile.md)。最短路径：全部推荐 → 确认预授权 → 确认。

需 db·redis 实据时另过 **填充 MCP 闸**（[fill-mcp.md](fill-mcp.md)）：仓库 profile 自动发现 → `{engine}-{profile}` 矩阵 +（烟测 ∨ calibrate-live）；**过闸后再** inventory / agents；未过则停留骨架。

## 推荐最短路径（大仓）

```text
1. 点名 harness-eng → 流水线（目标 L4 · fill_engine=agents · gold）
2. 全部推荐 → 确认预授权 → 确认
3. 骨架战役（audit→L4→fill-mcp 矩阵）过闸后 → 填充战役见 pipeline-fill.md
4. acceptance-check → fill-merge.mjs --domain <id>（过闸）→ 打开 docs/harness-eng/report-latest.html
5. 看决策台 **建议可以开干**（ai_coding_ready）；顺带看 gold_ratio；heuristic 只留 `.fill-work`
6. Plan 未关或金标低 → 继续 agents；早停看 Plan 关闭 + `ai_coding_ready` / `gold_ratio`
```

## 本地脚本（可选）

在 **harness-eng 技能目录**执行（`--root` 指向业务目标仓）：

```bash
cd <harness-eng技能目录>
node scripts/fill-plan.mjs --root <TARGET> --init --gold --sample-n 30
node scripts/acceptance-check.mjs --root <TARGET> --domain api
node scripts/fill-score.mjs --root <TARGET>
node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json
node scripts/selfcheck.mjs
```

多宿主对齐：**Cursor / Claude / Qoder / WorkBuddy 高**；**Trae 中高**；**Codex 部分（P2）**（不全量同步）。详 [ai-tools.md](ai-tools.md)。

版本见 [CHANGELOG.md](CHANGELOG.md)（当前 **0.5.8**）。
