# feature-eng 验收记录（0.2.15-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含 fixtures / behavioral checks）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.15-dev**（P2：harness_probe + close_pitfalls 有脚本时收紧；其上 0.2.14 消歧接力 · modes 大合并 · …）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名；`harness_land` 仍为 false；`feature.mjs` 不写盘；yaml `defaults.close_pitfalls` 字面仍为 `optional`。

**钉号纪律**：文首与 manifest 为现行权威钉；「继承 · as-of」不得把旧钉写成现行。

## 0.2.15-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| 入口文档钉 **0.2.15-dev**；仓根 README feature-eng 行同步 | 有 |
| CHANGELOG 含 `## 0.2.15-dev` 且保留 `## 0.2.14-dev` | 有 |
| start 1b `harness_probe` 软·不阻断；无 meta 静默 | 有 |
| close `close_pitfalls` 解析序含「有 lint 脚本 → 视为 on」 | 有 |
| bindings 仍 `close_pitfalls: optional`；注释声明 start 可收紧 | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## 继承 · as-of 0.2.14-dev / 更早

见 CHANGELOG；P0 消歧、modes 大合并、P1 闸检、M1–M6、O1–O14 等仍有效。现行权威钉：**0.2.15-dev**。

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30 | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 或升 Node ≥22 |
| `node -v` 低于 `engines.node` | worker / 工具链崩 | verify 前对照 engines |

## 烟测命令

```bash
node scripts/selfcheck.mjs
```
