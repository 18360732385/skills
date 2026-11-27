# upgrade（升阶）

## 旗标消歧（勿混用）

| 旗标 / CLI | 作用对象 | 说明 |
|---|---|---|
| `--migrate-docs[=auto\|dry-run\|off]` | 真相文档 `docs/{api,func,db,redis,jobs}` | 薄仓默认 **auto**；**厚仓 / MATURE 默认 dry-run**（0.7.48）；写真相须显式 `--migrate-docs=auto`；`--no-migrate-docs` 仅 `doc_todos` 移交 |
| `fill-score --migrate-policy` | `score-policy.yaml` 字段（如 `morph_floor`） | **≠** `--migrate-docs`；不写真相文档 |
| `--check-meta-stable [--baseline]` | `harness-meta.yaml` | CI 稳态；默认忽略 `last_mode`（跨 mode **accepted residual**） |
| `--migrate-coverage[=off\|append\|dry-run]` | 覆盖类 blocker（`coverage_ready` / `covered_gt`） | **默认 off**；`append` 只补缺页/缺节；`covered_gt` 仍移交、不删文档；**≠** `--migrate-docs` |

## Done

1. 本轮 WritePlan 所列升阶缺口已 `create` / `skip` / `merge`（`on_exists=skip`）
2. `docs/harness-eng/harness-meta.yaml` 的 `ladder` 已升到目标阶，`last_mode=upgrade`，`skill_version` 与 manifest 一致（若仅有遗留 `.cursor/` meta：先迁到新路径再写）
3. 目标阶 [ladder.md](ladder.md) 必备项勾选通过；分级移交 TODO 已打印
4. **升版后必跑升严差分 + acceptance 摘要**  
   - `harness --mode upgrade` 成功收尾写 `docs/harness-eng/upgrade-diff.json`（stderr 摘要）；对照升前 `score-latest.json` 的 blockers  
   - **migrate-docs**：薄仓默认 auto；厚仓默认 **dry-run**（仍出 `migrate-docs-report.json`）；显式 `--migrate-docs=auto` 才写真相；`--no-migrate-docs` 仅 `doc_todos` 移交  

   - `coverage` / `covered_gt` **默认不自动改文档**（`--migrate-coverage` 默认 **off**）。可选 `append` 只补缺页/缺节；`covered_gt` 仍移交、**不删**用户文档。残留 TODO 见 stderr  
   - 仍建议：`node scripts/acceptance-check.mjs --root <TARGET> [--gold]`（或 `fill-plan --residual [--gold]`）  
   - 仅 warnings 且批次已关：走 `fill-plan --residual` 清残项
   - 旧仓若仍有 `fill-score-ready.mjs` / `cold-bootstrap*.mjs`：upgrade/refresh stderr 会打 **【旧仓升级】** warn（必看，含可复制退役命令）；`--retire-wrappers` 或 `HARNESS_RETIRE_WRAPPERS=1` 移到 `scripts/agent-kb/_obsolete/`。**`refresh-score.mjs` 是标准入口，勿删**
   - CI 跨 mode meta：`harness --check-meta-stable --root <TARGET> [--baseline <meta.yaml>]`（默认忽略 `last_mode`；**accepted residual**）

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
- [ ] 6 确认闸门后 `scripts/harness.mjs --mode upgrade`（非 L5 委托 render；L5 走 sync）：params.on_exists=skip
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

## 0.8.0 → 0.8.1 迁移要点

1. **meta**：`skill_version` → `0.8.1`（`repo_kind` 沿用；纯前端仓 `client-api` 真相用**字段级态**、fullstack 用**回链态**，模板见 `docs/client-api/templates/`）
2. **三域满配**：`pages` / `components` / `client-api` 从索引壳升为计分域——inventory：`fill-inventory.mjs --domain pages|components|client-api`；morph 必填章入 `morph-required.yaml`
3. **0.8.0 已 land 的前端仓补启三域**：`meta.domains` 追加三域 → `harness --mode upgrade` 补渲 L1 域包（索引/README/rule 104–106 已在则 `on_exists=skip`）→ 跑三域 inventory
4. **推荐包**：`frontend` 仓默认域 = 五域全开（design,prototype,pages,components,client-api）；`fullstack` = 后端域 ∪ 五域
5. **rule 104/105/106**：正文「0.8.0 索引壳」字样已升「0.8.1 起计分」；upgrade 后**replace** 刷新（规则正文非 AGENTS，无用户正文风险）
6. **L5**：`check-freshness` → 刷新域包规则与 `sync.mjs`（tmpl id `0.8.1`）后再 sync

