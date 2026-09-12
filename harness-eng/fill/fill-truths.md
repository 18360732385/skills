# fill-truths（契约填充）

从**本仓**代码（及可选 MCP 扫库）填充 `docs/func|api|db|redis` 真相正文。首发域：**api**。  
**填充深度：完整档（唯一默认）**——按仓内/skill 的 `docs/**/templates` 写齐必填章。

## 触发

- 用户说：填充真相 / fill-truths / 补 api 文档 / 从代码生成契约
- fill-score 指出某域过低且用户要求补齐

## 前置（填充 MCP 闸）

含 **db / redis** 域，或 detect 有库/Redis 引擎时：

1. 先过 [fill-mcp.md](fill-mcp.md) **填充 MCP 闸**（矩阵 + MCP 烟测 ∨ calibrate-live）
2. 未过闸 → 本模式停留骨架；输出矩阵缺口（过闸后再写盘填充）

无 db/redis 需求时本闸不适用。

## 流水线

```
- [ ] 1 定根；建议先 fill-score；含 db/redis 时须已过填充 MCP 闸
- [ ] 2 Q_FILL_DOMAINS / Q_FILL_MODULES / Q_FILL_MCP_FIRST
- [ ] 3 inventory：api / 可选 db / 可选 redis（默认写入 docs/<domain>/.fill-work/）
- [ ] 4 用 MCP 或 calibrate-live 扫相关表/Key（不编造）
- [ ] 5 WritePlan：一次列出全部 domains/shards — 等待确认
- [ ] 6 确认后按 `Q_FILL_ENGINE`：【推荐】fill-truths-agents；或薄底 auto；或仅 auto
- [ ] 7 `fill-merge.mjs --domain <id> --check|--write`；api 需 `--enrich-dto` 时用 fill-merge-api
- [ ] 8 可选 fill-dto-batch；拆页（≥200）；fill-progress；fill-score（ready + template_completeness）
```

深度精填见 [fill-truths-agents.md](fill-truths-agents.md)。薄底见 [fill-truths-auto.md](../fill-truths-auto.md)。  
执行细节见 [fill-workers.md](fill-workers.md)（**工具无关**：默认串行；并行可选）。

## 完整档检查清单（api）

对齐 `api-doc-template`：

| 章节 | 要求 |
|---|---|
| 功能描述 / 接口地址 / 请求方式 | 必填 |
| evidence | 必填 `path#symbol` |
| 功能逻辑 | 必填短步骤 |
| 请求参数 | DTO → 字段表（`fill-dto-fields` / merge `--enrich-dto`）；无则 TODO |
| 响应参数 | 外壳 + 能解析的 data 字段 |
| 变更记录 | 模块文首一表 |
| 可选章 | 仅有证据时填写 |

## 证据源

1. **代码**：Controller / DTO / Service / Key 常量  
2. **手写 SQL**：`fill-inventory-db.mjs`  
3. **Redis 常量**：`fill-inventory-redis.mjs`  
4. **MCP 扫库**【推荐】：mysql / redis 实况  

无证据 → `TODO(harness-eng)`。

## 一次确认 · 多 shard

「确认」= 执行全部 shards（串行或并行）。子集：`只执行 shard-N`。

## 合并

```bash
node scripts/fill-merge.mjs --domain api --inventory inv.json --work-dir docs/api/.fill-work --check
node scripts/fill-merge.mjs --domain api --inventory inv.json --work-dir docs/api/.fill-work \
  --target docs/api/modules/01-….md --write
# api 专属 --enrich-dto / --module：
node scripts/fill-merge-api.mjs --inventory inv.json --work-dir docs/api/.fill-work \
  --target docs/api/modules/01-….md --write --enrich-dto --source-root <java-root>
```

`missing` 必须为 `[]`。兼容薄包装：`fill-merge-<domain>.mjs`（prefer 统一入口）。

## 大文件拆页 / 进度

≥200 接口拆 partK。经确认可写 `docs/harness-eng/progress.yaml`。

## 本版本（0.2.4）

- workers **工具无关**（默认串行；并行仅适配说明）  
- redis inventory；ready 阈值；merge `--enrich-dto`
