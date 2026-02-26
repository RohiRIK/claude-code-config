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
2. Resolve project name via registry.json (exact → prefix → slug fallback)
3. Check for context-summary.md in ~/.claude/projects/<name>/
4. If exists and not stale (<30 days):
   → Inject into Claude's prompt
5. If new project (isNew=true):
   → Auto-register with folder name, prompt Claude to create context files
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

## Project Resolution

Uses `resolveProject(cwd)` from `hooks/lib/resolveProject.ts`:

```
1. Exact match in registry.json  → use registered name
2. Longest prefix match          → inherit parent project name
3. Slug fallback                 → cwd with / and . replaced by -
```

Registry: `~/.claude/projects/registry.json` → `{ "/abs/path": "friendly-name" }`

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

- **Reads:** `~/.claude/projects/<name>/context-summary.md` (name from registry)
- **Writes:** Resets tool counter at `~/.claude/tmp/session-tool-count.txt`

## Related

- **See also:** [PreCompact](pre-compact.md), [Context System Overview](../AGENT_ARCHITECTURE.md)

---

*Documentation generated from `hooks/SessionStart/SessionStart.ts` - Last updated: 2026-02-25*
