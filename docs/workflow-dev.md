# Layer 2 — Dev Workflow

The plan-aware build loop. Spec first, build in slices, gate on tests.

---

## Flow

```
  ┌─────────┐   ┌─────────┐
  │  /spec  │──▶│  /plan  │
  └─────────┘   └────┬────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
  [Single task / manual]  [Full automation]
     ┌─────────┐             ┌───────┐
     │ /build  │             │ /dev  │
     │per-task │             │ loop  │
     │TDD+build│             │+sweep │
     │+commit  │             └───┬───┘
     └────┬────┘                 │
          └──────────┬───────────┘
                     │
                     ▼
               ┌───────────┐   ◀── Bug fix? Enter here
               │   /test   │       (Prove-It: failing
               │FeatureTdd │        test first, then fix)
               │ or ProveIt│
               └─────┬─────┘
                     │
               ┌─────▼─────┐
               │ /simplify │
               └─────┬─────┘
                     │
               ┌─────▼─────┐
               │ /capture  │
               └─────┬─────┘
                     │
               ┌─────▼──────────┐
               │/commit-push-pr │
               └────────────────┘
```

---

## Step by Step

### `/spec` — Define Before Planning

Invoke the `Spec` skill. Before writing a single requirement, it:

1. Calls `ltm_recall` on the topic — surfaces prior architecture decisions, gotchas, and patterns for this project
2. Spawns an `Explore` agent scoped to the relevant codebase area — finds existing files, types, and patterns the new code must conform to
3. Writes a grounded spec to `specs/<feature-slug>.md` with testable acceptance criteria

The acceptance criteria become plan tasks and test cases. Skip `/spec` only for trivial one-liners.

### `/plan` — Task Breakdown

Enter Plan Mode. Each task in the plan maps directly to one acceptance criterion from the spec. Refine until solid, then confirm. Claude does not touch code until you say "yes".

### `/build` — Incremental Build (manual, task by task)

Invoke the `Build` skill. For each pending task in the plan:

1. Read the task's acceptance criteria
2. Run `TddWorkflow:RedGreenRefactor` — write failing test, implement, refactor
3. Run `bunx tsc --noEmit` — compile gate (catches type errors before committing)
4. Run `bun test` — regression sweep across all files
5. Commit with a conventional message referencing the task
6. Mark task complete, advance to next

On compile failure → `/build-fix`, then retry. On regression → stop and report.

### `/dev` — Full Automation (all tasks + sweep)

Invoke the `Build` skill in loop mode, then `Test:FeatureTdd` as a final sweep.

1. Runs the `/build` loop until all plan tasks are complete
2. Runs a final `bun test` regression sweep across all changed files
3. Reports: tasks completed, commits made, tests passed, coverage

Use `/dev` when you want end-to-end automation. Use `/build` when you want manual control between tasks.

### `/test` — Standalone TDD or Bug Fix

Invoke the `Test` skill. Routes automatically:

**New feature** → `FeatureTdd` workflow:
- Write failing tests (RED) → implement (GREEN) → refactor → regression sweep → coverage check (80% min)

**Bug fix** → `ProveIt` workflow:
- Write a test that reproduces the bug (must FAIL — proves the bug exists)
- Confirm it fails for the right reason
- Implement the fix → confirm test passes → regression sweep

`/test` operates without a plan. Use it standalone for bug fixes or isolated feature work.

### `/simplify` — Remove Complexity

Run after implementation. Invokes the `code-simplifier` agent to review changed code for unnecessary abstraction, deep nesting, and premature generalization, then fixes what it finds.

### `/capture` — Save Context + Learn

Run after implementation and simplify. Snapshots what just happened — saves session context and fires `/learn` in one step. Locks in both progress and any patterns discovered during the build.

### `/commit-push-pr` — Ship It

Pre-computes the full git context (log, diff, branch), writes a conventional commit message, pushes, and opens a PR with a summary and test plan.

---

## When to Use /build vs /dev vs /test

| Command | When |
|---------|------|
| `/build` | Working task by task — want manual control and review between tasks |
| `/dev` | Multiple plan tasks — want full end-to-end automation |
| `/test` | Standalone: bug fix (ProveIt) or feature with no plan (FeatureTdd) |

---

## Skills Invoked

| Command | Skill | Workflow |
|---------|-------|---------|
| `/spec` | `Spec` | `Workflows/ExploreAndSpec.md` |
| `/build` | `Build` | `Workflows/IncrementalBuild.md` |
| `/dev` | `Build` + `Test` | `IncrementalBuild.md` → `FeatureTdd.md` |
| `/test` (feature) | `Test` | `Workflows/FeatureTdd.md` |
| `/test` (bug) | `Test` | `Workflows/ProveIt.md` |

Skills are not user-invocable — they are triggered by the commands above, not typed directly.

---

## Relation to Daily Workflow

This workflow sits inside the daily loop defined in [`workflow-daily.md`](workflow-daily.md). It replaces the freeform "IMPLEMENT" step with structured slices: spec → plan → build in gated increments → test → simplify → capture. The surrounding loop (`/verify`, `/commit-push-pr`, hooks) is unchanged — the dev workflow plugs into it between plan confirmation and the final ship step.
