# release-eng

发版仪式 skill（**仅用户点名**；`disable-model-invocation: true`）。

## 版本

权威号只认 [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`（当前 **0.3.32**）。  
[CHANGELOG.md](CHANGELOG.md) 为历史；[`docs/releases/releases.md`](../../../docs/releases/releases.md) 过程索引只**引用** manifest，不另钉号。  
`0.3.x`：**补丁序**（权威号见 manifest），勿用本轮改动跳升 `0.4.0`。

## 入口

- 仪式入口：[SKILL.md](SKILL.md)
- 薄 CLI：`node scripts/release.mjs`（modes / 脚本转发；不代写盘）
- 一页纸：[QUICKSTART.md](QUICKSTART.md)
- Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)
- 验收：[VERIFY.md](VERIFY.md)
- 模式规格：[modes/README.md](modes/README.md)

## 如何烟测

```bash
cd release-eng && node scripts/selfcheck.mjs
node scripts/release.mjs --help
node scripts/release.mjs modes
```

须 `PASS … (release-eng 0.3.32)` 且 exit 0（默认只打汇总；逐条用 `--verbose`）。覆盖：manifest 钉号 · `modes/` 模式 md · 关键脚本 · fixtures 种子 · `identityFromBranch` / 截断5 / artifacts 形 · seal-check `--help` · release.mjs modes。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。  
- **本仓可用**：skill + `fixtures/docs/releases/` + `scripts/` 已齐；bootstrap 空仓从 fixtures 复制。  
- **迁到他仓**：须整目录拷贝（含 `fixtures/`、`scripts/`、`modes/`）；目标仓无 `docs/releases/` 时靠 fixtures 种子。  
- **非 harness-eng land**（`harness_land: false`）：有 VERIFY / selfcheck 作**最小安全皮带**，但对齐的是发版仪式门禁，**不**对齐 harness 自动 land 流水线。跨仓推广靠人工拷贝 + 点名仪式，不靠 harness 编排。

## `首次发版`

基线填 **`无`**（脚本 `--baseline none`）：push-gate 只验发版分支；freeze 的 Git 四表取全量，**上线候选不扫整树**（`inventory` + 问卷起迁）。增量发版仍用 `release` / `main`（或你确认的基线）走 **键级diff**。

## 约定

全文唯一权威：[modes/conventions.md](modes/conventions.md)（发版日期算法、身份归一化、目录包、截断5、mergeSources、prod、SQL序、密文、notes/ 兼容、repo-profile、逾期书面跳过）。本文不复述。
