# 条件问题树

原则：每批最多 5 题；能从指纹推断的先展示【推荐】再确认。  
提问前 Read [glossary.md](glossary.md) 相关行，并用中文简述阶梯/模式。  
detect 后先展示 [RecommendedProfile](recommended-profile.md)；引导「不确定请回复：**全部推荐**」。

## 机器可读 SSOT（0.2.5+）

- 完整题库：[questions.yaml](questions.yaml)
- 下一批驱动：

```bash
node scripts/questions-next.mjs --answers '{"type":"NEW_CODE_NO_HARNESS","mode":"pipeline","ladder":"L4","large_repo":true}'
# 答完后把 answered / answered_batches 写回 answers 再跑，直到 done=true
```

Agent **优先**跑脚本展示本批题目；脚本失败时再读本文件摘要。

## 「全部推荐」

协议 SSOT：[recommended-profile.md](recommended-profile.md)（本文件不复述）。

## 批次速览

| 批次 | 何时 | 要点 |
|---|---|---|
| `batch-0-global` | 总是 | `Q_TARGET_ROOT` / `Q_MODE` / `Q_LADDER` / `Q_CONTRACT` |
| `batch-1-new` (+b) | NEW_EMPTY / NEW_CODE_NO_HARNESS | 名/描述/分册/栈/globs → rule14/seed/glob/AI 工具 |
| `batch-1-partial` | PARTIAL / resume | 缺口表、AGENTS/rules/docs merge |
| `batch-1-mature` | MATURE | 【推荐】先 audit |
| `batch-1-foreign` | FOREIGN | 共存策略 → [foreign-playbook.md](foreign-playbook.md) |
| `batch-2-contracts` | PARTIAL 按需 | 拆 API、启用 db、SQL glob、mcp 警告 |
| `batch-3-l3l4` | L3/L4 | `Q_CODE_PREFIXES` / `Q_HOOK` / `Q_MCP` |
| `batch-seed-truths` | seed-truths | `Q_SEED_DOMAINS` / `Q_SEED_NAMES` |
| `batch-fill` | fill-* / pipeline | `Q_FILL_ENGINE`(agents【推荐】) / 域/模块/MCP 先行/报告；**完整档**唯一 |

`Q_AI_TOOL` 选项与写入 params 见 [ai-tools.md](ai-tools.md)。  
`Q_FILL_ENGINE`：`agents`【大仓推荐】/ `hybrid`（可选薄草稿）/ `auto`（legacy）（见 [fill-truths-agents.md](fill-truths-agents.md) · [fill-plan.md](fill-plan.md)）。  
大仓 / pipeline 默认 `Q_LADDER=L4`（见 [recommended-profile.md](recommended-profile.md)）。  
`Q_MODULES` → manifest：`solo`→`agents-root-solo`；`few`/`all`→`agents-root`+`agents-module`。  
`Q_RULE14=true` → params `include_optional: ["rule-14"]`（**数组**，勿写布尔进 render params）。  
resume 写盘：`on_exists=skip`（见 [resume.md](resume.md)）。  
fill 确认协议见 [fill.md](fill.md)。

`MATURE` + 未指定 mode → 【推荐】`audit`。  
`PARTIAL` / 有 meta 未满阶 → 【推荐】`resume`。
大仓首次 → 【推荐】`pipeline`（L4 + agents）。
