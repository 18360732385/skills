# status — 只读看进度

未指定且已有未完成 `runs/` 时默认走本页。输出：

1. 进行中主题列表（`runs/` 下 `stage != done`）
2. **绑定健康**（只读）：用固定表（环 / **中文名** / 键名 / 当前 skill / 相对推荐包差异）；标出 `null`、与推荐不同的环、以及当前路径下一环将调起的 skill；`null` **标红**并建议 `rebind`/`init`。中文名 SSOT：[stages.md](stages.md)。
3. 指定主题（或唯一主题）的：
   - path / run_mode / invoke / handoff_policy / review_policy / stage（附中文名）/ `domain` / `proto` / updated_at
   - 绑定摘要（当前环中文名 + 将调起的 skill；null 标红）；`pending_invoke` 若有
   - 产物存在性清单（按 [artifacts.md](artifacts.md) **已进入过的环**逐节 ✓/✗；当前环必列）
   - L2：`review-<stage>.md` 若有则标 pass/fail
   - 未过的闸（gates 中无时间戳的项）
   - tasks 勾选进度（若有）；`env_verified` 若有
4. 建议的下一动作（`resume` 续跑 / 口令「环 N 完成」即 advance / 控制器将主动调起下一 skill / `rebind` / `close` / 必要时 handoff）
