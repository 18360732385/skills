# session-live（会话自证）

> 中文名：**会话自证**。当前宿主 Agent 在本会话内核验 MCP / hooks / rules 是否**可观测生效**；与 P0 人验手册**并行补强**，不取代面板开关类人验。  
> 检查表 SSOT：[host/session-live-checks.yaml](../host/session-live-checks.yaml) · 探针库：`scripts/lib/live-probes.mjs` · 落盘脚本：`scripts/session-live.mjs`

## Done

1. 已确认（或启发式推荐）**当前会话宿主** `live_host`；其它 `ai_tools` 标 `skipped_wrong_host`
2. 已按检查表跑完本宿主探针；每项状态 ∈ `pass|fail|unproven|skipped_*`
3. 已写入 `docs/harness-eng/session-live-latest.yaml`；`harness-meta.yaml` 含 `session_live` 摘要
4. 已打印：可否宣称「行为 PASS」；MCP 强证是否满足**填充 MCP 闸**路径 A

## 触发

- 用户点名 **会话自证** / `session-live` / live-verify
- `audit` / `upgrade` Done 前可选附带（【推荐】L3+ 且已选 `ai_tools`）
- fill-mcp 烟测：MCP 强证复用同一探针语义（见 [fill-mcp.md](../fill/fill-mcp.md)）

## 与分层关系

| 层 | 管什么 | 本模式 |
|---|---|---|
| detect `S_RULES/S_HOOKS/S_MCP` | 磁盘存在 | 不重复当「生效」 |
| ladder L3–L5 | 齐套 / sync 漂移 | 不替代 |
| **session-live** | 本会话可观测 | **本页** |
| 人验手册 | Settings 面板 / 热加载 | `unproven` 时退回 |
| 填充 MCP 闸 | 实据可扫库 | MCP `fail` → 路径 A 未过（仍可用 calibrate-live） |

## 证据档（固定）

| 面 | 档 | PASS 条件 |
|---|---|---|
| MCP | **强** | 工具列表见到应有 server **且** 主环境只读调用成功（或观测标明等价 calibrate-live 已通） |
| Hooks | **强** | 仅非破坏触发（默认 `git commit --dry-run`）；见到注入/软提醒 → `pass`；触发了无注入 → `fail`；未触发/面板未开 → `unproven` |
| Rules | **弱** | 磁盘非空 + Agent 复述一条 Never do；**不得**单独支撑「行为 PASS」宣称 |

**禁止**：用 A 宿主配置证明 B 宿主（例：`.cursor/hooks.json` ≠ Trae 证据）。

## 步骤

```
- [ ] 1 定根；读 meta.ai_tools / Fingerprint
- [ ] 2 宿主自认：启发式（detect_hints + 本会话特征）→【推荐】；不确定则问 Q_LIVE_HOST（单选）
- [ ] 3 Read host/session-live-checks.yaml 本宿主段；打印探针清单
- [ ] 4 MCP：列本会话可见 server ∩ 期望；对 fill_mcp_profile（默认 test）只读调用
- [ ] 5 Hooks：按本宿主 event/matcher；跑 safe_command；记录是否见到注入
- [ ] 6 Rules：磁盘交叉 + 复述 Never do 一条（弱）
- [ ] 7 组装 observations JSON → node scripts/session-live.mjs --root <TARGET> --write --from-json <file>
- [ ] 8 汇报：行为宣称 / 填充闸 / 未测宿主 / 需人验项
```

## 宿主自认（Q_LIVE_HOST）

```text
Q_LIVE_HOST — 当前会话是哪个 AI 宿主？（单选）
  A) Cursor【推荐：已探测 .cursor 且本会话像 Cursor】
  B) Claude Code
  C) Codex
  D) Qoder
  E) Trae
  F) WorkBuddy / CodeBuddy
不确定请回复：用推荐
```

无把握时**不要猜**。自定义入口-only → 整面 `skipped_no_live_surface`。

## 落盘

| 路径 | 内容 |
|---|---|
| `docs/harness-eng/session-live-latest.yaml` | 完整证据：host、checks[]、counts、claims |
| `docs/harness-eng/harness-meta.yaml` → `session_live` | 瘦摘要：`at` / `host` / `pass` / `fail` / `unproven` / `skipped` / `behavior_pass_claim` / `mcp_gate_path_a` |

## 宣称与闸门

| 结论字段 | 含义 |
|---|---|
| `behavior_pass_claim: true` | MCP 与 hooks 均无 `fail`，且 hooks 为 `pass`（非仅 unproven）；rules 弱项不否决 |
| `mcp_gate_path_a: true` | MCP 两项强证均为 `pass`（可满足填充闸路径 A；路径 B 仍见 fill-calibrate-live） |

- hooks `fail` / `unproven`：**不**挡填充；**不得**写「行为 PASS」
- MCP 强证 `fail`：填充路径 A 未过 → 改 calibrate-live 或修 MCP 后重跑
- 面板类（Trae Settings、CodeBuddy `/hooks`）：机证不到 → `unproven`，指向对应 P0 手册

## audit / upgrade 可选段

在 audit 报告「L3/L4 烟测」后可加：

```text
## 会话自证（可选）
未跑 → 建议：session-live（当前宿主）
已跑 → 附 session_live 摘要；behavior_pass_claim=…
```

## 非目标

- 不自动改 hooks/MCP 配置（装配仍 fill-mcp / land）
- 不跨 IDE 远程触发其它宿主
- 不用真实 `git commit`（非 dry-run）做探针
