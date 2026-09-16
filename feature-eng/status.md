# status — 只读看进度

输出：

1. 进行中主题列表（`runs/` 下 `stage != done`）
2. **绑定健康**（只读）：相对推荐包（见 [init.md](init.md)）标出 `null`、与推荐不同的环、以及当前路径下一环将调起的 skill；`null` **标红**并建议 `rebind`/`init`
3. 指定主题（或唯一主题）的：
   - path / stage / updated_at
   - 绑定摘要（当前环将调起的 skill；null 标红）
   - 产物存在性清单（按 [stages.md](stages.md) 产物契约逐项 ✓/✗）
   - 未过的闸（gates 中无时间戳的项）
   - tasks 勾选进度（若有）
4. 建议的下一动作（advance / 继续当前环 / rebind / close）
