# client-api modules（前端契约消费真相）

- 真相文档：`NN-{consumer}.md`（端点消费表 / 契约回链；**文件名前缀**递增号 +1）
- 索引（非 SSOT）：[`../client-api.md`](../client-api.md)
- 新建真相前看 [`../templates/client-api-asset-template.md`](../templates/client-api-asset-template.md)（**双态**：fullstack 回链 / 纯前端字段级，按 `harness-meta.repo_kind` 选态）
- **分工（fullstack）**：提供侧契约走 `docs/api`（rule 12）；本域只管消费侧（api-client / types / queries）
- inventory 扫描：`node scripts/fill-inventory.mjs --domain client-api --root <TARGET>`（产物 `docs/client-api/.fill-work/inventory.json`；导出方法 + hooks 清单）
- merge：`node scripts/fill-merge.mjs --domain client-api --inventory <inv.json> --work-dir <dir> --check|--write`
- 0.8.1 起计分
