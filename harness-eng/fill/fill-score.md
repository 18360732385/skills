# fill-score（完整度打分 · 双轴默认）

> 只看形态 → [fill-morph.md](fill-morph.md)；只看开干 → [fill-gate.md](fill-gate.md)。引擎：`scripts/fill-score.mjs`（`--focus morph|gate|full`）。

## Done

1. score JSON 已生成（stdout 或 `--output` / score-latest）
2. 中文摘要含三词：**开干** YES|NO · **覆盖** %（mode） · **形态** overall / ceiling；可附 blockers / next_shards
3. 【推荐】`docs/harness-eng/report-latest.html` 已写出并回复路径

只读评估 harness 契约完整度，输出缺口与 **next_shards**，指导 fill-mcp / fill-truths / calibrate-live。

## 触发

- **完整度打分**（fill-score）
- fill 专项默认第一步
- 调开干覆盖策略 / 读 `score-policy.yaml` 时

## 流水线

```
- [ ] 1 定根；读 harness-meta（domains / glob_profile / 分册 / ready_coverage）
- [ ] 2 若存在 docs/harness-eng/score-policy.yaml → 按覆盖裁决读入（见下）
- [ ] 3 确认打分范围：点名模块【推荐】= meta 分册或 Q_MODULES few 列表
- [ ] 4 可选：scripts/fill-inventory-*.mjs（默认写出 docs/<domain>/.fill-work/inventory*.json）
- [ ] 5 运行 scripts/fill-score.mjs --root <TARGET> --focus full [--domains api,func,db,redis,jobs] [--modules a,b] [--threshold 80] [--inventory path] [--compare prev.json] [--ready-quality 80] [--ready-coverage 0.8] [--summary-only] [--verbose]
- [ ] 6 展示三词摘要 + blockers / miss_histogram / next_shards；建议下一步
- [ ] 7 【推荐】score JSON 落盘后 `fill-report-html.mjs` → `docs/harness-eng/report-latest.html`；回复路径（须确认/预授权）
- [ ] 8 仅当用户要求时，才写 `docs/harness-eng/fill-score-latest.md`（须确认闸门）
```

