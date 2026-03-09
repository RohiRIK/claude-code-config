# UpdateContext Hook

**File:** `hooks/UpdateContext/UpdateContext.ts`

**Trigger:** Session end (Stop hook, runs before Cleanup)

**Purpose:** Write a progress entry to `ltm.db` (or fallback `.md` file) summarizing session activity

---

## Overview

The UpdateContext hook fires at session end. It reads the session transcript, detects which files were modified, and writes one `progress` row to the DB for the session.

## Logic Flow

```
1. Read stdin (passthrough — does not block Claude's response)
2. Parse cwd and session_id from hook input
3. Resolve project name via registry.json
4. Find transcript file:
   - Uses transcript_path from input if provided
   - Falls back to history.jsonl lookup by session_id
5. Parse transcript JSONL → collect tool_use blocks (Write/Edit/MultiEdit)
6. Build session line:
   - "✓ [YYYY-MM-DD] [sessionId8] Modified: file1, file2, ..."
   - Or: "✓ [YYYY-MM-DD] [sessionId8] Session (read-only, N messages)"
7. Write to DB (primary) or .md file (fallback)
```

## DB Write (Primary)

When `ltm.db` exists:

```ts
addItem(project, "progress", sessionLine, sessionId);
// Dedup: if session_id already exists in context_items, skip insert
```

The `session_id` dedup prevents double-entries if the hook fires multiple times for the same session.

## .md Fallback

When `ltm.db` is absent, appends to `context-progress.md` with the same `sessionLine` format. Checks for `sessionId` substring before appending (same dedup logic).

## Output Format

```
✓ [2026-03-08] [1a2b3c4d] Modified: ~/.claude/hooks/PreCompact/PreCompact.ts, ~/.claude/memory/db.ts
✓ [2026-03-08] [5e6f7a8b] Session (read-only, 12 messages)
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| TOOL_NAMES | Write, Edit, MultiEdit | Tools that count as file modifications |
| MAX_DISPLAY_FILES | 5 | Max files shown in progress line |
| MAX_PROGRESS_LINES | 20 | Max lines before trim (fallback .md only) |

## Related

- **See also:** [Cleanup](cleanup.md) — trims progress to last 20 in DB
- **See also:** [SessionStart](session-start.md) — injects progress at next session

---

*Updated for SQLite LTM system — 2026-03-08*
