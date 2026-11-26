# feature-eng 验收记录（0.2.28）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.28**（ARCHIVE 路径对齐 archive/；其上 0.2.27 selfcheck 拆分；见 [CHANGELOG.md](CHANGELOG.md)）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更明细见仓库级档案 `_log/feature-eng/`（安装包不含）。

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

## 0.2.28+ 机检加固验收

| 检查 | 结果 |
|---|---|
| YAML 行内注释（`gates: #` / `design_confirmed: "…" #` / `artifacts.spec`）不再漏检或误报 | 探针 |
| 审核模板逐字拷贝（`result: —` / `reviewer: —`）→ gate-evidence FAIL | 探针 |
| 回链仪式与降级占位 → controller_proxy 证据条 FAIL | 探针 |
| `path=full` 缺 `go/pre_impl/gate/verify` → gate-evidence FAIL | 探针 |
| B 无 plan：无 `审核-plan.md` FAIL，有则 PASS | 探针 |
| `stage=smoke` 不再绕过 `审核-implement.md` | 探针 |
| `close-check`：ARCHIVE 空 Commit 列报警为 empty；F 缺 `test_report` FAIL；测试报告模板占位 FAIL；`--expect-fail` 可用 | 探针 |
| 安装态 `selfcheck --no-log` PASS；`sync-skill-version` 不需父级 README | 探针 |
| 文本 UTF-8 无 BOM + LF；`.gitattributes` 固定 `eol=lf` | selfcheck |
| `check-contracts` / `feature.mjs contracts`：flow/template/config/回链/L2 映射与 lib 单源一致 | PASS |
| `selfcheck` 仓库态全绿 | 688/688 |

## 继承 · as-of 0.2.27 / 更早

见 [CHANGELOG.md](CHANGELOG.md) 索引与仓库级档案 `_log/feature-eng/`（含 `_archive`；安装包不含）；0.2.27 selfcheck 拆分与更早能力仍有效。现行权威钉：**0.2.28**。

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
