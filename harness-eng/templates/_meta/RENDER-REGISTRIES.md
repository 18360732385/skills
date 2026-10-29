# 渲染并列注册表（O1）

`templates/_meta/manifest.yaml` 不是唯一落地清单。`scripts/render.mjs` 还有若干**代码内注册线**与 manifest `files[]` 并列。改渲染行为时先查本页，再改对应常量；勿假设「只改 manifest 即可」。

| # | 注册线 | 位置（约） | 作用 |
|---|---|---|---|
| 1 | `manifest.files[]` + `when` / `optional` / packs | `templates/_meta/manifest.yaml` · `domain-packs.yaml` | 主清单与域包展开 |
| 2 | `AI_TOOL_ADAPTERS` | `scripts/render.mjs` | 各宿主 SSOT / 入口文件（cursor/claude/codex/qoder/trae/workbuddy） |
| 3 | `CONTRACT_SYNC_MIRRORS` + `shouldEmitContractSync` | `scripts/render.mjs` | L0–L2 / 非全量镜像宿主的 `1x-contract-sync` 薄指针 |
| 4 | `SYNC_MANAGED_RULE_PREFIXES` + L5 `adaptTarget` | `scripts/render.mjs` | L5 拒直渲生成宿主 rules；改投 `docs/agent-config/` |
| 5 | `include_optional` 可选包（含 `rule-17` / `rule-17-full` 互斥） | manifest `optional` + `assertRule17Mutex` | 可选模板；薄/厚 17 勿同装 |

Agent 热路径：[AGENT-INDEX.md](../../AGENT-INDEX.md)。发版后 selfcheck 断言本文件存在。
