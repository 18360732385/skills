# Agent 热路径索引

开干先读本页，再按行 Read。**不要**扫根目录全部 md。  
人读入口：[README.md](README.md)。一页纸：[QUICKSTART.md](QUICKSTART.md)。验收：[VERIFY.md](VERIFY.md)。烟测：`node scripts/selfcheck.mjs`。

**拓扑（0.2.4）**：根目录模式 md（init/rebind/start/resume/status/advance/close）· `config/` 绑定 SSOT · `templates/` 过程态骨架。控制器本身不做具体开发。

## 必读（写盘 / 调起前）≤8

| 何时 | Read / 跑 |
|---|---|
| **边界 / 写盘权责**（调度员不进厨房） | [SKILL.md](SKILL.md)「控制器边界」 |
| 环节表 / 裁剪 / runs 目录 | [stages.md](stages.md) |
| 绑定 lookup / invoke / 截断 / 指针卡片 | [binding.md](binding.md) · [config/stage-bindings.yaml](config/stage-bindings.yaml) · [config/truncate-contracts.yaml](config/truncate-contracts.yaml) |
| L1 产物勾选 | [artifacts.md](artifacts.md) |
| L2 语义审核 | [gates-review.md](gates-review.md) |
| 硬闸短确认 | [gates-common.md](gates-common.md) |
| 过闸后写盘与主动调起 | [advance.md](advance.md) |
| 版本 / 验收 | [CHANGELOG.md](CHANGELOG.md) · [VERIFY.md](VERIFY.md) · `node scripts/selfcheck.mjs` |

## 按需（点名后再读）

| 何时 | Read |
|---|---|
| 首次绑定 / 改绑 | [init.md](init.md) · [rebind.md](rebind.md) |
| 一页纸 | [QUICKSTART.md](QUICKSTART.md) |
| 新主题开工 / 续跑 / 状态 | [start.md](start.md) · [resume.md](resume.md) · [status.md](status.md) · `node scripts/status-scan.mjs` |
| 收口归档 | [close.md](close.md) |
| 定稿桥 / Proto 桥 | [domain-bridge.md](domain-bridge.md) · [proto-bridge.md](proto-bridge.md) |
| 交接 | [handoff.md](handoff.md) |
| 推荐包示例 | [config/stage-bindings.example.yaml](config/stage-bindings.example.yaml) |
| 模板 | `templates/`（progress.yaml · 回链.md · 测试用例.md · 测试报告.md · runs-README.md） |
| 清单权威号 | [`_meta/manifest.yaml`](_meta/manifest.yaml) |

## 写盘纪律（一行）

控制器只写 `progress.yaml` / `回链.md` / runs 骨架 / gates 时间戳；领域正文与业务代码交给绑定子 skill。**禁止**写仓库根 `CONTEXT.md`（术语走 `术语增量.md`）。自动调起 ≠ 跳过硬闸。
