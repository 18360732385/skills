# 共享前缀 gates-common

`prepare` 入口必跑。`seal` 只跑其中 bootstrap（见 [seal.md](seal.md)）。

## 步骤

1. [bootstrap.md](bootstrap.md)  
2. **逾期未归档预检**【推荐】：扫 `docs/releases/<identity>/`（进行中目录包；**不**扫 `notes/`）；发版日期 < 今天（Asia/Shanghai）且状态=`已定版` → **硬闸**（中止定版，先 seal）；状态=`准备中` → 软提醒。亦可由后续 freeze 的 `overdueHardGate` 再拦一次。  
   - **索引 ↔ 磁盘对账**：`releases.md`「进行中」表行指向的发版单路径须磁盘存在；不存在 → 索引漂移（freeze 产出 `indexDrift` 并 warning，须先修正索引或补建目录包再继续）。  
   - **无例外口头豁免**：「旧单以后再 archive」「先定新版」「archive 是 housekeeping」**不**解除硬闸。仅用户**书面**「跳过逾期硬闸」并记入本轮交付物时可继续；书面跳过的**落点**：落盘时 note-merge 须带 `--overdue-waived "<书面说明>"`（跳过记录写入 `artifacts.json.overdueWaived{reason,date}`；freeze JSON 含 `overdueHardGate` 而未传该参数 → note-merge 拒绝写盘、exit 1）。约定见 [conventions.md](conventions.md)。  
3. **SQL 扫描是否首次使用**（只读，不写盘）  

```bash
node .cursor/skills/release-eng/scripts/release.mjs sql-profile -- --root .
```

   读 `docs/releases/releases.md`「SQL 扫描」。**SQL 目录**与 **SQL 格式**都有有效值 → 已记录。缺节、空值、`（未记录）`、`—`，或只记下一项 → **首次使用**（与「首次发版」无关）。约定见 [conventions.md](conventions.md) ⑤b。  
4. **首问**（每批 ≤ 5；每题展示【推荐】；可 `全部推荐`）  
   1. **`发版日期`**【推荐】= **≥提问日+2 天的第一个周四**（算法与示例表见 [conventions.md](conventions.md)；口语可称「下周四」）  
   2. 发版分支【推荐】`release`（可预填上次或索引）  
   3. 基线分支【推荐】`main`；可为 **`无`（`首次发版`）**  
   4. **仅首次使用**再加两道必答题，未答完不得进 push-gate：  
      - 版本 SQL 所在目录（相对仓库根）  
      - SQL 文件名格式（`flyway` = `V<数字>__.sql`，或文件名 glob 如 `*.sql`）  
      推荐：`sql-profile` JSON 里 `dirRecommendation` 唯一时采用，并标注 `dirSource`。`formatRecommendation` 为 `flyway` 或 `*.sql` 时采用；为 null 则该题无推荐。目录 0 个或多个、或格式抽样混杂时，对应题没有推荐。  
   - **已记录**：不重问。回显「SQL 目录 = …；SQL 格式 = …（已记录，本轮不重问）」。用户当轮改口则更新对应项。  
   - 两项都校验通过后才写入索引（不创建 `docs/releases/<identity>/`）。只答一项不落盘，下一轮仍是首次使用。  

```bash
node .cursor/skills/release-eng/scripts/release.mjs sql-profile -- --root . \
  --set-dir <相对路径> --set-format <flyway|glob> --apply
```

   目录：相对路径，拒绝绝对路径和 `..`，且必须已存在。格式：只能是 `flyway`，或不含 `/`、`\`、`..` 的文件名 glob。目录下暂无符合格式的文件只警告，仍允许记下。  
   - **权威口述 ≠ 跳过首问**：用户说「别问了 / 用 release 对 main / 日期写周四 / 默认 db/migration + Flyway」时，仍须**回显**已问各项请其未改口确认（或走 `全部推荐` 展示预填），然后才进下一步。禁止未回显直接写 `docs/releases/<identity>/`。首次使用时「默认 db/migration」不算已答。  
5. [git-gates.md](git-gates.md) — 【推荐】`scripts/release-push-gate.mjs`  

### 发版日期【推荐】算法

以提问日（本地日历）为基准：取**第一个满足 `日期 ≥ 提问日 + 2 天` 的周四**；完整算法与四行示例表见 [conventions.md](conventions.md)。

`全部推荐` 可预填发版日期 / 分支 / 基线：须向用户展示预填值；用户未改口即视为确认后再执行 push-gate（协议见 [recommended.md](recommended.md)）。首次使用时，目录有唯一候选且格式有推荐，两题才一并算已答；缺任一推荐时这两题不算已答。  
用户已明示基线=`无` / `首次发版` 时，不得改回 `main`。  
**发版单路径约定**：版本身份 `<identity>` = **`release-V{yyMMdd}`** ← 发版日期；路径 = `docs/releases/<identity>/<identity>.md`。改日期 → 改路径（未定版可迁；已定版须确认）。同日一包。全文见 [conventions.md](conventions.md)。

## 出口

| git-gates 结果 | 调用方行为 |
|---|---|
| **Done（中止）** | 本模式**立即结束**；勿 freeze、勿问卷、勿定版 WritePlan；**仅会话预览**；交付物以 git-gates 中止 Done 为准 |
| **Done（通过）** | 将 `发版日期`、`identity`、`baseRef` / `headRef`、已记录的 SQL 目录与格式（及 `firstRelease` / `hints.freezeArgs`）交给后续 |

## Done

- [ ] bootstrap Done  
- [ ] 逾期未归档：无硬闸，或已 seal / 用户书面跳过  
- [ ] 用户已确认（或展示预填后未改口）：`发版日期` + 发版分支 +（基线分支 **或** `首次发版`）  
- [ ] SQL 扫描：已记录并回显，或本轮首次使用两题已答且 `sql-profile --apply` 已写入 `releases.md`  
- [ ] git-gates 已达 Done（通过）或 Done（中止）；若中止则调用方未继续后续步骤  
