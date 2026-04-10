---
description: "Full dev cycle — build all plan tasks then run final test verification."
---

# Dev

Chains `/build` and `/test` in sequence for end-to-end automation.

## Steps

1. Run `BuildWorkflow:IncrementalBuild` loop — implement all pending plan tasks (TDD per task, compile gate, commit per task)
2. On loop complete → run `TestWorkflow:FeatureTdd` as a final regression sweep across all changed files
3. Report: tasks completed, commits made, tests passed, coverage

## When to use

| Command | When |
|---------|------|
| `/dev` | Multiple plan tasks, want full automation end-to-end |
| `/build` | Working task by task with manual control between tasks |
| `/test` | Standalone testing or bug fix with no plan involved |
