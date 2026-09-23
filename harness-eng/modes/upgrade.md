# upgrade（升阶）

## Done

1. 本轮 WritePlan 所列升阶缺口已 `create` / `skip` / `merge`（`on_exists=skip`）
2. `docs/harness-eng/harness-meta.yaml` 的 `ladder` 已升到目标阶，`last_mode=upgrade`，`skill_version` 与 manifest 一致（若仅有遗留 `.cursor/` meta：先迁到新路径再写）
3. 目标阶 [ladder.md](ladder.md) 必备项勾选通过；分级移交 TODO 已打印
4. **升版后必跑 acceptance 摘要**：`node scripts/acceptance-check.mjs --root <TARGET> [--gold]`（或 `fill-plan --residual [--gold]`）  
   - 打印 blockers / warnings 计数；**blockers>0 → 移交 TODO「acceptance 升严差分」**，勿假装开干仍 YES  
   - 建议紧接 `fill-score`；若升版前开干 YES、升版后 NO，在移交写明差分原因  
   - 仅 warnings 且批次已关：走 `fill-plan --residual` 清残项

当前阶梯已齐、只要再升阶时使用。默认 **完整阶 +1**；用户书面「升到 Ln」可一次覆盖中间阶缺口。

## 触发

- **升阶**（upgrade）
- meta 已齐当前阶，用户只要更高阶（未指定则 +1）
- 用户书面「升到 L3 / L4」且当前低于目标（可与 resume 二选一，见下表）

## 流水线

```
- [ ] 1 定根 + 读 harness-meta（先 `docs/harness-eng/harness-meta.yaml`，无则回退 `.cursor/`；当前 ladder / domains / skill_version）
- [ ] 2 定目标阶：默认 current+1；书面指定则用书面阶
- [ ] 3 对照 ladder.md + manifest，列出「当前阶已有 / 升阶缺口」
- [ ] 4 条件提问（升阶相关；可「全部推荐」）— 每批≤5；若仓已有 score-policy，确认 **`Q_GATE_PROFILE`**（推荐 strict；要兼容则 legacy）
- [ ] 5 WritePlan：仅缺口路径；注明跳阶依据（默认 +1 或用户书面）；含 score-policy `gate_profile` / `coverage_mode` 若需升档
- [ ] 6 确认闸门后 `scripts/harness.mjs --mode upgrade`（`land.mjs` 薄别名；非 L5 委托 render；L5 走 sync）：params.on_exists=skip
- [ ] 7 自检 + 更新 meta.ladder / last_mode=upgrade / skill_version + 移交 TODO
- [ ] 8 **acceptance 摘要**（`--root` + 可选 `--gold`）；blockers>0 写入移交；warnings → `fill-plan --residual`
```

### 0.3.0 开干档迁移（upgrade / resume）

若目标仓已有 `docs/harness-eng/score-policy.yaml` 且未写 `gate_profile`，**运行时已按 strict**。升阶时应：

1. 提问 `Q_GATE_PROFILE`（【推荐】**strict**）
2. WritePlan 写明将写入的 `gate_profile` / `coverage_mode=all_domains`（大仓）
3. 用户要兼容旧开干结论时写 `gate_profile: legacy`

细节：闸门 [write-plan.md](write-plan.md)；探测 [detect.md](detect.md)；阶梯 [ladder.md](ladder.md)。

## 与 land / resume 边界

| 场景 | 用 |
|---|---|
| 无任何 harness 指纹 | `land` |
| 有部分文件或 meta 未满**当前目标**阶 | `resume` |
| meta 已齐当前完整阶，只要再 +1 或书面到 Ln | `upgrade` |
| 只想看报告 | `audit` |

用户书面「升到 L4」且当前 L2：`resume` / `upgrade` 均可；WritePlan 须含 L3+L4 缺口，并写明跳阶依据为用户书面要求。

## render 参数

