# /simplify — Post-Implementation Cleanup

Run this **after** implementation is complete to simplify and clean up.

Invoke the `code-simplifier` agent on recently modified files (or pass specific files/dirs as arguments).

The agent runs 3 phases: static dead-code analysis → micro-simplification → verification (tsc + bun test).

$ARGUMENTS

## Boris Workflow Position

```
/plan → implement → /capture → /simplify → /verify → /commit-push-pr
```

## When to reach for other agents instead

| Situation | Use |
|-----------|-----|
| Repo-wide dead code | `refactor-cleaner` |
| Security issues found | `security-reviewer` |
| Final quality gate | `code-reviewer` |
