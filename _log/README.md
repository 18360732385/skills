# `_log/` — skill 版本变更档案

各 skill 热树外的版本明细与非版本档案。`npx skills add` **不会**安装本目录。

## 布局

```
_log/
  <skill-name>/
    <major.minor>/          # 版本系列目录，如 0.1、0.7
      <major.minor.patch>.md
      <major.minor.patch>-dev.md
    docs/                   # 非版本档案（可选）
    selfcheck-legacy/       # 历史脚本等（可选）
```

示例：`_log/harness-eng/0.7/0.7.43.md`、`_log/feature-eng/0.2/0.2.22.md`。

## 发版约定

1. 新版本日志写入 `_log/<skill>/<major.minor>/<ver>.md`（系列目录不存在则新建）。
2. 同步更新对应 skill 根目录 `CHANGELOG.md` 索引链接：`../_log/<skill>/<major.minor>/<ver>.md`。
3. `docs/`、`selfcheck-legacy/` 等非版本文件仍放在 skill 根下，不进系列目录。