## 0.8.11 → 0.8.12 迁移要点

1. **meta**：`skill_version` → `0.8.12`
2. **报告壳**：`report_schema` 仍 **0.4.3**；诊断台「各项指标」默认展开（按钮切诊断摘要），备注改图标悬停——重新 `fill-report-html` 即可
3. **gitignore**：snippet 不再追加 `docs/harness-eng/report-latest.html`、`run-latest.json`、`score-history.jsonl`。这三份施工产物默认可入库。目标仓 `.gitignore` 里若已有这三行（及注释 `# harness report churn…`），升级时删掉，否则文件仍被忽略。render 只追加缺失行，不会自动删旧行
4. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.12`）后再 sync

## 0.8.10 → 0.8.11 迁移要点

1. **meta**：`skill_version` → `0.8.11`，并写入 `skill_rev`（与 manifest `rev` 一致；缺省按 0）
2. **报告壳**：`report_schema` 仍 **0.4.3**
3. **写盘**：`harness.mjs` / `render.mjs` 真写需要 `--confirm 确认写入`（或等价闸门词）。`--dry-run`、backfill、只读检查不需要。脚本失败后不要手工 Write
4. **预授权**：`--confirm 确认预授权` 写入 `docs/harness-eng/write-auth.yaml`。之后的写盘可省略 `--confirm`。`取消预授权` 把 `preauth` 写成 false。`Q_PREAUTH` 不再默认 true
5. **L5**：`check-freshness` 同时对照 `HARNESS_SYNC_TMPL_ID` 与 `HARNESS_ENG_REV`。刷新 `sync.mjs`（tmpl id `0.8.11`）后再 sync
6. **安装副本**：同 version 但 `rev` 不同也会在 upgrade 开头告警

## 0.8.9 → 0.8.10 迁移要点

1. **meta**：`skill_version` → `0.8.10`（`harness-meta` 仍只记 version，不记 `rev`）
2. **报告壳**：`report_schema` 仍 **0.4.3**
3. **确认闸门**：写盘词以 `确认写入` / `按计划执行` / `执行 WritePlan` / `LGTM` 为准。裸「确认」只在紧接 WritePlan 的下一轮、且没有其他待答问题时才算。`确认预授权` 只授权同会话后续轮次，本轮仍要 `确认写入`
4. **目标仓行为**：计分、覆盖、gold 门槛与 0.8.9 相同。本版改的是技能包自身的词表、文档钉、发包检查和 CLI 入口
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.10`）后再 sync

## 0.8.8 → 0.8.9 迁移要点

1. **meta**：`skill_version` → `0.8.9`
2. **报告壳**：`report_schema` 仍 **0.4.3**（形态到顶但金标未过时写「未过线」，不再把「已达理论上限」叫拖后腿）
3. **身份**：func 引用槽认出 `ServiceImpl` / `ComponentImpl` / `ManagerImpl` / `HandlerImpl`。变更记录只剥离 `##` 级标题，`### 变更记录` 留在正文
4. **覆盖补页**：路径、类名、Redis 模式按边界判断是否已写入，短前缀不再算已覆盖。`CREATE TABLE IF NOT EXISTS` 后面没有表名时不再得到表名 `IF`
5. **migrate-docs 报告**：本轮没有升严 blocker 时，若已有 `ops`，只刷新时间戳并保留原计划；没有旧计划才写空心跳
6. **refresh**：打分成功后重建 `docs/harness-eng/report-latest.html`。失败只提示，不改变 refresh 退出码
7. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.9`）后再 sync

## 0.8.7 → 0.8.8 迁移要点

1. **meta**：`skill_version` → `0.8.8`
2. **报告壳**：`report_schema` → **0.4.3**（诊断台并列覆盖率、金标指数、真实性；0.4 族趋势仍可比）
3. **gold 开干**：启用域覆盖率须逐个 100%（判定时强制，不改写 `score-policy.yaml`），全仓与分域金标指数 ≥ 98%，`--gold --ssot-only` 身份双向一致，`coverage-audit` 全部未过期 `pass`。strict / mature_compat 门槛不变
4. **批次**：进入 `in_progress` 时冻结 `unit_ids`。gold 关批只核本批正式真相和核对记录，不再用 `.fill-work` 代替关批
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.8`）后再 sync

