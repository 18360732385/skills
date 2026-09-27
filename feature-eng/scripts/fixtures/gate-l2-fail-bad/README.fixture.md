# fixture: gate-l2-fail-bad

负例：ISO `gates.design_confirmed` + 合法 `authorized_by: user_chat` + `审核-design.md` 含 `result: fail`。

期望：`node scripts/gate-evidence.mjs --cwd scripts/fixtures/gate-l2-fail-bad --slug 2026-09-27-gate-l2-fail-bad` 非 0；加 `--expect-fail` 则 0。
