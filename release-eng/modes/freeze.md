# freeze — 定版采集

前置：[gates-common.md](gates-common.md) 出口为 git-gates **Done（通过）**（【推荐】已跑 `scripts/release-push-gate.mjs`）。

Leading：`截断5` · `mergeSources` · `SQL序` · `键级diff` · `首次发版-layered` · `jobs交叉` · `配置说明` · `draft` · `双源去重` · `prior-since` · `变更对象` · `artifacts.json` · `confidence` · `双轨研判` · 远端浏览链接（按 origin 宿主） · `Asia/Shanghai` · `来源分支功能` · `上线内容摘要` · `逾期未归档`。

## 步骤（【推荐】脚本）

在仓库根，优先用 push-gate JSON 的 `hints.freezeArgs`：

```bash
# 增量（有基线）— 路径 + yml/Java 键级·任务级 diff；双源去重；默认 --prior auto（archive 全量并集）
node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --base <baseRef> --head <headRef> --format json
# --prior none 关闭清单已收录；--prior-since 2026-08-01 截断并集；--prior <path> 单份

# 首次发版（基线=无）— Git 全量；分层候选（非空 draft）
node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --first-release --head <headRef> --format json
```

> **PowerShell 落盘**：避免 `> file` 写成 UTF-16 LE BOM 导致 JSON 解析失败，**优先用 `--out <file>`**：
> ```powershell
> node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --first-release --head HEAD --format json --out .cursor/skills/release-eng/scripts/_freeze.json
> # 一屏摘要（WritePlan 白话摘要主输入）
> node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --first-release --head HEAD --format summary
> ```

| 模式 | 提交 / 路径统计 | 上线候选（sql/config/jobs） |
|---|---|---|
| 有基线 | `base..head` log + `diff --name-only` | **`键级diff`** + **`线上已存在`**（基线树）+ **`清单已收录`**（archive `artifacts.json` 优先，否则 md 启发式）；仅清单有 → draft + `priorOnly`；仅基线有 → suppressed；**配置仅** `application-prod.yml` / nacos prod overlay（非 prod → `layerSuppressed`）；`draft.sql`≥40/100 → 体积 warning |
| **`首次发版`** | head 全历史 + 树全量统计 | **`首次发版-layered`**：SQL=全 migration；配置=`application-prod.yml` 全键；任务=`SyncTaskCode`；其余 path → `layerSuppressed` |

脚本产出：Git 二表（提交列表 + 合并来源）、`releaseSummaryLines`、`candidates`、`changeObjects`、`configKeys`/`jobKeys`/`taskCodes`、`draft`/`draftSuppressed`、`priorRelease`/`priorReleases`、`baselinePresence`、`overdueNotes`、`aiTrack`（stub）、`inventory`（首次）、`gitlabUrl`、`mergeSources`、`timezone=Asia/Shanghai`、`todoPlaceholders`（TODO 占位）、`jobsConfigGaps`（jobs↔config 交叉）、`indexDrift`（索引↔磁盘对账）。  
首次 `inventory` 另含空层可观测：`prodConfigKeyCount`、`nacosOverlayKeyCount`、`syncTaskCodeCount`、`layerEmpty`（如 `["config"]`/`["jobs"]`）；层为空时 `warnings` 明示「prod 层 0 键」「SyncTaskCode 枚举 0」，**不**改变 layered 收录策略。  
存在 **逾期硬闸**（进行中目录包已定版且发版日期已过）时 exit 1。

## `confidence`（分级）

| 级别 | 含义 |
|---|---|
| `docs-hit` | 已挂上 `docs/jobs` 真相或 SyncTaskCode |
| `catalog-hit` | 配置说明命中 README/AGENTS 表 |
| `key-diff` | yml/Java 键级或注解 diff |
| `path` | 仅路径启发式 |

## `prior去重` / 双源

- 默认 `--prior auto`：`docs/releases/archive/` **全量并集**（扁平 `*.md` 与目录包 `{id}/{id}.md`）；优先读同目录 **`artifacts.json`**，否则 md 启发式
- `--prior-since <YYYY-MM-DD|identity>`：只并入日期/身份 ≥ 该前缀的 archive
- **线上已存在**（基线树有 migration/键/task）→ `draftSuppressed`
- **配置/任务键值变更例外**：基线树已有键身份，但增量 `change=changed|removed` → **仍进 `draft`**（标 `priorKeyHit`；值列展示 `旧→新`），不得因键曾出现在基线而静默 suppress
- **Flyway 命名 alias**：`Vn__….sql` ≡ `Vn_0__….sql`（`_0` 与无子号等价；`_1+` 独立）。prior / 基线按 **canonicalId** 命中 → `suppressReason=rename-alias`（**勿重跑**，不进执行序）
- **仅清单已收录**（精确 basename，非 rename alias）→ 仍进 `draft`，标 `priorOnly`（漏检优先）
- `--prior none` 关闭清单侧；或显式单份路径

