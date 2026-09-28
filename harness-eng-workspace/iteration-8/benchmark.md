# Skill Benchmark: harness-eng

**Date**: 2026-09-28T03:42:38Z
**Evals**: 审计模式只读、不向目标仓写盘, 落地意图须先过确认闸门、未确认不写盘, MATURE 仓未指定模式时默认走审计, PARTIAL 仓未指定模式时默认续跑、未确认不写盘, monorepo 冷启动须识别前后端栈并等待确认, L5+Codex 落地计划须走 agent-config SSOT/sync, 全部推荐只收齐答题、写盘仍须确认, 宣称可 AI coding 须依据 ai_coding_ready 而非口头 overall, 显式续跑须说明 on_exists=skip 并等待确认 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 100% ± 0% |

## Per-Case Results

### 审计模式只读、不向目标仓写盘 (with_skill)

- **Pass Rate**: 100% (6/6)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[审计 audit Audit]} | ✅ | output satisfies all contains checks (any:[审计 audit Audit]) |
| output_contains{any:[缺口 已具备 L0 L1]} | ✅ | output satisfies all contains checks (any:[缺口 已具备 L0 L1]) |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### 落地意图须先过确认闸门、未确认不写盘 (with_skill)

- **Pass Rate**: 100% (4/4)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[WritePlan 确认 推荐 Fingerprint 指纹]} | ✅ | output satisfies all contains checks (any:[WritePlan 确认 推荐 Fingerprint 指纹]) |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### MATURE 仓未指定模式时默认走审计 (with_skill)

- **Pass Rate**: 100% (5/5)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[MATURE]} | ✅ | output satisfies all contains checks (all:[MATURE]) |
| output_contains{any:[审计 audit Audit]} | ✅ | output satisfies all contains checks (any:[审计 audit Audit]) |
| output_contains{any:[已具备 缺口 L0 L1 L2]} | ✅ | output satisfies all contains checks (any:[已具备 缺口 L0 L1 L2]) |

### PARTIAL 仓未指定模式时默认续跑、未确认不写盘 (with_skill)

- **Pass Rate**: 100% (6/6)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[resume 续跑 Resume]} | ✅ | output satisfies all contains checks (any:[resume 续跑 Resume]) |
| output_contains{any:[PARTIAL 半成品 缺口 补齐]} | ✅ | output satisfies all contains checks (any:[PARTIAL 半成品 缺口 补齐]) |
| files_not_exist: [docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### monorepo 冷启动须识别前后端栈并等待确认 (with_skill)

- **Pass Rate**: 100% (6/6)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[WritePlan 确认 推荐 Fingerprint 指纹 探测]} | ✅ | output satisfies all contains checks (any:[WritePlan 确认 推荐 Fingerprint 指纹 探测]) |
| output_contains{any:[S_SPRING Spring Maven backend]} | ✅ | output satisfies all contains checks (any:[S_SPRING Spring Maven backend]) |
| output_contains{any:[S_FRONTEND frontend Vite 前端]} | ✅ | output satisfies all contains checks (any:[S_FRONTEND frontend Vite 前端]) |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### L5+Codex 落地计划须走 agent-config SSOT/sync (with_skill)

- **Pass Rate**: 100% (5/5)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[WritePlan 确认 L5 agent_config agent-config]} | ✅ | output satisfies all contains checks (any:[WritePlan 确认 L5 agent_config agent-config]) |
| output_contains{any:[sync SSOT docs/agent-config]} | ✅ | output satisfies all contains checks (any:[sync SSOT docs/agent-config]) |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### 全部推荐只收齐答题、写盘仍须确认 (with_skill)

- **Pass Rate**: 100% (4/4)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |
| output_contains{any:[确认 WritePlan 按计划执行 LGTM 预授权]} | ✅ | output satisfies all contains checks (any:[确认 WritePlan 按计划执行 LGTM 预授权]) |

### 宣称可 AI coding 须依据 ai_coding_ready 而非口头 overall (with_skill)

- **Pass Rate**: 100% (4/4)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[ai_coding_ready]} | ✅ | output satisfies all contains checks (all:[ai_coding_ready]) |
| output_contains{any:[fill-score gate score-policy 开干 就绪]} | ✅ | output satisfies all contains checks (any:[fill-score gate score-policy 开干 就绪]) |

### 显式续跑须说明 on_exists=skip 并等待确认 (with_skill)

- **Pass Rate**: 100% (5/5)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| output_contains{any:[resume 续跑]} | ✅ | output satisfies all contains checks (any:[resume 续跑]) |
| output_contains{any:[on_exists skip 不覆盖 merge 保留]} | ✅ | output satisfies all contains checks (any:[on_exists skip 不覆盖 merge 保留]) |
| files_not_exist: [docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

