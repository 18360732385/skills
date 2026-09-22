# fixture: API row without trailing `|` must still parse 示例值

## 1. 无尾竖线

**功能描述:** 演示无尾 `|` 的参数表仍可解析示例列。
**接口地址:** `/api/v1/demo/no-trail`
**请求方式:** POST
**evidence:** `demo/NoTrailController.java#run`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-09-22 |

### 功能逻辑
1. 接收 id。
2. 返回详情。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|---|---|---|---|---|
| id | string | 是 | 业务主键 | demo-1

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|---|---|---|---|---|
| data.ok | boolean | 是 | 是否成功 | true
