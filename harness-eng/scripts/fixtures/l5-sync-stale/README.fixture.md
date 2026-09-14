# Fixture: L5 sync stale stub

Intentionally old instantiated `scripts/agent-config/sync.mjs` (pre-freshness-gate marker).
`node scripts/harness.mjs --check-freshness --root <this fixture>` must exit non-zero.
Do not use this tree for real `sync.mjs --check` drift tests.
