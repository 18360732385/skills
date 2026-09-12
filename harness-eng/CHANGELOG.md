# harness-eng CHANGELOG

版本策略（自 **0.1.2** 起）：对外 `manifest.version` / `harness-meta.skill_version` 使用本组号。  
**列车**：`… → 0.6.0 → 0.6.1-dev`（当前 **0.6.1-dev**，Trae P0 spike）。报告对照 **`skill_version` + `report_schema`**（JSON 仍暴露 `ui.version` **0.2.24**；**报告壳版本 ≠ skill**）。  
> 0.6.1-dev 实证：[host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)。0.6.0 路线（已收口）：[ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)。0.4.0 及更早见 [archive/CHANGELOG-through-0.4.md](archive/CHANGELOG-through-0.4.md)。

## 0.6.1-dev — 2026-09-12（Trae P0 spike：官方实证 · FM 保留 · mature-trae）

**不**把矩阵 Trae 中高改成高（T-P1-5 等人 Trae 会话确认 hooks / MCP）。

### 产品

- **官方实证**：[host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md) — T-P0-1 docs PASS（原生 `alwaysApply` / `globs`）；T-P0-2 partial（`.trae/mcp.json` + IDE 启用）；T-P0-3 docs PASS structure（`.trae/hooks.json`；matcher `Bash` vs `RunCommand` 风险）；T-P0-4 docs PASS（`.trae/skills/` 一等公民）
- **实机回传**（2026-09-12 Trae CN）：T-P0-1 消费仓磁盘 FAIL（实例化 `sync.mjs` 仍旧 strip）；T-P0-2 **IDE 已消费** `mcp.json`；T-P0-3 待新会话；T-P0-4 会话 PASS
- **升级注意**：消费仓必须 **刷新** `scripts/agent-config/sync.mjs`（从 tmpl 重落地）后再 sync，`.trae/rules` 才会带 FM
- **人验清单**：[host/TRAE-P0-MANUAL.md](host/TRAE-P0-MANUAL.md)（含消费仓刷新配方 + 新会话 hooks 探测）
- **适配卡**：skills 一等公民；rules FM 支持；hooks 路径确认；matcher 风险；链到实证页；消费仓刷新 `sync.mjs`
- **hotfix**：镜像到 Trae **保留** frontmatter（`render.mjs` / L5 `toHostMd` 按宿主分支；Claude/Qoder 仍 strip）
- **L5 00-harness-ssot via SSOT**：只要选了 cursor/trae/qoder/claude/workbuddy，render 必写 `docs/agent-config/rules/00-harness-ssot.mdc`；宿主 00 / 冗余 1x 仍由 sync 托管（清 stale 正确，勿 git restore）。人审见 [TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)
- **fixture**：`scripts/fixtures/mature-trae/`（无 `.cursor/rules` 仍 MATURE）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → **`0.6.1-dev`**
- ROADMAP 注明 0.6.1 Trae spike 已开工；0.6.0 列车不重开

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

## 0.5.10 — 2026-09-12（audit P2：Codex 不默认 · 报告壳叙事 · 皆无探测 ≠ Cursor · 归档）

### 产品

- **P2-1 Codex**：保持 **部分对齐（P2）**，产品期望降级为 **不默认**。`codex` 仅探测到 `.codex/` 或用户显式勾选才进「全部推荐」；Q_AI_TOOL / 推荐包 / detect 标注「部分对齐·不默认」。不尝试 Codex `sync.mjs` 全量对等。
- **P2-2 `ui.version` 叙事**：glossary / 报告页脚 / fill-score / 手册 FAQ 优先 **`skill_version` + `report_schema`**；JSON 仍暴露 `ui.version`（= report_schema）。一行「报告壳版本 ≠ skill」。
- **P2-3 皆无探测 ≠ Cursor**：无工具信号时 `ai_tools: []`，须追问一次；不默认 `[cursor]`，不因此只写 Cursor 适配/hooks。selfcheck 断言「皆无探测」不强制 Cursor-only。
- **P2-4 CHANGELOG / 手册**：0.4.0 及更早迁到 `archive/CHANGELOG-through-0.4.md`；手册摘要仍为最短路径，正文去掉 Agent 通读噪音。
- **P2-5 `fill-truths-auto`**：规格 + 脚本迁到 `archive/fill-truths-auto/`（INDEX）；根目录留 stub；SKILL / fill 索引标「仅脚本、对话不推荐」。

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → `0.5.10`
- selfcheck → `scripts/selfcheck.mjs`

