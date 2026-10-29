# feature-eng 验收记录（0.2.26）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.26**（批修复：死链清零 · 单源 · 机检加固 · 文档口径；其上 0.2.25 P2 · 0.2.24 P1 · …）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)（明细 [`../_log/feature-eng/`](../_log/feature-eng/)）。

本版**不**改动默认绑定 skill 名（`grill` 等别名仅加对照提示）；`eng_land` 仍为 false；`feature.mjs` 不写盘；yaml `defaults.close_pitfalls` 字面仍为 `optional`。本版**含** gate-evidence / close-check / auth / status-scan 机检改动（见 0.2.26 增量验收）。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。自 **0.2.24** 起开发增量亦用正式号（不加 `-dev`）。发版用 `sync-skill-version.mjs` 同步文档钉头。

## 0.2.26 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0（含 0.2.26 新增断言） | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.26`；入口文档钉头一致 | 有 |
| 死链零引用断言有（包内 md/yaml/tmpl 扫描旧名模式，selfcheck 26-1） | 有 |
| `GATE_KEYS`/`L2_FOR_GATE` 单源有（lib 导出 + gate-evidence/close-check/selfcheck import） | 有 |
| gate-evidence 中途环机检有（midstage-l2-bad 正向 FAIL、`--expect-fail` exit 0、close-ready PASS） | 有 |
| gate-evidence 内联 gates 防御 + 授权时间一致性 | 有 |
| close-check 幽灵键修复（ARTIFACT_KEYS 对齐）+ superpowers 归档双检查 | 有 |
| status-scan `done(needs-close)` 有 | 有 |
| auth `user_task` 须含数字有 | 有 |
| 门禁清单.md.tmpl 有（manifest templates + selfcheck TEMPLATES 双登记） | 有 |
| flow.md handoff 缺省推导序有 | 有 |
| SKILL description 含 `status`/`rebind` 有 | 有 |
| 审核文件 `reviewer` 字段有（tmpl + gates.md Part B） | 有 |
| CHANGELOG 索引含 0.2.26 且存在 `_log/feature-eng/0.2/0.2.26.md` | 有 |

## 0.2.25 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.25`；入口文档钉头一致 | 有 |
| `review_effective` / 同会话审核帽不强制 Task | 有 |
| close `契约同步: pr_branch` + merge 后再 refresh | 有 |
| pitfalls「→ Pn」归目标仓卫生 | 有 |
| express 相同 ISO / 同戳可接受 | 有 |
| gate-evidence advance-gate / close-check close-ready exit 0 | 有 |
| CHANGELOG 索引含 0.2.25 且存在 `_log/feature-eng/0.2/0.2.25.md` | 有 |

## 0.2.24 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.24`；入口文档钉头一致 | 有（历史钉；现行见 0.2.25） |
| design/spec 指针须粘贴 truncate `forbid:`；预检 D 文案含「未粘贴 forbid」 | 有 |
| `gates.proto_confirmed` 在 tmpl/回链/gates；`proto=entered` 时机检要求 ISO | 有 |
| B 无 plan → Go 等价 → 立即 proto-bridge 文案 | 有 |
| `artifacts.implement` / `pr_url` 在 tmpl + ARTIFACT_KEYS + 夹具 | 有 |
| gate-evidence advance-gate / close-check close-ready exit 0 | 有 |
| CHANGELOG 索引含 0.2.24 且存在 `_log/feature-eng/0.2/0.2.24.md` | 有 |

## 0.2.23-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.23-dev`；入口文档钉头一致 | 有（历史钉） |
| start/flow/回链/QUICKSTART 含 O5b（invoke 无 Task / CloudAgent·executor → inline） | 有 |
| 指针卡片含 `invoke_effective` | 有 |
| gates + QUICKSTART 含机械轨 A–D / `mech_track: local_self_attest` / 禁止空自报 | 有 |
| CHANGELOG 索引含 0.2.23-dev 且存在 `_log/feature-eng/0.2/0.2.23-dev.md` | 有 |

## 0.2.22 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.2.22`；入口文档 + 仓根 README 钉头一致 | 有（历史钉） |
| `node scripts/sync-skill-version.mjs --check` exit 0 | 有 |
| selfcheck `PIN` 读自 manifest | 有 |
| CHANGELOG 索引含 0.2.22 / 0.2.21 且存在 `_log/feature-eng/0.2/0.2.22.md` · `0.2/0.2.21.md` | 有 |
| AGENT-INDEX 记载发版四步 | 有 |

## 0.2.21 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| 入口文档钉 **0.2.21**；仓根 README feature-eng 行同步 | 有（历史钉；现行见 0.2.22） |
| CHANGELOG 索引含 0.2.21 / 0.2.20-dev 且存在对应 `_log/feature-eng/` 文件 | 有 |
| `progress.yaml` 模板含 `schema: topic-run/1` | 有 |
| `eng_probe` / `eng_snapshot` / `eng_land`；close 只写 `eng_snapshot` | 有 |
| SKILL「可选接力（工程化仓）」；无硬标题「与 harness-eng 的配合与互斥」 | 有 |

## 继承 · as-of 0.2.20-dev / 更早

见 CHANGELOG 索引与 `_log/feature-eng/`；P0/P1/P2 解耦、批 E bridges/close、批 D refresh、批 C 绑定解耦、unattended、modes 大合并等仍有效。现行权威钉：**0.2.26**。

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
```
