# harness-eng 0.6.0 路线图

主题：**从厚仪式 → 入口单一、文档可导航、fill 可维护、发包可瘦。**

列车：`0.5.10` → `0.6.0-dev` → **`0.6.0`（列车已收口）**。权威号：`templates/_meta/manifest.yaml`。  
分支约定：工作在 `V0.6.X`；不合并到 `main`，直到用户另议。M1–M4 已完成。

## 0.5.8–0.5.10 已落地（本列车不重做）

| 切片 | 已完成 |
|---|---|
| 0.5.8 | 多宿主 MATURE（`S_RULES` / `S_HOOKS` 按任一支持宿主）；`scripts/selfcheck.mjs` 稳定名；Codex **P2 警告 + 不全量 sync** |
| 0.5.9 | `AGENT-INDEX` / `fill/README`；`land.mjs` 写盘入口；薄 fixture（mature-claude / qoder-hooks / stack-node）；fill `--domain` 别名 |
| 0.5.10 | Codex **不默认**；皆无探测 ≠ Cursor；CHANGELOG 归档至 0.4；`fill-truths-auto` 归档；报告对照 `skill_version` + `report_schema` |

以上是 **0.6.0 的非重做目标**。本列车只在其上收口入口、文档、fill、发包，不回头改探测模型或重写手册。

## 目标

### G1 统一入口

把 Agent 写盘从「记得跑 `render.mjs`」收成 **一条公开 CLI**。

- **T1.1** 引入 `scripts/harness.mjs`：`--mode land|resume|upgrade|pipeline-skeleton`
- **T1.2** `land.mjs` 改为薄别名（转发 argv + 再导出 helpers）
- **T1.3** `pipeline-skeleton` = 仅骨架战役写盘，**不**跑 fill-* / 不进入 `pipeline-fill`
- **T1.4** 读 meta（`docs/harness-eng` + 遗留 `.cursor/`）；L5 / `agent_config` **拒绝**直渲生成宿主路径，改走目标仓 `scripts/agent-config/sync.mjs`
- **T1.5** 热路径文档改指向本 CLI（SKILL / AGENT-INDEX / write-plan / conflict-policy / QUICKSTART / pipeline）
- **T1.6** `render.mjs --help`（或横幅）声明：内部渲染器，公开入口是 `harness.mjs`

### G2 文档拓扑（M2 已落地）

根目录可导航：人/Agent 都不必扫几十个 md。

- [x] **T2.1** 根 md **≤ 20**（SKILL / AGENT-INDEX / QUICKSTART / CHANGELOG / ROADMAP / 手册入口等保留）
- [x] **T2.2** `modes/`：land · resume · upgrade · pipeline · audit 搬家
- [x] **T2.3** `fill/`：收齐 fill-* 规格（索引已有，正文迁入）
- [x] **T2.4** `host/`（或 `docs/host/`）：ai-tools · sync-hosts · adapters 指针
- [x] **T2.5** 更新 AGENT-INDEX / SKILL 相对路径；热路径旧路径留 stub

### G3 fill 引擎真内聚

填充实现只有一套，域脚本继续当别名。

- [x] **T3.1** inventory / merge 实现收口到 `--domain` 入口（域脚本为弃用 shim；实现在 `lib/inventory-*` / `merge-api`）
- [x] **T3.2** 合并重复 fill 规格；对话热路径只留 `fill/README.md`
- [x] **T3.3** 不再在 SKILL 根表罗列每域脚本文件名

### G4 fixture 黄金集

可回归的宿主/阶梯样本，而不是一次性自检。

- [x] **T4.1** L5 仓 fixture：`scripts/fixtures/l5-sync-golden` 上 `sync.mjs --check` 必须绿
- [x] **T4.2** multi-host hooks fixture（Cursor + Claude / Qoder / Trae / WorkBuddy）
- [x] **T4.3** selfcheck 钉黄金集路径与期望信号（扩 0.5.9 薄夹具）

### G5 发包减脂

安装物不是考古馆。

- [x] **T5.1** 安装包 **不含** `archive/selfcheck/legacy` 体积（热树只留 INDEX；全文在 `_history/` / git）
- [x] **T5.2** 文档写明「安装 ≠ 全仓」；开发自检仍可 Read `_history/` / archive 指针
- [x] **T5.3** selfcheck 断言发包清单 / `.skillignore` 规则

