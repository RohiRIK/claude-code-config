---
description: "Define what to build — explores codebase and recalls LTM before writing acceptance criteria."
argument-hint: [feature or bug description]
---

# Spec

Invoke the `SpecWorkflow:ExploreAndSpec` skill.

## What happens

1. `ltm_recall` on the topic — surfaces prior decisions, gotchas, and architecture patterns
2. Explore relevant codebase areas — finds existing files, types, and patterns to conform to
3. Write spec to `specs/<feature-slug>.md` with grounded acceptance criteria

## Arguments

Describe the feature or bug: `/spec add rate limiting to the auth endpoints`

## Hand off

- After `/spec` → run `/plan` (feature) or `/test` (bug fix)
- The acceptance criteria in the spec become plan tasks and test cases

## Why spec first

Planning against an unexplored codebase produces tasks that fight existing patterns. Speccing first ensures the plan is grounded in what's already there and what LTM already knows.
