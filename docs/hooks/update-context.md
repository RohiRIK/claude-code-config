# UpdateContext Hook

**File:** `hooks/UpdateContext/UpdateContext.ts`

**Trigger:** Session end (runs with Cleanup)

**Purpose:** Update context-progress.md with session activity

---

## Overview

The UpdateContext hook appends session progress to the context-progress.md file.

## Logic Flow

```
1. Capture session activity summary
2. Format as progress entry:
   - timestamp
   - completed tasks
   - files modified
3. Append to context-progress.md
```

## Output Format

```markdown
## 2026-02-25 14:32

### Completed
- Fixed login bug in auth.ts
- Added user profile page

### Files Modified
- src/auth/login.ts
- src/pages/profile.tsx
```

## Location

Writes to: `~/.claude/projects/<name>/context-progress.md` (name from registry)

## Notes

- Runs at session end
- Combined with Cleanup hook execution
- Entries get trimmed to last 20 by Cleanup hook

## Related

- **See also:** [Cleanup](cleanup.md), [EvaluateSession](evaluate-session.md)

---

*Documentation generated from `hooks/UpdateContext/UpdateContext.ts` - Last updated: 2026-02-25*
