# Trae → Cursor 同级缺口清单

harness-eng **0.6.0** 对齐矩阵：Trae **中高**，Cursor（及 Claude / Qoder / WorkBuddy）**高**。  
契约 **SSOT 已共享**（根 `AGENTS.md` + `docs/**`）；L3+ 已镜像 `.trae/rules/*.md`、Claude 族 `.trae/hooks.json` + `claude-adapter.js`、L4+ `.trae/mcp.json(.example)`。  
缺口不在「还没写适配」，而在 **原生执行** 与 **实证宿主行为**：磁盘上有文件 ≠ Trae 会话里同级可靠。

**目标**：把矩阵 Trae 从 **中高 → 高**，同时 **不假装** Trae 走 Cursor 协议（hooks 仍是 Claude 族；MCP 仍走 `.trae/mcp.json`；rules 仍是 strip frontmatter 的 `.md`）。

交叉：[adapters/trae.md](../templates/ai-tools/adapters/trae.md) · [ai-tools.md](ai-tools.md) · [ROADMAP-0.6.0.md](../ROADMAP-0.6.0.md)。  
本清单 **不占用已收口的 0.6.0 列车**；建议 **0.6.1 Trae parity** 或旁路立项。

## 目标定义

「同级」= 在 **真实 Trae 会话**里，rules / hooks / MCP / skills 的**可观测行为**与 Cursor 同级可靠（加载、触发、路径、一等公民），而不是「生成物已落盘」。

| 维度 | Cursor（高） | Trae 0.6.0 基线（中高） | 同级要补的 |
|---|---|---|---|
| Rules | `.cursor/rules/*.mdc` 保留 `alwaysApply` / `globs` | `.trae/rules/*.md`，frontmatter 降级为正文提示 | 实证加载 + 作用域语义不丢 |
| Hooks | 原生 `beforeShellExecution` 等 | Claude 系 `PreToolUse` / `PostToolUse` / `Stop` + adapter | 事件对照表经实测，外加 `.githooks` 兜底 |
| MCP | `.cursor/mcp.json` | `.trae/mcp.json`（项目 MCP / Beta 以官方为准） | 启用条件写死、fill 路径对齐 |
| Skills | `.cursor/skills/` 一等公民 | `.trae/skills/`（适配卡写「若宿主支持」） | 去掉含糊语；项目 skills 可发现 |

「高」**不是**「改成 Cursor 扁平 `hooks.json`」。禁止事项仍见适配卡：**勿用** `beforeShellExecution` 顶层扁平格式。

## 当前基线（0.6.0）

已落地、本清单不当成缺口：

- detect / MATURE 按任一宿主计（`.trae/rules`、`.trae/hooks.json`）
- L3+ 全量 rules 镜像；L3+ / L5 **不再**强制冗余 `1x-contract-sync`
- L3+ `.trae/hooks.json`（`version` + Claude 系嵌套）+ hooks 脚本 + `claude-adapter.js`
- L4+ `.trae/mcp.json.example`；真密 `.trae/mcp.json`；`mcp-paths.mjs` / fill-mcp / calibrate-live 已列该路径
- L3 总是 `.githooks/pre-commit` + gate `--git`
- `scripts/fixtures/multi-host-hooks` 含 Trae hooks 信号；L5 `sync.mjs` **能**分发 `.trae/`（见 fixture 内同步本）

未落地 / 未实证（下面 P0–P2）：

- 无 `mature-trae`；`l5-sync-golden` 未钉一份 Trae 专用黄金树
- 适配卡 Skills 行仍是「若宿主支持」
- globs / `alwaysApply` 在 Trae 侧只剩正文「适用路径」提示
- 项目 MCP / Beta、hooks 事件是否真触发、skills 是否一等公民：**缺产品事实**

## P0 必须先验证的产品事实

工程扩面之前先钉事实。每条写清 **通过标准**；未过不改矩阵、不宣称同级。