与 resume 相同骨架：`on_exists=skip`，`expandFromManifest: true`，`ladder` = 目标阶。示例见 [resume.md](resume.md)。
**例外**：L5 `agent-config-sync`（`scripts/agent-config/sync.mjs`）即使 `on_exists=skip` 也从 skill tmpl **replace**，避免消费仓脚本静默过期。升级 L5 后须刷新 `sync.mjs`，再 `node scripts/agent-config/sync.mjs`。对照：`node scripts/harness.mjs --check-freshness --root <TARGET>`。

## 0.6.9 → 0.7.0 迁移要点

1. **meta**：`skill_version` → `0.7.0`
2. **score-policy（字段级，不整文件覆盖）**：`morph_floor: 60`→`75`；若 `gate_profile=gold` 且 `morph_floor: 90`→`95`。由 `harness.mjs` resume/upgrade/land 或 `fill-score --migrate-policy` 执行
3. **形态尺度**：overall 与 0.6.x **不可比**；报告 `report_schema=0.3.0` + `morph_scale=0.7`。history 不换算
4. **开干**：strict 形态地板 75、semantic 收紧；gold 双 95。`ready.ok` 对外废弃
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.7.0`）
6. **装/升 URL** 仍用 **`main`**

## 0.6.8-dev → 0.6.9 迁移要点

1. **meta**：`skill_version` → `0.6.9`
2. **Codex（若 `ai_tools` 含 codex）**：确认 `.codex/config.toml.example`、`.codex/rules/`、hooks+adapter、`Stop`；人验 [CODEX-MANUAL.md](../host/CODEX-MANUAL.md)
3. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.6.9`）；skills 全量到 `.agents/skills/`
4. **装/升 URL** 仍用 **`main`**

## 0.6.7 → 0.6.8-dev 迁移要点

