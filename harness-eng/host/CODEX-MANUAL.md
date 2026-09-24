# Codex 真人会话清单（0.7.2 · 高）

给本机已装 **Codex CLI / IDE / ChatGPT 桌面 Codex** 的同学。对照：[CODEX-PARITY.md](CODEX-PARITY.md)。

仓库至少有：根 `AGENTS.md`；若 `ai_tools` 含 codex：`.codex/hooks.json`、`.codex/rules/`、`.codex/config.toml.example`。

## 0. 信任项目

- [ ] 仓库根启动 Codex；workspace **trust**
- [ ] 未信任时不期待项目 hooks / 项目 MCP

## 1. AGENTS

- [ ] 根（及目录级）`AGENTS.md` 非空
- [ ] **不要**期望 `.cursor/rules/*.mdc` 被 Codex 当 instructions 加载

## 2. Starlark rules

- [ ] 磁盘有 `.codex/rules/*.rules`（如 `repository.rules`）
- [ ] 尝试 `git push` 类命令出现 prompt；`git reset --hard` 被 forbidden（以客户端为准）
- [ ] 知悉 rules 仍可能标 experimental

## 3. Hooks：`/hooks` trust

- [ ] `.codex/hooks.json` 含 `PreToolUse` matcher `^Bash$` 与 `Stop`
- [ ] 经 `codex-adapter.js`；`/hooks` 审阅并 **trust**
- [ ] `.githooks` 仍作兜底

## 4. MCP：`config.toml` + `/mcp`

- [ ] 审阅 `.codex/config.toml.example`；trusted 后拷贝/合并为 `.codex/config.toml`（gitignore）
- [ ] 本机 `config.toml` 可填连接参数；可提交的 example **无明文密钥**（用 `env_vars` 名）；**勿提交**真密进 git
- [ ] 写库类默认 `enabled = false`
- [ ] `/mcp` 可见；**不要**假设根 `.mcp.json` 生效

## 5. Skills

- [ ] L5：`.agents/skills/` 含同步产物与 `GENERATED.md`
- [ ] `/skills` 或 `$` 可发现

## 6. 已知悉

- [ ] 不做 `.mdc` 全量镜像
- [ ] 推荐纪律 B：无探测不默认勾选 Codex

## 回传模板

trust=是|否 / AGENTS=是|否 / rules=是|否 / hooks=已信任 / MCP=/mcp可见 / skills=是|否 / 非.mdc已知悉=是|否
