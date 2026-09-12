# Trae P0 官方实证（2026-09-12）

对照日：**2026-09-12**。上半页钉**官方文档事实**与 harness 差集；下半页钉同日 **Trae CN 实机回传**（消费仓 L5，权威仓 **c-be-sms-ai**）。**不**把矩阵 Trae 从中高改成高（T-P1-5 仍等宿主至少触发一条 hook matcher + MCP 面板余项；**不**改 `HOOK_DEFS`）。

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
| **T-P0-1** | **docs + 磁盘 + 行为 PASS**（刷新后） | Trae 把 `.trae/rules/*.md`（含子目录，最多 3 层）当项目规则；YAML frontmatter 原生 `alwaysApply` / `globs` / `description`。UI 激活方式会改 `alwaysApply`，并按模式要求配 `description` 或 `globs`（如 Apply to Specific Files → `globs`） | **技能仓已修**：镜像到 Trae **不再剥 FM**（`render.mjs` / L5 tmpl `toHostMd(rule, host)`；Claude/Qoder 仍 strip）。**消费仓实例化** `scripts/agent-config/sync.mjs` 不会随 skill 升级自动更新 | **Round A**（c-be-sms-ai，SSOT/sync 刷新后）：磁盘 13 份 + 选择性注入 PASS。刷新前磁盘 FAIL 仍见上半场表。升级后仍须按 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md) 第 0 节刷新 |
| **T-P0-2** | **partial↑**（IDE 已消费文件） | 文档强调 Settings → Add MCP servers；项目 MCP 路径 harness 写 **`.trae/mcp.json`**（另有 `.example`） | 路径已落盘（L4+ / L5 sync）；**磁盘产物 ≠ 已启用**（关开关对照未做） | **实机回传**：Trae 已挂上部分 server。余项：Settings 面板缺服报错 + disable-switch |
| **T-P0-3** | **docs PASS structure**；**本机行为 FAIL** | 项目 hooks 路径 **`.trae/hooks.json`** 正确；事件族含 PreToolUse / PostToolUse / Stop（及 SessionStart / UserPromptSubmit / Notification）。`matcher` 匹配 **Trae `tool_name`** | 结构已对：`version` + Claude 系嵌套 `hooks` + `claude-adapter.js`。**风险**：`HOOK_DEFS` 仍用 Claude 族 matcher（`Bash` / `Edit\|Write\|MultiEdit` / `mcp__mysql`），官方终端名 **`RunCommand`**；本机工具名另见 `Shell` / `run_mcp` / `Edit` / `Write` | **Round C**：正确通道 `.trae/hooks.json` 未被宿主调用（live Shell / RunCommand 皆无注入）。脚本链自测通过。**不**改 `HOOK_DEFS`（Bash / RunCommand **皆无**；改 matcher 要等宿主先打中任意一条）。协议偏好**新会话** |
| **T-P0-4** | **PASS**（docs + 会话） | `.trae/skills/` 是项目 skills **一等公民**；按需加载；可选 `.agents/skills/` | 适配卡已去掉「若宿主支持」；生成路径仍为 `.trae/skills/` | **实机回传**：`harness-eng` 可见可点名；`release-eng` 因 `disable-model-invocation: true` 隐藏 |

未过项**不**改矩阵、不宣称同级。T-P1-5（中高→高）明确等待**宿主至少触发一条** hook matcher（协议偏好新会话）+ MCP 面板余项。**不**改 `HOOK_DEFS`。

## 实机回传 2026-09-12 Trae CN

消费仓 L5、用户按 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md) 在 **Trae CN** 跑 P0。本节是**同日上半场 / 刷新前**观测（权威仓后续回传见 Round A / C）。下表只记本会话观测，**不发明**表外结论。

