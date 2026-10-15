# feature-eng 验收记录（0.2.25）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.25**（P2：F-07～F-10；其上 0.2.24 P1 · …）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)（明细 [`../_log/feature-eng/`](../_log/feature-eng/)）。

本版**不**改动默认绑定 skill 名；`eng_land` 仍为 false；`feature.mjs` 不写盘；yaml `defaults.close_pitfalls` 字面仍为 `optional`；**不**改 gate-evidence 机检逻辑（仅文档口径）。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。自 **0.2.24** 起开发增量亦用正式号（不加 `-dev`）。发版用 `sync-skill-version.mjs` 同步文档钉头。

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

见 CHANGELOG 索引与 `_log/feature-eng/`；P0/P1/P2 解耦、批 E bridges/close、批 D refresh、批 C 绑定解耦、unattended、modes 大合并等仍有效。现行权威钉：**0.2.25**。

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30 | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 或升 Node ≥22 |
| `node -v` 低于 `engines.node` | worker / 工具链崩 | verify 前对照 engines |

## 烟测命令

```bash
node scripts/selfcheck.mjs
```
