# IncrementalBuild

Implement each plan task with TDD, compile gate, and a commit before moving on.

## Prerequisites

A plan must exist with at least one pending task. Each task should have acceptance criteria.

## Per-Task Loop

Repeat these steps for each pending task until all are complete:

### Step 1: Pick the next task

Read the next pending task from the plan. Load its acceptance criteria — these define what "done" means for this task.

### Step 2: Load context

Read the relevant existing code, types, and patterns used nearby. Understand the shape of the change before writing anything.

### Step 3: TDD — RED → GREEN → REFACTOR

Run `TddWorkflow:RedGreenRefactor` scoped to this task's acceptance criteria:
- Write a failing test that captures the acceptance criteria (RED)
- Write the minimum implementation to pass it (GREEN)
- Refactor while keeping tests green (REFACTOR)

### Step 4: Compile gate

Run `bunx tsc --noEmit` (or `bun run build` if the project has a build script).

This catches type errors before they land in a commit. If compile fails, invoke `/build-fix` then retry this step.

### Step 5: Regression sweep

Run `bun test` across all files. If any existing test breaks, stop and report which test failed and why — do not commit until regressions are resolved.

### Step 6: Commit

Commit with a conventional message that references the task title:

```
feat: <task title>
```

### Step 7: Advance

Mark the task complete. Move to the next pending task. Repeat from Step 1.

## Exit

All tasks marked complete. Report: tasks completed, commits made, final test status.
