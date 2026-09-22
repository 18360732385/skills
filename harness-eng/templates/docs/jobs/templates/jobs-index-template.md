# 定时任务索引模板（jobs.md）

> 本模板用于生成或修订 `docs/jobs/jobs.md`。  
> **索引不是 SSOT**；单任务调度契约真相在 `tasks/NN-{slug}.md`。

---

# {项目名} 定时任务索引

> **本文件是索引，不是 SSOT。** 调度契约真相位于 [`docs/jobs/tasks/`](../tasks/)。  
> 改 Cron / 增删任务 / 改开关前：先读本索引定位 task，再读对应真相；改后：更新对应 `tasks/NN-*.md`（新建/删任务时再改本导航）。

## 读文档说明

- **索引**：本文件（导航 + 全局约定）
- **真相**：`docs/jobs/tasks/NN-{slug}.md`（两位序号与下表顺序一致）
- **冲突裁决**：任务真相 > 本索引；**调度契约** > func/api 中的 Cron 摘录（func/api 只保留业务与 REST，Cron 细节回链 jobs）
- **禁止**在本文件展开单任务完整 Cron / 默认参数表（可保留错峰总览）
- 真相模板：[`job-template.md`](./job-template.md)
- 业务方法 / REST / Key / 表仍以 `docs/func|api|redis|db` 为 SSOT

## 全局约定

| 项 | 说明 |
|---|---|
| 调度框架 | TODO（如 Spring `@Scheduled`） |
| 执行器 | TODO（统一执行器：锁 / job_log / checkpoint） |
| 多实例 | TODO（分布式锁 Key 族 → 回链 `docs/redis/keys/`） |
| 新增任务四件套 | 任务码枚举 · Scheduler · 配置 cron/enable · Metadata Registry（**另须**本域真相） |

### 纪律（Never do）

- 只改 Cron 表达式却不同步 Registry / jobs 真相
- 在 Scheduler 方法内再加一层与统一执行器重复的锁
- 把业务方法清单 / OpenAPI 字段表写进 jobs 真相
- 假定全局 `*.enabled=false` 时，带**独立开关**的任务也会停（各 task 开关语义以真相为准）

## 任务文档

| # | 显示名 | task_code | 真相路径 | engine | mode |
|---|---|---|---|---|---|
| 01 | … | … | [tasks/01-….md](../tasks/01-….md) | … | … |

详见 [tasks/README.md](../tasks/README.md)（若有）。

## 关联文档

| 文档类型 | 路径 |
|---|---|
| 功能资产 | `docs/func/modules/…`（回链） |
| API | `docs/api/modules/…`（回链） |
| Redis 锁 | `docs/redis/keys/…`（回链） |
| checkpoint / job_log | `docs/db/table/…`（回链） |

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v1.0 | 新增 | 初版索引 | TODO | YYYY-MM-DD |
