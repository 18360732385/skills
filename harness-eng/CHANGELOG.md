# harness-eng CHANGELOG

版本策略（自 **0.1.2** 起）：对外 `manifest.version` / `harness-meta.skill_version` 使用本组号。  
**列车**：`… → 0.6.0 → 0.6.1-dev → 0.6.1 → 0.6.2 → 0.6.3-dev`（当前 **0.6.3-dev**）。报告对照 **`skill_version` + `report_schema`**（JSON 仍暴露 `ui.version` **0.2.24**；**报告壳版本 ≠ skill**）。  
> 0.6.1 实证：[host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。0.5.x 见 [archive/CHANGELOG-0.5.x.md](archive/CHANGELOG-0.5.x.md)；0.4.0 及更早见仓库 [`_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md`](../_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md)。

## 0.6.3-dev — 2026-09-14（sync freshness · 热路径去污 · VERIFY 瘦身）


- **热路径去污**：session-dashboard / examples / resume 统一「确认后 `harness.mjs`」；矩阵标题改为 0.6.x；VERIFY 历史钉号标注「历史」；QUICKSTART 补 Trae skills 路径示例
- **P1 发包再瘦**：`archive/selfcheck` 0.4.0/0.5.0/0.5.1 迁 `_history`；`.skillignore` 排除大体积归档
- **P1 Trae T-P2-2…4**：提问脚注 / 热路径交叉链 / 审计·仪表盘「未生成≠未实证」
- **热路径减脂（1/7/8/9）**：`archive/` 大块与 fill-truths-auto 全文迁 `_history/harness-eng-docs-archive/`；CHANGELOG 仅留 0.6 列车；`TRAE-P0-EVIDENCE` / `ROADMAP-0.6.0` 正文进 `archive/`（根/host 留 stub）
- **热路径 CHANGELOG**：仅保留 0.6 列车；0.5.x 迁 `archive/CHANGELOG-0.5.x.md`
- **P1 selfcheck 再拆**：`lib/selfcheck/checks-0.5.mjs`（0.5.2–0.5.10）
- **P1 selfcheck 分包**：`scripts/lib/selfcheck/checks-0.6.mjs` 承接 0.6.x 断言；入口仍 `selfcheck.mjs`
- **P1 热路径瘦身**：VERIFY 历史增量表迁 `archive/VERIFY-history-through-0.6.0.md`；`session-dash --help`；无 score 时仪表盘精简一行减噪
Audit P0-1。技能升级后消费仓实例化 `scripts/agent-config/sync.mjs` 不再静默沿用旧 tmpl（Trae FM strip 等）。**不**改 Trae 矩阵、**不**重开 Codex。

### 产品

- **Freshness gate**：`templates/agent-config/sync.mjs.tmpl` 与落地脚本同带 `HARNESS_SYNC_TMPL_ID` / `HARNESS_ENG_VERSION`（与 skill 号一致）。`node scripts/harness.mjs --check-freshness --root <TARGET>`：无 consumer 脚本 skip（exit 0）；落后则打印刷新步骤并 **exit 1**
- **L5 land/upgrade/resume**：`agent-config-sync` 已存在时 **replace**（不因 `on_exists=skip` 留下过期脚本）。刷新路径：land/render `agent-config-sync` → `node scripts/agent-config/sync.mjs`。见 [TRAE-P0-MANUAL.md](host/TRAE-P0-MANUAL.md) §0 · [conflict-policy.md](modes/conflict-policy.md) · [QUICKSTART.md](QUICKSTART.md)
- **安装 URL**：生产装/升指向 `tree/main/harness-eng`。0.6 系列开发在 `V0.6.X`，合并进 `main` 后生产再装/升（勿从 `V0.6.X` 装生产）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → **`0.6.3-dev`**
- 0.6.2 会话仪表盘钉号不回退

## 0.6.2 — 2026-09-14（会话仪表盘去掉 mermaid）

0.6.1 跟进。Trae（及部分宿主）渲染 footer `quadrantChart` 会出「Mermaid Syntax Error」；四台表已含覆盖/形态/参考分，象限图多余。

### 产品

- **会话仪表盘**：`renderSessionDashboardMarkdown` 不再输出 mermaid 围栏 / `quadrantChart`。有 score 时改一行纯文本：`施工态势：覆盖 X% × 形态 Y%（Q1 补形态 / Q2 理想区 / Q3 起步 / Q4 补覆盖）`（阈值 0.5）
- Trae 会话内不再出现 Mermaid Syntax Error UI

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → **`0.6.2`**
- 0.6.1 Trae 高钉号不回退

## 0.6.1 — 2026-09-14（Trae 高：P0/P1 收口 · 正式钉号）

矩阵 Trae **中高 → 高**。**不假装** Trae 走 Cursor 协议。hooks PASS **单独不授权**升 **高**；本版另有 MCP 面板 PASS + T-P1-3 / T-P1-4。**不**重开 0.6.0。

### 产品

- **FM 保留**：镜像到 Trae **保留** `alwaysApply` / `globs`（`render.mjs` / L5 `toHostMd` 按宿主分支；Claude/Qoder 仍 strip）。消费仓须 **刷新** `scripts/agent-config/sync.mjs` 后再 sync
- **L5 00-harness-ssot via SSOT**：render 必写 `docs/agent-config/rules/00-harness-ssot.mdc`；宿主 00 / 冗余 1x 仍由 sync 托管（清 stale 正确，勿 git restore）
- **RunCommand hooks + live PASS**（2026-09-14 Trae CN · c-be-sms-ai）：门禁 matcher `Bash|RunCommand`；`additionalContext` 注入【流程提醒】agent-config；软 allow；dry-run 跑完。勾 T-P0-3 / T-P1-2。Settings → Hooks 启用项目 hooks
- **MCP 面板 PASS**（2026-09-14 Trae CN · c-be-sms-ai）：Settings MCP 显示 **12** 台 workspace servers（来自 `.trae/mcp.json`）。**ON**：gitlab、Apifox 导入、chrome-devtools。**OFF via toggle**（在场、非缺失）：sonarqube、redis-local/uat/test/dev、mysql-local（其余 mysql-* 多半在滚动区）。IDE **消费**文件；启用靠 Settings 开关。早先「缺 7 台」是误读。**T-P0-2 PASS**
- **T-P1-3**：`ai-tools.md` / fill-mcp / `mcp-paths.mjs` 写清 `.trae/mcp.json` + IDE Settings 启用；无协议变更
- **T-P1-4**：`mature-trae` + selfcheck 钉 Trae L5 sync 路径（薄断言；无巨型黄金树）
- **T-P1-5**：矩阵 / 适配卡 / QUICKSTART / 手册 / selfcheck「中高」断言改为 **高**

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → **`0.6.1`**
- 0.6.0 列车不重开

### 0.6.1-dev — 2026-09-12（spike 笔记，已折叠）

**当时不**把矩阵 Trae 中高改成高（hooks PASS **单独不授权**升 **高**；T-P1-5 仍等 MCP T-P0-2 / T-P1-3 / T-P1-4）。

- **官方实证**：[host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md) — T-P0-1 docs PASS（原生 `alwaysApply` / `globs`）；T-P0-2 当时 partial（`.trae/mcp.json` + IDE 启用）；T-P0-3 docs PASS structure（`.trae/hooks.json`；官方终端 **`RunCommand`**）；T-P0-4 docs PASS（`.trae/skills/` 一等公民）
- **实机回传**（2026-09-12 Trae CN）：T-P0-1 消费仓磁盘 FAIL（实例化 `sync.mjs` 仍旧 strip）；T-P0-2 **IDE 已消费** `mcp.json`；T-P0-3 待新会话；T-P0-4 会话 PASS
- **实机回传续**（2026-09-12 Trae CN · c-be-sms-ai）：Round A 刷新后 T-P0-1 **磁盘+行为 PASS**（13 份、认 `globs`、无 `1x`）；Round C T-P0-3 **本机行为 FAIL**（`.trae/hooks.json` 当时 matcher=`Bash`）。事后判 **matcher 误诊**（`Bash` 永不匹配 `RunCommand`）
- **T-P1-2 hooks**：`HOOK_DEFS.events.trae` 走 `TRAE_STYLE`（门禁 matcher `Bash|RunCommand`）；`claude-adapter.js` 软放行同时写 `systemMessage` + `hookSpecificOutput.additionalContext`。Claude/Qoder 仍 `Bash`。`.githooks` 仍兜底。消费仓须 sync + **Settings → Hooks 启用项目 hooks**
- **Hooks 复测 PASS**（2026-09-14 Trae CN · c-be-sms-ai）：T-P1-2 后 live PreToolUse matcher `Bash|RunCommand` 注入 `additionalContext`；软 allow。勾 T-P0-3 / T-P1-2。hooks PASS **单独不授权**升 **高**
- **升级注意**：消费仓必须 **刷新** `scripts/agent-config/sync.mjs`（从 tmpl 重落地）后再 sync
- **人验清单**：[host/TRAE-P0-MANUAL.md](host/TRAE-P0-MANUAL.md)
- **hotfix**：镜像到 Trae **保留** frontmatter；L5 00 via SSOT；`mature-trae` fixture
- 中间号钉 **`0.6.1-dev`**；0.6.0 列车不重开

## 0.6.0 — 2026-09-12（M1–M4：统一入口 · 文档拓扑 · fill 内聚 · 发包减脂 · 正式钉号）

列车 `0.5.10 → 0.6.0-dev → 0.6.0` 收口。M1–M3 在 `-dev` 切片落地；本条把 G5 发包减脂与正式号钉齐。

### 产品

- **路线图**：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md) — 主题「入口单一、文档可导航、fill 可维护、发包可瘦」；G1–G7 / M1–M4 **已完成**
- **G1 公开入口**（M1）：`scripts/harness.mjs`（`--mode land|resume|upgrade|pipeline-skeleton`）；`land.mjs` 薄别名；L5/`agent_config` 仍拒直渲生成宿主路径并走 `sync.mjs`
- **pipeline-skeleton**：仅骨架战役写盘，不跑 fill-* / 不进入 pipeline-fill
- **文档指针**：SKILL / AGENT-INDEX / write-plan / conflict-policy / QUICKSTART / pipeline 以 harness CLI 为 Agent 主路径；`render.mjs --help` 指向公开入口
- **G2 文档拓扑**（M2）：根 `*.md` **15**（≤20）。模式规格进 `modes/`，fill-* 进 `fill/`，`ai-tools` / `sync-hosts` 进 `host/`。仓库内链接已改；热路径旧路径留薄 stub（`write-plan` / `detect` / `fill` / `pipeline` / `fill-truths-auto`）
- **AGENT-INDEX**：按新拓扑重写，必读 ≤8
- **G3 fill 引擎内聚**（M3）：`fill-inventory.mjs --domain` / `fill-merge.mjs --domain` 为唯一实现入口；扫描/合并逻辑在 `lib/inventory-*` 与 `lib/merge-api.mjs`；域脚本为 **弃用** 薄包装（只转发 argv）。api `--enrich-dto` / `--module` / `--auto-fill` 挂在统一 merge CLI
- **G4 fixture 黄金集**（M3）：`scripts/fixtures/l5-sync-golden`（`sync.mjs --check` 无漂移）+ `scripts/fixtures/multi-host-hooks`（Cursor / Claude / Qoder / Trae / WorkBuddy hooks 信号）；selfcheck 钉路径。既有 mature-claude / qoder-hooks / stack-node 保持
- **G5 发包减脂**（M4）：热技能树 **不含** `archive/selfcheck/legacy/*.mjs` 体积；只留 INDEX 指针。全文在仓库 `_history/harness-eng-selfcheck-legacy/` 与 git 历史。`.skillignore` + [archive/README.md](archive/README.md) 写明 **安装 ≠ 全仓**。热包可保留近期 0.4/0.5 归档 selfcheck；`fill-truths-auto` 仍归档
- **G6**：0.6.x **冻结 Codex P2**（M1 已冻；本版复核无新 Codex 能力），全量对等另立项（adapters/codex.md · host/ai-tools.md）
- **G7**：manifest / meta / questions / README / VERIFY / QUICKSTART / 手册钉 **`0.6.0`**（去 `-dev`）；upgrade 收口 0.5.10 → 0.6.0 清单

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → **`0.6.0`**（无 `-dev`）
- selfcheck 断言 `0.6.0` + G5 发包清单 / `.skillignore` + M2 根 md 计数 / stub 策略

## 更早版本

- **0.5.10 → 0.5.0**：见 [archive/CHANGELOG-0.5.x.md](archive/CHANGELOG-0.5.x.md)
- **0.4.0 及更早**：见仓库 [`_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md`](../_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md)
