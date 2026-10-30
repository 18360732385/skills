# Qoder → 对齐清单（0.7.49）

Qoder 属 **Claude 族**宿主（与 claude / trae / workbuddy 同协议族）：hooks 走 `settings.json`（Claude 系嵌套格式 + adapter），**不装** Cursor 协议 `hooks.json`；MCP 走仓库根 `.mcp.json`。本页汇总 harness-eng 对 Qoder 的磁盘生成物约定与真人验收步骤，避免与其他宿主混淆。

交叉：[adapters/qoder.md](../templates/ai-tools/adapters/qoder.md) · [ai-tools.md](ai-tools.md) · [sync-hosts.md](sync-hosts.md) · 实例参照源仓 `c-be-sms-ai`（ai_tools 含 qoder 的 L5 仓）。

## 生成物矩阵（L5 sync / L3+ render）

| 资产 | 路径 | 说明 |
|---|---|---|
| 入口 | `AGENTS.md`（根，与 Cursor 共用） | Qoder 读根 AGENTS；无独立入口文件 |
| SSOT 指针 | `.qoder/rules/00-harness-ssot.md` | 指向 `docs/agent-config/`；L5 生成 |
| rules | `.qoder/rules/*.md` | L3+ **全量镜像**（strip frontmatter 的 `.md`）；L0–L2 未全量镜像时改发 `1x-contract-sync.md` |
| hooks | `.qoder/settings.json`（hooks 段） | Claude 系嵌套：`PreToolUse` / `PostToolUse` / `Stop` + matcher |
| hook 脚本 | `.qoder/hooks/*.js` | 统一 Cursor 协议脚本 + `claude-adapter.js` 双向翻译（与 `.claude/hooks/` 同族） |
| MCP 真密 / example | 根 `.mcp.json` / `.mcp.json.example` | Claude 族共享根路径；vendored_shared 仓真密入 git（团队约定） |
| skills | `.qoder/skills/` | 宿主可发现用户/项目 skills；**harness 契约种子不投影**（0.7.59+；契约纪律走 rules；Codex 才写 `.agents/skills/`） |

## 真人验收（磁盘有文件 ≠ 会话已生效）

1. rules 镜像 / hooks 均为生成物：改配置只改 SSOT `docs/agent-config/`，跑 `node scripts/agent-config/sync.mjs`
2. hooks 写入 `settings.json` 后，在 Qoder 的 hooks / 设置面板**确认已应用**（保存 ≠ 热加载；必要时重载窗口）
3. MCP：首次连接需审批；local > project > user 优先级；密钥优先 `${VAR}`
4. `sync.mjs --check` 校验漂移后再提交

## 非目标 / 禁止

- **不**生成 `.qoder/hooks.json`（那是 Cursor 协议；Qoder 不读）
- **不**镜像 `.mdc`（Qoder 用 `.md`；FM 已 strip，`1x` 指针除外按需）
- **不**生成 `settings.local.json`（本地覆盖留给用户）
- Codex / Trae / CodeBuddy 各见对应 PARITY 页；本页只管 Qoder

## 升级提示

L5 仓升级 harness-eng 后：刷新 `scripts/agent-config/sync.mjs`（模板随版本更新）→ `node scripts/agent-config/sync.mjs` → 面板复核 hooks 生效。
