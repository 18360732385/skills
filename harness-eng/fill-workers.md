# fill-workers（并行 / 串行填充手册 · 工具无关）

主 agent 在 **fill-truths-agents** 确认后按 **fill-plan 批次 → shard** 填充。  
**契约以文件系统 + node 脚本为准**，不绑定 Cursor Task，也不依赖任何宿主「自动拉起子 agent」API。

适用：Cursor / Claude Code / Codex / Qoder / Trae / WorkBuddy·CodeBuddy / 自定义（见 [ai-tools.md](ai-tools.md)）。  
编排规格：[fill-truths-agents.md](fill-truths-agents.md) · 批次：[fill-plan.md](fill-plan.md)。

## 契约（所有工具 · 所有域）

| 规则 | 说明 |
|---|---|
| 输入 | **fill-plan 当前批次** + inventory `shards[]`；写出 `docs/<domain>/.fill-work/<shard-id>.json` |
| 输出 | **仅** `docs/<domain>/.fill-work/<shard-id>.md`（或约定 fragment 名） |
| 范围 | 只写本 shard fragment；字段/URL/密文只从本仓证据；结案范围以 Plan `sample_n`/`deferred` 为准 |
| 验收 | 对照批次 `acceptance[]` + [truth-quality.md](truth-quality.md)；`acceptance-check` 无 blocker |
| 合并 | `acceptance-check` → `fill-merge.mjs --domain <id> --check` → `--write`；api 专属 `--enrich-dto`/`--module` 仍用 `fill-merge-api`；dto-batch 按接口绑定 |
| 状态 | 只认磁盘（`.fill-work/`、`docs/harness-eng/fill-plan.yaml`、可选 `progress.yaml`） |
| 模板 | 对照目标仓 `docs/<domain>/templates/*` **完整档必填章** |
| 失败 | usage limit → `blocked`；启发式仅 draft 且 `quality: heuristic`；SSOT 只经 acceptance promote |

### 契约域 fragment 约定

域列表见 `templates/_meta/domains.yaml`。

| 域 | 工作目录 | fragment 示例 | 合并目标 |
|---|---|---|---|
| api | `docs/api/.fill-work/` | `shard-01.md` | `docs/api/modules/NN-*.md` via `fill-merge.mjs --domain api`（enrich-dto → fill-merge-api） |
| func | `docs/func/.fill-work/` | `shard-func-entrance-01.md` | `docs/func/modules/NN-*.md` via `fill-merge.mjs --domain func` |
| db | `docs/db/.fill-work/` | `shard-db-01.md` | `docs/db/table/NN-*.md` via `fill-merge.mjs --domain db` |
| redis | `docs/redis/.fill-work/` | `shard-redis-01.md` | `docs/redis/keys/NN-*.md` via `fill-merge.mjs --domain redis` |
| jobs | `docs/jobs/.fill-work/` | `shard-jobs-01.md` | `docs/jobs/tasks/NN-*.md` via `fill-merge.mjs --domain jobs` |

**jobs**：inventory 用 `fill-inventory-jobs.mjs`（输出 `scheduler_link`: `exact`\|`heuristic`\|`none`）。worker 对照 `job-template.md` 写调度面（禁止 OpenAPI 字段表）。`scheduler_link: heuristic` 时 fragment 须标 `quality: heuristic`，且**不得** merge 进 `tasks/` SSOT；核对为 exact 后再 promote。合并前 `acceptance-check --domain jobs`。

## 按 ai_tools 启动 worker（说明性 · 非门禁）

读目标仓 `.cursor/harness-meta.yaml` 的 `ai_tools`，用**已选工具**开会话。  
按 `meta.ai_tools` 开会话；无并行则同会话串行（不绑定某一宿主 Task API）。

| `ai_tools` ID | 如何开并行 worker（可选） |
|---|---|
| `cursor` | 多 Agent / Task / 多 Composer；各贴同一 Worker prompt + 不同 shard-id |
| `claude` | 多会话或多终端 |
| `codex` | 多会话 / 多实例 |
| `workbuddy` | CodeBuddy / WorkBuddy 多会话；入口 `CODEBUDDY.md` + `.codebuddy/rules` |
| `qoder` / `trae` | 各工具多会话；入口仍指向 AGENTS SSOT |
| 自定义 | 用户自备多会话；契约不变 |
| 无并行 | **默认串行** |

建议并发 **2～3**（大仓额度紧时串行）；DTO / 大 Service 降到 2。

## 失败协议（0.2.18）

