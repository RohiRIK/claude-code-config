---
description: "USE WHEN discovering a new insight or pattern worth preserving."
argument-hint: "[insight] --category [preference|architecture|gotcha|pattern|workflow|constraint]"
---

# /learn - Extract Reusable Patterns

Analyze the current session and store any patterns worth saving as long-term memories.

## Trigger

Run `/learn` at any point during a session when you've solved a non-trivial problem.

## What to Extract

Look for:

1. **Error Resolution Patterns** — root cause, fix, reusability
2. **Debugging Techniques** — non-obvious steps, tool combinations
3. **Workarounds** — library quirks, API limitations, version-specific fixes
4. **Project-Specific Patterns** — conventions, architecture decisions, integration patterns
5. **Preferences** — user workflow preferences, tooling choices confirmed across sessions

## Process

1. Review the session for extractable insights
2. For each insight, classify:
   - `category`: `preference | architecture | gotcha | pattern | workflow | constraint`
   - `importance`: 1–5 (5 = always inject, 1 = low value)
   - `project_scope`: project name if project-specific, omit for global
   - `tags`: relevant keywords
3. Call `learn()` from `~/.claude/memory/db.ts`:
   ```typescript
   import { learn } from "~/.claude/memory/db.js";
   const result = learn({
     content: "bun is always preferred over npm/yarn/npx in this config",
     category: "preference",
     importance: 5,
     tags: ["bun", "package-manager"],
   });
   // result.action = "created" | "reinforced"
   // result.id = memory ID for linking relations
   ```
4. Optionally link relations between related memories:
   ```typescript
   import { relate } from "~/.claude/memory/db.js";
   relate({ source_id: 3, target_id: 7, relationship_type: "supports" });
   ```
5. Report: `Memory ${result.action}: [${result.id}] "${content}" (confirmed ${result.confirm_count}x)`

## Dedup Safety

Calling `learn()` with the same content twice is safe — the second call returns `action: "reinforced"`
and increments `confirm_count`. No confirmation step needed.

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Importance 5 = injected at every SessionStart (globals only)
- Importance 4–3 = injected for project sessions
- Importance 1–2 = available via `/recall` only
