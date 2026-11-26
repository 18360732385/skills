# 幂等（release-eng）

## on_exists

| 值 | 行为 |
|---|---|
| **merge**（默认） | 刷新自动段；保留人工段；刷新包内附属拷贝（仅本版新增；不含 candidates） |
| **skip** | 已存在则只报告路径 |
| **fail** | 已存在则中止，要求新 identity |

未指定则 merge。同身份已存在时 prepare 默认 merge（刷新）。

> **警示**：`merge` 刷新会**先清空包内 `sql/` / `config/` / `jobs/` 三个目录再重建**（← `draft`）；手工放入这三个目录的文件会被清除——勿在其中存放手工产物。

## 键

`docs/releases/<identity>/<identity>.md`（同目录包）= 同一发版单；`<identity>` = `release-V{yyMMdd}` ← 发版日期，见 [conventions.md](conventions.md)。  
`发版日期` 来自 gates-common 首问（【推荐】≥提问日+2 的第一个周四）；**进入版本身份**；改日期即改路径。

## 段

- **自动**：Git 定版二表（提交 `截断5`；合并来源 `mergeSources` 只算对比版本之后新增、按分支去重）、元信息内上线内容摘要（← 分支级聚合，≤5）、数据库与 SQL（前 5 条样表 + 条数 + 链到 `sql/README.md`）/ 配置项（YAML 仍展开）/ 定时任务（前 5 条样表 + 条数 + 链 `jobs/README.md`）、包内附属（逐项清单，一行一类）、元信息中的定版时间（Asia/Shanghai）/引用/`发版日期`、涉及服务说明（← AGENTS）；**不**再生成「附录：关联契约与规划」；展示与格式细则见 [conventions.md](conventions.md)
- **人工**：`<!-- manual:start -->`…`<!-- manual:end -->` 内正文；无标记时「上线步骤与回滚 / 风险与验收」已有非空正文默认保留
- **不自动写入**：`draftSuppressed`（prior 已上线项）除非用户明示拉回  
