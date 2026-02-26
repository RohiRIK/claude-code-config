# /check-context — Verify Session Context

Use this command at the start of any session to confirm Claude has the right context loaded.

## What It Does

Claude will summarize what it knows about the current project from its loaded context, so you can verify nothing was lost.

## Instructions for Claude

When this command is invoked, respond with a structured summary of what you currently know:

```
## Context Check — <project-name>

**Project:** <name from registry or slug>
**Path:** <cwd>

### What I know about this project:
- Goal: <current goal, or "none loaded">
- Last progress: <last 3 progress items, or "none loaded">
- Key decisions: <count> decisions loaded
- Gotchas: <count> warnings loaded

### Context source:
- [ ] Injected at session start (from context-summary.md)
- [ ] Loaded from registry as: <name>
- [ ] No context found — this is a fresh session

### Missing context:
<list anything that seems missing or unclear>

### Recommendation:
<one of:>
- "Context looks complete — ready to work"
- "Context is partial — consider running /compact to rebuild summary"
- "No context loaded — run /init-context to set up tracking"
```

## Rules

- Be honest — if you don't have context, say so clearly
- Don't fabricate goals or progress you weren't told about
- If context was injected at session start, reference what was in it
- If this is a new session with no injection, say "fresh session"
