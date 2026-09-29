# harness-eng Skill 优化方案（基于 sms2023-backend 实战）

> 版本目标：`0.2.2 → … → 0.2.10 → **0.2.11** → 0.3.0`  
> 依据：MATURE 仓 audit → fill-score → fill-truths（sms-entrance api）全流程 + HTML 评测报告（相对 0.2.1 缺口）  
> 增补：2026-08-05 深度执行（14 轮 / 288 文件 / 251 真相 / 15%→62%）→ **0.2.7 已落地**  
> 增补：2026-08-05 Task1–3（14 模块 quality 53% 未达标分析）→ **0.2.8 已落地**  
> 增补：2026-08-06 pipeline 实战（66% 触顶 / 任务三 12 项）→ **0.2.9 已落地 P1+P2**  
> 增补：2026-08-06 续跑校准（75% 公式天花板 / redis monorepo / MCP 未挂载）→ **0.2.10 已落地**  
> 增补：2026-08-06 HTML 可视化报告（score → harness-report-latest.html）→ **0.2.11 已落地**  
> 增补：2026-08-06 施工目录 `docs/harness-eng/` + 报告人话层 → **0.2.12 已落地**  
> 增补：2026-08-06 Report Dashboard v2（决策/诊断/任务台）→ **0.2.13 已落地**  
> 增补：2026-08-06 score-history + 趋势台 → **0.2.14 已落地**  
> 增补：2026-08-06 QUICKSTART / 进度 / suggest_upgrade / render --backup → **0.2.15 已落地**  
> 状态：**0.2.18 已落地**（2026-08-07）；**0.3.0 待做**  
> 增补：2026-08-07 **深·真·全** / acceptance-check / 金标批次 / gold_ratio → **0.2.18 已落地**  
> 增补：【推荐】**fill-mcp 先行**；MCP 不可用 → **fill-calibrate-live**；score 后【推荐】**fill-report-html**；大仓首次【推荐】**pipeline + 预授权 + 金标 + sample_n + ready@70**

---

## 0.2.10 实战增补

| 现象 | 根因（skill 侧） | 0.2.10 固化 |
|---|---|---|
| overall 卡 ~75%，摘要仍写 threshold 80% | 域分封顶加权上限≈75；与 `--threshold 80` 文案冲突 | `formula_ceiling` + ready 叙事；勿空追 overall≥80 |
| Redis inventory `redis_true=0` | 只扫首个模块；Constants 无 RedisTemplate | 默认全 `*/src/main/java`；`REDIS_*`/`SMS:` promote |
| 有 Key 仍缺 `has-ttl` | auto 仅 `ttlHits` 才写 `## TTL` | 有 Key 始终输出 `## TTL` |
| fill-mcp 后 Agent 仍扫不了库 | mcp.json 已写但会话未挂载 | `fill-calibrate-live` 直连回退 |
| fill-dto-batch 空跑 | `guessSourceRoot` 落到首模块 | 多模块 Java 根 |
| questions 推荐 land，Profile 推荐 pipeline | `recommended_when` 未优先 large_repo | large_repo → pipeline |
| Windows `node -e` / BOM JSON | 文档未强调 | answers 写文件、禁 BOM |

**明确不做（留给 0.3.0）**：非 Java 通用 inventory；大幅改写权重硬拉 overall 到 80。

---

## 落地对照

