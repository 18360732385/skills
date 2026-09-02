# 问卷（release-eng）

前置：[gates-common](gates-common.md) **Done（通过）** 且 [freeze.md](freeze.md) **Done**（自适应题以 freeze 候选 / inventory 为【推荐】信号）。  
`发版日期` 已在 gates-common 首问确认；本问卷不再重问（用户中途改口只更新元信息日期字段，版本身份/目录名不受影响）。

每批 ≤ 5；每题展示【推荐】。用户可改，或 **`全部推荐`**（协议见 [recommended.md](recommended.md)）。

### AskQuestion 形态约定

- **单选/多选题**（分支、slug、负责人、确认类）：用结构化选项，【推荐】项放首位并标注「(Recommended)」
- **多行文本题**（上线内容摘要、上线步骤与回滚、风险与验收）：**不要**把长文塞进选项 label。做法：选项给「采纳推荐稿 (Recommended)」「待定」，并在题面注明「如需修改请选 Other 并直接在对话粘贴多行文本」；用户选 Other 后以对话正文为准，勿要求单行输入
- 摘要类推荐稿来源：freeze `--format summary` 一屏摘要 + `releaseSummaryLines`；展示时附来源说明（见「预填来源透明化」）

### 预填来源透明化

凡【推荐】预填值，题面或选项说明须可追溯到来源：
- SQL/配置/任务推荐行：标注 `confidence`（`docs-hit`/`catalog-hit`/`key-diff`/`path`）与采集源（`application-prod` / `nacos-overlay` / `SyncTaskCode` / archive 清单）
- `draft-md` 预览的配置 yaml 键上一行注释已带 `confidence · source`，问卷展示时保留
- `path` 级低置信与 `priorOnly` 项须明示「建议人工确认」，不得与 `docs-hit` 同级展示

## 固定

1. 版本身份 slug【推荐】= 发版分支名归一化（如 `release/V260827` → `release-V260827`），发版单路径 = `notes/<slug>/<slug>.md`（发版日期为独立字段，不拼入路径）  
2. 上线内容摘要（【推荐】采纳 freeze `releaseSummaryLines`；1～5 项业务短句；写入元信息；可改）  
3. 发版负责人  

## 自适应（有候选或首次 inventory 才深问；否则该章记「无」）

目标 **profile 一律 `prod`**。

4. SQL / migration：增量优先用 freeze **`draft.sql`**（双源去重后；`priorOnly` 须人工确认）；**首次发版**用分层 draft + `inventory.migrationRange` 确认起迁。`draftSuppressed` 默认不落单。`aiSuggestSuppress` 项【推荐】默认不勾「已确认」。目标 profile=`prod`  
5. 配置项：优先 **`draft.config`**（含 **说明** / `confidence`）；「待补」须补全。目标 profile=`prod`；**允许密文值**；`aiNoise` 命中项默认不勾  
6. 定时任务：优先 **`draft.jobs`** / `jobsHits`；目标 profile=`prod`；同上尊重 AI 默认勾选  
7. 第三方与外部依赖  
8. 上线步骤与回滚  
9. 风险与验收  

`全部推荐` 时：增量有 `configKeys`/`jobKeys` 则原样采纳待确认；首次发版采纳分层 `draft`，起迁版本仍须用户确认，**不要**把 `layerSuppressed`/`inventory` 全量当已确认上线清单。有 `aiTrack.aiNoise` 时：这些 stableId **默认不纳入已确认**（仍展示在 draft 预览中，可拉回）；规则轨 draft 行不得被删除。

## Done

- [ ] 固定 1–3 均有答复（允许「待定」）；版本身份 = 发版分支名归一化，发版日期为 gates-common 已确认值  
- [ ] 自适应 4–9 均已收敛：有答、或标「无」、或标「待定」  
- [ ] SQL：增量已 `SQL序`；首次已确认起迁（或显式「无 SQL」）；目标 profile=`prod`  
- [ ] 配置：有值时每条含**说明**（落单写入 yml 键上一行 `#` 注释）、来源、目标 profile=`prod`；优先落了 `configKeys`  
- [ ] 定时任务：有变更时目标 profile=`prod`；优先落了 `jobKeys`/`taskCodes`  
- [ ] 若用户说了「全部推荐」：本轮未答项已按 [recommended.md](recommended.md) 填齐  
