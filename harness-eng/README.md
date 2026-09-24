# harness-eng

将「索引+真相 / AGENTS / path-scoped rules / agent-kb」等 Agent Harness 工程化能力，以去域化模板落地到目标仓库。

**当前版本：0.7.2**（见 [CHANGELOG.md](CHANGELOG.md)、[QUICKSTART.md](QUICKSTART.md)；权威号：`_meta/manifest.yaml`（技能包）· `templates/_meta/manifest.yaml`（落地模板；version 须一致））

**0.7.2**：硬删 `land.mjs` 与域 fill shim。**0.7.1**：热路径瘦身。**0.7.0**：形态重标定 · Codex → **高** · Pn 回流 / 前后端契约门禁（[host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [host/CODEX-MANUAL.md](host/CODEX-MANUAL.md)；纪律 B；不做 `.mdc` 镜像）。**0.6.9**：Codex 高落地。更早列车见 [CHANGELOG.md](CHANGELOG.md)。  
**一页纸入口**：[QUICKSTART.md](QUICKSTART.md)  
**Agent 热路径**：[AGENT-INDEX.md](AGENT-INDEX.md) · 填充索引：[fill/README.md](fill/README.md)  
**使用手册（人读）**：[使用手册.html](使用手册.html) · [使用手册.md](使用手册.md) · [使用手册-摘要.md](使用手册-摘要.md)  
**拓扑**：`modes/` 模式规格 · `fill/` 填充家族 · `host/` 多宿主

历史（0.6.0 文档拓扑 / Codex 曾冻结 P2 等）见 [CHANGELOG.md](CHANGELOG.md)；勿当现行矩阵。

## 安装

### 源仓内置

本仓路径：`harness-eng/`（拷到宿主用户 skills 目录后为 `<host-skills-dir>/harness-eng/`）。对话中显式点名 **harness-eng**（或落地 / 流水线 / 续跑 / 审计 / 补空壳真相）。人读说明见 [使用手册.html](使用手册.html) / [使用手册.md](使用手册.md)。

**一句话安装（推荐）：** 对 Agent 说「帮我把这个 skill 装到你当前 Agent 宿主的用户 skills 目录，地址：https://github.com/18360732385/skills/tree/main/harness-eng」；或 `npx skills add https://github.com/18360732385/skills/tree/main/harness-eng -g`（需要时按宿主加 `--agent`）。装完新开会话后再点名。生产装/升用 **`main`**。0.6 系列开发在 `V0.6.X`，合并进 `main` 后生产再装/升。

### 跨仓 / 用户 skills

拷到 `<host-skills-dir>/harness-eng`，保证目录内直接有 `SKILL.md`。示例：Cursor `~/.cursor/skills/harness-eng`（或 `skills-cursor`）；Claude Code `~/.claude/skills/harness-eng`；其他按该宿主文档。

```powershell
Copy-Item -Recurse -Force harness-eng <host-skills-dir>\harness-eng
```

```bash
cp -R harness-eng <host-skills-dir>/harness-eng
```

（若源已在某宿主的 skills 目录，把上面的 `harness-eng` 换成该路径即可。）

新开 Agent 会话后生效。

## 模式

| 中文 | 模式 | 用途 |
|---|---|---|
| 落地 | `land` | 探测 → 推荐包 → 提问 → WritePlan → 确认后 `harness.mjs` |
| 续跑 | `resume` | 半成品差分补齐；`on_exists=skip` |
| 流水线 | `pipeline` | 骨架战役 → 填充战役（过 **填充 MCP 闸**） |
| 审计 | `audit` | 只读对照阶梯缺口 |
| 升阶 | `upgrade` | 默认 +1；书面可到指定阶（[upgrade.md](modes/upgrade.md)） |
| 补空壳真相 | `seed-truths` | 索引行 + `01-*.md` 空壳 |
| 完整度打分 | `fill-score` | `scripts/fill-score.mjs` + score-policy 裁决（双轴） |
| 形态诊断 | `fill-morph` | 同上 `--focus morph`；看诊断台 |
| 开干闸 | `fill-gate` | 同上 `--focus gate`；看决策台 |
| 填充计划 | `fill-plan` | 批次 / 金标 |
| 多 Agent 精填 | `fill-truths-agents` | 按 Plan 精填【推荐】 |
| 自动填充 | `fill-truths-auto` | 仅脚本、对话不推荐（[archive](archive/fill-truths-auto/INDEX.md)） |
| 契约填充 | `fill-truths` | 见 [fill/fill.md](fill/fill.md) |
| MCP 装配 | `fill-mcp` | 本仓配置 → 多环境 mcp 矩阵 |
| live 校准 | `fill-calibrate-live` | MCP 不可用时直连 |
| HTML 报告 | `fill-report-html` | score → Dashboard（页脚：`skill_version` + `report_schema`；报告壳 ≠ skill） |

不确定选项时回复：**全部推荐**（协议 [recommended-profile.md](modes/recommended-profile.md)；写盘仍过 [write-plan.md](modes/write-plan.md)）。

## 纪律

- 写盘前过 [write-plan.md](modes/write-plan.md) 闸门（或已预授权）
- 需 db·redis 时过 [fill-mcp.md](fill/fill-mcp.md) **填充 MCP 闸**（过闸后再填充；未过停留骨架）
- 模板只含去域化骨架；业务 `Pn` / 域 Never do / MCP 真密来自本仓经确认抽取
- 多工作区必须确认目标根
- 对用户优先中文；术语见 [glossary.md](glossary.md)

## 脚本

```bash
node scripts/selfcheck.mjs
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode land
node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json
```

仅保留当前 selfcheck；近期归档见 `archive/selfcheck/`。0.2.x–0.3.x 体积不在热树，见 [archive/selfcheck/legacy/INDEX.md](archive/selfcheck/legacy/INDEX.md)。**安装 ≠ 全仓。**

## 版本

技能包权威：`_meta/manifest.yaml`；落地模板权威：`templates/_meta/manifest.yaml`（两边 `version` 当前 **0.7.2**，须一致）。报告对照 **`skill_version` + `report_schema`**（**报告壳 ≠ skill**；`ui.version` 仅为兼容别名，见 glossary）。
