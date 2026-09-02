# release-eng

发版仪式 skill（**仅用户点名**；`disable-model-invocation: true`）。

## 版本

权威号只认 [`_meta/manifest.yaml`](_meta/manifest.yaml) 的 `version`。  
[CHANGELOG.md](CHANGELOG.md) 为历史；[`docs/releases/releases.md`](../../../docs/releases/releases.md) 过程索引只**引用** manifest，不另钉号。  
`0.3.x`：**补丁序**（权威号见 manifest），勿用本轮改动跳升 `0.4.0`。

## 可移植性

- **首发仓**：`c-be-sms-ai`（`source_repo` 见 manifest）。  
- **本仓可用**：skill + `fixtures/docs/releases/` + `scripts/` 已齐；bootstrap 空仓从 fixtures 复制。  
- **迁到他仓**：须整目录拷贝（含 `fixtures/`、`scripts/`、模式 md）；目标仓无 `docs/releases/` 时靠 fixtures 种子。  
- **非 harness-eng land**：无 `VERIFY.md` / selfcheck；不对齐 harness 自动 land 流水线。跨仓推广靠人工拷贝 + 点名仪式，不靠 harness 编排。

## 入口

见 [SKILL.md](SKILL.md)。

## `首次发版`

基线填 **`无`**（脚本 `--baseline none`）：push-gate 只验发版分支；freeze 的 Git 四表取全量，**上线候选不扫整树**（`inventory` + 问卷起迁）。增量发版仍用 `release` / `main`（或你确认的基线）走 **键级diff**。

## 发版日期与落单约定

- 首问 **`发版日期`**【推荐】≥提问日+2 的第一个周四（独立元信息字段）；目录包 `notes/<slug>/`，`<slug>` = **发版分支名归一化**（去 `origin/`、`/` → `-`；内含同名 `.md` + 本版新增 `sql/`/`config/` + 任务汇总 `jobs/README.md`）  
- Git 提交列表 **`截断5`**（前 3 后 2，hash 前 8 位）+ GitLab 链接；合并来源按分支**去重全量**（`origin/` 归一；「来源分支功能」一句话中文）；时间 **Asia/Shanghai**；上线摘要 1～5 项**分支级聚合**并入元信息；一级标题「一、二、三…」；yml 配置按 YAML 且注释在键上一行 `#`；包内附属为相对 md 链接；SQL/配置/任务目标 **`prod`**；SQL 按 **`SQL序`**  
- 增量 **`键级diff`** + **`jobs交叉`** + **`draft`** + **`prior去重`**；WritePlan **`draft-md`**；落单 **`note-merge`**；seal **`seal-check`**  
