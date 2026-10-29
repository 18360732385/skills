# feature-eng

用户点名的开发流程控制器（`disable-model-invocation: true`，**须点名**，不自动加载）。与 [`release-eng`](../release-eng/) 同级、互不替代。

入口与仪式：[SKILL.md](SKILL.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)。变更：[CHANGELOG.md](CHANGELOG.md)。

验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`（须 PASS）。薄 CLI：`node scripts/feature.mjs`（modes / status / gate-evidence / close-check）。闸门证据：`node scripts/gate-evidence.mjs`。

0.2.28 要点：selfcheck 主题拆分（harness/context/suite-*）；`_log` 早期 0.2 归档至 `_archive/0.2-early`；RETAINED=CHANGELOG 近期索引；`--verbose`/`--no-log`/`--strict-log`。历史版本见 [CHANGELOG.md](CHANGELOG.md) / [`../_log/feature-eng/`](../_log/feature-eng/)。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。
- **本仓可用**：skill + `config/`（种子）+ `templates/` 已齐；业务绑定写目标仓 **`docs/runs/stage-bindings.yaml`**（`init`/`rebind`）；**禁止**代跑目标仓 `scripts/agent-config/sync.mjs`（若存在）。
- **迁到他仓**：技能推荐用户级安装；目标仓跑 `init` 生成 `docs/runs/stage-bindings.yaml`（可先用 `stage-bindings.minimal.yaml` 种子）。
- 过程态：`docs/runs/`（与 `docs/superpowers/` 平级）；语料仍在 superpowers。旧路径 `docs/superpowers/runs/` 仅兼容提示迁移。
- **收口**：[modes/close.md](modes/close.md) 为 skill 内规则（含 active→archive）；契约目录 / pitfalls lint 为可选增强。

## 中文过程态文件名（契约，O6）

下列**中文短名是契约的一部分**，不得擅自改成英文文件名（机读键仍在 `progress.yaml` 用英文）：

| 文件 | 用途 |
|---|---|
| `回链.md` | 产物回链总表 |
| `测试用例.md` | Full 路径用例 |
| `测试报告.md` | Full 路径验证报告 |
| `术语增量.md` | 主题术语（禁写根 CONTEXT.md） |
| `门禁清单.md` | gate 环 L1 必查（或回链等价） |
| `审核-<stage>.md` | L2 审核结论（stage 为英文键） |
| `交接.md` | 交接 |

脚本与夹具须 **UTF-8**；跑 selfcheck / 跨平台工具时建议 `LC_ALL=C.UTF-8`（或等价 UTF-8 locale）。Windows：Node 不依赖 LC_ALL，PowerShell 默认 UTF-8 即可。