| ID | 本会话 | 观测 | 剩余 |
|---|---|---|---|
| **T-P0-1** | **磁盘 FAIL** | 消费仓 `.trae/rules/*.md` **无 YAML frontmatter**；`适用路径` / `始终应用` 是正文引用块。技能 tmpl 已修（`templates/agent-config/sync.mjs.tmpl` 的 `toHostMd(rule, host)` 对 trae 保留 FM），但消费仓**实例化**的 `scripts/agent-config/sync.mjs` 仍是旧版无条件 strip → 约 17:53 用旧生成器写出产物。模型侧：路径作用域规则在会话里被**全量注入**（与「无 FM → always-on」一致）。UI「Apply to Specific Files」未验（要磁盘有 FM + 人看面板） | **docs PASS**；按 MANUAL 刷新消费仓 `sync.mjs` 后再验 FM / 面板 |
| **T-P0-2** | **partial↑**（IDE 已吃文件） | 磁盘 `.trae/mcp.json` ✓。Trae **已消费**：会话挂上 `mcp_gitlab`、`mcp_chrome-devtools`、`mcp_Apifox_Dao_Ru`（中文名被压成 Dao_Ru）。缺 7 台（mysql×4、redis×3、sonarqube）— 多半启动失败，须看 Settings MCP 面板报错。关掉开关对照未做（UI） | Settings 面板错误 + disable-switch 对照 |
| **T-P0-3** | **inconclusive** | 结构 OK。探测（stage `.claude` 生成物 + `git commit --dry-run`）：matcher `Bash` 与会话中途临时改 `RunCommand` 均**未见** systemMessage。中途改 `hooks.json` 可能不热加载 | **新 Trae 会话**再测 Bash → RunCommand（配方留在 MANUAL） |
| **T-P0-4** | **PASS** | `harness-eng` 从 `.trae/skills/` 可见、可点名。`release-eng` 因 `disable-model-invocation: true` 隐藏 — 证明 Trae 认 SKILL.md FM / 按需 | 无挡矩阵项 |

### T-P0-1 消费仓漂移根因

技能仓 tmpl 已按宿主保留 Trae FM，**不会**在消费仓升级 skill 时自动覆盖已落地的 `scripts/agent-config/sync.mjs`。

```text
skill tmpl（已修）                         消费仓实例化 sync.mjs（仍旧）           磁盘产物
toHostMd(rule, host)                    无条件 strip FM                     正文「适用路径」blockquote
host === "trae" → 保留 rule.raw 的 FM    （旧生成器，约 17:53）                 无 YAML frontmatter
```

要让 `.trae/rules` 带上 FM：升级 skill → 再 land/render L5 从 tmpl **刷新** `scripts/agent-config/sync.mjs` → `node scripts/agent-config/sync.mjs` → **重开** Trae 会话。步骤见 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)。

## T-P0-3 事件 / 工具名映射草案

官方：`PreToolUse` / `PostToolUse` 的 `matcher` 是正则，匹配标准化 **`tool_name`**。文档示例与正文反复出现终端工具 **`RunCommand`**。Trae 也可导入 Claude Code hooks（另一条兼容路径，**不能**当成「`Bash` 一定能匹配」）。

| 用途 | Cursor（扁平） | harness 现写（Claude 族 → Trae） | Trae 官方倾向 | 风险 |
|---|---|---|---|---|
| 提交门禁 / shell | `beforeShellExecution` + `git\s+commit` | `PreToolUse` + matcher **`Bash`** | `PreToolUse` + matcher **`RunCommand`** | **`Bash` 可能永不触发** |
| 编辑后提醒 | `afterFileEdit` | `PostToolUse` + `Edit\|Write\|MultiEdit` | 须对人名 Trae 文件工具 `tool_name`（文档表，会话核） | Claude 文件工具名可能对不上 |
| MCP 守卫 | `beforeMCPExecution` | `PreToolUse` + `mcp__mysql` | 视 Trae 如何暴露 MCP 工具名 | 未实证 |
| 结束检查 | `stop` | `Stop` | `Stop`（事件名一致） | 结构很可能通；仍须人点一次 |
| 会话/提示（官方有、harness 未用） | — | 未生成 | `SessionStart` / `UserPromptSubmit` / `Notification` | 非 P0 扩面 |

