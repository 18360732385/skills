# Codex Full Support (→ 高) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate harness-eng Codex host alignment from partial/P0 to matrix **高** via split-track SSOT (shared mcp/hooks/skills + Starlark-only `codex/rules`), recommendation discipline **B**, without mirroring `.mdc`.

**Architecture:** Keep `docs/agent-config/` as SSOT. Add `jsonServersToCodexToml` + `codex-adapter.js` + default `*.rules` seeds. Extend `sync.mjs.tmpl` / land `manifest.yaml` so `has("codex")` emits `.codex/config.toml.example`, full hooks (+ Stop), `.codex/rules/`, and `.agents/skills/` (managed). Flip docs + selfcheck to **高** while asserting no `.mdc` mirror and empty-detect does not inject `codex`.

**Tech Stack:** Node ESM (templates + `scripts/`), YAML manifest, TOML generation (string builder, no new npm dep unless already present), selfcheck assertions, fixtures under `scripts/fixtures/`.

**Spec:** [harness-eng/docs/superpowers/specs/2026-09-22-codex-full-support-design.md](../specs/2026-09-22-codex-full-support-design.md)

## Global Constraints

- Target skill version: **0.6.9** (bump both `_meta/manifest.yaml` and `templates/_meta/manifest.yaml`).
- Recommendation discipline **B**: detect `.codex/` or explicit select → include; empty detect → never default-inject `codex`.
- **Never** mirror `.cursor/rules/*.mdc` (or Claude `.md`) into Codex `.rules`.
- **Never** write secret values into committed `.codex/config.toml*`; only env var **names**.
- Default MCP servers that look like writable DB → `enabled = false`.
- Hooks remain **fail-open**; no Cursor-only event names in `.codex/hooks.json`.
- Do **not** change Trae / CodeBuddy matrix conclusions.
- Production install URL discipline stays **`main`** (do not pin `V0.6.X` in install docs).
- Prefer extending existing selfcheck style (`assert` in `checks-0.6.mjs`) over new test frameworks.

## Review Focus

- Empty `ai_tools` must still emit **no** `.codex/` paths (discipline B / no silent Codex).
- TOML output must never contain literal password/token values from JSON `env` maps.
- Skills prune must not delete user-created dirs under `.agents/skills/` that sync did not write.
- `Stop` hook must fail-open if delivery script is missing.
- L0–L2 without full Codex pipeline must still get thin `.codex/contract-sync.md`; L3+/L5 omit it.

---

## File map (create / modify)

| Path | Role |
|---|---|
| `scripts/lib/codex-mcp-toml.mjs` | **Create** — JSON MCP → Codex TOML string |
| `templates/hooks/codex-adapter.js` | **Create** — Codex stdin/stdout adapter |
| `templates/hooks/codex-hooks.json` | **Modify** — add `Stop` (+ keep `PreToolUse` `^Bash$`) |
| `templates/hooks/codex-stop-checklist.js.tmpl` (or reuse stop script) | **Create/wire** — Stop soft check |
| `templates/ai-tools/codex/rules/*.rules` | **Create** — default Starlark seeds |
| `templates/agent-config/codex/rules/*.rules` | **Create** — L5 SSOT seeds (same content) |
| `templates/agent-config/sync.mjs.tmpl` | **Modify** — Codex MCP/rules/hooks/skills/MANAGED |
| `templates/_meta/manifest.yaml` + `_meta/manifest.yaml` | **Modify** — land targets + version 0.6.9 |
| `scripts/lib/mcp-paths.mjs` | **Modify** — Codex example/true paths |
| `scripts/render.mjs` / `scripts/lib/hooks-checks.mjs` | **Modify** — omit contract-sync L3+; wire adapter |
| `host/ai-tools.md`, `adapters/codex.md`, `CODEX-PARITY.md`, `CODEX-MANUAL.md` | **Modify/create** — matrix **高** |
| `modes/*`, `questions.yaml`, `使用手册.md`, `CHANGELOG.md`, `VERIFY.md`, … | **Modify** — copy flip |
| `scripts/lib/selfcheck/checks-0.6.mjs` (+ 0.5 nails that contradict) | **Modify** — 0.6.9 suite; retire partial claims |
| `scripts/fixtures/l5-sync-codex/` | **Create** — golden `--check` |

