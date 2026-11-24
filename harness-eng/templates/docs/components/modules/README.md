# components modules（组件真相）

- 真相文档：`NN-{component}.md`（组件定位 / 用途 / props 变体 / token 依赖；**文件名前缀**递增号 +1）
- 索引（非 SSOT）：[`../components.md`](../components.md)
- 新建真相前看 [`../templates/component-asset-template.md`](../templates/component-asset-template.md)
- inventory 扫描：`node scripts/fill-inventory.mjs --domain components --root <TARGET>`（产物 `docs/components/.fill-work/inventory.json`；只盘点，props 表由 agents 精填）
- merge：`node scripts/fill-merge.mjs --domain components --inventory <inv.json> --work-dir <dir> --check|--write`
- token 依赖联动 `docs/design`（rule 102）；0.8.1 起计分
