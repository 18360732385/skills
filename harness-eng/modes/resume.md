# resume（续跑）

## Done

1. 本轮 WritePlan 所列缺口路径已 `create` / `skip` / `merge`（`on_exists=skip`）
2. `docs/harness-eng/harness-meta.yaml` 已更新（`last_mode=resume`，ladder/domains 正确；若仅有遗留 `.cursor/` meta：先迁再写）
3. 对照 [ladder.md](ladder.md) 目标阶自检通过；移交 TODO 已打印

半成品 / 重复执行入口：梳理目标仓已有 harness，**只补缺口**，不覆盖用户已写章节正文（merge 规则除外）。

## 触发

- **续跑**（resume）
- 类型为 `PARTIAL`，或已有 `S_HARNESS_META` 且用户未指定纯 audit
- land 时发现目标阶梯文件已部分存在 → **自动改走 resume 语义**（`on_exists=skip`）

## 流水线

```
- [ ] 1 定根 + Fingerprint；读 docs/harness-eng/harness-meta.yaml（无则回退 .cursor/harness-meta.yaml；ladder/domains/…）
- [ ] 2 对照 ladder.md + manifest，列出「已有 / 缺口」表（按阶、按域）
- [ ] 3 展示推荐包：目标阶梯默认 = max(meta.ladder, 用户指定)；模式=resume
- [ ] 4 条件提问（缺口相关；可「全部推荐」）— 每批≤5
- [ ] 5 WritePlan：仅缺口路径；已有同构 → skip；harness-meta/gitignore → merge
- [ ] 6 确认闸门后 `scripts/harness.mjs --mode resume`（`land.mjs` 薄别名；非 L5 委托 render；L5 走 sync）：params.on_exists=skip
- [ ] 7 自检 + 更新 meta.ladder / last_mode=resume + 移交 TODO
```

## 与 land / upgrade 边界

完整边界表与升阶 Done 见 [upgrade.md](upgrade.md)。摘要：无指纹→`land`；半成品→`resume`；当前阶已齐只要再升→`upgrade`；只看报告→`audit`。

## render 参数

```json
{
  "ladder": "L4",
  "domains": ["func", "api", "db", "redis"],
  "agents_variant": "modules",
  "module_dirs": ["sms-entrance", "sms-safe"],
  "include_optional": ["rule-14"],
  "on_exists": "skip",
  "expandFromManifest": true,
  "placeholders": { }
}
```

- `on_exists: skip`（resume 默认）：目标已存在 → skip，不报错  
- `on_exists: merge`：对 Markdown/MDC 走章节合并（慎用）  
- `on_exists: fail`：land 空仓默认（create 遇已存在则失败）

`harness-meta`、`.gitignore` snippet 仍按 manifest 规则 **merge**，不受 skip 影响。

## 章节级 merge 预览（0.4.0+）

Markdown/MDC 的 merge 按 **H2 章节**合并：已有章节原样保留，缺失章节追加并打 `（harness-eng 补齐）` 标记。  
确认闸门前先跑 `render.mjs --dry-run`：merge 文件的日志条目带 `mergePreview.append`（将追加章节）/ `mergePreview.keep`（已存在、保留不动），WritePlan 文件表须照此列出；真实写盘后 merge 日志同样回写 `mergePreview` 便于审计。

## 正目标

- 真相正文：只补空壳 TODO / 经用户同意的 fill；用户已写章节保留
- `.cursor/mcp.json`：非 fill-mcp 保留原文件
- 写盘：过 [write-plan.md](write-plan.md) 闸门（或已预授权）
