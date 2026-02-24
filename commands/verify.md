# /verify — Self-Check Loop

Run this to verify implementation correctness before committing.

## What It Does

Gives Claude a concrete verification loop — the single biggest quality multiplier per Boris Cherny.

## Instructions

Execute these checks in order, stop and fix on first failure:

1. **Type check**: `bun tsc --noEmit 2>&1 | head -50`
2. **Lint**: `bun run lint 2>&1 | head -50` (if configured)
3. **Tests**: `bun test 2>&1 | tail -30` (or `bun run test`)
4. **Build**: `bun run build 2>&1 | tail -20` (if applicable)

For each failure:
- Read the error
- Fix the root cause (not the symptom)
- Re-run that check
- Continue to next check only when passing

Report final status:
```
✅ tsc — clean
✅ tests — X passed
✅ build — success
```

Or:
```
❌ tsc — N errors (fixed)
✅ tests — X passed
```

## Usage

```
/verify
```

Run after `/simplify`, before `/commit-push-pr`.

## Boris Workflow Position

```
Plan → Implement → /simplify → /verify → /commit-push-pr
```
