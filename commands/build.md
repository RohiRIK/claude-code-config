---
description: "Implement the next plan task incrementally — TDD per task, compile gate, commit."
---

# Build

Invoke the `BuildWorkflow:IncrementalBuild` skill.

## Prerequisite

A plan must exist with at least one pending task. Run `/plan` first if none exists.

## What happens

For each pending task: TDD cycle → compile gate → regression sweep → commit → advance to next task.

## Arguments

Pass a task name to target a specific task: `/build implement the rate limiter`

Otherwise, starts from the first pending task in the plan.