---

### Task 1: JSON → Codex TOML library

**Files:**
- Create: `harness-eng/scripts/lib/codex-mcp-toml.mjs`
- Modify: `harness-eng/scripts/lib/selfcheck/checks-0.6.mjs` (new 0.6.9 block, start with this unit)
- Test: via `node scripts/selfcheck.mjs` (or inline `node -e` in steps)

**Interfaces:**
- Produces: `export function jsonServersToCodexToml(doc, opts?: { policy?: Record<string, { enabled?: boolean }> }): string`
- Produces: `export function redactEnvToNames(env: Record<string,string>|undefined): string[]`
- Consumes: MCP JSON shape `{ mcpServers?: Record<string, { command?, args?, env?, url?, headers? }> }` (same as `servers.example.json`)

- [ ] **Step 1: Write failing selfcheck assertions for the library**

In `checks-0.6.mjs`, add under a `// --- 0.6.9: Codex → 高 ---` block (create block even if later tasks fill more):

```js
{
  const { jsonServersToCodexToml } = await import("../codex-mcp-toml.mjs");
  // If selfcheck is sync CJS-style, use createRequire or dynamic import pattern already used in file.
  const toml = jsonServersToCodexToml({
    mcpServers: {
      mysql_dev: {
        command: "npx",
        args: ["-y", "@benborla29/mcp-server-mysql"],
        env: { MYSQL_PASS: "s3cret", MYSQL_HOST: "127.0.0.1" },
      },
      context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
    },
  });
  assert(/\[mcp_servers\.mysql_dev\]/.test(toml), "toml has mysql_dev table");
  assert(/env_vars\s*=\s*\[/.test(toml) && /MYSQL_PASS/.test(toml), "env var names exported");
  assert(!/s3cret/.test(toml), "secret values never in toml");
  assert(/enabled\s*=\s*false/.test(toml), "db-like server disabled by default");
}
```

If `checks-0.6.mjs` cannot top-level await, use:

```js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// or: spawn `node --input-type=module -e "..."` from assert helper
```

Match whatever module style the selfcheck entry already uses (`scripts/selfcheck.mjs`).

- [ ] **Step 2: Run selfcheck — expect FAIL (module missing)**

Run: `node scripts/selfcheck.mjs` (cwd `harness-eng`)  
Expected: FAIL loading `codex-mcp-toml.mjs` or assertion path not found.

- [ ] **Step 3: Implement `codex-mcp-toml.mjs`**

```js
/** @param {Record<string, string>|undefined} env */
export function redactEnvToNames(env) {
  if (!env || typeof env !== "object") return [];
  return Object.keys(env).filter(Boolean);
}

function looksWritableDb(name, server) {
  const n = String(name).toLowerCase();
  if (/readonly|read-only|ro[-_]/.test(n)) return false;
  return /mysql|postgres|postgresql|mongo|redis|mariadb/.test(n);
}

function escapeTomlString(s) {
  return JSON.stringify(String(s)); // valid TOML basic string
}

/**
 * @param {{ mcpServers?: Record<string, any> }} doc
 * @param {{ policy?: Record<string, { enabled?: boolean }> }} [opts]
 */
export function jsonServersToCodexToml(doc, opts = {}) {
  const servers = doc?.mcpServers || {};
  const lines = [
    "# GENERATED from docs/agent-config/mcp — do not put secrets here",
    "# Project .codex/config.toml loads only when the workspace is trusted",
    "",
  ];
  for (const [name, server] of Object.entries(servers)) {
    if (!server || typeof server !== "object") continue;
    const key = name.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`[mcp_servers.${key}]`);
    if (server.command) {
      lines.push(`command = ${escapeTomlString(server.command)}`);
      if (Array.isArray(server.args)) {
        lines.push(`args = [${server.args.map(escapeTomlString).join(", ")}]`);
      }
    } else if (server.url) {
      lines.push(`url = ${escapeTomlString(server.url)}`);
      if (server.bearer_token_env_var) {
        lines.push(`bearer_token_env_var = ${escapeTomlString(server.bearer_token_env_var)}`);
      }
    }
    const names = redactEnvToNames(server.env);
    if (names.length) {
      lines.push(`env_vars = [${names.map(escapeTomlString).join(", ")}]`);
    }
    const policyEn = opts.policy?.[name]?.enabled;
    const enabled =
      typeof policyEn === "boolean" ? policyEn : looksWritableDb(name, server) ? false : false;
    // Spec default: conservative — all generated servers enabled=false unless policy forces true
    lines.push(`enabled = ${enabled}`);
    lines.push(`default_tools_approval_mode = "prompt"`);
    lines.push("");
  }
  return lines.join("\n");
}
```

