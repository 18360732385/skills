# status — 只读看进度

未指定且已有未完成 `docs/runs/active/` 时默认走本页。输出：

1. 进行中主题列表（`docs/runs/active/` 下 `stage != done`）；若发现旧路径 `docs/superpowers/runs/` 残留，单独列出并提示迁移。
2. **绑定健康**（只读）：用固定表（环 / **中文名** / 键名 / 当前 skill / 相对推荐包差异）；`null` **标红**并建议 `rebind`/`init`。中文名 SSOT：[stages.md](stages.md)。
3. 指定主题（或唯一主题）的：
   - 目录：`docs/runs/active/<slug>/`（或兼容旧路径）
   - path / run_mode / invoke / handoff_policy / review_policy / stage（附中文名）/ `domain` / `proto` / updated_at
   - 绑定摘要；`pending_invoke` 若有
   - 产物存在性清单（按 [artifacts.md](artifacts.md) **已进入过的环**逐节 ✓/✗；当前环必列）
   - L2：`审核-<stage>.md` 若有则标 pass/fail
   - 未过的闸；tasks；`env_verified` 若有
4. 建议的下一动作（`resume` / 「环 N 完成」→ advance / 主动调起下一 skill / `rebind` / `close` / handoff）
