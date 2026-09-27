# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读入口：[README.md](README.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。

**拓扑（0.2.13-dev）**：`modes/` 仅 7 个用户入口 · `modes/specs/` 4 本契约手册 · `config/` · `templates/` · `scripts/`。

## 必读（写盘 / 调起前）≤6 文件

| # | 何时 | Read |
|---|---|---|
| 1 | **边界 / 写盘权责** | [SKILL.md](SKILL.md)「控制器边界」 |
| 2 | 环节表 + 绑定 lookup / 截断 | [flow.md](modes/specs/flow.md) |
| 3 | L1 + L2 + 硬闸 | [gates.md](modes/specs/gates.md) |
| 4 | 过闸写盘与主动调起 | [advance.md](modes/advance.md) |
| 5 | **本回合模式**（点名后再读） | [start](modes/start.md) / [resume](modes/resume.md) / [close](modes/close.md) / [init](modes/init.md) / [rebind](modes/rebind.md) / [status](modes/status.md) 之一 |
| 6 | （进桥 / 交接时） | [bridges.md](modes/specs/bridges.md) · [handoff.md](modes/specs/handoff.md) |

## 按需

| 何时 | Read / 跑 |
|---|---|
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 推荐包 / minimal | [stage-bindings.example.yaml](config/stage-bindings.example.yaml) · [stage-bindings.minimal.yaml](config/stage-bindings.minimal.yaml) |
| 模板 | `templates/` |
| modes 索引 | [modes/README.md](modes/README.md) · `node scripts/feature.mjs modes` |
| 闸检 / 收口 | `node scripts/feature.mjs gate-evidence …` · `close-check …` |
| 版本 / 烟测 | [CHANGELOG.md](CHANGELOG.md) · [VERIFY.md](VERIFY.md) · `node scripts/selfcheck.mjs` |

## 写盘纪律（一行）

控制器只写 `progress.yaml` / `回链.md` / runs 骨架 / gates 时间戳；领域正文与业务代码交给绑定子 skill。**禁止**写仓库根 `CONTEXT.md`。自动调起 ≠ 跳过硬闸。