| 提案项 | 状态 |
|---|---|
| MCP 先行 + 扫库辅助 fill-truths | 0.2.2 已 |
| 取消精简档 · 完整档唯一默认 | 0.2.2 已 |
| fill-score 格式对齐 + coverage/compare/next_shards | 0.2.2 已 |
| fill-inventory-api.mjs + 一次确认多 shard | 0.2.2 已 |
| fill-merge-api + fill-workers + 拆页 + fill-progress | **0.2.3 已** |
| fill-dto-fields / fill-inventory-db | **0.2.3 已**（轻量） |
| workers 工具无关（默认串行） | **0.2.4 已** |
| redis Key inventory / ready 阈值 / merge `--enrich-dto` | **0.2.4 已** |
| fill-score db/redis 不过滤 + 域分保底 15 | **0.2.5 已** |
| seed-truths.mjs | **0.2.5 已** |
| questions.yaml + questions-next.mjs | **0.2.5 已** |
| render dry-run preview + 占位符 warning | **0.2.5 已** |
| mcp-usage-guide.md 英文文件名 | **0.2.5 已** |
| 跨工具 Hook（仅 githooks） | **0.2.5 初版 → 0.2.6 按 ai_tools 原生修订** |
| manifest/questions vendored YAML 解析 | **0.2.6 已** |
| 按 ai_tools 原生 hooks | **0.2.6 已** |
| fill-truths-auto 四域自动填充 | **0.2.7 已** |
| include_optional 布尔归一化 | **0.2.7 已** |
| inventory 默认路径 + fill-score 自动发现 coverage | **0.2.7 已** |
| fill-merge-api --auto-fill | **0.2.7 已** |
| yaml stringify / harness-meta 列表 | **0.2.7 已** |
| Redis 噪声过滤 / max-db 全量 / all_modules / fill-dto-batch | **0.2.7 已** |
| fill-inventory-func + func 打分对齐 | **0.2.8 已** |
| fill-score next_shards 序列化 / 跳过 API 空壳索引 | **0.2.8 已** |
| Redis 前缀分组 + key 级 coverage | **0.2.8 已** |
| inventory-api --all-modules / --modules 统一 | **0.2.8 已** |
| pipeline 模式 + Q_PREAUTH 预授权 | **0.2.8 已** |
| 跳过空模块 / --summary-only / 空壳 docs 探测 | **0.2.8 已** |
| **fill-truths-auto --merge + stats** | **0.2.9 已**（任务三 P1） |
| **DB 字段语义 / COMMENT 提取 + score 加分** | **0.2.9 已**（任务三 P1） |
| **Redis value/TTL 推断 + score 加分** | **0.2.9 已**（任务三 P1） |
| **inventory 退出码 0/2/1** | **0.2.9 已**（任务三 P2） |
| **API 无 Controller skip + exclude-base** | **0.2.9 已**（任务三 P2） |
| **Func --shard-size 分片** | **0.2.9 已**（任务三 P2） |
| **fill-score --verbose + miss_histogram** | **0.2.9 已**（任务三 P2） |
| **pipeline 收益递减早停** | **0.2.9 已**（任务三 P2） |
| **redis inventory monorepo 默认全模块 + promote** | **0.2.10 已** |
| **fill-truths-auto redis 始终 ## TTL** | **0.2.10 已** |
| **fill-dto-batch 多模块 Java 根** | **0.2.10 已** |
| **fill-score formula_ceiling / ready 叙事** | **0.2.10 已** |
| **fill-calibrate-live（MCP 回退）** | **0.2.10 已** |
| **questions large_repo → pipeline** | **0.2.10 已** |
| **fill-report-html + harness-report 模板** | **0.2.11 已** |
| **施工目录 docs/harness-eng + report-ui 人话层** | **0.2.12 已** |
| **Report Dashboard v2（决策/诊断/任务台 + SVG）** | **0.2.13 已** |
| **score-history.jsonl + 趋势台 / diff / run timeline** | **0.2.14 已** |
| **QUICKSTART / stderr 进度 / progress.yaml / render --backup / suggest_upgrade** | **0.2.15 已** |
| 非 Java 通用 inventory / 全链路 VERIFY | 0.3.0 |

---

## 1. 实战结论（问题从哪来）

