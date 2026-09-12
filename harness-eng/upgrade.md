# upgrade（升阶）

## Done

1. 本轮 WritePlan 所列升阶缺口已 `create` / `skip` / `merge`（`on_exists=skip`）
2. `docs/harness-eng/harness-meta.yaml` 的 `ladder` 已升到目标阶，`last_mode=upgrade`，`skill_version` 与 manifest 一致（若仅有遗留 `.cursor/` meta：先迁到新路径再写）
3. 目标阶 [ladder.md](ladder.md) 必备项勾选通过；分级移交 TODO 已打印

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

## 0.5.10 → 0.6.0 迁移要点（进行中 · 0.6.0-dev）

1. **meta**：`skill_version` → `0.6.0-dev`（正式 `0.6.0` 在 M4 去 `-dev`；resume / upgrade 写 meta 时对齐 manifest）
2. **写盘入口**：Agent 优先 `scripts/harness.mjs`（`--mode land|resume|upgrade|pipeline-skeleton`）；`land.mjs` 为薄别名。勿把 `render.mjs` 当主路径
3. **CLI 改名 / 文档搬家**：M1 只改入口指针；`modes/` · `fill/` · `host/` 拓扑调整在 **M2**（旧路径届时留 stub）
4. **Codex**：0.6.x **冻结 P2**，全量对等另立项（见 [ROADMAP-0.6.0.md](ROADMAP-0.6.0.md)）
5. **pipeline**：骨架战役用 `--mode pipeline-skeleton`（不跑 fill-*）

## 0.5.9 → 0.5.10 迁移要点

1. **meta**：`skill_version` → `0.5.10`（resume / upgrade 写 meta 时对齐 manifest）
2. **Codex**：仍为部分对齐（P2），但**不默认**进「全部推荐」（仅 `.codex/` 探测或显式勾选）
3. **皆无探测**：`ai_tools` 为空，追问一次；不默认 Cursor、不因此只写 `.cursor/` 适配
4. **报告叙事**：优先 `skill_version` + `report_schema`（`ui.version` 仍为 JSON 别名）
5. **legacy**：`fill-truths-auto` 见 `archive/fill-truths-auto/`（仅脚本、对话不推荐）

## 0.5.8 → 0.5.9 迁移要点

1. **meta**：`skill_version` → `0.5.9`（resume / upgrade 写 meta 时对齐 manifest）
2. **写盘入口**：Agent 优先 `scripts/land.mjs`；L5/`agent_config` **拒绝**直渲 `.cursor/rules` 等生成宿主路径，改走 `sync.mjs`
3. **填充 CLI**：inventory / merge 优先 `fill-inventory.mjs --domain` / `fill-merge.mjs --domain`（域脚本是别名）
4. **热路径**：先读 [AGENT-INDEX.md](AGENT-INDEX.md) 与 [fill/README.md](fill/README.md)

## 0.5.7 → 0.5.8 迁移要点

1. **meta**：`skill_version` → `0.5.8`（resume / upgrade 写 meta 时对齐 manifest）
2. **detect**：`S_RULES` / `S_HOOKS` / `MATURE` 按多宿主计（非仅 Cursor）；仅 Claude/Qoder/Trae/CodeBuddy 仓可判 MATURE
3. **selfcheck**：热路径改为 `scripts/selfcheck.mjs`（旧名 `selfcheck-0.5.2.mjs` 已弃用）
4. **Codex + L5**：须明示 **P2 / 部分对齐**；sync 不全量分发 Codex rules/hooks/MCP/skills

## 0.5.6 → 0.5.7 迁移要点

1. **meta**：`skill_version` → `0.5.7`（resume / upgrade 写 meta 时对齐 manifest）
2. **契约 sync 指针**：L3+ / L5 全量镜像宿主不再强制写 `1x-contract-sync`；已有文件 resume `skip`、不自动删。Codex 仍写 `.codex/contract-sync.md`
3. **文档**：对齐矩阵（高 / 中高 / Codex 部分 P2）；模板不再把 `.cursor/rules/11|12|13|16` 当作全宿主唯一权威

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
2. **行为**：会话仪表盘仅**工程轮**附末尾；纯 meta / 版本 / 手册问答省略整块（见 [session-dashboard.md](session-dashboard.md)）
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