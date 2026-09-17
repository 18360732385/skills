# feature-eng 验收记录（0.2.4）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 init/start/advance/close 仍须在目标仓由 Agent 执行并遵守硬闸。

## 版本

当前 **0.2.4**（P0 索引/selfcheck + P1 预检/截断/QUICKSTART + P2 status-scan / close_pitfalls）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改动环节语义与默认绑定 skill 名（`config/stage-bindings.yaml` 推荐包与 0.2.3 同形；仅增 `defaults.close_pitfalls`）。

## 0.2.4 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / QUICKSTART 钉 **0.2.4** | 有 |
| CHANGELOG 含正式标题 `## 0.2.4` | 有 |
| [AGENT-INDEX.md](AGENT-INDEX.md) 存在；含「必读」「按需」 | 有 |
| [QUICKSTART.md](QUICKSTART.md) 一页纸；链 AGENT-INDEX；主循环 init→start→advance→close | 有 |
| [SKILL.md](SKILL.md) 链到 AGENT-INDEX / QUICKSTART | 有 |
| binding「绑定 skill 可调起」预检 checklist + 失败文案 | 有 |
| [config/truncate-contracts.yaml](config/truncate-contracts.yaml) design/spec allow/forbid | 有 |
| binding / SKILL 提及 truncate-contracts | 有 |
| `scripts/status-scan.mjs` 存在；[status.md](status.md) 链到它 | 有 |
| `defaults.close_pitfalls`（off\|optional\|on）见于 bindings + example；[close.md](close.md) 文档化；默认 optional 不强制 | 有 |
| 模式文件齐：init / rebind / start / resume / status / advance / close | 有 |
| 可绑 11 键齐且 skill 非 null；example 键与正式 yaml 对齐 | 有 |
| 模板 5 件齐 | 有 |
| SKILL 含「调度员不进厨房」与写盘权责 | 有 |
| 禁根 `CONTEXT.md` 规则仍在 | 有 |
| **未**改默认 bindings 推荐 skill 名 | 有（对照 0.2.3） |

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
# 可选：在仓库根
node feature-eng/scripts/status-scan.mjs
```
