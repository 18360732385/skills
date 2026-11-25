# pages modules（页面真相）

- 真相文档：`NN-{page}.md`（路由 / 页面职责 / 原型映射；**文件名前缀**递增号 +1）
- 索引（非 SSOT）：[`../pages.md`](../pages.md)
- 新建真相前看 [`../templates/page-asset-template.md`](../templates/page-asset-template.md)
- inventory 扫描：`node scripts/fill-inventory.mjs --domain pages --root <TARGET>`（产物 `docs/pages/.fill-work/inventory.json`；路由声明 + 目录约定）
- merge：`node scripts/fill-merge.mjs --domain pages --inventory <inv.json> --work-dir <dir> --check|--write`
- 原型映射联动 `docs/prototype`（rule 103）；0.8.1 起计分
