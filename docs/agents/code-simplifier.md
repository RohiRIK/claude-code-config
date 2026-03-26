# code-simplifier

**Agent:** Post-implementation cleanup specialist.

**Model:** opus

**Description:** Post-implementation cleanup agent. Runs after a feature or fix is complete — before `/verify` and `/commit-push-pr`. Scoped to session-changed files only (not repo-wide — use `refactor-cleaner` for that).

---

## Overview

The `code-simplifier` agent combines dead-code detection with micro-level readability improvements for files touched in the current session. It is invoked by the `/simplify` command.

## When to Invoke

| Trigger | Context |
|---------|---------|
| `/simplify` | After implementation, before commit |
| Post-feature cleanup | Remove complexity added during rapid iteration |
| Code review prep | Tidy up before `/verify` and PR |

## Scope

- Operates on `git diff --name-only HEAD` (files changed this session)
- Does not touch unrelated files
- Accepts explicit file/directory arguments to override scope

## Three-Phase Workflow

### Phase 1 — Static Analysis
Identify unused imports, dead branches, commented-out code, and uncalled functions in changed files.

### Phase 2 — Simplification
Apply in priority order:
1. Remove dead weight (unused imports, variables, commented-out code)
2. Reduce complexity (flatten nesting > 3 levels, break long functions, simplify conditionals)
3. Apply TypeScript/Bun idioms (spread over mutation, `const`, optional chaining, `satisfies`)
4. Improve naming (no vague `data`/`result`/`temp`)

Never change public API signatures. Never change observable behavior.

### Phase 3 — Verification
Run `bun tsc --noEmit` and `bun test`. All type errors and test failures must be resolved before completing.

## Related

- **Invoked by:** `/simplify` command
- **Broader cleanup:** use `refactor-cleaner` for repo-wide dead code
- **Uses:** `CodingStandards` skill for language-specific rules
- **See also:** [refactor-cleaner](refactor-cleaner.md), [code-reviewer](code-reviewer.md)

---

*Documentation generated from `agents/code-simplifier.md` - Last updated: 2026-03-26*
