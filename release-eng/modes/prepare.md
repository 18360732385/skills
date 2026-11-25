# prepare（主路径 · 半自动）

同身份目录已存在时本模式即**刷新**（0.4 起不再单独暴露 resume）。

## 步骤

1. [gates-common.md](gates-common.md)（含首问 **`发版日期`**【推荐】≥提问日+2 的第一个周四 + 分支对）  
   - 若 git-gates **Done（中止）** → 本模式结束（勿继续下列步骤）  
2. **版本身份** `<identity>` = **`release-V{yyMMdd}`** ← 已确认发版日期（见 [conventions.md](conventions.md)）。同日已有进行中包 → 先 seal / [取消发版](#取消发版) / 改日期。  
3. **【推荐】半自动编排**（同会话直达 WritePlan 预览；**不写盘**；ai-track **默认跳过**）：

```bash
node .cursor/skills/release-eng/scripts/release.mjs prepare -- \
  --root . --release-date YYYY-MM-DD --release-branch <发版分支> --baseline <基线|无> \
  [--allow-drift] [--ai-track] [--out <freeze.json>]
# 首次发版：--baseline 无 或加 --first-release
```

   等价逐步：push-gate → freeze（`--out`）→（可选 ai-track）→ `--format draft-md`。  
4. 问卷默认 **「全部推荐」**（[recommended.md](recommended.md)）；仅高风险打断：密文未确认、配置说明待补、逾期书面跳过。  
5. [write-plan.md](write-plan.md)：展示编排产出的 draft-md + 白话/技术摘要 → 确认词（或预授权）  
6. 【推荐】`release-note-merge.mjs`（优先 `--freeze-json`）写**目录包** + **`artifacts.json`**。身份与 `--release-date` / `--identity` 必须一致为 `release-V{yyMMdd}`。

```bash
node .cursor/skills/release-eng/scripts/release-note-merge.mjs --root . \
  --note docs/releases/<identity>/<identity>.md --freeze-json <freeze.json> \
  --identity <identity> --release-date YYYY-MM-DD --release-branch <发版分支> \
  --baseline <基线|无> --owner <负责人>
```

### 取消发版

未 seal 的进行中包：

```bash
node .cursor/skills/release-eng/scripts/release.mjs cancel -- --root . --identity release-V261126 --dry-run
# 确认词后：--apply
```

## Done

### 中止（gates-common → git-gates Done（中止））

- [ ] 未执行 freeze / 问卷 / 定版 WritePlan / 写盘  
- [ ] 用户可见中止交付物（见 git-gates）；**仅会话预览**，无目录包、无草稿夹  

### 通过并定版

- [ ] `docs/releases/<identity>/<identity>.md` 存在；`<identity>` = `release-V{yyMMdd}`  
- [ ] 元信息含已确认 `发版日期`；目录名与日期导出一致  
- [ ] WritePlan 已含 draft-md；落单与 `draft` 一致  
- [ ] `releases.md` 进行中表有对应行  
- [ ] 刷新时 `<!-- manual:… -->` 人工段未被覆盖（用户未要求覆盖时）  
