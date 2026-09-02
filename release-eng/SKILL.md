---
name: release-eng
description: >-
  发版仪式：新建 prepare · 续跑 resume · 审计 audit · 归档 seal。
disable-model-invocation: true
---

# release-eng

版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)（变更见 [CHANGELOG.md](CHANGELOG.md)；可移植性见 [README.md](README.md)）。

Skill = **发版仪式**。真相在 `docs/releases/`（过程域；术语见根 [CONTEXT.md](../../../CONTEXT.md)）。对用户优先中文。  
Leading：`定版` · `发版单` · `发版日期` · `push-gate` · `WritePlan` · `seal` · `全部推荐` · `gates-common` · `首次发版` · `截断5` · `mergeSources` · `目录包` · `prod` · `SQL序` · `键级diff` · `jobs交叉` · `draft` · `双源去重` · `变更对象` · `artifacts.json` · `双轨研判` · `ai-track` · `逾期未归档` · `confidence` · `draft-md` · `note-merge` · `seal-check` · `Asia/Shanghai` · `来源分支功能` · `上线内容摘要`。

## 模式分流

| 意图 | 模式 | Read |
|---|---|---|
| 新建/生成发版单 | `prepare` | [prepare.md](prepare.md) |
| 同版本身份续跑 | `resume` | [resume.md](resume.md) |
| 只读检查 | `audit` | [audit.md](audit.md) |
| 已上线归档 | `seal` | [seal.md](seal.md) |

未指定：续跑/刷新 → `resume`；审计/检查 → `audit`；已上线/归档 → `seal`；否则 → `prepare`。

## 硬闸（正目标）

1. **首问**：确认 **`发版日期`**（【推荐】≥提问日+2 的第一个周四）+ 发版分支 +（基线分支或 **`首次发版`（基线=`无`）**）后才进入 push-gate（见 [gates-common.md](gates-common.md)）。发版单路径 = `notes/<slug>/<slug>.md`（`<slug>` = 发版分支名归一化：`origin/` 前缀去除、`/` → `-`；发版日期独立、不拼入目录名）。  
2. **逾期未归档**：`notes/` 已定版且发版日期已过 → 硬闸（先 seal）。  
3. **push-gate**：通过后才 freeze / 问卷 / 定版 WritePlan；中止则模式结束。  
4. **WritePlan**：写盘当且仅当过确认词（或同会话预授权）；audit 仅报告。  
5. **骨架**：缺失则 [bootstrap.md](bootstrap.md) 从 skill fixtures 创建；已存在 skip。  

`截断5` / **`mergeSources`** / **`目录包`** / **`draft-md`** / **`note-merge`** / **`seal-check`** / **`prod`** / **`键级diff`** / **`双源去重`** / **`artifacts.json`**：按需 Read [freeze.md](freeze.md) · [write-plan.md](write-plan.md) · [seal.md](seal.md) · [questions.md](questions.md) · 发版单模板。

## 旁路（按需 Read）

| 何时 | Read |
|---|---|
| 共享前缀 / 中止出口 / 发版日期 | [gates-common.md](gates-common.md) |
| 确认闸 / 预授权 / draft-md / note-merge | [write-plan.md](write-plan.md) · `scripts/release-note-merge.mjs` |
| 已上线归档 / seal-check | [seal.md](seal.md) · `scripts/release-seal-check.mjs` |
| 全部推荐 | [recommended.md](recommended.md) |
| fetch / push-gate | [git-gates.md](git-gates.md) · `scripts/release-push-gate.mjs` |
| 只读检查 / prior·freeze 体检 | [audit.md](audit.md) · `--format audit-json` |
| 定版采集 / 截断5 / mergeSources / SQL序 / 键级diff / jobs交叉 / Asia/Shanghai | [freeze.md](freeze.md) · `scripts/release-freeze.mjs` · `scripts/release-freeze-enrich.mjs` · `scripts/release-format.mjs` |
| 双轨研判 AI | [ai-track.md](ai-track.md) · `scripts/release-ai-track.mjs` |
| 骨架 | [bootstrap.md](bootstrap.md) · `fixtures/docs/releases/` |
| 问卷 / prod / 说明 | [questions.md](questions.md) |
| 幂等 | [idempotency.md](idempotency.md) |
| 发版单章节 | [docs/releases/templates/release-note-template.md](../../../docs/releases/templates/release-note-template.md) |
| 索引 | [docs/releases/releases.md](../../../docs/releases/releases.md) |
| 版本 / 可移植 | [`_meta/manifest.yaml`](_meta/manifest.yaml) · [CHANGELOG.md](CHANGELOG.md) · [README.md](README.md) |