Note: default all `enabled = false` is acceptable and matches spec caution; `looksWritableDb` documents intent for future policy true-overrides.

- [ ] **Step 4: Re-run selfcheck — library assertions PASS**

Run: `node scripts/selfcheck.mjs`  
Expected: new toml asserts PASS (other pre-existing suite still green).

- [ ] **Step 5: Commit**

```bash
git add harness-eng/scripts/lib/codex-mcp-toml.mjs harness-eng/scripts/lib/selfcheck/checks-0.6.mjs
git commit -m "$(cat <<'EOF'
feat(harness-eng): add Codex MCP JSON→TOML helper for 0.6.9

EOF
)"
```

---

### Task 2: Starlark seeds + expanded `codex-hooks.json`

**Files:**
- Create: `harness-eng/templates/ai-tools/codex/rules/repository.rules`
- Create: `harness-eng/templates/agent-config/codex/rules/repository.rules` (identical seed for L5 SSOT land)
- Modify: `harness-eng/templates/hooks/codex-hooks.json`
- Create: `harness-eng/templates/hooks/codex-stop-checklist.js.tmpl` (minimal fail-open Stop script)
- Modify: `harness-eng/templates/_meta/manifest.yaml` (wire new files; version bump can wait for Task 7)

**Interfaces:**
- Produces: default Starlark with at least `git push` prompt + `git reset --hard` forbidden
- Produces: hooks JSON with `PreToolUse` matcher `^Bash$` and `Stop` command entry

- [ ] **Step 1: Add selfcheck nails for seeds + Stop event**

```js
assert(fs.existsSync(path.join(skillRoot, "templates/ai-tools/codex/rules/repository.rules")), "codex repository.rules seed");
const rules = fs.readFileSync(path.join(skillRoot, "templates/ai-tools/codex/rules/repository.rules"), "utf8");
assert(/prefix_rule/.test(rules) && /git/.test(rules) && /push/.test(rules), "rules seed has git push policy");
assert(/reset/.test(rules) && /forbidden|prompt/.test(rules), "rules seed has destructive git policy");
const hooks = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-hooks.json"), "utf8");
assert(/"Stop"/.test(hooks), "codex-hooks includes Stop");
assert(/"matcher"\s*:\s*"\^Bash\$"/.test(hooks), "PreToolUse still ^Bash$");
```

- [ ] **Step 2: Run selfcheck — expect FAIL (files missing / no Stop)**

- [ ] **Step 3: Write `repository.rules`**

```python
# experimental — Codex command policy (not natural-language AGENTS)
# GENERATED seed from harness-eng; edit SSOT docs/agent-config/codex/rules/

prefix_rule(
    pattern = ["git", "push"],
    decision = "prompt",
    justification = "Push updates remotes; confirm before running.",
)

prefix_rule(
    pattern = ["git", "reset", "--hard"],
    decision = "forbidden",
    justification = "Destructive reset; use recoverable alternatives.",
)

prefix_rule(
    pattern = ["git", "clean", "-fd"],
    decision = "forbidden",
    justification = "Destructive clean; refuse by default.",
)
```

Copy same file to `templates/agent-config/codex/rules/repository.rules`.

- [ ] **Step 4: Expand `codex-hooks.json`**

