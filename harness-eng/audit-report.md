# audit 报告模板

## Done

1. 已按本模板输出完整 audit 报告（已具备 / 缺口 / 反模式 / 建议下一阶）
2. 本模式未向目标仓写盘（用户明确要求补齐则转 resume/pipeline，不在本 Done 内）

audit 模式按下列结构输出（只读，默认不写盘）。优先读取 `docs/harness-eng/harness-meta.yaml`，无则回退 `.cursor/harness-meta.yaml`（若 `S_HARNESS_META`）。

```text
# harness-eng audit — {{REPO_NAME 或根目录名}}
目标根: …
类型: MATURE|PARTIAL|FOREIGN|…
meta: ladder=… domains=… agents_variant=… glob_profile=… skill_version=…（无则写「无 meta」）
```

## 已具备

按 [ladder.md](ladder.md) 勾选：

### L0
- [ ] 根 AGENTS.md
- [ ] karpathy alwaysApply
- [ ] 00 alwaysApply
- [ ] harness-meta.yaml（推荐）
- [ ] （可选，行为包）rule 21（`S_SLF4J` 仓推荐；非契约域）
- [ ] （可选，前端协作包）rule 17（`S_FRONTEND` 仓推荐；非契约域）

### L1（按 meta.domains ∪ 磁盘探测；注册表 `templates/_meta/domains.yaml`）
- [ ] docs/func + rule 11（若域含 func）
- [ ] docs/api + rule 12（若域含 api）
- [ ] docs/db + rule 13（若域含 db）
- [ ] docs/redis + rule 16（若域含 redis）
- [ ] docs/jobs + rule 20（若域含 jobs / `S_JOBS`）

### L1 超集 / 过程包（脚注，不计入 L1 契约齐套）
- [ ] docs/releases（过程域；skill `release-eng`）
- [ ] 前端协作包（如 rule 17 / `*-web` 分册）

### L2
- [ ] docs/agent-kb 四文件（pitfalls 含「域」列）
- [ ] rule 19

> 扩展文档（如 `*-workflow.md` playbook）允许存在，不记缺口。

### L3
- [ ] docs/superpowers README/ARCHIVE
- [ ] rule 18
- [ ] hooks.json + commit-gate（failClosed 非强拦）

### L4
- [ ] mcp.json.example + 说明
- [ ] 跟踪策略：`example_only`（无真密入库）或 meta 声明 `vendored_shared`

### L5（meta `agent_config: true`）
- [ ] `docs/agent-config/` + `scripts/agent-config/sync.mjs`
- [ ] `node scripts/agent-config/sync.mjs --check` 无漂移
- [ ] 生成物带 GENERATED 标记；无人手改生成物

## 缺口

列出缺失路径与建议动作（land 补齐 / upgrade 升一阶）。

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 / 整份 pitfalls alwaysApply | |
| plan / archive 当契约 SSOT | |
| `.cursor/mcp.json` 含明文密且被跟踪 | 按 meta.`mcp_tracking`：`example_only`→反模式；`vendored_shared`→注明约定例外 |
| `S_SECRETS_LEAK`（README/yml） | |
| 根 AGENTS 与分册严重漂移且无冲突裁决 | |
| **meta.ai_tools 与入口/镜像 rules 不一致**（例：workbuddy 无 `CODEBUDDY.md` 或无 `.codebuddy/rules/1x-contract-sync.md`） | |
| `pitfalls.md` 稳定 ID 重号（`Pn` 重复、语义不同） | |
| **pitfalls 未过 lint**（有 `lint-pitfalls.mjs` 却未跑 / 7 列或速查不一致） | |
| **L5 仓生成物漂移**（`sync.mjs --check` 有差异仍提交） | |
| **L5 仓手改生成物**（带 GENERATED 标记文件与 SSOT 不一致） | |
| **L5 与直渲混用**（`agent_config: true` 仍由 render 直渲 `.cursor/hooks.json` 等 sync 托管目标） | |
| **把旧 `ready.ok` / 形态分当真「可 AI coding」**（须看 `ai_coding_ready`） | |
| **把形态覆盖 / inventory 覆盖当真「深真全」**（须看 `gold_ratio` + [truth-quality.md](truth-quality.md)） | |
| **默认 auto / 启发式脚本写 SSOT**（0.2.17+ 禁止；0.2.18+ merge 须过 acceptance；仅 legacy `--work-only` / `--force-write` 移交） | |

## 建议下一阶

- 当前最高**完整**阶：Lx
- 建议：大仓 → `upgrade`/`resume` 到 **L4** 或 `pipeline`；或 `seed-truths` 补空壳真相
- 无 meta 的 MATURE：可 **write-meta-only**（仅写 `docs/harness-eng/harness-meta.yaml` 快照：ladder / domains / ai_tools / mcp_tracking；不渲染模板）
- 契约深度不足：`fill-plan --gold` → `fill-truths-agents` → acceptance → merge；开干看 **ai_coding_ready** + **gold_ratio**；heuristic 留 `.fill-work`

## L3/L4 烟测（若已宣称具备）

1. hooks：`failClosed` 不为 true 强拦（软提醒）；按 `ai_tools` 检查对应宿主 hooks
2. MCP：仅 example 或真密未入库
3. `.gitignore` 是否忽略 `.cursor/mcp.json`（建议有）
4. 非 cursor 工具：契约 sync 镜像文件存在（见 [ai-tools.md](ai-tools.md)）
