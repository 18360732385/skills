# status — 只读看进度

未指定且已有未完成 `runs/` 时默认走本页。输出：

1. 进行中主题列表（`runs/` 下 `stage != done`）
2. **绑定健康**（只读）：相对推荐包（见 [`config/stage-bindings.example.yaml`](config/stage-bindings.example.yaml)）标出 `null`、与推荐不同的环、以及当前路径下一环将调起的 skill；`null` **标红**并建议 `rebind`/`init`
3. 指定主题（或唯一主题）的：
   - path / stage / updated_at
   - 绑定摘要（当前环将调起的 skill；null 标红）
   - 产物存在性清单（按 [artifacts.md](artifacts.md) **已进入过的环**逐节 ✓/✗；当前环必列）
   - 未过的闸（gates 中无时间戳的项）
   - tasks 勾选进度（若有）
4. 建议的下一动作（`resume` 续跑 / 声称环完成即 advance / `rebind` / `close`）