| ID | 要验证 | 通过标准 |
|---|---|---|
| **T-P0-1** rules load | Trae 是否把 `.trae/rules/*.md`（含子目录）当项目规则加载；strip 后的 frontmatter 是否被忽略；嵌套目录是否生效 | 真实 Trae 会话中规则被注入；对照 Cursor `.mdc` 的 alwaysApply / globs 记一页「加载范围 + 失败形态」；适配卡可改写「官方加载路径」而不再只写生成路径 |
| **T-P0-2** project MCP / Beta | `.trae/mcp.json` 是否必须打开项目 MCP / Beta；与 Cursor `.cursor/mcp.json` 的操作差在哪 | 官方或实测：启用开关、路径、未开时的失败形态；[ai-tools.md](ai-tools.md) / [fill-mcp.md](../fill/fill-mcp.md) 能写死条件，不再「以官方为准」一笔带过 |
| **T-P0-3** hooks event map | Claude 族 `PreToolUse` / `PostToolUse` / `Stop`（及 matcher `Bash` / `Edit\|Write` / `mcp__mysql`）在 Trae 是否真触发 | 对照表：Cursor `beforeShellExecution` ↔ Trae `PreToolUse`+`Bash` 等（见 `HOOK_DEFS`）；至少一条门禁在 Trae 会话或可回放夹具里生效；**不**改写成 Cursor 扁平协议 |
| **T-P0-4** skills first-class | `.trae/skills/` 是否一等公民（项目 skills 可发现、可点名） | 官方或实测：发现规则与 Cursor `.cursor/skills/` 对等或明确差集；适配卡去掉「若宿主支持」；不支持则矩阵保持中高并写进非目标 |

P0 产出应是短文（本文件补一节或适配卡加「实证」段），不是先改 `render.mjs`。

## P1 工程向缩小差距

P0 过关后再动生成器 / fixture / 矩阵。

| ID | 工作 | 完成判据 |
|---|---|---|
| **T-P1-1** preserve / translate globs | 镜像 `.mdc` → `.trae/rules/*.md` 时，`globs` / `alwaysApply` 不要只降级成正文提示（若 T-P0-1 证明 Trae 有原生或等价作用域） | 有作用域则保留或翻译成 Trae 认识的元数据；无则文档写明「仅自然语言提示」且与 Claude/Qoder 一致；`render.mjs` / L5 `sync.mjs` 行为与适配卡一致 |
| **T-P1-2** hooks + githooks | 原生 Claude 族 hooks 与 L3 `.githooks` 兜底一起对 Trae 可靠 | `HOOK_DEFS` 的 trae 映射经 T-P0-3 核实后不改族、只修路径/matcher；gate 类仍有 `--git` 兜底；Trae-only 仓 L3 软门禁与 Cursor 同级可回归 |
| **T-P1-3** MCP docs + fill path | 文档与 fill 路径对齐 T-P0-2 | [ai-tools.md](ai-tools.md) · [fill-mcp.md](../fill/fill-mcp.md) · `mcp-paths.mjs` · calibrate-live 优先级写清 `.trae/mcp.json` 与 Beta；gitignore snippet 已有则不重复发明 |
| **T-P1-4** fixtures | 补 Trae 黄金集 | 新增 `mature-trae`（对照 `mature-claude`：根 AGENTS + `.trae/rules` + 契约骨架 + agent-kb，**无** `.cursor/rules` 仍判 MATURE）；`l5-trae-sync` 或把 `l5-sync-golden` 扩成可 `--check` 的 Trae 分发树；selfcheck 钉路径 |
| **T-P1-5** matrix bump | 矩阵 Trae **中高 → 高** | 仅当 P0 全过且 T-P1-1…4 绿；同步改 [ai-tools.md](ai-tools.md) · [adapters/trae.md](../templates/ai-tools/adapters/trae.md) · [sync-hosts.md](sync-hosts.md) · QUICKSTART / 手册矩阵句；**同时**改 selfcheck 里「marks Trae as 中高」类断言。未达标不改字 |

## P2 体验抛光

不挡矩阵升级；可与 P1 并行收尾，但 **不能**靠文案把中高写成高。