| 现象 | 根因（skill 侧） | 影响 |
|---|---|---|
| 每批 WritePlan → 确认 → 再扫，大仓极慢 | fill-truths 规格强调「禁止一次无确认扫全仓」，但**缺少「一次确认、多批执行」与 deterministic 抽取器** | 用户成本高；会话易断 |
| Agent 手写解析漏接口（泛型 `?`、注释掉的 Mapping、错位 JavaDoc） | `fill-truths.md` 写明「专用 parser 可在后续追加」，**0.2.1 仍靠 Agent 现场写正则** | 易漏、难复验 |
| fill-score 与模板格式打架（`**接口地址：**` vs 检测器） | `fill-score.mjs` 正则与 `api-doc-template` 不一致 | Agent 为过检改格式，契约样式漂移 |
| 填了 397 接口 api 仍约 75%、overall 仍低 | 打分看「文档形态」不看「相对代码覆盖率」；func/db/redis 未联动进度 | 难回答「还差多少」 |
| 「精简档」与模板完整章节脱节 | 规格未定义档位，实战为赶进度自创精简档 | 与「按模板可 ai-coding」目标冲突 |
| 批次数多、进度靠口述 | 无 `fill-progress` 状态文件 / 无 score 前后 diff | 无法续跑、无法并行合并 |

---

## 2. 对你三点建议的回应

### 2.1 fill-score 继续优化，并与 fill-truths 强绑定（同意，优先）

**目标**：score 不只给一个分数，而成为 **进度仪表盘 + 下一批任务单**。

建议能力：

1. **双轴分**：`quality`（现有文档形态分）+ `coverage`（代码证据覆盖率）  
   - api：`docs 已登记接口数 / Controllers 抽取接口数`  
   - 输出：`covered=397, code=403?, missing_packages=[...]`（以 inventory 为准）
2. **批前后 diff**：`fill-score --compare prev.json` → `api 9%→75%, +356 endpoints`
3. **任务单输出**：`next_shards[]`（包路径、预估接口数、建议并行度）供 fill-truths / 子 agent 直接消费
4. **进度落盘（可选，经确认）**：`docs/harness-eng/progress.yaml`（0.2.12+；旧 `docs/agent-kb/fill-progress.yaml` 仅兼容）  
   - 字段：`module, domain, shards[], last_score, updated_at`
5. **格式对齐**：打分正则 **以仓内 `docs/**/templates` 为准**（或 skill 模板与打分共用同一 fixture），消灭「为过检改写法」

### 2.2 取消精简档，默认按模板完整填充（同意，作默认）

**决策**：去掉用户可见的「精简档 / 完整档」双轨；**唯一默认 = 模板完整档**。

完整档（api）最低交付（有证据才写，无证据显式 TODO）：

| 章节 | 要求 |
|---|---|
| 功能描述 / 接口地址 / 请求方式 | 必填（注解证据） |
| evidence | 必填 `path#symbol` |
| 功能逻辑 | 必填短步骤；有 Service 调用则点名 |
| 请求参数 | 有 DTO → **展开字段表**（Java 字段 / Swagger / 校验注解）；无则 `TODO` + 类名 |
| 响应参数 | 展开 `AjaxResult`/`TableDataInfo` 外壳 + data 类型字段（能解析到的） |
| 变更记录 | 模块级保留；单接口可不逐条（与模板「变更记录必填」对齐：模块文首一表即可） |

可选章节（模板中「可选」）：前置条件 / 错误与边界 / 联调示例 —— **仅当代码或既有文档有证据时填充**，禁止编造 curl token。

实现含义：完整档更依赖 **DTO 解析器**，不能只靠 Mapping 扫描；工作量上升，故必须与 §2.3 的并行/脚本化一起做，否则大仓不可用。

### 2.3 大仓分批耗时与遗漏：如何改进？能否多子 agent？（同意，推荐「脚本分片 + 子 agent 填正文」）

**结论：可以，而且应该分层，而不是让多个 agent 各自扫全仓。**

```text
inventory (确定性脚本)
    → shard plan（一次确认）
    → N × fill workers（子 agent / 同会话串行）
    → merge+verify（仅主 agent 写 SSOT）
    → fill-score（quality + coverage）
```

