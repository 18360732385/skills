# 幂等（release-eng）

## on_exists

| 值 | 行为 |
|---|---|
| **merge**（默认） | 刷新自动段；保留人工段；刷新包内附属拷贝（仅本版新增；不含 candidates） |
| **skip** | 已存在则只报告路径 |
| **fail** | 已存在则中止，要求新 slug |

未指定则 merge。

## 键

`docs/releases/notes/<slug>/<slug>.md`（同目录包）= 同一发版单；`<slug>` = 发版分支名归一化（去 `origin/`、`/` → `-`）。  
`发版日期` 来自 gates-common 首问（【推荐】≥提问日+2 的第一个周四），**不是**定版当天的日历日（除非用户把发版日期改成当天）；日期为独立元信息字段，不参与目录命名。

## 段

- **自动**：Git 定版二表（提交 `截断5` 前3后2 + hash 前 8 位；合并来源按分支去重（`origin/` 归一）、来源分支功能一句话）、元信息内上线内容摘要（← 分支级聚合，≤5）、数据库与 SQL / 配置项（yml→YAML，注释在键上一行 `#`） / 定时任务（← freeze `draft`；可用 `release-note-merge.mjs` 刷新 `<!-- auto:* -->`）、包内附属文件（相对 md 链接；jobs 为单文件 `jobs/README.md` 汇总清单）、元信息中的定版时间（Asia/Shanghai）/引用/`发版日期`、涉及服务说明（← AGENTS）
- **人工**：`<!-- manual:start -->`…`<!-- manual:end -->` 内正文；无标记时「上线步骤与回滚 / 风险与验收」已有非空正文默认保留
- **不自动写入**：`draftSuppressed`（prior 已上线项）除非用户明示拉回  
