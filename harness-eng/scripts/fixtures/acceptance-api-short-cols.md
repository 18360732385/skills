# fixture: 表行列数不足 should report explicit issue (not empty 示例假阳性 alone)

## 1. 缺列

**功能描述:** 故意缺列，验收应报表行列数不足。
**接口地址:** `/api/v1/demo/short-row`
**请求方式:** POST
**evidence:** `demo/ShortRowController.java#run`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-09-22 |

### 功能逻辑
1. 接收 name。
2. 返回结果。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|---|---|---|---|---|
| name | string | 是 | 名称 |

### 响应参数

无请求体。
