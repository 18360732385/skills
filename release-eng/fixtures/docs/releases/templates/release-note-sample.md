# 发版单：release-V261126

> 状态：已定版  
> 发版日期：2026-11-26  
> 发版分支：release · 基线分支：main  
> 定版引用：origin/main .. origin/release  
> 定版时间：2026-11-24 16:40:12（Asia/Shanghai）  
> 负责人：张三

## 一、元信息

| 项 | 值 |
|---|---|
| 版本身份 | release-V261126 |
| 发版日期 | 2026-11-26 |
| 发版分支 | release |
| 基线分支 | main |
| 定版时间 | 2026-11-24 16:40:12 |
| 状态 | 已定版 |
| 上线日期 | （seal 时填；可与发版日期相同） |
| 上线执行人 | （seal 时填） |

### 上线内容摘要（1～5 项）

<!-- auto:summary:start -->

- 订单超时取消任务改为分钟级扫描并补齐补偿逻辑
- 渠道对账单新增「按日汇总」导出与差异标记
- prod 配置收敛限流与重试键，密钥改走 Nacos overlay
- 修复分页越界与统计口径漂移

<!-- auto:summary:end -->

## 二、Git 定版

> 提交列表遵循 `截断5`（≤5 全量；>5 前 3 + `…` + 后 2；hash 取前 8 位）。合并来源按分支去重全量（`origin/` 前缀归一；来源分支功能为一句话中文总结）。时区：Asia/Shanghai

<!-- auto:git:start -->

> 完整记录请登录 GitLab 查看：https://gitlab.example.com/c-be/sms-ai/-/compare/0afa1ab7...9d4b7f02

### 1、提交列表

| hash | author | date | subject |
|---|---|---|---|
| 0afa1ab7 | 张三 | 2026-11-20 10:12:03 | feat(order): 超时取消任务分钟级扫描与补偿 |
| 3c9e11d2 | 张三 | 2026-11-20 15:44:21 | fix(order): 分页越界守卫 |
| 77b0c4e1 | 李四 | 2026-11-21 09:30:55 | feat(recon): 渠道对账按日汇总导出 |
| … | … | … | （省略 9 条） |
| e2f81a3c | 李四 | 2026-11-23 18:02:47 | test: 补齐回归用例 |
| 9d4b7f02 | 张三 | 2026-11-23 21:10:36 | chore(release): 版本号与配置收敛 |

### 2、合并来源（按分支去重全量）

| 推测来源分支 | 出现次数 | 来源分支功能 |
|---|---|---|
| feature/order-timeout-cancel | 6 | 订单超时取消与补偿 |
| feature/recon-daily-export | 4 | 渠道对账按日汇总 |
| hotfix/pagination-guard | 1 | 分页越界修复 |
| 环境支/未识别（合计） | 3 | — |

<!-- auto:git:end -->

## 三、涉及服务与模块

| 服务/模块 | 是否涉及 | 说明 |
|---|---|---|
| sms-ai | 是 | 订单任务与对账单后端 |
| sms-ai-web | 是 | 对账导出入口 |
| 其它 | 否 | — |

## 四、数据库与 SQL

> 目标 profile = `prod`。**prod 先 DDL 后 DML**（各类内部按 **SQL序**）。执行序、按提交人统计与行内跳转见包内 [sql/README.md](./sql/README.md)（定版有 SQL 时生成；无 SQL 则本段注明「无」）。

<!-- auto:sql:start -->

本版 SQL：**3** 条 → 明细见 [sql/README.md](./sql/README.md)（含 DDL/DML 条数、执行序、按提交人分组）。

| # | 脚本 | 类型 | 动作 |
|---|---|---|---|
| 1 | `V0113_0__DDL__order_timeout_cancel.sql` | DDL | 新增/变更 |
| 2 | `V0113_1__DML__order_timeout_cancel_seed.sql` | DML | 新增/变更 |
| 3 | `V0114_0__DDL__recon_daily_summary.sql` | DDL | 新增/变更 |

<!-- auto:sql:end -->

## 五、配置项

> 允许含密文；来自 yml 的配置按 **YAML** 展示，键旁 `#` 为中文说明。目标 profile = `prod`。

<!-- auto:config:start -->

#### sms-ai/src/main/resources/application-prod.yml

```yaml
sms:
  ai:
    order:
      # 订单超时取消任务开关（prod）
      timeout-cancel-enabled: true
      # 扫描间隔（毫秒）；分钟级
      timeout-scan-interval-ms: 60000
    recon:
      # 渠道对账按日汇总开关
      daily-export-enabled: true
      # 差异标记保留天数
      diff-keep-days: 30
```

