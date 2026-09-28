# Skill Benchmark: harness-eng

**Date**: 2026-09-28T04:33:28Z
**Evals**: 落地意图须先过确认闸门、未确认不写盘, PARTIAL 仓未指定模式时默认续跑、未确认不写盘, 全部推荐只收齐答题、写盘仍须确认 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 33% ± 47% |

## Per-Case Results

### 落地意图须先过确认闸门、未确认不写盘 (with_skill)

- **Pass Rate**: 100% (6/6)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.files_not_exist | ✅ | all checks passed |
| turn_response_contains[turn=1]{contains_any:[推荐 Fingerprint 指纹 提问 Q_]} | ✅ | turn 1 response contains all required keywords (contains_any:[推荐 Fingerprint 指纹 提问 Q_]) |
| turn_response_contains[turn=2]{contains_any:[WritePlan 写盘计划 产物预览]} | ✅ | turn 2 response contains all required keywords (contains_any:[WritePlan 写盘计划 产物预览]) |
| turn_response_contains[turn=2]{contains_any:[确认 按计划执行 LGTM 预授权]} | ✅ | turn 2 response contains all required keywords (contains_any:[确认 按计划执行 LGTM 预授权]) |
| files_not_exist: [AGENTS.md docs/harness-eng/harness-meta.yaml] | ✅ | none of the forbidden files exist |

### PARTIAL 仓未指定模式时默认续跑、未确认不写盘 (with_skill)

- **Pass Rate**: 0% (0/0)

### 全部推荐只收齐答题、写盘仍须确认 (with_skill)

- **Pass Rate**: 0% (0/0)

