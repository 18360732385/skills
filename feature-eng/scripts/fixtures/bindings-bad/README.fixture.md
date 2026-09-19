# bindings-bad fixture

**负例** stage-bindings 样本，供 selfcheck / 绑定形状校验拒绝。  
**不是**入库 SSOT（真实绑定仍是 `config/stage-bindings.yaml`）。

| 文件 | 故意错误 |
|---|---|
| `stage-bindings.null-skill.yaml` | `implement.skill: null`（预检 B：未绑定） |
| `stage-bindings.missing-key.yaml` | 缺 `diagnose` 键（预检 A：无此环节键） |

勿把本目录拷进消费仓当正式绑定。
