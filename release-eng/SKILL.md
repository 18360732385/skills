---
name: release-eng
description: >-
  Use when 用户点名 release-eng / 发版仪式 / 发版单 / 定版 / seal，
  或要求在 docs/releases/ 准备·审计·归档·取消。
disable-model-invocation: true
---

# release-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（**0.4.8**；变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。
Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。  
CLI：`node scripts/release.mjs`（`prepare` 半自动编排 · `modes` · 脚本转发）。  
命令前缀：文档示例统一写 `.cursor/skills/release-eng/scripts/`；在本仓自测时替换为 `release-eng/scripts/`，装到 `.agents/skills/` 等其它位置时按实际安装路径替换前缀。

Skill = **发版仪式**（半自动编排到 WritePlan）。真相在 `docs/releases/`（过程域）。对用户优先中文。  
拓扑：`modes/` · `scripts/release.mjs` · `fixtures/docs/releases/`。  
约定 SSOT：[modes/conventions.md](modes/conventions.md)。术语：[GLOSSARY.md](GLOSSARY.md)。  
Leading：`定版` · `发版单` · `发版日期` · `release-V{yyMMdd}` · `push-gate` · `WritePlan` · `seal` · `cancel` · `首次发版` · `首次使用` · `SQL目录` · `SQL格式` · `截断5` · `前5` · `对比版本` · `artifacts.json` · `note-merge` · `seal-check` · `逾期未归档`。

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 新建/刷新发版单 | `prepare` | [prepare.md](modes/prepare.md) |
| 只读检查 | `audit` | [audit.md](modes/audit.md) |
| 已上线归档 | `seal` | [seal.md](modes/seal.md) |
| 取消进行中包 | `cancel` | [prepare.md](modes/prepare.md)#取消发版 |

未指定：审计/检查 → `audit`；已上线/归档 → `seal`；取消 → `cancel`；否则 → `prepare`。  
**resume 已并入 prepare**（同身份目录存在即刷新）。

**When NOT：** 只问「怎么写 changelog / 提交信息」且不要发版单目录包 → 勿启动本仪式；普通代码评审 / 非 `docs/releases/` 归档 → 勿套用硬闸。

## 硬闸（正目标）

1. **首问**：确认 **`发版日期`**（【推荐】≥提问日+2 的第一个周四）+ 发版分支 +（基线分支或 **`首次发版`（基线=`无`）**）后才进入 push-gate。版本身份 = `release-V{yyMMdd}` ← 发版日期；路径见 [modes/conventions.md](modes/conventions.md)。**首次使用**（`releases.md` 的 SQL 目录或 SQL 格式未记录）还须答完这两项并写入索引，才算首问齐。与「首次发版」无关。  
2. **逾期未归档**：进行中目录包已定版且发版日期已过 → 硬闸（先 seal）。  
3. **push-gate**：通过后才 freeze / 问卷 / 定版 WritePlan；中止则模式结束；**预览仅会话**，勿写目录包。  
4. **WritePlan**：写盘当且仅当过确认词（或同会话预授权）；audit 仅报告。  
5. **骨架**：缺失则 [bootstrap.md](modes/bootstrap.md) 从 skill fixtures 创建；已存在 skip。  
6. **仓内快照**：若存在 `scripts/release-eng/` 则 VERSION 须对齐；mismatch 挡写盘，除非 `--allow-drift`。  

**违反字面规则 = 违反精神。** 权威催促、窗口将至、草稿已赞、沉没成本均不构成例外。

## Red Flags — STOP

- 「别问日期/分支了，直接写」→ 仍回显首问各项并记确认，再 push-gate  
- 「别问 SQL 目录/格式了，默认 db/migration + Flyway」→ 索引未记录时仍要问并回显，答完写入 `releases.md` 再 push-gate  
- 「旧单以后再 archive」→ 逾期已定版硬闸；先 seal（或用户**书面**跳过）  
- 「先落盘给评审，push 稍后」→ push-gate 未通过则**勿**写 `docs/releases/<identity>/`；聊天可贴预览  
- 「看着不错，继续吧」/ Slack 👍 → **不是**确认词；回要词表内确认或预授权  
- 「archive 只是 housekeeping / 硬闸保 optics」→ 假；逾期硬闸挡的是并发定版混乱  

| 借口 | 现实 |
|---|---|
| 领导已口述参数 = 仪式关闭 | 须回显确认记入首问；仍走 push-gate → WritePlan |
| 没记 SQL 目录也先按 db/migration 扫 | 首次使用必须答目录和格式并写入索引；未记录时 prepare 拒绝编排 |
| 已定版 archive 可 TODO 后补 | 日期已过且仍在进行中目录 → 先 seal，再新 prepare |
| unpushed 只挡执行不挡落盘 | 未通过 = 模式中止；评审用聊天，不写目录包 |
| 「继续」≈ 确认；卡词表无意义 | 写盘仅认词表；非正式口语一律再问一句 |

按需 Read 的旁路路由见 [AGENT-INDEX.md](AGENT-INDEX.md)。
