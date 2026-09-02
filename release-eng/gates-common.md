# 共享前缀 gates-common

`prepare` / `resume` 入口必跑。`seal` 只跑其中 bootstrap（见 [seal.md](seal.md)）。

## 步骤

1. [bootstrap.md](bootstrap.md)  
2. **逾期未归档预检**【推荐】：扫 `docs/releases/notes/`；发版日期 < 今天（Asia/Shanghai）且状态=`已定版` → **硬闸**（中止定版，先 seal）；状态=`准备中` → 软提醒。亦可由后续 freeze 的 `overdueHardGate` 再拦一次。  
   - **索引 ↔ 磁盘对账**：`releases.md`「进行中」表行指向的 note 路径须磁盘存在；不存在 → 索引漂移（freeze 产出 `indexDrift` 并 warning，须先修正索引或补建 note 再继续）。  
3. **首问**（每批 ≤ 5；每题展示【推荐】；可 `全部推荐`）  
   1. **`发版日期`**【推荐】= **≥提问日+2 天的第一个周四**（算法见下；口语可称「下周四」）  
   2. 发版分支【推荐】`release`（可预填上次或索引）  
   3. 基线分支【推荐】`main`；可为 **`无`（`首次发版`）**  
4. [git-gates.md](git-gates.md) — 【推荐】`scripts/release-push-gate.mjs`  

### 发版日期【推荐】算法

以提问日（本地日历）为基准：取**第一个满足 `日期 ≥ 提问日 + 2 天` 的周四**。

| 提问日（例） | 提问日+2 | 推荐周四 |
|---|---|---|
| 周二 Aug 18 | Thu Aug 20 | Aug 20（本周四） |
| 周三 Aug 19 | Fri Aug 21 | Aug 27 |
| 周四 Aug 20 | Sat Aug 22 | Aug 27 |
| 周五 Aug 21 | Sun Aug 23 | Aug 27 |

`全部推荐` 可预填本步三项：须向用户展示预填值；用户未改口即视为确认后再执行步骤 3（协议见 [recommended.md](recommended.md)）。  
用户已明示基线=`无` / `首次发版` 时，不得改回 `main`。  
**发版单路径约定**：版本身份 `<slug>` = **发版分支名归一化**（去 `origin/`、`refs/heads|remotes/`，`/` → `-`，连 `-` 收敛；如 `release/V260827` → `release-V260827`），与 `发版日期` 解耦（日期不拼入目录名）；发版单路径 = `notes/<slug>/<slug>.md`。改 `发版日期` 不影响路径，仅更新元信息日期字段。

## 出口

| git-gates 结果 | 调用方行为 |
|---|---|
| **Done（中止）** | 本模式**立即结束**；勿 freeze、勿问卷、勿定版 WritePlan；交付物以 git-gates 中止 Done 为准 |
| **Done（通过）** | 将 `发版日期`、`baseRef` / `headRef`（及 `firstRelease` / `hints.freezeArgs`）交给后续 |

## Done

- [ ] bootstrap Done  
- [ ] 逾期未归档：无硬闸，或已 seal / 用户书面跳过  
- [ ] 用户已确认（或展示预填后未改口）：`发版日期` + 发版分支 +（基线分支 **或** `首次发版`）  
- [ ] git-gates 已达 Done（通过）或 Done（中止）；若中止则调用方未继续后续步骤  
