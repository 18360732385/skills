# 术语与阶段卡（对用户展示）

内部仍可用英文 ID；**对用户默认用中文名**，括号附英文别名。提问前可摘要展示本表相关行。

## 阶梯（成熟度）`Q_LADDER`

| 阶 | 中文名 | 一句话：你得到什么 |
|---|---|---|
| **L0** | 协作入口 | 根/分册 `AGENTS.md`、总览规则、Karpathy、`docs/harness-eng/harness-meta.yaml`（遗留 `.cursor/` 只读回退） |
| **L1** | 契约骨架 | `docs/func|api|db|redis|jobs`（按所选）索引 + templates + 同步 rules（11/12/13/16/20） |
| **L2** | 知识回流 | `docs/agent-kb` 四件套 + pitfalls「域」列 + rule 19 |
| **L3** | 规划与软门禁 | `docs/superpowers` 进行中表 + commit **软提醒** hooks（不拦截） |
| **L4** | 工具连接样例 | `mcp.json.example` + 说明 + `.gitignore` 忽略真密 `mcp.json` |
| **L5** | 配置 SSOT 管线 | `docs/agent-config/` + `sync.mjs --check`；`.cursor/` 等工具目录变生成物，勿手改 |

大仓常见起步：**L4**（骨架 + hooks + MCP example 一次到位，再填真相）。仅当用户明确「只要协作+索引、不深填」时推荐停在 **L2**。

## 模式 `Q_MODE`

| 中文 | 内部名 | 何时用 |
|---|---|---|
| **落地** | `land` | 从零或按目标阶梯安装骨架（大仓默认 L4） |
| **流水线** | `pipeline` | 一次确认串联 audit→L4 land→**MCP 矩阵/闸**→inventory→**fill-plan**→**agents**→score（大仓首次【推荐】） |
| **审计** | `audit` | 只读对照缺口，默认不写盘 |
| **升阶** | `upgrade` | 当前完整阶再 +1（书面可到指定阶）；规格 [upgrade.md](upgrade.md) |
| **补空壳真相** | `seed-truths` | 索引表加导航行 + `01-*.md` 空壳（**无**字段级契约） |
| **填充计划** | `fill-plan` | 目标/批次/Done；进度 SSOT（`docs/harness-eng/fill-plan.yaml`） |
| **多 Agent 精填** | `fill-truths-agents` | 按 Plan 批次 + 模板完整档写深度真相【推荐】 |
| **自动填充** | `fill-truths-auto` | **legacy**；仅 `--work-only` 草稿 |
| **填充引擎** | `Q_FILL_ENGINE` | `agents`【推荐】/ `hybrid`（可选）/ `auto`（legacy） |
| **inventory 默认路径** | — | `docs/<domain>/.fill-work/inventory*.json`（fill-score 可自动发现） |
| **续跑** | `resume` | 已有一半 harness：读 meta/指纹，**只补缺口**（幂等） |
| **完整度打分** | `fill-score` | 双轴：形态 + 开干；见 [fill-score.md](fill-score.md) |
| **形态诊断** | `fill-morph` | 只看形态轴；引擎同 fill-score `--focus morph` |
| **开干闸** | `fill-gate` | 只看开干清单 / gate；引擎同 fill-score `--focus gate` |
| **填充** | `fill-*` | 骨架后：MCP → inventory → fill-plan → agents，见 [fill.md](fill.md) |
| **收益递减早停** | pipeline | **以 Plan 批次关闭 + semantic_ready / ai_coding_ready 为准** |

## 分层 ready · 金标

对用户摘要只输出三词：**覆盖** / **形态** / **开干**。

| 词 | 字段 | 含义 |
|---|---|---|
| **覆盖** | `coverage` / `coverage_by_domain` / `coverage_ready` | 相对 inventory 的文档化比例；裁决见 score-policy |
| **形态** | `overall` / 域分 / `template_completeness` / `formula_ceiling` | 像不像模板；贴顶后走 agents |
| **开干** | 仅 `ai_coding_ready` | 建议可以 AI 改业务的唯一闸 |

