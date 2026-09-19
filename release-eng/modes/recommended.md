# 全部推荐（release-eng）

与 harness「全部推荐」同词：**只收齐本轮答题**，不代替 WritePlan 写盘闸。

## 协议

用户回复 **`全部推荐`**（或「按推荐」）：

1. 采用当前批次每题的【推荐】预填（无探测信号的自适应题 → `无`；有 `configKeys`/`jobKeys`/`taskCodes` → 原样采纳待确认；**首次发版**仅有 inventory 时 SQL/配置/任务标「待定」或请起迁，勿把整树当已确认）  
2. gates-common 首问未答时：预填 **`发版日期`**=≥提问日+2 的第一个周四、发版=`release`、基线=`main`，**向用户展示预填**；用户未改口即视为确认，再进入 push-gate。用户已选 **`首次发版` / 基线=`无`** 时保留该选择，勿改回 `main`；已改 `发版日期` 时保留用户日期  
3. 自适应 SQL / 配置 / 定时任务：目标 profile 预填 **`prod`**  
4. `on_exists` 未答时：`merge`  
5. 收齐后继续流程；**写盘仍过** [write-plan.md](write-plan.md) 确认词（或预授权）  

「全部推荐」≠ 跳过 push-gate；push-gate 失败仍走 [git-gates.md](git-gates.md) 中止 Done，且不进入 freeze/问卷。
