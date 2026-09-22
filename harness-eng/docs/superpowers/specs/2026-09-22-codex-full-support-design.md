# Design: Codex 完整支持（对齐程度 → 高）

- **Status:** approved + implemented (0.6.9)
- **Date:** 2026-09-22
- **Skill:** harness-eng（目标版本建议 **0.6.9**）
- **Decisions locked:** 方案 **A**（分轨 SSOT）；推荐纪律 **B**（探测 `.codex/` 或显式勾选才进「全部推荐」）

交叉：现有 [host/CODEX-PARITY.md](../../../host/CODEX-PARITY.md) · [host/ai-tools.md](../../../host/ai-tools.md) · [templates/ai-tools/adapters/codex.md](../../../templates/ai-tools/adapters/codex.md) · [host/sync-hosts.md](../../../host/sync-hosts.md)。

---

## 1. 问题与目标

### 1.1 现状

Codex 在 0.6.8-dev 为 **部分对齐（P2+P0）·不默认**：薄指针、`config.toml.example`、仅 `PreToolUse` + `^Bash$` commit gate、skills 轻指针。selfcheck 明确钉死「不全量 / 不做 `.mdc` 镜像 / out of scope」。

### 1.2 目标

将 Codex 升为与 Cursor / Claude 族同级的矩阵 **「高」**，但是：

- **原生 Codex 协议**（AGENTS + Starlark 命令策略 + TOML MCP + Codex hooks），**不假装** Cursor 协议；
- **不做** `.cursor/rules/*.mdc` → Codex 全量镜像；
- 推荐纪律 **B**：仅探测到 `.codex/` 或用户显式勾选才进入「全部推荐」；无探测不默认塞入。

### 1.3 非目标

- Windsurf / Copilot 等新宿主
- 改 Trae / CodeBuddy 已定矩阵
- 把根 `.mcp.json` 当作 Codex MCP SSOT
- 默认启用写库 / DDL 类 MCP
- 未经官方实测的 hooks 事件全家桶（SessionStart 等留 P1）

---

## 2. 方案选择（已拍板）

| 方案 | 摘要 | 结论 |
|---|---|---|
| **A. 分轨 SSOT** | 共享 `mcp/` / `hooks/` / `skills/`；仅 Starlark 走 `docs/agent-config/codex/rules/` | **采用** |
| B. 整树 `docs/agent-config/codex/` | 标杆仓字面结构，易双份漂移 | 拒绝 |
| C. 最小增量 | 达不到「完整支持」 | 拒绝 |

推荐纪律：**B**（见上）。

---

## 3. 「高」的定义（验收维度）

| 维度 | 达标 | 明确不做 |
|---|---|---|
| Instructions | 根/目录级 `AGENTS.md`；`.codex/harness.md` 薄指针 | `.mdc` 全量镜像 |
| Command policy | `docs/agent-config/codex/rules/*.rules` → `.codex/rules/` | 自然语言 Never do 写入 `.rules` |
| MCP | 共享 `mcp/servers*.json` → `.codex/config.toml(.example)` | 假设根 `.mcp.json` 对 Codex 生效；toml 内明文密钥 |
| Hooks | Codex `hooks.json` + `codex-adapter.js` + 共享脚本；至少 `PreToolUse(^Bash$)` + `Stop` | Cursor-only 事件名 |
| Skills | L5：`docs/agent-config/skills/` → `.agents/skills/` | skills 放进 `.codex/` |
| 推荐 | 纪律 B | 无探测默认塞 Codex |

管线不变：`docs/agent-config/` → `sync.mjs` / land `render` → GENERATED 生成物。

**`contract-sync.md`：** L3+/L5 Codex 管线就绪后 **omit** 冗余 `.codex/contract-sync.md`（对齐 Claude 族 omit `1x`）；L0–L2 仍写薄指针。

---

## 4. SSOT 与生成树

```text
docs/agent-config/
  mcp/
    servers.example.json      # 无密
    servers.json              # 可选；含密 → vendored_shared
  hooks/                      # 共享脚本源（L5）
  skills/                     # L5 → 各宿主 + .agents/skills（codex）
  codex/
    rules/*.rules             # 仅 Starlark 命令策略
    hooks.json                # 可选 SSOT；缺省由 sync 组装默认事件表
    mcp-policy.yaml           # 可选；server 默认 enabled 覆盖

.codex/                       # sync/land 生成（可提交 example + rules + hooks）
  config.toml.example
  config.toml                 # 可选本机；建议 gitignore；含密不入库
  hooks.json
  hooks/codex-adapter.js
  hooks/*.js
  rules/*.rules
  harness.md                  # 薄指针（可保留）

.agents/skills/               # L5 托管分发（Codex 官方路径）
AGENTS.md                     # 行为 SSOT（可含目录级）
```

协议族：新增并列 **Codex 族**（不再标「部分对齐」）。

---

## 5. MCP 设计

### 5.1 映射

`docs/agent-config/mcp/servers*.json` → TOML `[mcp_servers.<name>]`：

- stdio：`command` / `args`
- http：`url` + `bearer_token_env_var`（或等价官方字段）
- `env_vars`：**仅变量名**，不写值
- 默认 `enabled = false`（尤其写库/DDL 启发式命中时）
- 若官方支持：`default_tools_approval_mode = "prompt"`

### 5.2 落盘纪律

