---
description: "Run TDD for a new feature or fix a bug with the Prove-It pattern."
---

# Test

Invoke the `TestWorkflow` skill. Routes automatically based on context:

- **New feature or function** → `FeatureTdd` workflow (RED → GREEN → REFACTOR)
- **Bug fix** → `ProveIt` workflow (failing test first, then fix)

## Arguments

Describe what you're testing: `/test the login flow times out after 30s`

Claude determines whether this is a new feature or a bug fix and selects the right workflow.

## Standalone

`/test` operates without a plan. Use `/build` when working from a plan with multiple tasks.
