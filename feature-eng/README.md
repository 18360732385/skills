# feature-eng

用户点名的开发流程控制器（`disable-model-invocation: true`）。与 [`release-eng`](../release-eng/) 同级、互不替代。

入口与仪式：[SKILL.md](SKILL.md)。Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)。变更：[CHANGELOG.md](CHANGELOG.md)。

验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`（须 PASS）。

0.2.4-dev 要点：AGENT-INDEX 热路径；VERIFY + selfcheck；钉号（不改环节语义/默认绑定）。  
0.2.3 要点：过程态 `docs/runs/{active|archive}/`（与 superpowers 平级）；人读中文短名 + `progress.yaml` 机读；close 归档。  
0.2.2 要点：过闸主动调起；L1/L2 环间审核。  
0.2.1 要点：init 中文环节表；domain 条件桥；Proto 可推翻；禁根 CONTEXT。  
0.2.0 要点：`invoke` / `run_mode` / 写盘权责 / 指针卡片 / 口令协议。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。
- **本仓可用**：skill + `config/` + `templates/` 已齐；改 SSOT 后须跑 `node scripts/agent-config/sync.mjs`（若目标仓有该管线）。
- **迁到他仓**：整目录拷贝；`stage-bindings.yaml` 需按目标仓工具链重新 `init`。
- 过程态：`docs/runs/`（与 `docs/superpowers/` 平级）；语料仍在 superpowers。旧路径 `docs/superpowers/runs/` 仅兼容提示迁移。
- **收口**：`close.md` 为 skill 内规则（含 active→archive）；契约目录 / pitfalls lint 为可选增强。
