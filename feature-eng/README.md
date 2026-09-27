# feature-eng

用户点名的开发流程控制器（`disable-model-invocation: true`，**须点名**，不自动加载）。与 [`release-eng`](../release-eng/) 同级、互不替代。

入口与仪式：[SKILL.md](SKILL.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。Agent 热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。版本：[`_meta/manifest.yaml`](_meta/manifest.yaml)。变更：[CHANGELOG.md](CHANGELOG.md)。

验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`（须 PASS）。薄 CLI：`node scripts/feature.mjs`（modes / status / gate-evidence / close-check）。闸门证据：`node scripts/gate-evidence.mjs`。

0.2.18-dev 要点：批 E——domain-bridge 判据收窄；close 死链改写 + close-check；ARCHIVE「提交」列 PR→merge SHA。叠在 0.2.17-dev 之上。
0.2.17-dev 要点：批 D——close 跟 `delivery-checklist.md`；可选 `harness refresh`；失败标 `harness_snapshot: stale`。叠在 0.2.16-dev 之上。
0.2.16-dev 要点：批 C——绑定 SSOT 迁至目标仓 `docs/runs/stage-bindings.yaml`；禁止代跑 harness sync；`run_mode: unattended` 集中降级。叠在 0.2.15-dev 之上。
0.2.15-dev 要点：P2 harness_probe 软探测 + 有 lint-pitfalls 时本主题 close_pitfalls 收紧为 on（yaml 默认仍 optional）。叠在 0.2.14-dev 之上。
0.2.14-dev 要点：P0 与 harness-eng 消歧与接力（配合与互斥短节；计划 Go 闸 ≠ 仓库开干；环间 L1/L2 ≠ 阶梯）。叠在 0.2.13-dev 之上。
0.2.13-dev 要点：modes 大合并——根目录仅 7 入口；`modes/specs/{flow,gates,bridges,handoff}` 四手册；旧扁平规格废除。叠在 0.2.12-dev 之上。
0.2.12-dev 要点：P2（auth/progress-shape lib；status-scan --cwd；交接/术语增量/设计笔记/审核-stage 模板；pre-impl↔pre_impl 别名；manifest specs）。叠在 0.2.11-dev 之上。
0.2.11-dev 要点：闸检须 `result: pass`；`user_task_*` 占位黑名单；夹具 Spec/Plan stub；feature.mjs 转发 gate-evidence/close-check；close-check 组合 gate-evidence；AGENT-INDEX ≤8 文件；minimal 绑定包；proxy「仪式与降级」机检。叠在 0.2.10-dev 之上。
0.2.10-dev 要点：闸门证据机检（gate-evidence + advance-gate/close-ready 金样落盘审核文件 + gate-theater-bad 负例）；SKILL 证据条/红旗/SDO；叠在 0.2.9-dev 之上。
0.2.9-dev 要点：M1–M6 monorepo 摩擦优化（layout/packages/docs_root / verify_commands / 单 Spec API·UI·测试矩阵 / 根 README SSOT / workdir_policy / monorepo_bootstrap 剥离）；叠在 0.2.8-dev 之上。
0.2.8-dev 要点：O8–O14 摩擦优化（sibling_repos / CORS·Proxy 联调门禁 / 绿地前端 mktemp 配方 / pinned_deps·Node×jsdom / proto 轻量草图 / 会话存储枚举 / api_base_mode）；叠在 0.2.7-dev 之上。
0.2.7-dev 要点：O1–O7 摩擦优化（chef_mode / repo_bootstrap / authorized_by / env_notes / review_policy 探测 / 中文文件名契约 / close 双归档检查单）；叠在 0.2.6-dev 之上。
0.2.6-dev 要点：`modes/` + 薄 CLI `feature.mjs` + 加厚夹具（`advance-gate` / `bindings-bad` / `close-ready`）与行为自检；叠在 0.2.5-dev 之上。  
0.2.5-dev 要点：最小夹具（`scripts/fixtures/init-skeleton` / `progress-bad`）+ selfcheck 行为断言（progress 形状/枚举、模板↔夹具契约、status-scan 夹具烟测）；V0.6.X 开发钉（不改默认绑定 skill 名）。  
0.2.4 要点：正式钉号；P0 索引/selfcheck；P1 lookup 预检 + truncate-contracts + QUICKSTART；P2 status-scan + close_pitfalls。一页纸：[QUICKSTART.md](QUICKSTART.md)。  
0.2.3 要点：过程态 `docs/runs/{active|archive}/`（与 superpowers 平级）；人读中文短名 + `progress.yaml` 机读；close 归档。  
0.2.2 要点：过闸主动调起；L1/L2 环间审核。  
0.2.1 要点：init 中文环节表；domain 条件桥；Proto 可推翻；禁根 CONTEXT。  
0.2.0 要点：`invoke` / `run_mode` / 写盘权责 / 指针卡片 / 口令协议。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。
- **本仓可用**：skill + `config/`（种子）+ `templates/` 已齐；业务绑定写目标仓 **`docs/runs/stage-bindings.yaml`**（`init`/`rebind`）；**禁止**代跑 harness `sync.mjs`。
- **迁到他仓**：技能推荐用户级安装；目标仓跑 `init` 生成 `docs/runs/stage-bindings.yaml`（可先用 `stage-bindings.minimal.yaml` 种子）。
- 过程态：`docs/runs/`（与 `docs/superpowers/` 平级）；语料仍在 superpowers。旧路径 `docs/superpowers/runs/` 仅兼容提示迁移。
- **收口**：[modes/close.md](modes/close.md) 为 skill 内规则（含 active→archive）；契约目录 / pitfalls lint 为可选增强。

## 中文过程态文件名（契约，O6）

下列**中文短名是契约的一部分**，不得擅自改成英文文件名（机读键仍在 `progress.yaml` 用英文）：

| 文件 | 用途 |
|---|---|
| `回链.md` | 产物回链总表 |
| `测试用例.md` | Full 路径用例 |
| `测试报告.md` | Full 路径验证报告 |
| `术语增量.md` | 主题术语（禁写根 CONTEXT.md） |
| `门禁清单.md` | 门禁备注（可选） |
| `审核-<stage>.md` | L2 审核结论（stage 为英文键） |
| `交接.md` | 交接 |

脚本与夹具须 **UTF-8**；跑 selfcheck / 跨平台工具时建议 `LC_ALL=C.UTF-8`（或等价 UTF-8 locale）。
