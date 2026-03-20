---
name: Simplify
description: Post-implementation cleanup skill. Invokes the code-simplifier agent for 3-phase cleanup: static dead-code analysis, micro-simplification, and verification. USE WHEN running /simplify after implementation.
disable-model-invocation: true
---

# Simplify

Invoke the `code-simplifier` agent on files changed in this session.

## Three Phases

| Phase | What happens |
|-------|-------------|
| 1. Static Analysis | Dead code, unused imports, type baseline |
| 2. Simplification | Nesting, naming, TS idioms, constants |
| 3. Verification | `bun tsc --noEmit` + `bun test` |

## Scope Rules

- Default: files in `git diff --name-only HEAD`
- With argument: specific file or directory passed to `/simplify`
- Never touch files outside the session diff without an explicit argument

## Agent Boundaries

| Need | Agent |
|------|-------|
| Post-implementation cleanup | `code-simplifier` (this) |
| Repo-wide dead code | `refactor-cleaner` |
| Security audit | `security-reviewer` |
| Final quality gate | `code-reviewer` |

## Workflow Position

```
/plan → implement → /capture → /simplify → /verify → /commit-push-pr
```
