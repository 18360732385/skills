# WritePlan 格式与确认闸门

## 展示格式

先打印**白话摘要**，再打印技术摘要，再打印表，再打印**渲染预览**：

### 白话摘要（强制，对用户）

用 3–6 条中文说明「确认后仓库会多什么能力」，避免只堆路径。例：

```text
白话摘要:
- 模式: 续跑 — 只补缺；已有 AGENTS 同名章节正文保留
- 阶梯: 升到 L2（知识回流）— 补齐契约索引骨架 + agent-kb
- 契约域: 功能 / 接口 / 库表 / Redis
- 本轮: 只装 MCP example；README 疑似密钥仅检测并移交
```

### 技术摘要

```text
仓库类型: PARTIAL
目标根: D:/path/to/repo
模式: resume | land | upgrade
目标阶梯: L2（知识回流）
契约域: api, db
agents_variant: solo
glob_profile: focused
on_exists: skip
Q_SEED: 是
将新建: N | 合并: M | 跳过: K | 备份后创建: B
风险: 将改 alwaysApply=…；将新增 hooks=否；触及 MCP=否；S_SECRETS_LEAK=…
```

| 目标路径 | 动作 | 模板源 | 阶梯 |
|---|---|---|---|
| `AGENTS.md` | merge | `templates/agents/AGENTS.root.solo.md.tmpl` | L0 |
| `.cursor/rules/karpathy-guidelines.mdc` | create | `templates/rules/karpathy-guidelines.mdc` | L0 |
| … | … | … | … |

### 渲染预览（强制）

在确认前展示：

1. 拟写入 `AGENTS.md` 的 **Critical + Commands** 前约 20 行（已做安全预填或 TODO）
2. 拟写入的各 sync rule 的 `globs:` 行（11/12/13/16 中本轮会装的）
3. 若目标阶梯 ≥ L3 或含 L4：附带 **装后烟测**：
   - hooks：按 `ai_tools` 装 Cursor/Claude/WorkBuddy/Codex 原生 hooks；另有 `.githooks` 兜底；一律 fail-open
   - MCP：仅 example / 无明文密入库；说明文件为 `docs/harness-eng/mcp-usage-guide.md`（读侧仍认 `.cursor/mcp-usage-guide.md`；若仓内仍有旧名 `MCP使用说明.md`：新建英文名、旧文件 skip 不删，移交可手工清理）
   - `.gitignore`：建议忽略 `.cursor/mcp.json`（见 gitignore snippet）

## 确认闸门（强制）

**本文件为闸门词表 SSOT**（确认 / 预授权与提示语）。`全部推荐` 协议见 [recommended-profile.md](recommended-profile.md)。SKILL、QUICKSTART、glossary、pipeline 等只指针到此，不复述闸门全文。

在用户明确回复下列**任一**之前不写盘（正目标：先过闸门词表）：

`按计划执行` · `确认` · `确认写入` · `执行 WritePlan` · `LGTM`

子集：`只执行 L0` / `只执行 L1` … · `去掉 14 后执行`

### 预授权（0.2.8+ · 多轮 / pipeline）

用户回复 **`确认预授权`** 或 **`预授权后续写盘`**：

1. 本轮 WritePlan **仍须**完整确认后写盘
2. 同会话后续 `resume` / `fill-*` / pipeline 轮次：**自动写盘**，无需再等闸门
3. WritePlan 技术摘要标注：`预授权: 是`
4. 用户可随时说「取消预授权」恢复逐轮确认

展示 WritePlan 末尾固定提示：

> 请回复 **确认**（或 按计划执行 / LGTM）后开始写入。多轮可回复 **确认预授权**。`全部推荐` 只收齐答题；写盘仍须本确认。

- **硬闸**：确认前（及未预授权时）先过本文件闸门词表，再 Write / StrReplace / 删除目标仓 harness 文件
- audit：只输出报告
- 写入仅限已确认的 `Q_TARGET_ROOT`
- `resume` / 半成品：`params.on_exists=skip`（见 [resume.md](resume.md)）
- pipeline：见 [pipeline.md](pipeline.md)

## Windows JSON 传参（gotcha SSOT）

`questions-next` / answers / score 等：写 **UTF-8 无 BOM** JSON 文件，再把**路径**传给 node（勿用 PowerShell `node -e` 内联 JSON）。  
他处（SKILL / pipeline / fill-score）只指针到此，不复述。

## 写入方式

确认后优先跑 `scripts/render.mjs`（字段与展开语义以 `--help` 为准）。要点：

- 显式：`--root` + `--params`（占位符 + `files[]`）
- 展开：params 含 `ladder` / `domains` / `agents_variant` / `on_exists` 等，可 `--manifest` 或 `expandFromManifest: true`
- `include_optional` 必须是可选文件 ID **数组**（如 `["rule-14"]`）；`Q_RULE14=true` → 该数组；缺省 `[]`
- `module_agents_template: "spring"` → 分册用 Spring 变体（`Q_MODULE_AGENTS`；0.4.0+）
- 动作语义：[conflict-policy.md](conflict-policy.md)；`.cursor/mcp.json`：非 fill-mcp **保留**已有文件
- merge 的 Markdown/MDC 为 H2 章节级合并；WritePlan 文件表对 `action=merge` 的 md/mdc 须列「将追加章节」（取 `--dry-run` 日志 `mergePreview`，0.4.0+）
- 脚本失败 → 可手工 Write，移交注明原因

## 占位符渲染

写入前替换 manifest 所列占位符。未回答的改写为 `TODO(harness-eng): …`，并列入移交。  
安全预填规则见 [prefill.md](prefill.md)。

## 写后自检

按 [ladder.md](ladder.md) 对应阶梯勾选；失败项列出补救，不假装成功。  
确认 `docs/harness-eng/harness-meta.yaml` 已写入且 `skill_version` / `ladder` / `domains` 正确（读侧可回退遗留 `.cursor/`）。

## 移交 TODO（分级）

### P0 — 空转阻断（优先）

1. 核实根 AGENTS「Commands」与 Critical 红线（预填骨架须人工跑通）
2. 若 `S_SECRETS_LEAK`：人工迁出/脱敏 README 或含密 yml（提交物不含真密）
3. 确认写入根路径无误

### P1 — 契约可协作

4. 为每个启用契约域补充首个 `01-*.md` 真相，或跑 `seed-truths`
5. 填写 Never do **域**红线（只写本仓真实约束）

### P2 — 知识回流

6. 按域追加真实 `Pn`（有翻车后再写）
7. 将稳定高频翻车压缩进 `00` 薄片表
