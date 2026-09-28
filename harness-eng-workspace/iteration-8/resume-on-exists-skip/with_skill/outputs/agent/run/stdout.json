## 指纹探测 Fingerprint

| 信号 | 值 | 备注 |
|---|---|---|
| `S_GIT` | 是 | git 仓 |
| `S_AGENTS_ROOT` | 是 | 根 `AGENTS.md` 存在（仅含 Never do + Commands 极简骨架） |
| `S_RULES` | 否 | 无 `.cursor/rules`、`.claude/rules`、`.qoder/rules`、`.trae/rules`、`.codebuddy/rules` |
| `S_00` | 否 | 无 `00-*.mdc` |
| `S_KARPATHY` | 否 | 无 `karpathy-guidelines.mdc` |
| `S_FUNC` / `S_API` / `S_DB` / `S_REDIS` / `S_JOBS` | 否 | 无契约目录 |
| `S_KB` | 否 | 无 `docs/agent-kb/` |
| `S_HOOKS` | 否 | 无 hooks 配置 |
| `S_MCP` | 否 | 无 `mcp.json` / example |
| `S_HARNESS_META` | 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| `S_STACK` | 否 | 无 `pom.xml` / `package.json` / `go.mod` 等 |
| `S_EMPTY` | 是 | 无常见源码入口，除 AGENTS.md 外无 harness 指纹 |
| `S_SECRETS_LEAK` | 否 | 无命中 |
| `S_CLAUDE` | 否 | `.claude/` 下仅 `skills/` 为 skill 自身文件，非仓库产物 |
| `S_MULTI_TOOL` | 否 | 未探测到多宿主入口 |

**类型判定**: `PARTIAL`（有 `AGENTS_ROOT` 但不满足 `MATURE`） → **resume（续跑）**

---

## 已有 / 缺口表（按阶梯）

| 阶梯 | 已有 | 缺口 |
|---|---|---|
| **L0 协作入口** | `AGENTS.md`（极简骨架） | `harness-meta.yaml`、`karpathy-guidelines.mdc`、`00-project-docs-overview.mdc`、可选 `rule-14` |
| **L1 契约骨架** | 无 | `docs/{domain}/` 索引 + templates + 真相 README、sync rules（11/12/13/16/20） |
| **L2 知识回流** | 无 | `docs/agent-kb/` 四文件、`19-agent-kb.mdc` |
| **L3 规划与软门禁** | 无 | `docs/superpowers/README.md`、`18-superpowers-corpus.mdc`、hooks（Cursor/Claude/兜底）、`.githooks/pre-commit` |
| **L4 工具连接样例** | 无 | `mcp.json.example`、`mcp-usage-guide.md`、`.gitignore` snippet |
| **L5 配置 SSOT** | 无 | `docs/agent-config/`、`sync.mjs` |

---

## 推荐包 RecommendedProfile

- **模式**: `resume`（续跑） — 理由：已有 `AGENTS.md` 但未齐套
- **目标阶梯**: **L4**（工具连接样例） — 理由：小仓默认一次到位；但**无源码栈**，L1 契约域只能空壳落地
- **契约域**: `func, api, db, redis, jobs` — 理由：无栈信号，默认全域空壳（若只想到 L0 可不装）
- **分册**: `solo`（仅根） — 理由：无模块信号
- **glob**: `wide`（小仓默认）— 但 globs 无法推断，留 TODO 预填
- **Rule14 / Rule21 / Rule17 / 安全预填**: **是** / 否（非 Java） / 否（无前端） / **是**
- **AI 工具面**: `[]`（未探测到任何入口）— **须确认**：是否至少启用 Cursor？
- **MCP 跟踪策略**: `example_only`（仅 example 入库，真密走 `.gitignore`）
- **L5 SSOT 管线**: 否（单工具/无信号仓默认否）

不确定请回复：**全部推荐**  
（或逐题选 A/B…；自定义工具请写「工具名=…; 入口路径=…」；写盘前仍需对 WritePlan 回复「确认」等）

---

## WritePlan（草案）

### 白话摘要

- **模式**: 续跑 — 只补缺；已有 `AGENTS.md` 同名章节正文保留，缺失章节（Critical、文档优先级、AI 协作规则等）以 H2 章节级追加
- **阶梯**: 补齐到 **L4**（协作入口 → 契约骨架 → 知识回流 → 软门禁 → MCP 样例）
- **契约域**: 若接受 L1+，func / api / db / redis / jobs 五域均以**空壳骨架**落地（索引 + templates + 真相 README），待后续 `seed-truths` 或 `fill-truths` 填实
- **本轮**: 补齐 rules（Karpathy + 00 总览 + 14 中文文档）、五域 sync rules、agent-kb、superpowers、hooks 兜底、MCP example + 使用说明
- **风险**: 仓库无技术栈信号，Commands / globs / 模块列表均安全预填为 `TODO(harness-eng)`，需人工后续补真值

### 技术摘要

```text
仓库类型: PARTIAL
目标根: /tmp/skill-up-771594351
模式: resume
目标阶梯: L4
契约域: func, api, db, redis, jobs（空壳）
agents_variant: solo
glob_profile: wide
on_exists: skip
Q_SEED: 是
预授权: 否
将新建: ~28 项 | 合并: 1 项 (AGENTS.md) | 跳过: 0
风险: 无栈信号，globs 与 Commands 为 TODO；未触及 MCP 真密；S_SECRETS_LEAK=否
```

### 文件动作表（按阶梯）

