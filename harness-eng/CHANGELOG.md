# harness-eng CHANGELOG

版本策略（自 **0.1.2** 起）：对外 `manifest.version` / `harness-meta.skill_version` 使用本组号。  
**列车**：`… → 0.7.0 → 0.7.1 → 0.7.2`（当前 **0.7.2**）。报告对照 **`skill_version` + `report_schema`**（**0.3.0**；**报告壳 ≠ skill**；`ui.version` 兼容别名）。  
> 0.6.1 实证：[`_history/.../TRAE-P0-EVIDENCE.md`](../_history/harness-eng-docs-archive/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[`_history/.../ROADMAP-0.6.0.md`](../_history/harness-eng-docs-archive/ROADMAP-0.6.0.md)。0.5.x 见 [`_history/.../CHANGELOG-0.5.x.md`](../_history/harness-eng-docs-archive/CHANGELOG-0.5.x.md)；0.4.0 及更早见 [`CHANGELOG-through-0.4.md`](../_history/harness-eng-docs-archive/CHANGELOG-through-0.4.md)。

## 0.7.2 — 2026-09-24（日落 CLI shim）

### Breaking
- **删除** `scripts/land.mjs`：写盘只认 `node scripts/harness.mjs`（`[--mode land]`）
- **删除** 10 个域薄包装：`fill-inventory-{api,func,db,redis,jobs}.mjs`、`fill-merge-{api,func,db,redis,jobs}.mjs`
- 替代：`fill-inventory.mjs --domain <id>` / `fill-merge.mjs --domain <id>`

### Docs / pack
- 热路径与 fill 索引只写统一 CLI；upgrade `0.7.1 → 0.7.2` 含命令替换表
- selfcheck 断言 shim **缺席**；钉号 0.7.2

## 0.7.1 — 2026-09-23（热路径瘦身）

### Docs / pack
- **Codex 文案**：摘要 / QUICKSTART / README 对齐 **高 · 纪律 B**（去掉残留 P2）
- **删根/host stub**：`detect`/`fill`/`pipeline`/`write-plan`/`fill-truths-auto`/`ROADMAP-0.6.0`、`CODEX-P0-MANUAL`、`TRAE-P0-EVIDENCE`
- **手册收敛**：保留 `使用手册.md` + `使用手册-摘要.md`；删除 `使用手册.html`；会话仪表盘链改 md
- **迁 `_history`**：`archive/` 正文（CHANGELOG-0.5 / ROADMAP / TRAE evidence）· `docs/superpowers` Codex 设计稿 → `superpowers-codex-0.6.9/`
- **删一次性** `scripts/fixtures/_bump*` / `_patch*` / `_rebuild*`（保留 `_build-l5-sync-codex`）
- **当时保留**：`land.mjs` 与域 CLI shim（**0.7.2 已硬删**）；运行时兼容（meta 回退 / gate legacy / ready.ok / ui.version）仍保留

## 0.7.0 — 2026-09-23（形态重标定 · gold 可达 · ready 废弃）

### Breaking
- **形态分**：探针≈75 + 深度≈25 → 满分 **100**；`morph_cap=100`；`formula_ceiling≈100`；JSON `morph_scale: "0.7"`
- **strict** `morph_floor`: 60 → **75**；**gold** `morph_floor`: 90 → **95**（仍双 95：完成度≥95）
- **strict semantic**：`generic≤3 && unbound≤2 && tc≥70`（legacy 保持 5/3/50；gold 0/0/95）
- **`ready.ok` 对外废弃**（JSON 保留 `deprecated: true`）；开干只看 `ai_coding_ready`
- **report_schema** → **0.3.0**；旧 score-history 与 0.6.x overall **不可比**

### Added
- `scripts/lib/morph-depth.mjs` 深度档；`scripts/lib/score-policy-migrate.mjs` 字段级迁移 60→75 / gold 90→95
- `fill-score --migrate-policy`；`harness.mjs` resume/upgrade/land 后自动迁移旧默认 morph_floor

### Docs
- fill-score / fill-gate / glossary / upgrade 迁移要点对齐 0.7.0

## 0.6.9 — 2026-09-22（Codex → 高：分轨 SSOT · 纪律 B）

> 设计：[`_history/.../superpowers-codex-0.6.9/specs/2026-09-22-codex-full-support-design.md`](../_history/harness-eng-docs-archive/superpowers-codex-0.6.9/specs/2026-09-22-codex-full-support-design.md)。**不**改 Trae / CodeBuddy 矩阵；生产装/升仍用 **`main`**。

- **报告壳 0.2.26（施工指挥台 UX）**：IBM Plex Sans SC 正文；`prefers-reduced-motion` 关 CRT/glitch；命令一键复制；Escape 关模态；`#hash` 深链生效；←/→ `[` `]` 切台；趋势台参考分视觉降权；残差任务条纹+徽章分层
- **会话仪表盘展示时机收紧**：SHOW 改为「本轮」模式步进 / 改盘意图 / 显式读数；中途 meta 与跑题 **HIDE**（不再因「工程会话未结束」硬附）；无目标根时仅 detect/定根轮出精简块。规格 [session-dashboard.md](modes/session-dashboard.md)
- **密文对用户话术收窄**：不主动要求「别填密码」；仅编辑 local 真密配置（`mcp.json` / `.codex/config.toml`）时提醒可本地填、勿提交。技能模板/example/可提交产物仍无密；fill-mcp 经确认写 gitignore 路径。见 [SKILL.md](SKILL.md) · [fill-mcp.md](fill/fill-mcp.md)
- **会话仪表盘里程碑再收**：SHOW 仅 **实质产出** / **闸门决策**（出示 WritePlan 或用户确认）/ **显式读数**；提问批次、定根前（无根）、等确认空轮、改 skill **HIDE**；取消无根精简例外。规格 [session-dashboard.md](modes/session-dashboard.md)
- **精简会话仪表盘样式（方案 B）**：无 score 时标题「（精简）· 未打分」+ 加粗元信息行 + 「下一动作」；脚注复用全量 `详情请查询仪表盘`（file 链 / 未生成路径 · 手册 #s6）
- **对齐**：Codex 矩阵 **高**；推荐纪律 **B**（探测 `.codex/` 或显式勾选）；**不做** `.mdc` 全量镜像
- **MCP**：`mcp/servers*.json` → `.codex/config.toml.example`（`codex-mcp-toml.mjs` / L5 sync；无密钥；默认 `enabled=false`）
- **Hooks**：`PreToolUse(^Bash$)` + `Stop` + `codex-adapter.js`
- **Rules**：Starlark `docs/agent-config/codex/rules/*.rules` → `.codex/rules/`
- **Skills**：L5 全量 → `.agents/skills/`（不 prune 用户自建）
- **contract-sync**：L3+/L5 omit；L0–L2 仍写
- **文档**：[CODEX-PARITY.md](host/CODEX-PARITY.md) · [CODEX-MANUAL.md](host/CODEX-MANUAL.md)；`CODEX-P0-MANUAL` stub
- **fixture**：`scripts/fixtures/l5-sync-codex`
- manifest / meta / sync tmpl · golden → **`0.6.9`**

## 0.6.8-dev — 2026-09-19（Codex P0 增量解冻：PARITY + config.toml + hooks）

> 0.6.7 跟进。**不**改 Trae / CodeBuddy 矩阵；**不**做 `.mdc` 全量镜像；生产装/升仍用 **`main`**（勿钉 `V0.6.X`）。

### 本版要点

- **Codex P0**：新增 [host/CODEX-PARITY.md](host/CODEX-PARITY.md)（AGENTS/config/MCP/hooks/skills 对照官方；PASS/PARTIAL；明确 **不做** `.mdc` 全量镜像）与 [host/CODEX-P0-MANUAL.md](host/CODEX-P0-MANUAL.md)（trust / `/hooks` / `/mcp` / skills 人验）
- **config**：`templates/ai-tools/codex-config.toml.tmpl` → `.codex/config.toml.example`（stdio+http 注释示例；trusted-only；无密钥）
- **hooks**：`codex-hooks.json` matcher 改为 Codex 正则 **`^Bash$`**；文档强调 `/hooks` trust
- **skills**：文档官方 `.agents/skills`；L5 sync 仅写轻指针 `GENERATED.md`（不全量拷贝）
- **措辞**：去掉「0.6.x 整列冻结 P2」→ **P0 增量解冻 / 仍不默认进全部推荐**；Cursor 级全家桶同构仍 out of scope
- **金标纪律回捞（去域化，2026-09-22）**：从 c-be-sms-ai 抽可复用施工纪律进模板——`jobs-index-template` / `jobs.md.tmpl` / `job-template`（Never do、调度契约>func/api Cron 摘录、独立开关）；rule `12`/`13` 补判定清单+联动+同步操作表（保留 `{{GLOB_*}}`，不带回 Pn/业务名）；rule `20` 对齐四件套 + Never do。**不**把 AGENTS/pitfalls 真真相塞回 templates
- **五契约域文案对齐（2026-09-22）**：注册表已是 api/func/db/redis/jobs；清除残留「四域」措辞与漏 `|jobs` 路径；`FALLBACK_CORE` / fill-plan jobs 验收 / questions pipeline 推荐 / 报告 UI 与宿主入口模板统一
- **报告壳 0.2.25（2026-09-22）**：决策/任务台贯通 `warning_shards`+`--residual`；统一 `fill-inventory.mjs` 命令与 root 替换；分域中文标签；决策四态灯；Tab `#hash`；会话仪表盘 residual 提示

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.8-dev`**
- 安装 URL 仍 **`main`**

## 0.6.7 — 2026-09-18（正式钉号：Pn 回流运营 + 前后端契约门禁剖面）

> 0.6.6 跟进。**不**改 Trae 矩阵、**不**重开 Codex、**不**回退 CodeBuddy 扁平 rules。

### 本版要点

- **Pn 回流运营**：根 AGENTS「踩坑回流」三问；pitfalls 路径速查通用骨架；Never do↔Pn 单写纪律；lint warn 校验回链；audit / prefill 移交
- **前后端契约门禁剖面**：api `hook_code` 对 `packages/api-client|types|queries` 改 **regex**（嵌套 monorepo 可命中）；`S_FRONTEND`+api 时【推荐】GLOB_API 追加前端契约包；rule 12 对齐消费层

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.7`**（无 `-dev`）
- 0.6.6 OpenAPI / 分册厚 / 0.6.5 API 7 列 / Trae 高钉号不回退

## 0.6.6 — 2026-09-18（正式钉号：OpenAPI 闭环 + 分册厚 SSOT）

> 0.6.5 跟进。**不**改 Trae 矩阵、**不**重开 Codex、**不**回退 CodeBuddy 扁平 rules。

### 本版要点

- **OpenAPI / Apifox 可选桥**（L1 伴生，`Q_APIFOX`）：去域化 `scripts/apifox/`（md→openapi→覆盖导入）；契约 SSOT 仍为 `docs/api/modules`；soft-gate `OPENAPI_BRIDGE_TIP` 软提醒
- **分册 AGENTS 厚 SSOT**：根「分册真相」声明 + 通用/Spring/前端分册厚骨架（定位、动手前、改动路径速查、Never do↔Pn）；solo 根收厚节
- **施工仪式**：land 移交 P1 精填分册；WritePlan 预览分册；audit 空壳启发式；upgrade `0.6.5 → 0.6.6`（已有分册 on_exists=skip）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.6`**（无 `-dev`）
- 0.6.5 API 7 列 / 0.6.4 CodeBuddy / Trae 高钉号不回退

## 0.6.5 — 2026-09-17（正式钉号：API 字段表金标 + sync EOL）

> 0.6.4 跟进。**不**改 Trae 矩阵、**不**重开 Codex、**不**回退 CodeBuddy 扁平 rules。

### 本版要点

- **API 模板**：新建/大改默认 7 列 `| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |`；说明/枚举/备注分列硬约束；旧 5 列兼容 acceptance。索引模板补「字段表约定」
- **acceptance**：新增 `api-empty-desc`（说明空/套话/同参数名）、`api-empty-enum-remark`（有枚举/备注列则禁空单元格）；金标升 blocker
- **fill-auto-api**：输出 7 列骨架并标 `quality: heuristic`（须 agents 精填后再 promote）
- **truth-quality / fill-workers**：出入参与 worker 答案卡对齐 7 列 + 说明硬约束
- **sync --check**：`sameText()` 两侧规范化 CRLF/LF，避免 Windows autocrlf / HEADER 注入造成假漂移（`l5-sync-golden` 绿）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.5`**（无 `-dev`）
- 0.6.4 CodeBuddy / Trae 高钉号不回退

## 0.6.4 — 2026-09-16（正式钉号：CodeBuddy/WorkBuddy 官方对齐）

> 由 **0.6.4-dev** 钉号。生产装/升仍用 **`main`**。**不**改 Trae 矩阵、**不**重开 Codex。

### 本版要点

- **Rules**：`.codebuddy/rules/<stem>.md` 扁平落盘；保留 `alwaysApply` / `globs` / `description` frontmatter（对齐 Trae；官方 CLI 亦认 `paths`）。旧 `<name>/RULE.mdc` 在托管前缀下故意 prune
- **Hooks**：保持 Claude 系 **Bash** matcher；`$CODEBUDDY_PROJECT_DIR`；改 `settings.json` 后须 IDE **`/hooks` 面板**应用（save ≠ live）
- **MCP**：根 `.mcp.json`；首次连接需审批；local > project > user；密钥 `${VAR}`
- **permissions**：缺省时向 `.codebuddy/settings.json` 合并最小 `permissions`（不 wipe 已有）；**不**生成 `settings.local.json`
- **settings 优先级**：CLI > `.codebuddy/settings.local.json` > `.codebuddy/settings.json` > `~/.codebuddy/settings.json`
- **非目标**：`.codebuddy/agents/` 不由 harness 生成
- **文档**：[host/CODEBUDDY-PARITY.md](host/CODEBUDDY-PARITY.md) · [host/CODEBUDDY-P0-MANUAL.md](host/CODEBUDDY-P0-MANUAL.md)

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.4`**（无 `-dev`）
- 0.6.3 freshness / 报告壳钉号不回退

## 0.6.3 — 2026-09-14（正式钉号：freshness · 热路径 · Trae P2 · 报告壳叙事）

> 由 **0.6.3-dev** 钉号。生产装/升仍用 **`main`**。

### 本版要点



- **热路径去污**：session-dashboard / examples / resume 统一「确认后 `harness.mjs`」；矩阵标题改为 0.6.x；VERIFY 历史钉号标注「历史」；QUICKSTART 补 Trae skills 路径示例
- **P1 发包再瘦**：`archive/selfcheck` 0.4.0/0.5.0/0.5.1 迁 `_history`；`.skillignore` 排除大体积归档
- **P1 Trae T-P2-2…4**：提问脚注 / 热路径交叉链 / 审计·仪表盘「未生成≠未实证」
- **报告壳叙事**：人读/页脚只认 `skill_version` + `report_schema`；`ui.version` 降为兼容别名（勿当 skill）
- **升级三步**（L5）：装/升 skill（`main`）→ `harness.mjs --check-freshness` → 落后则刷新 `agent-config-sync` 再 `sync.mjs`
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

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 / sync tmpl · golden → **`0.6.3`**（无 `-dev`）
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
