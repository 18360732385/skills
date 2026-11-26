# 发版单模板

> 路径：`docs/releases/<identity>/<identity>.md`（同名目录包，直接挂在 `docs/releases/` 下，**无 notes/ 中间层**；`<identity>` = `release-V{yyMMdd}`（← 已确认发版日期）；`发版日期` = gates-common 首问，【推荐】≥提问日+2 的第一个周四，为独立元信息字段、不拼入目录名）  
> 同目录可含本版新增的 `sql/` / `config/`（定版时自 draft 拷贝；不含扫描涉及文件）与任务汇总 `jobs/README.md`；定版/归档时另生成同名 `<identity>.html` 只读渲染（md 为唯一 SSOT，html 勿手改；`note-merge --no-html` 可关闭）。  
> 由 `release-eng` 按此骨架生成/合并（**10 章**；已取消「附录：关联契约与规划」）。一级标题用「一、二、三…」；子节用「1、2、3…」。  
> 时间一律 **Asia/Shanghai**。上线内容摘要（1～5 项，**分支级聚合**）并入元信息；提交列表 **`截断5`**（前 3 后 2，hash 前 8 位）；合并来源按分支去重全量（`origin/` 归一；「来源分支功能」一句话中文）；SQL / 配置 / 定时任务目标 profile = **`prod`**；yml 配置按 YAML 且注释在键上一行 `#`；SQL 明细引导至包内 `sql/README.md`（按 **`SQL序`**）。  
> 自动段可由 `release-note-merge.mjs` 刷新（`<!-- auto:* -->` 标记内）；`manual` 段保留。  

```markdown
# 发版单：<identity>

> 状态：准备中 | 已定版 | 已上线 | 已取消  
> 发版日期：YYYY-MM-DD  
> 发版分支：… · 基线分支：…（首次发版填「无」）  
> 定版引用：origin/… .. origin/…  |  首次发版:<headRef>  
> 定版时间：…（Asia/Shanghai）  
> 负责人：…

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | <identity> |
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

<!-- auto:git:start -->

> 完整记录请登录远端仓库 查看：<gitlabUrl>

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
| （服务名） | | （← AGENTS/README 一句话） |
| 其它 | | |

## 四、数据库与 SQL

> 目标 profile = `prod`。**prod 先 DDL 后 DML**（各类内部按 **SQL序**）。执行序与统计明细见包内 [sql/README.md](./sql/README.md)（定版有 SQL 时生成）。

<!-- auto:sql:start -->

本版无新增 SQL。

<!-- auto:sql:end -->

## 五、配置项

> 允许含密文；来自 yml 的按 YAML 代码块展示，键上一行 `#` 为中文说明。目标 profile = `prod`。

<!-- auto:config:start -->

#### path/to/application-prod.yml

```yaml
app:
  demo:
    # 示例配置说明
    example: value
```

<!-- auto:config:end -->

## 六、定时任务

> 目标 profile = `prod`。明细见包内 [jobs/README.md](./jobs/README.md)。

<!-- auto:jobs:start -->

本版无定时任务变更。

<!-- auto:jobs:end -->

## 七、包内附属文件

> 定版拷贝 `sql/refs/` / `config/`；整理文件 `[库名]-V{yyMMdd}-DDL|DML.sql`（无库名回落 `release-V*`）；统计见 [sql/README.md](./sql/README.md)；任务见 [jobs/README.md](./jobs/README.md)。

<!-- auto:bundle:start -->

本版无包内附属文件。

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
```
