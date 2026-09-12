# Trae → Cursor 同级缺口清单

harness-eng **0.6.1-dev**（0.6.0 列车已收口）对齐矩阵：Trae **中高**，Cursor（及 Claude / Qoder / WorkBuddy）**高**。  
契约 **SSOT 已共享**（根 `AGENTS.md` + `docs/**`）；L3+ 已镜像 `.trae/rules/*.md`、Claude 族 `.trae/hooks.json` + `claude-adapter.js`、L4+ `.trae/mcp.json(.example)`。  
缺口不在「还没写适配」，而在 **原生执行** 与 **实证宿主行为**：磁盘上有文件 ≠ Trae 会话里同级可靠。

**目标**：把矩阵 Trae 从 **中高 → 高**，同时 **不假装** Trae 走 Cursor 协议（hooks 仍是 Claude 族；MCP 仍走 `.trae/mcp.json`）。Rules 镜像 **保留** 官方 `alwaysApply` / `globs` frontmatter（0.6.1-dev P0 hotfix）。**本列车不改矩阵用字。**

交叉：[adapters/trae.md](../templates/ai-tools/adapters/trae.md) · [ai-tools.md](ai-tools.md) · [ROADMAP-0.6.0.md](../ROADMAP-0.6.0.md)。  
**0.6.1-dev Trae P0 spike 已开工**：官方实证 [TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md) · 人验清单 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)。

## 目标定义

「同级」= 在 **真实 Trae 会话**里，rules / hooks / MCP / skills 的**可观测行为**与 Cursor 同级可靠（加载、触发、路径、一等公民），而不是「生成物已落盘」。

| 维度 | Cursor（高） | Trae 0.6.0 基线（中高） | 同级要补的 |
|---|---|---|---|
| Rules | `.cursor/rules/*.mdc` 保留 `alwaysApply` / `globs` | `.trae/rules/*.md`，**保留**官方 FM（P0 hotfix）；人验加载中 | 真人会话确认作用域不丢 |
| Hooks | 原生 `beforeShellExecution` 等 | Claude 系 `PreToolUse` / `PostToolUse` / `Stop` + adapter | 事件对照表经实测，外加 `.githooks` 兜底 |
| MCP | `.cursor/mcp.json` | `.trae/mcp.json`（项目 MCP / Beta 以官方为准） | 启用条件写死、fill 路径对齐 |
| Skills | `.cursor/skills/` 一等公民 | `.trae/skills/` **一等公民**（docs PASS；适配卡已去掉「若宿主支持」） | 真人会话确认可发现 / 可点名 |

「高」**不是**「改成 Cursor 扁平 `hooks.json`」。禁止事项仍见适配卡：**勿用** `beforeShellExecution` 顶层扁平格式。

## 当前基线（0.6.0）

已落地、本清单不当成缺口：

- detect / MATURE 按任一宿主计（`.trae/rules`、`.trae/hooks.json`）
- L3+ 全量 rules 镜像；L3+ / L5 **不再**强制冗余 `1x-contract-sync`
- L3+ `.trae/hooks.json`（`version` + Claude 系嵌套）+ hooks 脚本 + `claude-adapter.js`
- L4+ `.trae/mcp.json.example`；真密 `.trae/mcp.json`；`mcp-paths.mjs` / fill-mcp / calibrate-live 已列该路径
- L3 总是 `.githooks/pre-commit` + gate `--git`
- `scripts/fixtures/multi-host-hooks` 含 Trae hooks 信号；L5 `sync.mjs` **能**分发 `.trae/`（见 fixture 内同步本）

P0 spike（0.6.1-dev）已落地的工程项：

- `mature-trae` fixture（无 `.cursor/rules` 仍 MATURE）；适配卡 Skills 已是一等公民
- 镜像 **保留** Trae frontmatter（不再只剩正文提示）
- 官方事实页 + 人验清单已写

仍等人 / 未做：

- `l5-sync-golden` 未另钉一份 Trae 专用黄金树（T-P1-4 余项）
- 项目 MCP 须 IDE 启用（T-P0-2 partial）；hooks matcher `Bash` vs `RunCommand`（T-P0-3 风险）
- **不**改矩阵 中高→高（等 T-P1-5 + 人确认）

## P0 必须先验证的产品事实

工程扩面之前先钉事实。每条写清 **通过标准**；未过不改矩阵、不宣称同级。

**0.6.1-dev 状态（2026-09-12 官方文档 + harness hotfix）** → 全文：[TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md) · 人验：[TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)。

