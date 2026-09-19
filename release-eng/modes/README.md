# modes 索引

release-eng 模式与仪式规格。热路径先读 [../AGENT-INDEX.md](../AGENT-INDEX.md)，不要扫完全部文件。  
入口：[../SKILL.md](../SKILL.md)。薄 CLI：`node scripts/release.mjs`（`modes` / 脚本转发）。

| 规格 | 用途 |
|---|---|
| [prepare.md](prepare.md) · [resume.md](resume.md) | 新建发版单 / 同版本身份续跑 |
| [audit.md](audit.md) · [seal.md](seal.md) | 只读体检 / 已上线归档 |
| [gates-common.md](gates-common.md) · [git-gates.md](git-gates.md) | 共享前缀·首问 / fetch·push-gate |
| [freeze.md](freeze.md) · [ai-track.md](ai-track.md) | 定版采集 / 双轨研判 AI |
| [questions.md](questions.md) · [recommended.md](recommended.md) | 问卷 / 全部推荐 |
| [write-plan.md](write-plan.md) · [idempotency.md](idempotency.md) | 确认闸·draft-md / 幂等 |
| [bootstrap.md](bootstrap.md) | 骨架种子（fixtures → docs/releases） |