无 `--inventory` 时自动扫描 `docs/api/.fill-work/inventory*.json`（多模块合并）。db/redis/func/**jobs** 覆盖率写入 `coverage_by_domain`（域列表见 `templates/_meta/domains.yaml`；可用 `--domains` 覆盖）。  
对用户摘要输出三词（开干 / 覆盖 / 形态）；贴顶时看 `formula_ceiling` 后走 agents。版本史见 [CHANGELOG.md](../CHANGELOG.md)。

## HTML 报告

```bash
# Windows：score JSON 传参见 write-plan.md「Windows JSON 传参」
node scripts/fill-score.mjs --root <TARGET> --summary-only [--write-progress]
node scripts/fill-report-html.mjs --root <TARGET> --score docs/harness-eng/score-latest.json
# 可选：--run run.json · --no-history-append · --history-limit 20
# 0.2.29：无 --compare 时报告仍用 history 补「相对上次」；无 --run 时默认加载/写入 docs/harness-eng/run-latest.json（round）
```

默认写出：`docs/harness-eng/report-latest.html`、`docs/harness-eng/score-latest.json`。  
audit 只读默认不写。对用户优先中文（**可 AI coding** / **金标达标率** / 骨架就绪 / 语义抽检 / 文档形态分 / 相对代码覆盖 / 公式上限 / **模板完整度**），英文 ID 放「技术细节」。  
报告优先对照 **`skill_version` + `report_schema`**（现 0.3.0；**报告壳 ≠ skill**）。`ui.version` 仅为兼容别名。JSON 含 **`morph_scale: "0.7"`**（与 0.6.x 历史 overall 不可比）。术语见 [glossary.md](../glossary.md)。

### 报告字段速查

| 字段 | 含义 |
|---|---|
| `gap_to_ready` | 相对开干/覆盖门槛还差多少（决策台）；不再绑废弃 `ready.ok` |
| `domain_stories` | 各域形态/覆盖/空壳一句话；默认一行摘要，故事卡需 `show_domain_cards` |
| `diff` | `--compare` 分数 Δ（趋势台）；无 compare 时 history 可补「相对上次」 |
| `suggest_upgrade` | 建议下一 harness 阶与原因 |
| `run-latest.json` / `round` | 批次轮次；report 默认加载并写入 history |
| `morph_scale` | 形态尺度版本（`0.7`）；history 不换算 |

## 双轴分 + 分层 ready

| 轴 | 含义 | 高分条件 |
|---|---|---|
| **quality** | 文档形态（0–100，再加权 overall） | **0.7**：探针≈75 + 深度≈25；见下「分项」 |
| **coverage** | 相对代码覆盖（有 inventory 时） | api：`docs 已登记接口数 / inventory 接口数` |
| **template_completeness** | 模板必填章 + 列密度（0–100，独立指标） | 见「模板完整度」；**不进** ready 公式 |
| **gold_ratio** | acceptance 达标占比（0–1） | 见 [truth-quality.md](../modes/truth-quality.md)；**不进** `ai_coding_ready` 公式 |

**ready.ok（0.7.0 起对外废弃）**：JSON 仍输出且标 `deprecated: true`；摘要/HTML/仪表盘不展示。内部仍可算 quality/coverage 兼容式，**开干不看此项**。

**ai_coding_ready（开干闸）**：`skeleton_ready && coverage_ready && semantic_ready && fill_plan.all_closed`；若 `gate_profile=strict|gold` 再并入 `gate.*`。  
- **strict**（有 score-policy 未写 profile 亦视为 strict）：缺省 `morph_floor=75` / `todo_scan=truths` / `acceptance_blockers_max=0`；语义 `generic≤3 && unbound≤2 && tc≥70`。  
- **gold**：覆盖目标强制 1.0；`morph_floor=95`；`template_completeness_min=95`；`todo_scan=harness_docs`；`acceptance_blockers_max=0`；`acceptance_warnings_max=0`；语义 `generic≤0 && unbound≤0 && tc≥95`。  
- **legacy**：语义保持 `generic≤5 && unbound≤3 && tc≥50`。  
显式 `gate_profile: legacy` 可回退宽松语义。缺 fill-plan → `ai_coding_ready=false`。新仓【推荐】仍 strict。

**形态上限**：`domain_caps`（各域 **100**）/ `formula_ceiling≈100`；抬 caps 不会使 `ai_coding_ready` 变 true。存量仓 `morph_floor: 60|90` 由 resume/upgrade 或 `fill-score --migrate-policy` 字段级迁到 75/95。

正写摘要三词：**开干** / **覆盖** / **形态**（见 [glossary.md](../glossary.md)）。提问见 `Q_GATE_PROFILE`。

### 覆盖裁决 · score-policy

路径：`docs/harness-eng/score-policy.yaml`（可选）。

| 权威 | 规则 |
|---|---|
| **有 score-policy** | `coverage_ready` 按该文件 `coverage_mode` + `coverage_targets` |
| **域目标缺省** | 回退 `meta.ready_coverage` 或 CLI `--ready-coverage`（默认 0.8） |
| **无 score-policy** | `coverage_mode=overall`，阈值 = `ready_coverage` |
| **形态 caps** | 不参与 `coverage_ready` |
| **gate_profile** | `legacy`\|`strict`【推荐】\|`gold`；后两者 `gate.*` 并入开干 |

| 字段 | 含义 |
|---|---|
| `coverage_mode` | `overall` / `all_domains` / `weighted` |
| `coverage_targets` | 分域目标；缺省回退 `ready_coverage` |
| `density.*` | 列密度阈值，计入 `template_completeness`（`dens-*`） |
| `gate_profile` / `gate.*` | 开干附加闸 |

JSON 含 `coverage_ready.gaps` 与 `score_policy`。`gold_ratio` 为大仓金标进度；整仓全绿可远期。

## 模板完整度

按域启发式检查真相是否含模板**必填章**（标题/表头关键字），并计列密度 `dens-*`：

| 域 | 必填线索（例） |
|---|---|
| api | 功能描述 / 接口地址 / 请求方式 / evidence / 功能逻辑 / 请求参数 / 响应参数 |
| func | 服务类 / 方法说明 / 关联 API·表 |
| db | 建表或字段表 / 业务说明 |
| redis | Key/前缀 / Value·类型 / TTL |

缺章 → `miss_histogram` 记 `missing-req-section` 及具体 `req-*`。决策台：贴 `formula_ceiling` 且 `template_completeness` 低 → **fill-truths-agents**。

## 分项（quality 0–100 · 0.7.0）

| 域 | 探针档（≈75） | 深度档（≈+25，复用 acceptance 启发式） | 满分 |
|---|---|---|---|
| api | 路径 / 方法 / 参数章 / 长文 | evidence · 逻辑≥2 步 · 示例值率 · 非 echo 描述 | **100** |
| func | 服务类 / 方法表 / 长文 | 方法说明率 · 关联 API/表 · evidence | **100** |
| db | CREATE/字段 · COMMENT≥0.2 · 业务标题 | COMMENT≥0.5 · 业务说明厚度 | **100** |
| redis | Key 模式 · Value/TTL **章节** | TTL/Value **证据** · Key 示例 | **100** |
| jobs | 标识 · Cron · Scheduler | 代码锚点 · 非 OpenAPI 误抄 · 标识×Cron | **100** |

权重默认：api 0.35 · func 0.25 · db 0.25 · redis 0.15（缺域则重归一）→ 加权 **formula_ceiling ≈100**。  
仅探针无深度时域分约停在 70–75；须深度证据才能冲 90–100 / 过 gold `morph_floor=95`。

### 格式兼容（与模板一致）

- `**接口地址：** /path` 或 `**接口地址** /path` 或 `接口地址： /path`
- `**请求方式：** GET` 或 `**请求方式**: GET`

## 脚本

```bash
node scripts/fill-score.mjs --root <TARGET_ROOT> --modules sms-entrance,sms-safe
node scripts/fill-score.mjs --root <TARGET_ROOT> --inventory <inv.json> --ready-coverage 0.8
node scripts/fill-score.mjs --root <TARGET_ROOT> --migrate-policy   # 字段级迁旧 morph_floor
node scripts/fill-score.mjs --root <TARGET_ROOT> --compare prev.json
node scripts/fill-score.mjs --root <TARGET_ROOT> --summary-only
node scripts/fill-score.mjs --root <TARGET_ROOT> --verbose
```

## 输出

stdout JSON + 末尾中文摘要（须含 quality、coverage、**formula_ceiling**、**template_completeness**、**ready**、**miss_histogram**、缺口 Top、**next_shards**、建议下一步）。  
`--verbose`：每文件打印 `[OK]`/`[MISS]`。  
`--summary-only` 在 `ready.ok` 时明确「形态 ready 已达；开干看 ai_coding_ready；template_completeness 低则 agents」。  
Agent 必须把摘要展示给用户。

## Redis / Func coverage

| 域 | covered | code |
|---|---|---|
| redis | 真相中 `## Key 模式` 表内 `` `pattern` `` 行数 | inventory `keys`（redis≠false） |
| func | 已写模块真相数 | func inventory `modules` 数 |

## 模块过滤

`--modules` 对 **api / func** 按文件名匹配。**db / redis 不按模块名过滤**。
