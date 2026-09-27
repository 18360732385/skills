# feature-eng 验收记录（0.2.18-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.18-dev**（批 E：domain-bridge 收窄 · close 死链 · ARCHIVE 提交；其上 0.2.17 批 D · 0.2.16 批 C · …）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动默认绑定 skill 名；`harness_land` 仍为 false；`feature.mjs` 不写盘；yaml `defaults.close_pitfalls` 字面仍为 `optional`。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。

## 0.2.18-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| 入口文档钉 **0.2.18-dev**；仓根 README feature-eng 行同步 | 有 |
| CHANGELOG 含 `## 0.2.18-dev` 且保留 `## 0.2.17-dev` | 有 |
| bridges：破坏性 / 新限界上下文；REST+docs/api → 默认 skipped | 有 |
| close 死链改写 + close-check 对 active 路径 FAIL | 有 |
| ARCHIVE「提交」列 PR→merge SHA；不合规 WARNING | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## 继承 · as-of 0.2.17-dev / 更早

见 CHANGELOG；批 D delivery-checklist / harness refresh、批 C 绑定解耦、unattended、harness_probe、modes 大合并等仍有效。现行权威钉：**0.2.18-dev**。

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30 | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 或升 Node ≥22 |
| `node -v` 低于 `engines.node` | worker / 工具链崩 | verify 前对照 engines |

## 烟测命令

```bash
node scripts/selfcheck.mjs
```
