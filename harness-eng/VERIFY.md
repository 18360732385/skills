# harness-eng 验收记录（0.8.11）

> **维护者验收**（非上手教程）。静态对照 + 运行时 fixture。真实 land/resume/fill 仍须在目标仓由 Agent 执行并遵守确认闸门。上手见 [QUICKSTART.md](QUICKSTART.md) / [guide/使用手册.md](guide/使用手册.md)。

## 版本

当前 **0.8.11**（确认令牌 + rev 新鲜度 + 预授权落盘 + UTF-16 JSON；其下 0.8.10 闸门与一致性 · 0.8.9 实战解析 · 0.8.8 gold 四道 · 0.8.7 实战待完善 · 0.8.6 实战总析仍存项 · 0.8.5 实战缺陷全修 · 0.8.4 实战收口 · 0.8.3 D8–D16 · 0.8.2 报告页人话化 · 0.8.1 三域满配 · 0.8.0 仓型三分 + 前端五域 + rules 101 族）。报告对照 **`skill_version` + `report_schema`**（**0.4.3**；**报告壳 ≠ skill**）。Trae 对齐见 [host/TRAE-PARITY.md](host/TRAE-PARITY.md)；Qoder 见 [host/QODER-PARITY.md](host/QODER-PARITY.md)；P0 实证全文为仓库级档案 `TRAE-P0-EVIDENCE.md`（不随安装分发）。

## 0.8.11 增量验收（确认令牌与 rev）

| 项 | 期望 |
|---|---|
| manifest `0.8.11` / `rev` 0；`harness-meta` 模板含 `skill_rev`；sync 标记含 `HARNESS_ENG_REV` | 有 |
| 无 `--confirm` 且无落盘预授权时，`harness.mjs` / `render.mjs` 真写退出且不落文件 | 有 |
| `--confirm 确认预授权` 只写 `write-auth.yaml`；之后省略 `--confirm` 可以写盘 | 有 |
| 同 version 不同 `rev` 时安装副本告警；L5 freshness 在 rev 不一致时为 stale | 有 |
| UTF-16 LE（有 BOM / 无 BOM）JSON 可解析；`Q_PREAUTH` 的 recommended 为 false | 有 |
| upgrade `## 0.8.10 → 0.8.11`；CHANGELOG 0.8.11；CI 含 `windows-latest` | 有 |

## 0.8.10 增量验收（闸门与一致性）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.8.10`、`rev` 为 0；与 `templates/_meta` 的 version / rev 一致 | 有 |
| 裸「确认」只在紧接 WritePlan 的下一轮有效；预授权只授权后续轮次 | 有 |
| `sync-skill-version` 同步 SKILL 正文钉；`report_schema` 人读钉指向 glossary | 有 |
| CHANGELOG 有 0.8.10 行；upgrade 有 `0.8.9 → 0.8.10` | 有 |
| `scripts/pack-check.mjs` 通过；CI 跑 selfcheck + sync check + pack-check | 有 |
| `--params -` 与 `refresh --exit-zero` 在 `harness --help` 可见 | 有 |

## 0.8.9 增量验收（实战解析）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.8.9`；`report_schema` 仍 **0.4.3** | 有 |
| func 引用槽认出 `*ServiceImpl`；`### 变更记录` 不吞掉所在 `##` 节 | 有 |
| `acceptance-check` 的 `version` 读 manifest，不再写死 | 有 |
| 已有 migrate `ops` 的心跳只刷新时间戳；空报告仍是短心跳 | 有 |
| 形态到顶且金标未过时文案为「未过线」，不写「拖后腿 / 已达理论上限」 | 有 |
| API 路径、类名、Redis 模式按边界判断已覆盖；无表名的 `IF NOT EXISTS` 不产出 `IF` | 有 |
| prototype 重复 id 消解并告警；jobs 真相路径不对时 reason 含 `docs/jobs/tasks/` | 有 |
| client-api 索引写明排除 `type_export`；refresh 成功打分后重建报告 HTML | 有 |
| upgrade `## 0.8.8 → 0.8.9`；CHANGELOG 0.8.9 | 有 |

