# fixture: 见共用 VO pointer skips missing parameter table

## 1. 详情（见共用 VO）

**功能描述:** 查询工作流详情，出参字段与共用 VO 一致。
**接口地址:** `/api/v1/workflow/detail`
**请求方式:** GET
**evidence:** `demo/WorkflowController.java#detail`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-09-22 |

### 功能逻辑
1. 按 id 加载工作流。
2. 组装 WorkflowDetailVO 返回。

### 请求参数

无请求体。

### 响应参数

见 `WorkflowDetailVO`（字段见上方共用响应体）。