## 0.8.6 → 0.8.7 迁移要点

1. **meta**：`skill_version` → `0.8.7`
2. **报告壳**：`report_schema` 仍 **0.4.2**（本版不升壳；满分不再写拖后腿；client-api 行写明排除的 `type_export`；总评说明覆盖等于点名、不核字段）
3. **dry-run**：不再把 `mysql_guard_servers` 回写进 `harness-meta.yaml`。文本相同的真写也不改 mtime
4. **安装副本**：upgrade 开头若 `~/.cursor/skills/harness-eng` 与正在执行的技能版本不同，stderr 警告一行。以正在执行的那份为准
5. **升严差分**：`upgrade-diff.json` 增加 `coverage_before` / `coverage_after` / `coverage_note_zh`。磁盘 `score-latest.json` 仍是升版前分数，对照口径看 `coverage_after`，refresh 之后再比磁盘文件
6. **migrate-docs 报告**：本轮没有升严 blocker 时只刷新 `migrate-docs-report.json` 的时间戳（`ops: []`，未规划补丁），不扫库表漂移
7. **hook 预览**：dry-run 内容与磁盘相同的 fix-hook 记 `unchanged`，不再预告 `replace`
8. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.7`）后再 sync

## 0.8.5 → 0.8.6 迁移要点

1. **meta**：`skill_version` → `0.8.6`
2. **报告壳**：`report_schema` 仍 **0.4.2**（本版不升壳；分域透出 `mapped` / `unmapped`）
3. **前端覆盖口径变更（破坏性）**：`coverage_by_domain` 前端域 `ratio` = 被真相点名的资产 / 资产（路径、路由、url 或依赖名；变更记录节不算）。篇数凑齐但没点名资产时金标 1.0 会掉下来
4. **重跑 inventory + 打分**：`fill-inventory`（design 不再把 `docs/design/` 与脚手架算进分母；pages 同一页面源文件不再既出 route 又出 page_file）→ `fill-score` → `fill-report-html`
5. **倒排脚本**：`reverse-changelog-tables` 改为 optional，**0.8.6 起默认不进写集**。目标仓里已经有的 `scripts/reverse_changelog_tables.py` 保持不动。需要倒排旧表时把该 id 放进 `include_optional`，或对已有脚本跑 `--dry-run` 再 apply
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.6`）后再 sync

## 0.8.4 → 0.8.5 迁移要点

