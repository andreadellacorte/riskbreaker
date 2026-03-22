#!/usr/bin/env bash
# groove: PreToolUse/Write+Edit hook — block edits to managed groove paths
input=$(cat)
path=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
if echo "$path" | grep -qE '^(\.agents/skills/groove|skills/groove)'; then
  echo "groove: blocked — '$path' is managed by groove update. Edit under skills/ and rsync to .agents/skills/." >&2
  exit 1
fi