| ID | 工作 | 完成判据 |
|---|---|---|
| **T-P2-1** 安装路径示例 | 手册 / QUICKSTART 里 Trae 用户 skills 目录不再只写「按该宿主文档」 | 给出与 Cursor / Claude Code 同级的示例路径（以 T-P0 或官方为准），并声明「示例 ≠ 唯一安装目标」 |
| **T-P2-2** 提问脚注 | `Q_AI_TOOL` / 推荐包对 Trae **中高** 可见，但不吓退 | 对照 Codex「部分对齐·不默认」的脚注强度：**提示**中高 + 链到本清单；未探测仍可进「全部推荐」（与 Codex 不默认区分） |
| **T-P2-3** 热路径交叉链 | Agent 点名 Trae 同级时能落到本清单 | [AGENT-INDEX.md](../AGENT-INDEX.md) 按需表、[host/README.md](README.md)、适配卡各有一行指针（本 PR 已做轻量接线；P2 只补漏） |
| **T-P2-4** 审计 / 仪表盘可见性 | audit / session-dashboard / WritePlan 对 Trae 路径与 Cursor 同级可读 | 报告列出 `.trae/rules` · `.trae/hooks.json` · `.trae/mcp.json`；缺口用语区分「未生成」与「未实证」 |

## 非目标

- **不**把 Trae hooks 改成 Cursor 扁平 `beforeShellExecution`
- **不**把 Trae MCP 改到 `.cursor/mcp.json` 或根 `.mcp.json`（除非 T-P0-2 证明官方已改主路径）
- **不**做 Codex 全量对等（那是 [ROADMAP G6](../ROADMAP-0.6.0.md) 另立项，与本清单无关）
- **不**重写使用手册全文、不加新契约域、不重做打分模型
- **不**在本清单 PR 把版本钉到 0.6.1（文档先行；升号属后续列车）
- **不**因「文件已生成」提前把矩阵改成 **高**
- **不**另起一份 Trae 业务 SSOT（Never do / Pn 仍只在根 AGENTS + `docs/**`）

## 建议落地顺序

```text
Spike（P0 产品事实） → Parity（P1 工程） → Polish（P2 体验）
```

1. **Spike**：T-P0-1…4 在真实 Trae（或可引用的官方行为说明）上勾过；失败项写进适配卡「已知差集」
2. **Parity**：T-P1-1…4 改生成器 / fill / fixture / selfcheck；最后才 T-P1-5 改矩阵用字
3. **Polish**：T-P2-1…4，不回退 P0 结论

**版本**：建议单开 **0.6.1 Trae parity**，或完全旁路立项。  
**不要**塞进已收口的 **0.6.0**（M1–M4 已完成；本列车主题是入口 / 文档拓扑 / fill / 发包，不是宿主同级）。

## 「同级」验收清单

全部勾上才允许 T-P1-5 把矩阵写成 **高**。

- [ ] T-P0-1：`.trae/rules` 加载范围与失败形态已记录
- [ ] T-P0-2：项目 MCP / Beta 启用条件已写死（文档 + fill 路径）
- [ ] T-P0-3：hooks 事件对照表已经实测（至少一条门禁）
- [ ] T-P0-4：skills 是一等公民，或明确保持中高并列入差集
- [ ] T-P1-1：globs / alwaysApply 已保留或已翻译（或已文档化为仅提示）
- [ ] T-P1-2：原生 hooks + `.githooks` 对 Trae-only 仓可回归
- [ ] T-P1-3：MCP 文档与 `mcp-paths` / fill-mcp / calibrate-live 一致
- [ ] T-P1-4：`mature-trae` + Trae L5 sync 黄金集 + selfcheck 钉路径
- [ ] T-P1-5：矩阵 / 适配卡 / QUICKSTART / 手册 / selfcheck「中高」断言同步改为 **高**
- [ ] 仍未假装 Trae 使用 Cursor 协议（适配卡「禁止」条仍在）
- [ ] 0.6.0 列车未被重开；升号走 0.6.1 或旁路立项
