# EvaluateSession Hook

## Purpose
This hook analyzes the session transcript at the end of a session to extract key patterns, successful tool usages, and encountered errors. It feeds this data into the system's "Continuous Learning" loop.

## Trigger
- **Event:** `SessionEnd` (Runs when the user exits the session)
- **Automatic:** Yes

## Logic
1. Scans `~/.claude/history.jsonl` to find the current session ID.
2. Locates the full transcript in `~/.claude/projects/`.
3. Extracts:
   - User intent.
   - Tools used.
   - Errors encountered.
4. Updates `rules/learned-summary.md`.
