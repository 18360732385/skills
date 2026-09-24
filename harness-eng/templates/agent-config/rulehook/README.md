# Optional L4：rulehook（自然语言 deny）

本目录是 **可选** 增强：少量不可协商 NL 红线。默认不装；不替代 AGENTS / Skills / Starlark / harness soft hooks。

## 何时启用

- 问卷勾选 **Q_RULEHOOK**，或
- 仓内已有 `.rulehook/rulehook.toml`（resume / 探测推荐）

启用后 harness 落盘本种子到 **仓库根** `.rulehook/`（已存在则 **skip**，不覆盖你改过的规则）。

## 本机步骤

1. 安装 CLI（Python 3.11+）：见 [rulehook](https://github.com/xwk-911/rulehook)（例如 `pip install .` 自源码，或以发布名为准）。
2. 确认 PATH 有 `rulehook`：`rulehook check`（在仓库根）。
3. Codex：workspace **trust**；会话 `/hooks` 信任新 command hook。
4. 需要 **codex-cli ≥ 0.142.0**（项目 hooks）。

`provider = "codex-cli"` 时裁判走嵌套只读 `codex exec`，可不另配 API key。也可改成 `anthropic` / `openai` / `claude-cli`。

## 与 harness sync

- `ai_tools` 含 **codex** 且存在 `.rulehook/rulehook.toml` 时，`scripts/agent-config/sync.mjs` 会把  
  `rulehook hook --target codex`  
  **合并**进 `.codex/hooks.json`（与官方 `rulehook install --target codex` 同形），并保留 harness 的 `^Bash$` / `mcp__mysql` / Stop soft 条目。
- **不要**依赖「先 rulehook install 再 sync」而不设本文件——sync 整写 hooks 时会靠本合并逻辑保住 rulehook。
- 未装 CLI 时：toml 里 `fail_open = true`；勿把 L4 当安全边界。

## Windows

Codex / rulehook 在 Windows 上覆盖可能 **PARTIAL**（部分 shell 路径绕过 PreToolUse）。Starlark + `.githooks` 仍兜底。harness 写入的 rulehook 条目与上游一致（Unix `command`），不伪造假成功的 `commandWindows`。

## 规则纪律

- 只放 **短硬** Never do（种子 ≤10 条）；**不要**把 Cursor `.mdc` 全量拷进 rulehook。
- 域工作流（契约/文档 sync）继续用 Skills（L1），不用 deny 教步骤。
