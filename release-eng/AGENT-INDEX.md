# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读入口：[README.md](README.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。

**拓扑（0.3.20-dev）**：`modes/` 模式规格（prepare / resume / audit / seal 等）· `scripts/release.mjs` 统一薄入口 · `scripts/` 仪式脚本 · `fixtures/docs/releases/` 骨架种子。  
**非 harness land**（`harness_land: false`）——无自动 land 流水线；靠用户点名仪式。

## 必读（写盘 / 定版前）≤8

| 何时 | Read / 跑 |
|---|---|
| 入口 / 模式分流 / 硬闸 | [SKILL.md](SKILL.md) |
| 共享前缀 / 发版日期 / 中止出口 | [gates-common.md](modes/gates-common.md) |
| fetch / push-gate | [git-gates.md](modes/git-gates.md) · `scripts/release-push-gate.mjs` |
| 定版采集 / 截断5 / mergeSources / 键级diff | [freeze.md](modes/freeze.md) · `scripts/release-freeze.mjs` · `scripts/release-format.mjs` |
| 确认闸 / draft-md / note-merge | [write-plan.md](modes/write-plan.md) · `scripts/release-note-merge.mjs` |
| 已上线归档 / seal-check | [seal.md](modes/seal.md) · `scripts/release-seal-check.mjs` |
| 问卷 / prod / 说明 | [questions.md](modes/questions.md) |
| 版本 / 验收 | [CHANGELOG.md](CHANGELOG.md) · [VERIFY.md](VERIFY.md) · `node scripts/selfcheck.mjs` |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 新建发版单 | [prepare.md](modes/prepare.md) |
| 同版本身份续跑 | [resume.md](modes/resume.md) |
| 只读检查 / prior·freeze 体检 | [audit.md](modes/audit.md) · freeze `--format audit-json` |
| 统一薄 CLI | `node scripts/release.mjs --help` · `modes`（转发 push-gate/freeze/seal-check） |
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 双轨研判 AI | [ai-track.md](modes/ai-track.md) · `scripts/release-ai-track.mjs` |
| 骨架 bootstrap | [bootstrap.md](modes/bootstrap.md) · `fixtures/docs/releases/` |
| 全部推荐 | [recommended.md](modes/recommended.md) |
| 幂等 | [idempotency.md](modes/idempotency.md) |
| modes 索引 | [modes/README.md](modes/README.md) · `node scripts/release.mjs modes` |
| enrich / artifacts / 逾期 | `scripts/release-freeze-enrich.mjs` |
| 发版单模板 / 索引 | `fixtures/docs/releases/templates/` · `fixtures/docs/releases/releases.md` |
| 清单权威号 | [`_meta/manifest.yaml`](_meta/manifest.yaml) |

## 写盘纪律（一行）

push-gate 通过后才 freeze / 问卷 / 定版 WritePlan；写盘当且仅当过确认词（或同会话预授权）；audit 只报告不写盘；seal 前先 `seal-check`。