```json
{
  "description": "harness-eng Codex hooks (fail-open)",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^Bash$",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/codex-adapter.js\" commit-gate superpowers-commit-gate.js",
            "timeout": 12,
            "statusMessage": "Checking Bash commit gate"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/codex-stop-checklist.js\"",
            "timeout": 8,
            "statusMessage": "Delivery soft check"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 5: Write minimal `codex-stop-checklist.js.tmpl`**

Exit 0 always; read stdin and ignore errors (fail-open). Mirror style of other soft checklists if present under `templates/hooks/`.

- [ ] **Step 6: Wire manifest entries** (`when_ai_tools: codex`) for:
  - `ai-tools/codex/rules/repository.rules` → `.codex/rules/repository.rules`
  - `hooks/codex-stop-checklist.js.tmpl` → `.codex/hooks/codex-stop-checklist.js`
  - Keep existing `hooks-codex-json` / `hooks-codex-gate` / `mcp-codex-config`

- [ ] **Step 7: Run selfcheck — PASS for these nails**

- [ ] **Step 8: Commit**

```bash
git add harness-eng/templates/ai-tools/codex harness-eng/templates/agent-config/codex harness-eng/templates/hooks/codex-hooks.json harness-eng/templates/hooks/codex-stop-checklist.js.tmpl harness-eng/templates/_meta/manifest.yaml harness-eng/scripts/lib/selfcheck/checks-0.6.mjs
git commit -m "$(cat <<'EOF'
feat(harness-eng): Codex Starlark seeds and Stop hook scaffold

EOF
)"
```

---

### Task 3: `codex-adapter.js`

**Files:**
- Create: `harness-eng/templates/hooks/codex-adapter.js`
- Modify: `harness-eng/scripts/lib/hooks-checks.mjs` (register adapter copy for codex like claude-adapter)
- Modify: selfcheck 0.6.9 block

**Interfaces:**
- Produces: CLI `node codex-adapter.js <mode> <script>` reading Codex hook JSON on stdin; spawns sibling script with `--codex` or normalized argv; maps exit/stdout to Codex allow/deny JSON; on adapter error → allow (fail-open)
- Consumes: existing `superpowers-commit-gate.js` `--codex` mode

- [ ] **Step 1: Write failing selfcheck**

```js
assert(fs.existsSync(path.join(skillRoot, "templates/hooks/codex-adapter.js")), "codex-adapter.js");
const ad = fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-adapter.js"), "utf8");
assert(/fail-open|failOpen|exit\(0\)/.test(ad), "adapter fail-open");
assert(/stdin|readFileSync\(0\)|process\.stdin/.test(ad), "adapter reads stdin");
```

Optional micro-test (temp dir): pipe fake PreToolUse JSON, expect exit 0.

- [ ] **Step 2: Run — FAIL missing file**

- [ ] **Step 3: Implement adapter**

Follow `templates/hooks/claude-adapter.js` structure: parse argv mode + script name; read stdin; extract command string from Codex payload fields (document which keys you try: e.g. `tool_input.command`, `command`, `arguments.command`); spawn `node path.join(__dirname, script) --codex` with env `HARNESS_HOOK_MODE=codex`; translate non-zero / deny markers to Codex JSON deny if known; otherwise exit 0.

Keep implementation ≤ ~120 lines; comment official uncertainty.

- [ ] **Step 4: Register in `hooks-checks.mjs`** so land/L5 copies `codex-adapter.js` → `.codex/hooks/codex-adapter.js` when `codex` selected (mirror claude-adapter branches).

- [ ] **Step 5: selfcheck PASS + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(harness-eng): add codex-adapter for native hook payloads

EOF
)"
```

---

### Task 4: L5 `sync.mjs.tmpl` — full Codex emit

**Files:**
- Modify: `harness-eng/templates/agent-config/sync.mjs.tmpl`
- Modify: `harness-eng/templates/agent-config/README.md.tmpl` (distribution table row)
- Create: `harness-eng/scripts/fixtures/l5-sync-codex/` (minimal SSOT + expected paths; can start as README.fixture + sync copy)
- Modify: selfcheck

