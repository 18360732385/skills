# Trae P0 官方实证（2026-09-12）

对照日：**2026-09-12**。本页只钉**官方文档事实**与 harness 差集；**不**把矩阵 Trae 从中高改成高（T-P1-5 仍等真人 Trae 会话确认 hooks / MCP）。

交叉：[TRAE-PARITY.md](TRAE-PARITY.md) · [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md) · [adapters/trae.md](../templates/ai-tools/adapters/trae.md)。

## 官方来源

| 主题 | URL | 本页引用的事实 |
|---|---|---|
| 项目规则 | https://docs.trae.ai/ide/rules | 项目规则在 `.trae/rules/`；frontmatter 原生 `alwaysApply` / `globs` / `description`；子目录最多 **3 层**；另可导入根 `AGENTS.md` / `CLAUDE.md` / `CLAUDE.local.md`（开关） |
| 项目 Skills | https://docs.trae.ai/ide/skills | 项目 skills 在 **`.trae/skills/`**（一等公民）；按需加载（先扫 description，相关才读正文）；亦见可选 `.agents/skills/` |
| Hooks | https://docs.trae.ai/ide/hook-configuration-reference | 项目 hooks 在 **`.trae/hooks.json`**；事件含 SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、Stop、Notification；`matcher` 匹配 Trae `tool_name`（终端为 **`RunCommand`**）；亦可导入 Claude Code hooks |
| MCP | 官方强调 Settings → Add MCP servers | harness 仍写 **`.trae/mcp.json`**：磁盘产物 **+ 必须在 IDE 里启用**；T-P0-2 余项等人确认 |

## T-P0-1…4 状态

| ID | 状态 | 官方事实 | Harness 现状 | 剩余 |
|---|---|---|---|---|
| **T-P0-1** | **docs PASS** | Trae 把 `.trae/rules/*.md`（含子目录，最多 3 层）当项目规则；YAML frontmatter 原生 `alwaysApply` / `globs` / `description`。UI 激活方式会改 `alwaysApply`，并按模式要求配 `description` 或 `globs`（如 Apply to Specific Files → `globs`） | **本 spike 已修**：镜像到 Trae **不再剥 FM**（`render.mjs` / L5 `toHostMd` 按宿主分支；Claude/Qoder 仍 strip）。此前 gap：镜像把 FM 降级成正文「适用路径」提示，官方作用域语义被丢掉 | 真人会话确认：alwaysApply 规则注入、globs 命中「Apply to Specific Files」、嵌套目录生效。清单见 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md) |
| **T-P0-2** | **partial** | 文档强调 Settings → Add MCP servers；项目 MCP 路径 harness 写 **`.trae/mcp.json`**（另有 `.example`） | 路径已落盘（L4+ / L5 sync）；**磁盘产物 ≠ 已启用** | **等人**在 Trae 面板确认：打开项目 MCP 后 `.trae/mcp.json` 是否生效、未开时的失败形态、与 Cursor `.cursor/mcp.json` 的操作差 |
| **T-P0-3** | **docs PASS structure** | 项目 hooks 路径 **`.trae/hooks.json`** 正确；事件族含 PreToolUse / PostToolUse / Stop（及 SessionStart / UserPromptSubmit / Notification）。`matcher` 匹配 **Trae `tool_name`** | 结构已对：`version` + Claude 系嵌套 `hooks` + `claude-adapter.js`。**风险**：`HOOK_DEFS` 仍用 Claude 族 matcher（`Bash` / `Edit\|Write\|MultiEdit` / `mcp__mysql`），Trae 终端工具名是 **`RunCommand`**，可能匹配不上 | 事件/工具映射草案见下；**等人**用 Trae 会话验证 `RunCommand` 是否触发门禁。**不**在本 spike 改 `HOOK_DEFS` matcher（等 T-P1-2 / 人确认） |
| **T-P0-4** | **docs PASS** | `.trae/skills/` 是项目 skills **一等公民**；按需加载；可选 `.agents/skills/` | 适配卡已去掉「若宿主支持」；生成路径仍为 `.trae/skills/` | 发现/点名行为与 Cursor `.cursor/skills/` 的差集可在真人会话补一句；不挡 docs PASS |

未过项**不**改矩阵、不宣称同级。T-P1-5（中高→高）明确等待 hooks/MCP 真人确认。

## T-P0-3 事件 / 工具名映射草案

官方：`PreToolUse` / `PostToolUse` 的 `matcher` 是正则，匹配标准化 **`tool_name`**。文档示例与正文反复出现终端工具 **`RunCommand`**。Trae 也可导入 Claude Code hooks（另一条兼容路径，**不能**当成「`Bash` 一定能匹配」）。

| 用途 | Cursor（扁平） | harness 现写（Claude 族 → Trae） | Trae 官方倾向 | 风险 |
|---|---|---|---|---|
| 提交门禁 / shell | `beforeShellExecution` + `git\s+commit` | `PreToolUse` + matcher **`Bash`** | `PreToolUse` + matcher **`RunCommand`** | **`Bash` 可能永不触发** |
| 编辑后提醒 | `afterFileEdit` | `PostToolUse` + `Edit\|Write\|MultiEdit` | 须对人名 Trae 文件工具 `tool_name`（文档表，会话核） | Claude 文件工具名可能对不上 |
| MCP 守卫 | `beforeMCPExecution` | `PreToolUse` + `mcp__mysql` | 视 Trae 如何暴露 MCP 工具名 | 未实证 |
| 结束检查 | `stop` | `Stop` | `Stop`（事件名一致） | 结构很可能通；仍须人点一次 |
| 会话/提示（官方有、harness 未用） | — | 未生成 | `SessionStart` / `UserPromptSubmit` / `Notification` | 非 P0 扩面 |

**人验最低条**（见 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)）：在 Trae 里跑一条会走终端的操作，看 `.trae/hooks.json` 里 `PreToolUse`+`Bash` 是否触发；若不触发，改试 `RunCommand` 再记一笔。

## 本 spike 已改的 harness 行为

- **T-P0-1 hotfix**：`transformMdcToHostMd` / L5 `toHostMd` **按宿主分支**——仅 Trae 保留 FM；Claude / Qoder 仍 strip。
- selfcheck：L4 镜像与 L5 sync 的 Trae 规则必须仍含 `alwaysApply` / `globs`。
- fixture：`scripts/fixtures/mature-trae/`（根 AGENTS + 带 FM 的 `.trae/rules` + api/kb，无 `.cursor/rules`）判 MATURE。

## 明确不在本页范围

- 不改矩阵 Trae **中高 → 高**
- 不把 Trae hooks 改成 Cursor 扁平 `beforeShellExecution`
- 不在未人确认前改 `HOOK_DEFS` 的 Trae matcher
- 不把 MCP 主路径改到 `.cursor/mcp.json` 或根 `.mcp.json`
