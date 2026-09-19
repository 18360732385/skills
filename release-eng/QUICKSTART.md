# release-eng 一页纸

点名本 skill → 按意图走模式。热路径索引：[AGENT-INDEX.md](AGENT-INDEX.md)。验收：`node scripts/selfcheck.mjs`。

## 主循环

```text
prepare（首问发版日期 + 分支 + 基线/首次发版）
  → push-gate
    → freeze（截断5 · mergeSources · 键级diff · draft）
      → 问卷 / WritePlan（确认词后 note-merge）
        → … 续跑 resume
          → seal（seal-check → 归档）
```

只读检查：`audit`。已上线归档：`seal`。骨架缺失：[bootstrap.md](bootstrap.md) 从 fixtures 种子。

## 模式一句话

| 模式 | 一句话 |
|---|---|
| **prepare** | 新建发版单：首问 → push-gate → freeze → 问卷 → WritePlan |
| **resume** | 同版本身份续跑（刷新 draft / 补问卷 / 再定版） |
| **audit** | 只读体检 prior·freeze，不写盘 |
| **seal** | 已上线：seal-check 通过后 notes→archive |

## 三条硬规则

1. **首问齐**——发版日期 + 发版分支 +（基线或首次发版=`无`）后才进 push-gate。
2. **确认词才写盘**——WritePlan / note-merge / seal 搬迁须过确认（或同会话预授权）；audit 永不写盘。
3. **非 harness land**——不对齐 harness 自动 land；跨仓靠整目录拷贝 + 点名仪式。

详情：[SKILL.md](SKILL.md) · [gates-common.md](gates-common.md) · [freeze.md](freeze.md)
