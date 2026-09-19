# close-ready fixture

模拟 close 完成后的 **archive** 形状：

- 主题在 `docs/runs/archive/<slug>/`（不在 active）
- `stage: done` · `gates.close` 已有 ISO 时间戳
- 主链闸时间戳齐全；`domain`/`proto` 均为 skipped
- L1 产物指针已填（spec/plan）

供 selfcheck 校验收口归档形状；**不是**真实主题。status-scan 默认只扫 active，本夹具不要求 scan 打印。
