# TddWorkflow

**Skill:** Test-Driven Development orchestration.

**Description:** Test-Driven Development orchestration.

---

## Overview

The TddWorkflow skill orchestrates the Red-Green-Refactor TDD cycle.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "Start TDD" | RedGreenRefactor |
| "Implement feature" | RedGreenRefactor |
| "Fix bug" | RedGreenRefactor |

Run: `Run the RedGreenRefactor workflow`

## TDD Cycle

### 1. RED - Write Failing Test
Write test that describes desired behavior.

### 2. GREEN - Make Test Pass
Write minimal code to pass the test.

### 3. REFACTOR - Improve
Clean up code while keeping tests passing.

## Voice Notification

When executing:
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running RedGreenRefactor from TddWorkflow"}'
```

## Related

- **See also:** [tdd-guide agent](../agents/tdd-guide.md), [FrontendDesign skill](frontend-design.md)

---

*Documentation generated from `skills/TddWorkflow/SKILL.md` - Last updated: 2026-02-25*
