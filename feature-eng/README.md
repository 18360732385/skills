# feature-eng

开发流程控制器 skill（**仅用户点名**；`disable-model-invocation: true`）。

## 定位

只做流程控制：分诊 S/B/F、按环节调度已绑定子 skill、维护 `docs/superpowers/runs/<slug>/` 进度、校验各环节约定产物。**不做**澄清、设计、写码、原型、用例、测试等具体工作——那些由 `config/stage-bindings.yaml` 绑定到的子 skill 完成。

**绑定是推荐不是死绑**：`init` / `rebind` 首问必须展示推荐包，用户可一键采用、逐环改绑或指定其他 skill。

与 [`release-eng`](../release-eng/) 同级：release-eng 管发版域，feature-eng 管需求开发域；互不替代。

## 版本

权威号只认 [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`；[CHANGELOG.md](CHANGELOG.md) 为历史。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。
- **本仓可用**：skill + `config/` + `templates/` 已齐；改 SSOT 后须跑 `node scripts/agent-config/sync.mjs`（若目标仓有该管线）。
- **迁到他仓**：整目录拷贝；`stage-bindings.yaml` 需按目标仓工具链重新 `init`（再走推荐包首问）。
- 过程态 `docs/superpowers/runs/` 依赖目标仓已有 superpowers 目录约定；无则先建索引（见 harness-eng 模板）。
- **收口**：`close.md` 为 skill 内规则（不依赖仓库 rule 编号）；契约目录 / pitfalls lint 为可选增强。

## 入口

见 [SKILL.md](SKILL.md)。
