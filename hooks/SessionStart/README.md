# SessionStart Hook

## Purpose
Initializes the environment for a new session. It resets temporary counters and loads high-level context from previous learnings to "prime" the agent.

## Trigger
- **Event:** `SessionStart` (Runs when the CLI starts)
- **Automatic:** Yes

## Logic
1. Resets the "Tools Since Compact" counter.
2. Reads `rules/learned-summary.md` and injects it into the initial context (if configured).
3. Logs the start time to the daily session file.
