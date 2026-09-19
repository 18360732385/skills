# docs/runs — feature-eng 过程态索引

> **本目录不是契约 SSOT。** 与 `docs/superpowers/` 平级：superpowers 管 Spec/Plan 语料；本目录管主题过程态。  
> 进度真相以各主题 `progress.yaml` 为准；本页仅导航。

## 目录约定

| 目录 | 含义 |
|---|---|
| `active/<slug>/` | 进行中 |
| `archive/<slug>/` | 已收口（close 后从 active 移入） |

slug：`YYYY-MM-DD-<主题短名>`。

## 主题内常用文件

| 文件 | 说明 |
|---|---|
| `progress.yaml` | 进度 SSOT（机读） |
| `回链.md` | 产物指针 |
| `测试用例.md` / `测试报告.md` | 仅 F |
| `交接.md` | 会话交接 |
| `术语增量.md` / `设计笔记.md` / `门禁清单.md` | 按需 |
| `审核-<stage>.md` | L2 环间审核（stage 为英文键） |

## 进行中

| 日期 | 主题 | slug | 当前环 | 路径 |
|---|---|---|---|---|
| 2026-09-19 | fixture 演示 | 2026-09-19-fixture-demo | triage | bounded |

已归档主题在 `archive/`；默认 resume/status **只扫 active/**。

## 旧路径兼容

若仍存在 `docs/superpowers/runs/<slug>/`：resume/status 提示迁到 `docs/runs/active/<slug>/`（须用户确认后再搬，勿静默破坏）。