## 0.8.8 增量验收（gold 开干四道）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.8.8`；`report_schema` **0.4.3** | 有 |
| gold 判定：分域覆盖 100%、金标指数 ≥ 98%、身份双向一致、真实性记录未过期 pass | 有 |
| strict / mature_compat 不套用上述四道 | 有 |
| `fill-plan --gold` 批次带唯一 `unit_ids` | 有 |
| upgrade `## 0.8.7 → 0.8.8`；CHANGELOG 0.8.8 | 有 |

## 0.8.8 增量验收（gold 开干与精填核对）

| 项 | 期望 |
|---|---|
| gold 判定覆盖用 `all_domains` / 每域 1.0，不改写策略文件里的 `coverage_mode` | 有 |
| 全仓与分域金标指数必须是数字且 ≥ 0.98；阻断项与警告仍须为 0 | 有 |
| `--gold --ssot-only` 做身份双向核对；`--units` 只核名单内单位 | 有 |
| `coverage-audit/<域>.json` 机械校验哈希与唯一 `pass`；脚本不写 `verdict` | 有 |
| 批次 `in_progress` 冻结 `unit_ids`；gold 关批不扫 `.fill-work` | 有 |
| 诊断台三列；`report_schema` 0.4.3；非 gold 真实性显示「未要求」 | 有 |

## 0.8.7 增量验收（实战待完善）

