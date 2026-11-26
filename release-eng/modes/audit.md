# audit（只读）

默认：只出报告。用户明确「先建骨架」时才跑 [bootstrap.md](bootstrap.md)。  
不跑 [gates-common.md](gates-common.md) 的中止出口（只读填报告，不阻断其它检查）。

## 步骤

1. 检骨架四路径（releases.md · templates · archive/ · ARCHIVE.md）→ 填报告「骨架」  
2. 只读 SQL 扫描（不写盘）：`node .cursor/skills/release-eng/scripts/release.mjs sql-profile -- --root .` → 填「骨架」里的 SQL 目录 / SQL 格式（已记录路径与格式，或「首次使用未记录」）  
3. 读 `releases.md` 进行中表 → 填「进行中」  
4. 分支对：首问 `发版日期`+发版/基线，或【推荐】≥提问日+2 的第一个周四 + `release`/`main`（或用户指定 **`首次发版`/基线=`无`**）→ 【推荐】`release-push-gate.mjs` 只读 → 填「push-gate」；只读检查不欲更新远端引用（或离线）时加 **`--no-fetch`**（不 fetch，仅用本地 refs）  
5. **prior / freeze 体检**（【推荐】）：在仓库根跑。索引已记录 SQL 目录与格式时，freeze 加上 `--sql-dir` / `--sql-format`（或由 prepare 同款读取）；未记录则报告「首次使用未记录」，不要擅自改成 `db/migration`。  

```bash
# 有基线时用用户确认的分支对；首次发版加 --first-release
node .cursor/skills/release-eng/scripts/release-freeze.mjs --root . --base <baseRef> --head <headRef> --format audit-json
```

   将 JSON 填入报告「freeze」与「prior」节（见下）。无分支对时写「未跑 freeze」。  
6. 若用户指定发版单（或进行中仅一行）：对照模板 → 填「缺章」（截断5 / mergeSources / prod / 说明列 / SQL序 / 目录包附属 / 是否误含 suppressed / 同名 `.html` 渲染是否缺失或过期，缺失可建议 `release.mjs note-html` 补渲）   
7. 若发版单有「配置项」：列出密文**键名**（及是否缺说明）→ 填「密文键」（只读）  

## 报告结构（强制标题）

```markdown
# release-eng audit

## 骨架
| 路径 | 存在 |
|---|---|
| docs/releases/releases.md | 是/否 |
| SQL 目录 | 已记录 `…` / 首次使用未记录 |
| SQL 格式 | 已记录 `…` / 首次使用未记录 |
| … | |

## 进行中
| 版本身份 | 状态 | 路径 | 负责人 |
|---|---|---|---|

## push-gate
- 分支对: …（首次发版则写 发版/无）
- firstRelease: 是|否
- 结论: 通过 | 将中止定版
- 摘要: （未推送时列出）

## prior
- 路径: docs/releases/archive/…（并集） | （无）
- 模式: auto | none | 显式；prior-since: …
- artifacts.json: 命中数 | md 启发式回退
- 说明: 无 archive 时跳过清单已收录；双源仍可用 baseline

## freeze
- range / candidatePolicy:
- changeObjects / aiTrack:
- draft: sql= · config= · jobs=
- suppressed: sql= · config= · jobs=
- confidenceHistogram: …
- configMissingDescription: N
- jobsHits: N
- overdueHardGate: 是|否
- inventory: （仅首次；migrationRange 或无）
- warnings: …

## 缺章
- （无指定发版单则写「未检查」）

## 密文键
- （无则写「无」）
```

## Done

- [ ] 报告含上述**七个**二级标题且每节有实质内容或显式「无/未检查/未跑」  
- [ ] prior / freeze 节已填（或显式「未跑 freeze」）  
- [ ] 本轮对进行中目录包、`archive/`、索引正文的动作仅为「无」或用户要求的 bootstrap  
