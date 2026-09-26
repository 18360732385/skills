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

### 模板漂移（脚注，audit / freshness 必提一行）
- **技能 API 模板**（`templates/docs/api/…`）vs **仓内厚模板**（`docs/api/templates` 或已填 modules）：列数/贴 Apifox 程度可能不同  
- upgrade `on_exists=skip` **以仓为准**；勿误以为「技能=仓」。freshness 亦打印同款提醒

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
- [ ] 若 `ai_tools` 含 `codex`：已标明 **高**（纪律 B；`sync.mjs` 发出原生 Codex 资产；**不做** `.mdc` 镜像；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)）

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
| **分册 AGENTS 空壳**（`agents_variant=modules` 时分册仍大面积 `TODO(harness-eng)` 且无「改动路径速查」实表） | L0 **内容**缺口（不拦阶梯）；移交精填分册 |
| **Never do 无 Pn 回链**（红线行存在却无 `→ P\d+`） | L2 内容缺口；Never do 须 `一句话 → Pn` |
| **路径速查空壳**（仍仅示例 / 大面积「待补」，且活跃 Pn ≥3） | L2 运营缺口；从 Never do / 改动路径补速查 |
| **meta.ai_tools 与入口/镜像 rules 不一致**（入口缺失必记；`1x-contract-sync` 仅对 Codex / L0–L2 未镜像宿主必查。L3+/L5 全量镜像宿主看本宿主 `*-sync*`，缺 1x 不记此反模式） | |
| `pitfalls.md` 稳定 ID 重号（`Pn` 重复、语义不同） | |
| **pitfalls 未过 lint**（有 `lint-pitfalls.mjs` 却未跑 / 7 列或速查不一致） | |
| **L5 仓生成物漂移**（`sync.mjs --check` 有差异仍提交） | |
| **L5 仓手改生成物**（带 GENERATED 标记文件与 SSOT 不一致） | |
| **L5 与直渲混用**（`agent_config: true` 仍由 render 直渲 `.cursor/hooks.json` 等 sync 托管目标） | |
| **把 Codex `.mdc` 镜像当成已支持**（Codex **高**但不做 `.mdc` 镜像；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)） | |
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
4. 非 cursor 工具：契约 sync 镜像文件存在（见 [ai-tools.md](../host/ai-tools.md)）

## 会话自证（可选 · 推荐 L3+）

磁盘齐套 ≠ 本会话生效。可跑 [session-live](session-live.md)：

```text
## 会话自证
未跑 → 建议：在当前宿主会话执行 session-live
已跑 → host=… behavior_pass_claim=… mcp_gate_path_a=…（见 docs/harness-eng/session-live-latest.yaml）
```

`unproven` / 面板项仍指向各宿主 P0 手册；hooks 失败不挡填充，但不得写「行为 PASS」。

## Trae 路径可见性（与 Cursor 同级）

报告 / 缺口表对 Trae 至少列出（若 `ai_tools` 含 `trae` 或探测到 `.trae/`）：

| 路径 | 含义 |
|---|---|
| `.trae/rules/` | rules 镜像（含 FM） |
| `.trae/hooks.json` | Claude 族 hooks（matcher 含 `RunCommand`） |
| `.trae/mcp.json` | MCP；启用靠 IDE Settings 开关 |

缺口用语区分：

- **未生成**：磁盘无该文件 / 目录（land/sync 未写出）
- **未实证**：文件在，但人验/面板未确认（勿把「toggled off」写成缺失）

