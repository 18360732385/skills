# feature-eng

用户点名的开发流程控制器（`disable-model-invocation: true`）。与 [`release-eng`](../release-eng/) 同级、互不替代。

入口与仪式：[SKILL.md](SKILL.md)。版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)。变更：[CHANGELOG.md](CHANGELOG.md)。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。
- **本仓可用**：skill + `config/` + `templates/` 已齐；改 SSOT 后须跑 `node scripts/agent-config/sync.mjs`（若目标仓有该管线）。
- **迁到他仓**：整目录拷贝；`stage-bindings.yaml` 需按目标仓工具链重新 `init`（再走推荐包**首问**）。
- 过程态 `docs/superpowers/runs/` 依赖目标仓已有 superpowers 目录约定；无则先建索引（见 harness-eng 模板）。
- **收口**：`close.md` 为 skill 内规则；契约目录 / pitfalls lint 为可选增强。