## `双轨研判`（MVP1 stub）

JSON `aiTrack.status=stub`：规则轨 `draft`/`changeObjects` 为召回底线；仪式内模型可填 `aiRanked`/`aiNoise`，**不得**静默删规则命中项。

## `逾期未归档`

进行中目录包（`docs/releases/<slug>/`，兼容旧 `notes/`）发版日期 < 运行日（Asia/Shanghai）：`已定版` → 硬闸（freeze `ok=false` / exit 1）；`准备中` → soft warning。须先 seal，或用户**书面跳过**：落盘时 note-merge 须带 `--overdue-waived "<书面说明>"`（跳过记录写入 `artifacts.json.overdueWaived{reason,date}`；freeze JSON 含 `overdueHardGate` 而未传该参数 → note-merge 拒绝写盘、exit 1）。约定见 [conventions.md](conventions.md)。

## 候选规则（增量）

| kind | 如何进候选 |
|---|---|
| **sql** | 仅 `**/db/migration/Vdddd__*.sql` 或现行 `Vdddd_d__*.sql`（SQL序=`migrationSortKey`）；另附 `docs/db/table/*_change.sql`（对照，非替代执行序） |
| **config** | **仅** `application-prod.yml` + `config/nacos/application-prod-nacos.yml` 键级 diff → draft；其它 `application*.yml` / `.env` / `*secret*` → `layerSuppressed`（`non-prod-layer`）；**说明**来自 README/AGENTS 表或 yml **键上一行 `#`（优先）/ 行尾 ` #`（兜底）；叶子无注释时回退继承最近父级 map 注释** |
| **jobs** | `docs/jobs`、`*Scheduler.java`、`SyncTaskCode`、`SyncTaskMetadataRegistry`；或 yml 键名含 `cron`/`scheduling`；Java diff 抽 `taskCodes`；**交叉** `docs/jobs/tasks` → `jobsHits`；**仅** `docs/jobs` 路径变更（无 SyncTaskCode）也可 seed catalog → `draft.jobs` |
| **third-party** | feign / 问学 / 乐享 / dashscope / mcp 路径关键词 |

同一文件可同时 `config`+`jobs`（`kinds` 数组；兼容字段 `kind`=首个）。目标 profile=prod、配置白名单等约定见 [conventions.md](conventions.md)。

## `draft`（写盘预填）

JSON `draft.sql` / `draft.config` / `draft.jobs` 对齐发版单三章列（目标 profile=`prod`）；已含 `confidence`。  
`draftSuppressed` = 相对 prior 已上线项。  

WritePlan【推荐】：

```bash
node .cursor/skills/release-eng/scripts/release-freeze.mjs ... --format draft-md
```

audit【推荐】：`--format audit-json`。一屏摘要：`--format summary`。落盘大 JSON 用 `--out <file>`（PowerShell 必用，避免 UTF-16 BOM）。问卷 / WritePlan **优先落 `draft`**；缺说明标「待补」。

## `首次发版-layered`

- SQL：全量 `db/migration/V*__*.sql` 进 draft（SQL序）  
- 配置：`application-prod.yml` 全键 **+ `config/nacos/application-prod-nacos.yml` overlay 键**（标 `source`）进 draft；`flattenYamlKeys` 标 `isLeaf`，**父级键不进 draft.config / changeObjects**，也不计「说明待补」；注释采集=键上一行 `#` 优先，行尾 ` #` 兜底  
- 任务：仓内发现的 `SyncTaskCode.java` 枚举 task_code 进 draft（不强制 code 含 `:`）  
- 其余 config/jobs 路径：`layerSuppressed` → `draftSuppressed`  
- 仍输出 `inventory.migrationRange` 供问卷确认起迁  
- **TODO 占位扫描**：prod 配置值 `TODO_*` 进 `todoPlaceholders`（上线前必填）  
- **jobs ↔ config 交叉**：仅**本版 `draft.jobs`** 的 cronKey 在 prod 配置缺失 → `jobsConfigGaps`；全库 catalog 缺键 → `jobsConfigGapsAppendix`（不进发版单正文）  
- **上线内容摘要**：首次发版无合并来源时取最近 max 条非合并业务提交（`recentFirst`），不再取最旧提交  

## `截断5`（提交列表写入发版单时强制）

