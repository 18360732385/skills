# Codex P0 真人会话清单（短）

给本机已装 **Codex CLI / IDE 扩展 / ChatGPT 桌面 Codex** 的同学。对照：[CODEX-PARITY.md](CODEX-PARITY.md)。做完在本页打勾或把结果贴回 PR。

仓库至少有：根 `AGENTS.md`、`.codex/harness.md`（可选）、`.codex/hooks.json`、`.codex/config.toml.example`（拷成 trusted 项目配置前先读注释）。

## 0. 信任项目层（trusted）

Codex **仅在项目被信任**时加载项目 `.codex/` 配置层（含 hooks / 项目 `config.toml` MCP）。

- [ ] 在仓库根启动 Codex；确认 workspace / project 已 **trust**（以当前 CLI/IDE 提示为准）
- [ ] 未信任时：不要期待项目 hooks / 项目 MCP 生效（用户级 `~/.codex` 仍可能加载）

## 1. AGENTS 指令链

官方：全局 `~/.codex` → 项目根走到 cwd；每层优先 `AGENTS.override.md` 否则 `AGENTS.md`；合计约 **32KiB**（`project_doc_max_bytes`）。

- [ ] 根有非空 `AGENTS.md`（harness SSOT）
- [ ] 若有 `.codex/harness.md`：知其为**薄指针**，不是第二份业务红线
- [ ] 可选：`codex --ask-for-approval never "Summarize the current instructions."` 能回声全局+项目指引
- [ ] **不要**期望 Cursor `.cursor/rules/*.mdc` 被 Codex 当 rules 全量加载

## 2. Hooks：`/hooks` trust（matcher 正则）

- [ ] 磁盘有 `.codex/hooks.json`；`PreToolUse` matcher 为 **`^Bash$`**（regex，不是 Claude 裸字符串假设）
- [ ] 命令含 `--codex` gate：`superpowers-commit-gate.js --codex`
- [ ] 打开 TUI/CLI **`/hooks`**：审阅并 **trust** 非托管 hooks（改文件后 hash 变，需再信任）
- [ ] 新会话或 trust 后，经 Bash/shell 跑一次 `git commit --dry-run` 类探测，期望软提醒（fail-open）
- [ ] 知悉：本 P0 **仅**基础 commit gate；缺事件时 `.githooks` 仍兜底

## 3. MCP：`config.toml` + `/mcp`

- [ ] 复制 `.codex/config.toml.example` → `.codex/config.toml`（或合并进已有配置）；**项目层须 trusted**
- [ ] 按注释启用 `[mcp_servers.<name>]`（stdio `command`/`args` **或** http `url`）
- [ ] **永不**把真实 token / 密码写进仓库；用环境变量名引用
- [ ] TUI **`/mcp`**（或 `codex mcp list`）能看到已连接 server
- [ ] **不要**假设根 `.mcp.json` 一定被 Codex 读取

## 4. Skills：`.agents/skills`

- [ ] 知悉官方路径：仓库 `.agents/skills/*/SKILL.md` 与用户 `~/.agents/skills`
- [ ] 若存在 `.agents/skills/GENERATED.md`：仅为 harness **轻指针**（P0 **不全量**镜像 `docs/agent-config/skills`）
- [ ] 需要技能时手工放入 SKILL.md，或用官方 `$skill-installer` / plugins
- [ ] CLI/IDE：`/skills` 或 `$` 可发现已安装技能（以当前客户端为准）

## 5. 非目标（本页勾「已知悉」即可）

- [ ] **已知悉**：不做 `.mdc` 全量镜像；不做 Cursor 级 hooks/MCP/skills 同构
- [ ] **已知悉**：Codex 仍 **不默认**进「全部推荐」
- [ ] Trae / CodeBuddy 行为本版不变；生产装/升仍用 **`main`**

## 回传模板

trust项目=是|否 / AGENTS回声=是|否 / hooks=/hooks已信任 matcher=^Bash$ / MCP=/mcp可见=是|否 / skills路径已知=是|否 / 非目标已知悉=是|否