| 层 | 谁做 | 做什么 | 为何防漏 |
|---|---|---|---|
| Inventory | `scripts/fill-inventory-api.mjs`（新建） | 扫全部 Controller，产出 JSON：`{package, controller, http, path, method, bodyType, retType, evidence}` | 确定性；注释 Mapping 排除；支持 `AjaxResult<?>` |
| Shard | 同脚本 / WritePlan | 按包或按「≤K 接口/片」切分；**用户一次确认全部 shards** | 消除每批确认 |
| Fill worker | 子 agent（推荐）或主 agent 串行 | **只消费一个 shard JSON**，按模板写 Markdown 片段到 `docs/api/.fill-work/<shard-id>.md` | 范围闭合；互不覆盖真相主文件 |
| Merge | 主 agent + `fill-merge-api.mjs` | 校验 inventory 全覆盖 → 合并进 `01-sms-*.md` → 更新索引 | `missing = inventory - merged` 必须为空 |
| Score | fill-score | quality + coverage | 收口 |

**子 agent 使用约定（Cursor Task / parallel）**：

- 子 agent **只读**代码 + 只写 `.fill-work/`；**禁止**直接改 SSOT 与互相改同一文件  
- prompt 必含：shard JSON 路径、模板路径、完整档检查清单、evidence 纪律  
- 并发上限建议：3～5（DTO 读取与上下文爆炸）  
- 失败重试：按 shard 重跑，不整仓重来  

**不推荐**：多个子 agent 无 inventory 各自「从 Controller 目录自由发挥」——会重复编号、路径冲突、无法证明无遗漏。

---

## 3. 额外优化点（实战踩坑，建议一并纳入）

### P0（正确性）

1. **打分 ↔ 模板格式 SSOT**：统一「接口地址 / 请求方式」写法；fixture 自测  
2. **专用 API inventory 脚本**：替代 Agent 现场 Python；覆盖注释、泛型、`@ApiOperation`、method-level `@RequestMapping`  
3. **fill-truths「一次确认多批」协议**：WritePlan 列出全部 shards + 预估；确认词默认执行全队列（仍允许 `只执行 shard-3`）

### P1（进度与体验）

4. fill-score 输出 **coverage + next_shards**；与 fill-progress 互写  
5. meta 增加 `fill:` 块（last_run、domains、coverage）  
6. 大文件策略：单模块接口 ≫ N（如 200）时，允许真相拆页 `01-sms-entrance.md` + `01-sms-entrance-part2.md`（索引一行声明），避免 6000+ 行单文件拖垮上下文  

### P2（域扩展）

7. inventory/fill 扩展到 **func / db / redis**（db 优先吃 `file/**/*.sql`）  
8. fill-score 对「模块过滤导致 db/redis truths=0」给出明确提示（当前易误解为「没有真相」）

### P3（工程化）

9. `VERIFY.md` 增加 fill 烟测：小 fixture 仓跑 inventory→merge→score  
10. 文档中禁止再出现「精简档」；CHANGELOG 说明 breaking：默认完整档  

---

## 4. 版本落地路线

### 0.2.2 — Score 可信 + Inventory（建议下一版）

- [ ] 修复 `fill-score.mjs` 与 api 模板格式对齐 + fixture  
- [ ] 新增 `scripts/fill-inventory-api.mjs`（Java/Spring 首发）  
- [ ] fill-score 增加 `coverage` 与 `next_shards`  
- [ ] fill-truths.md：一次确认多批；删除精简档；完整档检查清单  
- [ ] 更新 glossary / questions（`Q_FILL_DEPTH` 删除或恒为 full）

### 0.2.3 — 并行 Fill + Merge

- [x] `scripts/fill-merge-api.mjs` + `.fill-work/` 约定（gitignore snippet）  
- [x] fill-truths 增加 worker 小节（0.2.4 改为工具无关）  
- [x] fill-progress 状态文件规格  
- [x] 大文件拆页规则  

### 0.2.4 — ready / redis / enrich / 工具无关

