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

---

## 2. 列出会话（7 列样例）

**功能描述:** 分页列出当前用户会话，供侧栏展示。
**接口地址:** `/api/v1/conversations/list`
**请求方式:** POST
**evidence:** `demo/src/ConversationController.java#list`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 7 列夹具 | harness-eng | 2026-09-17 |

### 功能逻辑
1. 校验分页参数。
2. 按 userId 查询未删除会话。
3. 返回列表与总数。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| page | int | 否 | 页码 | — | 从 1 起；默认 1 | 1 |
| page_size | int | 否 | 每页条数 | — | 默认 20，最大 100 | 20 |
| status | int | 否 | 会话状态过滤 | `0`=正常 / `2`=删除 | 缺省不过滤 | 0 |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| data.total | int | 是 | 总条数 | — | — | 3 |
| data.items | array | 是 | 会话列表 | — | 元素见叶子 | — |
| data.items[].conversationId | string | 是 | 业务会话 ID | — | — | 550e8400-e29b-41d4-a716-446655440000 |
| data.items[].title | string | 是 | 标题 | — | — | 新会话 |
| data.items[].status | int | 是 | 会话状态 | `0`=正常 / `2`=删除 | — | 0 |