**人验最低条**（见 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)）：**只**认 `.trae/hooks.json`（**勿**把 `.cursor/hooks.json` `beforeShellExecution` 当 Trae 证据）。**新 Trae 会话**里跑终端操作（配方：stage `.claude` 生成物 + `git commit --dry-run`），看 `PreToolUse`+`Bash` 是否触发；若不触发，改 `RunCommand` 后再开**新会话**测。中途改 `hooks.json` 可能不热加载。

**HOOK_DEFS 冻结**：仅当实证出现「`Bash` 不触发 / `RunCommand` 触发」才改 matcher。Round C 是 **Bash 无 / RunCommand 无**（宿主未调用 hooks）→ 改名是 T-P1 候补，等宿主先打中任意一条。次要缺口：本机工具名 `Shell` 对不上 matcher `Bash`。

## 本 spike 已改的 harness 行为

- **T-P0-1 hotfix**：`transformMdcToHostMd` / L5 `toHostMd` **按宿主分支**——仅 Trae 保留 FM；Claude / Qoder 仍 strip。
- **消费仓**：升级 skill 后须从 tmpl **刷新**实例化 `sync.mjs`（见 MANUAL 第 0 节）。
- selfcheck：L4 镜像与 L5 sync 的 Trae 规则必须仍含 `alwaysApply` / `globs`；tmpl `toHostMd(rule, host)` + `host === "trae"` 保留分支。
- fixture：`scripts/fixtures/mature-trae/`（根 AGENTS + 带 FM 的 `.trae/rules` + api/kb，无 `.cursor/rules`）判 MATURE。

## 2026-09-12 消费仓 sync stale 清理（人审 · 权威）

消费仓从 tmpl 刷新 `scripts/agent-config/sync.mjs` 后再跑 sync，清掉 7 份「过期」宿主副本：`00-harness-ssot`×3 宿主 + `1x-contract-sync`×4 宿主。Trae 会话曾判断删除错误并从 git 恢复。**对照 skill 代码的独立结论：**

| 清理对象 | 结论 | 理由 |
|---|---|---|
| **`1x-contract-sync`**（claude/qoder/trae/workbuddy） | **删除正确 ✅** | 0.5.7 / `shouldEmitContractSync`：L3+ 全量镜像或 L5 sync 宿主省略冗余 1x。从 git 恢复等于回退该契约 |
| **宿主 `00-harness-ssot`**（`.trae/.qoder/.claude/.codebuddy/rules/`） | **机械删除正确 ✅**，但必须经 SSOT 回灌 | 这些目录属 `SYNC_MANAGED_RULE_PREFIXES`，L5 由 sync 托管；plan 里没有的就是 stale。Trae 说「L5 仍由 render 直渲这些 00」是错的 |
| **从 git 恢复宿主孤儿** | **错误 ❌** | Trae 仍需要 alwaysApply harness 指针，但正确路径是文件活在 **`docs/agent-config/rules/00-harness-ssot.mdc`**（SSOT），再 sync 分发。不要把宿主副本捡回来 |

工程缺口（本页对照日之后的 hotfix）：L5 `adaptTarget` 原先只把 `.cursor/rules/*` 改投 SSOT；Trae/Qoder/WorkBuddy 的 00 目标返回 `null` 且不写盘。若消费仓没跟 Cursor 一起 land、或 SSOT 从未落下 00，sync 清掉宿主副本后指针永久消失。**修复**：L5 只要选了 cursor/trae/qoder/claude/workbuddy，render 必须保证 SSOT `00-harness-ssot.mdc` 在计划里（cursor 风格 tmpl），再由 sync 分发。**不**为全量镜像 L5 宿主重新写出 `1x-contract-sync`。

