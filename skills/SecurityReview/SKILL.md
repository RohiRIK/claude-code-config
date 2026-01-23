---
name: SecurityReview
description: Security auditing, checklist validation, and vulnerability scanning.
---

# SecurityReview

Security auditing and best practices enforcement.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/SecurityReview/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the SecurityReview skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **SecurityReview** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- |
| :--- | :--- |
| **AuditCode** | Perform security audit on code. | `Audit security`, `Check for vulnerabilities`, `Security review` |

Run a workflow by name:
`Run the AuditCode workflow`

*(See `Context-Security.md` for the full checklist)*