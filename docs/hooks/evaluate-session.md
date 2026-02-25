# EvaluateSession Hook

**File:** `hooks/EvaluateSession/EvaluateSession.ts`

**Trigger:** Session ends

**Purpose:** Extract patterns from session for learning

---

## Overview

The EvaluateSession hook analyzes the session transcript and saves learned patterns to `skills/Learned/`.

## Logic Flow

```
1. Find transcript file (from session_id or history.jsonl)
2. Parse JSONL messages
3. If >= 5 messages:
   → Extract errors encountered
   → Count tool usage
   → List files modified
4. Write to patterns/YYYY-MM-DD.md
5. Update summary.md
```

## Input

```json
{
  "transcript_path": "/path/to/transcript.jsonl",
  "session_id": "abc123"
}
```

## What It Extracts

### Errors Encountered
```markdown
## Errors Encountered
- Cannot find module '@/lib/utils'
- Type 'string' not assignable to type 'number'
```

### Tools Used
```markdown
## Tools Used
- Read (45 times)
- Edit (32 times)
- Bash (28 times)
- Write (12 times)
```

### Files Modified
```markdown
## Files Modified
- src/app/page.tsx
- src/lib/utils.ts
- package.json
```

## Output

- **Pattern file:** `~/.claude/skills/Learned/patterns/YYYY-MM-DD.md`
- **Summary:** `~/.claude/skills/Learned/summary.md`

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MIN_SESSION_MESSAGES | 5 | Min messages to analyze |
| MAX_SUMMARY_LINES | 50 | Lines in summary |

## Notes

- Runs silently (failures don't break session end)
- Never injects into Claude context - reference only
- Deduplicates by session ID in summary

## Related

- **See also:** [Cleanup](cleanup.md), [Learned skill](../skills/learned.md)

---

*Documentation generated from `hooks/EvaluateSession/EvaluateSession.ts` - Last updated: 2026-02-25*