人验：见 [TRAE-P0-MANUAL.md](TRAE-P0-MANUAL.md)「消费仓 refresh」。

## 实机回传 2026-09-12 Trae CN · Round A（T-P0-1 刷新后 PASS）

权威仓 **c-be-sms-ai**。SSOT / 实例化 `sync.mjs` 刷新后再验（对照上半场磁盘 FAIL）。**文档以此轮为准。**

磁盘 `.trae/rules` = **13** 份：

| FM | 文件 |
|---|---|
| `alwaysApply: true` ×3 | `00-harness-ssot` · `00-project-docs-overview` · `karpathy-guidelines` |
| `alwaysApply: false` ×10 | `11` / `12` / `13` / `14` / `16` / `17` / `18` / `19` / `20` / `21` |
| **无** `1x-contract-sync` | 印证 #17：L5 全量镜像省略冗余 1x |

选择性注入 **PASS**：读 `sms-ai-web/apps/.../localDate.ts` 激活完整 `17-frontend-web`（另注入 `sms-ai-web/AGENTS.md`）。Trae **认 `globs`**。

**T-P0-1 升级**：刷新后 **磁盘 + 行为 PASS**（刷新前磁盘 FAIL，见上半场表）。不改矩阵。

## 实机回传 2026-09-12 Trae CN · Round B（错误通道 · 无效）

更早一次探测打到 **`.cursor/hooks.json` `beforeShellExecution`**。该通道是 Cursor 扁平协议，**不是** Trae hooks。**不得**当作 T-P0-3 / Trae 证据。MANUAL 已写死：Trae 探测只认 `.trae/hooks.json`。

## 实机回传 2026-09-12 Trae CN · Round C（T-P0-3 本机行为 FAIL）

正确通道 **`.trae/hooks.json`**。链：`PreToolUse` matcher `Bash` → `claude-adapter.js shell-gate` → `git-commit-soft-gate.js`。脚本链自测通过。

差分（同一 staged 状态：`.claude` 生成物）：

| 腿 | 结果 |
|---|---|
| 手工 stdin Claude payload + staged `.claude` 生成物 | ✓ `{"systemMessage":"【流程提醒】…agent-config…"}` |
| Live `Shell` 工具 + `git commit --dry-run -m probe`（同 staged） | ✗ 无注入 |
| Live Exec `RunCommand`（同 staged） | ✗ 无注入 |

干扰排除：PostToolUse Edit 静默 **不是**反证（该路径手工跑 edit-reminder 本就返回 `{}`）。

**T-P0-3 结论：本机行为 FAIL** — Trae 宿主未调用 `.trae/hooks.json`（Cursor + Trae 通道合计 4 条 live 腿静默；脚本链自测通过）。

**SSOT 次要发现（本切片不改 `HOOK_DEFS`）**：本机工具名是 `Shell` / `run_mcp` / `Edit` / `Write`；matcher 写的是 `Bash` / `mcp__mysql` / `MultiEdit`。即便宿主日后支持 hooks，`Bash` 也对不上 `Shell`。既有政策：只在「`Bash` 无 / `RunCommand` 有」时改 `HOOK_DEFS`。本轮 **两者皆无** → 阻塞在宿主支持；matcher 改名是 T-P1 候补，等宿主先打中任意一条。

**协议 caveat**：MANUAL §3 偏好**全新会话**；本轮是 revert 后**同会话**。差分强，caveat 入证，**仍记 FAIL**。

## 明确不在本页范围

- 不改矩阵 Trae **中高 → 高**
- 不把 Trae hooks 改成 Cursor 扁平 `beforeShellExecution`
- 不在未人确认前改 `HOOK_DEFS` 的 Trae matcher
- 不把 MCP 主路径改到 `.cursor/mcp.json` 或根 `.mcp.json`