1. sync/land **始终**生成可提交的 `.codex/config.toml.example`（从 example 或对 servers **脱敏投影**）。
2. 真密：本机 `.codex/config.toml`（gitignore）或 fill-mcp 扩展分支；**禁止**把密钥写入仓库 toml。
3. 无 MCP SSOT 时回退现有注释型 `codex-config.toml.tmpl`。
4. `calibrate-live` / 文档：Codex 读 toml，不读根 `.mcp.json`。

### 5.3 可选 `mcp-policy.yaml`

按 name/标签覆盖 `enabled`；名称含 `mysql|postgres|redis|mongo` 且非 `readonly` → 默认 `enabled = false`。

---

## 6. Hooks 设计

### 6.1 生成物

- `.codex/hooks.json`
- `.codex/hooks/codex-adapter.js`（新）
- 共享 gate / delivery 脚本（经 adapter 或 `--codex`）

### 6.2 默认事件（升「高」最低集）

| 事件 | matcher | 用途 |
|---|---|---|
| `PreToolUse` | `^Bash$` | 命令策略 / commit gate |
| `Stop` | （宽或无） | 交付软检查；fail-open |

P1：`SessionStart` 等仅官方实测后进入默认模板。

### 6.3 适配层

- stdin：Codex JSON → 归一为现有 gate 命令/cwd 视图
- stdout：Codex 官方 allow/deny 字段；**fail-open**
- Windows：`command` / 必要时 `commandWindows`
- 人验：`/hooks` trust；仅 trusted 项目加载

L3 仍装 `.githooks/pre-commit`。L5：`.codex/hooks` 进 `MANAGED_DIRS`。

---

## 7. Starlark 命令策略 + Skills

### 7.1 Rules

- 行为规范 → `AGENTS.md` only
- 命令审批/禁止 → `*.rules`（标注 experimental）
- 默认种子：`git push` → prompt；`git reset --hard` / `git clean -fd` → forbidden；保守 DB/部署前缀可注释关闭
- **禁止** `.mdc` → `.rules` 转换

### 7.2 Skills

- L5：`docs/agent-config/skills/` → `.agents/skills/`（对称 Claude 族）
- 保留 `GENERATED.md` 标记
- prune：**只**清理本 sync 托管树；不删用户自建 skill 目录（策略写进 sync-hosts / PARITY）

---

## 8. 文档与 Selfcheck

### 8.1 文案翻钉

更新：`ai-tools.md`、`adapters/codex.md`、`CODEX-PARITY.md`、`CODEX-P0-MANUAL.md`（可升格/stub 为 `CODEX-MANUAL.md`）、手册、`write-plan`、`audit-report`、`upgrade`、`questions.yaml`、`recommended-profile`、`VERIFY`、`CHANGELOG`、`agent-config/README.md.tmpl`。

### 8.2 Selfcheck

废除「部分对齐 / 不全量 / out of scope / 不默认进推荐」类断言，改为：

- 矩阵与 adapter 声明 **高**
- 仍断言 **不做 `.mdc` 全量镜像**
- 推荐纪律 **B**
- 存在 toml 生成、`codex-adapter`、默认 `.rules`、`PreToolUse`+`Stop`、skills → `.agents/skills`
- fixture（扩展 golden 或新 `l5-sync-codex`）覆盖 `--check`

### 8.3 实现切片

1. **P0**：矩阵/文案 + MCP JSON→TOML + hooks 扩事件 + adapter + Starlark 种子 + sync/MANAGED_DIRS + selfcheck/fixture  
2. **P0b**：fill-mcp / calibrate Codex 分支 + MANUAL 人验条目  
3. **P1**：更多 hook 事件、mcp-policy 精细化、skills prune 压测  

版本建议：**0.6.9**。生产装/升分支纪律不变。

### 8.4 成功标准

- 含 `codex` 的 L5 仓：`sync.mjs` / `--check` 绿；`.codex/{config.toml.example,hooks.json,hooks/*,rules/*}` + `.agents/skills` 齐套  
- 文档一致称「高」；纪律 B 有钉  
- 人验：trust → `/hooks` → `/mcp` → Starlark 样例 → skills 可发现  

---

## 9. 风险与缓解

| 风险 | 缓解 |
|---|---|
| Starlark rules 官方仍实验性 | 模板标注 experimental；失败不阻断 land；文档说明 |
| Codex stdin/stdout 与假设不符 | adapter 集中；MANUAL 人验；fail-open |
| 含密 servers.json 误写入 toml | 只生成 example + env 名；gitignore 真 toml；selfcheck 扫禁明文模式 |
| skills prune 误删用户目录 | 托管前缀/清单策略；PARITY 写清 |
| selfcheck 大面积翻钉 | 单测先钉新契约再改文案，避免半新半旧 |

---

## 10. 审批记录

| 节 | 内容 | 状态 |
|---|---|---|
| 推荐纪律 | B | 已批准 |
| 方案 | A 分轨 SSOT | 已批准 |
| §1 总览与边界 | | OK |
| §2 MCP | | OK |
| §3 Hooks | | OK |
| §4 Starlark + Skills | | OK |
| §5 矩阵/selfcheck/里程碑 | | OK |
| 本文档 | | **待人审** |

---

## 11. 下一步

1. 人审本文件；若需修改，直接改本文或回复要点。  
2. 批准后：用 writing-plans 产出实现计划（建议路径 `harness-eng/docs/superpowers/plans/2026-09-22-codex-full-support.md`）。  
3. 实现计划批准后再改代码（P0 → P0b → P1）。
