# prototype modules（原型资产真相）

- 真相文档：`NN-{page}.md`（原型文件索引 / 页面映射 / 外链；**文件名前缀**递增号 +1）
- 索引（非 SSOT）：[`../prototype.md`](../prototype.md)
- 新建真相前看 [`../templates/prototype-asset-template.md`](../templates/prototype-asset-template.md)
- inventory 扫描：`node scripts/fill-inventory.mjs --domain prototype --root <TARGET>`（产物 `docs/prototype/.fill-work/inventory.json`；多根扫描：前端包内 + 仓根 docs）
- merge：`node scripts/fill-merge.mjs --domain prototype --inventory <inv.json> --work-dir <dir> --check|--write`
