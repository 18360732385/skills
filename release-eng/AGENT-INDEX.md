# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读入口：[README.md](README.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。

**拓扑（0.4.4）**：`modes/` · `scripts/release.mjs`（prepare 半自动）· `scripts/` 仪式脚本 · `fixtures/docs/releases/`；身份 `release-V{yyMMdd}`。  
**发版**：① 只改 [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version` → ② `node scripts/sync-skill-version.mjs` → ③ [`../_log/release-eng/`](../_log/release-eng/) + [CHANGELOG.md](CHANGELOG.md) / [VERIFY.md](VERIFY.md) → ④ `node scripts/selfcheck.mjs`（快测：`--layer unit|contract`）。  
**非 harness land**（`harness_land: false`）。

## 必读（写盘 / 定版前）≤8

| 何时 | Read / 跑 |
|---|---|
| 入口 / 模式分流 / 硬闸 | [SKILL.md](SKILL.md) |
| 约定 SSOT（日期 / `release-V{yyMMdd}` / 目录包 / 截断5 / …） | [conventions.md](modes/conventions.md) |
| 共享前缀 / 发版日期 / 中止出口 | [gates-common.md](modes/gates-common.md) |
| fetch / push-gate | [git-gates.md](modes/git-gates.md) · `release.mjs push-gate` |
| 半自动编排 / 刷新 / 取消 | [prepare.md](modes/prepare.md) · `release.mjs prepare` · `release.mjs cancel` |
| 确认闸 / draft-md / note-merge | [write-plan.md](modes/write-plan.md) · `release-note-merge.mjs` |
| 已上线归档 / seal-check | [seal.md](modes/seal.md) · `release-seal-check.mjs` |
| 版本 / 验收 | [CHANGELOG.md](CHANGELOG.md) · [VERIFY.md](VERIFY.md) · `selfcheck.mjs` |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 只读检查 | [audit.md](modes/audit.md) · freeze `--format audit-json` |
| SQL 目录与格式（首次使用写入 / 之后只读） | `release.mjs sql-profile` · [conventions.md](modes/conventions.md) ⑤b |
| 问卷 / 全部推荐 | [questions.md](modes/questions.md) · [recommended.md](modes/recommended.md) |
| 双轨研判 AI（默认跳过） | [ai-track.md](modes/ai-track.md) |
| 定版采集细节 | [freeze.md](modes/freeze.md) |
| 仓内快照对账 | `release.mjs sync-scripts -- --check\|--apply` |
| notes/ 迁移 | `release.mjs migrate-notes -- --apply` |
| 幂等 / 骨架 | [idempotency.md](modes/idempotency.md) · [bootstrap.md](modes/bootstrap.md) |
| 发版单 HTML 渲染（补渲 / 只读渲染约定） | `release.mjs note-html` · [conventions.md](modes/conventions.md) ⑩ |
| 术语 / ADR | [GLOSSARY.md](GLOSSARY.md) · [docs/adr/](docs/adr/) |
| resume 指引（已并入 prepare） | [resume.md](modes/resume.md) |
| modes 索引 | [modes/README.md](modes/README.md) · `node scripts/release.mjs modes` |

## 写盘纪律（一行）

push-gate 通过后才 freeze / 问卷 / 定版 WritePlan；写盘当且仅当过确认词（或同会话预授权）；audit 只报告不写盘；seal 前先 `seal-check`；预览仅会话。

## Leading keywords

`定版` · `发版单` · `发版日期` · `release-V{yyMMdd}` · `push-gate` · `WritePlan` · `seal` · `cancel` · `全部推荐` · `首次发版` · `首次使用` · `SQL目录` · `SQL格式` · `截断5` · `mergeSources` · `目录包` · `prod` · `SQL序` · `artifacts.json` · `note-merge` · `note-html` · `seal-check` · `逾期未归档` · `sync-scripts` · `migrate-notes` · `allow-drift`。
