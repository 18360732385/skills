# 定时任务真相模板（tasks/NN-{slug}.md）

> 本模板用于 `docs/jobs/tasks/` 下**单个 task_code** 文档。  
> 调度契约是 jobs 域的 SSOT；索引见 `docs/jobs/jobs.md`。  
> 业务方法 / REST / Key / 表仍以 `docs/func|api|redis|db` 为准；本文只描述**调度面**。

## 文件命名（强制）

| 项 | 约定 |
|---|---|
| 文件路径 | `docs/jobs/tasks/NN-{slug}.md` |
| 序号 `NN` | 两位数字，与 [`../jobs.md`](../jobs.md)「任务文档」表顺序一致；新建取最大序号 +1 |
| `slug` | 与 cron 配置短键一致（短横线）；**勿**把 `task_code` 中的 `:` 写入文件名 |
| 正文 | 章节标题不加 `N.` |

---

# {任务中文名}

> **真相文档（SSOT）**。索引见 [`../jobs.md`](../jobs.md)。冲突以本文为准。

## 标识

| 项 | 说明 |
|---|---|
| task_code | `{真实码}` |
| 显示名 | `{Admin / Registry displayName}` |
| engine | `{引擎或 app}` |
| mode | `FULL` / `INCREMENTAL` / 其它 |
| 目标说明 | `{集合 / 图 / 缓存等}` |

## 调度入口

| 项 | 说明 |
|---|---|
| Scheduler 类 | `{…scheduler.XxxScheduler}` |
| 方法 | `{methodName}` |
| 条件装配 | `@ConditionalOnProperty(...)` 或无 |

## Cron

| 项 | 说明 |
|---|---|
| 配置键 | `{prefix}.cron.{key}` |
| cronConfigKey | `{短横线 key}` |
| 默认表达式 | `{quartz / cron}` |
| 错峰约定 | `{时刻说明或 —}` |

## 开关

| 项 | 说明 |
|---|---|
| enable 配置 | `{前缀.enabled}` |
| 默认 / 备注 | `{独立开关说明}` |

## 触发面

| 触发 | 说明 |
|---|---|
| SCHEDULED | Cron → 执行器 |
| ADMIN | `{管理端触发路径或 —}` |
| 手工 | `{有则写路径；无则 —}` |

## 默认参数

| 项 | 说明 |
|---|---|
| defaultDays / defaultHours | `{与 Scheduler + Registry 一致}` |
| 须与代码一致 | 枚举 / Scheduler 内置值 + Metadata Registry |

## 锁与审计

| 项 | 说明 |
|---|---|
| 分布式锁 | `{Key 模式}` → 回链 `docs/redis/keys/…` |
| checkpoint / job_log | 回链 `docs/db/table/…`（若有） |
| 执行器 | `{统一执行器}`（锁由执行器持有，Scheduler **勿**再加锁） |

## 代码锚点

| 项 | 路径 |
|---|---|
| 任务码枚举 | `{…SyncTaskCode 或等价}` |
| Registry | `{…MetadataRegistry}` |
| Handler | `{类名或 —}` |
| Scheduler | `{类名}` |

## 关联

| 文档 | 路径 |
|---|---|
| 功能资产 | `docs/func/modules/…` |
| API | `docs/api/modules/…` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v1.0 | 新增 | 初版调度契约 | TODO | YYYY-MM-DD |
