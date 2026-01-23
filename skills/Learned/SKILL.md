---
name: Learned
description: Retrieval system for learned patterns and lessons.
---

# Learned Skills & Patterns

Access the knowledge base of learned patterns.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Learned/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the Learned skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **Learned** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- | :--- | :--- |
| **Recall** | Retrieve learned patterns. | `Recall pattern`, `How did we do X?`, `Learned lessons` |

Run a workflow by name:
`Run the Recall workflow`

*(See `Context-ClaudeHooks.md` for specific examples)*