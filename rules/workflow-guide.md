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

**Do you know exactly what to build?** → Layer 2 (`/spec`)
**Figuring it out or moving fast?** → Layer 1 (`/plan`)

| Situation | Layer |
|-----------|-------|
| Trivial one-liner | Just implement — no commands needed |
| Bug fix | Layer 1: `/test` (ProveIt) → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |
| Small feature (clear scope) | Layer 1: `/plan` → `/build` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |
| Non-trivial feature | Layer 2: `/spec` → `/plan` → `/dev` → `/test` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |

---

## Layer 1 — Daily Workflow

Entry: `/plan`. You have a task and want to move.

```
[observe auto-fires] → /plan → IMPLEMENT (auto-accept: Shift+Tab×2) → /capture → /simplify → /verify → /commit-push-pr
```

- `[observe]` is automatic — PrePlan hook fires when `/plan` is typed, injecting git state + topic-scoped LTM recalls
- After `/plan` confirms → switch to **auto-accept mode** (Shift+Tab×2) for implementation
- `/test` replaces the whole chain for bug fixes (ProveIt: write failing test → fix → pass)

---

## Layer 2 — Dev Workflow

Entry: `/spec` (or `/test` for bugs). You know what to build and want it spec-driven.

```
/spec → /plan → /build (or /dev) → /test → /simplify → /capture → /verify → /commit-push-pr
```

- `/spec` — recalls LTM + explores codebase → writes grounded spec with testable criteria
- `/plan` — each task maps to one acceptance criterion from the spec
- `/build` = task-by-task manual control · `/dev` = full automation
- `/test` — final regression sweep across all changed files

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
