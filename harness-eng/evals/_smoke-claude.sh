#!/usr/bin/env bash
# WSL/Linux smoke. Optional: CLAUDE_SETTINGS, ANTHROPIC_MODEL.
set -euo pipefail
export PATH="${LOCAL_BIN:-$HOME/.local/bin}:$PATH"
mkdir -p "$HOME/.claude"
CLAUDE_SETTINGS="${CLAUDE_SETTINGS:-${CLAUDE_SETTINGS_JSON:-$HOME/.claude/settings.json}}"
if [[ -f "$CLAUDE_SETTINGS" && "$CLAUDE_SETTINGS" != "$HOME/.claude/settings.json" ]]; then
  cp "$CLAUDE_SETTINGS" "$HOME/.claude/settings.json"
fi
if [[ -f "$HOME/.claude/settings.json" ]]; then
  eval "$(SETTINGS_JSON="$HOME/.claude/settings.json" python3 - <<'PY'
import json, os
from pathlib import Path
env = json.loads(Path(os.environ["SETTINGS_JSON"]).read_text(encoding="utf-8")).get("env") or {}
def sh(s):
    return s.replace("'", "'\"'\"'")
token = env.get("ANTHROPIC_AUTH_TOKEN") or env.get("ANTHROPIC_API_KEY") or ""
base = env.get("ANTHROPIC_BASE_URL") or ""
model = env.get("ANTHROPIC_MODEL") or os.environ.get("ANTHROPIC_MODEL") or "claude-sonnet-4-5"
print(f"export ANTHROPIC_API_KEY='{sh(token)}'")
print(f"export ANTHROPIC_AUTH_TOKEN='{sh(token)}'")
print(f"export ANTHROPIC_BASE_URL='{sh(base)}'")
print(f"export ANTHROPIC_MODEL='{sh(model)}'")
for k in ("ANTHROPIC_DEFAULT_HAIKU_MODEL","ANTHROPIC_DEFAULT_SONNET_MODEL","ANTHROPIC_DEFAULT_OPUS_MODEL"):
    v = env.get(k) or ""
    if v:
        print(f"export {k}='{sh(v)}'")
print(f"echo smoke model={model}")
PY
)"
fi
claude -p --model "${ANTHROPIC_MODEL:-claude-sonnet-4-5}" --permission-mode=bypassPermissions 'reply with exactly: OK'
