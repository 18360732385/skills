# Trae P0 真人会话清单（短）

给**本机已装 Trae IDE** 的同学。对照日文档见 [TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md)。做完在本页打勾或把结果贴回 PR。**不要**据此把矩阵改成高。

仓库至少有：`.trae/rules/`（含 frontmatter）、`.trae/hooks.json`、`.trae/mcp.json`（或 `.example` 拷成真文件）。

2026-09-12 Trae CN 回传见实证页「实机回传」。**T-P0-1 消费仓磁盘 FAIL** 的根因是实例化 `sync.mjs` 仍旧；先做第 0 节再验规则。

## 0. 消费仓刷新（0.6.1-dev 升级后必做）

技能 tmpl（`templates/agent-config/sync.mjs.tmpl` 的 `toHostMd(rule, host)`）已对 trae **保留** FM，但 L5 **已落地的** `scripts/agent-config/sync.mjs` **不会**随 skill 升级自动更新。旧脚本会继续无条件剥 FM，把 `alwaysApply` / `globs` 降成正文 `> 适用路径` / `> 始终应用`。

1. 升级 `harness-eng` 到 **0.6.1-dev**（或含 `toHostMd(rule, host)` + `host === "trae"` 保留分支的版本）
2. 再 land / render L5，让 `scripts/agent-config/sync.mjs` **从 tmpl 重写 / 刷新落地**
3. 跑 `node scripts/agent-config/sync.mjs`
4. 检查 `.trae/rules/*.md` 顶部是否有 YAML `alwaysApply` / `globs`（不是正文引用块）
5. **重开** Trae 会话后再验规则面板 / 注入（见第 1 节）

未做本步时，T-P0-1 磁盘侧会 FAIL，即使技能仓 tmpl 已修。

## 1. Rules：Apply to Specific Files

须先完成第 0 节（磁盘上真有 FM），否则面板认不出「Apply to Specific Files」。

- [ ] 打开一条带 `globs:` 的 `.trae/rules/**.md`（例镜像出的 `12-api-doc-sync-rules.md`）
- [ ] Trae 规则面板能认出 **Apply to Specific Files**（或等价：按 globs 激活）
- [ ] 聊天里点名 **匹配 globs 的文件** 时，该规则被注入；点名无关路径时不注入（或明显更弱）
- [ ] 一条 `alwaysApply: true` 的规则（如 `00-project-docs-overview.md`）在无点名文件时仍在上下文
- [ ] 嵌套目录（最多 3 层，例 `.trae/rules/api/`）里的规则能被读到

失败请记：规则路径、FM 原文、Trae 面板显示的激活方式。2026-09-12 消费仓未刷新时：磁盘无 FM、路径作用域规则被全量注入（与 always-on 一致）；面板未验。

## 2. MCP：磁盘产物 + IDE 启用

- [ ] 确认磁盘有 `.trae/mcp.json`（不要只留 `.example`）
- [ ] Settings → **Add MCP servers**（或项目 MCP 开关）里**启用**该项目
- [ ] 启用后，Trae 能列出/调用其中一台 server
- [ ] **关掉**项目 MCP 后再试：失败形态（完全不可见 / 报错 / 静默忽略）写一句
- [ ] 与 Cursor `.cursor/mcp.json` 的操作差（多一步开关？路径不同？）写一句
- [ ] 若会话只挂上部分 server：到 Settings MCP 面板抄启动失败报错（缺服 ≠ 文件没被 IDE 吃）

2026-09-12 Trae CN：磁盘 ✓；IDE **已消费**文件（`mcp_gitlab` / `mcp_chrome-devtools` / `mcp_Apifox_Dao_Ru`）；缺 mysql×4、redis×3、sonarqube；disable-switch 对照未做。T-P0-2 保持 **partial↑** 直到面板报错 + 关开关对照有人勾。

## 3. Hooks：`Bash` 然后 `RunCommand`（必须新会话）

现网 `.trae/hooks.json` 门禁 matcher 仍是 Claude 族 **`Bash`**（**不**在本切片改 `HOOK_DEFS`）。

**探测配方**（2026-09-12 实机用过；保留）：

1. **新开** Trae Agent 会话（中途改 `hooks.json` **可能不热加载**；本会话因此 inconclusive）
2. stage 一份会被门禁盯到的生成物（例：`.claude` 下 GENERATED 文件）
3. 让 Agent 跑 `git commit --dry-run`（走终端 / 软门禁）
4. 看是否出现 hook `systemMessage` / 拦截文案 / adapter 输出
5. 先记 **`Bash`** 是否触发
6. 若 **`Bash` 不触发**：把该组 matcher 临时改成 **`RunCommand`**，**再开新会话**跑同一条（不要只在当前会话改 json）
7. 记下：`Bash` 触发？`RunCommand` 触发？两者都触发？（导入 Claude Code hooks 时另注）
8. `Stop` 检查清单是否在会话结束时跑一次

2026-09-12：结构 OK；`Bash` 与会话中途临时 `RunCommand` 均未见 systemMessage。**必须新会话**再测。

只要「`Bash` 不触发、`RunCommand` 触发」成立，T-P1-2 才改 harness matcher。

## 4. Skills（可选补一句）

- [ ] `.trae/skills/` 在 Trae 技能面板可见、可点名
- [ ] 未点名时不会整包灌进上下文（官方：按需加载）
- [ ] 带 `disable-model-invocation: true` 的 skill（如 `release-eng`）应不可被模型点名

2026-09-12：**PASS** — `harness-eng` 可见可点名；`release-eng` 因 FM 隐藏。

## 5. 消费仓 refresh：sync 清 1x / 宿主 00 之后怎么办

刷新 `scripts/agent-config/sync.mjs`（从 skill tmpl）再跑 sync 之后：

- **预期**：各宿主 `1x-contract-sync.md` **消失**（L5 全量镜像，1x 冗余）。不要从 git 捡回来。
- **若 `.trae/rules/00-harness-ssot.md` 没了**：先确认 SSOT 有 `docs/agent-config/rules/00-harness-ssot.mdc`。没有就 **重新 land/render L5**（让 render 写出 SSOT 00），再 `node scripts/agent-config/sync.mjs`。**不要** `git restore` `.trae/rules/00-harness-ssot.md`（或 qoder/claude/codebuddy 上的同名孤儿）。
- 判断依据：[TRAE-P0-EVIDENCE.md](TRAE-P0-EVIDENCE.md)「2026-09-12 消费仓 sync stale 清理」。

## 回传格式（可贴 PR）

```text
T-P0-1 rules：消费仓 sync.mjs 已刷新=是|否 / 磁盘 FM=有|无 / alwaysApply=… / globs 面板=… / 嵌套=…
T-P0-2 MCP：路径= .trae/mcp.json / IDE 已消费=是|否 / 挂上=… / 缺服=… / 面板报错=… / 关开关=…
T-P0-3 hooks：是否新会话=是|否 / Bash=触发|否 / RunCommand=触发|否 / Stop=…
T-P0-4 skills：可见=… / 按需=… / disable-model-invocation=…
Trae 版本 / 日期：
```
