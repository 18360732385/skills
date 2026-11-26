# 约定 SSOT（release-eng conventions）

本文件是 release-eng 全部「约定」的**唯一权威 SSOT**：发版日期算法、版本身份、目录包构成、Git 定版展示、目标 profile、SQL 序与整理、SQL 扫描（目录+格式）、密文、repo-profile、逾期硬闸书面跳过、发版单 HTML 渲染。  
skill 侧其它文档（SKILL / README / QUICKSTART / AGENT-INDEX / modes/*）遇到上述约定**只引用本文件、不复述**；行为性内容（硬闸、Red Flags、借口表、步骤、出口、Done、确认词表、问卷题面、AskQuestion 形态）仍在各 mode 规格原位。  
**例外**：fixtures 种子（`fixtures/docs/releases/templates/` 模板、`fixtures/docs/releases/releases.md`）随骨架落到目标仓后没有 skill 文档可引用，必须**自包含**，允许复述本文件约定；改约定时须同步改 fixtures 种子。

## ① 发版日期算法

首问 **`发版日期`**【推荐】= **第一个满足 `日期 ≥ 提问日 + 2 天` 的周四**（提问日 = 本地日历日；口语可称「下周四」）。脚本：`recommendedReleaseThursday()`（`release-format.mjs`）。

| 提问日（例） | 提问日+2 | 推荐周四 |
|---|---|---|
| 周二 Aug 18 | Thu Aug 20 | Aug 20（本周四） |
| 周三 Aug 19 | Fri Aug 21 | Aug 27 |
| 周四 Aug 20 | Sat Aug 22 | Aug 27 |
| 周五 Aug 21 | Sun Aug 23 | Aug 27 |

发版日期**进入版本身份**（见 ②）。改已确认的发版日期 → 改身份与目录路径：未定版可迁/重建；已定版须用户确认后再迁。

## ② 版本身份与目录包

- **版本身份 `<identity>` = `release-V{yyMMdd}`**，由已确认的 **`发版日期`（YYYY-MM-DD）** 导出（例：`2026-11-26` → `release-V261126`）。脚本：`identityFromReleaseDate()`。  
- **与发版分支名解耦**：分支只作 push-gate / freeze 输入与元信息；**不再**用分支归一化当路径（旧 `identityFromBranch` 仅兼容读）。  
- **同日一包**：同一 `yyMMdd` 进行中至多一包；冲突时先 seal / **取消发版** / 改日期。  
- **目录包** `docs/releases/<identity>/`（与 `archive/`、`templates/`、索引 `releases.md` 并列，**无 notes/ 中间层**）构成：
  - 同名发版单 `docs/releases/<identity>/<identity>.md`
  - 同名只读渲染 `docs/releases/<identity>/<identity>.html`（见 ⑩）
  - `sql/refs/`：本版新增 SQL 原件
  - `sql/[库名]-V{yyMMdd}-DDL|DML.sql`（或回落 `release-V{yyMMdd}-*`）：整理文件
  - `config/`：本版新增配置原件
  - `jobs/README.md`：任务汇总清单（不逐份拷贝真相）
  - `artifacts.json`：发版制品清单 SSOT
  - 包内附属文件在发版单中以**相对 md 链接**引用

> **0.4**：不再兼容读 `docs/releases/notes/`。旧仓先跑 `node scripts/release.mjs migrate-notes -- --root .`。

## ③ Git 定版展示

- **`截断5`**（提交列表写入发版单时强制）：≤5 条全量；>5 条展示**前 3 + 一行 `…`（省略 N 条）+ 后 2**；hash 列展示**前 8 位**（截断自 `git %H`，如 `0afa1ab7`）；JSON 可保留全量 hash。省略行下方补「完整记录请登录 GitLab|GitHub|远端仓库 查看：<url>」——**远端链接按 origin 宿主**（GitLab / GitHub；freeze 字段名仍可能叫 `gitlabUrl`）。
- **`mergeSources`**（合并来源）：**只算对比版本之后新增的 merge 记录**——对比版本取 archive 最新已上线发版单「定版引用」的 head（本地可解析且为当前 head 祖先；否则回落定版范围并 warning）。按推测来源分支**去重**，`origin/`、`refs/remotes/`、`refs/heads/` 前缀归一（如 `code-scaffold` ≡ `origin/code-scaffold`，计数合并）；空归「无/未识别」；JSON 全量保留；发版单表优先业务支，噪声（环境支/未识别/`merge/*`）折叠为「环境支/未识别（合计）」一行。
- **来源分支功能**：一句话中文，≤28 字；优先中文关键词映射分支名，其次以样例提交主题收成业务短句。
- **时区**：定版时间与提交 `date` 列一律 **Asia/Shanghai**。
- 发版单一级标题「一、二、三…」；上线内容摘要 1～5 项**分支级聚合**，并入元信息章内 `### 上线内容摘要`。

## ④ 目标 profile = prod

SQL / 配置 / 定时任务**一律目标 `prod`**。配置仅 `application-prod.yml` 与 nacos prod overlay（`config/nacos/application-prod-nacos.yml`；包内拍平文件名 `application-prod-nacos.yml` 亦视为 prod 层）进 draft / 发版单；其余 config 层（非 prod 的 `application*.yml`、`.env`、`*secret*` 等）→ `layerSuppressed`（`non-prod-layer`）。yml 配置按 YAML 展示，注释写在**键上一行 `#`**（采集亦可来自行尾 ` #`）。

## ⑤ SQL序与整理

- SQL 候选与整理文件执行序一律按 migration **版本号数字升序**（`SQL序`）。
- 发版单「数据库与 SQL」章**精简**：正文只写条数摘要 + 链接到包内 `sql/README.md`；**不**再展开执行序表。
- 「定时任务」章同样精简为条数 + 链 `jobs/README.md`；「包内附属」收成一行摘要（sql×N · config×M · …）。
- `docs/db/table/*_change.sql` **仅作对照**，不进 `sql/refs/` 与整理文件。
- 整理文件命名：`[库名]-V{yyMMdd}-DDL|DML.sql`（库名从 prod `spring.datasource.url` 解析；抽不到回落 `release-V{yyMMdd}-*`）；按 `__DDL__`/`__DML__`（或新轨 `V{ts}_{0|1}__`）双轨归类，**缺侧不落盘**。
- **prod 执行顺序：先 DDL 整理文件，再 DML**（各类内部仍按 SQL序）。
- 同时生成 `sql/README.md`：总览含**执行库 / 脱敏连接串**、DDL/DML 文件数与语句数、按提交人执行序；SQL 文件名链到整理文件 `#L<行号>`（勿手改）。
- 发版单为 **10 章**（一～十）；**不再生成**「十一、附录：关联契约与规划」。

## ⑤b SQL 扫描（目录 + 格式）

仓级记录在目标仓 `docs/releases/releases.md` 的 **`## SQL 扫描`**（不进「进行中」表列，跨版本复用）。两项都有有效值才算已记录；缺节、空值、`（未记录）`、`—`，或只记下一项，都是 **首次使用**（与「首次发版 / 基线=`无`」无关）。

| 项 | 值 |
|---|---|
| SQL 目录 | 相对仓库根的目录 |
| SQL 格式 | `flyway` 或文件名 glob |

- **`flyway`**：文件名 `/^V\d+(_\d+)?__.+\.sql$/i`（`V<数字>__.sql` / `V<数字>_<子号>__.sql`）。
- **glob**：只匹配文件名。`*` 任意一段，`?` 一个字符，大小写不敏感。例：`*.sql`、`R*.sql`。不得含 `/`、`\`、`..`。
- 已记录后，freeze / prepare / note-merge **只收录该目录之下且文件名符合该格式的文件**，不再额外要求路径含 `db/migration`。
- 不传 `--sql-dir` / `--sql-format` 且索引未记录时，脚本仍按旧规则（路径含 `db/migration` 且 Flyway 文件名），避免旧调用被改写。prepare 在索引未记录且未传这两参时 **exit 1**。
- 对得上 Flyway 文件名的，`SQL序` 与 DDL/DML 归类照旧。只符合自定义 glob、解析不出版本号的文件仍进入 SQL 候选，排序靠后，归类为「未分类」。
- 首次使用的两题在 [gates-common.md](gates-common.md) 首问里答完，并用 `release.mjs sql-profile -- --set-dir … --set-format … --apply` 写入。只答一项不落盘。

## ⑥ 密文策略

「配置项」章与 `artifacts.json` **允许密文值**；索引（`releases.md`）与白话摘要**只列密文键名，不展开密文正文**。

## ⑦ 仓内脚本快照对账

消费仓可保留 `scripts/release-eng/` 可执行快照。快照根须含 `VERSION`（与 skill `_meta/manifest.yaml` 的 `version` 对齐）。  
`release.mjs sync-scripts --check`：mismatch → 警告；**prepare 写盘前默认阻断**，除非 `--allow-drift` 或书面记录。  
`sync-scripts --apply`：从当前 skill `scripts/` 覆盖同步到仓内快照并写 `VERSION`。

## ⑧ repo-profile 覆盖文件

目标仓可放 `docs/releases/repo-profile.json` 覆盖内置默认（源仓硬编码外置）。字段：`branchSlugCn`（分支名→中文功能映射）/ `syncTaskCodeFallbackPaths` / `knownServices`（服务推断已知清单）/ `configCatalogFiles`（配置说明目录）/ `thirdPartyKeywords` / `moduleBlurbs`（模块一句话）/ `artifactKeyPrefixes`。加载时 strip BOM、与内置默认**深合并**（profile 优先）；文件缺失或非法 JSON 时**回退内置默认**。

## ⑨ 逾期硬闸书面跳过

freeze `overdueHardGate=true`（进行中目录包已定版且发版日期已过）时：仅用户**书面说明** + note-merge 带 **`--overdue-waived "<书面说明>"`** 才能写盘；跳过记录写入 `artifacts.json.overdueWaived{reason,date}`。未传该参数时 note-merge **拒绝写盘**（exit 1）。口头豁免一律无效（硬闸语义见 [gates-common.md](gates-common.md)）。

## ⑩ 发版单 HTML 渲染

- **md 是发版单唯一 SSOT**；目录包内同名 `<identity>.html` 是**只读渲染产物**（工单样式，自包含单文件，离线可读可打印），**勿手改**；以 md + `release-note-html.mjs` 重建为准。
- **生成时机**：note-merge 定版/刷新后自动重建（`--no-html` 关闭）；seal `--apply` 在归档侧按「已上线」状态重渲；也可手动 `node scripts/release.mjs note-html -- --root . --note <path>` 补渲（audit 亦可只报告缺失）。
- **降级语义**：html 渲染失败**不阻断**定版/归档（降级为 warning）；缺 html 不影响 seal-check。
- **会话级辅助不入档**：html 中的勾选（步骤/验收）与 YAML 折叠状态均为浏览器会话态，不写回 md / artifacts。
- **包内附属逐项展示**：「七、包内附属文件」按类别逐行列出（SQL 原件 / 整理 DDL·DML / 配置快照 / 定时任务），每行带可点击链接（`target="_blank"`），文件名含 `[]` 也必须正常渲染。
- fixtures 样张：`templates/release-note-sample.md` → `release-note-sample.html`（视觉样例；不参与 bootstrap 种子复制）。

## 变更记录

- 0.4.5 合并来源改为「对比版本之后新增的 merge 记录」；SQL/定时任务章最多前 5 条；包内附属逐项清单；HTML 视觉与附件链接修复。
- 0.4.4 新增 ⑤b（SQL 扫描：目录 + 格式；首次使用写入索引，之后按记录扫描）。
- 0.4.3 新增 ⑩（HTML 只读渲染；目录包含同名 `<identity>.html`）。
- 0.4.0 版本身份改为 `release-V{yyMMdd}`；删除 notes/ 兼容读；仓内快照对账；取消发版命令。
- 0.3.32 建立本 SSOT（复述自 SKILL / gates-common / README / QUICKSTART / freeze / idempotency / questions，收敛于此）。