1. **meta**：`skill_version` → `0.6.8-dev`（resume / upgrade 写 meta 时对齐 manifest）
2. **Codex（若 `ai_tools` 含 codex）**：确认 `.codex/config.toml.example` 与 hooks matcher `^Bash$`；人验 [CODEX-P0-MANUAL.md](../host/CODEX-P0-MANUAL.md)（trust · `/hooks` · `/mcp`）
3. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.6.8-dev`）；Codex P0 轻指针（0.6.9 起改为全量 skills）
4. 生产装/升仍用 **`main`**；本号为开发分支增量

## 0.6.6 → 0.6.7 迁移要点

1. **meta**：`skill_version` → `0.6.7`（resume / upgrade 写 meta 时对齐 manifest）
2. **Pn 回流**：新 land 根 AGENTS 含「踩坑回流」；pitfalls 路径速查骨架加厚。**已有 `pitfalls.md` / AGENTS `on_exists=skip` 不覆盖**；可人工合并速查骨架与 Never do↔Pn 纪律
3. **前后端契约门禁**：api 域 `hook_code` 对 nested `packages/api-client|types|queries` 改 regex；`S_FRONTEND`+api 时【推荐】刷新 `GLOB_API`（追加前端契约包）并重渲 rule 12 / soft-gate
4. **升级三步**（生产 / L5 消费仓必做）  
   1) 从 **`main`** 装或更新 skill（勿用 `V0.6.X` 装生产）  
   2) `node scripts/harness.mjs --check-freshness --root <TARGET>`  
   3) 若落后：land/upgrade 重渲 `agent-config-sync` → `node scripts/agent-config/sync.mjs` → 再跑 freshness
5. **0.6.6 OpenAPI / 分册厚**：无强制回退

## 0.6.5 → 0.6.6 迁移要点

1. **meta**：`skill_version` → `0.6.6`（resume / upgrade 写 meta 时对齐 manifest）
2. **OpenAPI / Apifox 可选桥**：`Q_APIFOX=yes` 时 land/upgrade 写入 `scripts/apifox/` + `docs/api/generated/`；契约 SSOT 仍为 `docs/api/modules`。消费仓须自设 `APIFOX_PROJECT_ID`（见 `.apifox.env.example`）
3. **分册 AGENTS 厚 SSOT**：新 land 使用加厚的 module / spring / **frontend** 模板；根 AGENTS 含「分册真相」声明。**已有分册 `on_exists=skip` 不覆盖用户正文**；仅新 land 或用户点名 replace 才换厚模板
4. **升级三步**（生产 / L5 消费仓必做）  
   1) 从 **`main`** 装或更新 skill（勿用 `V0.6.X` 装生产）  
   2) `node scripts/harness.mjs --check-freshness --root <TARGET>`  
   3) 若落后：land/upgrade 重渲 `agent-config-sync` → `node scripts/agent-config/sync.mjs` → 再跑 freshness
5. **CodeBuddy / Trae / 0.6.5 API 7 列**：无强制回退；沿用既有钉号

## 0.6.4 → 0.6.5 迁移要点

1. **meta**：`skill_version` → `0.6.5`（resume / upgrade 写 meta 时对齐 manifest）
2. **API 契约**：新建/大改接口字段表改用 7 列（说明 / 枚举 / 备注 / 示例值分列）；旧 5 列仍可过 acceptance，但金标会拦空说明/套话。精填走 agents；`fill-auto-api` 仅为 heuristic 骨架
3. **升级三步**（生产 / L5 消费仓必做）  
   1) 从 **`main`** 装或更新 skill（勿用 `V0.6.X` 装生产）  
   2) `node scripts/harness.mjs --check-freshness --root <TARGET>`  
   3) 若落后：land/upgrade 重渲 `agent-config-sync` → `node scripts/agent-config/sync.mjs` → 再跑 freshness（本版 sync `--check` 已 EOL-agnostic，减少假漂移）
4. **CodeBuddy / Trae**：无强制迁移；沿用 0.6.4 / 0.6.1 钉号

## 0.6.3 → 0.6.4 迁移要点

1. **meta**：`skill_version` → `0.6.4`（resume / upgrade 写 meta 时对齐 manifest）
2. **CodeBuddy rules**：由 `.codebuddy/rules/<name>/RULE.mdc` 改为扁平 `.codebuddy/rules/<stem>.md`，**保留** alwaysApply / globs / description frontmatter（与 Trae 同策略）。升级后须刷新 `sync.mjs` 再跑 sync；旧 RULE.mdc 目录会被托管前缀 prune
3. **hooks**：改 `.codebuddy/settings.json` 后须在 IDE **`/hooks` 面板**确认应用（仅保存文件 ≠ 热生效）；matcher 仍为 Claude 系 **Bash**；命令可用 `$CODEBUDDY_PROJECT_DIR`
4. **MCP / permissions**：根 `.mcp.json`；首次连接需审批；优先级 local > project > user；密钥用 `${VAR}`。settings 优先级：CLI > `settings.local.json` > `settings.json` > `~/.codebuddy/settings.json`。**不**生成 `settings.local.json`；`.codebuddy/agents/` 非目标
5. **升级三步**（生产 / L5 消费仓必做）  
   1) 从 **`main`** 装或更新 skill（勿用 `V0.6.X` 装生产）  
   2) `node scripts/harness.mjs --check-freshness --root <TARGET>`  
   3) 若落后：land/upgrade 重渲 `agent-config-sync` → `node scripts/agent-config/sync.mjs` → 再跑 freshness  
6. **文档**：[CODEBUDDY-PARITY.md](../host/CODEBUDDY-PARITY.md) · [CODEBUDDY-P0-MANUAL.md](../host/CODEBUDDY-P0-MANUAL.md)

## 0.6.2 → 0.6.3 迁移要点

1. **meta**：`skill_version` → `0.6.3`（resume / upgrade 写 meta 时对齐 manifest）
2. **升级三步**（生产 / L5 消费仓必做）  
   1) 从 **`main`** 装或更新 skill（勿用 `V0.6.X` 装生产）  
   2) `node scripts/harness.mjs --check-freshness --root <TARGET>`  
   3) 若落后：land/upgrade 重渲 `agent-config-sync` → `node scripts/agent-config/sync.mjs` → 再跑 freshness  
3. **报告壳**：页脚与文档只认 `skill_version` + `report_schema`（`ui.version` 兼容别名，勿当 skill）
4. **Trae**：升 skill 后仍须刷新实例化 `sync.mjs`（见 [TRAE-P0-MANUAL.md](../host/TRAE-P0-MANUAL.md) §0）


## 0.6.1 → 0.6.2 迁移要点

1. **meta**：`skill_version` → `0.6.2`（resume / upgrade 写 meta 时对齐 manifest）
2. **会话仪表盘**：工程轮 footer 去掉 mermaid `quadrantChart`（Trae 等宿主 Syntax Error）；有 score 时改一行纯文本施工态势。规格 [session-dashboard.md](session-dashboard.md)
3. **0.6.1 Trae 高钉号不回退**

## 0.6.1-dev → 0.6.1 迁移要点

1. **meta**：`skill_version` → `0.6.1`（resume / upgrade 写 meta 时对齐 manifest）
2. **Trae 高**：官方实证 [TRAE-P0-EVIDENCE.md](../host/TRAE-P0-EVIDENCE.md)；镜像保留 `.trae/rules` frontmatter。矩阵 Trae **高**（MCP 走 `.trae/mcp.json` + Settings 开关）
3. **0.6.0 列车不重开**；人验 hooks/MCP 见 [TRAE-P0-MANUAL.md](../host/TRAE-P0-MANUAL.md)

## 0.6.0 → 0.6.1-dev 迁移要点

1. **meta**：`skill_version` → `0.6.1`（本版已钉号；中间号曾是 `0.6.1-dev`）
2. **Trae P0**：官方实证 [TRAE-P0-EVIDENCE.md](../host/TRAE-P0-EVIDENCE.md)；镜像保留 `.trae/rules` frontmatter。矩阵 Trae **高**
3. **0.6.0 列车不重开**；人验 hooks/MCP 见 [TRAE-P0-MANUAL.md](../host/TRAE-P0-MANUAL.md)

## 0.5.10 → 0.6.0 迁移要点

1. **meta**：`skill_version` → `0.6.0`（resume / upgrade 写 meta 时对齐 manifest）
2. **写盘入口**：Agent 优先 `scripts/harness.mjs`（`--mode land|resume|upgrade|pipeline-skeleton`）；`land.mjs` 为薄别名。勿把 `render.mjs` 当主路径
3. **文档搬家**：规格在 `modes/` · `fill/` · `host/`；热路径旧根路径留薄 stub（`write-plan` / `detect` / `fill` / `pipeline`）
4. **Codex**：0.6.x **冻结 P2**，全量对等另立项（见 [ROADMAP-0.6.0.md](../ROADMAP-0.6.0.md)）
5. **pipeline**：骨架战役用 `--mode pipeline-skeleton`（不跑 fill-*）
6. **填充 CLI**：只认 `fill-inventory.mjs --domain` / `fill-merge.mjs --domain`（api `--enrich-dto` 挂统一入口）；域脚本为弃用 shim
7. **发包**：默认安装 **不含** `archive/selfcheck/legacy` 体积（热树只留 INDEX）；开发全仓可读 `_history/harness-eng-selfcheck-legacy/` 或 git 历史。`fill-truths-auto` 仍见 `archive/fill-truths-auto/`（仅脚本、对话不推荐）

## 0.5.9 → 0.5.10 迁移要点

1. **meta**：`skill_version` → `0.5.10`（resume / upgrade 写 meta 时对齐 manifest）
2. **Codex**：矩阵 **高**（推荐纪律 B；仅 `.codex/` 探测或显式勾选进「全部推荐」）
3. **皆无探测**：`ai_tools` 为空，追问一次；不默认 Cursor、不因此只写 `.cursor/` 适配
4. **报告叙事**：人读/页脚只认 `skill_version` + `report_schema`（`ui.version` = 兼容别名，勿当 skill）
5. **legacy**：`fill-truths-auto` 见 `archive/fill-truths-auto/`（仅脚本、对话不推荐）

## 0.5.8 → 0.5.9 迁移要点

1. **meta**：`skill_version` → `0.5.9`（resume / upgrade 写 meta 时对齐 manifest）
2. **写盘入口**：Agent 优先 `scripts/land.mjs`；L5/`agent_config` **拒绝**直渲 `.cursor/rules` 等生成宿主路径，改走 `sync.mjs`
3. **填充 CLI**：inventory / merge 优先 `fill-inventory.mjs --domain` / `fill-merge.mjs --domain`（域脚本是别名）
4. **热路径**：先读 [AGENT-INDEX.md](../AGENT-INDEX.md) 与 [fill/README.md](../fill/README.md)

## 0.5.7 → 0.5.8 迁移要点

1. **meta**：`skill_version` → `0.5.8`（resume / upgrade 写 meta 时对齐 manifest）
2. **detect**：`S_RULES` / `S_HOOKS` / `MATURE` 按多宿主计（非仅 Cursor）；仅 Claude/Qoder/Trae/CodeBuddy 仓可判 MATURE
3. **selfcheck**：热路径改为 `scripts/selfcheck.mjs`（旧名 `selfcheck-0.5.2.mjs` 已弃用）
4. **Codex + L5**：须明示 **高（纪律 B）**；sync 发出原生 rules/hooks/MCP/skills（不做 `.mdc` 镜像）

## 0.5.6 → 0.5.7 迁移要点

1. **meta**：`skill_version` → `0.5.7`（resume / upgrade 写 meta 时对齐 manifest）
2. **契约 sync 指针**：L3+ / L5 全量镜像宿主不再强制写 `1x-contract-sync`；已有文件 resume `skip`、不自动删。Codex 仍写 `.codex/contract-sync.md`
3. **文档**：对齐矩阵（Cursor/Claude/Qoder/Trae/WorkBuddy/Codex 均为 **高**；Codex 纪律 B）；模板不再把 `.cursor/rules/11|12|13|16` 当作全宿主唯一权威

## 0.5.5 → 0.5.6 迁移要点

1. **meta**：`skill_version` → `0.5.6`；写入改到 `docs/harness-eng/harness-meta.yaml`。若仅有遗留 `.cursor/harness-meta.yaml`（或 `.yml`），resume / upgrade **迁到新路径**（键级合并），旧文件不自动删（遗留只读）
2. **mcp-usage-guide**：新默认 `docs/harness-eng/mcp-usage-guide.md`；读侧仍认 `.cursor/mcp-usage-guide.md` / 旧中文名
3. **行为**：`.cursor/mcp.json` 等工具运行时路径不变；L0 自检不再要求 meta **只能**在 `.cursor/`

## 0.5.4 → 0.5.5 迁移要点

1. **meta**：`skill_version` → `0.5.5`（resume / upgrade 写 meta 时对齐 manifest）
2. **文档**：安装路径改为「当前 Agent 宿主的用户 skills 目录」；Cursor / Claude 等只作示例。脚手架与目标仓 `.cursor/` 产物路径不变
3. **行为**：无施工协议变更

## 0.5.3 → 0.5.4 迁移要点

1. **meta**：`skill_version` → `0.5.4`（resume / upgrade 写 meta 时对齐 manifest）
2. **行为**：会话仪表盘仅**本轮里程碑**（实质产出 / 闸门决策 / 显式读数）附末尾；提问批次 / 定根前 / 等确认空轮 / 纯 meta / 版本 / 手册 / 跑题省略整块（见 [session-dashboard.md](session-dashboard.md)）
3. **可选**：`node scripts/session-dash.mjs --root <TARGET> --intent engineering` 核对读数与 `report-latest.html` 一致

## 0.5.2 → 0.5.3 迁移要点

1. **meta**：`skill_version` → `0.5.3`（resume / upgrade 写 meta 时对齐 manifest）
2. **行为**：引入会话仪表盘（四台 +「详情请查询仪表盘」链）；0.5.4 起改为仅工程轮 SHOW
3. **可选**：`node scripts/session-dash.mjs --root <TARGET>` 核对读数与 `report-latest.html` 一致

## 0.5.1 → 0.5.2 迁移要点

1. **meta**：`skill_version` → `0.5.2`
2. **fill-mcp**：按 `ai_tools` 写入 `.cursor/mcp.json` 与/或根 `.mcp.json` 与/或 `.trae/mcp.json`（内容一致）
3. **CodeBuddy**：resume 后应有全家桶 hooks（非仅基础 gate）；确认根 `.mcp.json.example`
4. **Claude**：出现 `.claude/rules/*.md` 全量镜像属预期

## 0.5.0 → 0.5.1 迁移要点

1. **meta**：`skill_version` → `0.5.1`（再升 0.5.2 见上）
2. **Qoder**：若曾有 Cursor 式 `.qoder/hooks.json`，改由 `.qoder/settings.json` hooks 接管；L5 仓跑 `sync.mjs` 后可删过期 `hooks.json`（sync 会清 stale）
3. **MCP**：Qoder 真密/example 改用根 `.mcp.json`（勿再依赖 `.qoder/mcp.json`）
4. **Trae**：确认 `Q_AI_TOOL` 含 trae 后 resume/upgrade 补 hooks + mcp example
5. **rules**：非 L5 仓 resume 会镜像全量 `.md` 到 `.qoder/rules` / `.trae/rules`

## 0.4.0 → 0.5.0 迁移要点

1. **meta**：`skill_version` → `0.5.0`（再升 0.5.1 见上）；启用 L5 的仓补 `agent_config: true`（yaml-keys merge 受管键）。
2. **L2 pitfalls 工程化**：`pitfalls.md` 模板升 7 列（+状态 / +触发路径 / +路径速查 / +已根治留档区）；老仓升级时把旧 5 列行人工补列；新增 `scripts/agent-kb/lint-pitfalls.mjs`，改台账后必跑。
3. **hooks 家族**：`Q_HOOKS_FAMILY` 选装；选 `commit-gate-extended` 后基础门禁不再重复渲染（互斥）。契约提醒路径由 `domains.yaml` 各域 `hook:` 段驱动，按本仓栈调整 `hook_code` globs。
4. **MATURE 仓 adopt L5（配置 SSOT 管线）**：
   - 反向拷贝：`.cursor/rules/*.mdc` → `docs/agent-config/rules/`；现有 hooks 脚本 → `docs/agent-config/hooks/` 并登记 `hooks.config.json`；`.cursor/mcp.json`（若 vendored_shared）→ `docs/agent-config/mcp/servers.json`
   - render L5 包（`on_exists=skip` 不覆盖已有 SSOT）
   - `node scripts/agent-config/sync.mjs` → 立即 `--check` 应无漂移；有漂移说明反向拷贝漏了内容
   - 此后手改只发生在 `docs/agent-config/`；CI 加 `sync.mjs --check`
   - 校验：生成物带 GENERATED 标记；`git status` 无意外删除（stale 清理会先列在 sync 输出）

## 正目标

- 只装升阶缺口；已有同名章节正文保留（merge 只追加缺节）
- `.cursor/mcp.json`：非 fill-mcp 保留原文件
- 写盘：过 [write-plan.md](write-plan.md) 闸门（或已预授权）