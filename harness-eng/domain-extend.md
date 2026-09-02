# domain-extend（加契约域 checklist）

L1 文件靠 **packs** 数据展开；域名单 / 路径 / 默认 CLI 读 `domains.yaml`（**0.3.7+**）。  
形态必填章读 `morph-required.yaml`（**0.3.8+**）；`buildChecks` / 新 named 钩子仍要码。  
行为包（`kind: behavior`，如 rule 21）**不是**契约域：不加 weight / morph / acceptance，只挂 `rule_hint` + `detect`（0.3.10+）。

## Done

1. `domains.yaml` 已注册（weight / detect / truths_dir / label / 可选 inventory / scan_fill_work）
2. `domain-packs.yaml` 有该域 L1 列表 + `templates/docs/<domain>/` + rule tmpl
3. acceptance：`ACCEPTANCE_BY_DOMAIN` 增加 checker；`--domain all` 自动含新域
4. 需要 inventory 时：`fill-inventory-<id>.mjs`；合并优先 `fill-merge.mjs --domain <id>`
5. 需要形态分时：`templates/_meta/morph-required.yaml` 增加该域条目；新 `named` 钩子注册 `NAMED_TESTS`；`buildChecks` 仍要码
6. selfcheck 钉 + CHANGELOG

## 步骤

```
- [ ] 1 templates/_meta/domains.yaml：kind=contract、label、index、truths_dir、rule_id、weight、optional/detect、pack、scan_fill_work?
- [ ] 2 templates/_meta/domain-packs.yaml：索引 + README + 真相 tmpl + rule tmpl
- [ ] 3 落盘模板：docs/<domain>/…、rules/NN-*-sync.mdc.tmpl
- [ ] 4（可选）scripts/fill-inventory-<domain>.mjs → docs/<domain>/.fill-work/inventory.json
- [ ] 5 acceptance-check.mjs：ACCEPTANCE_BY_DOMAIN[<id>] = checkXxxFile
- [ ] 6 morph-required.yaml 增加域条目（re / named）；新 named → fill-score NAMED_TESTS；buildChecks 分域加项
- [ ] 7 合并：fill-merge.mjs --domain <id>（或薄包装 fill-merge-<id>.mjs）
- [ ] 8 selfcheck + CHANGELOG / VERIFY
```

## 已数据化 vs 仍要码

| 已数据化（domains.yaml / packs / morph-required） | 仍要注册/改码 |
|---|---|
| 域名单、权重、truths_dir、label | fill-score `buildChecks` |
| L1 render 文件列表 | `NAMED_TESTS` 新钩子 |
| morph `kind: re` 必填章 | acceptance 反例（ACCEPTANCE_BY_DOMAIN） |
| acceptance `--domain all` / fill-plan·seed 默认域 | inventory 扫描启发式 |
| todo 扫描真相路径、report 域列表 | — |

指针：`templates/_meta/domains.yaml` · `domain-packs.yaml` · `morph-required.yaml` · [glossary.md](glossary.md)「契约域」「packs」。
