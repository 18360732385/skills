# Redis 文档索引模板（redis.md）

> 本模板用于 `docs/redis/redis.md`。  
> **索引不是 SSOT**：Key 契约写在 `docs/redis/keys/`。  
> **禁止**在本文件展开 value JSON 字段表。  
> 新建/删除 Key 族时必须同步更新本导航。  
> Key 真相文件名须为 `NN-{family}.md`（序号与下表顺序一致）。

---

# {{REPO_NAME}} Redis 索引

> 真相文档位于 `docs/redis/keys/`。改 Redis Key 前：先读本索引定位 Key 族，再读对应真相；改后：更新对应 `keys/NN-{family}.md`。

## 读文档说明

- 索引：本文件（导航 + 连接约定）
- 真相：`docs/redis/keys/NN-{family}.md`
- 冲突以 Key 真相为准

## 连接概览

| Profile | 模式 | database |
|---|---|---|
| local | standalone | 0 |

## Key 文档

| Key 族 | 真相路径 | 说明 |
|---|---|---|
| `login_tokens` | [keys/01-login_tokens.md](./keys/01-login_tokens.md) | … |

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 初始化索引 | {{REPO_NAME}} | YYYY-MM-DD |
