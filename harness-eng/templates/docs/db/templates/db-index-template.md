# 表结构索引模板（db.md）

> 本模板用于 `docs/db/db.md`。  
> **索引不是 SSOT**：建表语句与字段说明写在 `docs/db/table/`。  
> **禁止**在本文件展开完整 CREATE TABLE 或字段清单。  
> 新建/删除表时必须同步更新本导航。  
> 表真相文件名须为 `NN-{table}.md` / `NN-{table}_change.sql`（序号与下表顺序一致）。

---

# {{REPO_NAME}} 表结构索引

> 真相文档位于 `docs/db/table/`。改表前：先读本索引定位表，再读对应真相；改表后：更新对应 `table/NN-{name}.md` + `NN-{name}_change.sql`。

## 读文档说明

- 索引：本文件（导航）
- 真相：`docs/db/table/NN-{table_name}.md`
- 变更 SQL：`docs/db/table/NN-{table_name}_change.sql`
- 冲突以表真相为准

## 表文档

| 表名 | 真相路径 | 说明 |
|---|---|---|
| `ai_example` | [table/01-ai_example.md](./table/01-ai_example.md) | … |

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 初始化索引 | {{REPO_NAME}} | YYYY-MM-DD |