**Interfaces:**
- Extends: `planMcp()` — if `has("codex")`, write `.codex/config.toml.example` via inlined or required helper logic (sync template must be self-contained for consumer repos: **inline a copy** of `jsonServersToCodexToml` into the tmpl or embed a small function — do **not** require `scripts/lib` from consumer `sync.mjs`)
- Extends: `planHooks()` — `has("codex")` → write `.codex/hooks.json` from SSOT `codex/hooks.json` or default assembled events; `copy` scripts + `codex-adapter.js`
- Adds: `planCodexRules()` — walk `SSOT/codex/rules/*.rules` → `.codex/rules/`; if missing, skip (land seeds SSOT)
- Extends: `planSkills()` — when `has("codex")`, full copy to `.agents/skills/` + `GENERATED.md` (replace light-pointer-only block)
- Extends: `MANAGED_DIRS` — add `.codex/hooks`, `.codex/rules` when codex; for `.agents/skills` use **prefix-managed list** (only delete files sync wrote / marked GENERATED tree), not blind wipe of entire `.agents/skills`

- [ ] **Step 1: Failing selfcheck on tmpl source**

```js
const syncTmpl = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
assert(/planCodexRules|codex\/rules/.test(syncTmpl), "sync plans codex rules");
assert(/config\.toml\.example/.test(syncTmpl) && /mcp_servers|jsonServersToCodexToml|env_vars/.test(syncTmpl), "sync emits codex toml from mcp");
assert(/\.agents\/skills/.test(syncTmpl) && !/P0 \*\*不\*\*从/.test(syncTmpl), "skills full distribute, not P0 pointer-only prose");
assert(/MANAGED_DIRS[\s\S]*\.codex\/rules/.test(syncTmpl), "managed .codex/rules");
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement sync changes** (inline TOML helper inside tmpl to keep consumer sync one-file)

Also update header comment version id to `0.6.9`.

- [ ] **Step 4: Fixture `l5-sync-codex`**

Minimal:
- `docs/agent-config/mcp/servers.example.json` (small)
- `docs/agent-config/codex/rules/repository.rules`
- `docs/agent-config/hooks/` optional
- Instantiated `scripts/agent-config/sync.mjs` from tmpl
- `README.fixture.md` explaining run: `node scripts/agent-config/sync.mjs --check`

Selfcheck: spawn sync in fixture with `ai_tools` including codex (however tmpl reads tools — match existing golden: usually `docs/harness-eng/harness-meta.yaml` or env). Inspect existing `l5-sync-golden` for the pattern and clone.

- [ ] **Step 5: Run fixture sync `--check` + selfcheck PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(harness-eng): L5 sync full Codex emit (toml, rules, skills)

EOF
)"
```

---

### Task 5: Land/render omit `contract-sync` at L3+ · mcp-paths

**Files:**
- Modify: `harness-eng/scripts/render.mjs` (`contractSyncPath` / when_full for codex)
- Modify: `harness-eng/host/ai-tools.md` (1x table: Codex L3+ omit like Claude family — but only after “full pipeline” meaning hooks+rules+config targets exist)
- Modify: `harness-eng/scripts/lib/mcp-paths.mjs` — `codex: ".codex/config.toml.example"`; document true path `.codex/config.toml` (gitignore suggestion)
- Modify: fill-mcp related docs/code paths if they switch on `EXAMPLE_PATHS` (grep `mcp-paths` usages)

**Review Focus nails in selfcheck:**

```js
// empty ai_tools → no .codex targets (keep existing 0.5 nail)
// L5 targets with codex → includes .codex/rules and config.toml.example; contract-sync omitted
```

- [ ] **Step 1: Grep current contract-sync logic for codex; write failing asserts for L3+/L5 omit**

- [ ] **Step 2: Implement omit + mcp-paths**

- [ ] **Step 3: selfcheck PASS + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(harness-eng): Codex L3+ omit contract-sync; mcp-paths for toml

