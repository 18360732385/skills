# 发版单模板

> 路径：`docs/releases/notes/<slug>/<slug>.md`（同名目录包；`<slug>` = **发版分支名归一化**：去 `origin/`、`/` → `-`；`发版日期` = gates-common 首问，【推荐】≥提问日+2 的第一个周四，为独立元信息字段、不拼入目录名）  
> 同目录可含本版新增的 `sql/` / `config/`（定版时自 draft 拷贝；不含扫描涉及文件）与任务汇总 `jobs/README.md`。  
> 由 `release-eng` 按此骨架生成/合并。一级标题用「一、二、三…」；子节用「1、2、3…」。  
> 时间一律 **Asia/Shanghai**。上线内容摘要（1～5 项，**分支级聚合**）并入元信息；提交列表 **`截断5`**（前 3 后 2，hash 前 8 位）；合并来源按分支去重全量（`origin/` 归一；「来源分支功能」一句话中文）；SQL / 配置 / 定时任务目标 profile = **`prod`**；yml 配置按 YAML 且注释在键上一行 `#`；SQL 按 **`SQL序`**。  
> 自动段可由 `release-note-merge.mjs` 刷新（`<!-- auto:* -->` 标记内）；`manual` 段保留。

```markdown
# 发版单：<slug>

> 状态：准备中 | 已定版 | 已上线 | 已取消  
> 发版日期：YYYY-MM-DD  
> 发版分支：… · 基线分支：…（首次发版填「无」）  
> 定版引用：origin/… .. origin/…  |  首次发版:<headRef>  
> 定版时间：…（Asia/Shanghai）  
> 负责人：…

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | <slug> |
| 发版日期 | YYYY-MM-DD |
| 发版分支 | |
| 基线分支 | （首次发版填「无」） |
| 定版时间 | |
| 状态 | |
| 上线日期 | （seal 时填；可与发版日期相同） |
| 上线执行人 | （seal 时填） |

### 上线内容摘要（1～5 项）

<!-- auto:summary:start -->

- （← 分支级聚合：合并来源一句话总结为主，非合并提交业务短语补足；最多 5 条）

<!-- auto:summary:end -->

## 二、Git 定版

> 提交列表遵循 `截断5`（≤5 全量；>5 前 3 + `…` + 后 2；hash 前 8 位）。合并来源按分支去重全量（`origin/` 归一；来源分支功能一句话）。时区：Asia/Shanghai  
> 完整记录：<gitlabUrl>

<!-- auto:git:start -->

### 1、提交列表

| hash | author | date | subject |
|---|---|---|---|
| | | | |

### 2、合并来源（按分支去重全量）

| 推测来源分支 | 出现次数 | 来源分支功能 |
|---|---|---|
| | | |

<!-- auto:git:end -->

## 三、涉及服务与模块

| 服务/模块 | 是否涉及 | 说明 |
|---|---|---|
| sms-ai | | （← AGENTS/README 一句话） |
| sms-ai-web | | |
| 其它 | | |

## 四、数据库与 SQL

> 按 **SQL序**（`Vn` 数字升序；无版本号置后并注明依赖）填写执行序；目标 profile = `prod`。

<!-- auto:sql:start -->

| 执行序 | 脚本/版本 | 动作 | 目标 profile | 已确认 |
|---|---|---|---|---|
| 1 | | 新增/变更/无 | prod | |

<!-- auto:sql:end -->

## 五、配置项

> 允许含密文；来自 yml 的按 YAML 代码块展示，键上一行 `#` 为中文说明。目标 profile = `prod`。

<!-- auto:config:start -->

#### path/to/application-prod.yml

```yaml
sms:
  ai:
    # 示例配置说明
    example: value
```

<!-- auto:config:end -->

## 六、定时任务

> 目标 profile = `prod`。本版任务汇总清单（code / 名称 / cron 表达式 / 默认参数 / 引用链接）见包内 [jobs/README.md](./jobs/README.md)。

<!-- auto:jobs:start -->

| task / cron 键 | 变更类型 | 说明 | 目标 profile | 已确认 |
|---|---|---|---|---|
| | 新建/改 Cron/开关/无 | | prod | |

<!-- auto:jobs:end -->

## 七、包内附属文件

> 定版时仅拷贝本版新增制品到 `sql/` / `config/`（← draft；不含 candidates）；`jobs/` 为单文件汇总清单 `jobs/README.md`（不逐份拷贝真相）。包内路径为相对本发版单的 Markdown 链接。

<!-- auto:bundle:start -->

| 类别 | 包内路径 | 仓库源路径 |
|---|---|---|
| sql | [V00001__….sql](./sql/V00001__….sql) | `sms-ai/...` |

<!-- auto:bundle:end -->

## 八、第三方与外部依赖

| 依赖 | 变更说明 | 已确认 |
|---|---|---|
| | 无 / … | |

## 九、上线步骤与回滚

<!-- manual:start -->

### 1、步骤

1. …

### 2、回滚

- …

<!-- manual:end -->

## 十、风险与验收

<!-- manual:start -->

### 1、风险

- …

### 2、验收

- [ ] …

<!-- manual:end -->

## 十一、附录：关联契约与规划（可选）

| 类型 | 路径 |
|---|---|
| func/api/db/jobs | |
| superpowers | |
```
