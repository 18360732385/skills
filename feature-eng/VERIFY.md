# feature-eng 验收记录（0.2.13-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.13-dev**（modes 大合并：7 入口 + `specs/` 四手册；继承 P2/P1 闸检 + M1–M6 + O1–O14）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名；`harness_land` 仍为 false；`feature.mjs` 不写盘。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。

## 0.2.13-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| 入口文档钉 **0.2.13-dev**；仓根 README feature-eng 行同步 | 有 |
| CHANGELOG 含 `## 0.2.13-dev` 且保留 `## 0.2.12-dev` | 有 |
| `modes/` 根仅 7 入口 + README；无旧扁平 binding/stages/artifacts/gates-*/bridges/handoff | 有 |
| `modes/specs/{flow,gates,bridges,handoff}.md` 存在 | 有 |
| AGENT-INDEX 必读 ≤6；链 `specs/flow` + `specs/gates` | 有 |
| `feature.mjs modes` 分入口 / specs 两段 | 有 |
| manifest `specs_dir` + specs: flow/gates/bridges/handoff | 有 |
| QUICKSTART / truncate-contracts / close_pitfalls / status-scan 仍有效 | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## 继承 · as-of 0.2.12-dev / 更早

见 CHANGELOG；P2 lib/模板、P1 闸检 pass、M1–M6、O1–O14 等仍有效。现行权威钉：**0.2.13-dev**。

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30 | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 或升 Node ≥22 |
| `node -v` 低于 `engines.node` | worker / 工具链崩 | verify 前对照 engines |

## 烟测命令

```bash
cd feature-eng && node scripts/selfcheck.mjs
node scripts/feature.mjs modes
node scripts/feature.mjs gate-evidence --cwd scripts/fixtures/advance-gate --slug 2026-09-19-advance-gate-demo
node scripts/feature.mjs close-check --cwd scripts/fixtures/close-ready --slug 2026-09-19-close-ready-demo
```
