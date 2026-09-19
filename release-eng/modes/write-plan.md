# WritePlan 与确认闸门（release-eng）

> **词表 SSOT**：本文件（有意与 harness-eng `write-plan.md` 分叉；确认词对齐、场景不同）。不共享外部单文件。

## 展示格式

顺序强制：① 白话摘要 → ② 技术摘要 → ③ 路径表 → ④ **`draft` 预览**（三章表）→ ⑤ Git 定版摘要（截断5 / mergeSources / GitLab）。

### 白话摘要（强制）

```text
白话摘要:
- 模式: prepare | resume | seal
- 发版日期: YYYY-MM-DD（首问确认；独立日期字段，不拼入目录名）
- 分支对: <发版> vs <基线|无（首次发版）>（origin 优先）
- 版本身份: <slug>（= 发版分支名归一化：去 origin/ 前缀、/ → -）
- 本轮: 新建 | 合并刷新自动段 | 归档
- Git 表: 提交截断5（前3后2、hash 前 8 位）；合并来源按分支去重（origin/ 归一）、来源分支功能一句话（完整见 GitLab 链接）；时区 Asia/Shanghai
- 摘要: 元信息内 1～5 项（分支级聚合）；配置 yml 键上一行 `#` 中文注释
- 目录包: notes/{identity}/（md + sql/config 本版新增 + jobs/README.md 汇总清单；附属为相对 md 链接）
- 目标 profile: prod（SQL / 配置 / 定时任务）；yml 配置按 YAML
- draft: sql/config/jobs（未上线）；suppressed 行数（baseline/layer）；aiTrack: stub|ready|filled|skipped；aiNoise 默认不勾数
- 上线摘要: ← 分支级聚合（可人工补）
- prior: archive 并集（artifacts.json 优先）或 none；可 prior-since
- 密文: 配置项章 / artifacts.json 将写入 N 个键（列出键名；值是否来自文件；**允许密文**）
- push-gate: 已通过
```

### 技术摘要

```text
目标根: …
on_exists: merge | skip | fail
发版单路径: docs/releases/notes/<slug>/<slug>.md（slug = 发版分支名归一化）
索引: docs/releases/releases.md
预授权: 是|否
freeze: --format draft-md（本轮预览来源）
```

| 目标路径 | 动作 | 说明 |
|---|---|---|
| `docs/releases/notes/{id}/{id}.md` | create / merge | 【推荐】`release-note-merge.mjs`（← `draft` + Git 定版 + 附属拷贝） |
| `docs/releases/notes/{id}/artifacts.json` | create / refresh | 发版制品清单 SSOT（含 aiTrack；允许密文） |
| `docs/releases/notes/{id}/{sql,config}/` | create / refresh | 自 head 拷贝本版 **新增** 制品（← draft；不含 candidates） |
| `docs/releases/notes/{id}/jobs/README.md` | create / refresh | 任务汇总清单（code/名称/cron/默认参数/引用链接；不再逐份拷贝真相） |
| `docs/releases/releases.md` | merge | 索引行 |
| `docs/releases/archive/{id}/` | git mv 整夹 | 仅 seal |

### 写盘（prepare/resume 确认后）

【推荐】：

```bash
node .cursor/skills/release-eng/scripts/release-note-merge.mjs --root . --note docs/releases/notes/<slug>/<slug>.md --base <baseRef> --head <headRef> --identity <slug> --release-date YYYY-MM-DD --release-branch <发版分支> --owner <负责人>
```

`--dry-run` 只报告将写字节与 draft/bundle 行数。手工落单须与 `draft-md` 预览一致。

### `draft` 预览（强制 · prepare/resume）

【推荐】在展示 WritePlan 前跑（与本轮 freeze 相同 base/head/prior）：

```bash
node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --base <baseRef> --head <headRef> --format draft-md
# 首次发版：加 --first-release（layered draft，非空）
# 若已 merge AI 轨：对带 aiTrack 的 freeze JSON 用 toDraftPreview 或直接展示 aiNoise 摘要
```

> 一屏摘要（白话摘要主输入）：`--format summary`；落盘大 JSON 用 `--out <file>`（PowerShell 必用，规避 UTF-16 BOM）。

将命令 stdout **原样贴进**本轮 WritePlan（含「数据库与 SQL / 配置项 / 定时任务 / draftSuppressed 摘要」）。  

约束：

- 落单内容以预览中 **`draft.*`** 为准（目标 profile=`prod`）；**勿**把 `draftSuppressed` 写入正文除非用户明示拉回  
- 配置「说明待补」条数 > 0：白话摘要须点名；未补则标「待定」或请用户补后再确认  
- seal 模式可省略 draft 预览（只展示路径表与状态变更）  

### Git 定版摘要

贴截断后的提交/合并来源要点 + GitLab 链接（来自 freeze md/json 的 `*Display` / `gitlabUrl`）。

## 确认闸门（强制）

写盘当且仅当用户回复下列**任一**：

`按计划执行` · `确认` · `确认写入` · `执行 WritePlan` · `LGTM`

### 预授权

用户回复 **`确认预授权`** 或 **`预授权后续写盘`**：

1. 本轮 WritePlan 仍须完整确认后写盘  
2. 同会话后续 `resume` / 同 slug 刷新：自动写盘  
3. 「取消预授权」后恢复逐轮确认  

> 请回复 **确认**（或 按计划执行 / LGTM）后开始写入。多轮可回复 **确认预授权**。`全部推荐` 只收齐答题（[recommended.md](recommended.md)）。

## 模式边界

- **audit**：交付物仅为报告（[audit.md](audit.md) Done）；可用 `--format audit-json`  
- **push-gate 未通过**：交付物为 git-gates 中止 Done（[gates-common.md](gates-common.md) 出口）；待通过后再出定版 WritePlan  
