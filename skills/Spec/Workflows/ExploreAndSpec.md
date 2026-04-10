# ExploreAndSpec

Ground the spec in existing code and prior decisions before writing a single requirement.

## Step 1: Recall from LTM

Call `ltm_recall` using the feature topic as the query. Surface:
- Prior architecture decisions related to this area
- Known gotchas and constraints
- Patterns already established in this project

Record any relevant findings — they become constraints in the spec.

## Step 2: Explore the codebase

Spawn an `Explore` agent scoped to the relevant area. Find:
- Existing files and modules related to the feature
- Types and interfaces that the new code must conform to
- Existing tests that define current expected behavior
- Patterns used nearby (naming, error handling, data flow)

The goal is to understand what already exists so the spec doesn't contradict or duplicate it.

## Step 3: Write the spec

Write the spec to `specs/<feature-slug>.md`. Include:

### What
One paragraph — what is being built and why.

### Existing context
- Relevant files found in Step 2
- Prior decisions or constraints from Step 1 (LTM)

### Acceptance criteria
Numbered list. Each criterion must be testable — it becomes a task in `/plan` and a test case in `/build`.

Example format:
```
1. Given X, when Y, then Z
2. Edge case: when A is empty, return B
3. Existing behaviour C is unchanged
```

### Out of scope
Anything explicitly NOT being built in this iteration.

## Step 4: Hand off

- Feature work → run `/plan` against the spec
- Bug fix → run `/test` (ProveIt) using the acceptance criteria as the failing test target
