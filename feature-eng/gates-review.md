# gates-review — 环间 L2 语义审核（SSOT）

本页是 **L2 语义闸**标准。形状勾选见 [artifacts.md](artifacts.md)（**L1**）。`advance` 须 **L1 ∧ L2** 都过才写盘推进（桥类环节见下例外）。

控制器只调度审核、读结论；**不**让审核员代写 `progress.yaml` / 改领域正文。

## 调起方式（`progress.review_policy`）

| 值 | 行为 |
|---|---|
| **`subagent`**（默认） | 开 Task/子代理；只传产物路径 + 本页当前离开环节节 + 禁止清单。无 Task 能力 → 降级 `inline` |
| **`inline`** | 本会话换「审核帽」：只读标准与产物，不戴厨师帽、不写业务 |

可选预留：`defaults.review_skill`（0.2.2 **不**强制；未配置则用本页内置审核指令）。

## 审核输入（指针）

```text
【L2 审核指针】
- slug / runs: …
- 离开环节: <stage 中文名 + 键>
- 产物路径: <厨师回报列表>
- 标准: gates-review.md「离开 <stage>」节
- 禁止: 改 progress.yaml / links.md / 改 Spec·Plan·代码正文；仅可写 review 文件
```

## 审核输出（固定）

落盘 `docs/superpowers/runs/<slug>/review-<stage>.md`：

```markdown
# L2 review — <stage> — <slug>

- result: pass | fail
- summary: …
- defects:（fail 时逐条；pass 可空）
  - …
```

`links.md` 由 advance 回写该路径。`result=fail` → advance **不**推进 stage。

## 离开各环：语义必过项

审核员只 Read 本离开环对应小节（勿整页通读）。

### 离开 grill

- [ ] 共享理解足以进入设计（核心未决已清空或显式记为推迟）
- [ ] 若有术语/ADR 草稿：路径可指认且未写入仓库根 `CONTEXT.md`

### 离开 design

- [ ] 用户确认范围覆盖已选方案关键点（范围/取舍可指认）
- [ ] 未越界落盘 Spec / 调起 writing-plans / 写业务代码（截断成立）

### 离开 domain（仅 `domain=entered`）

- [ ] 若有 ADR：决策确属不可逆/边界级，而非把普通实现细节写成 ADR
- [ ] 若有术语：`context-delta.md`（或 Spec 术语节）与设计一致；**未**写根 `CONTEXT.md`

### 离开 spec（仅 F）

- [ ] 验收标准可测（非空话）
- [ ] 与设计确认结论一致（无暗改范围）

### 离开 plan

- [ ] 开干三问语义成立：依赖无环、契约变更在首批、每任务有可测验收
- [ ] 任务拆分可支撑实现（非单条「做完所有事」）

### 离开 proto（仅 `proto=entered`）

- [ ] 主路径交互可走通（说明或原型可指认）
- [ ] 用户原型确认可指认

### 离开 testdesign（仅 F）

- [ ] Spec 每条验收至少映射 1 条用例（覆盖自查成立）
- [ ] 无单测/实现级步骤冒充集成用例

### 离开 implement

- [ ] 落盘代码范围与本主题一致（可指认路径）
- [ ] 单测存在，或「无单测」接受记录可指认

### 离开 gate

- [ ] 语义轨无未决 blocker（或 blocker 列表为空且用户已知晓）

### 离开 verify（仅 F）

- [ ] 每条用例结论与证据匹配（非空勾）
- [ ] 环境证据真实可指认（非「代码已写」冒充）

## 桥类与闸类例外

| 环节 | L2 |
|---|---|
| `triage` / `domain-bridge` / `proto-bridge` / `pre-impl` / `handoff` | 无完整 L2；控制器按各自文件规则即可 |
| 用户硬闸（设计确认、开干、entered 等） | L2 pass 后仍须 [gates-common.md](gates-common.md) 短确认卡片；**不**由审核员代 yes |

## 硬约束

- 审核员不得推进 `stage`、不得写 gates 时间戳。
- 伪造 `review-*.md` 的 pass = 跳过硬闸，禁止。
- L1 未过则不必跑 L2。
