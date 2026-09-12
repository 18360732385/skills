# archive

历史提案与沉积文档，**不在**技能热路径。Agent 默认不 Read。

## 发包政策（0.6.0 G5）

**安装 ≠ 全仓。** 默认 skill 安装（`npx skills add … --skill harness-eng` / 拷 `harness-eng/` 到宿主 skills）**不需要**、也**不应依赖** `archive/selfcheck/legacy/**` 体积。

| 热包（可随安装走） | 不随默认安装 |
|---|---|
| `scripts/selfcheck.mjs`（现行） | `archive/selfcheck/legacy/*.mjs`（已移出热树） |
| `archive/selfcheck/` 短 INDEX + 近期 `0.4.0` / `0.5.0` / `0.5.1` | 0.2.x–0.3.x 逐版脚本（见下） |
| `archive/fill-truths-auto/`（仅脚本、对话不推荐） | — |

排除清单见热树 [`.skillignore`](../.skillignore)（现行 skills CLI 未必识别；权威是热树本身已不含 legacy 体积）。  
开发全仓仍可 Read [`_history/harness-eng-selfcheck-legacy/`](../../_history/harness-eng-selfcheck-legacy/INDEX.md) 或 git 历史。

## 目录

- `OPTIMIZATION-PROPOSAL-0.2.x.md` — **非路线图**；0.2.x 运行时优化提案（多数已落地）。以根 [CHANGELOG.md](../CHANGELOG.md) 为准，勿按此文件排期。
- `VERIFY-history-through-0.2.27.md` — 0.2.x 增量验收表沉积（当前验收见根 `VERIFY.md`）
- [CHANGELOG-through-0.4.md](CHANGELOG-through-0.4.md) — 0.4.0 及更早 CHANGELOG 正文
- [fill-truths-auto/](fill-truths-auto/INDEX.md) — legacy 自动填充（仅脚本、对话不推荐）
- `selfcheck/` — 近期归档（0.4.0 / 0.5.0 / 0.5.1）；更早 0.2.x–0.3.x 见 [selfcheck/legacy/INDEX.md](selfcheck/legacy/INDEX.md)（仅指针）
- **热路径**：`scripts/selfcheck.mjs`（稳定名；断言当前 manifest 版本）
