#!/usr/bin/env bash
set -euo pipefail

LINUX_CLAUDE="/home/zj/.npm-global/lib/node_modules/@anthropic-ai/claude-code/node_modules/@anthropic-ai/claude-code-linux-x64/claude"
if [[ ! -x "$LINUX_CLAUDE" ]]; then
  echo "missing linux claude at $LINUX_CLAUDE" >&2
  # fallback: reinstall under npm-global with linux node
  export PATH="/home/zj/.npm-global/bin:/usr/bin:$PATH"
  if command -v npm >/dev/null 2>&1; then
    npm install -g @anthropic-ai/claude-code
  fi
fi

ls -la "$LINUX_CLAUDE"
"$LINUX_CLAUDE" --version

mkdir -p /home/zj/.local/bin
ln -sfn "$LINUX_CLAUDE" /home/zj/.local/bin/claude
# also replace broken npm-global shim if present
if [[ -L /home/zj/.npm-global/bin/claude ]] || [[ -e /home/zj/.npm-global/bin/claude ]]; then
  ln -sfn "$LINUX_CLAUDE" /home/zj/.npm-global/bin/claude
fi

export PATH="/home/zj/.local/bin:$PATH"
hash -r
command -v claude
claude --version
file "$(command -v claude)"
