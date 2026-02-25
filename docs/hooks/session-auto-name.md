# SessionAutoName Hook

**File:** `hooks/SessionAutoName/SessionAutoName.ts`

**Trigger:** First prompt of session

**Purpose:** Set terminal tab title based on context

---

## Overview

The SessionAutoName hook sets the Ghostty (terminal) tab title based on session context.

## Logic Flow

```
1. Read first user prompt
2. Analyze for context hints:
   - Project name
   - Task type
   - File being worked on
3. Set terminal tab title
```

## Examples

| Prompt | Tab Title |
|--------|-----------|
| "fix the login bug" | Hook: fix login bug |
| "add user profile page" | Hook: add user profile |
| "review PR #123" | Hook: review PR #123 |

## Purpose

Helps identify sessions in terminal tabs - especially useful when running multiple Claude Code sessions.

## Related

- **See also:** [SessionStart](session-start.md)

---

*Documentation generated from hooks implementation patterns - Last updated: 2026-02-25*
