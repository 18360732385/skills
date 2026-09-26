# harness-eng 快速开始

一页纸入口。详细闸门与模式见 [SKILL.md](SKILL.md)、[glossary.md](glossary.md)。  
人读完整说明：[guide/使用手册.md](guide/使用手册.md) · 浏览器版：[guide/使用手册.html](guide/使用手册.html)；对外短文：[guide/使用手册-摘要.md](guide/使用手册-摘要.md)。
拓扑：`modes/` · `fill/` · `host/`；热路径见 [AGENT-INDEX.md](AGENT-INDEX.md)。

## 一句话安装 / 更新

```text
帮我把这个 skill 装到你当前 Agent 宿主的用户 skills 目录，地址：
https://github.com/18360732385/skills/tree/main/harness-eng
```

```bash
npx skills add https://github.com/18360732385/skills/tree/main/harness-eng -g
# 需要指定宿主时加上：--agent <host>
```

装完**新开会话**后点名 **harness-eng**。路径因宿主而异（Cursor：`~/.cursor/skills/` 或 `skills-cursor`；Claude Code：`~/.claude/skills/`；Trae：`~/.trae/skills/` 或项目 `.trae/skills/`——**示例≠唯一安装目标**；其他按该宿主文档）。更新同 URL 再执行一次即可。生产装/升用 **`main`**。0.6 系列开发在 `V0.6.X`，合并进 `main` 后生产再装/升。详情见手册「2. 如何安装和更新」。
L5 仓升级 skill 后一行：`node scripts/harness.mjs --check-freshness --root <TARGET>`；落后则 land/upgrade 刷新 `scripts/agent-config/sync.mjs`，再 `node scripts/agent-config/sync.mjs`。

## 你要做什么？（对外四支）

| 支 | 对 Agent 说 | 结果 |
|---|---|---|
| **流水线** | **流水线** / pipeline | 大仓首次：audit → **L4** land → MCP 闸 → inventory → fill-plan → agents → score → HTML 报告 |
| **施工** | **落地** / **续跑** / **升阶** / seed-truths | 装或补骨架（半成品用续跑，`on_exists=skip`） |
| **审计 / 自证** | **审计** / **会话自证** | 对照 **L0–L5** 缺口或核验当前宿主；默认不写盘（audit） |
| **填充** | **填充** / fill-plan / agents / **打分** | MCP 过闸 → Plan → agents → acceptance → merge → score |

含 Cron/Scheduler：域含 **jobs** → `fill-inventory.mjs --domain jobs` → `.fill-work` → acceptance → `fill-merge.mjs --domain jobs`（heuristic 不得误标升 SSOT）。仅脚本薄草稿（对话不推荐）：[archive/fill-truths-auto](archive/fill-truths-auto/INDEX.md)。

## 能否 AI Coding（10 秒）

打开目标仓 `docs/harness-eng/report-latest.html`（施工仪表盘）：

| 决策台 | 结论 |
|---|---|
| 徽章 **「建议可以开干」** + 可 AI coding **YES** | 可以开干（仍须人工审） |
| 「建议暂缓」/ 开干 NO / blockers 非空 | 不可以 |
| 仅 overall / 金标 /「仪表参考分」高 | 不可以（参考分 ≠开干） |

五台读法见 [guide/使用手册.md](guide/使用手册.md) 第 6 章 · [guide/使用手册.html](guide/使用手册.html#s6)。会话内仅**实质产出 / 闸门决策 / 显式读数**时 SHOW；细则 [session-dashboard.md](modes/session-dashboard.md)。

## 写盘闸门（必记）

确认 / 预授权：[write-plan.md](modes/write-plan.md)。「全部推荐」：[recommended-profile.md](modes/recommended-profile.md)。最短路径：全部推荐 → 确认预授权 → 确认。

需 db·redis 实据时过 **填充 MCP 闸**：**过闸后再** inventory / agents；未过则停留骨架。细则 SSOT：[fill-mcp.md](fill/fill-mcp.md)。

## 推荐最短路径（大仓）

```text
1. 点名 harness-eng → 流水线（目标 L4 · fill_engine=agents · gold）
2. 全部推荐 → 确认预授权 → 确认
3. 骨架战役（audit→L4→fill-mcp）过闸后 → 填充战役见 modes/pipeline-fill.md
4. acceptance → fill-merge → 打开 report-latest.html，看 ai_coding_ready
5. Plan 未关或金标低 → 继续 agents；早停看 Plan 关闭 + ai_coding_ready
```

## 本地脚本（可选）

在 **harness-eng 技能目录**执行（`--root` 指向业务目标仓）：

```bash
cd <harness-eng技能目录>
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode land
# 骨架战役：--mode pipeline-skeleton
node scripts/selfcheck.mjs
```

fill 家族 CLI（inventory / merge / plan / score / report）见 [fill/README.md](fill/README.md)。

### Windows 传参（醒目）

PowerShell **勿**用 `>` 重定向写 JSON（易 UTF-16）。写 **UTF-8 无 BOM** 文件再传路径。完整示例 SSOT：[write-plan.md](modes/write-plan.md#windows-json-传参gotcha-ssot)。

多宿主对齐（含 **Trae 高**）见 [ai-tools.md](host/ai-tools.md)。热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。  
版本见 [CHANGELOG.md](CHANGELOG.md)（当前 **0.7.14**）。