| 目标路径 | 动作 | 说明 | 阶梯 |
|---|---|---|---|
| `AGENTS.md` | **merge** | 保留现有 `Never do` + `Commands`，追加 Critical、文档优先级、AI 协作规则等 H2 章节 | L0 |
| `docs/harness-eng/harness-meta.yaml` | create | 记 `skill_version` / `ladder` / `domains` / `last_mode=resume` | L0 |
| `.cursor/rules/karpathy-guidelines.mdc` | create | `alwaysApply: true` | L0 |
| `.cursor/rules/00-project-docs-overview.mdc` | create | `alwaysApply: true` | L0 |
| `.cursor/rules/14-chinese-skill-docs.mdc` | create | 可选；中文文档规则 | L0 |
| `.cursor/rules/11-func-sync.mdc` | create | globs 预填 TODO | L1 |
| `.cursor/rules/12-api-sync.mdc` | create | globs 预填 TODO | L1 |
| `.cursor/rules/13-db-sync.mdc` | create | globs 预填 TODO | L1 |
| `.cursor/rules/16-redis-sync.mdc` | create | globs 预填 TODO | L1 |
| `.cursor/rules/20-jobs-sync.mdc` | create | globs 预填 TODO | L1 |
| `docs/func/func.md` + `templates/` + `modules/README.md` | create | 空壳索引 | L1 |
| `docs/api/api.md` + `templates/` + `modules/README.md` | create | 空壳索引 | L1 |
| `docs/db/db.md` + `templates/` + `table/README.md` | create | 空壳索引；迁移模式留 TODO | L1 |
| `docs/redis/redis.md` + `templates/` + `keys/README.md` | create | 空壳索引 | L1 |
| `docs/jobs/jobs.md` + `templates/` + `tasks/README.md` | create | 空壳索引 | L1 |
| `docs/agent-kb/README.md` / `architecture-overview.md` / `pitfalls.md` / `accepted-gaps.md` | create | 知识回流骨架 | L2 |
| `.cursor/rules/19-agent-kb.mdc` | create | agent-kb 同步规则 | L2 |
| `docs/superpowers/README.md` | create | 含进行中表骨架 | L3 |
| `.cursor/rules/18-superpowers-corpus.mdc` | create | superpowers 同步规则 | L3 |
| `.cursor/hooks.json` | create | fail-open 软提醒 | L3 |
| `.claude/settings.json` hooks | create | 若启用 claude | L3 |
| `.githooks/pre-commit` + gate | create | 兜底软提醒；建议 `chmod +x` + `git config core.hooksPath .githooks` | L3 |
| `docs/harness-eng/mcp-usage-guide.md` | create | 含「勿提交真密」约定 | L4 |
| `.cursor/mcp.json.example` | create | 无密占位（mysql / redis / browser server 骨架） | L4 |
| `.gitignore` snippet | **merge** | 追加 `.cursor/mcp.json` / `.mcp.json` / `.trae/mcp.json` 忽略 | L4 |

### 渲染预览

**`AGENTS.md` merge 后将追加（示例，安全预填）**：
```markdown
## Critical（红线）
- TODO(harness-eng): 补充本仓真实 Critical 红线

## 文档优先级
1. `docs/func/func.md` — 功能契约索引
2. `docs/api/api.md` — 接口契约索引
3. `docs/db/db.md` — 库表契约索引
...

## AI 协作规则
- 改契约前读真相、改后回写
- 提交前跑 `echo ok`
```

**各 sync rule `globs:` 占位（预填）**：
- `11-func-sync.mdc`: `globs: "TODO(harness-eng): **/src/main/java/**/*.java,docs/func/**"`
- `12-api-sync.mdc`: `globs: "TODO(harness-eng): **/controller/**/*.java,docs/api/**"`
- `13-db-sync.mdc`: `globs: "TODO(harness-eng): **/db/migration/**,docs/db/**"`
- `16-redis-sync.mdc`: `globs: "TODO(harness-eng): docs/redis/**"`
- `20-jobs-sync.mdc`: `globs: "TODO(harness-eng): docs/jobs/**"`

**装后烟测**：
- hooks：Cursor 原生 hooks + `.githooks/pre-commit` 兜底，均 fail-open（不拦截提交）
- MCP：仅 `.cursor/mcp.json.example` 无密；真密 `.cursor/mcp.json` 已建议进 `.gitignore`
- `.gitignore`：检查是否已忽略 `.cursor/mcp.json`

### render 参数要点（`params.json`）

```json
{
  "ladder": "L4",
  "domains": ["func", "api", "db", "redis", "jobs"],
  "agents_variant": "solo",
  "include_optional": ["rule-14"],
  "on_exists": "skip",
  "expandFromManifest": true,
  "placeholders": {
    "PROJECT_NAME": "fixture-partial",
    "PROJECT_DESC": "TODO(harness-eng): 一句话职责",
    "CODE_PREFIXES": "TODO(harness-eng): 业务路径前缀",
    "SKILL_VERSION": "0.7.23"
  }
}
```

---

## 待确认参数（≤5 题）

1. **目标阶梯**：建议 **L4**（空壳骨架一次到位），或只要 **L0**（仅补齐 rules + meta）？
2. **契约域**：若 L1+，五域全空壳？或跳过部分域（如只留 `func, api`）？
3. **AI 工具面**：当前未探测到任何工具；至少启用 **Cursor** 吗？或同时启用 `claude` / `codex` / `trae`？
4. **分册与 globs**：无栈信号，保持 `solo` + globs 留 TODO？
5. **安全预填**：默认 **是**（Commands / 模块列表 / globs 预填骨架），是否接受？

> 请回复 **确认**（或 `按计划执行` / `LGTM`）后开始写入。多轮可回复 **确认预授权**。`全部推荐` 只收齐答题；写盘仍须本确认。