技术字段（骨架/语义/Plan/gate/gold/ready.ok）见 [fill-score.md](fill-score.md)。  
`gate_profile`：有 score-policy 未写则 **strict**；无文件则 **legacy**；显式 `legacy` 可回退；显式 **`gold`** 为高门槛档（覆盖 100% / 形态≥90 / 完成度≥95 / TODO 扫面 B / warnings=0）。新仓【推荐】仍 **strict**（`Q_GATE_PROFILE`）。

### 覆盖裁决（score-policy vs meta）

**`coverage_ready` 以 `docs/harness-eng/score-policy.yaml` 为准**（有则）：按 `coverage_mode` + `coverage_targets`。  
域目标缺省 → 回退 `meta.ready_coverage` / CLI（默认 0.8）。无文件 → `overall` + `ready_coverage`。  
大仓【推荐】`all_domains` + `strict`；贴顶后升 `gold`（[recommended-profile.md](recommended-profile.md)）。详 [fill-score.md](fill-score.md) / [fill-gate.md](fill-gate.md)。

| 速查 | 含义 |
|---|---|
| `score-policy.yaml` | `coverage_mode` + `coverage_targets` + `density` + `gate_profile`/`gate` |
| `formula_ceiling` / `domain_caps` | 形态贴顶信号 |
| `run-latest.json` | `round`；fill-report-html 默认加载并写入 history |
| `ui.version` | 报告壳（现 **0.2.24**）；≠ `skill_version` |

## 常用词

