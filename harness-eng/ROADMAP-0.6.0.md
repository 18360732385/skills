# harness-eng 0.6.0 路线图

主题：**从厚仪式 → 入口单一、文档可导航、fill 可维护、发包可瘦。**

列车：`0.5.10` → **`0.6.0-dev`**（本文件）→ 正式 `0.6.0`（M4）。权威号：`templates/_meta/manifest.yaml`。  
分支约定：工作在 `V0.6.X`；不合并到 `main`，直到列车收口另议。

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

### G2 文档拓扑

根目录可导航：人/Agent 都不必扫几十个 md。

- **T2.1** 根 md **≤ 20**（SKILL / AGENT-INDEX / QUICKSTART / CHANGELOG / ROADMAP / 手册入口等保留）
- **T2.2** `modes/`：land · resume · upgrade · pipeline · audit 搬家
- **T2.3** `fill/`：收齐 fill-* 规格（索引已有，正文迁入）
- **T2.4** `host/`（或 `docs/host/`）：ai-tools · sync-hosts · adapters 指针
- **T2.5** 更新 AGENT-INDEX / SKILL 相对路径；旧路径留 stub 一轮

### G3 fill 引擎真内聚

填充实现只有一套，域脚本继续当别名。

- **T3.1** inventory / merge 实现收口到 `--domain` 入口（0.5.9 已开，0.6 去掉旁路语义漂移）
- **T3.2** 合并重复 fill 规格；对话热路径只留 `fill/README.md`
- **T3.3** 不再在 SKILL 根表罗列每域脚本文件名

### G4 fixture 黄金集

可回归的宿主/阶梯样本，而不是一次性自检。

- **T4.1** L5 仓 fixture：`sync.mjs --check` 必须绿
- **T4.2** multi-host hooks fixture（Claude / Qoder / Trae / WorkBuddy 至少各一）
- **T4.3** selfcheck 钉黄金集路径与期望信号（扩 0.5.9 薄夹具）

### G5 发包减脂

安装物不是考古馆。

- **T5.1** 安装包 **不含** `archive/selfcheck/legacy`
- **T5.2** 文档写明「安装 ≠ 全仓」；开发自检仍可 Read archive
- **T5.3** selfcheck 断言发包清单 / ignore 规则

### G6 Codex P2 冻结至另立项

**0.6.x 冻结 P2，全量对等另立项。**

0.5.8–0.5.10 已把 Codex 定为 **部分对齐（P2）·不默认**：未探测 `.codex/` 不进「全部推荐」；L5 `sync.mjs` **不全量**发出 Codex 的 rules / hooks / MCP / skills。0.6.x **不再扩** Codex 对齐面（不补全家桶事件、不镜像全量 `.mdc`、不做 sync 对等）。若产品要「与 Cursor/Claude 同构」，单独立项，不占用本列车 M1–M4。交叉：[adapters/codex.md](templates/ai-tools/adapters/codex.md) · [ai-tools.md](ai-tools.md)。

- **T6.1** 本文件 + `adapters/codex.md` + `ai-tools.md` 各留冻结段（M1 轻量）
- **T6.2** 全量对等：**不做**（另立项）

### G7 版本钉与 0.5.10→0.6.0 迁移说明

- **T7.1** M1：`manifest` / meta / questions → **`0.6.0-dev`**；M4 去 `-dev` 钉 `0.6.0`
- **T7.2** [upgrade.md](upgrade.md) 短清单：CLI 改名、文档搬家（M2）、入口指针
- **T7.3** CHANGELOG `Unreleased` / `0.6.0-dev` 记 M1；正式版条目在 M4 写齐

## 里程碑

| 里程碑 | 范围 | 完成判据 |
|---|---|---|
| **M1**（本切片） | G1 CLI + 热路径指针 + G6 轻声明 + G7 `0.6.0-dev` + ROADMAP + upgrade stub | `harness.mjs` 可跑四模式；`land.mjs` 别名；`render --help` 指向公开入口；selfcheck 钉 `0.6.0-dev` |
| **M2** | G2 文档拓扑 | 根 md≤20；modes / fill / host 已搬；旧路径 stub |
| **M3** | G3 fill 内聚 + G4 黄金集 | 域脚本无旁路语义；L5 `sync --check` fixture 绿；multi-host hooks 夹具 |
| **M4** | G5 发包减脂 + 正式 `0.6.0` | 安装不含 legacy selfcheck；manifest `0.6.0`；upgrade 收口 |

## 非目标（本列车不做）

- Codex **全量** sync / 全家桶对等（见 G6，另立项）
- 使用手册全文重写（只改版本钉与入口指针）
- 新契约域 / 新 host
- 重做打分模型（`score-policy` / `ai_coding_ready` 语义保持 0.5.x）

## Agent 用法（M1 起）

确认闸门之后：

```bash
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode land
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode resume
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode upgrade
node scripts/harness.mjs --root <TARGET> --params <params.json> --mode pipeline-skeleton
```

`pipeline-skeleton` 只写骨架（audit 后的 L4 land/resume 写盘）。填充战役仍走 [pipeline-fill.md](pipeline-fill.md)，且须先过填充 MCP 闸。  
L5 / `agent_config`：不要让 `render.mjs` 直写 `.cursor/rules` 等生成宿主路径；由 `node scripts/agent-config/sync.mjs` 发出。
