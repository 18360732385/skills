# feature-eng 验收记录（0.2.4-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.4-dev**（P0：热路径索引 + 验收桩 + selfcheck）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定（`config/stage-bindings.yaml` 与 0.2.3 同形）。

## 0.2.4-dev 增量验收（P0 · 索引 / selfcheck）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL 指针钉 **0.2.4-dev** | 有 |
| [AGENT-INDEX.md](AGENT-INDEX.md) 存在；含「必读」「按需」 | 有 |
| [SKILL.md](SKILL.md) 链到 AGENT-INDEX（Agent 热路径） | 有 |
| README 提及 VERIFY + `node scripts/selfcheck.mjs` | 有 |
| 模式文件齐：init / rebind / start / resume / status / advance / close | 有 |
| 可绑 11 键齐：grill · design · domain · spec · plan · proto · testdesign · implement · review · verify · diagnose | 有 |
| 模板 5 件齐（progress / 回链 / 测试用例 / 测试报告 / runs-README） | 有 |
| SKILL 含控制器边界「调度员不进厨房」与写盘权责表 | 有 |
| 禁根 `CONTEXT.md` 规则仍在 SKILL / stages / binding | 有 |
| **未**改 stages 语义或默认 bindings 推荐包 | 有（对照 0.2.3） |

## 继承基线（0.2.3）

| 检查 | 关键词 |
|---|---|
| 过程态 `docs/runs/{active\|archive}/` | runs 平级 superpowers |
| 人读中文短名 + 机读 `progress.yaml` | 回链 / 审核-\<stage\> |
| `handoff_policy` 主动调起；L1/L2 | advance · gates-review |
| domain 条件桥；Proto 可推翻 | domain-bridge · proto-bridge |

## 烟测命令

```bash
cd feature-eng && node scripts/selfcheck.mjs
```
