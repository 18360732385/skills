# {NN}-{consumer} 前端契约消费真相

> **真相文档（SSOT）**。冲突裁决：本文件 > `client-api.md` 索引。
> **双态模板**：按 `harness-meta.repo_kind` 二选一填写，删掉不适用态。

## 端点消费表

| 消费方法 | 端点 | 提供侧真相 |
|---|---|---|
| TODO(harness-eng): `apiClient.xxx()` / `createUseXxx()` / `useXxx()` | `METHOD /path` | 见「契约回链」 |

## 契约回链

### 态 A — fullstack（repo_kind: fullstack）

- 提供侧真相：`docs/api/modules/NN-*.md`（rule 12 SSOT）
- **禁止**在本文件展开响应字段表；消费表只列方法与端点，字段以提供侧为准
- 改接口响应结构须两侧同步：`docs/api` → `types` → `api-client`（必要时 `queries`）

### 态 B — 纯前端（repo_kind: frontend，提供侧在外部仓/生成物）

- **字段级消费表（必填）**：从 `types` / 生成客户端**如实抄录**关键请求/响应字段
- 标注：「提供侧在外部仓（或 OpenAPI 生成物 `docs/api/generated/…`），以生成物为准」
- **禁止**虚构后端行为或字段语义；后端仓可考时回链其仓内文档路径

| 字段 | 类型 | 语义 | 来源 |
|---|---|---|---|
| TODO(harness-eng) | — | — | `packages/types/src/xxx.ts` / 生成物 |

## 变更触发

消费端点增减 / 生成客户端更新 / `types` 与真相对齐 / hooks 语义变更 → 先改真相（rule 106 门禁；fullstack 联动 rule 12）。

## 变更记录

> 新条版本号 `v{yyMMddHHmmssSSS}`（`python scripts/new_changelog_version.py --file <本文件>`），**插入表顶**；存量 `vX.Y` 不改写。

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng 初始化 | harness-eng | TODO |
