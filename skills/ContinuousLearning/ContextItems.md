# ContextItems — Per-Project Context in ltm.db

Context items live in the `context_items` table, scoped to a project name from `registry.json`.

## The 4 Types

| Type | Purpose | Behavior |
|------|---------|---------|
| `goal` | Current objective (1-3 lines) | **Replace** — only one row per project. New goal deletes old. |
| `decision` | Architectural / key choices | **Permanent** — append only, never deleted by hooks. |
| `progress` | Completed tasks, session log | **Trimmed** — Cleanup hook keeps last 20. Deduped by `session_id`. |
| `gotcha` | Warnings, pitfalls, blockers | **Permanent** — append only, never deleted by hooks. |

## Hooks Manage Context Automatically

**Claude does NOT manually write context items.** The hooks handle everything:

- **Progress** is written by `UpdateContext` at session end (reads transcript, detects modified files)
- **Goal/Decision/Gotcha** must be added via `/learn` (stored in `memories`) or explicitly via `addItem()` in hooks
- **Cleanup** trims progress to last 20 rows
- **PreCompact** reads all types → writes `context-summary.md`
- **SessionStart** regenerates summary from DB and injects it

## When to Use /init-context

Run `/init-context` for a **new project** to seed the initial goal into the DB.

Prerequisites:
1. Project must be registered — run `/register-project` first if needed
2. `/init-context` calls `addItem(project, 'goal', content)` — it does NOT create `.md` files

## context-summary.md

This file at `~/.claude/projects/<name>/context-summary.md` is **auto-generated** by `PreCompact` and `SessionStart` hooks. It is:
- A human-readable snapshot of DB state
- Used as fallback if DB is unavailable next session
- Never manually edited — hooks overwrite it on each compaction/session start

## Checking DB State

```bash
bun -e "
  const { getItems } = await import(\`\${process.env.HOME}/.claude/memory/context.js\`);
  console.log(getItems('myproject'));
"
```

Or run `/check-context` which queries the DB and displays counts + recent items.