## 0.5.9 — 2026-09-12（audit P1：热路径索引 · land 入口 · fill CLI · fixture）

### 产品

- **P1-1 热路径**：新增 [AGENT-INDEX.md](AGENT-INDEX.md)（必读 / 按需表）；[fill/README.md](fill/README.md) 索引全部 fill-* 规格与脚本；SKILL 填充行先指向索引
- **P1-2 `_meta` schema_version**：`morph-required.yaml` / `score-policy.yaml.tmpl` 补 schema 注释（≠ skill_version）；domains / domain-packs 沿用 0.5.8 标注
- **P1-3 统一写盘入口**：`scripts/land.mjs` — 读 meta（新路径 + 遗留回退）；`agent_config` 时拒直渲生成宿主路径并走 `sync.mjs`；否则委托 `render.mjs`
- **P1-4 fixture**：`mature-claude`（无 `.cursor/rules` 仍 MATURE）、`qoder-hooks`（S_HOOKS）、`stack-node`（非 Java S_STACK）；`lib/detect-signals.mjs` 薄探针
- **P1-5 fill CLI**：规范入口 `fill-inventory.mjs --domain` + 既有 `fill-merge.mjs --domain`；域脚本改为别名（api merge 额外旗标仍留在 `fill-merge-api.mjs`）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → `0.5.9`
- selfcheck → `scripts/selfcheck.mjs`

## 0.5.8 — 2026-09-12（detect 多宿主诚实 + selfcheck 稳定名 + Codex P2 期望）

### 产品

- **P0-1 detect / MATURE**：`S_RULES` / `S_HOOKS` 按任一支持宿主计（`.claude/.qoder/.trae/.codebuddy` rules；Claude 系 settings hooks / Trae / Codex / `.githooks`）。仅非 Cursor 仓只要根 AGENTS + 该宿主 rules + 契约骨架 + agent-kb 仍判 **MATURE**（默认 audit），不再因缺 `.cursor/rules` 误 land
- **P0-2 selfcheck**：热路径更名为稳定 `scripts/selfcheck.mjs`（与 skill 号脱钩）；断言仍钉 manifest **0.5.8**
- **P0-3 archive**：`archive/README.md` 指向现行 `selfcheck.mjs`；0.2.x–0.3.x 迁到 `archive/selfcheck/legacy/`（INDEX）；近期归档保留 0.4.0 / 0.5.0 / 0.5.1
- **P0-4 Codex / L5**：WritePlan / audit / detect / recommended-profile / questions / ladder L5 / sync-hosts Done 强制可见 **部分对齐（P2）** — `sync.mjs` **不全量**发出 Codex rules/hooks/MCP/skills（交叉 [adapters/codex.md](templates/ai-tools/adapters/codex.md)）
- **边角**：`docs/harness-eng` README 模板去掉重复 `progress.yaml` 行；`domains.yaml` / `domain-packs.yaml` 标明 `schema_version`（≠ skill_version）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART / 手册 → `0.5.8`
- selfcheck → `scripts/selfcheck.mjs`

## 0.5.7 — 2026-09-12（契约 sync 指针去 Cursor 唯权威 + 减少冗余 1x）

### 产品

- **模板**：`contract-sync-mirror.md.tmpl` 不再写「以 `.cursor/rules/11|12|13|16` 为准」。权威 = 根 `AGENTS.md` + `docs/**`，外加**本宿主**已镜像的 `*-sync*`；`.cursor/rules/…` 仅作 Cursor 示例
- **对齐矩阵**：Cursor / Claude / Qoder / WorkBuddy **高**；Trae **中高**；Codex **部分（P2）** — 勿当成已全量同步
- **`1x` 收窄**：只给拿不到全量 rules 镜像的宿主（Codex 始终；自定义入口-only；L0–L2 的 claude/qoder/trae/workbuddy）。L3+ 镜像或 L5 `sync.mjs` 分发时 **跳过 / omit** 冗余 alwaysApply `1x`；已有文件 resume `skip`、不自动删。Cursor 仍不另写 `1x`

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART → `0.5.7`

## 0.5.6 — 2026-09-12（施工 meta 迁入 docs/harness-eng）

### 产品

