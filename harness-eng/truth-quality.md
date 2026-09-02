# 真相质量：深 · 真 · 全（0.2.18+）

填充与 promote 的验收规格。对照优秀仓契约写法；可 AI coding **仅**绑 `ai_coding_ready`（不是 coverage）。

详见执行：[fill-truths-agents.md](fill-truths-agents.md) · [fill-workers.md](fill-workers.md) · [scripts/acceptance-check.mjs](scripts/acceptance-check.mjs)。

## 深 Depth

读完能改对代码。

| 域 | 必须 | 反例 |
|---|---|---|
| api | 业务目标句（角色/场景/结果）；逻辑 ≥2 步且含分支或约束或落库/错误码之一；出参展开到业务字段或标明 stream/void | 路径回声；「调 Service 返回」；同 Controller 多方法调用糊成一串当本接口逻辑 |
| func | 每方法一句行为语义；关键路径（事务/缓存/路由）可下沉说明 | 仅类名罗列；入参只写 `req` |
| db | 最新完整 DDL；枚举/默认值业务含义；索引用途一句 | 只有列名无类型；无 COMMENT 且不标未知 |
| redis | 模式 / TTL 来源 / 读写类 / Value 字段或「不透明」/ 降级 | 只有 key 名；TTL 空节 |

## 真 Truth

可回溯到证据。

| 规则 | 说明 |
|---|---|
| evidence | api：`path/File.java#method`；func：类路径；db：migration 或 `SHOW CREATE`；redis：读写类 + 配置键 |
| draft 升格 | 启发式/关键词猜测只进 `.fill-work`，文首标 `quality: heuristic`；SSOT 只经 acceptance promote |
| 交叉一致 | 出参 ⊆ VO/表；方法 ⊆ 源码；DDL 与实据一致；TTL 与代码一致 |
| 变更记录 | SSOT 实质修改追加一行真实变更 |

## 全 Complete

| 层级 | 含义 |
|---|---|
| 文件内全 | 模板必填章齐（api：描述/地址/方法/逻辑/入参/出参/**示例值**/变更；func：服务类+方法；db：DDL+变更；redis：模式/TTL/读写/Value） |
| 模块内全 | inventory 条目全有真相，或 Plan 显式 `sample_n` / `deferred` |
| 仓内全（大仓） | **不是**千级接口一天齐；而是 **P0 金标域契约域闭环**（api+func+相关表+相关 key；有 Scheduler 时含 jobs）= 局部达标 |

## 两级产物

```text
inventory → docs/<domain>/.fill-work/   # draft（agents | heuristic）
         → acceptance-check
         → promote / merge --write（过闸）→ docs/<domain>/{modules|table|keys}/  # SSOT
```

| 位置 | 角色 |
|---|---|
| `docs/*/ .fill-work/` | draft；可含 `quality: heuristic` |
| `docs/api/modules` 等 | SSOT；仅过 acceptance 的 promote |
| `docs/harness-eng/` | 施工产物（plan/score/report），非契约 |

## 机器反例（acceptance-check）

| ID | 匹配/条件 | 级别 |
|---|---|---|
| `api-echo-desc` | 功能描述含「域接口」且「处理」路径回声 | blocker |
| `api-fake-export` | 非 export 路径/标题却写「导出 Excel」类假逻辑 | blocker |
| `api-shallow-resp` | 出参仅 `code/msg/data` 外壳且无子字段 | warning（金标=blocker） |
| `api-empty-examples` | 请求/响应参数表缺「示例值」列，或数据行示例值为空 | warning（**金标=blocker**）；显式 `未知`/`—`/`N/A`/`无` 算已填 |
| `api-logic-thin` | 无「功能逻辑」或有效步骤 &lt; 2 | blocker |
| `api-no-evidence` | 无 `**evidence:**` | blocker |
| `func-empty-semantics` | 方法说明空或等于方法名 | blocker |
| `func-empty-desc` | 方法表「功能说明」空/TODO | warning（金标=blocker） |
| `db-no-ddl` | 无 `CREATE TABLE` | blocker |
| `db-no-comment` | 无 COMMENT 且未显式「未知」 | warning（金标=blocker） |
| `redis-no-ttl` / `redis-no-rw` | 缺 TTL 或读写方 | blocker |
| `redis-no-example` | 缺 Key 示例/live/显式未知 | warning（金标=blocker） |

## Worker 答案卡（摘要）

**api 功能描述**：`[角色]在[场景]做[动作]，得到[结果]`。  
**api 逻辑**：编号步骤，含分支/约束/落库/错误码之一。  
**出入参**：展开业务字段；表须含 **示例值** 列（无证据写 `未知`/`—`，**禁止空单元格**）。  
**出参**：展开业务字段或标明 stream/void。  
完整卡见 [fill-workers.md](fill-workers.md)。
