# fixture: good api fragment (acceptance should pass)

## 1. 创建会话

**功能描述:** 为当前用户创建新会话，生成 UUID 作为 conversationId。
**接口地址:** `/api/v1/conversations/create`
**请求方式:** POST
**evidence:** `demo/src/ConversationController.java#create`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-08-07 |

### 功能逻辑
1. 从上下文取 userId。
2. 规范化 title：空则「新会话」；超过 128 字符截断。
3. 插入会话记录并返回 VO。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|---|---|---|---|---|
| title | string | 否 | 会话标题；空则默认「新会话」 | 新会话 |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|---|---|---|---|---|
| data.conversationId | string | 是 | 业务会话 ID | 550e8400-e29b-41d4-a716-446655440000 |
| data.title | string | 是 | 标题 | 新会话 |
| data.status | int | 是 | 0 正常 / 2 删除 | 0 |
