# CodeBuddy / WorkBuddy P0 真人会话清单（短）

给本机已装 **CodeBuddy IDE** 或 **WorkBuddy** 的同学。对照：[CODEBUDDY-PARITY.md](CODEBUDDY-PARITY.md)。做完在本页打勾或把结果贴回 PR。

仓库至少有：`.codebuddy/rules/*.md`（含 frontmatter）、`.codebuddy/settings.json`（hooks）、根 `.mcp.json`（或 `.example` 拷成真文件）。

## 0. 消费仓刷新（升级后必做 · freshness gate）

**0.6.4** 起 rules 为扁平 `.md` 且保留 FM；旧消费仓若仍是 `<name>/RULE.mdc`，必须刷新实例化 `scripts/agent-config/sync.mjs` 再跑 sync。

```bash
node scripts/harness.mjs --check-freshness --root <TARGET>
```

1. 从 **`main`** 升级 skill（生产勿用 `V0.6.X`）
2. land / upgrade（L5）重渲 `agent-config-sync`（已存在则 **replace**）
3. `node scripts/agent-config/sync.mjs`
4. 确认 `.codebuddy/rules/*.md` 顶部有 YAML `alwaysApply` / `globs`；旧 `RULE.mdc` 目录应已消失
5. **重开**会话或按第 2 节应用 hooks

## 1. Rules：扁平 `.md` + frontmatter

- [ ] `.codebuddy/rules/` 下是 `00-….md` 等扁平文件，不是 `<name>/RULE.mdc`
- [ ] 带 `globs:` / `alwaysApply:` 的规则在面板或会话中可按作用域生效（或官方等价行为）
- [ ] `alwaysApply: true` 的规则在无点名文件时仍可见

失败请记：规则路径、FM 原文、面板显示的激活方式。

## 2. Hooks：`/hooks` 面板（save ≠ live）

- [ ] 磁盘有 `.codebuddy/settings.json` 的 `hooks` 段；matcher 终端为 **Bash**
- [ ] 命令含 `$CODEBUDDY_PROJECT_DIR`（或已展开的项目根路径）
- [ ] 改 settings 后打开 IDE **`/hooks`**（或 Settings → Hooks）**确认/应用**；不要假设「保存即热加载」
- [ ] 新会话或面板应用后，触发一次 `git commit --dry-run` 类门禁探测，期望软提醒而非静默

## 3. MCP：根 `.mcp.json`

- [ ] 确认根目录有 `.mcp.json`（不要只留 `.example`）
- [ ] **首次连接**在面板中审批 server（enableAll / 单项批准以官方为准）
- [ ] 范围优先级理解：local > project > user
- [ ] 密钥优先环境变量 `${VAR}`；local `.mcp.json` 可填，**勿把真密提交进仓库**

## 4. permissions / settings 优先级

- [ ] 知悉优先级：CLI > `.codebuddy/settings.local.json` > `.codebuddy/settings.json` > `~/.codebuddy/settings.json`
- [ ] 个人覆盖放 `settings.local.json`（勿提交）；harness **不**生成该文件
- [ ] 若 sync 写入了最小 `permissions.deny`（如 `.env`），确认未抹掉你已有的 `allow`/`deny`

## 5. 非目标

- [ ] **不要**期望 harness 生成 `.codebuddy/agents/`（非目标）
- [ ] Trae 行为本版不变；Codex 见 [CODEX-P0-MANUAL.md](CODEX-P0-MANUAL.md)（0.6.8-dev）

## 回传模板

Rules=扁平.md+FM=有|无 / Hooks面板已应用=是|否 / matcher=Bash / MCP首次审批=是|否 / freshness=OK|落后