EOF
)"
```

---

### Task 6: Docs matrix flip to **高** + MANUAL

**Files:**
- Modify: `host/ai-tools.md`, `host/sync-hosts.md`, `host/README.md`, `host/CODEX-PARITY.md`
- Create: `host/CODEX-MANUAL.md` (full checklist); keep `CODEX-P0-MANUAL.md` as stub pointing to it
- Modify: `templates/ai-tools/adapters/codex.md`
- Modify: `modes/write-plan.md`, `modes/audit-report.md`, `modes/upgrade.md`, `modes/recommended-profile.md`, `modes/detect.md`, `questions.yaml`, `questions.md` if present
- Modify: `使用手册.md`, `使用手册-摘要.md`, `AGENT-INDEX.md`, `VERIFY.md`, `CHANGELOG.md`, `README.md`
- Modify: conflicting asserts in `checks-0.5.mjs` / `checks-0.6.mjs` that require「部分对齐」/「不全量」/「不默认进推荐」as **capability** claims — replace with **高** + discipline B + no `.mdc`

**Copy rules (verbatim intent):**
- Alignment: **高**
- Footnote: 原生 TOML MCP / Starlark rules / Codex hooks；**不做** `.mdc` 镜像
- 「全部推荐」: only if detected `.codex/` or explicit; label no longer「部分对齐·不默认」as capability

- [ ] **Step 1: Update PARITY table** — Instructions/Config/MCP/Hooks/Skills/Rules(command) → PASS or PASS with notes; keep explicit **不做 `.mdc`**

- [ ] **Step 2: Flip adapter + ai-tools matrix row `codex` → **高****

- [ ] **Step 3: Flip recommended-profile / questions.yaml labels**

- [ ] **Step 4: Replace selfcheck nails that would fail** (0.5.x G6 / 0.6.0 / 0.6.8 blocks) — either version-gate them obsolete or rewrite expectations for 0.6.9

- [ ] **Step 5: `node scripts/selfcheck.mjs` PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(harness-eng): Codex matrix 高 + MANUAL; retire partial copy

EOF
)"
```

---

### Task 7: Version 0.6.9 + VERIFY + upgrade path + P0b fill-mcp stub

**Files:**
- Modify: `_meta/manifest.yaml`, `templates/_meta/manifest.yaml` → `version: "0.6.9"`
- Modify: `CHANGELOG.md` (new `## 0.6.9` section in Chinese, matching prior style)
- Modify: `VERIFY.md`, `modes/upgrade.md` (`0.6.8-dev → 0.6.9`)
- Modify: `使用手册-摘要.md` version line
- Modify: `fill/fill-mcp.md` + fill-mcp script (if exists) — document/implement writing `.codex/config.toml.example` from SSOT and optional gitignored true toml; if script change is large, minimum is docs + mcp-paths + selfcheck nail that fill-mcp mentions codex.toml

- [ ] **Step 1: Failing asserts for version 0.6.9 dual-write + CHANGELOG heading**

- [ ] **Step 2: Bump versions and changelog**

- [ ] **Step 3: fill-mcp Codex note + example path wiring**

- [ ] **Step 4: Full `node scripts/selfcheck.mjs` PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(harness-eng): release 0.6.9 Codex full host support

EOF
)"
```

- [ ] **Step 6: Update design spec status** to `approved + implemented` only after this task completes (executor does this last).

---

## Spec coverage checklist

| Spec section | Task |
|---|---|
| §1 高 definition / no .mdc | 6 |
| §2 MCP TOML + no secrets | 1, 4, 5 |
| §3 Hooks + adapter + Stop | 2, 3, 4 |
| §4 Starlark + skills full | 2, 4 |
| §5 matrix / selfcheck / 0.6.9 | 6, 7 |
| Discipline B | 5, 6 (keep empty ai_tools nail) |
| contract-sync omit L3+ | 5 |
| P0b fill-mcp | 7 (minimal) |
| P1 SessionStart / mcp-policy file | **out of this plan** (spec P1) |

## Placeholder scan

None intentional. Executor must not leave「部分对齐」claims in user-facing Codex capability copy after Task 6.

---

## Execution handoff

Plan complete and saved to `harness-eng/docs/superpowers/plans/2026-09-22-codex-full-support.md`.

Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** — fresh subagent per task + reviewer; thorough, higher cost.
- **Native** — I implement all tasks in this session, then one end-of-branch review.

**For this plan I recommend Native**, because tasks share one `sync.mjs.tmpl` / selfcheck surface and sequential interface coupling makes per-task fresh agents expensive without much isolation benefit. Does the plan capture what you want, and which approach should we use?
