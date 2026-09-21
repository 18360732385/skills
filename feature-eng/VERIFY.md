# feature-eng 验收记录（0.2.7-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含夹具行为断言）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.7-dev**（O1–O7 摩擦优化；继承 modes/ + 薄 CLI + 加厚 fixtures）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名；`harness_land` 仍为 false；`feature.mjs` 不写盘。

## 0.2.7-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.2.7-dev** | 有 |
| CHANGELOG 含 `## 0.2.7-dev` 且保留 `## 0.2.6-dev` | 有 |
| O1：progress/回链 `chef_mode`；start/binding/QUICKSTART | 有 |
| O2：start/init `repo_bootstrap`；模板文件 ≠ 业务骨架 | 有 |
| O3：gates-common `authorized_by`；回链禁伪造聊天；selfcheck 拒假 transcript | 有 |
| O4：`env_notes` 伴生字段 | 有 |
| O5：review_policy 降级须写备注（start/gates） | 有 |
| O6：README 中文文件名契约；selfcheck UTF-8 中文模板名 | 有 |
| O7：close 双归档 L1；`close-check.mjs` 对 close-ready 夹具 PASS | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## 继承基线（0.2.6-dev）

## 0.2.6-dev 增量验收（继承）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.2.6-dev** | 有（本版已升至 0.2.7-dev） |
| CHANGELOG 含 `## 0.2.6-dev` 且保留 `## 0.2.5-dev` | 有 |
| 模式 md 位于 `modes/`（含 init/start/advance/close/status/resume/rebind/…） | 有 |
| 根目录无残留模式 md（仅入口/索引/CHANGELOG/VERIFY） | 有 |
| `scripts/feature.mjs --help` / `modes` / `status` | 有 |
| SKILL / AGENT-INDEX / QUICKSTART 链接指向 `modes/` | 有 |
| 边界文案仍含「调度员不进厨房」 | 有 |
| `scripts/fixtures/advance-gate/`：gates 时间戳 + L1 产物已填 + stage=plan | 有 |
| `scripts/fixtures/bindings-bad/`：null-skill / missing-key 负例被校验拒绝 | 有 |
| `scripts/fixtures/close-ready/`：archive + stage=done + gates.close | 有 |
| selfcheck 行为断言（非仅文件存在）覆盖加厚夹具 | 有 |
| 默认绑定 skill 名未改；feature.mjs 仍声明不写 progress | 有 |

## 继承基线（0.2.5-dev）

## 0.2.5-dev 增量验收（继承）

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
node scripts/feature.mjs modes
node scripts/feature.mjs status --cwd scripts/fixtures/init-skeleton
node scripts/feature.mjs status --cwd scripts/fixtures/advance-gate
node scripts/close-check.mjs --cwd scripts/fixtures/close-ready --slug 2026-09-19-close-ready-demo
# 可选直调：
# node scripts/status-scan.mjs   # cwd=scripts/fixtures/init-skeleton|advance-gate
```
