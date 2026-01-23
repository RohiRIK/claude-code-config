---
name: CodingStandards
description: Enforce universal coding standards and best practices.
---

# CodingStandards

Universal coding standards for TypeScript, React, and Node.js.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/CodingStandards/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the CodingStandards skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **CodingStandards** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- | :--- | :--- |
| **CheckStandards** | Check code against defined standards. | `Check coding standards`, `Validate style`, `Lint code` |

Run a workflow by name:
`Run the CheckStandards workflow`

*(See `Context-Rules.md` for the full ruleset)*