#### config/nacos/application-prod-nacos.yml

```yaml
sms:
  ai:
    datasource:
      # 生产库连接（密文走 Nacos）
      url: jdbc:mysql://db.prod.example:3306/sms_db_prod
      password: TODO_REPLACE_WITH_NACOS_CIPHER
```

> **上线前必办（TODO 占位 1）**：下列键值为 `TODO_*` 占位，须替换为生产真实连接（密文，窄例外已授权）后再上线。

| 键 | 来源 | 值 | 说明 |
|---|---|---|---|
| `sms.ai.datasource.password` | config/nacos/application-prod-nacos.yml | `TODO_REPLACE_WITH_NACOS_CIPHER` | 生产密码（密文） |

<!-- auto:config:end -->

## 六、定时任务

> 目标 profile = `prod`。明细（code / 名称 / cron / 默认参数 / 引用）见包内 [jobs/README.md](./jobs/README.md)。

<!-- auto:jobs:start -->

本版定时任务：**2** 条 → 明细见 [jobs/README.md](./jobs/README.md)。

| # | taskCode | 名称 | cron |
|---|---|---|---|
| 1 | `order:timeout:cancel` | 订单超时取消 | `0 */1 * * * ?` |
| 2 | `recon:daily:export` | 渠道对账按日汇总 | `0 30 2 * * ?` |

> **jobs ↔ config 交叉（本版 draft：1 个任务缺 cron 表达式键）**：下列任务的 cron 表达式键未在 prod 配置（application-prod.yml / Nacos overlay）中找到，可能由 Nacos DataId 提供，或本次未随 prod yml 上线；请勿手工编造键值。

| taskCode | cron 键 | 真相 | 说明 |
|---|---|---|---|
| recon-daily-export | `sms.ai.recon.daily.cron` | docs/jobs/tasks/02-recon-daily-export.md | 渠道对账按日汇总 |

<!-- auto:jobs:end -->

## 七、包内附属文件

> 定版拷贝 `sql/refs/` / `config/`；整理文件 `[库名]-V{yyMMdd}-DDL|DML.sql`（缺侧不落盘；无库名回落 `release-V*`；prod 先 DDL 后 DML）；统计见 [sql/README.md](./sql/README.md)；任务汇总见 [jobs/README.md](./jobs/README.md)。

<!-- auto:bundle:start -->

本版附属：SQL 原件 3 份、整理文件 2 份、配置快照 1 份、定时任务清单。

- **SQL 原件**：`sql/refs/` 共 3 份 → [sql/README.md](./sql/README.md)（DDL/DML 统计与执行序）
- **整理 · DDL**：[\[sms_db_prod\]-V261126-DDL.sql](./sql/%5Bsms_db_prod%5D-V261126-DDL.sql)（2 条）
- **整理 · DML**：[\[sms_db_prod\]-V261126-DML.sql](./sql/%5Bsms_db_prod%5D-V261126-DML.sql)（1 条）
- **配置快照**：`config/` 共 1 份
- **定时任务**：2 项 · [jobs/README.md](./jobs/README.md)（code / 名称 / cron / 默认参数）

<!-- auto:bundle:end -->

## 八、第三方与外部依赖

| 依赖 | 变更说明 | 已确认 |
|---|---|---|
| dashscope | 对账摘要改走 dashscope 新版 SDK（同参数） | 是 |

## 九、上线步骤与回滚

<!-- manual:start -->

### 1、步骤

1. 停调度（关 quartz 消费）并等待在跑任务收尾
2. prod 执行 DDL 整理文件，随后执行 DML 整理文件（内部均按 SQL序）
3. 发布 sms-ai 与 sms-ai-web（滚动重启），核对 Nacos 密钥占位已替换
4. 打开订单超时取消任务开关并观察首轮扫描日志

### 2、回滚

- 应用：回滚至上一镜像 tag，配置键回退（timeout-cancel-enabled=false）
- 数据：本版 DDL 含新增列，不回滚数据；对账汇总差异标记保留
- 任务：关闭 daily-export-enabled，等待补数窗口再开启

<!-- manual:end -->

## 十、风险与验收

<!-- manual:start -->

### 1、风险

- 超时取消扫描改为分钟级，首轮可能集中触发补偿，需观察补偿表写入速率
- Nacos 密钥占位未替换会挡启动，上线前必须完成（见「配置项」TODO 表）

### 2、验收

- [ ] 订单超时取消任务首轮扫描无异常日志，补偿记录数符合预期
- [ ] 渠道对账按日汇总导出文件行数与差异标记数正确
- [ ] 分页接口边界用例（首行/末行/越界）全部通过

<!-- manual:end -->
