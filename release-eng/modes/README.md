# modes 索引

release-eng 模式与仪式规格一览。热路径先读 [../AGENT-INDEX.md](../AGENT-INDEX.md)。  
入口：[../SKILL.md](../SKILL.md)。CLI：`node scripts/release.mjs`。  
命令前缀：示例写 `.cursor/skills/release-eng/scripts/`；本仓自测用 `release-eng/scripts/`。

| 规格 | 用途 |
|---|---|
| [prepare.md](prepare.md) | 半自动新建/刷新发版单；含 cancel |
| [resume.md](resume.md) | **已并入 prepare**（保留指引页） |
| [audit.md](audit.md) | 只读体检 |
| [seal.md](seal.md) | 已上线归档 |
| [gates-common.md](gates-common.md) | 共享前缀·首问 |
| [git-gates.md](git-gates.md) | fetch·push-gate |
| [freeze.md](freeze.md) | 定版采集 |
| [ai-track.md](ai-track.md) | 双轨研判 AI（默认跳过） |
| [questions.md](questions.md) | 问卷 |
| [recommended.md](recommended.md) | 全部推荐 |
| [write-plan.md](write-plan.md) | 确认闸·draft-md |
| [idempotency.md](idempotency.md) | 幂等 |
| [bootstrap.md](bootstrap.md) | 骨架种子 |
| [conventions.md](conventions.md) | 约定 SSOT |
