# release-eng 一页纸

点名本 skill → 按意图走模式。热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。验收：`node scripts/selfcheck.mjs`。CLI：`node scripts/release.mjs`。  
约定全文见 [modes/conventions.md](modes/conventions.md)。

## 主循环

```text
prepare（首问发版日期 + 分支 + 基线/首次发版）
  → release.mjs prepare（push-gate → freeze → WritePlan 预览）
      → 确认词 → note-merge 写盘（md + artifacts + 同名 .html 只读渲染）
        → seal（seal-check → 归档，html 随包并按已上线重渲）
```

同身份目录已存在 = prepare **刷新**（无独立 resume）。

## 模式一句话

| 模式 | 一句话 |
|---|---|
| **prepare** | 半自动到 WritePlan；身份 `release-V{yyMMdd}`；同身份=刷新 |
| **audit** | 只读体检 prior·freeze，不写盘 |
| **seal** | 已上线：seal-check 后进 archive |
| **cancel** | 取消进行中包（删包+清索引，≠ seal） |

## 三条硬规则

1. **首问齐**——发版日期 + 发版分支 +（基线或首次发版=`无`）后才进 push-gate。
2. **确认词才写盘**——「继续吧」等不算；预览只在会话；audit 永不写盘。
3. **非 harness land**——跨仓靠整目录拷贝 + 点名仪式。

逾期已定版仍在进行中 → 先 seal。push-gate 未通过 → 勿写目录包。仓内有 `scripts/release-eng/` 时 VERSION 须对齐（或 `--allow-drift`）。

bare / 无 web remote 时 freeze/audit 警告「未能推导浏览链接」属预期（非故障）。

详情：[SKILL.md](SKILL.md) · [modes/README.md](modes/README.md)
