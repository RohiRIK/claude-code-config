# Workflow Guide

Quick reference for picking the right path. Full detail: `docs/workflow-daily.md` · `docs/workflow-dev.md`

## Claude Behavior Rule

After completing any workflow step, always end your response with:

> **Next step:** `/<command>` — one-line description of what it does

If the current step was the last one, say:
> **Done.** Workflow complete.

Never skip this. It keeps the user oriented without them having to remember the chain.

---

## Which path?

| Situation | Path |
|-----------|------|
| Trivial one-liner | Just implement — no commands needed |
| Bug fix | `/test` (ProveIt) → `/simplify` → `/capture` → `/commit-push-pr` |
| Small feature (clear scope) | `/plan` → `/build` → `/simplify` → `/capture` → `/commit-push-pr` |
| Non-trivial feature | `/spec` → `/plan` → `/dev` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |

---

## Path A — Bug Fix

```
/test  →  /simplify  →  /capture  →  /commit-push-pr
```

- `/test` routes to **ProveIt**: write a failing test that proves the bug → fix → pass
- Skip `/spec` and `/plan` — bug defines the scope

---

## Path B — Small Feature

```
/plan  →  /build  →  /simplify  →  /capture  →  /commit-push-pr
```

- `/plan` — enter Plan Mode, confirm before any code
- `/build` — task by task: TDD → compile gate → commit
- Use this when scope is clear and you want manual control between tasks

---

## Path C — Non-trivial Feature

```
/spec  →  /plan  →  /dev  →  /simplify  →  /capture  →  /verify  →  /commit-push-pr
```

- `/spec` — recalls LTM + explores codebase → writes grounded spec with testable criteria
- `/plan` — each task maps to one acceptance criterion from the spec
- `/dev` — fully automated: runs all build tasks + final regression sweep
- Use `/dev` for end-to-end automation, `/build` if you want manual task control

---

## Every Path Ends The Same Way

| Step | Command | What it does |
|------|---------|-------------|
| Remove complexity | `/simplify` | code-simplifier agent — flattens nesting, removes abstraction |
| Lock in context | `/capture` | saves progress + fires `/learn` in one shot |
| Gate before ship | `/verify` | tsc → lint → tests → build → security → diff |
| Ship | `/commit-push-pr` | conventional commit → push → PR |

> `/verify` is optional on small changes but mandatory before non-trivial PRs.

---

## /build vs /dev vs /test

| Command | When |
|---------|------|
| `/build` | Manual control — review between each task |
| `/dev` | Full automation — all tasks in one go |
| `/test` | No plan — standalone bug fix or isolated feature |
