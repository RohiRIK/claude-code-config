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
1. Read all project directories
2. For each project:
   - Check last access time
   - If > STALE_DAYS (14):
     → Delete project directory
3. Trim context-progress.md:
   - Keep only last 20 lines
```

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
