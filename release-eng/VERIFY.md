# release-eng 验收记录（0.3.18-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。

## 版本

当前 **0.3.18-dev**（P0 门禁包：AGENT-INDEX / QUICKSTART / VERIFY / selfcheck）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改发版仪式语义、模式分流或脚本行为契约（相对 0.3.17）。

## 0.3.18-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / QUICKSTART / VERIFY / AGENT-INDEX 钉 **0.3.18-dev** | 有 |
| CHANGELOG 含标题 `## 0.3.18-dev` | 有 |
| [AGENT-INDEX.md](AGENT-INDEX.md) 存在；含「必读」「按需」；标明非 harness land | 有 |
| [QUICKSTART.md](QUICKSTART.md) 一页纸；链 AGENT-INDEX；主循环 prepare→push-gate→freeze→WritePlan→seal | 有 |
| [SKILL.md](SKILL.md) 链到 AGENT-INDEX / VERIFY / QUICKSTART | 有 |
| [README.md](README.md) 含「如何烟测」；不再声称无 VERIFY/selfcheck | 有 |
| 模式文件齐：prepare / resume / audit / seal | 有 |
| 关键脚本齐：format / push-gate / freeze / freeze-enrich / ai-track / note-merge / seal-check / selfcheck | 有 |
| fixtures 种子：`fixtures/docs/releases/`（releases.md · templates · notes 示例 artifacts） | 有 |
| selfcheck 行为断言：`identityFromBranch` · 截断5 常量 · `shortCommitHash` · artifacts.json 形 · seal-check `--help` | 有 |
| **未**迁模式 md 入 `modes/`；**未**统一 `release.mjs`；**未**做多宿主 parity | 有（本切片范围外） |

## 继承基线（0.3.17）

| 检查 | 关键词 |
|---|---|
| 版本身份 = 发版分支归一化；发版日期解耦 | `identityFromBranch` · notes/`<slug>`/`<slug>`.md |
| 截断5（前3后2、hash前8位） | `COMMIT_DISPLAY_*` · `shortCommitHash` |
| 合并来源 origin/ 归一 + 一句话 | `normalizeSourceBranch` · `branchOneLineSummary` |
| 目录包 artifacts.json SSOT；seal-check | note-merge · seal-check |
| jobs 汇总单文件；yml 注释键上一行 | jobs/README.md · `dumpYaml` |
| 双轨研判 / 逾期硬闸 / 首次发版基线=`无` | ai-track · gates-common · push-gate |

## 烟测命令

```bash
cd release-eng && node scripts/selfcheck.mjs
```
