# Redis Key 族真相模板（keys/NN-{family}.md）

> 本模板用于 `docs/redis/keys/` 下**单个 Key 族**文档。  
> Key 真相是 Redis 契约的 SSOT；索引见 `docs/redis/redis.md`。  
> 业务方法/REST 仍以 `docs/func`、`docs/api` 为准；本文只描述 Key 契约。  
> **0.3.1 计分同构**：`## Value` 与 `## Value 结构` 等价；Key 模式表「模式」列可用 `` `prefix:*` `` 以利覆盖计数；TTL「项|说明」表即可过 morph/dens。

## 文件命名（强制）

| 项 | 约定 |
|---|---|
| 文件路径 | `docs/redis/keys/NN-{family}.md` |
| 序号 `NN` | 两位数字，与 [`../redis.md`](../redis.md)「Key 文档」表顺序一致；**新建 Key 族**取当前最大序号 +1，并同步更新 `redis.md` 与 `keys/README.md` |
| 正文 | 章节标题不加 `N.` |

---

# {Key 族中文名}

> **真相文档（SSOT）**。索引见 [`../redis.md`](../redis.md)。冲突以本文为准。

## Key 模式

| 项 | 说明 |
|---|---|
| 模式 | `{prefix}:{placeholder}`（建议写成 `` `{prefix}:*` `` 以便 fill-score 覆盖计数） |
| 示例 | `…` |
| 数据结构 | String / Hash / … |
| 序列化 | `RedisTemplate` FastJSON2 / `StringRedisTemplate` 明文 JSON |

## TTL

| 项 | 说明 |
|---|---|
| TTL | … |
| 配置键 | `…` 或硬编码 |
| 实现备注 | （若有配置漂移，在此标注） |

## 读写方

| 类 | 操作 |
|---|---|
| `Xxx` | 读 / 写 / 删 |

## Value

> 章名亦可写 `## Value 结构`（与 fill-score morph 等价）。

| 字段 | 类型 | 说明 |
|---|---|---|
| … | … | … |

## 失效与降级

- 未命中时行为
- Redis 不可用时行为

## 关联文档

| 类型 | 路径 |
|---|---|
| 功能资产 | `docs/func/modules/…` |
| API | `docs/api/modules/…` |
| 索引 | `docs/redis/redis.md` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 初始化本 Key 族真相 | {{REPO_NAME}} | YYYY-MM-DD |
