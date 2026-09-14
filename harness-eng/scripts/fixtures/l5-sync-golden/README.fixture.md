# Fixture: L5 sync golden

Minimal `docs/agent-config/` + rendered `scripts/agent-config/sync.mjs`.
`node scripts/agent-config/sync.mjs --check` must exit 0 (no drift).
`node scripts/harness.mjs --check-freshness --root <this fixture>` must exit 0 (marker matches skill tmpl).
AI tools in this fixture: cursor + claude.
