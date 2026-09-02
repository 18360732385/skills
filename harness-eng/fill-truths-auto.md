# fill-truths-auto（自动填充真相 · **legacy**）

从 inventory JSON 的 `evidence` 回溯源码，生成**草稿级**真相。  
**0.2.17+**：**不推荐**；默认引擎为 [fill-truths-agents.md](fill-truths-agents.md) + [fill-plan.md](fill-plan.md)。  
auto 仅作 legacy：优先 `--work-only` 写 `.fill-work/`，再由 agents 精修后 merge；pipeline 默认走 agents。

历史动机：大仓 seed 后形态分低；auto 可抬形态分——但也常造成出入参错挂与模板逻辑污染。

## 触发

- 用户**书面**要求自动填充 / fill-truths-auto，或 WritePlan 显式 `Q_FILL_ENGINE=auto`
- `Q_FILL_ENGINE=hybrid` 且用户要薄草稿时：**仅** `--work-only`
- fill-merge-api `--auto-fill` 内部调用同源逻辑（仍须 --check）

## 前置

1. 已跑 `fill-inventory-api|db|redis|func`（默认写出 `docs/<domain>/.fill-work/inventory*.json`；**redis 默认全模块**）
2. 【推荐】先 `fill-score` 看基线；含 db/redis 时须先过填充 MCP 闸（[fill-mcp.md](fill-mcp.md)）；未过则停留骨架（过闸后再写 SSOT 向填充）
3. MCP 不可用 → `fill-calibrate-live` 须按引擎过闸；否则停
4. WritePlan 须写明：legacy auto · 是否 `--work-only`

## 命令

```bash
# 【推荐】仅草稿
node scripts/fill-truths-auto.mjs --root <TARGET> \
  --domains api,db,redis,func \
  [--modules sms-entrance,sms-safe] \
  --work-only [--shard-size 80] [--dry-run]

# legacy：直接写/合 SSOT（须 WritePlan 显式批准）
node scripts/fill-truths-auto.mjs --root <TARGET> \
  --domains api --merge
```

`--modules` / `--module` 同义（逗号分隔）。

| 参数 | 说明 |
|---|---|
| `--merge` | 增量合并：保留人工非 TODO 段落；有新证据则替换 `TODO(harness-eng)`；输出 `stats.written/merged/unchanged` |
| `--shard-size` | func 方法数分片阈值（默认 80）；大模块写 `NN-mod-partK.md` |

| 域 | 行为 |
|---|---|
| api | 写模块真相（≥200 拆 part）+ `.fill-work/shard-*.md`；**跳过** inventory `skip: no controllers`；`--work-only` 只写 shard |
| db | 解析 CREATE TABLE + inventory `columnComments` → `docs/db/table/NN-*.md` |
| redis | 按 key 前缀分组；**始终**写 `## Key 模式` / `## Value 结构` / `## TTL`（无证据写「未知/业务 TTL」一行，TTL 节必有）；SCAN 全量实例 key **前缀归一**后再写入 SSOT |
| func | 优先读 func inventory；`--shard-size` 分片；含 **### 服务类** / **### 方法清单** |

内容 `<200` 字节的模块：**跳过**（不写空文件干扰打分）。

### Redis 前缀归一（0.2.10+）

- Redis 真相写 key **模式**（及 TTL/读写方），不以 `SCAN` 全量实例列表当正文
- 归一为前缀族（如 `SMS:user:`、`REDIS_CAPTCHA*`）再写 `## Key 模式`
- live 校准同样遵守（见 `fill-calibrate-live.mjs`）

## 与其它模式边界

| 模式 | 产出 |
|---|---|
| seed-truths | 空壳 TODO + 索引导航 |
| **fill-truths-auto** | 薄底：有证据正文（地址/方法/参数类型/逻辑片段/表字段/服务方法） |
| **fill-truths-agents** | 按模板完整档精填【深度推荐】 |
| fill-workers + merge | Agent/人工 fragment 合并；可用 `--auto-fill` 跳过人工 |
| fill-dto-batch | 批量展开 DTO 字段表（**默认多模块 Java 根**） |
| fill-calibrate-live | MCP 不可用时 SHOW CREATE / SCAN 回写真相 |
| pipeline | hybrid：薄 auto（可选）→ agents → score；auto 引擎则旧行为 |

## 闸门

仍须 WritePlan 确认后写盘（Agent 仪式）；**预授权**后同会话可自动续跑。脚本本身支持 `--dry-run`。

## 限制

- 首发面向 **Java / Spring / 手写 SQL**；非 Java 见 0.3.0
- 不编造鉴权 token / 联调 curl / 无证据的字段业务含义
- API 路径使用 inventory 已 join 的 `path`（避免 class+method 重复拼接）
- `--merge` 无法从静态代码发明 COMMENT；天花板外靠人工、fill-mcp 或 calibrate-live
