# Ledger: Codex full support (Native)

- Branch: V0.6.X
- Spec: docs/superpowers/specs/2026-09-22-codex-full-support-design.md
- Plan: docs/superpowers/plans/2026-09-22-codex-full-support.md

## Progress

| Task | Status | Notes |
|---|---|---|
| 1 TOML lib | done | |
| 2 Starlark+Stop | done | combined with 3 |
| 3 adapter | done | |
| 4 sync tmpl | done | |
| 5 contract-sync/mcp-paths | done | |
| 6 docs 高 | done | |
| 7 0.6.9 | in_progress | |

## Rulings

- Combined Task 2+3 commit (adapter needed for dry-run).
- `.agents/skills` not in MANAGED_DIRS — avoid pruning user skills.
- Codex L3+ omits contract-sync like full-pipeline hosts.
