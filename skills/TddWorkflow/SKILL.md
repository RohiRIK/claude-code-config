---
name: TddWorkflow
description: Test-Driven Development orchestration.
---

# TddWorkflow

Orchestrate the Red-Green-Refactor cycle.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/TddWorkflow/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the TddWorkflow skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **TddWorkflow** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger | 
| :--- | :--- | :--- |
| **RedGreenRefactor** | Execute TDD cycle. | `Start TDD`, `Implement feature`, `Fix bug` |

Run a workflow by name:
`Run the RedGreenRefactor workflow`

*(See `Context-TDD.md` for principles)*