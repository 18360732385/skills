# release-eng 验收记录（0.3.21-dev）

> 静态对照 + `scripts/selfcheck.mjs` 烟测。真实 prepare/resume/audit/seal 仍须在目标仓由 Agent 执行并遵守硬闸。  
> **非 harness land**——本包只提供门禁/索引/selfcheck，不宣称可自动 land。

## 版本

当前 **0.3.21-dev**（纪律 bulletproof；其上 0.3.20-dev 版本单点维护 · 0.3.19-dev 薄入口 / modes/）。权威号见 [`_meta/manifest.yaml`](_meta/manifest.yaml)。变更见 [CHANGELOG.md](CHANGELOG.md)（明细 [`../_log/release-eng/`](../_log/release-eng/)）。

本版**不**改脚本行为契约；补 Agent 纪律防绕过（相对 0.3.20-dev）。

## 0.3.21-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / 文档钉头 **0.3.21-dev**；`sync-skill-version --check` | 有 |
| SKILL：Red Flags + 借口表 + When NOT；description 为触发/症状（非流程摘要） | 有 |
| gates-common：口述回显首问；逾期无口头豁免 | 有 |
| git-gates：中止禁止评审落盘 | 有 |
| write-plan：非确认词黑名单 | 有 |
| RED→GREEN 记录 [`../_log/release-eng/RED-baseline-pressure.md`](../_log/release-eng/RED-baseline-pressure.md)：基线 4/4 B → VERIFY 4/4 A | 有 |
| 仍标明非 harness land；脚本契约未改 | 有 |

## 0.3.20-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| `_meta/manifest.yaml` 为权威 `0.3.20-dev`（历史钉；现行见 0.3.21-dev）；当时 SKILL / AGENT-INDEX / README / VERIFY + 仓根 README 钉头一致 | 有 |
| `node scripts/sync-skill-version.mjs --check` exit 0 | 有 |
| selfcheck `PIN` 读自 manifest | 有 |
| CHANGELOG 索引含 0.3.20-dev / 0.3.19-dev 且存在 `_log/release-eng/` 对应文件 | 有 |
| AGENT-INDEX 记载发版四步 | 有 |
| QUICKSTART 仍不钉号 | 有 |

## 0.3.19-dev 增量验收

| 检查 | 结果 |
|---|---|
| `node scripts/selfcheck.mjs` exit 0 | 烟测 |
| manifest / CHANGELOG / README / SKILL / AGENT-INDEX / VERIFY 钉 **0.3.19-dev** | 有（历史钉；现行见 0.3.21-dev） |
| CHANGELOG 索引含 0.3.19-dev / 0.3.18-dev 且存在对应 `_log/release-eng/` 文件 | 有 |
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