提交列表按 **`截断5`**（≤5 全量；>5 前 3 + 一行 `…`（省略 N 条）+ 后 2；hash 列前 8 位）；省略行下方补远端完整记录链接（按 freeze `remoteHost` / origin；字段名仍可能叫 `gitlabUrl`）。形与示例见 [conventions.md](conventions.md)。  
JSON 可保留全量 hash；写入发版单用 `commitsDisplay` 或 md。

## `mergeSources`（合并来源去重全量）

按 `guessSourceBranch` 推测来源分支去重、`origin/` 等前缀归一（去重/归一细则见 [conventions.md](conventions.md)）；空归「无/未识别」。  
产出 `mergeSources: [{ source, count, branchFeatures[], branchSummary, noise }]`（`branchSummary` 为一句话中文总结；`noise`=环境支/未识别/`merge/*`）。JSON **全量保留**；发版单表优先业务支，噪声折叠为「环境支/未识别（合计）」一行；`releaseSummaryLines` 跳过 noise。  
表列：推测来源分支 | 出现次数 | **来源分支功能**（一句话中文；映射与收句细则见 [conventions.md](conventions.md)）。

## `上线内容摘要`（← 分支级聚合；并入元信息）

`releaseSummaryLines`：**分支级聚合** —— 合并来源按次数降序各取一句话总结（**跳过 noise 环境支**），不足时以非合并提交业务短语（新→旧）补足，**最多 1～5 项**；无合并来源（含首次发版）时 `recentFirst`。  
note-merge 写入元信息章内 `### 上线内容摘要` 的 `<!-- auto:summary -->`（不再单独成「二、」章）。

## 时区

定版时间与提交 `date` 列均用 **Asia/Shanghai**（`TZ` + `format-local` / `nowChinaTime`；约定见 [conventions.md](conventions.md)）。

## `SQL序`（候选与落单）

sql 候选按 migration **版本号数字升序**。  
无版本号的 `_change.sql` 置后，问卷确认是否仅对照、是否需执行。  
落单「数据库与 SQL」按同一顺序填 **执行序** 1..N，目标 profile=`prod`。

定版落盘后（note-merge）：原件进 `sql/refs/`；按文件名双轨（`__DDL__`/`__DML__` 或新轨 `V{ts}_{0|1}__`）归类，失败则 AI JSON（`--sql-ai-json`，不问用户）生成 `sql/release-V{yyMMdd}-DDL|DML.sql`。`_change.sql` 仅对照、不进 refs 与整理文件；整理文件缺侧不落盘；**prod 执行先 DDL 整理文件再 DML**（各类内部仍 SQL序）——约定全文见 [conventions.md](conventions.md)。  
> **警示**：note-merge 刷新会**先清空包内 `sql/` / `config/` / `jobs/` 三个目录再重建**（← `draft`）；手工放入这三个目录的文件会被清除。

## 回退（脚本不可用时）

### 有基线

1. `git log` / `git diff --name-only` / `git shortlog`  
2. SQL：只收 `db/migration/V*__*.sql`，按 `SQL序`  
3. 配置/任务：对变更 yml 做键级对比（或注明「仅路径、待人工拆键」）  
4. 展示 `截断5`（前3后2 + hash 前 8 位）+ `mergeSources` 全量（来源去 `origin/`）+ 远端 compare/commits 链接  

### `首次发版`

1. Git 二表全量（提交展示截断5 前3后2 + hash 前 8 位；合并来源按分支去重全量、来源分支功能一句话）  
2. 候选章标「无（首次发版-manual）」+ 写出 migration 版本区间提示  
3. 问卷人工收齐 SQL/配置/任务  

## Done

- [ ] Git 二表可写入发版单「Git 定版」（提交已 `截断5` 前3后2 + hash 前 8 位；合并来源含来源分支功能一句话中文 + 远端宿主提示；时区 Asia/Shanghai）  
- [ ] `releaseSummaryLines`（≤5，分支级聚合）可供元信息内上线内容摘要  
- [ ] 增量：`candidates` 能回指路径；sql 已 `SQL序`；带 `confidence`；`draft`/`draftSuppressed`/`priorRelease` 可读  
- [ ] 配置键尽量带 `description`（采集自键上一行 `#` 或行尾；落单时仍写键上一行 `#`）；任务键尽量挂 `docs/jobs`；prior 命中项已标记 `alreadyReleased`  
- [ ] 首次发版：`candidatePolicy=first-release-layered`；分层 draft 可读；`inventory` 可供问卷  
- [ ] 本轮已处于 push-gate Done（通过）之后；若 `overdueHardGate` 则已中止或书面跳过  
- [ ] 【推荐】已用 `release-freeze.mjs`（或注明回退手工）  
- [ ] 若 `首次发版`：元信息基线写「无」；定版引用写 `首次发版:<headRef>`  
