# 阶梯 L0–L5

与模板 `ladder` 标签对齐。land/resume 时只安装 **≤ 用户所选目标阶梯** 的文件。  
对用户展示时用中文名（详见 [glossary.md](glossary.md)）。

| 阶 | 中文名 | 交付物 | 成功标准 |
|---|---|---|---|
| **L0** | 协作入口 | 根 AGENTS（solo 或分册，分册可选 spring 变体）、`harness-meta.yaml`、Karpathy alwaysApply、00 文档总览 alwaysApply、可选 rule 14 / 21（行为包）/ 17（前端协作包） | 新 Agent 能找到命令入口与红线占位；冲突裁决写清 |
| **L1** | 契约骨架 | 所选契约域（func/api/db/redis/**jobs**…，见 `domains.yaml`）索引骨架 + templates + 真相子目录 README；对应 sync rules（11/12/13/16/**20**） | 改契约前读真相、改后回写有 path rule |
| **L2** | 知识回流 | `docs/agent-kb` 四文件 + rule 19 | pitfalls 表头含域列；有回流说明 |
| **L3** | 规划与软门禁 | superpowers README/ARCHIVE + rule 18 + hooks 软提醒（Cursor 原生和/或 `.githooks`） | 进行中表存在；commit 软提醒不拦截；WritePlan 附烟测 |
| **L4** | 工具连接样例 | `mcp.json.example` + `mcp-usage-guide.md`（无密）+ gitignore snippet 提示 | 无明文密码入库（或 meta `mcp_tracking=vendored_shared`）；建议 ignore `.cursor/mcp.json`；**真连与多环境矩阵属 fill-mcp / 填充 MCP 闸，不并入 L0** |
| **L5** | 配置 SSOT 管线 | `docs/agent-config/`（rules/hooks/mcp/settings）+ `scripts/agent-config/sync.mjs`（`--check` 漂移校验） | 生成物带 GENERATED 标记且勿手改；`sync --check` 无漂移；多工具仓【推荐】（`Q_AGENT_CONFIG` / `S_MULTI_TOOL`） |

## 自检清单

### L0

- [ ] 根 `AGENTS.md` 存在（含 Commands / Never do / 文档优先级骨架；solo 文案无「见分册」误导）
- [ ] `docs/harness-eng/harness-meta.yaml` 存在（skill_version / ladder / domains）；无则回退认遗留 `.cursor/harness-meta.yaml`（或 `.yml`）
- [ ] `.cursor/rules/karpathy-guidelines.mdc` 且 `alwaysApply: true`
- [ ] `.cursor/rules/00-project-docs-overview.mdc` 且 `alwaysApply: true`
- [ ] （可选，行为包）`21-observability-comments.mdc` 存在（`Q_RULE21=yes` 且 `S_SLF4J` 时推荐）
- [ ] （可选，前端协作包）`17-frontend-web.mdc` 存在（`Q_FRONTEND_RULE=yes` 且 `S_FRONTEND` 时推荐）

### L1（按所选域）

- [ ] `docs/{domain}/` 索引文件存在
- [ ] `docs/{domain}/templates/` 存在
- [ ] 真相子目录 README 存在（modules / table / keys / **tasks**）
- [ ] 对应 `NN-*-sync*.mdc` 存在且 `globs` 非空占位已替换
- [ ] 若含 **jobs**：`docs/jobs/jobs.md` + `tasks/README` + rule `20` + 四件套纪律写入索引

### 过程 / 协作包（非 L1 齐套条件）

- [ ] （可选）`docs/releases` → 脚注 release-eng
- [ ] （可选）前端 path rule / 分册 → 脚注，不进 fill-score 契约域权重

### L2

- [ ] `docs/agent-kb/README.md`、`architecture-overview.md`、`pitfalls.md`、`accepted-gaps.md`
- [ ] `pitfalls.md` 表头含「域」列
- [ ] `19-agent-kb.mdc` 存在
- [ ] 扩展文档（可选）：`agent-kb/` 下允许 playbook（如 `*-workflow.md`）；不视为缺口

### L3

- [ ] `docs/superpowers/README.md` 含进行中表
- [ ] `18-superpowers-corpus.mdc` 存在
- [ ] 按所选 `ai_tools` 原生 hooks 均存在（cursor / claude / qoder / trae / workbuddy / codex）；未选工具不要求
- [ ] `.githooks/pre-commit` + gate 存在（L3 兜底）；建议 `git config core.hooksPath .githooks`
- [ ] Cursor 若选用：`.cursor/hooks.json` 的 `failClosed` 不为强拦（允许 false）
- [ ] Qoder 若选用：`.qoder/settings.json` 含 Claude 系 `hooks`（`PreToolUse` 等），**不是** Cursor 式 `.qoder/hooks.json`
- [ ] Trae 若选用：`.trae/hooks.json` 含 Claude 系嵌套 hooks
- [ ] CodeBuddy 若选用：`.codebuddy/settings.json` 含 hooks 家族（非仅基础 gate）
- [ ] Claude 若选用：`.claude/settings.json` hooks +（L3+）`.claude/rules` 镜像
- [ ] 装后烟测：软提醒不拦截提交

### L4

- [ ] 仅有 `mcp.json.example`（或未跟踪真密）；按 ai_tools 检查 `.cursor/` / 根 `.mcp.json.example` / `.trae/`
- [ ] 说明文档 `docs/harness-eng/mcp-usage-guide.md` 含「勿提交真密」（无则回退 `.cursor/mcp-usage-guide.md`；若仍有旧名 `MCP使用说明.md`：新建英文名，旧文件 skip 不删，移交可手工清理）
- [ ] 装后烟测：`.gitignore` 建议含 `.cursor/mcp.json` / `.mcp.json` / `.trae/mcp.json`（snippet merge，不整文件覆盖）
- [ ] 非 Cursor 已选工具：rules 目录含全量镜像（qoder/trae/claude 为 `.md`；codebuddy 为 `RULE.mdc`）；**不要求**再写一份 alwaysApply `1x-contract-sync`
- [ ] Codex 若选用：仍有 `.codex/contract-sync.md` 指针（P2，不全量镜像）
- [ ] fill-mcp 真密按 `scripts/lib/mcp-paths.mjs` 多路径写入

### L5

- [ ] `docs/agent-config/README.md` + `scripts/agent-config/sync.mjs` 存在
- [ ] `node scripts/agent-config/sync.mjs --check` 无漂移（生成物与 SSOT 一致）
- [ ] 生成物（`.cursor/rules` 等）带 GENERATED 标记；根 AGENTS Never do 含「勿手改生成物」
- [ ] `harness-meta.yaml` 记 `agent_config: true`
- [ ] hooks 经 `docs/agent-config/hooks/hooks.config.json` 驱动（无等价事件机制的工具不生成、不降级模拟）
- [ ] 全量镜像宿主（claude/qoder/trae/workbuddy）**omit** 冗余 alwaysApply `1x-contract-sync`；Codex 仍保留 `.codex/contract-sync.md`
