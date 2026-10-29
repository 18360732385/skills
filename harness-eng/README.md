# harness-eng

将「索引+真相 / AGENTS / path-scoped rules / agent-kb」等 Agent Harness 工程化能力，以去域化模板落地到目标仓库。

**当前版本：0.7.49**（见 [CHANGELOG.md](CHANGELOG.md)、[QUICKSTART.md](QUICKSTART.md)；权威号：`_meta/manifest.yaml`（技能包）· `templates/_meta/manifest.yaml`（落地模板；version 须一致））

**一页纸入口**：[QUICKSTART.md](QUICKSTART.md)  
**Agent 热路径**：[AGENT-INDEX.md](AGENT-INDEX.md) · 填充索引：[fill/README.md](fill/README.md)  
**使用手册（人读）**：[guide/使用手册.html](guide/使用手册.html) · [guide/使用手册.md](guide/使用手册.md) · [guide/使用手册-摘要.md](guide/使用手册-摘要.md)  
**拓扑**：`modes/` 模式规格 · `fill/` 填充家族 · `host/` 多宿主  
**维护者验收**：[VERIFY.md](VERIFY.md)（非上手教程）

历史与列车明细见 [CHANGELOG.md](CHANGELOG.md)；勿当现行矩阵。

## Git 门禁（HS-8）

`core.hooksPath` **不会**随 clone 继承。新 clone / 新机器上须本机执行一次：

```bash
git config core.hooksPath .githooks
```

（Windows 同理。）land 若写入 `.githooks/pre-commit`，移交 TODO / README 应提示启用；**不**自动改全局 git config。

## 安装

### 源仓内置

本仓路径：`harness-eng/`（拷到宿主用户 skills 目录后为 `<host-skills-dir>/harness-eng/`）。对话中显式点名 **harness-eng**（或落地 / 流水线 / 续跑 / 审计 / 补空壳真相）。人读说明见 [guide/使用手册.html](guide/使用手册.html) / [guide/使用手册.md](guide/使用手册.md)。

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

## 模式（对 Agent 说）

| 对 Agent 说 | 支 | 结果 |
|---|---|---|
| **流水线** / pipeline | 流水线 | 大仓首次：骨架 → MCP 闸 → 填充 → score |
| **落地** / **续跑** / **升阶** | 施工 | 装或补骨架（半成品用续跑） |
| **审计** / **会话自证** | 审计 / 自证 | 对照缺口；默认不写盘 |
| **填充** / **打分** / fill-plan | 填充 | MCP 过闸后精填与打分 |

完整模式 ID 与细节见 [QUICKSTART.md](QUICKSTART.md) · [SKILL.md](SKILL.md)。不确定选项时回复：**全部推荐**（协议 [recommended-profile.md](modes/recommended-profile.md)；写盘仍过 [write-plan.md](modes/write-plan.md)）。

## 纪律

- 写盘前过 [write-plan.md](modes/write-plan.md) 闸门（或已预授权）
- 需 db·redis 时过 [fill-mcp.md](fill/fill-mcp.md) **填充 MCP 闸**（过闸后再填充；未过停留骨架）
- 模板只含去域化骨架；业务 `Pn` 回流（Never do↔pitfalls）与前后端契约门禁剖面来自本仓经确认抽取；MCP 真密不入库
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

技能包权威：`_meta/manifest.yaml`；落地模板权威：`templates/_meta/manifest.yaml`（两边 `version` 须一致，以 manifest 为准）。报告对照 **`skill_version` + `report_schema`**（**报告壳 ≠ skill**；`ui.version` 仅为兼容别名，见 glossary）。
