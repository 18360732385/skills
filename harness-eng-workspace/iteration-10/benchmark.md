# Skill Benchmark: harness-eng

**Date**: 2026-09-28T04:08:55Z
**Evals**: 审计模式只读、不向目标仓写盘, 落地意图须先过确认闸门、未确认不写盘, MATURE 仓未指定模式时默认走审计, PARTIAL 仓未指定模式时默认续跑、未确认不写盘, 全部推荐只收齐答题、写盘仍须确认, 显式续跑须说明 on_exists=skip 并等待确认, monorepo 冷启动须识别前后端栈并等待确认, monorepo 分册须区分 spring 与 frontend、勿单选 spring 双渲, L5+Codex 落地计划须走 agent-config SSOT/sync, land 路径 WritePlan 仍须包含 gate_profile, 宣称可 AI coding 须依据 ai_coding_ready 而非口头 overall, 代码已加字段而文档未同步时不得仅凭 score 宣称就绪, 表文档被 calibrate 掏空后不得仍判就绪, 按模板写「业务说明」时须识别 morph 正则导致 gold 不可达, refresh exit 2 须核对 score 文件、勿盲信误报, refresh 报告 domains 须含 db、勿吞解析错误回退为 api/func, 新 clone 无 .fill-work 时不得把失真覆盖当成就绪证据, 仅切 gate_profile=gold 时须警示 morph_floor 可能仍被 strict 写死, 分册中文标题下的 TODO 不得被 entry_ready 漏报, calibrate-live 须先 dry-run、警示覆盖风险, 业务分包+Flyway 须显式 inventory 根参数, db inventory 须叠加 ALTER、勿只认 CREATE TABLE, 首填后维护须改 SSOT、禁止回填 .fill-work 重 merge, 迁移命名须跟仓内 Flyway 惯例、勿强加源仓 DDL/DML 正则, Q_SEED=是时须说明 Commands 仍可能全是 TODO, 业务分包 Controllers 的 **/* glob 须警示 hook 可能永不命中, 文件级 glob 被追加 / 后须警示永不命中, db_migration_dir 缺尾斜杠时须警示 after-edit 永不命中, 问答批次截断后须续问、勿把未吐出题标为已答, recommended_when 含 S_* 时不得把推荐值一律当成 null, rule 13 与 AGENTS 迁移口径冲突时须统一、勿各说各话 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### 审计模式只读、不向目标仓写盘 (with_skill)

- **Pass Rate**: 0% (0/0)

### 落地意图须先过确认闸门、未确认不写盘 (with_skill)

- **Pass Rate**: 0% (0/0)

### MATURE 仓未指定模式时默认走审计 (with_skill)

- **Pass Rate**: 0% (0/0)

### PARTIAL 仓未指定模式时默认续跑、未确认不写盘 (with_skill)

- **Pass Rate**: 0% (0/0)

### 全部推荐只收齐答题、写盘仍须确认 (with_skill)

- **Pass Rate**: 0% (0/0)

### 显式续跑须说明 on_exists=skip 并等待确认 (with_skill)

- **Pass Rate**: 0% (0/0)

### monorepo 冷启动须识别前后端栈并等待确认 (with_skill)

- **Pass Rate**: 0% (0/0)

### monorepo 分册须区分 spring 与 frontend、勿单选 spring 双渲 (with_skill)

- **Pass Rate**: 0% (0/0)

### L5+Codex 落地计划须走 agent-config SSOT/sync (with_skill)

- **Pass Rate**: 0% (0/0)

### land 路径 WritePlan 仍须包含 gate_profile (with_skill)

- **Pass Rate**: 0% (0/0)

### 宣称可 AI coding 须依据 ai_coding_ready 而非口头 overall (with_skill)

- **Pass Rate**: 0% (0/0)

### 代码已加字段而文档未同步时不得仅凭 score 宣称就绪 (with_skill)

- **Pass Rate**: 0% (0/0)

### 表文档被 calibrate 掏空后不得仍判就绪 (with_skill)

- **Pass Rate**: 0% (0/0)

### 按模板写「业务说明」时须识别 morph 正则导致 gold 不可达 (with_skill)

- **Pass Rate**: 0% (0/0)

### refresh exit 2 须核对 score 文件、勿盲信误报 (with_skill)

- **Pass Rate**: 0% (0/0)

### refresh 报告 domains 须含 db、勿吞解析错误回退为 api/func (with_skill)

- **Pass Rate**: 0% (0/0)

### 新 clone 无 .fill-work 时不得把失真覆盖当成就绪证据 (with_skill)

- **Pass Rate**: 0% (0/0)

### 仅切 gate_profile=gold 时须警示 morph_floor 可能仍被 strict 写死 (with_skill)

- **Pass Rate**: 0% (0/0)

### 分册中文标题下的 TODO 不得被 entry_ready 漏报 (with_skill)

- **Pass Rate**: 0% (0/0)

### calibrate-live 须先 dry-run、警示覆盖风险 (with_skill)

- **Pass Rate**: 0% (0/0)

### 业务分包+Flyway 须显式 inventory 根参数 (with_skill)

- **Pass Rate**: 0% (0/0)

### db inventory 须叠加 ALTER、勿只认 CREATE TABLE (with_skill)

- **Pass Rate**: 0% (0/0)

### 首填后维护须改 SSOT、禁止回填 .fill-work 重 merge (with_skill)

- **Pass Rate**: 0% (0/0)

### 迁移命名须跟仓内 Flyway 惯例、勿强加源仓 DDL/DML 正则 (with_skill)

- **Pass Rate**: 0% (0/0)

### Q_SEED=是时须说明 Commands 仍可能全是 TODO (with_skill)

- **Pass Rate**: 0% (0/0)

### 业务分包 Controllers 的 **/* glob 须警示 hook 可能永不命中 (with_skill)

- **Pass Rate**: 0% (0/0)

### 文件级 glob 被追加 / 后须警示永不命中 (with_skill)

- **Pass Rate**: 0% (0/0)

### db_migration_dir 缺尾斜杠时须警示 after-edit 永不命中 (with_skill)

- **Pass Rate**: 0% (0/0)

### 问答批次截断后须续问、勿把未吐出题标为已答 (with_skill)

- **Pass Rate**: 0% (0/0)

### recommended_when 含 S_* 时不得把推荐值一律当成 null (with_skill)

- **Pass Rate**: 0% (0/0)

### rule 13 与 AGENTS 迁移口径冲突时须统一、勿各说各话 (with_skill)

- **Pass Rate**: 0% (0/0)

