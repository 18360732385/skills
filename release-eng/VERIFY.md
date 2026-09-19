# release-eng 验收记录（0.3.19-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。

## 版本

当前 **0.3.19-dev**（统一 `release.mjs` + 模式 md 迁入 `modes/`；P0 门禁包继承）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)。

本版**不**改发版仪式语义与既有脚本行为契约（相对 0.3.18-dev）；含统一薄入口与模式 md 迁入 `modes/`。

## 0.3.19-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / QUICKSTART / VERIFY 钉 **0.3.19-dev** | 有 |
| CHANGELOG 含 `## 0.3.19-dev` 且保留 `## 0.3.18-dev` | 有 |
| 模式 md 位于 `modes/`（prepare/resume/audit/seal/freeze/write-plan/gates-*/questions/ai-track/bootstrap/recommended/idempotency） | 有 |
| [modes/README.md](modes/README.md) 索引表存在 | 有 |
| SKILL / AGENT-INDEX / QUICKSTART 链接指向 `modes/` | 有 |
| `release.mjs` `modes` / 模式 `--help` 指向 `modes/*.md` | 有 |
| manifest `modes_dir: modes/` | 有 |
| 仍标明非 harness land | 有 |
| `scripts/release.mjs --help` / `modes` 列出 prepare/resume/audit/seal | 有 |
| `release.mjs` 可转发 seal-check / push-gate `--help` | 有 |


## 继承基线（0.3.18-dev）

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| [AGENT-INDEX.md](AGENT-INDEX.md) 存在；含「必读」「按需」；标明非 harness land | 有 |
| [QUICKSTART.md](QUICKSTART.md) 一页纸；链 AGENT-INDEX；主循环 prepare→push-gate→freeze→WritePlan→seal | 有 |
| [SKILL.md](SKILL.md) 链到 AGENT-INDEX / VERIFY / QUICKSTART | 有 |
| [README.md](README.md) 含「如何烟测」；不再声称无 VERIFY/selfcheck | 有 |
| 关键脚本齐：release / format / push-gate / freeze / freeze-enrich / ai-track / note-merge / seal-check / selfcheck | 有 |
| fixtures 种子：`fixtures/docs/releases/`（releases.md · templates · notes 示例 artifacts） | 有 |
| selfcheck 行为断言：`identityFromBranch` · 截断5 常量 · `shortCommitHash` · artifacts.json 形 · seal-check `--help` | 有 |

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
node scripts/release.mjs --help && node scripts/release.mjs modes
```
