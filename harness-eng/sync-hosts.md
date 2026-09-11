# sync-hosts（宿主目录生成 · 0.5.2+）

从 `docs/agent-config/`（或 L3 直渲等价物）生成各 AI 工具 `.` 目录。  
**默认引擎仍是 `scripts/agent-config/sync.mjs`**；本规格描述可选的 Agent 生成路径与适配卡。

## Done

1. 目标 `ai_tools` 的 rules / hooks 配置 / MCP example（及 L5 skills）路径已对齐 [ai-tools.md](ai-tools.md)
2. hooks **脚本**与 `claude-adapter.js` 仅从模板/SSOT **拷贝**，不由模型重写
3. 若启用 Agent 生成：产出须能通过 `node scripts/agent-config/sync.mjs --check`（L5）或与 script 引擎黄金 fixture 一致

## 引擎 `Q_SYNC_ENGINE`

| 值 | 行为 |
|---|---|
| `script`【推荐】 | 跑 `sync.mjs`（幂等、`--check`） |
| `agent` | Agent Read 适配卡 + SSOT → WritePlan → 确认后写盘 → 用 script `--check` 或 fixture 验收 |

## 适配卡

目录：[templates/ai-tools/adapters/](templates/ai-tools/adapters/)。  
每张卡固定回答：rules 路径与格式、hooks 文件与事件族、MCP 路径、禁止事项、与 Cursor 的差异。

| 工具 | 卡 |
|---|---|
| cursor | `adapters/cursor.md` |
| claude | `adapters/claude.md` |
| qoder | `adapters/qoder.md` |
| trae | `adapters/trae.md` |
| workbuddy | `adapters/workbuddy.md` |
| codex | `adapters/codex.md`（P2：部分对齐） |

## Agent 模式硬约束

- **禁止**编造密钥；MCP 真密只复制 SSOT `servers.json` 或 fill-mcp 已确认内容
- **禁止**改写 gate / adapter JS 逻辑（只允许路径替换为该宿主 hooks 目录）
- 无适配卡的自定义工具：只写用户确认的入口指针，不装 hooks/MCP
- 写盘前仍走 [write-plan.md](write-plan.md) 确认闸门

## 与 land / L5

- L5：`docs/agent-config/` 为 SSOT；生成物带 GENERATED 标记
- L3/L4：无 agent-config 时仍由 `render.mjs` 直渲；Agent 模式仅建议在 L5 启用
