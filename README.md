<div align="center">

# skills

各类 Agent Skills 合集：施工、开发流程、发版与正文配图。

[![Stars](https://img.shields.io/github/stars/18360732385/skills?style=for-the-badge)](https://github.com/18360732385/skills/stargazers)

</div>

## What is this?

这是一份给 Cursor / Claude Code 等 Agent 使用的 **Skill 目录仓**。每个子目录是一个独立 skill（入口为 `SKILL.md`），拷到本机 skills 目录后即可在对话里点名使用。

当前收录：

| Skill | 用途 |
|-------|------|
| `harness-eng` | 施工仪式：把 AGENTS / rules / docs 落地到目标仓 |
| `feature-eng` | 开发流程：分诊环节、调度子 skill、维护 runs 进度 |
| `release-eng` | 发版仪式：发版单的准备、续跑、审计与归档 |
| `ip-peitu-tietie` | 帖帖复古手帐：为中文正文生成 16:9 配图 |

## Quick Start

```powershell
git clone git@github.com:18360732385/skills.git
cd skills

Copy-Item -Recurse .\harness-eng $env:USERPROFILE\.agents\skills\harness-eng
Copy-Item -Recurse .\feature-eng $env:USERPROFILE\.agents\skills\feature-eng
Copy-Item -Recurse .\release-eng $env:USERPROFILE\.agents\skills\release-eng
Copy-Item -Recurse .\ip-peitu-tietie $env:USERPROFILE\.agents\skills\ip-peitu-tietie
```

或用 Skills CLI 按需安装：

```bash
npx skills add 18360732385/skills --skill harness-eng -g -y
npx skills add 18360732385/skills --skill feature-eng -g -y
npx skills add 18360732385/skills --skill release-eng -g -y
npx skills add 18360732385/skills --skill ip-peitu-tietie -g -y
```

装好后新开一轮对话，点名对应 skill 名即可。

## Project Structure

```
skills/
├── harness-eng/
│   ├── _meta/
│   ├── archive/
│   ├── docs/
│   ├── scripts/
│   ├── templates/
│   ├── CHANGELOG.md
│   ├── QUICKSTART.md
│   ├── README.md
│   └── SKILL.md
├── feature-eng/
│   ├── _meta/
│   ├── config/
│   ├── conventions/
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
├── _log/
└── README.md
```

## 仓库级档案与发版（`_log/`）

`_log/` 是**仓库级档案**：版本变更明细与历史正文只随全仓 git 可见；`npx skills add` / 拷贝安装**不含**，技能运行时**零依赖**（harness-eng 0.7.50 起由双态 selfcheck 保证：无 `_log` 时档案断言自动跳过）。

### 布局

```
_log/
  <skill-name>/            # 如 harness-eng / feature-eng / release-eng
    <major.minor>/         # 版本系列目录，如 0.7
      <major.minor.patch>.md
      <major.minor.patch>-dev.md
    docs/                  # 非版本档案：ROADMAP / TRAE-P0-EVIDENCE / VERIFY 历史表 / OPTIMIZATION / fill-truths-auto 等
    selfcheck-legacy/      # 历史整文件 selfcheck（harness-eng 0.2–0.5.1）
```

### 发版手册（各 skill 通用）

1. 只改对应 skill `_meta/manifest.yaml` 的 `version`。
2. `node scripts/sync-skill-version.mjs`（机械副本 + 文档钉头 + 仓根 README 版本行）。
3. 更新该 skill `CHANGELOG.md` 索引一行与 `VERIFY.md` 增量；**版本要点写入** `_log/<skill>/<major.minor>/<ver>.md`（系列目录不存在则新建）。
4. `node scripts/selfcheck.mjs`（含 `sync-skill-version --check`）须全绿。

> 约定（harness-eng 0.7.50+）：随包文档**零 `_log` 路径**，一律以「仓库级档案（见仓根 README）」指代；selfcheck 新增档案断言必须以 `hasLogRoot` 门禁包裹（install 态自动跳过）。

## Documentation

| Resource | Description |
|----------|-------------|
| [harness-eng/SKILL.md](harness-eng/SKILL.md) | 施工仪式入口：落地 / 续跑 / 流水线 / 审计 / 填充 |
| [harness-eng/QUICKSTART.md](harness-eng/QUICKSTART.md) | harness-eng 一页纸 |
| [harness-eng/README.md](harness-eng/README.md) | harness-eng 安装与版本（当前 0.7.51） |
| [feature-eng/SKILL.md](feature-eng/SKILL.md) | 开发流程入口：init / rebind / start / resume / status / advance / close |
| [feature-eng/QUICKSTART.md](feature-eng/QUICKSTART.md) | feature-eng 一页纸 |
| [feature-eng/README.md](feature-eng/README.md) | feature-eng 可移植性与版本（当前 0.2.26）；须点名加载 |
| [release-eng/SKILL.md](release-eng/SKILL.md) | 发版仪式入口：prepare / resume / audit / seal |
| [release-eng/README.md](release-eng/README.md) | release-eng 可移植性与版本（当前 0.3.31） |
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
