# prepare（主路径）

## 步骤

1. [gates-common.md](gates-common.md)（含首问 **`发版日期`**【推荐】≥提问日+2 的第一个周四 + 分支对）  
   - 若 git-gates **Done（中止）** → 本模式结束（勿继续下列步骤）  
2. [freeze.md](freeze.md) — 【推荐】`release-freeze.mjs`；有基线用 push-gate 的 `baseRef`/`headRef`（**键级diff** + **双源**）；**`首次发版`** 用 `hints.freezeArgs`（`--first-release --head`，**layered**）；写入发版单时提交列表用 **`截断5`**、合并来源 **`mergeSources` 去重全量**  
3. [ai-track.md](ai-track.md) — 【推荐】`release-ai-track.mjs` 出 prompt → 仪式内模型填 `aiRanked`/`aiNoise` → merge（失败可跳过）  
4. 版本身份 `<slug>` = **发版分支名归一化**（去 `origin/`、`/` → `-`；与 `发版日期` 解耦；同路径 → [idempotency.md](idempotency.md)）  
5. [questions.md](questions.md) 至其 Done（增量用 `draft`/`configKeys`/`jobKeys`；首次用分层 draft + `inventory`；目标 **`prod`**；尊重 `aiNoise` 默认不勾）  
6. [write-plan.md](write-plan.md)：【推荐】同参再跑 `--format draft-md` 贴进预览 → 确认词（或预授权）  
7. 【推荐】`release-note-merge.mjs`（优先 `--freeze-json` 带 aiTrack 的 JSON）将 freeze **`draft`** + Git 定版写入**目录包**自动段 + **`artifacts.json`**，并拷贝本版新增的 `sql/`/`config/`/`jobs/`（← draft；不含 candidates；`--dry-run` 可先看）。**勿**默认写入 `draftSuppressed`；状态 `已定版`；回写 [releases.md](../../../docs/releases/releases.md)  

```bash
node .cursor/skills/release-eng/scripts/release-note-merge.mjs --root . --note docs/releases/notes/<slug>/<slug>.md --freeze-json /tmp/freeze-with-ai.json --identity <slug> --release-date YYYY-MM-DD --release-branch <发版分支> --owner <负责人>
```

## Done

### 中止（gates-common → git-gates Done（中止））

- [ ] 未执行 freeze / 问卷 / 定版 WritePlan / 写盘  
- [ ] 用户可见中止交付物（见 git-gates）  

### 通过并定版

- [ ] `docs/releases/notes/<slug>/<slug>.md` 存在且含完整「Git 定版」二表（提交 `截断5` 前3后2 + hash 前 8 位；合并来源按分支去重、来源分支功能一句话中文 + GitLab 提示；Asia/Shanghai）  
- [ ] 元信息内上线内容摘要 1～5 项（← 分支级聚合业务短句）  
- [ ] 同目录含本版新增的 `sql/` / `config/`、任务汇总 `jobs/README.md`（非逐份拷贝真相）、**`artifacts.json`** 与「包内附属文件」章（相对 md 链接）  
- [ ] 元信息含已确认的 `发版日期`；目录/文件名 = 发版分支名归一化（去 `origin/`、`/` → `-`）；定版时间为中国时区  
- [ ] `releases.md` 进行中表有对应行（版本身份、分支对、状态、路径、负责人）  
- [ ] 【推荐】已用 `release-note-merge.mjs` 写入自动段与 artifacts（或等价手工且与 `draft` 一致）  
- [ ] WritePlan 已含 **`draft-md` 预览**（或等价三章表）；落单与 `draft` 一致；yml 配置为 YAML 展示  
- [ ] 数据库与 SQL：增量按 `SQL序` / `draft.sql`；首次已确认起迁（或「无」）；目标 profile=`prod`  
- [ ] 配置项章：← `draft.config`（yml 按 YAML；说明注释在键上一行；**允许密文**）；目标 profile=`prod`；有密文则键名已在白话摘要列出  
- [ ] 定时任务：← `draft.jobs` / `jobsHits`；有变更时目标 profile=`prod`  
- [ ] 涉及服务与模块说明来自 AGENTS/README 一句话  
- [ ] `draftSuppressed` 未误写入正文（除非用户明示拉回）  
