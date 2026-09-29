---
name: release-eng
description: >-
  Use when 用户点名 release-eng / 发版仪式 / 发版单 / 定版 / seal，
  或要求在 docs/releases/ 准备·续跑·审计·归档；也在催「别问了直接写」、
  「旧单以后再 archive」「先落盘评审 push 稍后」「看着不错继续」时加载。
disable-model-invocation: true
---

# release-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（**0.3.21-dev**；变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。
Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。薄 CLI：`node scripts/release.mjs`（`modes` / 脚本转发）。

Skill = **发版仪式**。真相在 `docs/releases/`（过程域；术语见根 [CONTEXT.md](../../../CONTEXT.md)）。对用户优先中文。  
拓扑：`modes/` 模式规格（prepare/resume/audit/seal 等）· `scripts/release.mjs` 统一薄入口 · `fixtures/docs/releases/` 骨架种子。  
Leading：`定版` · `发版单` · `发版日期` · `push-gate` · `WritePlan` · `seal` · `全部推荐` · `gates-common` · `首次发版` · `截断5` · `mergeSources` · `目录包` · `prod` · `SQL序` · `键级diff` · `jobs交叉` · `draft` · `双源去重` · `变更对象` · `artifacts.json` · `双轨研判` · `ai-track` · `逾期未归档` · `confidence` · `draft-md` · `note-merge` · `seal-check` · `Asia/Shanghai` · `来源分支功能` · `上线内容摘要`。

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 新建/生成发版单 | `prepare` | [prepare.md](modes/prepare.md) |
| 同版本身份续跑 | `resume` | [resume.md](modes/resume.md) |
| 只读检查 | `audit` | [audit.md](modes/audit.md) |
| 已上线归档 | `seal` | [seal.md](modes/seal.md) |

未指定：续跑/刷新 → `resume`；审计/检查 → `audit`；已上线/归档 → `seal`；否则 → `prepare`。

**When NOT：** 只问「怎么写 changelog / 提交信息」且不要发版单目录包 → 勿启动本仪式；普通代码评审 / 非 `docs/releases/` 归档 → 勿套用硬闸。

## 硬闸（正目标）

1. **首问**：确认 **`发版日期`**（【推荐】≥提问日+2 的第一个周四）+ 发版分支 +（基线分支或 **`首次发版`（基线=`无`）**）后才进入 push-gate（见 [gates-common.md](modes/gates-common.md)）。发版单路径 = `notes/<slug>/<slug>.md`（`<slug>` = 发版分支名归一化：`origin/` 前缀去除、`/` → `-`；发版日期独立、不拼入目录名）。  
2. **逾期未归档**：`notes/` 已定版且发版日期已过 → 硬闸（先 seal）。  
3. **push-gate**：通过后才 freeze / 问卷 / 定版 WritePlan；中止则模式结束。  
4. **WritePlan**：写盘当且仅当过确认词（或同会话预授权）；audit 仅报告。  
5. **骨架**：缺失则 [bootstrap.md](modes/bootstrap.md) 从 skill fixtures 创建；已存在 skip。  

**违反字面规则 = 违反精神。** 权威催促、窗口将至、草稿已赞、沉没成本均不构成例外。

## Red Flags — STOP

- 「别问日期/分支了，直接写」→ 仍回显首问三项并记确认，再 push-gate  
- 「旧单以后再 archive」→ 逾期已定版硬闸；先 seal（或用户**书面**跳过）  
- 「先落盘给评审，push 稍后」→ push-gate 未通过则**勿**写 `notes/` / artifacts；聊天可贴草稿  
- 「看着不错，继续吧」/ Slack 👍 → **不是**确认词；回要词表内确认或预授权  
- 「archive 只是 housekeeping / 硬闸保 optics」→ 假；逾期硬闸挡的是并发定版混乱  

| 借口 | 现实 |
|---|---|
| 领导已口述参数 = 仪式关闭 | 须回显确认记入首问；仍走 push-gate → WritePlan |
| 已定版 archive 可 TODO 后补 | 日期已过且仍在 notes/ → 先 seal，再新 prepare |
| unpushed 只挡执行不挡落盘 | 未通过 = 模式中止；评审用聊天/gist，不写目录包 |
| 「继续」≈ 确认；卡词表无意义 | 写盘仅认词表；非正式口语一律再问一句 |

`截断5` / **`mergeSources`** / **`目录包`** / **`draft-md`** / **`note-merge`** / **`seal-check`** / **`prod`** / **`键级diff`** / **`双源去重`** / **`artifacts.json`**：按需 Read [freeze.md](modes/freeze.md) · [write-plan.md](modes/write-plan.md) · [seal.md](modes/seal.md) · [questions.md](modes/questions.md) · 发版单模板。

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 共享前缀 / 中止出口 / 发版日期 | [gates-common.md](modes/gates-common.md) |
| 确认闸 / 预授权 / draft-md / note-merge | [write-plan.md](modes/write-plan.md) · `scripts/release-note-merge.mjs` |
| 已上线归档 / seal-check | [seal.md](modes/seal.md) · `scripts/release-seal-check.mjs` |
| 全部推荐 | [recommended.md](modes/recommended.md) |
| fetch / push-gate | [git-gates.md](modes/git-gates.md) · `scripts/release-push-gate.mjs` |
| 只读检查 / prior·freeze 体检 | [audit.md](modes/audit.md) · `--format audit-json` |
| 定版采集 / 截断5 / mergeSources / SQL序 / 键级diff / jobs交叉 / Asia/Shanghai | [freeze.md](modes/freeze.md) · `scripts/release-freeze.mjs` · `scripts/release-freeze-enrich.mjs` · `scripts/release-format.mjs` |
| 双轨研判 AI | [ai-track.md](modes/ai-track.md) · `scripts/release-ai-track.mjs` |
| 骨架 | [bootstrap.md](modes/bootstrap.md) · `fixtures/docs/releases/` |
| 问卷 / prod / 说明 | [questions.md](modes/questions.md) |
| 幂等 | [idempotency.md](modes/idempotency.md) |
| modes 索引 | [modes/README.md](modes/README.md) · `node scripts/release.mjs modes` |
| 发版单章节 | [docs/releases/templates/release-note-template.md](../../../docs/releases/templates/release-note-template.md) |
| 索引 | [docs/releases/releases.md](../../../docs/releases/releases.md) |
| 版本 / 可移植 / 门禁 | [`_meta/manifest.yaml`](_meta/manifest.yaml) · [CHANGELOG.md](CHANGELOG.md) · [README.md](README.md) · [AGENT-INDEX.md](AGENT-INDEX.md) · [QUICKSTART.md](QUICKSTART.md) · [VERIFY.md](VERIFY.md) · `scripts/selfcheck.mjs` |
