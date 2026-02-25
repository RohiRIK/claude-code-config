# SessionStart Hook

**File:** `hooks/SessionStart/SessionStart.ts`

**Trigger:** Session begins

**Purpose:** Inject project context into Claude's prompt

---

## Overview

The SessionStart hook runs when a new Claude Code session begins. It reads the project's context summary and injects it into Claude's context.

## Logic Flow

```
1. Read stdin input (JSON with cwd)
2. Derive project slug from cwd
3. Check for context-summary.md
4. If exists and not stale (<30 days):
   → Inject into Claude's prompt
5. If not exists:
   → Prompt Claude to create context files
```

## Input

```json
{
  "cwd": "/Users/roh/projects/myapp",
  "session": {
    "cwd": "/Users/roh/projects/myapp"
  }
}
```

## Slug Derivation

```typescript
function deriveSlug(cwd: string): string {
  return cwd
    .replace(new RegExp("\\" + sep, "g"), "-")
    .replace(/\./g, "-");
}
// /Users/roh/projects/myapp → -Users-roh-projects-myapp
```

## Behavior

### Context Exists + Fresh
```
Injects:
## Restored Project Context

[context-summary.md content]

---
*Context restored from previous session.*
```

### Context Not Found
Prompts Claude to ask user:
```
No context files found for this project.
Should I create them so your work is saved across sessions? (yes/no)
```

### Context Stale (>30 days)
Skips injection silently.

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MAX_INJECT_LINES | 60 | Max lines to inject |
| MAX_AGE_DAYS | 30 | Staleness threshold |

## Files

- **Reads:** `~/.claude/projects/<slug>/context-summary.md`
- **Writes:** Resets tool counter at `~/.claude/tmp/session-tool-count.txt`

## Related

- **See also:** [PreCompact](pre-compact.md), [Context System Overview](../AGENT_ARCHITECTURE.md)

---

*Documentation generated from `hooks/SessionStart/SessionStart.ts` - Last updated: 2026-02-25*