对照 0.8.6 实战总析（c-be-sms-ai）「缺点与待完善」里应改的 7 项。计分分母与 `report_schema` 0.4.2 不动。

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.7` | 有 |
| render `--dry-run` 不回写 `harness-meta.yaml`（含 mtime）；相同 `mysql_guard_servers` 真写也不碰文件 | 有 |
| upgrade 比较正在执行的技能与 `~/.cursor/skills/harness-eng`；版本不同且路径不同才警告，不改变 exit code | 有 |
| `upgrade-diff` 带 `coverage_before` / `coverage_after` / `coverage_note_zh`；不在 upgrade 里 refresh | 有 |
| 无升严 blocker 时只刷新 `migrate-docs-report.json` 时间戳，不调用 `planMigrateDocs` | 有 |
| hook dry-run 内容相同：`results` 与 `hooks_reviewed` 都是 `unchanged` | 有 |
| 满分不写「拖后腿 / 主要短板」；总评写明覆盖等于点名、不核字段；client-api 写明排除的 `type_export` | 有 |
| upgrade `## 0.8.6 → 0.8.7`；CHANGELOG 0.8.7；`sync-skill-version --check` ok | 有 |
| selfcheck 0.8.7 块；`node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.8.6 增量验收（实战总析仍存项）

对照 0.8.5 实战总析（c-be-sms-ai）「仍存 / 半完成」项。前端金标改为资产点名，不过不放宽。

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.6` | 有 |
| design inventory：`docs/design/` 与 `/templates/`、`*-template.md` 不进分母；仓外 `DESIGN.md` 仍收录 | 有 |
| pages inventory：页面约定源文件只出 `page_file`；路由表文件仍出 `route` | 有 |
| `buildFrontendCoverageRow`：传入 `mapped` 时 `ratio=mapped/assets`，并带 `unmapped`；省略 `mapped` 时仍为 `truths/assets` | 有 |
| 点名规则：真相正文中的 path / route / url / dep；变更记录节不计；短名整 token | 有 |
| `countActionableHarnessTodos`：正文提及、变更记录、围栏代码不计；整行或表格占位仍计 | 有 |
| `selfcheck --help` / `-h`：exit 0，不跑套件 | 有 |
| `reverse-changelog-tables` 为 `optional: true`；upgrade 写明 0.8.6 起默认不进写集 | 有 |
| 报告分域行在有数字时透出 `mapped` / `unmapped` | 有 |
| upgrade `## 0.8.5 → 0.8.6`；CHANGELOG 0.8.6；`sync-skill-version --check` ok | 有 |
| selfcheck 0.8.6 块；`node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.8.5 增量验收（实战缺陷全修）

对照 0.8.4 实战总析（c-be-sms-ai）「仍存 / 新发现」项；前端覆盖改为真实资产比，不过不放宽。

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.5` | 有 |
| score-policy：CRLF→LF；`coverage_mode`/`gate_profile` 整行替换不吞 LF；gold 无变更不写盘；缺前端 targets 补 `1.0` | 有 |
| prototype/design 索引 tmpl 无 `TODO(harness-eng)` 占位 | 有 |
| `buildFrontendCoverageRow`：`unit=asset`，`ratio=truths/assets`；一篇真相多资产不过 gold 1.0 | 有 |
| `isFrontendTruthFile`：业务 `*-template-import.md` 计入；`/templates/` 与 `*-template.md` 排除 | 有 |
| prototype inventory：SSOT 下 md 不进分母 | 有 |
| rule17 退役：扫 `.mdc`+`.md` 宿主；文案「经确认后退役」 | 有 |
| `countTodosInFile`：跳过 `## 变更记录` 节 | 有 |
| upgrade `## 0.8.4 → 0.8.5`；CHANGELOG 0.8.5；`sync-skill-version --check` ok | 有 |
| selfcheck 0.8.5 块；`node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.8.4 增量验收（实战残留收口）

对照 0.8.3 实战总析（c-be-sms-ai，https://harness-eng-0-8-3-asan.pages.grok.bot/）「待完善」项逐项修复并钉版；当时保留前端金标「一门一真相」公式（0.8.5 已改为真实资产比）。

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.4` | 有 |
| `GLOB_FRONTEND` 默认对齐 detect（apps/packages）；禁裸 `**/src/**`；非默认 `FRONTEND_DIR` 追加；upgrade 继承 rule-17 globs | 有 |
| 17 退役：扫宿主 + SSOT；多行 `git mv`；提示先收窄 101；selfcheck 不锁死单句金标 | 有 |
| 报告 `domains[].asset_ratio` / `inventory_assets`；总评 `one_line_zh` 提示资产比偏低 | 有 |
| archive-docs：嵌套路径、`--dry-run`、拒绝 runtime（tokens.css 等） | 有 |
| 对比句优先 `coverage_all_percent`；缺历史门禁字段 → omit（不假 0） | 有 |
| `collectFuncDocClassNames`：标题/表裸类名；`hasApiEvidence`：联调/Controller 等价 | 有 |
| `__installSurfaceIssue`：落点 marker（SKILL.md / `_meta/manifest.yaml` / `scripts/`） | 有 |
| migrate-docs：dry-run / ops=0 刷新 `migrate-docs-report.json`（含 `generated_at`） | 有 |
| pages feature 根 `index`/`*Page`；client-api 覆盖分母排除 `type_export` | 有 |
| upgrade `## 0.8.3 → 0.8.4`；CHANGELOG 0.8.4；`sync-skill-version --check` ok | 有 |
| selfcheck 0.8.4 块；`node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.8.3 增量验收（报告缺陷修复列车）

对照 0.8.1 升级实战报告（c-be-sms-ai R1–R10，2026-11-25 复核）后仍存在的 D8–D16 缺陷逐项修复并钉版；D1–D7、D17 已由 0.8.1 口径补丁覆盖，见 CHANGELOG「0.8.1（补丁，未改 manifest）」三条。

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.3` | 有 |
| D12 migrate-docs 幂等：`api_rewrite_path` 未命中 → `noop`（不再假 patched）；`api_append_endpoints` 按 path+method 与文档去重；`api_append_fields` 字段级幂等（重复字段不追加）；jobs op 带 `resolved_from`（new-page/existing-page 审计） | 有 |
| D10 rule101 接线：`params.rule101`（true/"full"/off）与 CLI `--rule101[=full|off]`（harness → render 转发）直接进写集；rule-101 与 rule-101-full 二选一互斥保持 | 有 |
| D8 顶栏口径统一：`coverage_ready.all_percent` + 顶层 `coverage_all_percent`（与 `coverage_ready` 同源 `effective_ratio`）；报告顶栏/覆盖条/总评分分项/CLI 摘要/diff 优先门禁口径；legacy JSON 回退 API 口径并标 `coverage_percent_source=legacy` | 有 |
| D15 `--migrate-docs` help 默认值改「厚仓 dry-run / 薄仓 auto」（与 `resolveMigrateDocsMode` 实际一致） | 有 |
| D16 selfcheck 入口隔离外部 `HARNESS_ENG_ROOT`（保存→删→exit 恢复；mid-run env 干净；显式设置 env 的单元断言保持） | 有 |
| D13 design 侧 archive_hint：已在 `docs/design/` 内的 `DESIGN*.md` 提示「已在 SSOT 树内」（对齐 prototype）；新增可逆归档 CLI `scripts/archive-docs.mjs`（`--archive`/`--restore`/`--list`；move + `archive-ledger.json` 账本，只搬不删） | 有 |
| D9 selfcheck junction 落点健康检查：目标不可达 / 空目录 → 人话 fail fast（skills-manager 落点挖空防御；健康 junction 打印落点提示） | 有 |
| D14 refresh 扫变更记录占位残留：后端五域表行 `PLACEHOLDER` / 字面 `v{ts}` → `changelog_placeholder_warnings` 非阻断提示（提示跑 `new_changelog_version.py` 补号） | 有 |
| D11 upgrade 收尾检测 `.cursor/rules/17-frontend-web.mdc` 与 `101-frontend-web.mdc` 并存 → 警告 + 退役命令（`git mv` 到 `docs/harness-eng/archive/`）；不自动删 | 有 |
| upgrade `## 0.8.2 → 0.8.3`；CHANGELOG 0.8.3；`sync-skill-version --check` ok | 有 |
| selfcheck 0.8.3 块（D8–D16 定向断言）；`node scripts/selfcheck.mjs` exit 0 | 有 |

