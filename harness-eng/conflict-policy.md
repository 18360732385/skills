# 冲突策略

写入前必须体现在 WritePlan 的「动作」列。

| 情形 | 默认动作 | 可选（须用户选） |
|---|---|---|
| 目标路径不存在 | `create` | — |
| 目标已存在 + `params.on_exists=skip`（**resume 默认**） | `skip` | — |
| 目标已存在 + `params.on_exists=merge` | `merge` | — |
| 目标已存在 + `params.on_exists=fail`（land 空仓默认） | create 拒绝并报错 | 改 skip/merge |
| 目标存在且同构（已有索引+真相形态 / 同名 rule） | `skip` | `merge` 补缺章节 |
| 目标存在但异构 | `skip`，建议旁路路径 | `backup-create` |
| 根 `AGENTS.md` 已存在 | `merge` | `backup-create` / `skip` |
| 已有其他 alwaysApply 总览 | 不删旧；新增 `00` 前先问 | 合并进旧文件 / 双 always（警告上下文膨胀） |
| `.cursor/mcp.json` / `.mcp.json` / `.trae/mcp.json`（及遗留 `.qoder/mcp.json`）已存在 | **非 fill-mcp：永不覆盖** | fill-mcp 经 WritePlan 确认后可按 `ai_tools` 覆盖或 backup-create（多路径内容一致） |
| MCP 跟踪策略 `mcp_tracking` | land/L4 默认 **`example_only`**（`.gitignore` 忽略真密；仅 example 入库） | **`vendored_shared`**：团队约定跟踪共享 `mcp.json`（须写入 harness-meta；audit 不按反模式红灯；仍禁止把个人机绝对路径 / PAT 扩散到技能分发） |
| 密文写入 docs / mcp | **fill**：源文件已在**本仓**可读 → 允许写入并可入库 | land/seed 不主动扩散密文 |
| `docs/harness-eng/harness-meta.yaml` 已存在 | `merge`：脚本对 YAML 做**键级合并**（受管键 `ladder`/`domains`/`skill_version`/… 覆盖；未知用户键保留）；写入只走新路径 | `backup-create` |
| 仅有遗留 `.cursor/harness-meta.yaml`（或 `.yml`），新路径不存在 | **迁移**：复制/合并到 `docs/harness-eng/harness-meta.yaml`（同一键级合并语义），再按上列写入；**不自动删除**旧文件（遗留只读；可选手工清理） | 保留双份 / 手工删旧 |
| `docs/harness-eng/mcp-usage-guide.md` 已存在 | `skip`（resume）或按 `on_exists`；写入只走新路径 | `merge` / `backup-create` |
| 仅有遗留 `.cursor/mcp-usage-guide.md`（或旧名 `MCP使用说明.md`） | resume/upgrade：复制到新路径后 skip/merge；**不自动删除**旧文件（遗留只读；可选手工清理） | 保留双份 / 手工删旧 |
| `.claude/settings.json` / `.qoder/settings.json` / `.codebuddy/settings.json` / `.codex/hooks.json` / `.trae/hooks.json` 已存在 | **`merge-json-hooks`**：只追加/去重 hooks command；保留用户其它顶层键 | skip |
| 根 `.gitignore` 已存在（L4 snippet） | **追加**缺失行，不整文件覆盖 | skip |
| L5 已启用（meta `agent_config: true`） | `.cursor/rules` 改投 `docs/agent-config/rules/`；hooks 脚本改投 `docs/agent-config/hooks/`；`.cursor/hooks.json` / `.claude/settings.json` / CLAUDE.md 由 `sync.mjs` 生成，**render 不直渲**（互斥，避免被 sync 当 stale 清理或漂移）；全量镜像宿主 **omit** 冗余 `1x-contract-sync`（Codex 仍写 `.codex/contract-sync.md`） | — |
| L3+ / L5 全量镜像宿主已有冗余 `1x-contract-sync.md` | resume **`skip`**，**不自动删除**；可选列入移交 TODO 手工清理 | 用户书面要求才 backup-create / 删除 |
| L5 生成物（带 GENERATED 标记）已存在且内容异构 | 勿手改对齐；改 SSOT 后跑 `node scripts/agent-config/sync.mjs`；漂移校验 `sync.mjs --check` | backup-create（仅用户书面要求） |
| 文件内容含疑似密码/Token | **拒绝写入同路径** | 提示移出 git |
| `docs/superpowers/archive/**` 业务正文 | 永不从本 skill 覆盖 | — |

## merge 语义

1. 解析目标 Markdown/MDC 的 `##` 二级标题（MDC 可忽略 frontmatter 后再解析）。
2. 模板有、目标无的章节 → **追加到文末**，标题旁可注 `（harness-eng 补齐）`。
3. 已有同名章节 → **不改正文**。
4. rule frontmatter：仅补全缺失的 `description` / `alwaysApply`；**不改**已有 `globs`，除非用户在 `Q_GLOBS` 确认覆盖。

### JSON hooks merge（0.2.6+）

用于 `.claude/settings.json`、`.qoder/settings.json`、`.codebuddy/settings.json`、`.codex/hooks.json`、`.trae/hooks.json`：

1. 解析双方 JSON；保留目标已有**非 `hooks`** 顶层键。
2. 按事件名（如 `PreToolUse`）合并 matcher 组。
3. hook `command` 路径规范化后去重；已存在则 skip。
4. 只合并 hooks；保留用户其它顶层键。

## backup-create

1. 将原文件复制为 `{name}.bak-harness-YYYYMMDD`（或用户指定）。
2. 再 `create` 新文件。
