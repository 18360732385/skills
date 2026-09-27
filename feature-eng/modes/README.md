# modes 索引

feature-eng：**根目录 = 用户入口**；**specs/ = 契约手册**。热路径先读 [../AGENT-INDEX.md](../AGENT-INDEX.md)。  
边界见 [../SKILL.md](../SKILL.md)。薄 CLI：`node scripts/feature.mjs modes`。

## 入口（点名）

| 文件 | 用途 |
|---|---|
| [init.md](init.md) · [rebind.md](rebind.md) | 首次绑定 / 改绑 |
| [start.md](start.md) · [resume.md](resume.md) · [status.md](status.md) | 开工 / 续跑 / 状态 |
| [advance.md](advance.md) · [close.md](close.md) | 过闸推进 / 收口归档 |

## 契约（specs/）

| 文件 | 用途 | 合并自 |
|---|---|---|
| [specs/flow.md](specs/flow.md) | 环节表 + 绑定 lookup / invoke / 截断 | stages + binding |
| [specs/gates.md](specs/gates.md) | L1 产物 + L2 审核 + 硬闸 | artifacts + gates-review + gates-common |
| [specs/bridges.md](specs/bridges.md) | 定稿桥 + Proto 桥 | domain-bridge + proto-bridge |
| [specs/handoff.md](specs/handoff.md) | 交接 | handoff |
