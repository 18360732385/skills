# docs/harness-eng — Harness 施工现场

> **不是**契约 SSOT（契约见 `docs/func|api|db|redis`）。  
> **不是**知识回流库（踩坑 / 架构见 `docs/agent-kb/`）。  
> 本目录只放 **harness-eng 施工产物**：评分快照、可视化报告、可选进度与历史。

## 文件约定

| 路径 | 用途 |
|---|---|
| `report-latest.html` | Dashboard v2 施工指挥台（决策 / 诊断 / 任务 / 趋势台） |
| `score-latest.json` | 最近一次 fill-score 机器可读结果 |
| `score-history.jsonl` | 历次评分追加日志（0.2.14+；供趋势台） |
| `progress.yaml` | 填充进度状态（0.2.15+；inventory/auto/score 可写） |
| `progress.yaml` | 可选：分片填充进度（经确认写入） |
| `history/` | 可选：带时间戳的历史 HTML 报告 |
| `README.md` | 本说明 |

## 兼容

旧版默认写在 `docs/agent-kb/harness-report-latest.html`。  
**0.2.12+** 新写入改到本目录；**0.2.13+** Dashboard v2；**0.2.14+** `score-history.jsonl`；**0.2.15+** `progress.yaml` / `suggest_upgrade`。

## 禁止

- 把本目录当成契约真相或 pitfalls 台账
- 写入含密码的 MCP / 连接串（评分与报告不含密文）