## 0.8.2 增量验收（报告页人话化 · report_schema 0.4.2）

| 项 | 期望 |
|---|---|
| 当时 `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.2` | 有 |
| `report_schema` 0.4.1 → **0.4.2**（`report-ui.mjs` / `score-history.mjs` 同步；0.4.x 族内趋势仍可比） | 有 |
| 首屏**总评横幅**：Verdict 徽章 + 总评分（0–100 + 等级：≥90 优秀 / ≥75 良好 / ≥60 合格 / <60 待改进）+ 一句话结论 + 分项 chips +「仅参考 · ≠开干」角标；施工阶梯并入决策台与开干清单同组；10 秒结论区精简（留「还差什么/建议升阶」） | 有 |
| 术语人话化：形态分→文档质量分 · 覆盖→代码覆盖率 · 金标达标率→验收通过率 · 语义闸→语义抽检 · 填充计划→补文档计划 · 残差→验收遗留项 · 开干闸路径→开干清单 · 宿主台→落地检查台；原文术语进名词解释 tooltip | 有 |
| 结构简化：KPI 灯组并入开干清单（决策台）；诊断台「常见缺口分布」「低分原因 Top」折叠；趋势台仪表参考分块移除 | 有 |
| 降噪：标题去 `CYBERPUNK TERMINAL`；移除扫描线/网格纹理/glitch/闪烁光标/扫描光/Orbitron；深浅双主题保留 | 有 |
| 视觉精修（工程图纸 × 夜班表盘）：亮色=草图纸墨绿油墨、暗色=蓝绿黑荧光表盘（摆脱纯黑+酸性绿）；Verdict 徽章改**验收印章**（双环边框+微旋转）；等宽字体仅限仪表读数；去 ALL-CAPS/辉光/`>` `▶` `//` 装饰；阶梯与清单之间加图纸虚线分隔；`:focus-visible` 全局焦点环 | 有 |
| 横幅与动效：分数纵排仪表面 + 方格纸底纹 + 虚线中缝；「盖章时刻」入场编排（stamp-in / stamp-ring / countUp 600ms + setTimeout 兜底 / 进度条 rAF 生长）；阶梯/清单 1fr 1fr 双列并排（<860px 回落纵叠）；光效仅暗色（数字磷光 + 进度条辉光）；`--force-prefers-reduced-motion` 无头验证终值 69.2 落定 | 有 |
| `selfcheck` 0.8.2 块（总评分 grade/one_line/parts + 模板降噪断言） | 有 |
| upgrade `## 0.8.1 → 0.8.2`；CHANGELOG 0.8.2 | 有 |

