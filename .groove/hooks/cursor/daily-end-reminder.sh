#!/usr/bin/env bash
# groove: stop hook — remind about /groove-daily-end during work hours
hour=$(date +%H)
if [ -f "$CLAUDE_PROJECT_DIR/.groove/index.md" ] && [ "$hour" -ge 16 ] && [ "$hour" -le 21 ]; then
  echo "groove: end of work hours — consider running /groove-daily-end"
fi