### G6 Codex P2 冻结至另立项

**0.6.x 冻结 P2，全量对等另立项。**

0.5.8–0.5.10 已把 Codex 定为 **部分对齐（P2）·不默认**：未探测 `.codex/` 不进「全部推荐」；L5 `sync.mjs` **不全量**发出 Codex 的 rules / hooks / MCP / skills。0.6.x **不再扩** Codex 对齐面（不补全家桶事件、不镜像全量 `.mdc`、不做 sync 对等）。若产品要「与 Cursor/Claude 同构」，单独立项，不占用本列车 M1–M4。交叉：[adapters/codex.md](templates/ai-tools/adapters/codex.md) · [ai-tools.md](host/ai-tools.md)。

**Trae 中高→高不在 G6。** Codex 冻结与 Trae 同级是两条线；后者跟踪 [host/TRAE-PARITY.md](host/TRAE-PARITY.md)，不占用本列车。

- [x] **T6.1** 本文件 + `adapters/codex.md` + `ai-tools.md` 各留冻结段（M1；M4 复核无新 Codex 能力）
- [x] **T6.2** 全量对等：**不做**（另立项）

### G7 版本钉与 0.5.10→0.6.0 迁移说明

- [x] **T7.1** M1：`manifest` / meta / questions → `0.6.0-dev`；M4 去 `-dev` 钉 **`0.6.0`**
- [x] **T7.2** [upgrade.md](modes/upgrade.md) 短清单：CLI 改名、文档搬家、入口指针、发包政策
- [x] **T7.3** CHANGELOG 正式 **`0.6.0`** 条目汇总 M1–M4

## 里程碑

| 里程碑 | 范围 | 完成判据 |
|---|---|---|
| **M1**（已完成） | G1 CLI + 热路径指针 + G6 轻声明 + G7 `0.6.0-dev` + ROADMAP + upgrade stub | `harness.mjs` 可跑四模式；`land.mjs` 别名；`render --help` 指向公开入口 |
| **M2**（已完成） | G2 文档拓扑 | 根 md≤20（现 15）；`modes/` / `fill/` / `host/` 已搬；热路径旧路径 stub；AGENT-INDEX 必读≤8 |
| **M3**（已完成） | G3 fill 内聚 + G4 黄金集 | 域脚本无旁路语义；L5 `sync --check` fixture 绿；multi-host hooks 夹具 |
| **M4**（已完成） | G5 发包减脂 + 正式 `0.6.0` | 安装不含 legacy selfcheck 体积；manifest `0.6.0`；upgrade 收口；**列车已收口** |

## 非目标（本列车不做）

- Codex **全量** sync / 全家桶对等（见 G6，另立项）
- Trae **中高→高** / 原生执行实证（旁路，见下方「后续」）
- 使用手册全文重写（只改版本钉与入口指针）
- 新契约域 / 新 host
- 重做打分模型（`score-policy` / `ai_coding_ready` 语义保持 0.5.x）

## 后续（非 0.6.0 列车）

**0.6.0 列车已收口**，本段不重开 M1–M4，也不改本列车主题。

**Trae 中高 → 高**（旁路立项）：脚手架已共享 SSOT + Claude 族 hooks；缺口是原生执行与实证宿主行为，不是「还没写适配」。跟踪清单：[host/TRAE-PARITY.md](host/TRAE-PARITY.md)。

**0.6.1-dev Trae P0 spike 已开工**（2026-09-12）：官方实证 [host/TRAE-P0-EVIDENCE.md](host/TRAE-P0-EVIDENCE.md)；镜像保留 Trae frontmatter；`mature-trae` fixture。**不**在本切片把矩阵改成高（T-P1-5 等人 Trae 会话确认 hooks/MCP）。**不塞进已收口的 0.6.0**。G6 仍只管 Codex P2 冻结，与本条无关。

## Agent 用法（M1 起）

确认闸门之后：

```bash
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode land
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode resume
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode upgrade
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode pipeline-skeleton
```

`pipeline-skeleton` 只写骨架（audit 后的 L4 land/resume 写盘）。填充战役仍走 [pipeline-fill.md](modes/pipeline-fill.md)，且须先过填充 MCP 闸。  
L5 / `agent_config`：不要让 `render.mjs` 直写 `.cursor/rules` 等生成宿主路径；由 `node scripts/agent-config/sync.mjs` 发出。
