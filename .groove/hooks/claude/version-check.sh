#!/usr/bin/env bash
# groove: PostToolUse hook — check for new groove version (once per hour)
CACHE="$CLAUDE_PROJECT_DIR/.groove/.cache/last-version-check-ts"
mkdir -p "$CLAUDE_PROJECT_DIR/.groove/.cache"
now=$(date +%s)
if [ -f "$CACHE" ]; then
  last=$(cat "$CACHE")
  diff=$((now - last))
  [ "$diff" -lt 3600 ] && exit 0
fi
echo "$now" > "$CACHE"
bash "$CLAUDE_PROJECT_DIR/.agents/skills/groove-utilities-check/scripts/check.sh" 2>/dev/null || true
