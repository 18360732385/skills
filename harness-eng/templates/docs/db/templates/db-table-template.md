# 表结构文档模板

> **0.3.1 计分同构**：DDL 列上的 `COMMENT '…'` 已够 dens-comment / morph 字段闸；可选补 `## 业务说明`、`## 字段`（与 auto/workers 形状一致，非强制重复）。

## 文件命名（强制）

| 项 | 约定 |
|---|---|
| 表真相 | `docs/db/table/NN-{table_name}.md` |
| 变更 SQL | `docs/db/table/NN-{table_name}_change.sql`（与真相同序号） |
| 序号 `NN` | 两位数字，与 [`../db.md`](../db.md)「表文档」表顺序一致；**新建表**取当前最大序号 +1，并同步更新 `db.md` 与 `table/README.md` |
| 正文 | 章节标题不加 `N.`；表名本身仍为 `{table_name}`（不含 `NN-`） |

---

## 建表语句

> 以下建表语句**始终为最新完整版本**，每次变更后必须整体替换为变更后的 CREATE TABLE 语句。

```sql
CREATE TABLE `user` (
    `id`              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    `user_id`         VARCHAR(64)  NOT NULL COMMENT '业务用户唯一标识',
    `username`        VARCHAR(128) NOT NULL COMMENT '用户名称',
    `email`           VARCHAR(256)          COMMENT '邮箱地址',
    `phone`           VARCHAR(32)           COMMENT '手机号',
    `status`          TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用，2-注销',
    `password_hash`   VARCHAR(256) NOT NULL COMMENT '密码哈希值',
    `last_login_at`   TIMESTAMP             COMMENT '最后登录时间',
    `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',

    -- 索引定义
    UNIQUE KEY `uk_user_id` (`user_id`) COMMENT '业务用户标识唯一索引',
    UNIQUE KEY `uk_username` (`username`) COMMENT '用户名唯一索引',
    UNIQUE KEY `uk_email` (`email`) COMMENT '邮箱唯一索引',
    INDEX `idx_phone` (`phone`) COMMENT '手机号索引',
    INDEX `idx_status_created` (`status`, `created_at`) COMMENT '状态+创建时间联合索引（列表查询）'

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';
```

---

## 业务说明（可选）

> 表级用途一句话；无独立业务语义可写「见 DDL COMMENT / 表注释」。

…

## 字段（可选）

> 与 DDL 同源；若已在建表语句写全 COMMENT，可省略本表。列建议：`| 字段名 | 类型 | 可空 | 默认 | COMMENT/说明 |`

| 字段名 | 类型 | 可空 | 默认 | COMMENT/说明 |
|---|---|---|---|---|
| id | BIGINT | NO | | 主键ID |

---

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 创建表，初始化字段 | 张三 | 2026-04-06 11:22:30 |
| v0.2 | 修改 | 新增 email 字段，支持邮箱登录 | 李四 | 2026-04-08 13:21:05 |
| v0.3 | 修改 | status 字段新增枚举值 2（注销），原 1 含义不变 | 王五 | 2026-04-10 09:15:00 |

---

## 历史改动 SQL

> 每次表结构变更必须将完整、可执行的 SQL 脚本追加至 `NN-{table_name}_change.sql` 文件末尾。
> 每条 SQL 前须附注释头，注明版本号、变更内容、操作人、更新时间。

**文件**: `docs/db/table/01-user_change.sql`

```sql
-- ============================================================
-- v0.1 创建 user 表
-- 操作人：张三
-- 更新时间：2026-04-06 11:22:30
-- ============================================================
CREATE TABLE `user` (
    `id`              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    `user_id`         VARCHAR(64)  NOT NULL COMMENT '业务用户唯一标识',
    `username`        VARCHAR(128) NOT NULL COMMENT '用户名称',
    `phone`           VARCHAR(32)           COMMENT '手机号',
    `status`          TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `password_hash`   VARCHAR(256) NOT NULL COMMENT '密码哈希值',
    `last_login_at`   TIMESTAMP             COMMENT '最后登录时间',
    `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',

    UNIQUE KEY `uk_user_id` (`user_id`) COMMENT '业务用户标识唯一索引',
    UNIQUE KEY `uk_username` (`username`) COMMENT '用户名唯一索引',
    INDEX `idx_phone` (`phone`) COMMENT '手机号索引',
    INDEX `idx_status_created` (`status`, `created_at`) COMMENT '状态+创建时间联合索引'

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';


-- ============================================================
-- v0.2 新增 email 字段，支持邮箱登录
-- 操作人：李四
-- 更新时间：2026-04-08 13:21:05
-- ============================================================
ALTER TABLE `user`
    ADD COLUMN `email` VARCHAR(256) DEFAULT NULL COMMENT '邮箱地址' AFTER `username`,
    ADD UNIQUE KEY `uk_email` (`email`) COMMENT '邮箱唯一索引';


-- ============================================================
-- v0.3 status 字段新增枚举值 2（注销），原 0-禁用 1-启用 含义不变
-- 操作人：王五
-- 更新时间：2026-04-10 09:15:00
-- ============================================================
UPDATE `user` SET `status` = 1 WHERE `status` NOT IN (0, 1);

ALTER TABLE `user`
    MODIFY COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用，2-注销';
```

---

## 文档同步规则

以下任一变更发生时，必须同步更新本表结构文档：

- 新建数据库表
- 新增、修改、删除字段
- 修改字段类型、长度、默认值、注释、是否可空
- 新增、删除、修改索引
- 修改主键或外键约束
- 执行数据订正 SQL（UPDATE / DELETE / INSERT）
