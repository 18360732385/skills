# fixture: bad api fragment (acceptance should block)

## 1. Get Code

**功能描述:** Captcha 域接口 `getCode`，处理 `/captchaImage`。
**接口地址:** `/captchaImage`
**请求方式:** GET

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-08-07 |

### 功能逻辑
- 返回 AjaxResult；成功/失败以 Service 结果为准。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| （无 body） | — | — | — |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| code/msg/data | AjaxResult | 是 | 统一响应外壳；data 视接口而定 |

## 2. List

**功能描述:** Foo 域接口 `list`，处理 `/foo/list`。
**接口地址:** `/foo/list`
**请求方式:** POST
**evidence:** `demo/FooController.java#list`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 夹具 | harness-eng | 2026-08-07 |

### 功能逻辑
- Controller 调用 fooService.a、fooService.b、fooService.c。
- 导出路径：按查询条件生成 Excel，经 HttpServletResponse 写出（非 JSON）。
- 返回 AjaxResult；成功/失败以 Service 结果为准。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 否 | — |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| code/msg/data | AjaxResult | 是 | 统一响应外壳；data 视接口而定 |

## 3. 说明列反例（有示例值但说明烂）

**功能描述:** 管理员在后台按状态筛选用户列表，得到分页结果。
**接口地址:** `/api/v1/users/list`
**请求方式:** POST
**evidence:** `demo/UserController.java#list`

### 变更记录
| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 说明反例夹具 | harness-eng | 2026-09-17 |

### 功能逻辑
1. 校验分页与状态过滤。
2. 查询用户表并返回 VO 列表。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| page | int | 否 | page | — | — | 1 |
| status | string | 否 | 同请求 |  | — | active |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| data.total | int | 是 | 对象 | — | — | 10 |
| data.items | array | 是 | — | — | — | — |