## 0.8.1 增量验收（三域满配计分）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.1` | 有 |
| `lib/inventory-pages.mjs`（路由声明 + 目录约定）· `inventory-components.mjs`（组件盘点）· `inventory-client-api.mjs`（导出方法 + hooks 清单） | 有 |
| `morph-required.yaml` 补 pages（4 章）/ components（5 章）/ client-api（3 章）必填 | 有 |
| 三份真相模板落 `templates/docs/{pages,components,client-api}/templates/`；client-api **双态**（回链态 / 字段级态） | 有 |
| `domains.yaml`：三域 `optional: false` + `inventory` CLI + `scan_fill_work`；hook_tip 升「0.8.1 起计分」 | 有 |
| `recommended-profile`：frontend 仓五域全开；fullstack 后端域 ∪ 五域 | 有 |
| upgrade `## 0.8.0 → 0.8.1`；CHANGELOG 0.8.1；仓库级 `_log` | 有 |
| sms-ai-web 五域实仓烟测（`.fill-work`）结果随会话归档 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.8.0 增量验收（仓型三分 · 前端五域 · rules 101 族）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.8.0` | 有 |
| `harness-meta` tmpl 含 `repo_kind` / `monorepo`；detect 规格含三分判定（不确定 → `Q_REPO_KIND`） | 有 |
| `domains.yaml` 五域注册：`design`/`prototype`（计分）+ `pages`/`components`/`client-api`（索引壳）；`domain-packs.yaml` 五包 + rules 102–106 | 有 |
| `lib/inventory-design.mjs` / `lib/inventory-prototype.mjs`；`fill-merge` 认 design/prototype 分支 | 有 |
| rules 101 族：`101-frontend-web(.full)` 改名自 17；render 互斥 rule-101/rule-101-full；正文无残留现行 `17-frontend-web` id | 有 |
| `recommended-profile` 按 `repo_kind` 分流 domains（frontend→前端域；fullstack→并集；backend→现状） | 有 |
| `ai-coding-gate`：`frontend_coverage` 按 design/prototype 实计（不再恒 `not_measured`） | 有 |
| upgrade `## 0.7.63 → 0.8.0`；CHANGELOG 0.8.0；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.63 增量验收（superpowers 本人主题软提醒）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.63` | 有 |
| `templates/hooks/superpowers-theme-gate.js` + soft/basic/stop/codex-stop 用 `listOwnActivePlanThemes` | 有 |
| soft-gate 保留 `listActiveTopicRuns`；不再以 `readdirSync(plans/)` 为唯一信号 | 有 |
| sync.tmpl / expandHooksFamily / upgrade ALWAYS_REPLACE 含 theme-gate companion | 有 |
| upgrade `## 0.7.62 → 0.7.63`；CHANGELOG 0.7.63；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.62 增量验收（变更记录 / Pn 时间戳发号）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.62` | 有 |
| manifest 含 `doc-versioning-lib` / `new-changelog-version-py` / `reverse-changelog-tables` / `new-pitfall-id` | 有 |
| rules 11/12/13/16/20 含 `v{yyMMddHHmmssSSS}` + `new_changelog_version.py`；NN 仍最大号+1 | 有 |
| rule 19 / lint-pitfalls：双轨 `P{ts}` + 倒序；禁「ID 递增」强制新条 | 有 |
| 五域变更记录模板有表顶/`v{ts}` 注；pitfalls / delivery-checklist 对齐 | 有 |
| upgrade `## 0.7.61 → 0.7.62`；CHANGELOG 0.7.62；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.61 增量验收（多宿主路径中性化）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.61` | 有 |
| `00-project-docs-overview` 不含 `path-scoped \`.cursor/rules/\``；指向各工具 `rules/` / `docs/agent-config/rules` | 有 |
| soft-gate 提醒不含「暂存 `.cursor/`」「`.cursor/` 等生成物」 | 有 |
| AGENTS 管控 / agent-kb / superpowers / `00-harness-ssot` 不以 `.cursor/rules|mcp` 为唯一权威 | 有 |
| upgrade `## 0.7.60 → 0.7.61`；CHANGELOG 0.7.61；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.60 增量验收（报告首屏人话化 · 宿主台三态）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.60` | 有 |
| `report_schema` **0.4.1**：`gap_to_ready.summary` 人话、含 `blockers_grouped`；headline 无 raw `doc_*_drift` 倾泻 | 有 |
| 宿主台：`disk_any` 不计仅 githooks；无 session-live 时胶囊可为 `disk_only`；`status_zh` 中文 | 有 |
| 报告 tmpl：下一步建议 / 已落地·待自证 / gap「展开机器码详情」 | 有 |
| upgrade `## 0.7.59 → 0.7.60`；CHANGELOG 0.7.60；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.59 增量验收（L5 skills Codex-only）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.59` | 有 |
| `sync.mjs.tmpl`：`planSkills` 仅 `has("codex")` → `.agents/skills/`；含 `LEGACY_SKILLS_PRUNE_DIRS` | 有 |
| 不向 `.cursor/skills` 等 `put`；legacy 按 `.harness-managed.json` prune | 有 |
| upgrade `## 0.7.58 → 0.7.59`；CHANGELOG 0.7.59；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.58 增量验收（P1 + P2-14）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.58` | 有 |
| meta：upgrade 保留 `installed_at`；回写 `upgraded_at`；tmpl 含两字段 | 有 |
| hooks-fix-skip：`hooks_reviewed` + `hooks_not_in_write_set`；stderr 摘要 | 有 |
| `calibrate-live.mjs` 别名转发；缺驱动含 PowerShell 安装示例 | 有 |
| `questions-next --root`；`bump-run-round --dry-run` | 有 |
| upgrade-diff：`summary_zh` + stderr `【开干归因】` | 有 |
| fill-score `acceptance.scope=all`；`gold_ratio` 与 CLI `--domain all` 同口径 | 有 |
| upgrade `## 0.7.57 → 0.7.58`；CHANGELOG 0.7.58；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.57 增量验收（P0-2～P0-5 热修）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.57` | 有 |
| dry-run upgrade 对结构定制 fix-hook 预告 `hooks_skipped_custom`（与真写同判定） | 有 |
| upgrade-diff / render skip stderr 含中文人话（结构定制保留 · 占位未落地 · replace/手改） | 有 |
| 报告 tmpl / fill-report-html 主展示 `ai_coding_ready`；`ready` 仅 deprecated 副标 | 有 |
| `isNoisePattern` 过滤 `redis.call` / KEYS+ARGV Lua 体；真实 key 保留 | 有 |
| upgrade `## 0.7.56 → 0.7.57`；CHANGELOG 0.7.57；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.56 增量验收（sms-ai P0/P1/#9）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.56` | 有 |
| superpowers README 含「约定」；plans/specs 有 README.tmpl；manifest `sp-readme-active-*` | 有 |
| 00 无薄片 TODO；高频避坑 ≥5 行；agent-kb README 路径速查优先 | 有 |
| rule 18 含判断表（进行中/宣称交付）；AGENTS.root 含 Planning corpus | 有 |
| rule 19 一行一错 + 双速查；domains/soft-gate tip 含「真相」口径 | 有 |
| upgrade `## 0.7.55 → 0.7.56`；CHANGELOG 0.7.56；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.55 增量验收（sms-ai ARCHIVE 对标）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.55` | 有 |
| `sp-archive` target = `docs/superpowers/archive/ARCHIVE.md`；无根级 `ARCHIVE.md.tmpl` | 有 |
| README / rule 18 / 00 链到 `archive/ARCHIVE.md`；表头含「用户」列 | 有 |
| `migrateSuperpowersArchiveIfNeeded` + `looksLikeSuperpowersThemeTable`（认用户列） | 有 |
| upgrade `## 0.7.54 → 0.7.55`；CHANGELOG 0.7.55；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.54 增量验收（upgrade_fix_hooks=auto）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.54` | 有 |
| upgrade 默认 `upgrade_fix_hooks=auto`；显式 `replace`/`skip`/`true`/`false` | 有 |
| 结构定制 soft-gate → skip + sidecar；纯常量差 → replace；adapter 始终 replace | 有 |
| upgrade-diff：`hooks_fix_policy` / `hooks_skipped_custom` / `hooks_behavior_patch_skipped` | 有 |
| upgrade `## 0.7.53 → 0.7.54`；CHANGELOG 0.7.54；仓库级 `_log` | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.53 增量验收（厚仓 hooks 加固）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.53` | 有 |
| `normalizeMigrationDir` 拒绝 `**/…`；默认 `db/migration/`；inventory `sql_root` 回填 | 有 |
| `hook-backfill.mjs`：脚本探测 + 旧 soft-gate 刮取；`hook_profile` mature/thin（≠ gate mature_compat） | 有 |
| `buildContractChecksJs` 只用 `hook_code`，不并 GLOB | 有 |
| soft-gate mature 真跑 lint/sync --check；stop 指纹 + loop_count | 有 |
| `ensureDbMdMaintenance` manual_sql 无 `0001_DDL` 虚构样例 | 有 |
| upgrade-diff 含 `hooks_placeholder_delta` / `capability_lost` | 有 |
| upgrade `## 0.7.52 → 0.7.53`；CHANGELOG 0.7.53 索引行；仓库级版本要点档案 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.52 增量验收（全量修复列车）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.52` | 有 |
| `questions-next` 用 `isCliMain`；四处 replace→replacer；rule-17 互斥；`mature_compat` 题库+fill-gate | 有 |
| 六 mode / report_schema 0.4.0 / 会话四句块 / dual-manifest 权威口径一致 | 有 |
| CRLF/BOM/maxBuffer/yaml 块标量抛错；孤儿清理；无包内 `score-latest.json`；无 `skill_patch: 0.2.16` | 有 |
| `templates/_meta/RENDER-REGISTRIES.md`；upgrade/VERIFY 近窗 + 仓库级历史档案；无 `evals/`（skill-up 评测套件已移除） | 有 |
| upgrade `## 0.7.51 → 0.7.52`；CHANGELOG 0.7.52 索引行；仓库级版本要点档案 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`selfcheck-render.mjs` ok；`sync-skill-version --check` ok | 有 |

