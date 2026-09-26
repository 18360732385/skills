# Codex 真人会话清单（0.7.14 · 高）

给本机已装 **Codex CLI / IDE / ChatGPT 桌面 Codex** 的同学。对照：[CODEX-PARITY.md](CODEX-PARITY.md)。

仓库至少有：根 `AGENTS.md`；若 `ai_tools` 含 codex：`.codex/hooks.json`、`.codex/rules/`、`.codex/config.toml.example`、`.codex/hooks/codex-hook.cmd`。

**可机证优先**：`/mcp`、skills、hooks dry-run、githooks、Starlark **观测** → [session-live 1.2](../modes/session-live.md)（`human_gates`：`workspace_trusted` / `hooks_trusted`）。多宿主 → `--emit-playbook` / `--merge-matrix`。**workspace trust 与 `/hooks` trust 仍须人开**（本手册第 0 / 3 节）。

## 0. 信任项目

- [ ] 仓库根启动 Codex；workspace **trust**
- [ ] 未信任时不期待项目 hooks / 项目 MCP

## 1. AGENTS

- [ ] 根（及目录级）`AGENTS.md` 非空
- [ ] **不要**期望 `.cursor/rules/*.mdc` 被 Codex 当 instructions 加载
- [ ] 「Rules 索引」含 Codex 小节

## 2. Starlark rules

- [ ] 磁盘有 `.codex/rules/*.rules`（如 `repository.rules`）
- [ ] 尝试 `git push` 类命令出现 prompt；`git reset --hard` / `git push --force` 被 forbidden（以客户端为准）
- [ ] 知悉 rules 仍可能标 experimental

## 3. Hooks：`/hooks` trust

- [ ] `.codex/hooks.json` 含 `PreToolUse` matcher `^Bash$`、`mcp__mysql` 与 `Stop`
- [ ] 每条 **harness** command hook 含 **`commandWindows`**（经 `codex-hook.cmd`；勿依赖 bash `$(git …)`）
- [ ] `codex-stop-checklist.js` 在有脏交付文件时写 **stderr** 软提醒（非空壳）
- [ ] 经 `codex-adapter.js`；`/hooks` 审阅并 **trust**
- [ ] `.githooks` 仍作兜底
- [ ] `.gitignore` 含 `.codex/config.toml`（真密本机文件）

## 4. MCP：`config.toml` + `/mcp`

- [ ] 审阅 `.codex/config.toml.example`（`enabled` 来自 `docs/agent-config/mcp/policy.json`）；trusted 后拷贝/合并为 `.codex/config.toml`（gitignore）
- [ ] 本机 `config.toml` 可填连接参数并可覆盖 `enabled`；可提交的 example **无明文密钥**（用 `env_vars` 名）；**勿提交**真密进 git
- [ ] 写库类（mysql/redis 等）默认 `enabled = false`；gitlab/chrome 等可按 policy 建议为 `true`
- [ ] `/mcp` 可见；**不要**假设根 `.mcp.json` 生效
- [ ] 改启用策略只改 `mcp/policy.json` 后跑 sync（勿手改 GENERATED example）
- [ ] **calibrate**：无 JSON 真密时，`fill-calibrate-live` 可读项目 toml；`env_vars` 须在本机环境已设置（或 toml 内联 `[mcp_servers.*.env]`）

## 5. Skills

- [ ] L5：`.agents/skills/` 含 `contract-sync` / `api-doc-sync` / `db-doc-sync` / `redis-doc-sync` / `jobs-doc-sync` / `frontend-web` 与 `GENERATED.md`
- [ ] `/skills` 或 `$` 可发现
- [ ] 知悉分层：Skills=域引导；Starlark=命令；soft hooks=提醒；**可选** rulehook 等才做 NL deny（见 PARITY）

## 6. 可选 L4 rulehook（默认跳过）

仅当仓内有 `.rulehook/rulehook.toml`（勾选 `Q_RULEHOOK` 或自建）时：

- [ ] 本机已装 `rulehook` CLI（Python 3.11+；见 [rulehook](https://github.com/xwk-911/rulehook)）
- [ ] `rulehook check` 在仓库根通过
- [ ] sync 后 `.codex/hooks.json` 含 `rulehook hook --target codex`，且仍保留 harness `^Bash$` / Stop
- [ ] `/hooks` 已 trust rulehook 条目
- [ ] 试一条短硬红线（如削弱测试）可被 deny；未装 CLI 时不应拖垮 soft hooks（fail_open）
- [ ] **不**把 `.mdc` 全量拷进 rulehook；只保留短硬 Never do
- [ ] Win 覆盖可能 PARTIAL（与 L3 相同限制）

## 7. 已知悉

- [ ] 不做 `.mdc` 全量镜像
- [ ] 推荐纪律 B：无探测不默认勾选 Codex
- [ ] 应入库 hooks/rules/example；勿入库 `config.toml`
- [ ] **Windows 限制**：部分 shell 走 `unified_exec` / `command_execution` 时，`PreToolUse(^Bash$)` 可能不触发（官方 hooks「不完全拦截」）；`.githooks` 仍兜底。Stop / 已走 Bash tool 的路径不受此限
- [ ] **不**默认依赖 rulehook；勾选才装；须 `/hooks` trust

## 回传模板

trust=human_gates.workspace_trusted / hooks_trusted=… / session-live reason_code=… / AGENTS=是|否 / rules=是|否 / MCP=/mcp可见 / skills=是|否 / rulehook=未装|已装已验 / 非.mdc已知悉=是|否
