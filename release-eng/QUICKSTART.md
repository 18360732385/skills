# release-eng 一页纸

点名本 skill → 按意图走模式。热路径索引：[AGENT-INDEX.md](AGENT-INDEX.md)（必读 + 按需两张表，唯一旁路路由）。验收：`node scripts/selfcheck.mjs`。薄 CLI：`node scripts/release.mjs`。  
约定全文（发版日期算法 / 身份归一化 / 目录包 / 截断5 / mergeSources / prod / SQL序 / 密文 / 逾期硬闸书面跳过）见 [modes/conventions.md](modes/conventions.md)。

## 主循环

```text
prepare（首问发版日期 + 分支 + 基线/首次发版）
  → push-gate
    → freeze（截断5 · mergeSources · 键级diff · draft）
      → 问卷 / WritePlan（确认词后 note-merge）
        → … 续跑 resume
          → seal（seal-check → 归档）
```

## 模式一句话

| 模式 | 一句话 |
|---|---|
| **prepare** | 新建发版单：首问 → push-gate → freeze → 问卷 → WritePlan |
| **resume** | 同版本身份续跑（刷新 draft / 补问卷 / 再定版） |
| **audit** | 只读体检 prior·freeze，不写盘 |
| **seal** | 已上线：seal-check 通过后 进行中目录→archive |

## 三条硬规则

1. **首问齐**——发版日期 + 发版分支 +（基线或首次发版=`无`）后才进 push-gate（权威口述须回显确认）。
2. **确认词才写盘**——WritePlan / note-merge / seal 搬迁须过确认（或同会话预授权）；「继续吧」等非正式口语不算；audit 永不写盘。
3. **非 harness land**——不对齐 harness 自动 land；跨仓靠整目录拷贝 + 点名仪式。

逾期已定版仍在 `docs/releases/<slug>/` → 先 seal。push-gate 未通过 → 勿写进行中目录包（聊天可贴草稿）。Red Flags：[SKILL.md](SKILL.md)。骨架缺失 / 旁路路由：[AGENT-INDEX.md](AGENT-INDEX.md)。

bare / 无 web remote 时 freeze/audit 警告「未能推导浏览链接」属预期（非故障）。

详情：[SKILL.md](SKILL.md) · [modes/README.md](modes/README.md)
