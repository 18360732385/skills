# handoff — 交接旁路

会话过长、AI 变迟钝、中断续跑、换工具时触发。控制器自身执行，不绑子 skill。

## 何时

- 用户主动要求交接
- resume 时发现上下文已不可恢复
- 单主题跨多次会话推进

## 压缩字段（写入 `runs/<slug>/handoff.md`）

```markdown
# handoff — <slug> — <日期>

- path: spike|bounded|full
- stage: <当前环节>
- 已完成：<环节 + 产物路径列表>
- 未决：<未回答的问题 / 未过的闸>
- 下一步：<resume 后第一个动作>
- 产物指针：ADR / Spec / Plan / Proto / testcases / test-report 路径
```

## 规则

- 只压缩、不决策；未决项如实列出，不替用户拍板。
- 写完后提示用户：新会话点名 `feature-eng resume` 续跑（只看进度则点名 skill 即可，未指定走 status）。
- handoff **不**替代 close；主题完成仍走环 11。
