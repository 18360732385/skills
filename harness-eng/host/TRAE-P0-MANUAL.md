# Trae P0 真人会话清单（短）

给**本机已装 Trae IDE** 的同学。对照日文档见 [TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md)。做完在本页打勾或把结果贴回 PR。**不要**据此把矩阵改成高。

仓库至少有：`.trae/rules/`（含 frontmatter）、`.trae/hooks.json`、`.trae/mcp.json`（或 `.example` 拷成真文件）。

## 1. Rules：Apply to Specific Files

- [ ] 打开一条带 `globs:` 的 `.trae/rules/**.md`（例镜像出的 `12-api-doc-sync-rules.md`）
- [ ] Trae 规则面板能认出 **Apply to Specific Files**（或等价：按 globs 激活）
- [ ] 聊天里点名 **匹配 globs 的文件** 时，该规则被注入；点名无关路径时不注入（或明显更弱）
- [ ] 一条 `alwaysApply: true` 的规则（如 `00-project-docs-overview.md`）在无点名文件时仍在上下文
- [ ] 嵌套目录（最多 3 层，例 `.trae/rules/api/`）里的规则能被读到

失败请记：规则路径、FM 原文、Trae 面板显示的激活方式。

## 2. MCP：磁盘产物 + IDE 启用

- [ ] 确认磁盘有 `.trae/mcp.json`（不要只留 `.example`）
- [ ] Settings → **Add MCP servers**（或项目 MCP 开关）里**启用**该项目
- [ ] 启用后，Trae 能列出/调用其中一台 server
- [ ] **关掉**项目 MCP 后再试：失败形态（完全不可见 / 报错 / 静默忽略）写一句
- [ ] 与 Cursor `.cursor/mcp.json` 的操作差（多一步开关？路径不同？）写一句

未开 IDE 开关就当「只落盘、未启用」。T-P0-2 保持 **partial** 直到本段有人勾。

## 3. Hooks：`RunCommand` 会不会开火

现网 `.trae/hooks.json` 门禁 matcher 仍是 Claude 族 **`Bash`**（未在本 spike 改 `HOOK_DEFS`）。

- [ ] 在 Trae Agent 会话里让它跑一条终端命令（尤其 `git commit` 软门禁路径）
- [ ] 观察 `PreToolUse` 脚本是否执行（日志 / 拦截文案 / adapter 输出）
- [ ] 若 **`Bash` 不触发**：把该组 matcher 临时改成 **`RunCommand`**，再跑同一条命令
- [ ] 记下：`Bash` 触发？`RunCommand` 触发？两者都触发？（导入 Claude Code hooks 时另注）
- [ ] `Stop` 检查清单是否在会话结束时跑一次

只要「`Bash` 不触发、`RunCommand` 触发」成立，T-P1-2 才改 harness matcher。

## 4. Skills（可选补一句）

- [ ] `.trae/skills/` 在 Trae 技能面板可见、可点名
- [ ] 未点名时不会整包灌进上下文（官方：按需加载）

## 回传格式（可贴 PR）

```text
T-P0-1 rules：alwaysApply=… / globs 面板=… / 嵌套=…
T-P0-2 MCP：路径= .trae/mcp.json / IDE 启用=是|否 / 未开时=…
T-P0-3 hooks：Bash=触发|否 / RunCommand=触发|否 / Stop=…
T-P0-4 skills：可见=… / 按需=…
Trae 版本 / 日期：
```
