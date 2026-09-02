# release-eng CHANGELOG

版本策略：对外权威号**只认** [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`。  
本文件只记历史；顶栏不重复钉当前号。可移植性见 [README.md](README.md)。  
自 `0.3.x` 起：**补丁序**递增（`0.3.1` → `0.3.2` → `0.3.3`…），勿跳升次版本号 unless 明确要求。

## 0.3.17 — 2026-08-25（摘要分支聚合 / 身份分支化 / jobs 汇总单文件 / 渲染细节）

### 产品

- **上线内容摘要分支级聚合**：`buildReleaseSummaryLines(commits, max, { mergeSources, recentFirst })`——合并来源按次数降序各取一句话总结为主，不足以非合并提交业务短语（新→旧）补足；不再简单取最后 5 条提交（无合并来源时维持 `recentFirst` 回退）
- **版本身份 = 发版分支名归一化**：新增 `identityFromBranch`（去 `origin/`、`refs/heads|remotes/`，`/` → `-`，连 `-` 收敛）；发版单路径 `notes/<slug>/<slug>.md`，`发版日期` 解耦为独立元信息字段（note-merge 新增 `--release-date` / `--release-branch` 派生）；gates-common / prepare / resume / questions / idempotency / 模板 / 索引同步
- **jobs 目录改单文件汇总清单**：note-merge 不再逐份拷贝任务真相，改生成 `jobs/README.md`（表列 code / 名称 / cron 表达式 / 默认参数 / 引用文件链接）；cron 优先 head 端 prod yml 实况，回退真相默认表达式；默认参数取 truth 的 defaultDays/defaultHours；seal 整夹搬迁后链接深度不变（四级 `../../../../` 回 `docs/jobs/tasks/`）
- **提交 hash 截断前 8 位**：`shortCommitHash`（`COMMIT_HASH_DISPLAY_LEN=8`），发版单与 freeze md 提交列表只显示短码；JSON `hash` 保留全称
- **合并来源 origin/ 归一 + 一句话**：`normalizeSourceBranch` 剥 `origin/`、`refs/remotes|heads/` 后按分支去重计数（`code-scaffold` 与 `origin/code-scaffold` 合并为一行）；`branchOneLineSummary` 一句话中文（关键词映射分支名，回退样例提交主题收成业务短句，≤28 字），表格与 JSON `branchSummary`/`sampleSubject` 统一
- **删除「3、路径与贡献者」**：移除 `projectAuthors` 采集（freeze 不再跑 `log --name-only`）、`pathAuthorsCombinedMd`/`formatBranchFeaturesOrdered` 函数与发版单章节；Git 定版收敛为二表
- **配置注释置于键上一行**：`dumpYaml` comments 以同缩进 `#` 行置于键上方（原为行尾）；模板示例同步

### 版本钉

- `_meta/manifest.yaml` → `0.3.17`

## 0.3.16 — 2026-08-24（双轨研判加固 / 预填来源透明化 / 问卷形态）

### 产品

- **ai-track 合并校验防发明新键**：`mergeAiTrack` 以 `collectAiCandidates` 候选集为 SSOT 校验 `kind:stableId`；不在候选集的键**拒绝打标**，记入 `aiTrack.rejectedUnknown` 与 `warnings`（此前仅警告缺字段，不校验键真实性）
- **prompt 截断 80 条语义明示**：未列入批次的项保持规则轨默认（留 draft、问卷正常展示），不会被静默删除；提示分批合并路径
- **ai-track 支持 `--out <file>`**：prompt-md / prompt-json / json 全格式落盘；ai-track.md 补 PowerShell 等价（`--out` 替代 `>` 重定向，规避 UTF-16 BOM）
- **预填来源透明化**：draft-md 配置章 yaml 行尾注释带 `confidence · source`；`--format summary` 新增「推荐来源 confidence 分布」与「配置采集源分布」两行，问卷预填值可追溯
- **问卷 AskQuestion 形态约定**：questions.md 新增——多行文本题（摘要/步骤/风险）不塞选项 label，选 Other 后以对话正文为准；预填值须标 `confidence` 与采集源，`path`/`priorOnly` 低置信项明示「建议人工确认」

### 版本钉

- `_meta/manifest.yaml` → `0.3.16`

## 0.3.15 — 2026-08-24（防自误伤 / 摘要可用性 / 跨平台落盘）

### 产品

- **发版单自带 TODO 占位与 jobs↔config 缺口提示**：`release-note-merge` 的配置章 / 任务章在 `auto:config` / `auto:jobs` 块内追加「上线前必办」表格——`todoPlaceholders`（`TODO_*` 值）与 `jobsConfigGaps`（缺 cron 表达式键）直接落单，提示「可能由 Nacos DataId 提供，请勿手工编造键值」，从源头防操作者补全配置时凭空造键（v0.3.14 会话踩坑回流）
- **freeze `--format summary`**：新增中等粒度一屏摘要（range / draft 行数 / 校验信号 / TODO 占位 / jobs↔config 缺口 / 索引漂移 / 说明待补），作为 WritePlan 白话摘要主输入，避免对 445KB JSON 人工捞要点
- **freeze `--out <file>`**：所有 format 支持落盘到文件，规避 PowerShell `> file` 写成 UTF-16 LE BOM 导致 `JSON.parse` 失败（v0.3.14 会话踩坑回流）
- **draft-md 配置章展开全部叶子键**：不再截断 15 条，发版单需完整键；按来源分组、yml 用 ```yaml``` 块，父级键不计
- **note-merge 输出含新校验计数**：dry-run 与写盘 JSON 均带 `todoPlaceholders` / `jobsConfigGaps` / `indexDrift` 计数
- **文档 PowerShell 等价**：freeze.md / write-plan.md 补 `--out` 与 `--format summary` 用法及 PowerShell 落盘提示

### 版本钉

- `_meta/manifest.yaml` → `0.3.15`

## 0.3.14 — 2026-08-24（配置采集真实性 / 校验补强）

### 产品

- **首次分层读 Nacos overlay**：`buildFirstReleaseLayeredCandidates` 新增 `config/nacos/application-prod-nacos.yml` 分支，键并入 `draft.config` 并标 `source=nacos-overlay`（修复 application-prod.yml 单文件漏收 prod 业务配置）
- **叶子键 / 父级键区分**：`flattenYamlKeys` 标记 `isLeaf`；draft.config 行带 `isLeaf`；「说明待补」与 audit `configMissingDescription` 只计叶子键（父级结构键不再计噪声）
- **TODO 占位专项扫描**：freeze 产出 `todoPlaceholders`（prod 配置值中的 `TODO_*`），draft-md / audit-json / warnings 暴露计数，上线前必填项自动浮出
- **jobs ↔ config 交叉校验**：产出 `jobsConfigGaps`（`cronExpressionMissing`）——有 taskCode/cronKey 但 prod 配置无对应 cron 表达式键时提示「可能由 Nacos overlay 提供」
- **索引 ↔ 磁盘对账**：`scanIndexDrift` 解析 `releases.md`「进行中」表行，note 路径不存在则报漂移；freeze / draft-md / audit-json / warnings 暴露；gates-common 预检说明同步
- **首次发版摘要取近不取旧**：`buildReleaseSummaryLines` 新增 `recentFirst`，首次发版取最近 max 条非合并业务提交，避免「Initial commit / 测试提交」等最旧提交占位

### 版本钉

- `_meta/manifest.yaml` → `0.3.14`

## 0.3.13 — 2026-08-21（目录包仅本版新增制品）

### 产品

- **目录包 `sql/`/`config/`/`jobs/`**：只拷贝本版 **draft 新增** 制品（migration；配置 `变更=added` 的来源；任务「新建」真相文档）；**不再**并入 `candidates` 扫描到的涉及文件（如 Scheduler / SyncTaskCode / 整树 docs/jobs）
- 刷新时清空上述子目录，避免上次污染残留
- dry-run `planBundleFiles` 与实拷同规则

### 版本钉

- `_meta/manifest.yaml` → `0.3.13`

## 0.3.12 — 2026-08-21（发版单可读性二轮）

### 产品

- **上线内容摘要**：最多 1～5 项业务短句；并入「一、元信息」子节（不再单独成章）；章节顺延为十一章
- **截断5**：提交列表 >5 时改为**前 3 + … + 后 2**；hash 展示 **全称**（`%H`）
- **来源分支功能**：1～3 项中文业务/修复描述，顺序展示（`branchFeatures`）
- **路径与贡献者**：表列改为「项目 | 开发人员 | 提交数量」（按触及路径交叉统计）
- **配置项**：yml 代码块键旁直接带 `#` 中文注释（不再另附说明列表）

### 版本钉

- `_meta/manifest.yaml` → `0.3.12`

## 0.3.11 — 2026-08-21（双轨研判仪式 / ai-track 脚本）

### 产品

- **`release-ai-track.mjs`**：从 freeze 生成 `prompt-md` / `prompt-json`；合并模型 `aiRanked`/`aiNoise`（**不删 draft**，仅 `aiSuggestSuppress`）
- **`ai-track.md`**：prepare 在 freeze 与问卷之间接入；失败可跳过
- note-merge / artifacts 写入完整 `aiTrack`；问卷 `全部推荐` 尊重 aiNoise 默认不勾
- fixtures：`notes/_example-artifacts.json` 形状样例

### 版本钉

- `_meta/manifest.yaml` → `0.3.11`

## 0.3.10 — 2026-08-21（变更对象 / 双源 / artifacts / 双轨 stub）

### 产品

- **变更对象**：freeze 产出 `changeObjects[]`（kind + stableId + sources + confidence）
- **双源去重**：基线树「线上已存在」→ suppressed；仅 archive「清单已收录」→ draft + `priorOnly`
- **prior**：`auto` = archive **全量并集**；优先 `artifacts.json`；支持 `--prior-since`
- **发版制品清单**：note-merge 写目录包 `artifacts.json`（SSOT，允许密文）；seal-check 校验存在与 SQL 主键对齐；**无密文拦截**
- **首次发版-layered**：migration + `application-prod.yml` 键 + SyncTaskCode；其余 layerSuppressed
- **双轨研判**：`aiTrack.status=stub`（仪式内模型可填建议轨）
- **逾期未归档**：已定版过期 → freeze 硬闸 exit 1；准备中软提醒；gates-common 预检
- ADR：`docs/adr/0001-release-eng-change-objects-dual-track.md`

### 版本钉

- `_meta/manifest.yaml` → `0.3.10`

## 0.3.9 — 2026-08-21（发版单可读性 / 中国时区 / YAML / 链接）

### 产品

- **Asia/Shanghai**：定版时间与提交 date 中国时区
- **上线内容摘要**：结合 git 提交（非 Merge 优先），多点按时间正序换行（`auto:summary`）
- **标题编号**：一级「一、二、三…」；Git 子节「1、2、3…」
- **mergeSources**：第三列改为「来源分支功能」一句话（`branchSummary`）
- **路径与贡献者**：合并为一表（类型 | 名称 | 数量）
- **涉及服务与模块**：说明 ← AGENTS.md / README 一句话
- **配置项**：yml 来源按 YAML 代码块展示
- **包内附属文件**：包内路径为相对本发版单的 Markdown 链接

### 版本钉

- `_meta/manifest.yaml` → `0.3.9`
- 新增 `scripts/release-format.mjs`

## 0.3.8 — 2026-08-20（发版日期算法 / 截断5 / mergeSources / 目录包）

### 产品

- **发版日期【推荐】**：第一个满足 `日期 ≥ 提问日 + 2 天` 的周四（替换「严格下一周四」）
- **`截断5`**：提交列表 ≤5 全量；>5 前 2 + `…` + 后 3；贡献者仍截断10
- **`mergeSources`**：合并来源按推测分支去重全量展示（出现次数 + 示例 subject）
- **目录包**：`notes/{identity}/{identity}.md` + `sql/`/`config/`/`jobs/` 自 head 拷贝；seal 整夹 mv；prior 兼容扁平与目录包 archive

### 版本钉

- `_meta/manifest.yaml` → `0.3.8`

## 0.3.7 — 2026-08-14（note-merge / seal-check）

### 产品

- **`release-note-merge.mjs`**：freeze `draft` + Git 定版写入发版单 `<!-- auto:* -->` 自动段；保留 manual  
- **`release-seal-check.mjs`**：seal 前校验（notes 路径、已定版、发版日期、Git 定版、prod）  
- 模板增加 `auto:git|sql|config|jobs` 标记；seal / prepare / WritePlan 接入  

### 版本钉

- `_meta/manifest.yaml` → `0.3.7`

## 0.3.6 — 2026-08-14（draft-md 预览 / audit prior·freeze）

### 产品

- **`--format draft-md`**：WritePlan 强制可贴的 SQL/配置/任务三章预览（+ suppressed 摘要）  
- **`--format audit-json`**：audit「prior / freeze」短摘要  
- **write-plan**：展示序含 draft 预览；落单 ← `draft`  
- **audit**：报告增 prior、freeze 两节（七节齐）  

### 版本钉

- `_meta/manifest.yaml` → `0.3.6`

## 0.3.5 — 2026-08-14（prior去重 / confidence）

### 产品

- **`prior去重`**：默认相对 `docs/releases/archive` 最新发版单；命中 SQL/配置键/任务 → `alreadyReleased`；`draft` vs `draftSuppressed`  
- **`--prior auto|none|<path>`**  
- **`confidence`**：`docs-hit` > `catalog-hit` > `key-diff` > `path`  

### 版本钉

- `_meta/manifest.yaml` → `0.3.5`

## 0.3.4 — 2026-08-14（jobs交叉 / 配置说明 / draft）

### 产品

- **`jobs交叉`**：`jobKeys`/`taskCodes`/候选路径对齐 `docs/jobs`（+ `SyncTaskCode`）→ `jobsHits`  
- **配置说明**：`configKeys.description` 来自 `sms-ai/README.md`·`AGENTS.md` 表或 yml 行尾注释  
- **`draft`**：freeze JSON 直接产出发版单 SQL/配置/定时任务草稿行（目标 `prod`）  
- 脚本拆分：`release-freeze-enrich.mjs`  

### 版本钉

- `_meta/manifest.yaml` → `0.3.4`

## 0.3.3 — 2026-08-14（键级diff / 首次发版-manual / SQL 收紧）

### 产品

- **增量 `键级diff`**：`application*.yml` 扁平键对比 → `configKeys`；含 cron/scheduling → `jobKeys`；`SyncTaskCode`/`Scheduler` 抽 `taskCodes`；同一路径多 `kinds`  
- **`首次发版-manual`**：Git 全量保留；上线 `candidates` 不扫整树；改给 `inventory`（migrationRange 等）供问卷起迁  
- **SQL 收紧**：仅 `db/migration/V*__*.sql`（+ 可选 `docs/db/table/*_change.sql` 对照）  

### 版本钉

- `_meta/manifest.yaml` → `0.3.3`

## 0.3.2 — 2026-08-14（发版日期 / 截断10 / prod / SQL序）

### 产品

- **`发版日期`**：gates-common 首问；【推荐】提问日之**下周四**；发版单文件名 / 版本身份前缀 = 该日  
- **`截断10`**：提交列表 / 合并来源 / 贡献者 >10 时前后各 5 + `…`；提示 GitLab 全量链接（脚本推导 `gitlabUrl`）  
- **目标 `prod`**：SQL / 配置项 / 定时任务「目标 profile」一律 `prod`  
- **配置说明列**：键含义（非值注释）  
- **`SQL序`**：migration 按 `Vn` 数字升序落单与候选；执行序 1..N  

### 版本钉

- `_meta/manifest.yaml` → `0.3.2`

## 0.3.0 — 2026-08-14（首次发版 / 基线=无）

### 产品

- **`首次发版`**：基线可为 `无`（脚本 `--baseline none|无`）  
- **push-gate**：无基线时只验发版分支未推送；JSON 增 `firstRelease`、`hints.freezeArgs`  
- **freeze**：`--first-release` / `--base none` — 提交取 head 全历史，路径/候选取 head 树全量  
- 硬闸 / gates-common / 模板 / `docs/releases`：分支对 = 发版 +（基线 \| `无`）  

### 版本钉

- `_meta/manifest.yaml` → `0.3.0`

## 0.2.1 — 2026-08-14（P2.7 / 8 / 10）

### 产品

- **版本钉**：CHANGELOG / SKILL / `docs/releases` 索引均只引用 manifest；去掉顶栏「当前：x.y.z」缓存  
- **description**：人读四分支触发（新建/续跑/审计/归档）；不写真相路径  
- **可移植性**：新增 [README.md](README.md) — 本仓首发、迁仓须整目录（含 fixtures/scripts）、**非** harness-eng land（无 VERIFY/selfcheck）  
- manifest 增补 `portable: copy-skill-dir`、`harness_land: false`  

### 版本钉

- `_meta/manifest.yaml` → `0.2.1`

## 0.2.0 — 2026-08-14（P0+P1 writing-for-agents）

### 产品

- **bootstrap**：空仓种子改为 skill `fixtures/docs/releases/`（仓内已有则 skip）  
- **gates-common**：抽出 `bootstrap → 分支对 → push-gate`；中止出口禁止继续 freeze/问卷/定版 WritePlan  
- **prepare / resume 序**：`gates-common → freeze → questions → WritePlan`  
- **seal**：步骤含 bootstrap；Done 勾五路径  
- **全部推荐**：分支对预填须展示；未改口视为确认后再进 push-gate  
- **SKILL**：硬闸瘦身为四条正目标；版本只钉 manifest  

### 版本钉

- `_meta/manifest.yaml` → `0.2.0`

## 0.1.0 — 2026-08-14（首发）

### 产品

- 模式：`prepare` / `resume` / `audit` / `seal`
- 硬闸：分支对首问、**push-gate**（本地相对 origin 未推送则中止定版）、WritePlan 确认闸、密文仅限发版单路径、幂等默认 merge、骨架 bootstrap
- 真相域：`docs/releases/`（索引 + notes/archive + 发版单模板）
- 脚本：`release-push-gate.mjs`、`release-freeze.mjs`
- 协议：`全部推荐`（[recommended.md](recommended.md)）；与 harness write-plan **有意分叉**
- 调用：`disable-model-invocation: true`（仅用户点名）
- writing-for-agents：路由器化 SKILL、各模式 Done、正目标硬闸、P0–P3 收口

### 版本钉

- `_meta/manifest.yaml` → `0.1.0`