1. **meta**：`skill_version` → `0.8.5`
2. **报告壳**：`report_schema` 仍 **0.4.2**（本版不升壳）
3. **前端覆盖口径变更（破坏性）**：`coverage_by_domain` 前端域 `ratio` = `truths/assets`（不再「一篇过域」）；gold `coverage_targets`=1.0 时须按资产补齐真相，否则 `coverage_ready`/`ai_coding_ready` 不过
4. **重跑 inventory + 打分**：尤其 `fill-inventory --domain prototype`（SSOT 下 md 不再进分母）→ `fill-score` → `fill-report-html`
5. **score-policy**：若 Windows CRLF 曾被 gold apply 腐蚀，upgrade/resume 会 normalize 为 LF；已是 gold 且 targets 齐全时不再空写
6. **索引骨架**：新渲 prototype/design 索引不再自带 `TODO(harness-eng)`；存量索引请手改占位或精填
7. **rule 17**：退役警告现含宿主 `.md` 镜像；经确认后 `git mv` 归档（不自动删）
8. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.5`）后再 sync

## 0.8.3 → 0.8.4 迁移要点

1. **meta**：`skill_version` → `0.8.4`
2. **报告壳**：`report_schema` 仍 **0.4.2**（本版不升壳；分域透出 `asset_ratio`，总评提示偏低）
3. **重渲 101**：默认 `GLOB_FRONTEND` 已收窄（禁裸 `**/src/**`）；若仓内仍有 rule 17，upgrade/render 会**继承其 globs**；建议确认后再退役 17（警告现含宿主 + SSOT 多行 `git mv`）
4. **重跑打分/报告**：`node scripts/fill-score.mjs --root <TARGET> --json --output docs/harness-eng/score-latest.json` → `node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json`（对比句优先门禁覆盖差）
5. **归档 CLI**：`archive-docs.mjs` 现保留嵌套路径，支持 `--dry-run`，拒绝 `tokens.css` 等运行时文件
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.4`）后再 sync
7. **勿盲跑**：厚仓 `migrate-docs` 默认仍 dry-run；dry-run / ops=0 也会刷新 `migrate-docs-report.json`

## 0.8.2 → 0.8.3 迁移要点

1. **meta**：`skill_version` → `0.8.3`
2. **报告壳**：`report_schema` 仍 **0.4.2**（本版不升壳；顶栏 coverage 改读门禁口径字段，旧 JSON 回退）
3. **重跑打分/报告**（拿门禁口径覆盖率）：`node scripts/fill-score.mjs --root <TARGET> --json --output docs/harness-eng/score-latest.json` → `node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json`
4. **upgrade 收尾**：若 `.cursor/rules/17-frontend-web.mdc` 与 `101-frontend-web.mdc` 并存，会警告 + 给出退役命令（**不自动删**；经确认后 `git mv` 到 `docs/harness-eng/archive/`）
5. **可选**：非运行设计/原型归档用新 CLI `node scripts/archive-docs.mjs --root <TARGET> --archive <relPath> [--domain design|prototype]`（可 `--restore`）；变更记录占位残留由 refresh 非阻断提示
6. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.3`）后再 sync
7. **勿盲跑**：`migrate-docs=auto` 虽已幂等治理，厚仓默认仍 dry-run；解禁前先看 `docs/harness-eng/migrate-docs-report.json`

## 0.8.1 → 0.8.2 迁移要点

1. **meta**：`skill_version` → `0.8.2`
2. **报告壳**：`report_schema` **0.4.2**（术语人话化 + 决策台总评模块；0.4.x 族内，趋势仍可比）
3. **重渲报告**：`node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json`
4. **读法变化**：首屏改为**总评横幅**（Verdict 徽章 + 总评分 0–100 + 等级 + 一句话结论 + 分项；**仅参考 ≠开干**；替代原施工阶梯位）；**施工阶梯移入决策台**与「开干清单」同组；趋势台「仪表参考分」块移除；KPI 灯组并入清单；10 秒结论区精简；「宿主台」更名「落地检查台」（旧名在名词解释留档）
5. **L5**：`check-freshness` → 刷新 `sync.mjs`（tmpl id `0.8.2`）后再 sync

## 0.7.63 → 0.8.0 迁移要点

1. **meta**：`skill_version` → `0.8.0`；回填 `repo_kind`（frontend|backend|fullstack）与 `monorepo`（判定：README/AGENTS + 代码成分启发式；**不确定时提问 `Q_REPO_KIND`**，勿沉默默认）
2. **仓型分流**：`repo_kind=frontend` 时默认契约域改前端五域（`design,prototype` 计分 + `pages,components,client-api` 索引壳）；`fullstack` = 后端域 ∪ 前端域；`backend` 维持 0.7.x 推荐
3. **前端域包**：L1 随域下发 `docs/{design,prototype}/` 索引 + `102-design-system` / `103-prototype`（及 `104-components` / `105-pages` / `106-client-api` 索引壳规则）；inventory 走 `fill-inventory.mjs --domain design|prototype`
4. **rules 101 族**：`17-frontend-web(.full)` → `101-frontend-web(.full)`（同 target 改名；upgrade 生成 101 后**退役旧 17 文件**，防双规则并存）；分册 AGENTS / L5 skill `frontend-web` 指针同步 101
5. **归档纪律**：非运行文件（`DESIGN*.md`、原型 HTML 等）经确认**归档到仓根 `docs/<domain>/`**；运行代码（`tokens.css` 等）**留原地**，仅索引 + 回链
6. **评分**：`frontend_coverage` 不再恒 `not_measured`——`design`/`prototype` 入 `coverage_by_domain`；缺启用域与缺 `api` 同级 blocker；`ready_coverage` 仍 0.8
7. **L5**：`check-freshness` → 刷新 SSOT 规则/域包与 `sync.mjs`（tmpl id `0.8.0`）后再 sync

## 更早迁移（0.7.x）

0.7.28–0.7.62 的迁移要点已归档：[archive/upgrade-history-through-0.7.62.md](../archive/upgrade-history-through-0.7.62.md)。升级按当前版本段执行；历史仅供追溯。
