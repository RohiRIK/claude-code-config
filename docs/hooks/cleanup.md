# Cleanup Hook

**File:** `hooks/Cleanup/Cleanup.ts`

**Trigger:** Session ends

**Purpose:** Trim context files and delete stale project directories

---

## Overview

The Cleanup hook runs at session end to maintain data hygiene:
1. Trims context-progress.md to last 20 items
2. Deletes stale project directories (>14 days unused)

## Logic Flow

```
1. Check stop_hook_active flag — skip if already running
2. If ltm.db exists (primary path):
   - Read registry.json for all registered project names
   - Call trimProgress(name, 20) for each — DELETE oldest rows in DB
3. Read all project directories
4. For each project:
   - If ltm.db absent: trim context-progress.md to last 20 lines
   - Check last file access time
   - If > STALE_DAYS (14): delete entire project directory
```

## DB trimProgress Operation

When `ltm.db` is active, Cleanup calls `trimProgress(project, 20)` from `memory/context.ts`:

```sql
DELETE FROM context_items
WHERE type='progress' AND project_name=? AND id NOT IN
  (SELECT id FROM context_items WHERE type='progress' AND project_name=? ORDER BY id DESC LIMIT 20)
```

This preserves the 20 most recent progress rows and purges the rest. `decision` and `gotcha` rows are never trimmed — they are permanent.

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| STALE_DAYS | 14 | Days before deletion |
| MAX_PROGRESS_LINES | 20 | Lines to keep in progress |

## What It Removes

- Entire project directories not accessed in 14 days
- Old progress entries beyond last 20

## What It Preserves

- context-goals.md
- context-decisions.md
- context-gotchas.md
- context-summary.md

## Related

- **See also:** [EvaluateSession](evaluate-session.md), [SessionStart](session-start.md)

---

*Documentation generated from hooks implementation patterns - Last updated: 2026-02-25*
