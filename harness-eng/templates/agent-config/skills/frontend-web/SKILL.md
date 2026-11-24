---
name: frontend-web
description: >-
  改前端应用 / 共享包前先读分册 AGENTS 与前端契约域（design/prototype 等）。Codex 不加载 .mdc 时用本 skill；
  触及 ui / theme / api-client / types / 前端页面时使用。
---

# 前端协作（frontend-web）

> **总触发（rule 101，0.7.x 曾用 17 号）。** 权威：前端分册 `AGENTS.md`（若有）+ 前端契约域 `docs/design` / `docs/prototype`（0.8.0 启用）+ `docs/api` / `docs/func`。  
> 接口字段真相仍走 skill `api-doc-sync`；总览见 `contract-sync`。

## 读序

1. 前端分册 `AGENTS.md` 与前端 `README`
2. 改视觉 / token / 禁库：`docs/design` 索引 → 真相（rule `102`；运行源码留原地）
3. 建页面 / 对照原型：`docs/prototype` 索引 → 真相（rule `103`；原型非运行时）
4. 改 API：`docs/api` 索引 → 真相 → 前端 `types` → `api-client`（消费侧 `docs/client-api` 若启用）
5. 改业务语义：`docs/func` 索引 → 真相
6. 改视觉：只动主题 token / 设计文档；勿引入新 UI 框架

## 须同步时

改接口响应结构 → `docs/api` + `types` + `api-client`（必要时 queries）；禁库/字体/静态资源边界见分册 Never do 与 `docs/design` 真相。

## 禁止

- 重新引入仓内已禁用的 UI / 样式库（以 `docs/design` 真相 / 前端分册为准）
- 运行时加载外网字体（须自托管）
- 改接口却不同步契约与 `api-client`
- 在后端模块内放前端静态资源
- 原型 HTML / 设计文档当运行代码 import（归档资产非运行时）