1. worker 失败 / usage limit → 只重跑该 shard；批次可标 `blocked`。
2. 父会话只编排重跑；启发式草稿文首 `quality: heuristic`，仅留在 `.fill-work/`。
3. promote 前跑 `acceptance-check`（或 merge 内置闸）。

## 默认路径：同会话串行（兜底）

```
- [ ] 1 写出各 shard JSON
- [ ] 2 主会话按 shard-01…N 依次写 fragment（换 shard-id + 域）
- [ ] 3 acceptance-check；`fill-merge.mjs --domain <id> --check` → `--write`；api enrich-dto 见下节
- [ ] 4 更新 fill-plan / progress；fill-score（ai_coding_ready / gold_ratio / semantic）
```

## 可选路径：多会话并行

```
- [ ] 1 写出 docs/<domain>/.fill-work/<shard-id>.json（隶属当前 Plan 批次）
- [ ] 2 按上表启动 ≤并发上限 的 worker
- [ ] 3 收集回报或直接看磁盘：written_path, item_count, todo_count
- [ ] 4 acceptance-check → merge --write + dto-batch
- [ ] 5 fill-score + report；过闸则 close 批次
```

失败：只重跑失败 shard；精填 fragment 须过 acceptance。

## Merge 可选 DTO 补表（api）

```bash
node scripts/acceptance-check.mjs --work-dir <work> --domain api
node scripts/fill-merge.mjs --domain api --inventory inv.json --work-dir <work> --check
# api 专属 --enrich-dto / --module / --auto-fill 仍用薄包装：
node scripts/fill-merge-api.mjs ... --write --enrich-dto --source-root <java-root>
node scripts/fill-dto-batch.mjs --root <TARGET>
```

仅替换「请求参数」下仍为 TODO/空表的章节；**仅注入本接口 bodyType/返回类型**；不编造字段。

## Worker 答案卡（api · 0.2.26）

```text
你是 fill-truths-agents worker（harness-eng 0.2.26）。
只处理本 shard：docs/api/.fill-work/<shard-id>.json
只写入：docs/api/.fill-work/<shard-id>.md
质量规格：skill truth-quality.md（深·真·全）。
功能描述句式：[角色]在[场景]做[动作]，得到[结果]。
反例：路径回声；非 export 写导出 Excel；出参只写 code/msg/data（见 truth-quality）。
必填：业务语义描述、接口地址、请求方式、evidence（path#method）、
功能逻辑（≥2 有效步，含分支或约束）、请求参数表、响应参数表（展开 data）。
参数表必须含「示例值」列：每行填具体样例，或显式「未知」/「—」；禁止空单元格。
有 DTO 时展开字段表；无证据写 TODO(harness-eng)。
只写本 shard `.fill-work` fragment；字段/URL/密码只从本仓证据抽取。
完成后回报：written_path, endpoint_count, todo_count, empty_example_rows。
```
## Worker prompt（func）

```text
你是 fill-truths-agents worker（func）。
只处理：docs/func/.fill-work/<shard-id>.json
只写入：docs/func/.fill-work/<shard-id>.md
对照 docs/func/templates/func-template.md：服务类中文说明、方法功能说明+入参出参语义、能推则关联 API/表。
无证据 → `TODO(harness-eng)`；只写本 shard fragment。
回报：written_path, service_count, todo_count。
```

## Worker prompt（db）

```text
你是 fill-truths-agents worker（db）。
只处理本批表：docs/db/.fill-work/<shard-id>.json
只写入：docs/db/.fill-work/<shard-id>.md
对照 docs/db/templates/db-table-template.md：DDL（列 COMMENT 优先）、可选字段表与表级业务说明；0.3.1 起仅 DDL COMMENT 亦可过 morph/dens 字段闸；变更提示 _change.sql。
优先用 inventory / calibrate 证据；无证据标未知；只写本 shard fragment。
回报：written_path, table_count, todo_count。
```

## Worker prompt（redis）

```text
你是 fill-truths-agents worker（redis）。
只处理：docs/redis/.fill-work/<shard-id>.json
只写入：docs/redis/.fill-work/<shard-id>.md
对照 docs/redis/templates/redis-key-template.md：写前缀族模式（非 SCAN 实例列表）、`## Value`（≡ Value 结构）、TTL 节必有（项|说明即可）、Key 示例或 live 或显式未知。
无证据写「业务/运行时 TTL」；只写本 shard fragment。
回报：written_path, key_count, todo_count。
```

## 拆页（merge 后）

单模块接口数 **≥ 200**：拆为 `NN-….md` + `NN-…-part2.md`…，索引注明 part。
