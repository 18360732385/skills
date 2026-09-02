<div align="center">

# skills

各类 Agent Skills 合集：施工、发版与正文配图。

[![Stars](https://img.shields.io/github/stars/18360732385/skills?style=for-the-badge)](https://github.com/18360732385/skills/stargazers)

</div>

## What is this?

这是一份给 Cursor / Claude Code 等 Agent 使用的 **Skill 目录仓**。每个子目录是一个独立 skill（入口为 `SKILL.md`），拷到本机 skills 目录后即可在对话里点名使用。

当前收录：

| Skill | 用途 |
|-------|------|
| `harness-eng` | 施工仪式：把 AGENTS / rules / docs 落地到目标仓 |
| `release-eng` | 发版仪式：发版单的准备、续跑、审计与归档 |
| `ip-peitu-tietie` | 帖帖复古手帐：为中文正文生成 16:9 配图 |

## Quick Start

```powershell
git clone git@github.com:18360732385/skills.git
cd skills

Copy-Item -Recurse .\harness-eng $env:USERPROFILE\.agents\skills\harness-eng
Copy-Item -Recurse .\release-eng $env:USERPROFILE\.agents\skills\release-eng
Copy-Item -Recurse .\ip-peitu-tietie $env:USERPROFILE\.agents\skills\ip-peitu-tietie
```

或用 Skills CLI 按需安装：

```bash
npx skills add 18360732385/skills --skill harness-eng -g -y
npx skills add 18360732385/skills --skill release-eng -g -y
npx skills add 18360732385/skills --skill ip-peitu-tietie -g -y
```

装好后新开一轮对话，点名对应 skill 名即可。

## Project Structure

```
skills/
├── harness-eng/
│   ├── archive/
│   ├── docs/
│   ├── scripts/
│   ├── templates/
│   ├── CHANGELOG.md
│   ├── QUICKSTART.md
│   ├── README.md
│   └── SKILL.md
├── ip-peitu-tietie/
│   ├── agents/
│   ├── archive/
│   ├── assets/
│   ├── docs/
│   ├── references/
│   ├── CONTEXT.md
│   └── SKILL.md
├── release-eng/
│   ├── _meta/
│   ├── fixtures/
│   ├── scripts/
│   ├── CHANGELOG.md
│   ├── README.md
│   └── SKILL.md
└── README.md
```

## Documentation

| Resource | Description |
|----------|-------------|
| [harness-eng/SKILL.md](harness-eng/SKILL.md) | 施工仪式入口：落地 / 续跑 / 流水线 / 审计 / 填充 |
| [harness-eng/QUICKSTART.md](harness-eng/QUICKSTART.md) | harness-eng 一页纸 |
| [harness-eng/README.md](harness-eng/README.md) | harness-eng 安装与版本（当前 0.5.0） |
| [release-eng/SKILL.md](release-eng/SKILL.md) | 发版仪式入口：prepare / resume / audit / seal |
| [release-eng/README.md](release-eng/README.md) | release-eng 可移植性与版本（当前 0.3.17） |
| [ip-peitu-tietie/SKILL.md](ip-peitu-tietie/SKILL.md) | 帖帖配图入口：策略 shot list / 单张生成 / QA |
| [ip-peitu-tietie/CONTEXT.md](ip-peitu-tietie/CONTEXT.md) | 帖帖配图上下文与资产索引 |

## Contributing

新增 skill：在仓库根目录建同名文件夹，放入 `SKILL.md`（含 `name` / `description` frontmatter），再按本仓现有 skill 的结构补文档与资源。

<a href="https://github.com/18360732385/skills/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=18360732385/skills" />
</a>

---

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=18360732385/skills&type=Date)](https://star-history.com/#18360732385/skills&Date)

</div>
