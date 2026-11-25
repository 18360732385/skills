# {NN}-{asset} 设计资产真相

> **真相文档（SSOT）**。冲突裁决：本文件 > `design.md` 索引。

## 资产定位

| 项 | 说明 |
|---|---|
| 类型 | token / 主题 / 风格指南 / 禁用清单 / 外部平台（Figma·蓝湖·MasterGo 等） |
| 运行源码 | `packages/theme/src/tokens.css`（**留原地**；勿搬进 docs） |
| 归档文档 | `docs/design/modules/`（非运行文档经确认归档于此） |
| 外链 | TODO(harness-eng): 外部设计平台 URL（只索引链接，不写盘外部资产） |

## 内容

TODO(harness-eng): token 值表 / 主题明暗模式 / 字体 / 间距 / 禁用 UI 库清单与理由

## 变更触发

token / 主题 / 字体 / 禁库变更 → 先改真相，再动运行源码（rule 102 门禁）。

## 变更记录

> 新条版本号 `v{yyMMddHHmmssSSS}`（`python scripts/new_changelog_version.py --file <本文件>`），**插入表顶**；存量 `vX.Y` 不改写。

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng 初始化 | harness-eng | TODO |
