# session-live（会话自证）

> 中文名：**会话自证**（检查表 **1.2**）。当前宿主 Agent 在本会话内核验 MCP / hooks / rules / githooks 是否**可观测生效**；**人工闸**（面板/trust）结构化原因码后立刻探针落盘；多宿主用 playbook + matrix。  
> 检查表 SSOT：[host/session-live-checks.yaml](../host/session-live-checks.yaml) · 探针库：`scripts/lib/live-probes.mjs` · 落盘脚本：`scripts/session-live.mjs`  
> 分册空壳 / Never do↔Pn：audit 旁路 `scripts/content-shell-scan.mjs`（非本模式硬闸）。

## Done

1. 已确认（或启发式推荐）**当前会话宿主** `live_host`；其它 `ai_tools` 标 `skipped_wrong_host`
2. 已核对本宿主 **human_gates**（未开 → `unproven` + reason_code，**不假装 fail**）
3. 已按检查表跑完本宿主探针；每项状态 ∈ `pass|fail|unproven|skipped_*`
4. 已写入 `docs/harness-eng/session-live-latest.yaml` + `session-live-stubs/report-<host>.yaml`；meta 含 `session_live` 摘要（含 `githooks_ok` / `human_gates_ok`）
5. 已打印：行为 PASS / MCP 闸路径 A / 人工闸缺口 / 未测宿主；多宿主可 `--emit-playbook` / `--merge-matrix`

## 触发

- 用户点名 **会话自证** / `session-live` / live-verify / playbook / matrix
- `audit` / `upgrade` Done 前【推荐】附带（L3+ 且已选 `ai_tools`）
- fill-mcp 烟测：MCP 强证复用同一探针语义（见 [fill-mcp.md](../fill/fill-mcp.md)）

## 与分层关系

| 层 | 管什么 | 本模式 |
|---|---|---|
| detect `S_RULES/S_HOOKS/S_MCP` | 磁盘存在 | 不重复当「生效」 |
| ladder L3–L5 | 齐套 / sync 漂移 | 不替代 |
| **session-live** | 本会话可观测 + 人工闸原因码 | **本页** |
| 人验手册 | Settings 面板 / 热加载（人开开关） | 开后立刻本模式自证 |
| 填充 MCP 闸 | 实据可扫库 | MCP `fail` → 路径 A 未过；`human_gates_ok` **不**挡填充 |

## 证据档（固定）

| 面 | 档 | PASS 条件 |
|---|---|---|
| **Human gates** | **gate** | 用户确认面板/trust 已开 → `ok: true`；未开/未知 → `unproven` + reason_code（**不用 fail**） |
| MCP | **强** | 工具列表见到应有 server **且** 主环境只读调用成功 |
| Hooks | **强** | `git commit --dry-run` 见注入；面板未开 → unproven。L3 软提醒不拦截由此覆盖 |
| Rules | **弱** / 作用域 **中** | 磁盘 + 复述；作用域双探；不单独授权行为 PASS |
| Githooks | **中** | hooksPath + pre-commit（脚本可自探） |
| Codex skills / Starlark | **中** | skills 可见；Starlark **仅观测** |

**reason_code**：`panel_mcp_off` · `hooks_panel_off` · `hooks_not_applied` · `mcp_approval_pending` · `workspace_untrusted` · `hooks_untrusted`

**禁止**：用 A 宿主配置证明 B 宿主；自动点击 IDE GUI；为 Starlark 真跑破坏性命令。

## 步骤

```
- [ ] 1 定根；读 meta.ai_tools / Fingerprint
- [ ] 2 宿主自认：启发式 →【推荐】；不确定则问 Q_LIVE_HOST
- [ ] 3 Read 检查表本宿主段；--checklist
- [ ] 3b 人工闸：逐项问用户是否已开（未开 → unproven+reason_code + 手册指针；已开 → ok=true 再跑强证）
- [ ] 4–6 同 1.1：MCP / hooks / githooks / rules / Codex skills·Starlark
- [ ] 7 --write --from-json（同时写 stubs/report-<host>.yaml）
- [ ] 8 汇报；其它宿主 → --emit-playbook；齐测后 --merge-matrix
```

### 观测 JSON 要点（1.2）

```json
{
  "host": "trae",
  "ai_tools": ["cursor", "trae"],
  "human_gates": {
    "mcp_settings_on": true,
    "hooks_settings_on": true
  },
  "mcp": {
    "tools_seen": ["mysql-test"],
    "readonly_call": { "ok": true, "server": "mysql-test" }
  },
  "hooks": { "triggered": true, "injection_seen": true },
  "rules": {
    "self_report": { "ok": true, "quoted": "Never do … → P1" },
    "scope": { "matched_injected": true, "unmatched_weak": true }
  },
  "githooks": { "skip_auto": false }
}
```

`human_gates.<id>: false` → 该项 `unproven` + 检查表 `reason_code`。缺省字段 → `unproven`。

## 多宿主 playbook / matrix

```bash
node scripts/session-live.mjs --root <TARGET> --emit-playbook [--host <current>]
# → docs/harness-eng/session-live-playbook.md
# → docs/harness-eng/session-live-stubs/obs-<host>.json

# 各宿主会话填 obs、跑探针后：
node scripts/session-live.mjs --root <TARGET> --write --from-json obs.json
node scripts/session-live.mjs --root <TARGET> --merge-matrix
# → docs/harness-eng/session-live-matrix.yaml
```

## 宿主自认（Q_LIVE_HOST）

同 1.1（单选；不确定用推荐；禁止跨通道误证）。

## 落盘

| 路径 | 内容 |
|---|---|
| `docs/harness-eng/session-live-latest.yaml` | 当前宿主完整证据 |
| `docs/harness-eng/session-live-stubs/report-<host>.yaml` | 按宿主副本（供 merge） |
| `docs/harness-eng/session-live-playbook.md` | 多宿主粘贴剧本 |
| `docs/harness-eng/session-live-matrix.yaml` | 多宿主合并矩阵 |
| `harness-meta.yaml` → `session_live` | 瘦摘要含 `human_gates_ok` |

## 宣称与闸门

| 字段 | 含义 |
|---|---|
| `behavior_pass_claim` | 仅 MCP strong + `hooks_trigger` pass（human_gates / rules / githooks **不**否决也不单独授权） |
| `mcp_gate_path_a` | MCP 两项 strong pass |
| `githooks_ok` | 两项 githooks pass |
| `human_gates_ok` | 本宿主全部 human_gates pass |

- `human_gates_ok===false`：**不**挡填充；**不得**宣称手册「面板 PASS」已机证
- 面板未开 → `unproven` + reason_code，指向 P0 手册

## audit / upgrade

```text
## 会话自证【推荐】1.2
未跑 → session-live（含 3b 人工闸）+ 多宿主 --emit-playbook
已跑 → behavior_pass_claim=… human_gates_ok=… githooks_ok=…
矩阵 → --merge-matrix；内容扫描 → content-shell-scan.mjs
```

## 非目标

- 不自动点击 IDE Settings / trust
- 不跨 IDE 远程触发
- 不用真实 `git commit`（非 dry-run）
- **禁止** Starlark 探针执行 `git push --force` / `git reset --hard`