- **默认写入**：目标仓 `harness-meta.yaml` / `mcp-usage-guide.md` 改到 `docs/harness-eng/`（与评分/报告同目录）
- **读兼容**：detect / session-dash / fill-score / fill-report-html / audit / fill-* 先读新路径，再回退 `.cursor/harness-meta.yaml`（及 `.yml`）；usage-guide 另认 `.cursor/mcp-usage-guide.md` 与旧中文名
- **续跑 / 升阶**：仅有旧 meta、无新路径时迁到新路径（键级合并），**不自动删除**旧文件（遗留只读；可选手工清理）
- **不搬**：`.cursor/mcp.json` / `.mcp.json` / `.trae/mcp.json`、rules、hooks、L5 `docs/agent-config/` 生成物
- **说明**：mcp-usage-guide 启用步骤改为宿主无关措辞（不再写死「Cursor → Settings → MCP」）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART → `0.5.6`

## 0.5.5 — 2026-09-12（安装说明 · 宿主无关）

### 产品

- **安装文案去 Cursor 默认路径**：手册 / README / QUICKSTART / 摘要改为「装到当前 Agent 宿主的用户 skills 目录」；Cursor / Claude Code 等只作路径示例，不作为唯一安装目标
- **CLI**：`npx skills add … -g`，`--agent` 按宿主传；不再把 `--agent cursor` 当唯一命令
- **行为**：施工脚手架、目标仓 `.cursor/harness-meta.yaml`、L0–L5 路径约定不变

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART → `0.5.5`

## 0.5.4 — 2026-09-12（会话仪表盘 · 仅工程轮 SHOW）

### 产品

- **触发收窄**：会话仪表盘不再「每一轮无条件」附末尾。SHOW = 目标仓施工 / 跑 harness 模式（land、resume、pipeline、audit、upgrade、fill-*、detect、WritePlan、render、ladder、改目标仓 harness 产物、续跑中的工程会话）；HIDE = 纯 meta / 版本 / 安装 / 手册 / 术语问答
- **边角**：工程模式仍在进行（如等 WritePlan 确认）时中途 meta 问仍 SHOW；首条只问「当前版本号多少」HIDE；含糊默认 HIDE，除非有进行中的工程模式、已确认 `Q_TARGET_ROOT` 施工、或明确工程动词
- **SKILL 流程第 6 步**：改为条件附仪表盘；手册 / glossary / QUICKSTART / VERIFY 对齐
- **脚本**：`session-dash.mjs --intent engineering|meta`（meta 不输出 markdown；意图仍由 Agent 按 SSOT 判定）

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART → `0.5.4`

## 0.5.3 — 2026-09-11（会话仪表盘 · 每轮回复末尾）

### 产品