| 说法 | 含义 |
|---|---|
| **契约域** | 注册表 `domains.yaml` 中 `kind: contract` 的域（现含 func/api/db/redis/jobs…）。名单 / 路径 / CLI 默认由 registry 驱动（0.3.7+）；morph 必填章见 `morph-required.yaml`（0.3.8+）；L1 文件靠 **packs** 展开。见 [domain-extend.md](domain-extend.md) |
| **packs** | `domain-packs.yaml` 里某域的 L1 文件清单；`render` 按 `params.domains` 展开，不是「零代码加域」 |
| **scheduler_link** | jobs inventory：`exact` \| `heuristic` \| `none`。heuristic 须 fragment 标 `quality: heuristic`，且不得 promote 进 `docs/jobs/tasks/` |
| **过程包** | 如 `docs/releases`（发版过程域；非 fill-score）；detect 脚注，不进 L1 契约齐套 |
| **协作包** | 如前端 rule 17（模板 0.4.0+）/ `*-web` 分册；非契约 morph 域 |
| **行为包** | 非契约的行为约束规则（如 rule 21 日志 / 中文注释）；`domains.yaml` packs `kind: behavior`；不进 fill-score 权重；detect `S_SLF4J` 推荐 |
| **分册变体** | 模块 AGENTS 模板变体：`Q_MODULE_AGENTS=spring` → `AGENTS.module.spring.md.tmpl`（Maven 根执行 / 迁移纪律 / 分层）；render 参数 `module_agents_template` |
| **manual_sql** | db 迁移模式之一：无 Flyway 依赖、人工按序执行迁移脚本；`Q_DB_MIGRATION` 选定并写入 `docs/db/db.md` 声明；detect `S_NO_FLYWAY` / `S_SQL_DIR` 推荐 |
| **真相** | `modules/`、`table/`、`keys/`、`tasks/` 下具体文档（SSOT） |
| **索引** | `func.md` / `api.md` / `jobs.md` 等导航，不是 SSOT |
| **mcp_tracking** | `example_only`（L4 默认：真密不入库）\| `vendored_shared`（团队约定跟踪共享 mcp.json；audit 按 meta 判定；提问见 `Q_MCP_TRACKING`） |
| **配置 SSOT 管线** | L5：`docs/agent-config/` 为 rules/hooks/mcp/settings 单一真相源，`scripts/agent-config/sync.mjs` 生成各工具目录，`--check` 校验漂移；meta 记 `agent_config: true` |
| **hooks 家族** | L3 选装软门禁组（`Q_HOOKS_FAMILY`）：`commit-gate-extended`（契约漏同步/migration 环境/pitfalls lint 五合一）· `mysql-guard` · `after-edit` · `stop-checklist`；全部 fail-open；脚本统一 Cursor 协议，Claude 经 `claude-adapter.js` 翻译 |
| **pitfalls lint** | `scripts/agent-kb/lint-pitfalls.mjs`：台账 7 列 / ID 递增 / 状态分区 / 封闭域词表 / 速查一致性校验（0.5.0+，L2） |
| **write-meta-only** | audit 子动作：MATURE 无 meta 时仅写 `docs/harness-eng/harness-meta.yaml`（ladder / domains / ai_tools / mcp_tracking 快照），不渲染模板 |
| **分册** | 子模块 `AGENTS.md`（`solo` 仅根 / `few` 少册 / `all` 每模块） |
| **glob 档位** | `wide` 全仓宽扫 / `focused` 收窄到入口与确认模块（**大仓推荐 focused**） |
| **完整档** | fill-truths 唯一默认：按所选契约域**模板**写齐必填章（无精简档；jobs 为调度面章节） |
| **miss_histogram** | fill-score 域检查项 MISS 计数（如 `has-field-comment` / `missing-req-section`） |
| **shard** | inventory 切出的填充分片；一次确认可执行全部 shards |
| **fill-work** | `docs/api/.fill-work/` worker 片段目录；经 `fill-merge-api`（过 acceptance）合并进 SSOT |
| **acceptance-check** | 深真全语义闸（反例正则+必填章）；merge/close 前置 |
| **金标批次** | 同业务域 api+func+相关 db/redis 同批 + 强制 `sample_n` |
| **MCP 矩阵** | detect 产出的应有 `{engine}-{profile}` 集合（profile 以仓库自动发现为准） |
| **填充 MCP 闸** | 需 db·redis 实据时：矩阵达标 ∧（MCP 烟测 ∨ calibrate-live）；过闸后再 inventory/agents；未过则停留骨架 |
| **MCP 主环境** | `fill_mcp_profile`（默认 **test**）：烟测/calibrate/agents 实据优先 `{engine}-{profile}` |
| **MCP 先行** | 先 fill-mcp（或多环境矩阵）再填真相；过闸规格见 [fill-mcp.md](fill-mcp.md) |
| **live 校准** | MCP 未挂载时用 `fill-calibrate-live` 直连；可按引擎满足填充 MCP 闸 |
| **施工现场** | `docs/harness-eng/`：meta / MCP 说明 / 评分 / 报告 / 进度（契约与 agent-kb 之外） |
| **harness-report** | `docs/harness-eng/report-latest.html`（决策/诊断/任务/趋势台）；旧路径仅兼容 |
| **会话仪表盘** | 工程轮回复末尾的四台 markdown + mermaid（meta / 版本问答省略）；规格 [session-dashboard.md](session-dashboard.md)；脚本 `session-dash.mjs` |
| **score-latest** | `docs/harness-eng/score-latest.json`：最近一次 fill-score 快照 |
| **score-history** | `docs/harness-eng/score-history.jsonl`：历次 overall/coverage/ready 追加日志 |
| **progress.yaml** | `docs/harness-eng/progress.yaml`：填充进度状态（`--write-progress`） |
| **可编码建议** | 仪表盘「建议开干」**仅**绑 `ai_coding_ready`（非保证无错） |
| **报告字段** | `gap_to_ready` / `domain_stories` / `diff` / `suggest_upgrade` 等 → [fill-score.md](fill-score.md)「报告字段速查」 |
| **安全预填** | `Q_SEED`：用无密可推断信息填 Commands/技术栈；不确定仍 TODO |
| **确认闸门** | 写盘前必须用户明确确认；词表 SSOT：[write-plan.md](write-plan.md) |
| **预授权** | 首轮确认后，同会话后续 fill/resume 可自动写盘；词表与细则：[write-plan.md](write-plan.md) |
| **RecommendedProfile** | 探测后自动给出的推荐包；不懂选项时可「全部推荐」 |
| **WritePlan** | 写入前计划表 + 渲染预览；确认后才写盘 |
| **AI 工具面** | `Q_AI_TOOL`：Cursor / Claude / Codex / Qoder / Trae / WorkBuddy；可自定义入口。适配层非 SSOT，见 [ai-tools.md](ai-tools.md) |

## 确认闸门（对用户提示语）

词表与固定提示语见 [write-plan.md](write-plan.md)（SSOT）。此处不复述等价词。