- [x] fill-workers 工具无关（默认串行）  
- [x] `fill-inventory-redis.mjs`  
- [x] fill-score `ready` + 可调阈值  
- [x] merge `--enrich-dto`  

### 0.2.5 — HTML 报告缺口收口

- [x] fill-score 模块过滤按域区分 + 域分保底  
- [x] `seed-truths.mjs`  
- [x] `questions.yaml` + `questions-next.mjs`  
- [x] render dry-run preview + 占位符校验  
- [x] `mcp-usage-guide.md`  
- [x] Cursor `when_ai_tools` + `.githooks` 通用软门禁  

### 0.2.6 — YAML + 按工具原生 Hooks

- [x] vendored `scripts/lib/yaml.mjs`；render / questions-next  
- [x] Claude / WorkBuddy / Codex 原生 hooks + settings merge  
- [x] gate `--claude/--codebuddy/--codex`  

### 0.3.0 — 多域 Fill 与 VERIFY 深化

- [ ] 非 Java 通用 inventory  
- [ ] func inventory 深化  
- [ ] VERIFY 全链路 fixture  

---

## 5. 关键规格片段（供改 skill 时粘贴）

### 5.1 fill-truths 确认协议（替换「每批确认」）

```text
WritePlan 一次给出：
- inventory 摘要（总接口数、包列表）
- shards[1..N]（路径、接口数、输出 fragment 路径）
- 合并后真相路径与索引改动

用户回复「确认」= 执行全部 shards（可串行或并行）。
子集：`只执行 shard-2,shard-3`。
```

### 5.2 子 agent prompt 骨架

```text
你是 fill-truths worker。只处理 shard 文件：<path/to/shard.json>
只写入：docs/api/.fill-work/<shard-id>.md
按 docs/api/templates/api-doc-template.md 完整档输出每个接口。
禁止改 SSOT 主文件；禁止编造无 evidence 的字段；无证据写 TODO(harness-eng)。
完成后回报：written_path, endpoint_count, todo_count。
```

### 5.3 coverage 计算公式（api）

```text
coverage = |merged endpoints| / |inventory endpoints|
missing  = inventory − merged   # 必须在 merge 阶段清零才算批次成功
quality  = 现有 fill-score 文档形态分（校准模板后）
ready    = quality ≥ 80 && coverage ≥ 0.9（focused 模块范围内）
```

---

## 6. 明确不做（防 scope creep）

- 不把 fill 并入 land  
- 不让子 agent 静默改 `mcp.json` / 含密配置  
- 不用「精简档」作为长期模式（临时逃生舱若保留：仅 `--emergency-slim`，默认关闭且 VERIFY 不覆盖）  
- 不在无 inventory 时宣称「已扫完」  

---

## 7. 验收标准（优化是否成功）

| 场景 | 成功标准 |
|---|---|
| 类似 sms-entrance（~400 接口） | 一次确认后，inventory→（可选并行）fill→merge→score **无遗漏**（missing=0） |
| fill-score | 展示 quality、coverage、相对上次 diff、next_shards |
| 文档形态 | 与 api-doc-template 一致；不为过检改格式 |
| 完整档 | 抽样 10 个有 DTO 的接口，字段表非空或显式 TODO+类名 |
| 子 agent | 3 shard 并行，SSOT 仅 merge 一步写入；无互相覆盖 |

---

## 8. 建议的立即决策（给你勾选）

1. **默认完整档、取消精简档** — 采纳（本方案默认）  
2. **0.2.2 先做 inventory + score coverage，0.2.3 再上子 agent** — 推荐（先正确性后吞吐）  
3. **进度文件位置**：`docs/agent-kb/fill-progress.yaml`（可见、可审）vs `.cursor/`（工具态）— 推荐 agent-kb，gitignore 不忽略  

若确认本方案，下一动作应是：在 harness-eng 仓开 `0.2.2` 实施 PR（改 `fill-*.md` + `fill-score.mjs` + 新 inventory 脚本），再用 sms2023-backend 作回归仓跑 VERIFY。
