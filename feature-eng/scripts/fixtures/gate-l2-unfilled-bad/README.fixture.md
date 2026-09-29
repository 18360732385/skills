# fixture: gate-l2-unfilled-bad

负例：ISO `gates.design_confirmed` + 合法 `authorized_by: user_chat` + `审核-design.md` 仍是模板占位 `result: pass | fail`（未裁定）。

期望：`node scripts/gate-evidence.mjs --cwd scripts/fixtures/gate-l2-unfilled-bad --slug 2026-09-29-gate-l2-unfilled-bad` 非 0；加 `--expect-fail` 则 0。

`pass | fail` 不得被当成 `result: pass`。
