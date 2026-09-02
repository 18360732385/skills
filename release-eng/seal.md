# seal（已上线归档）

## 前置

- 目标发版单状态为 **`已定版`**（或用户书面「强制 seal」并记入发版单变更说明）  
- 已收集：实际上线日期、执行人  
- 【推荐】先跑 seal 校验通过（见下）  

## 步骤

1. [bootstrap.md](bootstrap.md)（骨架五路径 create 或 skip）  
2. **seal 校验**【推荐】：

```bash
# 目录包（推荐）
node .cursor/skills/release-eng/scripts/release-seal-check.mjs --root . --note docs/releases/notes/<identity>/<identity>.md
# 强制 seal（非已定版）加 --force；人读可加 --format md
```

   - Exit ≠ 0（有 error）→ **中止**，勿 WritePlan / mv（除非用户明示强制且已 `--force`）  
   - warning 可继续，须在 WritePlan 白话摘要列出  
   - 目录包须含 **`artifacts.json`**（与 md SQL 主键对齐）；配置项/artifacts **允许密文**，seal-check **不**因密文失败  
3. [write-plan.md](write-plan.md) 展示将改路径（状态字段、`notes/{identity}/`→`archive/{identity}/`、`releases.md`、`ARCHIVE.md`）+ seal-check 结论 → **确认词之后**才执行下列动作  
4. 文首状态改为 `已上线`；填写上线日期与执行人  
5. `git mv`：**整夹** `docs/releases/notes/<identity>/` → `docs/releases/archive/<identity>/`（含 md + `sql/`/`config/`/`jobs/`；identity = 发版分支名归一化）  
6. 从 [releases.md](../../../docs/releases/releases.md) 进行中表移除该行  
7. 追加到 [ARCHIVE.md](../../../docs/releases/ARCHIVE.md)  

## Done

- [ ] bootstrap Done（五路径均存在）  
- [ ] seal-check 已跑：通过，或用户强制 + `--force` 且警告已展示  
- [ ] WritePlan 已获确认（或预授权）后才发生 mv/索引变更  
- [ ] `notes/` 无该目录包；`archive/` 有该目录包  
- [ ] 进行中表无该行；`ARCHIVE.md` 有对应行  
