# 身份用 yyMMdd；prepare 吞掉 resume；快照要对账

版本身份固定为 `release-V{yyMMdd}`（由发版日期导出）。改日期则改路径：未定版可迁/重建，已定版须确认。同一日历日只允许一包进行中。对外模式去掉 `resume`：同身份已存在则 prepare 即刷新。仓内脚本快照保留，并做 VERSION/`--check`；mismatch 默认挡写盘，可用 `--allow-drift` 书面放行。

**Status**: accepted

**Considered Options**:
- 身份继续用分支归一化 → 拒绝（ADR 0002）
- 同日多包用 `-2` 后缀 → 拒绝（改日期或先处理旧包）
- 保留独立 resume 模式 → 拒绝（减模式面；刷新并入 prepare）
- 快照不对账 / 取消快照 → 拒绝（sms-ai 版差分叉已发生）

**Consequences**:
- conventions ①② 重写；分支名只作元信息与 push-gate 输入，不再当路径
- AGENT-INDEX / SKILL 模式表删 resume 行，行为并入 prepare
- 消费仓 `scripts/release-eng/VERSION` 与 skill manifest 对齐；prepare 写盘前 check
