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
2. Resolve project name via registry.json (exact → prefix → slug fallback)
3. If ltm.db exists (primary path):
   - Call exportContextMarkdown(project) from memory/context.ts
   - getItems(project, type) for each type → budgetSection() assembly
4. If ltm.db absent (fallback):
   - Read 4 .md context files directly
5. Write context-summary.md (max ~60 lines)
```

## DB-First Behavior

`PreCompact` checks `existsSync(DB_PATH)` before importing DB modules. The DB path is `~/.claude/memory/ltm.db`.

- **DB available:** calls `exportContextMarkdown(project)` which queries all 4 `context_items` types and assembles via `budgetSection()` utility (imported from `hooks/lib/hookUtils.ts`)
- **DB absent:** reads `.md` files directly as fallback (legacy behavior)

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

Writes to: `~/.claude/projects/<name>/context-summary.md` (name from registry)

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MAX_SUMMARY_LINES | 60 | Max lines in summary |

## Related

- **See also:** [SessionStart](session-start.md), [EvaluateSession](evaluate-session.md)

---

*Documentation generated from `hooks/PreCompact/PreCompact.ts` - Last updated: 2026-02-25*
