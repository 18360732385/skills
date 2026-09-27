# feature-eng 验收记录（0.2.10-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测（含夹具行为断言）。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.10-dev**（闸门证据机检；继承 M1–M6 + O1–O14 + modes/ + 薄 CLI）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名；`harness_land` 仍为 false；`feature.mjs` 不写盘。跨仓 O15–O19 **不在本版范围**。

## 0.2.10-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.2.10-dev** | 有 |
| CHANGELOG 含 `## 0.2.10-dev` 且保留 `## 0.2.9-dev` | 有 |
| `scripts/gate-evidence.mjs` 存在；advance-gate / close-ready PASS | 有 |
| `gate-theater-bad` 假 transcript / 缺审核 → gate-evidence FAIL | 有 |
| advance-gate 落盘 `审核-grill.md` / `审核-design.md`；无「可不落盘」 | 有 |
| SKILL 证据条 + 红旗 + 合理化表；description 仅触发条件 | 有 |
| `controller_proxy` 不豁免证据条（正文） | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## 0.2.9-dev 增量验收（继承）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| M1–M6 monorepo 摩擦优化 | 有 |
| 钉号已升至 **0.2.10-dev**（本表为 0.2.9 继承基线） | 有 |

## 0.2.8-dev 增量验收（继承）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.2.8-dev** | 有 |
| CHANGELOG 含 `## 0.2.8-dev` 且保留 `## 0.2.7-dev` | 有 |
| O8：progress `sibling_repos`；start/grill；回链「跨仓」；消费契约闸 | 有 |
| O9：gates-common 联调矩阵；QUICKSTART Vite/Spring 片段 | 有 |
| O10：QUICKSTART mktemp 配方；init/start 提示 | 有 |
| O11：env_notes `pinned_deps`；下文 Node×jsdom 注 | 有 |
| O12：binding/proto-bridge/artifacts/gates-common 轻量草图契约 | 有 |
| O13：artifacts/回链 web+auth 会话存储枚举 | 有 |
| O14：verify/env_notes `api_base_mode` | 有 |
| `harness_land: false`；feature.mjs 仍不写盘 | 有 |

## Node×jsdom 已知坏组合（O11）

| 组合 | 现象 | 处置 |
|---|---|---|
| Node 20 × jsdom@30（常随 Vitest 5 / 最新 create-vite） | `webidl.util.markAsUncloneable is not a function` | 钉 `jsdom@^24.1.3` 写入 `env_notes.pinned_deps`，或升 Node ≥22 并与 `engines.node` 一致 |
| `node -v` 低于 `package.json#engines.node` | 测试 worker / 工具链直接崩 | verify 前对照 engines；差异写入 `env_notes` |

脚手架推荐：`engines.node` 下限与 README 徽章一致；CI 与本地同主版本。

## 继承基线（0.2.7-dev）

## 0.2.7-dev 增量验收（继承）

| 检查 | 结果 |
|---|---|
| O1–O7：chef_mode / repo_bootstrap / authorized_by / env_notes / review_policy / 中文文件名 / close 双归档 | 有 |
| close-check 对 close-ready PASS | 有 |
| 钉号已升至 **0.2.9-dev**（本表为 0.2.8 继承基线） | 有 |

## 继承基线（0.2.6-dev）

## 0.2.6-dev 增量验收（继承）

| 检查 | 结果 |
|---|---|
| modes/ + feature.mjs + advance-gate / bindings-bad / close-ready | 有 |
| selfcheck 行为断言 | 有 |

## 继承基线（0.2.5-dev / 0.2.4 / 0.2.3）

见 CHANGELOG；夹具形状、AGENT-INDEX、runs 平级、中文短名等仍有效。

## 烟测命令

```bash
cd feature-eng && node scripts/selfcheck.mjs
node scripts/feature.mjs modes
node scripts/feature.mjs status --cwd scripts/fixtures/init-skeleton
node scripts/feature.mjs status --cwd scripts/fixtures/advance-gate
node scripts/gate-evidence.mjs --cwd scripts/fixtures/advance-gate --slug 2026-09-19-advance-gate-demo
node scripts/gate-evidence.mjs --cwd scripts/fixtures/gate-theater-bad --slug 2026-09-27-gate-theater-bad --expect-fail
node scripts/close-check.mjs --cwd scripts/fixtures/close-ready --slug 2026-09-19-close-ready-demo
# 可选：node -v 对照消费仓 package.json#engines（O11）
```
