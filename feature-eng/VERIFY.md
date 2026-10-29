# feature-eng 验收记录（0.2.28）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.28**（ARCHIVE 路径对齐 archive/；其上 0.2.27 selfcheck 拆分 · `_log` 归档；见 [CHANGELOG.md](CHANGELOG.md)）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更明细 [`../_log/feature-eng/`](../_log/feature-eng/)。

本版**不**改动默认绑定 skill 名；`eng_land` 仍为 false；`feature.mjs` 不写盘；yaml `defaults.close_pitfalls` 字面仍为 `optional`。P1/P2 能力（[QUICKSTART.md](QUICKSTART.md) · `truncate-contracts` · `status-scan` · `close_pitfalls`）与 0.2.26 机检仍有效。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。发版用 `sync-skill-version.mjs` 同步文档钉头。

## 0.2.28 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.28`；入口文档钉头一致 | 有 |
| close / close-check 优先 `docs/superpowers/archive/ARCHIVE.md`；fixture 在 archive/ | 有 |
| CHANGELOG 近期索引含 0.2.28 | 有 |
| `node scripts/sync-skill-version.mjs --check` exit 0 | 有 |

## 继承 · as-of 0.2.27 / 更早

见 [CHANGELOG.md](CHANGELOG.md) 索引与 [`../_log/feature-eng/`](../_log/feature-eng/)（含 `_archive`）；0.2.27 selfcheck 拆分与更早能力仍有效。现行权威钉：**0.2.28**。

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30 | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 或升 Node ≥22 |
| `node -v` 低于 `engines.node` | worker / 工具链崩 | verify 前对照 engines |

## 与 harness-eng 对齐路径清单

| 依赖点 | 硬编码路径 | 用途 |
|---|---|---|
| start 探测（1b） | `docs/harness-eng/harness-meta.yaml` / 遗留 `.cursor/harness-meta.yaml` | 工程化 meta 软探测（皆无 → 静默跳过） |
| close 1b 代跑 | 目标仓 `scripts/agent-kb/refresh-score.mjs` | 工程化快照刷新（优先） |
| close 1b 回退 | `<工程化技能目录>/scripts/harness.mjs --mode refresh --root <目标仓根>` | 无 refresh-score 且有 meta 时回退 |
| 软提示 | `fill-score` / `refresh-score` | `ai_coding_ready=NO|未知` 时建议先打分 |

harness-eng 布局演进时以本清单对照；失配仅影响软提示/可选步骤，不阻断独立模式。

## 烟测命令

```bash
node scripts/selfcheck.mjs
# 全量 ✓ 列表：node scripts/selfcheck.mjs --verbose
# 无仓级 _log：node scripts/selfcheck.mjs --no-log
```
