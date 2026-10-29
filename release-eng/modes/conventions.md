# 约定 SSOT（release-eng conventions）

本文件是 release-eng 全部「约定」的**唯一权威 SSOT**：发版日期算法、版本身份归一化、目录包构成、Git 定版展示、目标 profile、SQL 序与整理、密文、notes/ 兼容层、repo-profile、逾期硬闸书面跳过。  
skill 侧其它文档（SKILL / README / QUICKSTART / AGENT-INDEX / modes/*）遇到上述约定**只引用本文件、不复述**；行为性内容（硬闸、Red Flags、借口表、步骤、出口、Done、确认词表、问卷题面、AskQuestion 形态）仍在各 mode 规格原位。  
**例外**：fixtures 种子（`fixtures/docs/releases/templates/` 模板、`fixtures/docs/releases/releases.md`）随骨架落到目标仓后没有 skill 文档可引用，必须**自包含**，允许复述本文件约定；改约定时须同步改 fixtures 种子。

## ① 发版日期算法

首问 **`发版日期`**【推荐】= **第一个满足 `日期 ≥ 提问日 + 2 天` 的周四**（提问日 = 本地日历日；口语可称「下周四」）。发版日期为独立元信息字段，**不拼入目录名**；改 `发版日期` 只更新元信息日期字段，不影响路径与版本身份。

| 提问日（例） | 提问日+2 | 推荐周四 |
|---|---|---|
| 周二 Aug 18 | Thu Aug 20 | Aug 20（本周四） |
| 周三 Aug 19 | Fri Aug 21 | Aug 27 |
| 周四 Aug 20 | Sat Aug 22 | Aug 27 |
| 周五 Aug 21 | Sun Aug 23 | Aug 27 |

## ② 版本身份与目录包

- **版本身份 `<slug>` = 发版分支名归一化**：去 `origin/`、`refs/heads/`、`refs/remotes/` 前缀；`/` → `-`；连续 `-` 收敛为一个。如 `origin/release/V260827` → `release-V260827`。身份与 `发版日期` 解耦。
- **目录包** `docs/releases/<slug>/`（与 `archive/`、`templates/`、索引 `releases.md` 并列，**无 notes/ 中间层**）构成：
  - 同名发版单 `docs/releases/<slug>/<slug>.md`
  - `sql/refs/`：本版新增 SQL 原件
  - `sql/release-V{yyMMdd}-DDL.sql` / `sql/release-V{yyMMdd}-DML.sql`：整理文件（按侧生成）
  - `config/`：本版新增配置原件
  - `jobs/README.md`：任务汇总清单（不逐份拷贝真相）
  - `artifacts.json`：发版制品清单 SSOT
  - 包内附属文件在发版单中以**相对 md 链接**引用

## ③ Git 定版展示

- **`截断5`**（提交列表写入发版单时强制）：≤5 条全量；>5 条展示**前 3 + 一行 `…`（省略 N 条）+ 后 2**；hash 列展示**前 8 位**（截断自 `git %H`，如 `0afa1ab7`）；JSON 可保留全量 hash。省略行下方补「完整记录请登录 GitLab|GitHub|远端仓库 查看：<url>」——**远端链接按 origin 宿主**（GitLab / GitHub；freeze 字段名仍可能叫 `gitlabUrl`）。
- **`mergeSources`**（合并来源）：按推测来源分支**去重全量**，`origin/`、`refs/remotes/`、`refs/heads/` 前缀归一（如 `code-scaffold` ≡ `origin/code-scaffold`，计数合并）；空归「无/未识别」；JSON 全量保留；发版单表优先业务支，噪声（环境支/未识别/`merge/*`）折叠为「环境支/未识别（合计）」一行。
- **来源分支功能**：一句话中文，≤28 字；优先中文关键词映射分支名，其次以样例提交主题收成业务短句。
- **时区**：定版时间与提交 `date` 列一律 **Asia/Shanghai**。
- 发版单一级标题「一、二、三…」；上线内容摘要 1～5 项**分支级聚合**，并入元信息章内 `### 上线内容摘要`。

## ④ 目标 profile = prod

SQL / 配置 / 定时任务**一律目标 `prod`**。配置仅 `application-prod.yml` 与 nacos prod overlay（`config/nacos/application-prod-nacos.yml`；包内拍平文件名 `application-prod-nacos.yml` 亦视为 prod 层）进 draft / 发版单；其余 config 层（非 prod 的 `application*.yml`、`.env`、`*secret*` 等）→ `layerSuppressed`（`non-prod-layer`）。yml 配置按 YAML 展示，注释写在**键上一行 `#`**（采集亦可来自行尾 ` #`）。

## ⑤ SQL序与整理

- SQL 候选与「数据库与 SQL」执行序一律按 migration **版本号数字升序**（`SQL序`）。
- `docs/db/table/*_change.sql` **仅作对照**，不进 `sql/refs/` 与整理文件。
- 整理文件 `sql/release-V{yyMMdd}-DDL|DML.sql` 按 `__DDL__`/`__DML__`（或新轨 `V{ts}_{0|1}__`）双轨归类，**缺侧不落盘**。
- **prod 执行顺序：先 DDL 整理文件，再 DML**（各类内部仍按 SQL序）。

## ⑥ 密文策略

「配置项」章与 `artifacts.json` **允许密文值**；索引（`releases.md`）与白话摘要**只列密文键名，不展开密文正文**。

## ⑦ notes/ 旧路径兼容层（deprecation）

`docs/releases/notes/` 为旧路径：**0.3.27 起不再新建**（进行中目录包直接挂在 `docs/releases/<slug>/`）。脚本（note-merge / seal-check / 逾期扫描）**兼容读**旧 `notes/`（目录包与扁平 md）；兼容读代码**计划于 0.4 移除**，旧仓应迁至新路径后再续跑。

## ⑧ repo-profile 覆盖文件

目标仓可放 `docs/releases/repo-profile.json` 覆盖内置默认（源仓硬编码外置）。字段：`branchSlugCn`（分支名→中文功能映射）/ `syncTaskCodeFallbackPaths` / `knownServices`（服务推断已知清单）/ `configCatalogFiles`（配置说明目录）/ `thirdPartyKeywords` / `moduleBlurbs`（模块一句话）/ `artifactKeyPrefixes`。加载时 strip BOM、与内置默认**深合并**（profile 优先）；文件缺失或非法 JSON 时**回退内置默认**。

## ⑨ 逾期硬闸书面跳过

freeze `overdueHardGate=true`（进行中目录包已定版且发版日期已过）时：仅用户**书面说明** + note-merge 带 **`--overdue-waived "<书面说明>"`** 才能写盘；跳过记录写入 `artifacts.json.overdueWaived{reason,date}`。未传该参数时 note-merge **拒绝写盘**（exit 1）。口头豁免一律无效（硬闸语义见 [gates-common.md](gates-common.md)）。

## 变更记录

- 0.3.32 建立本 SSOT（复述自 SKILL / gates-common / README / QUICKSTART / freeze / idempotency / questions，收敛于此）。
