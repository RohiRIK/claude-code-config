# Session Context Persistence

## Overview

Claude maintains per-project context files so work is never lost across sessions or compactions.
Files live at: `~/.claude/projects/<slug>/` where slug = cwd with `/` replaced by `-`.

Example: working in `/Users/roh/projects/myapp` → slug is `-Users-roh-projects-myapp`

## The 4 Context Files (YOU maintain these)

| File | Contains | When to update |
|------|----------|---------------|
| `context-goals.md` | Current goal (1-3 lines max) | When goal is set or changes |
| `context-decisions.md` | Architectural/key decisions | Append after any significant decision |
| `context-progress.md` | Completed + in-progress tasks | Append `✓ item` after each task done |
| `context-gotchas.md` | Warnings, blockers, pitfalls | Append whenever you find a gotcha |

## CRITICAL: Write Progress After Every Task

After completing ANY task (fix, feature, refactor, decision), IMMEDIATELY write to the context file:

```
~/.claude/projects/<slug>/context-progress.md  → ✓ <what was done, 1 line>
```

Do NOT wait until end of session. Do NOT skip this. Examples:
- `✓ Fixed duplicate append bug in UpdateContext hook`
- `✓ Added session_id dedup to context-progress entries`
- `✓ Rewrote README with full workflow diagram`

If you just completed something and haven't written it — write it NOW before continuing.

## Rules (MANDATORY)

### On session start
- If context was injected (you'll see "Restored Project Context"), acknowledge it briefly
- Say what was in progress and confirm you're ready to continue

### After completing any significant task
Update the relevant file immediately using the Write or Edit tool:
```
~/.claude/projects/<slug>/context-progress.md  → append: ✓ <what was done>
~/.claude/projects/<slug>/context-decisions.md → append: - <decision made and why>
~/.claude/projects/<slug>/context-gotchas.md   → append: ⚠ <warning or blocker>
~/.claude/projects/<slug>/context-goals.md     → rewrite when goal changes
```

### When context window is getting large (Option A)
Proactively update all 4 files before continuing with heavy work:
- Ensure context-goals.md reflects current state
- Flush any pending progress items to context-progress.md
- Write any decisions made so far to context-decisions.md
- Do this BEFORE context compaction hits, not after

### File format rules
- Bullet points only, no prose
- Each line max 100 chars
- `context-goals.md` max 5 lines
- `context-gotchas.md` and `context-decisions.md` are permanent — never delete entries
- `context-progress.md` will be auto-trimmed to last 20 items by the Cleanup hook

## What PreCompact does (Option B)
When compaction fires, the PreCompact hook automatically:
1. Reads all 4 files
2. Assembles `context-summary.md` (max 60 lines)
3. This summary is what gets injected at the next SessionStart

You do not need to manage `context-summary.md` — the hook handles it.

## Example context-progress.md
```
✓ Set up Next.js project with TypeScript
✓ Configured Supabase auth
✓ Built login/signup pages
→ Working on: JWT refresh token logic
```

## Example context-decisions.md
```
- Using Supabase for auth (not NextAuth) — simpler for this use case
- JWT: 15min access / 7 day refresh tokens
- Store refresh token in httpOnly cookie, not localStorage
```

## Example context-gotchas.md
```
⚠ Must invalidate refresh tokens on password change
⚠ Supabase RLS must be enabled before going to production
⚠ Next.js middleware runs on edge — no Node.js APIs
```
