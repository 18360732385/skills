#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
mkdir -p "$HOME/.claude"
cp /mnt/c/Users/18360/.claude/settings.json "$HOME/.claude/settings.json"
eval "$(python3 - <<'PY'
import json
from pathlib import Path
env = json.loads(Path("/home/zj/.claude/settings.json").read_text(encoding="utf-8")).get("env") or {}
def sh(s):
    return s.replace("'", "'\"'\"'")
token = env.get("ANTHROPIC_AUTH_TOKEN") or ""
base = env.get("ANTHROPIC_BASE_URL") or ""
model = env.get("ANTHROPIC_MODEL") or "kimi-k2.6"
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
claude -p --model "${ANTHROPIC_MODEL}" --permission-mode=bypassPermissions 'reply with exactly: OK'
