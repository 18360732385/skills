# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读入口：[README.md](README.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。

**拓扑（0.3.18-dev）**：根目录模式 md（prepare / resume / audit / seal）· `scripts/` 仪式 CLI · `fixtures/docs/releases/` 骨架种子。  
**非 harness land**（`harness_land: false`）——无自动 land 流水线；靠用户点名仪式。

## 必读（写盘 / 定版前）≤8

| 何时 | Read / 跑 |
|---|---|
| 入口 / 模式分流 / 硬闸 | [SKILL.md](SKILL.md) |
| 共享前缀 / 发版日期 / 中止出口 | [gates-common.md](gates-common.md) |
| fetch / push-gate | [git-gates.md](git-gates.md) · `scripts/release-push-gate.mjs` |
| 定版采集 / 截断5 / mergeSources / 键级diff | [freeze.md](freeze.md) · `scripts/release-freeze.mjs` · `scripts/release-format.mjs` |
| 确认闸 / draft-md / note-merge | [write-plan.md](write-plan.md) · `scripts/release-note-merge.mjs` |
| 已上线归档 / seal-check | [seal.md](seal.md) · `scripts/release-seal-check.mjs` |
| 问卷 / prod / 说明 | [questions.md](questions.md) |
| 版本 / 验收 | [CHANGELOG.md](CHANGELOG.md) · [VERIFY.md](VERIFY.md) · `node scripts/selfcheck.mjs` |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 新建发版单 | [prepare.md](prepare.md) |
| 同版本身份续跑 | [resume.md](resume.md) |
| 只读检查 / prior·freeze 体检 | [audit.md](audit.md) · freeze `--format audit-json` |
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 双轨研判 AI | [ai-track.md](ai-track.md) · `scripts/release-ai-track.mjs` |
| 骨架 bootstrap | [bootstrap.md](bootstrap.md) · `fixtures/docs/releases/` |
| 全部推荐 | [recommended.md](recommended.md) |
| 幂等 | [idempotency.md](idempotency.md) |
| enrich / artifacts / 逾期 | `scripts/release-freeze-enrich.mjs` |
| 发版单模板 / 索引 | `fixtures/docs/releases/templates/` · `fixtures/docs/releases/releases.md` |
| 清单权威号 | [`_meta/manifest.yaml`](_meta/manifest.yaml) |

## 写盘纪律（一行）

push-gate 通过后才 freeze / 问卷 / 定版 WritePlan；写盘当且仅当过确认词（或同会话预授权）；audit 只报告不写盘；seal 前先 `seal-check`。
