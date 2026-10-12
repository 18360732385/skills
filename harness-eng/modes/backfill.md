# backfill（探针回灌）

## Done

1. 已读探针 findings（文件或目录）
2. stdout 已打印 WritePlan（待改 SSOT 路径按域归类）
3. **未写盘**；用户确认后再改 SSOT / merge

## 触发

- 冷会话探针产出 findings，需回灌契约文档
- 用户书面「按探针改 SSOT / backfill」

## 流水线

```
- [ ] 1 定根 + findings 路径
- [ ] 2 node scripts/harness.mjs --mode backfill --root <TARGET> --findings <path>
- [ ] 3 展示 WritePlan；确认闸门后手改 SSOT（本模式不 render）
- [ ] 4 fill-merge / fill-score 复核
```

## CLI

```
node scripts/harness.mjs --mode backfill --root <TARGET> --findings <file|dir>
```

findings 支持：

- JSON 数组（字符串路径，或 `{ path|file|ssot }`）
- 明文行内 `docs/**/*.md`

## 与 land / resume

| 场景 | 用 |
|---|---|
| 无 harness / 要落骨架 | `land` / `resume` |
| 仅探针结论回灌文档 | `backfill` |
