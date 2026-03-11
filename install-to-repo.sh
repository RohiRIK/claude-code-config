#!/usr/bin/env bash
# install-to-repo.sh — Add LTM bootstrap to any repo
# Usage: bash /path/to/claude-code-config/install-to-repo.sh /path/to/target-repo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-.}"
TARGET="$(cd "$TARGET" && pwd)"

mkdir -p "$TARGET/.claude"

cat > "$TARGET/.claude/settings.json" << 'SETTINGS'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "#!/bin/bash\nif [ ! -f \"$HOME/.claude/memory/ltm.db\" ]; then\n  CONFIG_REPO=$(find /home/user -maxdepth 2 -name 'setup.sh' -path '*/claude-code-config/*' 2>/dev/null | head -1)\n  if [ -n \"$CONFIG_REPO\" ]; then\n    bash \"$CONFIG_REPO\" >/dev/null 2>&1\n    echo '[Bootstrap] LTM memory system installed' >&2\n  fi\nfi"
          }
        ]
      }
    ]
  }
}
SETTINGS

echo "✓ Bootstrap added to $TARGET/.claude/settings.json"
echo "  On next session, it will auto-install LTM if missing."
