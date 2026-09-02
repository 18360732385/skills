# fixture API 样例（fill-score 格式自检）

> 非业务真相。用于验证打分器兼容 api-doc-template 写法。

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | fixture | harness-eng | 2026-08-05 |

---

## 1. 样例列表

**功能描述：** 分页查询样例  
**接口地址：** /api/sample/list  
**请求方式：** POST  
**evidence:** `fixtures/SampleController.java#list`

### 功能逻辑

- Controller 委托 SampleService 查询并返回分页

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码 |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| code | string | 是 | 业务码 |
