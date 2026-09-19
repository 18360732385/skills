# resume（幂等续跑）

## 步骤

1. [gates-common.md](gates-common.md)（续跑时 `发版日期`【推荐】= 既有发版单元信息中的日期，勿擅自改成新的推荐周四）  
   - 若 git-gates **Done（中止）** → 本模式结束（勿继续下列步骤）  
2. 定位发版单：用户 slug（= 发版分支名归一化），或进行中唯一行，或多行则请用户选（路径为目录包 `notes/{identity}/{identity}.md`）  
3. `on_exists` 默认 merge（[idempotency.md](idempotency.md)）  
4. [freeze.md](freeze.md) — 【推荐】`release-freeze.mjs` 刷新自动段（`首次发版` 用 `--first-release` + inventory；增量 **键级diff**；提交 `截断5`；合并来源去重全量）  
5. [questions.md](questions.md) 仅补缺（已有非空人工段默认保留；自适应以本轮 `draft`/`configKeys`/`jobKeys` 为准；目标 **`prod`**）  
6. [write-plan.md](write-plan.md)：【推荐】`--format draft-md` → 确认 → 【推荐】`release-note-merge.mjs` 写自动段并刷新包内附属文件  

## Done

### 中止（gates-common → git-gates Done（中止））

- [ ] 未刷新定版段、未定版 WritePlan、未写盘  
- [ ] 用户可见中止交付物（见 git-gates）  

### 通过并刷新

- [ ] 目标发版单自动段与当前定版范围一致（有基线=`BASE..HEAD`；`首次发版`=`首次发版:<headRef>` 全量）  
- [ ] WritePlan 含 draft-md 预览（或等价）；落单与 `draft` 一致、未误写 `draftSuppressed`  
- [ ] `<!-- manual:start -->`…`<!-- manual:end -->` 内正文未被覆盖（用户未要求覆盖时）  
- [ ] 索引行仍指向该发版单目录包  
