# feature-eng 验收记录（0.2.5-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含夹具行为断言）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.5-dev**（相对 0.2.4：最小夹具 + 行为自检）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名。

## 0.2.5-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测（断言数 > 0.2.4） |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.2.5-dev** | 有 |
| CHANGELOG 含 `## 0.2.5-dev` 且保留 `## 0.2.4` | 有 |
| `scripts/fixtures/init-skeleton/` 含 progress.yaml + 回链.md + runs README | 有 |
| `scripts/fixtures/progress-bad/` 缺字段负例 | 有 |
| selfcheck 校验 progress 形状（顶层键 / artifacts / gates / 枚举） | 有 |
| selfcheck 模板↔夹具顶层键契约对齐 | 有 |
| `status-scan.mjs` 对夹具根 exit 0 并打印 slug/stage/path | 有 |
| 负例夹具被形状校验拒绝 | 有 |

## 继承基线（0.2.4）

| 检查 | 结果 |
|---|---|
| AGENT-INDEX 必读/按需；QUICKSTART 一页纸 | 有 |
| binding 预检 + truncate-contracts design/spec | 有 |
| status-scan；close_pitfalls off\|optional\|on | 有 |
| 11 绑定键非空；模板 5 件；调度员不进厨房；禁根 CONTEXT.md | 有 |

## 继承基线（0.2.3）

| 检查 | 关键词 |
|---|---|
| 过程态 `docs/runs/{active\|archive}/` | runs 平级 superpowers |
| 人读中文短名 + 机读 `progress.yaml` | 回链 / 审核-<stage> |
| `handoff_policy` 主动调起；L1/L2 | advance · gates-review |
| domain 条件桥；Proto 可推翻 | domain-bridge · proto-bridge |

## 烟测命令

```bash
cd feature-eng && node scripts/selfcheck.mjs
# 可选：对夹具根
node scripts/status-scan.mjs   # cwd=scripts/fixtures/init-skeleton
```
