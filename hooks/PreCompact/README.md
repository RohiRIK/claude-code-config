# PreCompact Hook

## Purpose
Ensures that critical context is not lost when the context window is compacted (pruned). It creates a checkpoint or summary of the current state before the `prune` operation occurs.

## Trigger
- **Event:** `PreCompact` (Runs immediately before the system compacts context)
- **Automatic:** Yes

## Logic
1. Appends a "checkpoint" note to the active session log.
2. Logs the tool usage count at the time of compaction.