- **会话仪表盘 SSOT**：[session-dashboard.md](modes/session-dashboard.md) — 每轮 harness-eng 回复末尾固定四台（决策/诊断/任务/趋势）+ mermaid 象限图
- **脚本**：`scripts/session-dash.mjs` + `scripts/lib/session-dashboard.mjs`（只读；读 meta / score / progress / fill-plan）
- **SKILL 流程第 6 步**：有目标根时优先跑 session-dash 渲染脚注
- 脚注 **详情请查询仪表盘** → 目标仓 `report-latest.html` + skill [使用手册.html#s6](使用手册.html#s6)

### 版本钉

- manifest / meta / questions / README / VERIFY / QUICKSTART → `0.5.3`；glossary 指针 session-dashboard

## 0.5.2 — 2026-09-11（多宿主对等 P0 + sync-hosts 规格）

### 产品

- **MCP 多路径**：`scripts/lib/mcp-paths.mjs`；fill-mcp / calibrate-live / conflict-policy / detect 对齐 `.cursor/mcp.json` ∥ `.mcp.json` ∥ `.trae/mcp.json`
- **CodeBuddy 升格**：hooks 家族进 `.codebuddy/settings.json`（Claude 系 + adapter）；L4/L5 根 `.mcp.json`；L5 sync 分发 hooks/skills
- **Claude 全量 rules 镜像**：L3+ / L5 → `.claude/rules/*.md`
- **P1 骨架**：`sync-hosts.md` + `templates/ai-tools/adapters/{cursor,claude,qoder,trae,workbuddy,codex}.md`（Codex 仍为部分对齐）

### 版本钉

- manifest / meta / questions / domains / README / QUICKSTART / VERIFY → `0.5.2`
- selfcheck → `selfcheck-0.5.2.mjs`；`0.5.1` → archive

## 0.5.1 — 2026-09-11（多宿主对齐：Qoder/Trae hooks·MCP·rules）

### 产品

- **协议族厘清**：Cursor 族 vs Claude 族（`claude` / `qoder` / `trae`）；脚本仍统一 Cursor 协议，Claude 族经 `claude-adapter.js` 翻译
- **Qoder 纠偏**：hooks 写入 `.qoder/settings.json`（`PreToolUse` 等），**不再**生成 Cursor 式 `.qoder/hooks.json`；MCP example/真密主路径改为根 **`.mcp.json`**（与官方一致）
- **Trae 补齐**：L3+ 生成 `.trae/hooks.json`（Claude 系嵌套）+ hooks 脚本/adapter；L4+ `.trae/mcp.json.example`
- **全量 rules 镜像（L3+）**：非 L5 时把 `.cursor/rules/*.mdc` 镜像到 qoder/trae（`.md`，strip frontmatter）与 workbuddy（`RULE.mdc`）；L5 `sync.mjs` 同步按此分发
- **gitignore**：snippet 增加 `.mcp.json` / `.trae/mcp.json`
- ladder / conflict-policy / ai-tools 文档对齐

### 版本钉

- manifest / meta / questions / domains / README / QUICKSTART / VERIFY → `0.5.1`
- selfcheck → `selfcheck-0.5.1.mjs`；`0.5.0` → archive

## 0.5.0 — 2026-08-31（配置 SSOT 管线 L5 / hooks 家族 / pitfalls 工程化）

### 产品

- **L5 新阶梯「配置 SSOT 管线」**：`templates/agent-config/` 模板包（README / `sync.mjs.tmpl` / `hooks/hooks.config.json.tmpl` / mcp / settings）→ 目标仓 `docs/agent-config/` + `scripts/agent-config/sync.mjs`（含 `--check` 漂移校验）；启用后 `.cursor/` `.qoder/` 等为生成物；render `LADDER_ORD` 加 L5；`Q_AGENT_CONFIG`（`S_MULTI_TOOL` 推荐）；meta 模板 +`agent_config` 字段
- **hooks 家族（L3 扩展）**：`git-commit-soft-gate`（superpowers 收口 + 契约漏同步 + migration 环境同步 + pitfalls lint + agent-config 漂移 五合一）、`mcp-mysql-guard`（分环境 DDL/DML 护栏）、`after-edit-reminder`（migration 命名/混写/文件头 + jobs yml）、`stop-delivery-checklist`（未提交收口盲区）；全部 fail-open 软门禁；`Q_HOOKS_FAMILY` 多选装配；L5 启用时渲染到 SSOT 侧
- **契约提醒去硬编码**：domains.yaml 每域新增 `hook:` 段（code globs / docs 目录 / tip）；render 计算占位 `CONTRACT_CHECKS_JS`（`scripts/lib/hooks-checks.mjs`）
- **pitfalls 工程化（L2 原位升级）**：模板升 7 列（+状态 / +触发路径）+ 路径速查 / 域速查 / 已根治留档区 + Grep 查询协议；新增 `templates/scripts/lint-pitfalls.mjs.tmpl`（词表占位 `PITFALL_DOMAINS`）；rule 19 补三问时机 + lint 命令
- **rule 00 增量**：pitfalls 薄片改路径速查 / Grep 协议指引；提交门禁按所装 hooks 条件渲染
- upgrade：`0.4.0 → 0.5.0` 路径 + MATURE 仓 adopt L5（反向拷贝现有工具配置进 SSOT 再 sync）

### 版本钉

- manifest / meta / questions / domains / README / QUICKSTART / VERIFY → `0.5.0`
- detect：`S_AGENT_CONFIG` / `S_MULTI_TOOL` 信号；推荐包 +L5 行；glossary +配置 SSOT 管线 / hooks 家族 / pitfalls lint
- audit：+生成物漂移 / pitfalls 未过 lint 反模式；conflict-policy +L5 生成物勿手改
- selfcheck → `selfcheck-0.5.0.mjs`；`0.4.0` → archive

## 更早版本

0.4.0 及更早条目已归档：[archive/CHANGELOG-through-0.4.md](archive/CHANGELOG-through-0.4.md)。
