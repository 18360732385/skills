#!/usr/bin/env bash
# WSL/Linux only. Locate or symlink a Linux-native Claude CLI.
# Optional: LINUX_CLAUDE, NPM_GLOBAL_PREFIX, LOCAL_BIN.
set -euo pipefail

NPM_GLOBAL_PREFIX="${NPM_GLOBAL_PREFIX:-$HOME/.npm-global}"
LOCAL_BIN="${LOCAL_BIN:-$HOME/.local/bin}"
LINUX_CLAUDE="${LINUX_CLAUDE:-}"

if [[ -z "$LINUX_CLAUDE" ]]; then
  candidates=(
    "$NPM_GLOBAL_PREFIX/lib/node_modules/@anthropic-ai/claude-code/node_modules/@anthropic-ai/claude-code-linux-x64/claude"
    "$HOME/.npm-global/lib/node_modules/@anthropic-ai/claude-code/node_modules/@anthropic-ai/claude-code-linux-x64/claude"
  )
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      LINUX_CLAUDE="$c"
      break
    fi
  done
fi

if [[ -z "${LINUX_CLAUDE}" || ! -x "$LINUX_CLAUDE" ]]; then
  echo "missing linux claude binary; set LINUX_CLAUDE or install @anthropic-ai/claude-code under NPM_GLOBAL_PREFIX=$NPM_GLOBAL_PREFIX" >&2
  export PATH="$NPM_GLOBAL_PREFIX/bin:/usr/bin:$PATH"
  if command -v npm >/dev/null 2>&1; then
    npm install -g @anthropic-ai/claude-code
  fi
  for c in "${candidates[@]:-}"; do
    if [[ -x "$c" ]]; then
      LINUX_CLAUDE="$c"
      break
    fi
  done
fi

if [[ -z "${LINUX_CLAUDE:-}" || ! -x "$LINUX_CLAUDE" ]]; then
  echo "still missing linux claude; abort" >&2
  exit 1
fi

ls -la "$LINUX_CLAUDE"
"$LINUX_CLAUDE" --version

mkdir -p "$LOCAL_BIN"
ln -sfn "$LINUX_CLAUDE" "$LOCAL_BIN/claude"
if [[ -L "$NPM_GLOBAL_PREFIX/bin/claude" ]] || [[ -e "$NPM_GLOBAL_PREFIX/bin/claude" ]]; then
  ln -sfn "$LINUX_CLAUDE" "$NPM_GLOBAL_PREFIX/bin/claude"
fi

export PATH="$LOCAL_BIN:$PATH"
hash -r
command -v claude
claude --version
file "$(command -v claude)"
