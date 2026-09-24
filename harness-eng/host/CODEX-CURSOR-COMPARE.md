# Codex vs Cursor 适配对照（0.7.9）

矩阵档位两者皆 **高**；载体与生效路径不同。**不做** `.mdc` → Codex 全量镜像（刻意非目标）。

交叉：[CODEX-PARITY.md](CODEX-PARITY.md) · [ai-tools.md](ai-tools.md) · [adapters/codex.md](../templates/ai-tools/adapters/codex.md)。

## 对照表

| 维度 | Cursor | Codex | 判定 |
|---|---|---|---|
| 矩阵对齐 | **高**（原生 `11\|12\|13\|16-*-sync*` + hooks） | **高**（纪律 B：探测/勾选） | **已对齐**（同档，非同构） |
| 自然语言域规则 | `.cursor/rules/*.mdc` 自动加载 | 根/分册 `AGENTS.md` + L5 `.agents/skills` 薄种子 | **刻意差异**（无 mdc 对等体验） |
| 命令策略 | hooks / githooks 软门禁为主 | Starlark `.codex/rules`（force-push / clean `-xfd` 等）+ hooks | **已对齐**（载体不同） |
| MCP | `.cursor/mcp.json` | `.codex/config.toml`（policy→enabled；calibrate 读 `env_vars`） | **已对齐**（脚手架）/ **PARTIAL**（会话 trust + `/mcp` 人验） |
| Hooks | `.cursor/hooks.json` 家族 | `^Bash$` + `mcp__mysql` + `Stop` + `commandWindows`/`codex-hook.cmd` | **已对齐**（脚手架）/ **PARTIAL**（Win `unified_exec` 可能绕过 PreToolUse） |
| Skills | Cursor skills / rules 协作 | 六种子：`contract-sync` / `api\|db\|redis\|jobs-doc-sync` / `frontend-web` | **已对齐**（薄种子，非全量业务拷贝） |
| 契约 sync 指针 | 不另写 1x（已有真实 sync rules） | L0–L2 写 `.codex/contract-sync.md`；**L3+/L5 omit** | **已对齐** |
| L4 强制 NL | 无内置 rulehook | 可选 rulehook（默认关；`Q_RULEHOOK` / 已有 toml 才合并） | **已对齐**（默认 off）/ **PARTIAL**（CLI+trust 人验） |
| 推荐纪律 | 探测 `.cursor/` 常进推荐 | **纪律 B**：无探测不默认塞入 | **刻意差异** |

## 结论：Codex 能否达到 Cursor 级适配？

- **能**达到矩阵 **高**：分轨 SSOT、hooks/MCP/Starlark/skills 脚手架与 Cursor 同级「宿主对齐」档；自动化 selfcheck 钉住 0.7.3–0.7.9 交付。
- **不能**提供同构 `.mdc` 体验：Codex 不自动加载 Cursor rules；NL 靠 AGENTS + skills + 可选 rulehook，而非全量 mdc 镜像。
- 会话侧仍须人验：`/hooks` trust、Stop stderr、`/mcp`、Win shell 覆盖、rulehook CLI。

## 自动化覆盖（selfcheck）

见 `scripts/selfcheck.mjs`（0.7.3–0.7.9 块）与 `scripts/lib/selfcheck/checks-0.6.mjs`（policy/calibrate/rulehook/Starlark/fixture）；夹具 `scripts/fixtures/l5-sync-codex`。
