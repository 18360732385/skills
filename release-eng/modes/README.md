# modes 索引

release-eng 模式与仪式规格一览。热路径先读 [../AGENT-INDEX.md](../AGENT-INDEX.md)（唯一路由表），不要扫完全部文件。  
入口：[../SKILL.md](../SKILL.md)。薄 CLI：`node scripts/release.mjs`（`modes` / 脚本转发）。  
命令前缀：示例命令统一写 `.cursor/skills/release-eng/scripts/`；在本仓自测时替换为 `release-eng/scripts/`，装到 `.agents/skills/` 等其它位置时按实际安装路径替换前缀。

| 规格 | 用途 |
|---|---|
| [prepare.md](prepare.md) | 新建发版单 |
| [resume.md](resume.md) | 同版本身份续跑 |
| [audit.md](audit.md) | 只读体检 |
| [seal.md](seal.md) | 已上线归档 |
| [gates-common.md](gates-common.md) | 共享前缀·首问 |
| [git-gates.md](git-gates.md) | fetch·push-gate |
| [freeze.md](freeze.md) | 定版采集 |
| [ai-track.md](ai-track.md) | 双轨研判 AI |
| [questions.md](questions.md) | 问卷 |
| [recommended.md](recommended.md) | 全部推荐 |
| [write-plan.md](write-plan.md) | 确认闸·draft-md |
| [idempotency.md](idempotency.md) | 幂等 |
| [bootstrap.md](bootstrap.md) | 骨架种子（fixtures → docs/releases） |
| [conventions.md](conventions.md) | 约定 SSOT（日期算法·身份归一化·目录包·截断5·mergeSources·prod·SQL序·密文·repo-profile·逾期书面跳过） |
