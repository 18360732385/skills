# 骨架 bootstrap（release-eng）

`prepare` / `resume` / `seal` 开始时检查（`audit` 默认只报告缺失，不创建）。

## SSOT

| 优先级 | 来源 |
|---|---|
| 1（已存在） | 目标仓路径已有 → **skip**（保留已有正文与发版单） |
| 2（缺失） | 本 skill [`fixtures/docs/releases/`](fixtures/docs/releases/) → **复制**到目标仓对应路径 |

`notes/`、`archive/` 缺失时建空目录（fixture 含 `.gitkeep`）。  
仓内已有文件是日常正文 SSOT；fixture 只作空仓/缺路径种子，不覆盖已有。

## 步骤

1. 按下表逐路径检查  
2. 缺失则从 skill fixture 复制（或建目录）  
3. 向用户打印：`bootstrap: 已创建 …` 或 `bootstrap: 已齐全，跳过`  

## Done

- [ ] 下表路径均存在（本轮 create 或 skip）  

| 路径 |
|---|
| `docs/releases/releases.md` |
| `docs/releases/templates/release-note-template.md` |
| `docs/releases/notes/` |
| `docs/releases/archive/` |
| `docs/releases/ARCHIVE.md` |

- [ ] 已打印 bootstrap 结果句  
- [ ] 发版单正文仍走 WritePlan（骨架创建本身不经 WritePlan）  
- [ ] 若 fixture 自身缺失：停止并说明，勿用空文件冒充模板  