## 0.7.51 增量验收（SQL 迁移命名双轨）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.51` | 有 |
| soft-gate `MIGRATION_OLD_NAME_RE`（`null`=单轨默认）+ 新增(A)/改名(R) 双状态 + 「旧格式/不合规」文案分离（M 不刷屏） | 有 |
| `hooks-checks.mjs` `migration_old_name_re` 三通道注入 + `domains.yaml` `db.hook_old_name_re` 可选键 | 有 |
| 可选包 `migration-naming-lib` / `new-migration-py`（`MIGRATION_DIR_REL` / `MIGRATION_TZ` 占位；`render.mjs` 默认注入） | 有 |
| rule 13 / db.md「当前最高号/最新时间戳」禁令（目录即清单） | 有 |
| upgrade `## 0.7.50 → 0.7.51`；CHANGELOG 0.7.51 索引行；仓库级版本要点档案（不随包分发） | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.50 增量验收（运行时 _log 零依赖）

| 项 | 期望 |
|---|---|
| `scripts/fill-truths-auto.mjs` 不存在；archive INDEX 标「已归档 · 不可运行 · 对话不推荐」 | 有 |
| 随包树零 `_log` 引用（豁免仅 selfcheck 三件套：`selfcheck.mjs` / `lib/selfcheck/checks-0.5.mjs` / `checks-0.6.mjs`，内部均 hasLog 门禁） | 有 |
| CHANGELOG 索引行纯版本号格式（`| 0.7.50 |`）；头行「仓库级档案」措辞 | 有 |
| VERIFY / AGENT-INDEX / upgrade.md / host 家族 / archive 家族 / adapters / `.skillignore` 零 `_log` 路径 | 有 |
| selfcheck 双态：dev 全仓全绿；install 态模拟（无 `_log`、按 `.skillignore` 裁剪）exit 0 + 跳过提示 | 有 |
| 仓根 README 新增「仓库级档案与发版」节（布局 + 发版手册 + 门禁约定） | 有 |
| upgrade `## 0.7.49 → 0.7.50`；CHANGELOG 索引 0.7.50 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.49 增量验收（sms-ai 实践回流）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.49` | 有 |
| SKILL.md 硬闸门 / fill-mcp.md 含 `vendored_shared` 例外与 L5 `servers.json` 路径档 | 有 |
| rule-17 薄指针为默认；`rule-17-full` 厚正文可选（二选一）；17 模板保留「协作包」标记 | 有 |
| rule 18 / superpowers README 索引表含「用户」列与取值约定 | 有 |
| soft-gate 六合一：`MIGRATION_ENV_STATUS_CMD`（dev 账本 status + 降级）· `MIGRATION_NEW_SCRIPT`（命名软提醒）；hooks-checks 注入 + domains.yaml 可选键 | 有 |
| 00 rule 提交门禁含 Apifox 条；文档权威含第 9 位环境/部署文档（可选） | 有 |
| pitfalls 模板 ID 治理头部 + 「相关」段；`agent-config/mcp/README.md` 模板 + ADR 回链行 | 有 |
| agents 模板：root 环境变量节 · spring 变更记录/错误码速查/§4.x · frontend 变更记录 | 有 |
| apifox `upgrade-field-tables-to-7col.mjs`（去域化）+ `host/QODER-PARITY.md` + AGENT-INDEX 登记 | 有 |
| upgrade `## 0.7.48 → 0.7.49`；CHANGELOG 索引 0.7.49 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.48 增量验收（厚仓加固）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.48` | 有 |
| 厚仓 / thickTruths 未显式指定时 `migrate-docs` 默认 **dry-run**；显式 `auto` 可写盘 | 有 |
| `parseDocFieldNames` 精确 `## 字段` + CREATE TABLE 回退；`--inventory-mode`；redis/jobs 噪声 | 有 |
| acceptance 忽略 code fence 内 `\|`；`mature_compat` 档 drift 不阻断开干 | 有 |
| `score-latest.prev.json` 备份；`ensureDbMdMaintenance` 按 manual_sql/flyway | 有 |
| upgrade `## 0.7.47 → 0.7.48`；CHANGELOG 索引 0.7.48 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.47 增量验收（e2e-19）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` ≡ `templates/_meta/manifest.yaml` 为权威 `0.7.47` | 有 |
| `--migrate-coverage` 默认 **off**；`append` 只补缺页/缺节；`covered_gt` 无 delete op | 有 |
| upgrade 文首消歧含 `--migrate-coverage`；`## 0.7.46 → 0.7.47` | 有 |
| selfcheck 夹具 `e2e-19-longjump` / `e2e-19-cold` PASS；实仓 A/H 无金仓则 仓库级档案 `e2e-19-verify.md` 写明 SKIP | 有 |
| 跨 mode `last_mode` 仍为 accepted residual；宿主 Trae/Codex/CodeBuddy **不改代码**（人验日期保鲜 2026-10-14） | 有 |
| CHANGELOG 索引含 0.7.47 | 有 |
| `node scripts/selfcheck.mjs` exit 0；`sync-skill-version --check` ok | 有 |

## 0.7.46 增量验收（e2e-18 P3）

| 项 | 期望 |
|---|---|
| `_meta/manifest.yaml` 为权威 `0.7.46`；templates / meta / questions / sync tmpl 一致 | 有 |
| upgrade 文首「旗标消歧」含 migrate-docs / migrate-policy / check-meta-stable | 有 |
| 0.7.41 节标注历史口径 +「0.7.44+」；VERIFY 0.7.41 行含历史注 | 有 |
| glossary：migrate-docs / migrate-policy / last_mode accepted residual | 有 |
| AGENT-INDEX + QUICKSTART 含升严 CLI 与消歧 | 有 |
| fill-score `--migrate-policy` 旁注 ≠ migrate-docs | 有 |
| CHANGELOG 索引含 0.7.46；upgrade `## 0.7.45 → 0.7.46` | 有 |
| `node scripts/selfcheck.mjs` exit 0 | 有 |


## 更早增量验收（历史增量）

0.7.45 及更早见仓库级档案 `VERIFY-history-through-0.7.51.md`（安装包不随附）。  
更早窗口另见 `VERIFY-history-through-0.6.0.md` / `VERIFY-history-through-0.2.27.md`（均为仓库级档案）。

