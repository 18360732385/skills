# 01-login 页面真相（selfcheck 夹具）

## 页面定位

路由：`/login`、`/login/admin-choice`。入口文件：`packages/app/src/pages/login/LoginPage.tsx`。

## 职责

登录页负责账号密码校验与会话建立，成功后按角色跳转工作台或管理员入口选择。本夹具用于验收前端域检查器，不回落 API 语义。

## 原型映射

对照 `docs/ui-prototypes/login/`。无独立原型时须写「无原型」；本夹具指向既有原型目录。

## 变更触发

路由、入口文件或登录职责变化时改本页。

## 变更记录

| 版本 | 说明 | 作者 |
|---|---|---|
| v081 | selfcheck 夹具 | harness-eng |
