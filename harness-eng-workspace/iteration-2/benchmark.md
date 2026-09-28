# Skill Benchmark: harness-eng

**Date**: 2026-09-28T02:28:28Z
**Evals**: 审计模式只读、不向目标仓写盘, 落地意图须先过确认闸门、未确认不写盘, MATURE 仓未指定模式时默认走审计 (1 runs each per configuration)

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

