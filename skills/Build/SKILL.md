---
name: Build
description: "USE WHEN implementing plan tasks incrementally with compile and commit gates."
user-invocable: false
---

# Build

Implement plan tasks one at a time: TDD per task, compile gate, commit, repeat.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **IncrementalBuild** | "implement plan", "next task", "build", "work through tasks" | `Workflows/IncrementalBuild.md` |

## Examples

**Example 1: Working through a plan**
```
User: "/build"
→ Invokes IncrementalBuild workflow
→ Picks first pending task from plan
→ TDD → compile → commit → next task
```

**Example 2: Single task from plan**
```
User: "/build implement the auth middleware task"
→ Invokes IncrementalBuild workflow
→ Targets the named task
→ TDD → compile gate → commit
```

*(Invokes TddWorkflow:RedGreenRefactor per task — does not duplicate TDD logic)*
