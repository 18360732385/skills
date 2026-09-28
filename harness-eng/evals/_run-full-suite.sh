#!/usr/bin/env bash
set -euo pipefail

# Prefer Linux-native Node/Claude from nvm over Windows npm shims.
export NVM_DIR="$HOME/.nvm"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use --lts >/dev/null 2>&1 || true
fi

# Drop Windows npm from PATH so skill-up does not pick .exe shims.
PATH="$(echo "$PATH" | tr ':' '\n' | grep -v '/mnt/c/Users/.*/AppData/Roaming/npm' | paste -sd: -)"
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"

# Ensure Linux-native claude is on PATH (not a Windows .exe shim).
if ! command -v claude >/dev/null 2>&1 || file "$(command -v claude)" 2>/dev/null | grep -qi 'PE32\|MS-DOS\|executable for MS'; then
  bash "$(dirname "$0")/_fix-claude-path.sh"
  export PATH="$HOME/.local/bin:$PATH"
  hash -r
fi

mkdir -p "$HOME/.claude"
cp /mnt/c/Users/18360/.claude/settings.json "$HOME/.claude/settings.json"

eval "$(python3 - <<'PY'
import json
from pathlib import Path
p = Path("/mnt/c/Users/18360/.claude/settings.json")
data = json.loads(p.read_text(encoding="utf-8"))
env = data.get("env") or {}
token = env.get("ANTHROPIC_AUTH_TOKEN") or ""
base = env.get("ANTHROPIC_BASE_URL") or ""
def sh(s):
    return s.replace("'", "'\"'\"'")
keys = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
]
# API key alias
if token:
    print(f"export ANTHROPIC_API_KEY='{sh(token)}'")
    print(f"export ANTHROPIC_AUTH_TOKEN='{sh(token)}'")
if base:
    print(f"export ANTHROPIC_BASE_URL='{sh(base)}'")
for k in keys:
    if k in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"):
        continue
    v = env.get(k) or ""
    if v:
        print(f"export {k}='{sh(v)}'")
model = env.get("ANTHROPIC_MODEL") or "kimi-k2.6"
print(f"echo token_len={len(token)} base_set={bool(base)} model={model}")
PY
)"

cd /mnt/d/workspace/gitHub/skills/harness-eng
echo "claude=$(command -v claude || true)"
claude --version || true
skill-up --version

echo "=== validate ==="
skill-up validate evals/eval.yaml

echo "=== run full suite ==="
MODEL="${ANTHROPIC_MODEL:-kimi-k2.6}"
skill-up run evals/eval.yaml --parallelism 2 -v --format html --model "$MODEL"
echo "=== done exit=$? ==="
