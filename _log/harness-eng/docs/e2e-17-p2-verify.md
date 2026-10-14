# e2e-17 P2 验证记录（0.7.45）

> tip：`harness-eng` **0.7.45** · 时间：Asia/Shanghai · 2026-10-14  
> 范围：缺陷清单 P2 ③ last_mode CI · ④ wrappers UX · ⑤ calibrate 降噪

## 结论

| 口径 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` | **PASS** |
| `sync-skill-version --check` | **ok** |
| P2 三项 | **均已落码并断言** |

## 矩阵

| # | 项 | 结果 | 证据 |
|---|---|---|---|
| ③ | meta-stable / last_mode CI | PASS | `compareHarnessMetaStable` resume↔upgrade equal；`--check-meta-stable --baseline` exit 0；ladder 差 exit 1 |
| ④ | wrappers UX | PASS | stderr 含「退役命令（可复制）」+ `HARNESS_RETIRE_WRAPPERS`；retire 后 refresh-score 仍在 |
| ⑤ | calibrate 风格/结构分流 | PASS | normalize 剥 charset/unsigned/width；列 rename=`structural`；fingerprint 忽略宽度 |
| L | selfcheck 全绿 | PASS | 含 0.7.41–45 既有断言 |

## 实现锚点

- [`scripts/lib/meta-stable.mjs`](../../harness-eng/scripts/lib/meta-stable.mjs)
- [`scripts/harness.mjs`](../../harness-eng/scripts/harness.mjs) `--check-meta-stable` / `HARNESS_RETIRE_WRAPPERS`
- [`scripts/lib/obsolete-wrappers.mjs`](../../harness-eng/scripts/lib/obsolete-wrappers.mjs)
- [`scripts/fill-calibrate-live.mjs`](../../harness-eng/scripts/fill-calibrate-live.mjs) `classifyDdlDiff` / `db_style_warn`
- 文档：`modes/upgrade.md` `## 0.7.44 → 0.7.45` · `VERIFY.md` · `_log/harness-eng/0.7/0.7.45.md`
