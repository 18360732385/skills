# API 文档索引模板（api.md）

> 本模板用于 `docs/api/api.md`。  
> **索引不是 SSOT**：单接口契约写在 `docs/api/modules/`。  
> **禁止**在本文件展开单接口请求/响应字段表。  
> 全局约定、鉴权 Header、统一 Resp、业务错误码可保留在本索引。  
> 模块真相文件名须为 `NN-*.md`（序号与下表顺序一致）。

---

# {{REPO_NAME}} API 文档索引

> 真相文档位于 `docs/api/modules/`。改接口前：先读本索引定位模块，再读对应真相；改接口后：更新对应 `modules/NN-*.md`。

## 读文档说明

- 索引：本文件（导航 + 全局约定）
- 真相：`docs/api/modules/NN-*.md`
- 冲突以模块真相为准
- 接口章节标题格式：`## N. 标题`（见 `api-doc-template.md`）

## 服务概览

| 项 | 说明 |
|---|---|
| 服务名 | {{REPO_NAME}} |
| 端口 | TODO |
| 统一前缀 | TODO |


## 模块文档

| 模块 | 真相路径 | 基础路径 | 接口数 |
|---|---|---|---|
| 鉴权 | [modules/01-auth.md](./modules/01-auth.md) | `/api/v1/auth` | … |

## 全局约定

（鉴权 Header、Resp 结构、错误码等）

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 初始化索引 | {{REPO_NAME}} | YYYY-MM-DD |
