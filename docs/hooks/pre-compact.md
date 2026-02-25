# PreCompact Hook

**File:** `hooks/PreCompact/PreCompact.ts`

**Trigger:** Before Claude Code compacts context

**Purpose:** Assemble 4 context files into context-summary.md

---

## Overview

The PreCompact hook runs automatically before Claude compacts the context window. It reads the 4 Claude-maintained context files and assembles them into a summary.

## Logic Flow

```
1. Read stdin input (JSON with cwd)
2. Derive project slug from cwd
3. Read 4 context files:
   - context-goals.md
   - context-decisions.md
   - context-progress.md
   - context-gotchas.md
4. Assemble into context-summary.md
5. Trim to 60 lines max
```

## Input

```json
{
  "cwd": "/Users/roh/projects/myapp"
}
```

## Summary Assembly

```typescript
let summary = `# Context Summary\n`;
summary += `**Project:** ${cwd}\n`;
summary += `**Compaction checkpoint:** ${timestamp}\n\n`;

if (goals) {
  summary += `## Current Goal\n${goals}\n\n`;
}

if (progress) {
  // Keep last 10 lines only
  summary += `## Recent Progress\n${recent}\n\n`;
}

if (decisions) {
  // Keep last 8 lines
  summary += `## Key Decisions\n${recent}\n\n`;
}

if (gotchas) {
  summary += `## Gotchas / Watch Out\n${gotchas}\n\n`;
}
```

## Output

Writes to: `~/.claude/projects/<slug>/context-summary.md`

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MAX_SUMMARY_LINES | 60 | Max lines in summary |

## Related

- **See also:** [SessionStart](session-start.md), [EvaluateSession](evaluate-session.md)

---

*Documentation generated from `hooks/PreCompact/PreCompact.ts` - Last updated: 2026-02-25*
