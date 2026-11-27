# feature-eng CHANGELOG

版本明细见仓库级档案 `_log/feature-eng/`（按 `major.minor` 分目录，一版本一文件，如 `0.2/0.2.22.md`；仅仓库内可见，安装包不含）。本表为**近期索引**；更早见文末。

| 版本 | 日期 | 说明 |
|---|---|---|
| 0.2.29 | 2026-11-27 | 读取目标仓 progress / 回链 / 测试报告时接受 UTF-8 与 UTF-16（PowerShell `>` / Out-File 的 BOM） |
| 0.2.28 | 2026-10-29 | close ARCHIVE 权威路径对齐 archive/ARCHIVE.md（harness 0.7.55 / sms-ai） |
| 0.2.27 | 2026-10-29 | selfcheck 主题拆分 · `_log` 0.2-early 归档 · RETAINED=近期索引 |
| 0.2.26 | 2026-10-29 | 批修复：死链清零 · 枚举单源 · 中途环 L2 机检 · needs-close · 门禁清单模板 · reviewer 字段 |
| 0.2.25 | 2026-10-15 | P2：review_effective · close pr_branch · pitfalls 归仓 · express 同戳 |
| 0.2.24 | 2026-10-15 | P1：forbid 粘贴 · proto_confirmed · B Go→桥 · artifacts.implement/pr_url |
| 0.2.23-dev | 2026-10-15 | P0：O5b invoke 降级 + Gate 无 CI 机械轨证据枚举 |
| 0.2.22 | 2026-09-28 | 版本单点维护：manifest SSOT + sync-skill-version |
| 0.2.21 | 2026-09-28 | P3 schema + P4 字段；正式钉（无 -dev） |
| 0.2.20-dev | 2026-09-28 | P0/P1/P2 解耦：能力探测 + 中性 refresh |

**0.2.28+ 机检加固**（不另起版本号）：YAML 行内注释剥离、`result`/`reviewer` 精确匹配、proxy 仪式三行具体值、path-aware 必过闸、`smoke` 不绕过中途 L2、close-check ARCHIVE/F/测试报告占位检查、安装态 selfcheck/sync 可用、文本统一 LF/无 BOM、新增 `check-contracts` 单源校验。验收见 [VERIFY.md](VERIFY.md)。

**更早**（文件仍在仓库级档案，不逐行索引）：`0.2.18-dev`…`0.2.0` 见 `_archive/0.2-early/`；`0.1.x` 见 `_archive/0.1/`。writing-skills 评审实证见 `_archive/writing-skills/`。（安装包不含档案目录。）