| ID | 要验证 | 通过标准 | 0.6.1-dev 状态 |
|---|---|---|---|
| **T-P0-1** rules load | Trae 是否把 `.trae/rules/*.md`（含子目录）当项目规则加载；**官方 FM** `alwaysApply` / `globs` 是否生效；嵌套目录是否生效 | 官方路径 + 真实 Trae 会话中规则被注入；对照 Cursor `.mdc` 记「加载范围 + 失败形态」 | **docs PASS**；harness 已停剥 FM。人验 Apply to Specific Files 仍开放 |
| **T-P0-2** project MCP / Beta | `.trae/mcp.json` 是否必须打开项目 MCP / Beta；与 Cursor `.cursor/mcp.json` 的操作差在哪 | 官方或实测：启用开关、路径、未开时的失败形态 | **partial**：路径 +「磁盘产物须 IDE 启用」已写死；**等人** Trae 面板确认 |
| **T-P0-3** hooks event map | Claude 族 `PreToolUse` / `PostToolUse` / `Stop`（及 matcher `Bash` / `Edit\|Write` / `mcp__mysql`）在 Trae 是否真触发 | 对照表经实测；至少一条门禁生效；**不**改写成 Cursor 扁平协议 | **docs PASS structure**（`.trae/hooks.json`）；**风险** `Bash` ≠ Trae `RunCommand`。映射草案在实证页；**不**在本 spike 改 matcher |
| **T-P0-4** skills first-class | `.trae/skills/` 是否一等公民（项目 skills 可发现、可点名） | 官方或实测：发现规则与 Cursor 对等或明确差集；适配卡去掉「若宿主支持」 | **docs PASS**；「若宿主支持」已删 |

P0 文档产出已在 [TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md)。T-P0-1 的 strip-FM 是文档揭示的明确 harness bug，本 spike **已按宿主分支修好**（Claude/Qoder 仍 strip）。

## P1 工程向缩小差距

P0 过关后再动生成器 / fixture / 矩阵。

| ID | 工作 | 完成判据 |
|---|---|---|
| **T-P1-1** preserve / translate globs | 镜像 `.mdc` → `.trae/rules/*.md` 时，`globs` / `alwaysApply` 不要只降级成正文提示（若 T-P0-1 证明 Trae 有原生或等价作用域） | 有作用域则保留或翻译成 Trae 认识的元数据；无则文档写明「仅自然语言提示」且与 Claude/Qoder 一致；`render.mjs` / L5 `sync.mjs` 行为与适配卡一致。**P0 hotfix 已保留 FM**；人验通过后可勾 |
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
- **不**在 P0 spike 把矩阵改成 **高**（升号已是 **0.6.1-dev**；T-P1-5 另做）
- **不**因「文件已生成」提前把矩阵改成 **高**
- **不**另起一份 Trae 业务 SSOT（Never do / Pn 仍只在根 AGENTS + `docs/**`）

## 建议落地顺序

```text
Spike（P0 产品事实） → Parity（P1 工程） → Polish（P2 体验）
```

1. **Spike**：T-P0-1…4 在真实 Trae（或可引用的官方行为说明）上勾过；失败项写进适配卡「已知差集」
2. **Parity**：T-P1-1…4 改生成器 / fill / fixture / selfcheck；最后才 T-P1-5 改矩阵用字
3. **Polish**：T-P2-1…4，不回退 P0 结论

**版本**：**0.6.1-dev Trae P0 spike 已开工**（本清单 + 实证页）。  
**不要**重开已收口的 **0.6.0**（M1–M4 已完成）。

## 「同级」验收清单

全部勾上才允许 T-P1-5 把矩阵写成 **高**。

- [x] T-P0-1：官方加载路径 + FM 已记录；harness 停剥 FM；**人验**加载形态仍开放（见实证页）
- [ ] T-P0-2：项目 MCP 路径已写；**IDE 启用**等人 Trae 面板
- [ ] T-P0-3：hooks **结构** docs PASS；**matcher / RunCommand** 等人验
- [x] T-P0-4：skills 官方一等公民；适配卡已去掉「若宿主支持」
- [x] T-P1-1：globs / alwaysApply **已保留**（Trae 专用路径；Claude/Qoder 仍 strip）；人验见 MANUAL
- [ ] T-P1-2：原生 hooks + `.githooks` 对 Trae-only 仓可回归
- [ ] T-P1-3：MCP 文档与 `mcp-paths` / fill-mcp / calibrate-live 一致
- [ ] T-P1-4：`mature-trae` + Trae L5 sync 黄金集 + selfcheck 钉路径
- [ ] T-P1-5：矩阵 / 适配卡 / QUICKSTART / 手册 / selfcheck「中高」断言同步改为 **高**
- [ ] 仍未假装 Trae 使用 Cursor 协议（适配卡「禁止」条仍在）
- [x] 0.6.0 列车未被重开；升号 **0.6.1-dev**（本 spike）
