# fill-mcp（MCP 装配）

## Done

1. 已按 [detect.md](../modes/detect.md) **MCP 矩阵**写出应有 `{engine}-{profile}` server（或缺口已列入 `matrix_gap: no_creds`）
2. 按 `ai_tools` 写入对应真密路径（经确认）；example / 使用说明已与命名约定对齐
3. 烟测结论已写明：每个所需引擎满足 **MCP 主环境可扫库** 或 **`fill-calibrate-live` 已通**（见 **填充 MCP 闸**）

把 `mcp.json.example` 变成团队可用的多环境 MCP 配置。

## 真密 / example 路径（0.5.2+ · 按 ai_tools）

| `ai_tools` | example | 真密（gitignore） |
|---|---|---|
| `cursor` | `.cursor/mcp.json.example` | `.cursor/mcp.json` |
| `claude` / `qoder` / `workbuddy` | 根 `.mcp.json.example` | 根 `.mcp.json` |
| `trae` | `.trae/mcp.json.example` | `.trae/mcp.json` |

多选时**每个对应真密路径都写同一份 `mcpServers`**（内容一致）。路径解析 SSOT：`scripts/lib/mcp-paths.mjs`。  
`fill-calibrate-live` 按优先级读取：`.cursor/mcp.json` → `.mcp.json` → `.trae/mcp.json` → `.qoder/mcp.json`。

## 触发

- **MCP 装配**（fill-mcp）
- L4 已有 example，需要可连
- 即将进入填充且域/栈含 db·redis（**硬前置**，见闸门）

## 填充 MCP 闸（硬）

当满足任一：**契约域含 `db`|`redis`**，或 detect 有 `S_DB_ENGINE` / `S_STACK_REDIS`：

| 路径 | 条件 |
|---|---|
| **A · MCP** | 应有矩阵中每个 server 已写入真密 mcp.json；且至少一【推荐】主环境（优先 **`test`**，其次 `meta.fill_mcp_profile`，再否则列表首个有凭证环境）在本会话可调用扫库 |
| **B · calibrate-live** | 每个所需引擎已成功跑通 `fill-calibrate-live`（可按 profile） |

**A 或 B 按引擎满足即可混用。** 过闸后再执行 inventory / agents / fill-truths / pipeline-fill 步骤 4+。  
任一所需引擎两路径皆未满足，或仅「书面跳过 MCP」且无 calibrate-live → **停留骨架**并移交缺口矩阵（硬闸）。

无 db/redis 需求时本闸不适用。

## 与 fill-truths

过闸后 Agent 经 MCP（或 calibrate-live 产物）做实据：

- **mysql / postgres**：`SHOW CREATE` / 列与索引 → `docs/db/table/`
- **oracle**：以实际 Oracle MCP 工具为准 → 同目录
- **redis**：`SCAN` / `TYPE` / `TTL` → `docs/redis/keys/`

### MCP 未挂载探测

写完真密 mcp.json 后，若会话工具列表仍无对应 server：

1. 提示 **Reload Window / 新开 Agent**（【推荐】）
2. 改走 [`fill-calibrate-live.mjs`](../scripts/fill-calibrate-live.mjs)（见 `--help`）
3. 两路径皆失败 → 闸门未过，停填充

## 步骤

```
- [ ] 1 读 Fingerprint：S_DB_ENGINE / S_STACK_REDIS / S_ENV_PROFILES / 应有矩阵 / meta.ai_tools
- [ ] 2 确认 L4 example（按 ai_tools 检查各 example 路径）；按矩阵扩展 example 占位（无真密）
- [ ] 3 从本仓对应 profile 的 yml/properties **读取**连接信息
- [ ] 4 WritePlan：将写入哪些真密路径 + 哪些 {engine}-{profile} — 确认
- [ ] 5 写入（多路径内容一致）；gitignore 建议忽略各真密路径
- [ ] 6 烟测或 calibrate-live；打印矩阵覆盖表（应有 / 已有 / 缺口）
- [ ] 7 闸门未过则移交并停止填充；过闸则可供 fill-truths
```

## 命名约定

```text
mysql-dev / mysql-test / mysql-uat / mysql-local
oracle-dev / …
redis-dev / redis-test / …
```

环境名 = detect 自动发现的 profile，不以技能内固定枚举覆盖仓库。

## 主环境 `fill_mcp_profile`（0.2.26+）

| 项 | 规则 |
|---|---|
| 默认 | **`test`**（提问 `Q_FILL_MCP_PROFILE`；【推荐】test） |
| 落盘 | `docs/harness-eng/harness-meta.yaml` → `fill_mcp_profile`（读侧可回退 `.cursor/`） |
| 用途 | 烟测扫库、fill-calibrate-live、agents 实据优先用 `{engine}-{profile}`（如 `mysql-test` / `redis-test`） |
| 与矩阵 | 矩阵仍按 detect 装配多环境；**主环境 ≠ 只装一个 server** |

WritePlan 须写明：「本轮扫库/SCAN 使用 mysql-{profile} + redis-{profile}」。

## 密文策略（用户裁定）

- 从本仓已有配置读取的密码，经确认可写入目标仓 mcp.json
- 密码只从本仓抽取；他仓密钥不进入本仓；技能模板只含占位符
- land 默认只提供 example；真密须走本模式并确认

## 与 conflict-policy

- fill-mcp **经确认后可创建/覆盖**上表真密路径；已存在须在 WritePlan 标明 merge 或 backup-create
- 非 fill-mcp 路径保留已有 mcp.json
