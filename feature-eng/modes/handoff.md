# handoff — 交接旁路

会话过长、AI 变迟钝、中断续跑、换工具时触发。控制器自身执行，不绑子 skill。

## 何时

- 用户主动要求交接
- resume 时发现上下文已不可恢复
- 单主题跨多次会话推进
- **主动提议**：已完成环数 ≥ 5；或上下文接近上限；或即将进入长环（如 implement）

主动提议话术示例：「建议先写 `交接.md` 并新会话 `feature-eng resume`，避免后续环丢闸。」用户拒可继续。

## 压缩字段（写入 `docs/runs/active/<slug>/交接.md`）

```markdown
# 交接 — <slug> — <日期>

- 路径 path: spike|bounded|full
- 仪式 run_mode / invoke / handoff_policy / review_policy: …
- 当前环 stage: <环节键 + 中文名>
- 已完成：<环节 + 产物路径列表>
- 未决：<未回答的问题 / 未过的闸>
- 下一步：<resume 后第一个动作>
- 产物指针：ADR / Spec / Plan / Proto / 测试用例 / 测试报告 路径
```

## 规则

- 只压缩、不决策；未决项如实列出。
- 写完后提示：新会话点名 `feature-eng resume`。
- handoff **不**替代 close。
- `交接.md` 由控制器写；不交给子 skill。
