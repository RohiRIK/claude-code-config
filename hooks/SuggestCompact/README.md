# SuggestCompact Hook

## Purpose
Monitors the "bloat" of the current session. It checks how many tools have been used or how many turns have passed and suggests running `/compact` to save tokens and improve reasoning quality.

## Trigger
- **Event:** `PreToolUse` (Runs before every tool execution)
- **Automatic:** Yes

## Logic
1. Increments a local counter `tools_since_compact`.
2. If counter > Threshold (e.g., 15):
   - Prints a warning to `stderr` suggesting the user run `/compact`.
