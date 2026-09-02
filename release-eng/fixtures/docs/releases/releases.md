# docs/releases — 发版管理索引

> **本目录是发版过程域，不是运行时契约 SSOT。**  
> 冲突时以 `docs/func|api|db|redis|jobs` 真相 + 代码为准；本处只引用路径与上线清单。  
> 仪式 Skill：[`release-eng`](../../.cursor/skills/release-eng/SKILL.md)（版本见 skill [`_meta/manifest.yaml`](../../.cursor/skills/release-eng/_meta/manifest.yaml)）。

## 读文档说明

- **索引**：本文件（进行中导航）+ [`ARCHIVE.md`](./ARCHIVE.md)（已上线）  
- **真相**：`notes/` 下单次发版单；已上线在 `archive/`  
- **模板**：[`templates/release-note-template.md`](./templates/release-note-template.md)  
- **禁止**在本索引展开 Git commit 全文或配置密文正文  

## 状态枚举

| 状态 | 含义 | 存放 |
|---|---|---|
| 准备中 | 问卷未完或未定版 | `notes/` |
| 已定版 | 已冻结 Git 定版段，待上线 | `notes/` |
| 已上线 | `release-eng` seal 完成 | `archive/` |
| 已取消 | 终止本版 | `notes/` 或 archive（注明） |

## 分支约定

- 每次运行 skill **首问**：`发版日期`（【推荐】≥提问日+2 的第一个周四；独立元信息字段）+ 发版分支 / 基线分支（默认 `release` / `main`）  
- 发版单路径：`notes/<slug>/<slug>.md`（同名目录包；`<slug>` = 发版分支名归一化：去 `origin/`、`/` → `-`；含本版新增 `sql/`/`config/` 附属拷贝与任务汇总 `jobs/README.md`（不含 candidates））  
- **`首次发版`**：基线可为 **`无`**；定版内容取自发版分支全量（提交历史 + 树路径），push-gate 只验发版分支未推送  
- 定版前：`git fetch`；本地相对 `origin/<分支>` **有未推送提交则 push-gate 失败并中止定版**  
- Git 提交列表：`截断5`（前 3 后 2，hash 前 8 位）；合并来源按分支去重全量（`origin/` 归一；来源分支功能一句话中文）；时间 Asia/Shanghai；完整记录给 GitLab 链接。SQL / 配置 / 定时任务目标 profile = **`prod`**；yml 配置按 YAML（注释在键上一行 `#`）；包内附属为相对 md 链接  

## 密文

发版单「配置项」章**允许**写入密文；可 commit。仓库其它路径亦不禁止存放密钥；本索引仍不展开密文正文。

## 进行中

| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |
|---|---|---|---|---|---|
| — | （暂无） | — | — | — | — |

已上线 → [`ARCHIVE.md`](./ARCHIVE.md)。

## 变更记录（索引级）

| 日期 | 事项及说明 | 状态 |
|---|---|---|
| 2026-08-21 | release-eng **0.3.9**：Asia/Shanghai；摘要←提交；一/1 编号；来源分支功能；路径+贡献者；yml YAML；包内 md 链接 | 已生效 |
| 2026-08-20 | release-eng **0.3.8**：发版日期≥提问日+2 首个周四；截断5；mergeSources；目录包 | 已生效 |
| （bootstrap） | 自 release-eng skill fixtures 初始化骨架（含发版日期/截断5/prod/SQL序/目录包约定） | 已生效 |
