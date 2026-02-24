# /simplify — Post-Implementation Cleanup

Run this **after** implementation is complete to simplify and clean up.

## What It Does

Invokes the `code-simplifier` agent (plugin) on recently modified files to:
- Remove unnecessary complexity and over-engineering
- Consolidate duplicate logic
- Improve naming and readability
- Reduce nesting depth

## Instructions

1. Identify files modified in this session (check git diff)
2. For each modified file, apply simplification:
   - Remove dead code and unused variables
   - Flatten unnecessary nesting (> 3 levels)
   - Consolidate repeated patterns into shared helpers only if used 3+ times
   - Ensure functions stay under 50 lines
3. Run TypeScript check after: `bun tsc --noEmit`
4. Report what was simplified

## Usage

```
/simplify
```

Run after `/plan` + implementation, before `/verify`.

## Boris Workflow Position

```
Plan → Implement → /simplify → /verify → /commit-push-pr
```
