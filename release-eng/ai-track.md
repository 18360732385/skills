# 双轨研判（AI 轨）— 仪式步骤

前置：[freeze.md](freeze.md) 已产出规则轨 JSON（含 `changeObjects` / `draft` / `aiTrack.status=stub`）。  
原则（ADR-0001）：**规则轨 draft 不得因 AI 建议静默消失**；AI 只影响问卷默认勾选。

## 何时跑

- prepare / resume：freeze 之后、[questions.md](questions.md) 之前（【推荐】）  
- 无低置信 / `priorOnly` 项时可跳过（脚本会报 `skipped`）  
- AI 失败 / 超时 → **跳过**，纯规则继续（漏检底线）

## 步骤

1. 写出本轮 freeze JSON（或沿用内存）：

```bash
node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --base <base> --head <head> --format json --out /tmp/freeze.json
```

> PowerShell：用 `--out` 落盘（`> file` 会写 UTF-16 LE BOM 导致后续 `JSON.parse` 失败）：
> ```powershell
> node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --base <base> --head <head> --format json --out .cursor/skills/release-eng/scripts/_freeze.json
> ```

2. 生成研判提示（只含 path / prior-only / 缺说明等需 AI 的项）：

```bash
node .cursor/skills/release-eng/scripts/release-ai-track.mjs --root . --freeze-json /tmp/freeze.json --format prompt-md
```

> 待研判项 > 80 时本批只列前 80；未列入项**保持规则轨默认**（留在 draft、问卷正常展示），不会被静默删除。需全量研判则分批：先合并本批，再对剩余项重跑 prompt。

3. **仪式内模型**根据 prompt 产出 JSON（勿改规则轨主键语义）：

```json
{
  "aiRanked": [
    { "kind": "config", "stableId": "sms.ai.x", "recommend": "keep", "reason": "prod 必改" }
  ],
  "aiNoise": [
    { "kind": "config", "stableId": "sms.ai.y", "reason": "仅注释变动 / 非上线项" }
  ]
}
```

约束：`stableId` 必须来自 prompt 列表；**合并时校验**——不在候选集的 `kind:stableId` 会被拒绝（不打标），记入 `aiTrack.rejectedUnknown` 与 `warnings`。`aiNoise` 表示「建议问卷默认不勾选」，不是从 `draft` 删除。

4. 合并进 freeze，供问卷 / WritePlan / note-merge：

```bash
node .cursor/skills/release-eng/scripts/release-ai-track.mjs --root . --freeze-json /tmp/freeze.json --ai-json /tmp/ai-track.json --format json --out /tmp/freeze-with-ai.json
```

5. 问卷：展示规则 `draft` 全量；对 `aiNoise` 命中项【推荐】默认不纳入「已确认」；用户可拉回。`全部推荐` 时采纳该默认。  
6. note-merge 使用 **带 aiTrack 的 freeze JSON**（`--freeze-json`），写入目录包 `artifacts.json.aiTrack`。

## Done

- [ ] 已跑 prompt 或显式跳过（无候选 / AI 失败）  
- [ ] 若合并：`aiTrack.status=filled`；`draft` 行数未因 AI 减少  
- [ ] 若合并：`aiTrack.rejectedUnknown` 为空或已向用户说明被拒键  
- [ ] 问卷已按 aiNoise 给默认勾选说明  
- [ ] 落盘 artifacts 含完整 `aiTrack`（允许空数组）  
