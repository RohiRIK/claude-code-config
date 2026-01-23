---
name: BackendDesign
description: Backend architecture patterns, API design, database optimization, and server-side best practices.
---

# BackendDesign

Backend architecture patterns and best practices for scalable server-side applications.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/BackendDesign/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the BackendDesign skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **BackendDesign** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- | :--- | :--- |
| **ApplyPatterns** | Apply backend design patterns to the codebase. | `Apply patterns`, `Use backend pattern`, `Refactor backend` |

Run a workflow by name:
`Run the ApplyPatterns workflow`