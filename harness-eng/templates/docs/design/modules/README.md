# design modules（设计资产真相）

- 真相文档：`NN-{asset}.md`（token / 主题 / 风格 / 禁库；**文件名前缀**递增号 +1）
- 索引（非 SSOT）：[`../design.md`](../design.md)
- 新建真相前看 [`../templates/design-asset-template.md`](../templates/design-asset-template.md)
- inventory 扫描：`node scripts/fill-inventory.mjs --domain design --root <TARGET>`（产物 `docs/design/.fill-work/inventory.json`）
- merge：`node scripts/fill-merge.mjs --domain design --inventory <inv.json> --work-dir <dir> --check|--write`
